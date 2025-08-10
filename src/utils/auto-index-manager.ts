/**
 * Auto Index Manager - Ensures all indexes are created automatically
 * This runs in the background to guarantee users have all indexes without manual setup
 */

import { Collection } from 'mongodb';
import { logger } from './logger.js';
import type { MemoryDocument, CodeChunk } from '../types/memory-v5.js';

// Track if we've already ensured indexes this session
let indexesEnsured = false;

/**
 * Automatically ensures all required indexes exist
 * Called during init and periodically in background
 */
export async function ensureAllIndexes(
  memoryCollection: Collection<MemoryDocument>,
  codeCollection: Collection<CodeChunk>
): Promise<void> {
  if (indexesEnsured) {
    logger.debug('♾️ INDEXES CACHED - Already optimized this session');
    return;
  }

  try {
    logger.info('⚡ AUTO-CREATING ALL INDEXES - Brain synapses forming...');
    
    // Standard MongoDB indexes for memories
    const memoryIndexes = [
      { keys: { projectId: 1, memoryName: 1 }, name: 'project_memory_unique', unique: true },
      { keys: { projectId: 1, 'metadata.lastModified': -1 }, name: 'project_modified' },
      { keys: { content: 'text' }, name: 'content_text' }
    ];

    for (const index of memoryIndexes) {
      try {
        await memoryCollection.createIndex(index.keys as any, { 
          name: index.name,
          ...(index.unique && { unique: index.unique })
        });
      } catch (error: any) {
        if (error.code !== 85 && error.code !== 86) { // Ignore "already exists" errors
          logger.warn(`⚠️ INDEX WARNING: ${error.message}`);
        }
      }
    }

    // Standard MongoDB indexes for code
    const codeIndexes = [
      { keys: { projectId: 1, filePath: 1 }, name: 'project_file' },
      { keys: { projectId: 1, 'chunk.type': 1 }, name: 'project_chunk_type' },
      { keys: { projectId: 1, 'metadata.patterns': 1 }, name: 'project_patterns' },
      { keys: { 'chunk.name': 'text', 'chunk.signature': 'text', searchableText: 'text' }, name: 'code_text' }
    ];

    for (const index of codeIndexes) {
      try {
        await codeCollection.createIndex(index.keys as any, { name: index.name });
      } catch (error: any) {
        if (error.code !== 85 && error.code !== 86) {
          logger.warn(`⚠️ INDEX WARNING: ${error.message}`);
        }
      }
    }

    // Atlas Search indexes - try to create, fail gracefully if not Atlas
    try {
      await ensureAtlasSearchIndexes(memoryCollection, codeCollection);
    } catch (error) {
      logger.debug('📦 ATLAS OFFLINE - Fallback to standard text search');
    }

    indexesEnsured = true;
    logger.info('🎉 ALL INDEXES READY - Search speed MAXIMIZED!');
    
  } catch (error) {
    logger.error('💀 INDEX SETUP EXPLOSION!', error);
    // Don't throw - let the system work with whatever indexes exist
  }
}

/**
 * Creates Atlas Search indexes if on MongoDB Atlas
 */
async function ensureAtlasSearchIndexes(
  memoryCollection: Collection<MemoryDocument>,
  codeCollection: Collection<CodeChunk>
): Promise<void> {
  try {
    // Check what exists
    const memorySearchIndexes = await memoryCollection.listSearchIndexes().toArray();
    const codeSearchIndexes = await codeCollection.listSearchIndexes().toArray();

    // Memory vector search
    if (!memorySearchIndexes.some(idx => 
      idx.name === 'memory_vector_search'
    )) {
      await memoryCollection.createSearchIndex({
        name: 'memory_vector_search',
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'contentVector',
              numDimensions: 1024,
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
      } as any);
      logger.info('🧠 MEMORY VECTOR INDEX CREATED - Semantic search online!');
    }

    // Memory text search
    if (!memorySearchIndexes.some(idx => 
      idx.name === 'memory_text_search' || idx.name === 'memory_text'
    )) {
      await memoryCollection.createSearchIndex({
        name: 'memory_text_search',
        type: 'search',
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
      } as any);
      logger.info('📖 MEMORY TEXT INDEX CREATED - Keyword search ready!');
    }

    // Code vector search
    if (!codeSearchIndexes.some(idx => 
      idx.name === 'code_vector_search'
    )) {
      await codeCollection.createSearchIndex({
        name: 'code_vector_search',
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'contentVector',
              numDimensions: 1024,
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
      } as any);
      logger.info('🔍 CODE VECTOR INDEX CREATED - Code intelligence activated!');
    }

    // Code text search
    if (!codeSearchIndexes.some(idx => 
      idx.name === 'code_text_search'
    )) {
      await codeCollection.createSearchIndex({
        name: 'code_text_search',
        type: 'search',
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
              }
            }
          }
        }
      } as any);
      logger.info('📝 CODE TEXT INDEX CREATED - Symbol search enabled!');
    }

    logger.info('🚀 ATLAS SEARCH FULLY OPERATIONAL - Maximum intelligence!');
    
  } catch (error: any) {
    if (error.message?.includes('listSearchIndexes')) {
      throw new Error('Not MongoDB Atlas');
    }
    logger.warn('⚠️ ATLAS INDEX WARNING:', error.message);
  }
}

/**
 * Background task to ensure indexes after a delay
 * This catches any indexes that might have failed during init
 */
export function startIndexBackgroundTask(
  memoryCollection: Collection<MemoryDocument>,
  codeCollection: Collection<CodeChunk>
): void {
  // Check after 30 seconds
  setTimeout(async () => {
    try {
      logger.debug('🔄 BACKGROUND INDEX CHECK - Ensuring persistence...');
      await ensureAllIndexes(memoryCollection, codeCollection);
    } catch (error) {
      logger.debug('⚠️ Background check failed (non-critical):', error);
    }
  }, 30000);

  // Check again after 2 minutes (for Atlas indexes that take time)
  setTimeout(async () => {
    try {
      logger.debug('🔁 SECOND INDEX CHECK - Double ensuring...');
      indexesEnsured = false; // Force recheck
      await ensureAllIndexes(memoryCollection, codeCollection);
    } catch (error) {
      logger.debug('⚠️ Second check failed (non-critical):', error);
    }
  }, 120000);
}
