import type { Collection } from 'mongodb';
import { logger } from './logger.js';
import type { MemoryDocument, CodeChunk } from '../types/memory-v5.js';
import { EMBEDDING_DIMENSIONS } from '../embeddings/voyage-v5.js';

export const SEARCH_INDEX_DEFINITIONS = {
  // Memory search indexes (simplified for v5)
  memory_vector_search: {
    name: 'memory_vector_search',
    type: 'vectorSearch',
    collection: 'memory_engineering_documents',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'contentVector',
          numDimensions: EMBEDDING_DIMENSIONS,  // voyage-3 dimensions (1024)
          similarity: 'cosine'
        },
        {
          type: 'filter',
          path: 'projectId'
        },
        {
          type: 'filter',
          path: 'memoryName'
        }
      ]
    }
  },

  memory_text_search: {
    name: 'memory_text_search',
    type: 'search',
    collection: 'memory_engineering_documents',
    definition: {
      mappings: {
        dynamic: false,
        fields: {
          projectId: {
            type: 'token',
            normalizer: 'lowercase'
          },
          memoryName: {
            type: 'token',
            normalizer: 'lowercase'
          },
          content: {
            type: 'string',
            analyzer: 'lucene.standard'
          }
        }
      }
    }
  },
  
  // Code search indexes
  code_vector_search: {
    name: 'code_vector_search',
    type: 'vectorSearch',
    collection: 'memory_engineering_code',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'contentVector',
          numDimensions: EMBEDDING_DIMENSIONS,  // voyage-code-3 dimensions (1024)
          similarity: 'cosine'
        },
        {
          type: 'filter',
          path: 'projectId'
        },

        {
          type: 'filter',
          path: 'chunk.type'
        }
      ]
    }
  },
  
  code_text_search: {
    name: 'code_text_search',
    type: 'search',
    collection: 'memory_engineering_code',
    definition: {
      mappings: {
        dynamic: false,
        fields: {
          projectId: {
            type: 'token',
            normalizer: 'lowercase'
          },
          'chunk.name': {
            type: 'string',
            analyzer: 'lucene.standard'
          },
          'chunk.signature': {
            type: 'string',
            analyzer: 'lucene.standard'
          },
          searchableText: {
            type: 'string',
            analyzer: 'lucene.standard'
          },

          'chunk.type': {
            type: 'token',
            normalizer: 'lowercase'
          },
          'metadata.patterns': {
            type: 'token',
            normalizer: 'lowercase'
          },
          'metadata.dependencies': {
            type: 'token',
            normalizer: 'lowercase'
          }
        }
      }
    }
  }
};

