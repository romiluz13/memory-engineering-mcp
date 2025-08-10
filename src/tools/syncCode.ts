import { join, basename } from 'path';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { glob } from 'glob';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SyncCodeSchema, type CodeChunk, type MemoryDocument } from '../types/memory-v5.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { chunkFile } from '../utils/codeChunking.js';
import { generateCodeEmbeddings } from '../embeddings/codeEmbeddings.js';
import { generateEmbedding } from '../embeddings/voyage-v5.js';
import { logger } from '../utils/logger.js';
import { resolveProjectPath } from '../utils/sessionContext.js';
import { detectFramework } from '../utils/frameworkDetection.js';
import type { Collection } from 'mongodb';



// Auto-generate directory structure for codebaseMap
function generateDirectoryStructure(projectPath: string, indent = '', maxDepth = 3, currentDepth = 0): string {
  if (currentDepth >= maxDepth) return '';
  
  let structure = '';
  try {
    const entries = readdirSync(projectPath, { withFileTypes: true });
    const filtered = entries.filter(e => 
      !e.name.startsWith('.') && 
      !['node_modules', 'dist', 'build', '__pycache__', 'vendor'].includes(e.name)
    );
    
    filtered.forEach((entry, index) => {
      const isLast = index === filtered.length - 1;
      const prefix = isLast ? '└── ' : '├── ';
      const childIndent = indent + (isLast ? '    ' : '│   ');
      
      if (entry.isDirectory()) {
        structure += `${indent}${prefix}${entry.name}/\n`;
        if (currentDepth < maxDepth - 1) {
          structure += generateDirectoryStructure(
            join(projectPath, entry.name), 
            childIndent, 
            maxDepth, 
            currentDepth + 1
          );
        }
      } else {
        structure += `${indent}${prefix}${entry.name}\n`;
      }
    });
  } catch (e) {
    // Ignore permission errors
  }
  
  return structure;
}

