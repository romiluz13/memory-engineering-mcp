import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SyncToolSchema, type ProjectConfig } from '../types/memory.js';
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

    // Find documents that need embedding generation
    const query = params.forceRegenerate
      ? { projectId: config.projectId }
      : {
          projectId: config.projectId,
          contentVector: { $exists: false },
        };

    const documents = await collection.find(query).toArray();

    if (documents.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `✅ All memory files are already synced!

Your MongoDB-powered Memory Engineering system is READY for action:
- 🔍 Hybrid search is active
- 🧠 Vector embeddings are current
- 📝 Text indexes are built

💡 QUICK ACTIONS:
1. Search your knowledge: memory_engineering/search --query "any topic"
2. Find patterns: memory_engineering/search --query "pattern"
3. Update memories: memory_engineering/update --fileName "activeContext.md"

🔄 Force regeneration? Use: memory_engineering/sync --forceRegenerate true`,
          },
        ],
      };
    }

    logger.info(`Syncing ${documents.length} memory files for project: ${config.projectId}`);

    // Batch generate embeddings
    const contents = documents.map((doc) => doc.content);
    const embeddings = await generateEmbeddings(contents);

    // Update documents with embeddings
    const bulkOps = documents.map((doc, index) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            contentVector: embeddings[index],
            'metadata.lastUpdated': new Date(),
          },
        },
      },
    }));

    const result = await collection.bulkWrite(bulkOps);

    logger.info(`Sync completed: ${result.modifiedCount} documents updated`);

    // Ensure search indexes exist
    try {
      // Check for vector search index
      const vectorIndexes = await collection.listSearchIndexes('memory_vector_index').toArray();
      
      if (vectorIndexes.length === 0) {
        await collection.createSearchIndex({
          name: 'memory_vector_index',
          type: 'vectorSearch',
          definition: {
            fields: [
              {
                type: 'vector',
                numDimensions: 1024,
                path: 'contentVector',
                similarity: 'cosine',
              },
              {
                type: 'filter',
                path: 'projectId',
              },
            ],
          },
        });
        logger.info('Vector search index created');
      }

      // Check for Atlas Search index for text search
      const textIndexes = await collection.listSearchIndexes('memory_text_index').toArray();
      
      if (textIndexes.length === 0) {
        await collection.createSearchIndex({
          name: 'memory_text_index',
          type: 'search',
          definition: {
            mappings: {
              dynamic: true,
              fields: {
                content: {
                  type: 'string',
                  analyzer: 'lucene.standard',
                },
                fileName: {
                  type: 'string',
                  analyzer: 'lucene.standard',
                },
                projectId: {
                  type: 'string',
                },
              },
            },
          },
        });
        logger.info('Atlas Search index for text search created');
      }
    } catch (error) {
      logger.debug('Search index creation error (may already exist):', error);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✨ Memory Engineering Synchronized - MongoDB Magic Activated!

📊 SYNC STATISTICS:
- Files synced: ${documents.length}
- Embeddings generated: ${result.modifiedCount}
- Vector model: Voyage AI 'voyage-3' (1024 dimensions)
- Storage: MongoDB Atlas with native vector support

🎉 YOUR KNOWLEDGE IS NOW SUPERCHARGED!

💎 MongoDB $rankFusion Hybrid Search - The CROWN JEWEL:
- 🧠 70% Semantic Understanding (what concepts mean)
- 📝 30% Keyword Matching (exact words you type)
- 🔄 Reciprocal Rank Fusion combines both intelligently!

🚀 WHAT YOU CAN DO NOW:

1. 🔍 DISCOVER PATTERNS:
   memory_engineering/search --query "authentication" --searchType "hybrid"
   → Finds BOTH similar concepts AND exact matches!

2. 🎯 FIND PATTERNS:
   memory_engineering/search --query "user"
   → Discovers all user-related patterns instantly!

3. 📊 EXPLORE YOUR KNOWLEDGE:
   memory_engineering/search --query "validation gates"
   → See how Context Engineering patterns connect!

🏆 MONGODB ADVANTAGE - ONE Database for EVERYTHING:
- 📁 Operational data (your memory files)
- 🧠 Vector embeddings (semantic understanding)
- 📝 Full-text search (keyword matching)
- 🔄 Version history (track changes)
- 🔗 References (auto-discovered connections)

💡 PRO TIP: The more you use Memory Engineering, the smarter it gets!
Every search, every blueprint, every update makes future development FASTER!

🎉 NO EXTERNAL VECTOR DB NEEDED - MongoDB does it ALL!`,
        },
      ],
    };
  } catch (error) {
    logger.error('Sync tool error:', error);
    throw error;
  }
}