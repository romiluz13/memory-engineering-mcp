import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SyncToolSchema, type ProjectConfig, type MemoryDocument } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { generateEmbeddings } from '../embeddings/voyage.js';
import { logger } from '../utils/logger.js';

export async function syncTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = SyncToolSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Memory Engineering not initialized for this project. Run memory_engineering/init first.',
          },
        ],
      };
    }

    const config: ProjectConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    const collection = getMemoryCollection();

    // Find documents that need embedding generation or searchable text
    const query = params.forceRegenerate
      ? { projectId: config.projectId }
      : {
          projectId: config.projectId,
          $or: [
            { contentVector: { $exists: false } },
            { searchableText: { $exists: false } }
          ]
        };

    const documents = await collection.find(query).toArray();

    if (documents.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `All memories are already synced.

Status:
- Vector embeddings: Current
- Text search: Indexed
- Search: $rankFusion ready

Use memory_engineering/search to query memories.
To force regeneration: memory_engineering/sync --forceRegenerate true`,
          },
        ],
      };
    }

    logger.info(`Syncing ${documents.length} memories for project: ${config.projectId}`);

    // Prepare content for embedding generation
    const contents = documents.map((doc) => extractContentForEmbedding(doc));
    
    // Generate embeddings
    const embeddings = await generateEmbeddings(contents);

    // Update documents with embeddings and searchable text
    const bulkOps = documents.map((doc, index) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            contentVector: embeddings[index],
            searchableText: extractSearchableText(doc),
            'metadata.freshness': new Date(),
          },
        },
      },
    }));

    const result = await collection.bulkWrite(bulkOps);

    logger.info(`Sync completed: ${result.modifiedCount} documents updated`);

    // Ensure search indexes exist
    await ensureSearchIndexes(collection);

    // Generate summary by memory class
    const memorySummary = await collection.aggregate([
      { $match: { projectId: config.projectId } },
      { 
        $group: { 
          _id: '$memoryClass',
          count: { $sum: 1 },
          avgImportance: { $avg: '$metadata.importance' }
        } 
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    return {
      content: [
        {
          type: 'text',
          text: `Memory synchronization complete.

Sync Results:
- Memories processed: ${documents.length}
- Embeddings generated: ${result.modifiedCount}
- Embedding model: voyage-3-large (1024 dimensions)

Memory Distribution:
${memorySummary.map(m => 
  `- ${m._id}: ${m.count} memories (avg importance: ${m.avgImportance.toFixed(1)}/10)`
).join('\n')}

Search Configuration:
- $rankFusion weights: 40% semantic, 30% patterns, 20% temporal, 10% evolution
- Indexes: vector search, text search, TTL

Example searches:
- memory_engineering/search --query "error handling patterns"
- memory_engineering/search --query "performance optimization"
- memory_engineering/search --query "recent changes" --searchType "temporal"`,
        },
      ],
    };
  } catch (error) {
    logger.error('Sync tool error:', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to sync memories: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
    };
  }
}

function extractContentForEmbedding(doc: MemoryDocument): string {
  let content = '';

  // Extract based on memory class
  switch (doc.memoryClass) {
    case 'core':
      const memoryName = doc.content.memoryName || doc.content.fileName?.replace(/\.md$/, '') || '';
      content = `${memoryName} ${doc.content.markdown || ''}`;
      break;
    case 'working':
      if (doc.content.event) {
        content = `${doc.content.event.action} ${doc.content.event.solution || ''} ${JSON.stringify(doc.content.event.context || {})}`;
      }
      break;
    // Insight and evolution cases removed - simplified to 2 classes
  }

  // Add metadata context
  content += ` ${doc.metadata.tags.join(' ')}`;

  return content.trim();
}

function extractSearchableText(doc: MemoryDocument): string {
  let text = '';

  // Extract text based on memory class
  switch (doc.memoryClass) {
    case 'core':
      text = doc.content.markdown || '';
      break;
    case 'working':
      if (doc.content.event) {
        text = `${doc.content.event.action} ${doc.content.event.solution || ''} ${JSON.stringify(doc.content.event.context || {})}`;
      }
      break;
    // Insight and evolution cases removed - simplified to 2 classes
  }

  // Clean up for search
  return text
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/```[^`]*```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\n{3,}/g, '\n\n') // Normalize newlines
    .trim();
}

async function ensureSearchIndexes(collection: any): Promise<void> {
  try {
    // Check for vector search index
    const vectorIndexes = await collection.listSearchIndexes('memory_vectors').toArray();
    
    if (vectorIndexes.length === 0) {
      await collection.createSearchIndex({
        name: 'memory_vectors',
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              numDimensions: 1024,
              path: 'contentVector',
              similarity: 'cosine',
            }
          ],
        },
      });
      logger.info('Vector search index created');
    }

    // Check for text search index
    const textIndexes = await collection.listSearchIndexes('memory_text').toArray();
    
    if (textIndexes.length === 0) {
      await collection.createSearchIndex({
        name: 'memory_text',
        type: 'search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              searchableText: {
                type: 'string',
                analyzer: 'lucene.standard',
              },
              'metadata.tags': {
                type: 'string',
                analyzer: 'lucene.keyword',
              },
            },
          },
        },
      });
      logger.info('Text search index created');
    }
  } catch (error) {
    logger.debug('Search index check/creation:', error);
  }
}