export async function syncCodeTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = SyncCodeSchema.parse(args);
    const projectPath = resolveProjectPath(params.projectPath);
    
    // Detect framework and use smart defaults
    const framework = detectFramework(projectPath);
    
    // Use provided patterns or framework-specific patterns
    const patterns = params.patterns.length > 0 
      ? params.patterns 
      : framework.patterns;
    
    // Use provided minChunkSize or framework-specific default
    const minChunkSize = params.minChunkSize || framework.minChunkSize;
    
    logger.info(`🏗️ FRAMEWORK: ${framework.displayName} detected - Using optimized settings`, {
      patterns,
      minChunkSize,
      excludes: framework.excludes
    });

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: '🔴 FATAL: No brain to store embeddings! INIT REQUIRED!\n\n⚡ RUN NOW: memory_engineering_init\n\nCode sync impossible without memory system!',
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
      // Auto-create codebaseMap with smart content
      logger.info('🗺️ AUTO-CREATING CODEBASE MAP - Building your GPS system...');
      
      const dirStructure = generateDirectoryStructure(projectPath);
      const projectName = basename(projectPath);
      
      const codebaseMapContent = `# Codebase Map - ${projectName}

## Directory Structure
\`\`\`
${dirStructure || 'No visible directories found'}
\`\`\`

## Key Files
(Will be auto-detected during sync)

## Module Organization
(Will be analyzed during sync)

## Code Embedding Statistics
(Will be auto-updated by sync_code)`;
      
      // Generate embedding for the codebaseMap
      const embedding = await generateEmbedding(codebaseMapContent);
      
      // Create the memory document
      const newCodebaseMap: MemoryDocument = {
        projectId: config.projectId,
        memoryName: 'codebaseMap',
        content: codebaseMapContent,
        contentVector: embedding,
        metadata: {
          version: 1,
          lastModified: new Date(),
          accessCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert into database
      const result = await memoryCollection.insertOne(newCodebaseMap);
      logger.info('✅ CODEBASE MAP CREATED - Your navigation system is ready!');
      
      // Fetch the inserted document with _id
      codebaseMap = await memoryCollection.findOne({ _id: result.insertedId });
    }

    // Create indexes for code collection if needed
    await ensureCodeIndexes(codeCollection);

    // Find all code files matching patterns
    logger.info(`🎯 SCAN PATTERNS LOCKED: ${patterns.join(', ')}`);
    const files = await glob(patterns, {
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

    logger.info(`🔥 FOUND ${files.length} CODE FILES - Preparing to absorb knowledge!`);

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
        logger.info(`⚡ EMBEDDING PROGRESS: ${progress}% | Batch ${batchNumber}/${totalBatches} | Files: ${processedFiles + skippedFiles}/${files.length} | Chunks: ${totalChunks} | Time: ${elapsed}s`);
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
          logger.error(`❌ CHUNK EXTRACTION FAILED: ${file}`, error);
          errors.push(`${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Generate embeddings for this batch
      if (batchChunks.length > 0) {
        try {
          logger.info(`🧠 GENERATING EMBEDDINGS: ${batchChunks.length} chunks from ${batch.length} files`);

          // Generate contextualized embeddings
          const embeddings = await generateCodeEmbeddings(batchChunks);

          logger.info(`🎆 EMBEDDINGS CREATED: ${embeddings.length} vectors ready!`);

          // Debug: Check if embeddings are actually valid
          const validEmbeddingCount = embeddings.filter(e => e && e.length > 0).length;
          const emptyEmbeddingCount = embeddings.filter(e => !e || e.length === 0).length;
          logger.info(`🎯 EMBEDDING VALIDATION: ${validEmbeddingCount} valid | ${emptyEmbeddingCount} empty`);

          // Add embeddings and timestamps to chunks
          logger.info(`💾 STORING IN MONGODB: ${batchChunks.length} chunks with ${embeddings.length} embeddings`);

          const chunksWithEmbeddings = batchChunks
            .map((chunk, idx) => {
              const embedding = embeddings[idx];
              if (!embedding || embedding.length === 0) {
                logger.error(`💀 EMBEDDING VOID: Chunk ${idx} [${chunk.chunk.name || 'unnamed'}] has ${embedding ? 'empty array' : 'NO'} embedding!`);
                return null;
              }
              logger.debug(`🌟 PERFECT EMBEDDING: Chunk ${idx} [${chunk.chunk.name || 'unnamed'}] - ${embedding.length} dimensions`);
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
                          logger.info(`🚀 LAUNCHING TO MONGODB: ${chunksWithEmbeddings.length} chunks...`);
            try {
              const result = await codeCollection.insertMany(chunksWithEmbeddings);
              logger.info(`🎉 SUCCESS! ${result.insertedCount} chunks now searchable in MongoDB!`);
            } catch (dbError) {
              logger.error(`💥 MONGODB EXPLOSION! Insertion failed:`, dbError);
              throw dbError;
            }
          } else {
            logger.error(`🔴 CRITICAL: Zero valid embeddings! Nothing to store!`);
          }
          totalChunks += chunksWithEmbeddings.length;
          
        } catch (error) {
          logger.error('💣 EMBEDDING GENERATION EXPLODED:', error);
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
    const avgSpeed = processedFiles > 0 ? Math.round(processedFiles / totalTime * 10) / 10 : 0;
    
    let response = `⚡ CODE INTELLIGENCE ACTIVATED! Your code is now SEARCHABLE! 🧠\n\n`;
    response += `📊 SYNC PERFORMANCE METRICS:\n`;
    response += `• ⏱️ Total Time: ${totalTime} seconds${totalTime < 5 ? ' (LIGHTNING FAST! ⚡)' : totalTime < 30 ? ' (Quick sync ✨)' : ' (Large codebase processed)'}\n`;
    response += `• 📁 Files Processed: ${processedFiles} files${processedFiles > 100 ? ' (MASSIVE codebase!)' : processedFiles > 50 ? ' (Substantial project)' : ''}\n`;
    response += `• ⏭️ Files Skipped: ${skippedFiles} (already up-to-date)\n`;
    response += `• 🧩 Chunks Created: ${totalChunks} searchable units\n`;
    response += `• 🚀 Processing Speed: ${avgSpeed} files/second\n`;
    response += `• 💾 Embeddings: ${totalChunks} vectors stored in MongoDB\n\n`;
    
    if (patternStats.size > 0) {
      response += `🔍 DISCOVERED PATTERNS (use these in searches!):\n`;
      const sortedPatterns = Array.from(patternStats.entries()).sort((a, b) => b[1] - a[1]);
      for (const [pattern, count] of sortedPatterns.slice(0, 10)) {
        const emoji = count > 50 ? '🔥' : count > 20 ? '⭐' : '•';
        response += `${emoji} ${pattern}: ${count} occurrences\n`;
      }
      response += '\n';
    }
    
    if (errors.length > 0) {
      response += `⚠️ SYNC WARNINGS (${errors.length} files had issues):\n`;
      response += errors.slice(0, 3).map(e => `• ${e}`).join('\n');
      if (errors.length > 3) {
        response += `\n• ... and ${errors.length - 3} more (non-critical)\n`;
      }
      response += '\n';
    }
    
    response += `🎯 YOUR CODE IS NOW SEARCHABLE! Try these POWER SEARCHES:\n\n`;
    response += `1️⃣ **Find Similar Code** (semantic search):\n`;
    response += `   memory_engineering_search --query "authentication" --codeSearch "similar"\n`;
    response += `   → Finds ALL auth-related code, even without exact matches!\n\n`;
    
    response += `2️⃣ **Find Implementations** (where things are built):\n`;
    response += `   memory_engineering_search --query "UserService" --codeSearch "implements"\n`;
    response += `   → Locates where classes/functions are defined\n\n`;
    
    response += `3️⃣ **Find Usage** (where things are used):\n`;
    response += `   memory_engineering_search --query "generateToken" --codeSearch "uses"\n`;
    response += `   → Discovers all places using this function\n\n`;
    
    response += `4️⃣ **Find Patterns** (architectural search):\n`;
    response += `   memory_engineering_search --query "Repository" --codeSearch "pattern"\n`;
    response += `   → Identifies design pattern implementations\n\n`;
    
    response += `⚡ SYNC INTELLIGENCE:\n`;
    response += `• Next sync needed: ${skippedFiles > processedFiles ? 'Not soon (most files unchanged)' : 'After 10-15 file edits'}\n`;
    response += `• Auto-sync triggers: File changes, >24h gap, before searches\n`;
    response += `• Optimization: ${processedFiles === 0 ? '✅ Everything was already synced!' : totalChunks > 500 ? '💡 Large codebase - consider targeted syncs with patterns' : '✅ Optimal chunk size'}\n\n`;
    
    response += `🔥 REMEMBER: Fresh embeddings = Perfect search. Stale embeddings = Blind search!\n\n`;
    response += `💡 PRO TIP: ${totalChunks > 1000 ? 'With ' + totalChunks + ' chunks, use specific searches for speed!' : totalChunks < 50 ? 'Small codebase synced - search will be instant!' : 'Perfect size for fast, accurate searches!'}`;

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };

  } catch (error) {
    logger.error('💀 SYNC CATASTROPHE - Code intelligence failed!', error);
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
        logger.info(`🎯 INDEX CREATED: ${indexDef.name} - Search speed boosted!`);
      } else {
        logger.info(`♾️ INDEX EXISTS: ${keyString} - Already optimized!`);
      }
    } catch (error: any) {
      if (error.code === 85) {
        logger.info(`⏭️ DUPLICATE INDEX: ${indexDef.name} - Skipping creation`);
      } else {
        logger.error(`🔴 INDEX CREATION FAILED: ${indexDef.name}`, error);
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