export async function createSearchIndexes(
  memoryCollection: Collection<MemoryDocument>,
  codeCollection: Collection<CodeChunk>
): Promise<{
  success: boolean;
  message: string;
  details: string[];
}> {
  const details: string[] = [];
  let hasErrors = false;

  try {
    // Create standard indexes
    logger.info('Creating standard MongoDB indexes...');
    
    // Memory collection indexes
    const memoryIndexes = [
      { 
        keys: { projectId: 1, memoryName: 1 },
        name: 'project_memory_unique',
        unique: true
      },
      { 
        keys: { projectId: 1, 'metadata.lastModified': -1 },
        name: 'project_modified'
      },
      {
        keys: { content: 'text' },
        name: 'content_text'
      }
    ];

    for (const index of memoryIndexes) {
      try {
        await memoryCollection.createIndex(index.keys as any, { 
          name: index.name,
          ...(index.unique && { unique: index.unique })
        });
        details.push(`✅ Created memory index: ${index.name}`);
      } catch (error: any) {
        if (error.code === 85 || error.message?.includes('already exists')) {
          details.push(`ℹ️  Memory index already exists: ${index.name}`);
        } else {
          details.push(`❌ Failed to create memory index ${index.name}: ${error.message}`);
          hasErrors = true;
        }
      }
    }
    
    // Code collection indexes
    const codeIndexes = [
      { 
        keys: { projectId: 1, filePath: 1 },
        name: 'project_file'
      },
      { 
        keys: { projectId: 1, 'chunk.type': 1 },
        name: 'project_chunk_type'
      },
      { 
        keys: { projectId: 1, 'metadata.patterns': 1 },
        name: 'project_patterns'
      },
      
      {
        keys: { 
          'chunk.name': 'text',
          'chunk.signature': 'text',
          searchableText: 'text'
        },
        name: 'code_text'
      }
    ];

    for (const index of codeIndexes) {
      try {
        await codeCollection.createIndex(index.keys as any, { 
          name: index.name
        });
        details.push(`✅ Created code index: ${index.name}`);
      } catch (error: any) {
        if (error.code === 85 || error.message?.includes('already exists')) {
          details.push(`ℹ️  Code index already exists: ${index.name}`);
        } else {
          details.push(`❌ Failed to create code index ${index.name}: ${error.message}`);
          hasErrors = true;
        }
      }
    }

    // Check for Atlas Search capability
    logger.info('Checking for Atlas Search indexes...');
    
    try {
      // Try to list search indexes (Atlas only)
      const memorySearchIndexes = await memoryCollection.listSearchIndexes().toArray();
      const codeSearchIndexes = await codeCollection.listSearchIndexes().toArray();
      
      details.push(`ℹ️  Found ${memorySearchIndexes.length} memory search indexes`);
      details.push(`ℹ️  Found ${codeSearchIndexes.length} code search indexes`);
      
      // Create missing Atlas Search indexes
      // Memory vector search
      if (!memorySearchIndexes.some(idx => idx.name === 'memory_vector_search')) {
        try {
          await memoryCollection.createSearchIndex({
            name: 'memory_vector_search',
            type: 'vectorSearch',
            definition: SEARCH_INDEX_DEFINITIONS.memory_vector_search.definition
          } as any);
          details.push(`✅ Created memory vector search index`);
        } catch (error: any) {
          details.push(`❌ Failed to create memory vector search: ${error.message}`);
          hasErrors = true;
        }
      }

      // Memory text search
      if (!memorySearchIndexes.some(idx => idx.name === 'memory_text' || idx.name === 'memory_text_search')) {
        try {
          await memoryCollection.createSearchIndex({
            name: 'memory_text_search',
            type: 'search',
            definition: SEARCH_INDEX_DEFINITIONS.memory_text_search.definition
          } as any);
          details.push(`✅ Created memory text search index`);
        } catch (error: any) {
          details.push(`❌ Failed to create memory text search: ${error.message}`);
          hasErrors = true;
        }
      }
      
      // Code vector search
      if (!codeSearchIndexes.some(idx => idx.name === 'code_vector_search')) {
        try {
          await codeCollection.createSearchIndex({
            name: 'code_vector_search',
            type: 'vectorSearch',
            definition: SEARCH_INDEX_DEFINITIONS.code_vector_search.definition
          } as any);
          details.push(`✅ Created code vector search index`);
        } catch (error: any) {
          details.push(`❌ Failed to create code vector search: ${error.message}`);
          hasErrors = true;
        }
      }
      
      // Code text search
      if (!codeSearchIndexes.some(idx => idx.name === 'code_text_search')) {
        try {
          await codeCollection.createSearchIndex({
            name: 'code_text_search',
            type: 'search',
            definition: SEARCH_INDEX_DEFINITIONS.code_text_search.definition
          } as any);
          details.push(`✅ Created code text search index`);
        } catch (error: any) {
          details.push(`❌ Failed to create code text search: ${error.message}`);
          hasErrors = true;
        }
      }
      
    } catch (error: any) {
      logger.warn('Atlas Search not available:', error);
      details.push('⚠️  Atlas Search indexes not available (using text search fallback)');
      details.push('   For best code search experience, use MongoDB Atlas');
    }

    // Success message
    if (!hasErrors) {
      details.push('\n✅ All indexes configured successfully!');
      details.push('\nCode search is now available:');
      details.push('- Semantic similarity search with Voyage AI');
      details.push('- Pattern and dependency tracking');
      details.push('- Fast text and pattern search');
    }

    return {
      success: !hasErrors,
      message: hasErrors 
        ? 'Indexes created with some warnings'
        : 'All indexes created successfully',
      details
    };

  } catch (error) {
    logger.error('Failed to create indexes:', error);
    return {
      success: false,
      message: `Failed to create indexes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: [...details, `❌ Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}