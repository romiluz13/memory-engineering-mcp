#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function recreateVectorIndex(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const dbName = process.env.MEMORY_ENGINEERING_DB || process.env.MEMORY_BANK_DB || 'memory_engineering';
    const collectionName = process.env.MEMORY_ENGINEERING_COLLECTION || process.env.MEMORY_BANK_COLLECTION || 'memory_engineering_documents';
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Drop existing vector search index
    console.log('🗑️  Dropping existing vector search index...');
    try {
      await collection.dropSearchIndex('memory_vector_index');
      console.log('✓ Dropped memory_vector_index');
      
      // Wait a bit for the drop to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error: any) {
      console.log('Could not drop index (may not exist):', error.message);
    }

    // Create new vector search index with filter support
    console.log('\n🚀 Creating new vector search index with filter support...');
    try {
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
      console.log('✓ Vector search index created successfully!');
      console.log('\n⏳ Note: It may take a few minutes for the index to become fully operational.');
      console.log('   You can check the status in MongoDB Atlas UI.');
    } catch (error) {
      console.error('❌ Error creating index:', error);
    }

    // List all search indexes
    console.log('\n📋 Current search indexes:');
    try {
      const searchIndexes = await collection.listSearchIndexes().toArray();
      searchIndexes.forEach((index: any) => {
        console.log(`- ${index.name} (${index.type}): Status = ${index.status || 'BUILDING'}`);
        console.log(`  Definition: ${JSON.stringify(index.latestDefinition || index.definition, null, 2)}`);
      });
    } catch (error) {
      console.log('Unable to list search indexes');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

recreateVectorIndex();