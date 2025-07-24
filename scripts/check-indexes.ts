#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function checkIndexes(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const dbName = process.env.MEMORY_BANK_DB || 'memory_bank';
    const collectionName = process.env.MEMORY_BANK_COLLECTION || 'memory_bank_documents';
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // List all regular indexes
    console.log('📋 Regular Indexes:');
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Try to list search indexes
    console.log('\n🔍 Search Indexes:');
    try {
      // This method might not be available in all driver versions
      const searchIndexes = await collection.listSearchIndexes().toArray();
      if (searchIndexes.length === 0) {
        console.log('No search indexes found');
      } else {
        searchIndexes.forEach((index: any) => {
          console.log(`- ${index.name} (${index.type}): Status = ${index.status || 'UNKNOWN'}`);
          console.log(`  Definition: ${JSON.stringify(index.latestDefinition || index.definition, null, 2)}`);
        });
      }
    } catch (error: any) {
      console.log('Unable to list search indexes programmatically');
      console.log('This might be due to driver version or permissions');
      console.log('\nTo view search indexes:');
      console.log('1. Go to MongoDB Atlas Console');
      console.log('2. Navigate to your cluster → Browse Collections');
      console.log(`3. Select database: ${dbName}`);
      console.log(`4. Select collection: ${collectionName}`);
      console.log('5. Click "Search Indexes" tab');
    }

    // Check if we have vector data
    console.log('\n📊 Vector Data Status:');
    const docWithVector = await collection.findOne({ 
      contentVector: { $exists: true, $type: 'array' } 
    });
    
    if (docWithVector) {
      console.log(`✓ Found documents with vector embeddings`);
      console.log(`  Vector dimensions: ${docWithVector.contentVector?.length || 0}`);
      
      const vectorCount = await collection.countDocuments({ 
        contentVector: { $exists: true, $type: 'array' } 
      });
      console.log(`  Total documents with vectors: ${vectorCount}`);
    } else {
      console.log('❌ No documents with vector embeddings found');
      console.log('  Run memory_engineering/sync to generate embeddings');
    }

  } catch (error) {
    console.error('Error checking indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkIndexes();