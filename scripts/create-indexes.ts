#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function createIndexes(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const dbName = process.env.MEMORY_ENGINEERING_DB || 'memory_engineering';
    const collectionName = process.env.MEMORY_ENGINEERING_COLLECTION || 'memory_engineering_documents';
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log(`\nCreating indexes for ${dbName}.${collectionName}`);

    // Create standard indexes
    console.log('\n📝 Creating standard indexes...');
    
    const standardIndexes = [
      { spec: { projectId: 1, memoryClass: 1, 'metadata.freshness': -1 }, name: 'project_class_freshness' },
      { spec: { projectId: 1, 'metadata.importance': -1 }, name: 'project_importance' },
      { spec: { 'metadata.autoExpire': 1 }, name: 'ttl_index', options: { expireAfterSeconds: 0 } }
    ];

    for (const index of standardIndexes) {
      try {
        await collection.createIndex(index.spec, { name: index.name, ...index.options });
        console.log(`✓ Created index: ${index.name}`);
      } catch (error: any) {
        if (error.code === 85 || error.message.includes('already exists')) {
          console.log(`ℹ️  Index already exists: ${index.name}`);
        } else {
          console.error(`❌ Failed to create index ${index.name}:`, error.message);
        }
      }
    }

    // Check existing search indexes
    console.log('\n📝 Checking Atlas Search indexes...');
    const existingIndexes = await collection.listSearchIndexes().toArray();
    console.log(`Found ${existingIndexes.length} existing search indexes`);

    // Create Atlas Search indexes
    const searchIndexes = {
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
              // CRITICAL: projectId must be indexed as token for filtering
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

    for (const [indexName, indexDef] of Object.entries(searchIndexes)) {
      const exists = existingIndexes.some(idx => idx.name === indexName);
      
      if (exists) {
        console.log(`\n⚠️  Search index '${indexName}' already exists`);
        const forceRecreate = process.argv.includes('--force');
        
        if (forceRecreate) {
          console.log(`Dropping and recreating '${indexName}'...`);
          try {
            await collection.dropSearchIndex(indexName);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for drop
          } catch (e: any) {
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
      } catch (error: any) {
        console.error(`❌ Failed to create '${indexName}':`, error.message);
        
        if (error.message.includes('duplicate index')) {
          console.log(`ℹ️  Index already exists with same definition`);
        } else if (error.message.includes('not supported')) {
          console.log(`ℹ️  Your MongoDB instance may not support this index type`);
          console.log(`   Make sure you're using MongoDB Atlas 6.0+ with Atlas Search enabled`);
          
          if (indexName === 'memory_text') {
            console.log('\n📝 Manual Atlas Search Index Configuration:');
            console.log('1. Go to MongoDB Atlas Console');
            console.log('2. Navigate to your cluster → Atlas Search');
            console.log('3. Delete the existing "memory_text" index if it exists');
            console.log('4. Create a new index with name: "memory_text"');
            console.log('5. Use this JSON configuration:');
            console.log(JSON.stringify(indexDef.definition, null, 2));
          }
        }
      }
    }

    console.log('\n✅ Index setup complete!');
    console.log('\nNext steps:');
    console.log('1. Wait 1-2 minutes for Atlas Search indexes to be available');
    console.log('2. Run memory_engineering_sync to generate embeddings');
    console.log('3. Test search with memory_engineering_search');
    
    console.log('\n⚠️  IMPORTANT: Atlas Search Index Requirements:');
    console.log('- The "projectId" field MUST be indexed as type "token" with "lowercase" normalizer');
    console.log('- This enables filtering by projectId in search queries');
    console.log('- Without this, you\'ll get "Path projectId needs to be indexed as token" errors');
    
    console.log('\nIf search fails with "Path projectId needs to be indexed":');
    console.log('1. Go to MongoDB Atlas Console → Atlas Search → Your Index');
    console.log('2. Verify the "memory_text" index has projectId defined as:');
    console.log('   { "type": "token", "normalizer": "lowercase" }');
    console.log('3. If not, delete and recreate the index using: npm run db:indexes --force');
    console.log('4. Or manually create in Atlas UI with the configuration shown above');

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createIndexes();