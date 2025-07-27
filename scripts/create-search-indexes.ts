#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config();

const SEARCH_INDEXES = {
  memory_vectors: {
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
  },
  memory_text: {
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
          },
          'metadata.accessCount': {
            type: 'number'
          },
          'content.memoryName': {
            type: 'token',
            normalizer: 'lowercase'
          },
          'content.markdown': {
            type: 'string',
            analyzer: 'lucene.standard'
          }
        }
      }
    }
  }
};

async function createSearchIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.error('Please set it in .env.local or as an environment variable');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(process.env.MEMORY_ENGINEERING_DB || 'memory_engineering');
    const collection = db.collection(process.env.MEMORY_ENGINEERING_COLLECTION || 'memory_engineering_documents');

    // Check existing search indexes
    const existingIndexes = await collection.listSearchIndexes().toArray();
    console.log(`\nFound ${existingIndexes.length} existing search indexes`);

    for (const [indexName, indexDef] of Object.entries(SEARCH_INDEXES)) {
      const exists = existingIndexes.some(idx => idx.name === indexName);
      
      if (exists) {
        console.log(`\n⚠️  Index '${indexName}' already exists`);
        const dropConfirm = process.argv.includes('--force');
        
        if (dropConfirm) {
          console.log(`Dropping and recreating '${indexName}'...`);
          try {
            await collection.dropSearchIndex(indexName);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for drop
          } catch (e) {
            console.log(`Could not drop index: ${e.message}`);
          }
        } else {
          console.log(`Skipping '${indexName}' (use --force to recreate)`);
          continue;
        }
      }

      try {
        console.log(`\n📝 Creating search index: ${indexName}`);
        await collection.createSearchIndex(indexDef);
        console.log(`✅ Created '${indexName}' successfully`);
      } catch (error) {
        console.error(`❌ Failed to create '${indexName}':`, error.message);
        
        if (error.message.includes('duplicate index')) {
          console.log(`ℹ️  Index already exists with same definition`);
        } else if (error.message.includes('not supported')) {
          console.log(`ℹ️  Your MongoDB instance may not support this index type`);
          console.log(`   Make sure you're using MongoDB Atlas 6.0+ with Atlas Search enabled`);
        }
      }
    }

    // Create standard indexes
    console.log('\n📝 Creating standard indexes...');
    
    const standardIndexes = [
      { projectId: 1, memoryClass: 1, 'metadata.freshness': -1 },
      { projectId: 1, 'metadata.importance': -1 },
      { 'metadata.autoExpire': 1 }
    ];

    for (const indexSpec of standardIndexes) {
      try {
        const indexName = Object.keys(indexSpec).join('_');
        const options: any = {};
        
        if ('metadata.autoExpire' in indexSpec) {
          options.expireAfterSeconds = 0;
          console.log(`Creating TTL index on metadata.autoExpire...`);
        } else {
          console.log(`Creating index: ${indexName}...`);
        }
        
        await collection.createIndex(indexSpec, options);
        console.log(`✅ Created index successfully`);
      } catch (error) {
        if (error.code === 85 || error.message.includes('already exists')) {
          console.log(`ℹ️  Index already exists`);
        } else {
          console.error(`❌ Failed to create index:`, error.message);
        }
      }
    }

    console.log('\n✅ Index setup complete!');
    console.log('\nNext steps:');
    console.log('1. Wait 1-2 minutes for Atlas Search indexes to be available');
    console.log('2. Run memory_engineering_sync to generate embeddings');
    console.log('3. Test search with memory_engineering_search');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run if executed directly
if (require.main === module) {
  console.log('Memory Engineering - MongoDB Search Index Setup\n');
  createSearchIndexes();
}

export { createSearchIndexes };