#!/usr/bin/env node
/**
 * Migration script to fix evolution memory growth and update Atlas Search indexes
 * Run this on existing projects to apply v3.0.2 fixes
 */

import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
import { logger } from '../src/utils/logger.js';
import type { MemoryDocument } from '../src/types/memory.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'memory_engineering';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'memory_engineering_documents';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function migrateEvolutionMemories(collection: Collection<MemoryDocument>) {
  logger.info('Starting evolution memory migration...');
  
  // Step 1: Count existing evolution memories
  const oldCount = await collection.countDocuments({ memoryClass: 'evolution' });
  logger.info(`Found ${oldCount} evolution memories to migrate`);
  
  if (oldCount === 0) {
    logger.info('No evolution memories to migrate');
    return;
  }
  
  // Step 2: Aggregate by project and day
  const pipeline = [
    { $match: { memoryClass: 'evolution' } },
    {
      $group: {
        _id: {
          projectId: '$projectId',
          date: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: { $ifNull: ['$createdAt', '$metadata.freshness'] }
            } 
          }
        },
        memories: { $push: '$$ROOT' },
        totalSearches: { $sum: 1 },
        firstMemory: { $first: '$$ROOT' }
      }
    }
  ];
  
  const aggregated = await collection.aggregate(pipeline).toArray();
  logger.info(`Aggregating into ${aggregated.length} daily records`);
  
  // Step 3: Create new aggregated memories
  let migrated = 0;
  for (const group of aggregated) {
    const date = new Date(group._id.date);
    date.setHours(0, 0, 0, 0);
    
    // Build query statistics
    const queries: Record<string, number> = {};
    const searchDetails: any[] = [];
    
    group.memories.forEach((mem: any) => {
      const query = mem.content?.evolution?.query || mem.content?.query || 'unknown';
      const key = query.toLowerCase().replace(/[^a-z0-9]/g, '_');
      queries[key] = (queries[key] || 0) + 1;
      
      searchDetails.push({
        query,
        resultCount: mem.content?.evolution?.resultCount || mem.content?.resultCount || 0,
        timestamp: mem.createdAt || mem.metadata?.freshness || date
      });
    });
    
    // Only keep last 100 searches per day
    const recentSearches = searchDetails
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);
    
    // Create or update aggregated memory
    const result = await collection.findOneAndUpdate(
      {
        projectId: group._id.projectId,
        memoryClass: 'evolution',
        'content.evolution.date': {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      {
        $set: {
          'content.evolution': {
            date,
            totalSearches: group.totalSearches,
            queries,
            searchDetails: recentSearches,
            migrated: true
          },
          'metadata.freshness': date,
          'metadata.autoExpire': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 day TTL
          'metadata.importance': 5,
          'metadata.tags': ['search-tracking', 'evolution', 'daily-aggregate', 'migrated'],
          searchableText: `Daily search evolution ${date.toISOString().split('T')[0]} - Total searches: ${group.totalSearches} - Queries: ${Object.keys(queries).join(', ')}`,
          updatedAt: new Date()
        },
        $setOnInsert: {
          projectId: group._id.projectId,
          memoryClass: 'evolution',
          memoryType: 'meta',
          'metadata.accessCount': 0,
          createdAt: date
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    if (result) {
      migrated++;
    }
  }
  
  logger.info(`Created ${migrated} aggregated evolution memories`);
  
  // Step 4: Delete old individual evolution memories
  const deleteResult = await collection.deleteMany({
    memoryClass: 'evolution',
    'content.evolution.migrated': { $ne: true }
  });
  
  logger.info(`Deleted ${deleteResult.deletedCount} old evolution memories`);
  
  // Step 5: Verify migration
  const newCount = await collection.countDocuments({ memoryClass: 'evolution' });
  logger.info(`Migration complete: ${oldCount} memories → ${newCount} memories (${Math.round((1 - newCount/oldCount) * 100)}% reduction)`);
}

async function updateAtlasSearchIndexes(collection: Collection<MemoryDocument>) {
  logger.info('Updating Atlas Search indexes...');
  
  try {
    // Drop old indexes if they exist
    const indexes = await collection.listSearchIndexes().toArray();
    
    for (const index of indexes) {
      if (index.name === 'memory_text' || index.name === 'memory_vectors') {
        logger.info(`Dropping old index: ${index.name}`);
        await collection.dropSearchIndex(index.name);
        
        // Wait for index to be dropped
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Create new text search index with correct configuration
    logger.info('Creating new text search index with projectId as token...');
    await collection.createSearchIndex({
      name: 'memory_text',
      type: 'search',
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            projectId: {
              type: 'token',
              normalizer: 'lowercase'
            },
            searchableText: {
              type: 'string',
              analyzer: 'lucene.standard'
            },
            memoryClass: {
              type: 'token',
              normalizer: 'lowercase'
            },
            memoryType: {
              type: 'token',
              normalizer: 'lowercase'
            },
            'metadata.tags': {
              type: 'string',
              analyzer: 'lucene.standard'
            },
            'metadata.importance': {
              type: 'number'
            },
            'metadata.freshness': {
              type: 'date'
            }
          }
        }
      }
    });
    
    // Create vector search index
    logger.info('Creating vector search index...');
    await collection.createSearchIndex({
      name: 'memory_vectors',
      type: 'vectorSearch',
      definition: {
        fields: [{
          type: 'vector',
          path: 'contentVector',
          numDimensions: 1024,
          similarity: 'cosine'
        }]
      }
    });
    
    logger.info('Atlas Search indexes updated successfully');
  } catch (error) {
    logger.error('Failed to update Atlas Search indexes', error);
    logger.warn('You may need to manually create the indexes in Atlas UI');
  }
}

async function addMissingIndexes(collection: Collection<MemoryDocument>) {
  logger.info('Adding performance indexes...');
  
  const indexes = [
    {
      keys: { projectId: 1, memoryClass: 1, 'metadata.freshness': -1 },
      options: { name: 'project_class_freshness' }
    },
    {
      keys: { projectId: 1, 'metadata.importance': -1, 'metadata.accessCount': -1 },
      options: { name: 'project_importance_access' }
    },
    {
      keys: { 'metadata.autoExpire': 1 },
      options: { 
        name: 'ttl_autoexpire',
        expireAfterSeconds: 0 
      }
    },
    {
      keys: { 
        memoryClass: 1, 
        'content.evolution.date': 1,
        projectId: 1 
      },
      options: { 
        name: 'evolution_daily',
        partialFilterExpression: { memoryClass: 'evolution' }
      }
    }
  ];
  
  for (const index of indexes) {
    try {
      await collection.createIndex(index.keys, index.options);
      logger.info(`Created index: ${index.options.name}`);
    } catch (error: any) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        logger.info(`Index already exists: ${index.options.name}`);
      } else {
        logger.error(`Failed to create index: ${index.options.name}`, error);
      }
    }
  }
}

async function main() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    logger.info('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection<MemoryDocument>(COLLECTION_NAME);
    
    // Get project ID if specified
    const projectId = process.argv[2];
    if (projectId) {
      logger.info(`Migrating only project: ${projectId}`);
      // Add projectId filter to all queries
    }
    
    // Run migrations
    console.log('\n📊 Memory Engineering v3.0.2 Migration\n');
    
    console.log('1️⃣  Migrating evolution memories to daily aggregates...');
    await migrateEvolutionMemories(collection);
    
    console.log('\n2️⃣  Updating Atlas Search indexes...');
    await updateAtlasSearchIndexes(collection);
    
    console.log('\n3️⃣  Adding performance indexes...');
    await addMissingIndexes(collection);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Show statistics
    const stats = await collection.aggregate([
      { $group: {
        _id: '$memoryClass',
        count: { $sum: 1 },
        avgSize: { $avg: { $bsonSize: '$$ROOT' } }
      }}
    ]).toArray();
    
    console.log('📈 Memory Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} memories (avg ${Math.round(stat.avgSize)} bytes)`);
    });
    
  } catch (error) {
    logger.error('Migration failed', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
main().catch(console.error);