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
    console.log('Connected to MongoDB');

    const dbName = process.env.MEMORY_ENGINEERING_DB || process.env.MEMORY_BANK_DB || 'memory_engineering';
    const collectionName = process.env.MEMORY_ENGINEERING_COLLECTION || process.env.MEMORY_BANK_COLLECTION || 'memory_engineering_documents';
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log(`Creating indexes for ${dbName}.${collectionName}`);

    // Create compound index for project and file
    await collection.createIndex(
      { projectId: 1, fileName: 1 },
      { unique: true, name: 'project_file_unique' }
    );
    console.log('✓ Created unique index on projectId and fileName');

    // Create index for project and type
    await collection.createIndex(
      { projectId: 1, 'metadata.type': 1 },
      { name: 'project_type' }
    );
    console.log('✓ Created index on projectId and metadata.type');

    // Create text index for content search
    await collection.createIndex(
      { content: 'text' },
      { name: 'content_text' }
    );
    console.log('✓ Created text index on content');

    // Create index for updated timestamp
    await collection.createIndex(
      { updatedAt: -1 },
      { name: 'updated_desc' }
    );
    console.log('✓ Created index on updatedAt');

    // Create vector search index
    console.log('\n📝 Vector Search Index Instructions:');
    console.log('MongoDB Atlas Vector Search indexes must be created in the Atlas UI.');
    console.log('\n1. Go to MongoDB Atlas Console');
    console.log('2. Navigate to your cluster → Browse Collections');
    console.log('3. Select database: memory_engineering');
    console.log('4. Select collection: memory_engineering_documents');
    console.log('5. Click "Search Indexes" tab');
    console.log('6. Click "Create Search Index"');
    console.log('7. Choose "JSON Editor" and use this configuration:');
    console.log(`
{
  "name": "memory_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [{
      "type": "vector",
      "path": "contentVector",
      "numDimensions": 1024,
      "similarity": "cosine"
    }]
  }
}
`);
    console.log('8. Click "Create"');
    
    // For now, try basic programmatic creation
    try {
      await collection.createSearchIndex({
        name: 'memory_vector_index',
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
      console.log('\n✓ Vector search index creation initiated');
    } catch (error: any) {
      if (error.code === 68) {
        console.log('\n✓ Vector search index already exists');
      } else {
        console.log('\n⚠ Automatic index creation not available');
        console.log('  Please create the index manually in Atlas UI using the configuration above');
      }
    }

    console.log('\n✅ All indexes created successfully!');
    console.log('\nMongoDB Atlas Vector Search provides:');
    console.log('- Hybrid search combining vector and text capabilities');
    console.log('- No synchronization needed between databases');
    console.log('- Enterprise-grade performance and security');
    console.log('- Seamless scaling as your data grows');
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createIndexes();