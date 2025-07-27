#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function fixSearchIndexes(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const dbName = process.env.MEMORY_ENGINEERING_DB || 'memory_engineering';
    const collectionName = process.env.MEMORY_ENGINEERING_COLLECTION || 'memory_engineering_documents';
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log(`Fixing search indexes for ${dbName}.${collectionName}`);

    // Delete existing text search index if it exists
    try {
      await collection.dropSearchIndex('memory_text');
      console.log('✓ Dropped existing memory_text index');
    } catch (error) {
      console.log('✓ No existing memory_text index to drop');
    }

    // Create proper Atlas Search index with all required fields
    console.log('\n Creating new Atlas Search index...');
    try {
      await collection.createSearchIndex({
        name: 'memory_text',
        type: 'search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              // CRITICAL: Add projectId as token type for filtering
              projectId: {
                type: 'token',
                normalizer: 'lowercase'
              },
              // Searchable text fields
              searchableText: {
                type: 'string',
                analyzer: 'lucene.standard'
              },
              // Memory class for filtering
              memoryClass: {
                type: 'token',
                normalizer: 'lowercase'
              },
              // Memory type for filtering
              memoryType: {
                type: 'token',
                normalizer: 'lowercase'
              },
              // Tags for keyword search
              'metadata.tags': {
                type: 'string',
                analyzer: 'lucene.standard'
              },
              // Importance for filtering
              'metadata.importance': {
                type: 'number'
              },
              // Freshness for temporal queries
              'metadata.freshness': {
                type: 'date'
              },
              // Content fields for core memories
              'content.fileName': {
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
      });
      console.log('✅ Created new memory_text index with proper field mappings');
    } catch (error: any) {
      if (error.codeName === 'IndexAlreadyExists') {
        console.log('⚠️  memory_text index already exists');
        console.log('   Please delete it manually in Atlas UI and run this script again');
      } else {
        console.error('❌ Error creating text search index:', error);
        console.log('\n📝 Manual Atlas Search Index Configuration:');
        console.log('1. Go to MongoDB Atlas Console');
        console.log('2. Navigate to your cluster → Atlas Search');
        console.log('3. Delete the existing "memory_text" index if it exists');
        console.log('4. Create a new index with name: "memory_text"');
        console.log('5. Use this JSON configuration:');
        console.log(`
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "projectId": {
        "type": "token",
        "normalizer": "lowercase"
      },
      "searchableText": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "memoryClass": {
        "type": "token",
        "normalizer": "lowercase"
      },
      "memoryType": {
        "type": "token",
        "normalizer": "lowercase"
      },
      "metadata.tags": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "metadata.importance": {
        "type": "number"
      },
      "metadata.freshness": {
        "type": "date"
      },
      "content.fileName": {
        "type": "token",
        "normalizer": "lowercase"
      },
      "content.markdown": {
        "type": "string",
        "analyzer": "lucene.standard"
      }
    }
  }
}
        `);
      }
    }

    // Verify vector search index
    try {
      const indexes = await collection.listSearchIndexes({ name: 'memory_vectors' }).toArray();
      if (indexes.length > 0) {
        console.log('\n✅ Vector search index "memory_vectors" exists');
      } else {
        console.log('\n⚠️  Vector search index "memory_vectors" not found');
        console.log('   Creating it now...');
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
        console.log('✅ Created vector search index');
      }
    } catch (error) {
      console.log('\n⚠️  Could not verify vector search index');
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. If search still fails, manually create indexes in Atlas UI');
    console.log('2. Run memory_engineering_sync to generate embeddings');
    console.log('3. Test with: memory_engineering_search --query "test"');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixSearchIndexes();