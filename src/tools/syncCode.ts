import { join } from 'path';
import { readFileSync, existsSync, statSync } from 'fs';
import { glob } from 'glob';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SyncCodeSchema, type CodeChunk } from '../types/memory-v5.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { chunkFile } from '../utils/codeChunking.js';
import { generateCodeEmbeddings } from '../embeddings/codeEmbeddings.js';
import { logger } from '../utils/logger.js';
import type { Collection } from 'mongodb';

export async function syncCodeTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = SyncCodeSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Memory Engineering not initialized. Run memory_engineering_init first.',
          },
        ],
      };
    }

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const memoryCollection = getMemoryCollection();
    const codeCollection = getDb().collection<CodeChunk>('memory_engineering_code');

    // Get or create codebaseMap memory
    let codebaseMap = await memoryCollection.findOne({
      projectId: config.projectId,
      memoryName: 'codebaseMap'
    });

    if (!codebaseMap) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ codebaseMap memory not found.

Create it first with:
memory_engineering_update --memoryName "codebaseMap" --content "# Codebase Map

## Directory Structure
\`\`\`
[your project structure]
\`\`\`

## Key Files
- Important files and their purposes
"`,
          },
        ],
      };
    }

    // Create indexes for code collection if needed
    await ensureCodeIndexes(codeCollection);

    // Find all code files matching patterns
    const files = await glob(params.patterns, {
      cwd: projectPath,
      absolute: true,
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        ...(params.includeTests ? [] : ['**/*.test.*', '**/*.spec.*'])
      ]
    });

    logger.info(`Found ${files.length} code files to process`);

    // Process files with progress tracking
    let totalChunks = 0;
    let processedFiles = 0;
    let skippedFiles = 0;
    // Language tracking removed to fix Voyage AI issues
    const patternStats = new Map<string, number>();
    const errors: string[] = [];

    // Progress tracking
    const startTime = Date.now();
    let lastProgressReport = 0;

    // Process in batches to avoid memory issues
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const batchChunks: CodeChunk[] = [];

      // Progress reporting every 10 batches or 30 seconds
      const currentTime = Date.now();
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(files.length / BATCH_SIZE);

      if (batchNumber % 10 === 0 || currentTime - lastProgressReport > 30000) {
        const elapsed = Math.round((currentTime - startTime) / 1000);
        const progress = Math.round((i / files.length) * 100);
        logger.info(`📊 Progress: ${progress}% (batch ${batchNumber}/${totalBatches}, ${processedFiles + skippedFiles}/${files.length} files, ${totalChunks} chunks, ${elapsed}s elapsed)`);
        lastProgressReport = currentTime;
      }
      
      for (const file of batch) {
        try {
          const stats = statSync(file);
          const lastModified = stats.mtime;
          
          // Check if file needs updating
          if (!params.forceRegenerate) {
            const existingChunks = await codeCollection.findOne({
              filePath: file,
              lastModified: { $gte: lastModified }
            });
            
            if (existingChunks) {
              skippedFiles++;
              continue;
            }
          }
          
          // Remove old chunks for this file
          await codeCollection.deleteMany({ filePath: file });
          
          // Chunk the file
          const chunks = await chunkFile(file, config.projectId, codebaseMap._id.toString());
          
          // Filter by minimum size
          const validChunks = chunks.filter(c => c.metadata.size >= params.minChunkSize);
          
          if (validChunks.length > 0) {
            // Language tracking removed to fix Voyage AI issues
            
            // Track pattern stats
            for (const chunk of validChunks) {
              for (const pattern of chunk.metadata.patterns) {
                patternStats.set(pattern, (patternStats.get(pattern) || 0) + 1);
              }
            }
            
            batchChunks.push(...validChunks as any);
            processedFiles++;
          }
          
        } catch (error) {
          logger.error(`Failed to process ${file}:`, error);
          errors.push(`${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Generate embeddings for this batch
      if (batchChunks.length > 0) {
        try {
          logger.info(`🔄 Generating embeddings for ${batchChunks.length} chunks from ${batch.length} files`);

          // Generate contextualized embeddings
          const embeddings = await generateCodeEmbeddings(batchChunks);

          logger.info(`✅ Generated ${embeddings.length} embeddings for ${batchChunks.length} chunks`);

          // Debug: Check if embeddings are actually valid
          const validEmbeddingCount = embeddings.filter(e => e && e.length > 0).length;
          const emptyEmbeddingCount = embeddings.filter(e => !e || e.length === 0).length;
          logger.info(`📊 Embedding validation: ${validEmbeddingCount} valid, ${emptyEmbeddingCount} empty`);

          // Add embeddings and timestamps to chunks
          logger.info(`🔄 Processing ${batchChunks.length} chunks with ${embeddings.length} embeddings`);

          const chunksWithEmbeddings = batchChunks
            .map((chunk, idx) => {
              const embedding = embeddings[idx];
              if (!embedding || embedding.length === 0) {
                logger.error(`❌ Missing or empty embedding for chunk ${idx}: ${chunk.chunk.name || 'unnamed'} (embedding: ${embedding ? 'empty array' : 'undefined'})`);
                return null;
              }
              logger.debug(`✅ Valid embedding for chunk ${idx}: ${chunk.chunk.name || 'unnamed'} (${embedding.length} dimensions)`);
              return {
                ...chunk,
                contentVector: embedding,
                createdAt: new Date(),
                updatedAt: new Date()
              };
            })
            .filter((chunk): chunk is CodeChunk & { contentVector: number[] } =>
              chunk !== null && chunk.contentVector !== undefined && chunk.contentVector.length > 0
            );

          logger.info(`📊 Result: ${chunksWithEmbeddings.length} chunks have valid embeddings out of ${batchChunks.length} processed`);

          // Insert into database
          if (chunksWithEmbeddings.length > 0) {
            logger.info(`💾 Attempting to insert ${chunksWithEmbeddings.length} chunks into database...`);
            try {
              const result = await codeCollection.insertMany(chunksWithEmbeddings);
              logger.info(`✅ Successfully inserted ${result.insertedCount} chunks into database`);
            } catch (dbError) {
              logger.error(`❌ Database insertion failed:`, dbError);
              throw dbError;
            }
          } else {
            logger.error(`❌ No chunks to insert - all embeddings were invalid!`);
          }
          totalChunks += chunksWithEmbeddings.length;
          
        } catch (error) {
          logger.error('Failed to generate embeddings:', error);
          errors.push(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Update codebaseMap with statistics
    const updatedContent = await updateCodebaseMapWithStats(
      codebaseMap.content,
      {
        totalFiles: processedFiles + skippedFiles,
        processedFiles,
        skippedFiles,
        totalChunks,
        // languages removed to fix Voyage AI issues
        patterns: Object.fromEntries(patternStats),
        lastSync: new Date().toISOString()
      }
    );

    await memoryCollection.updateOne(
      { _id: codebaseMap._id },
      {
        $set: {
          content: updatedContent,
          updatedAt: new Date(),
          'metadata.lastModified': new Date()
        }
      }
    );

    // Build response with timing information
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    let response = `🔄 Code Sync Complete (${totalTime}s)\n\n`;
    response += `Files processed: ${processedFiles}\n`;
    response += `Files skipped (up-to-date): ${skippedFiles}\n`;
    response += `Total chunks created: ${totalChunks}\n`;
    response += `Processing time: ${totalTime} seconds\n\n`;
    
    // Language stats removed to fix Voyage AI issues
    
    if (patternStats.size > 0) {
      response += `## Detected Patterns\n`;
      for (const [pattern, count] of patternStats) {
        response += `- ${pattern}: ${count} occurrences\n`;
      }
      response += '\n';
    }
    
    if (errors.length > 0) {
      response += `## Errors (${errors.length})\n`;
      response += errors.slice(0, 5).join('\n');
      if (errors.length > 5) {
        response += `\n... and ${errors.length - 5} more`;
      }
    }
    
    response += `\n## Next Steps\n`;
    response += `You can now search code with:\n`;
    response += `- memory_engineering_search --query "authenticate user" --codeSearch "similar"\n`;
    response += `- memory_engineering_search --query "Repository pattern" --codeSearch "implements"\n`;
    response += `- memory_engineering_search --query "generateEmbedding" --codeSearch "uses"`;

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };

  } catch (error) {
    logger.error('Sync code tool error:', error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Code sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
}

async function ensureCodeIndexes(collection: Collection<CodeChunk>): Promise<void> {
  // Get existing indexes to avoid conflicts
  const existingIndexes = await collection.listIndexes().toArray();
  
  const indexesToCreate = [
    { keys: { projectId: 1, filePath: 1 }, name: 'project_file' },
    { keys: { projectId: 1, 'chunk.type': 1 }, name: 'project_chunk_type' },
    { keys: { projectId: 1, 'metadata.patterns': 1 }, name: 'project_patterns' },
    { keys: { projectId: 1, language: 1 }, name: 'project_language' },
    { keys: { projectId: 1, lastModified: -1 }, name: 'project_lastmodified' },
    { keys: { 'chunk.name': 'text', 'chunk.signature': 'text', searchableText: 'text' }, name: 'code_text' }
  ];
  
  for (const indexDef of indexesToCreate) {
    try {
      // Check if index with same keys already exists
      const keyString = JSON.stringify(indexDef.keys);
      const exists = existingIndexes.some(idx => JSON.stringify(idx.key) === keyString);
      
      if (!exists) {
        await collection.createIndex(indexDef.keys as any, { name: indexDef.name });
        logger.info(`Created code index: ${indexDef.name}`);
      } else {
        logger.info(`Code index already exists for keys: ${keyString}`);
      }
    } catch (error: any) {
      if (error.code === 85) {
        logger.info(`Index with same keys already exists, skipping: ${indexDef.name}`);
      } else {
        logger.error(`Failed to create index ${indexDef.name}:`, error);
        throw error;
      }
    }
  }
}

async function updateCodebaseMapWithStats(
  content: string,
  stats: {
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    totalChunks: number;
    // languages removed to fix Voyage AI issues
    patterns: Record<string, number>;
    lastSync: string;
  }
): Promise<string> {
  // Remove old stats section if exists
  const statsRegex = /## Code Embedding Statistics[\s\S]*?(?=##|$)/;
  let updatedContent = content.replace(statsRegex, '');
  
  // Add new stats section
  const statsSection = `## Code Embedding Statistics

Last Sync: ${stats.lastSync}
Total Files: ${stats.totalFiles}
Processed: ${stats.processedFiles}
Skipped: ${stats.skippedFiles}
Total Chunks: ${stats.totalChunks}

### File Types
(Language tracking temporarily disabled)

### Common Patterns
${Object.entries(stats.patterns)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([pattern, count]) => `- ${pattern}: ${count} occurrences`)
  .join('\n')}

`;
  
  return updatedContent.trim() + '\n\n' + statsSection;
}

// Export syncCode function for direct use (not through MCP)
export const syncCode = syncCodeTool;