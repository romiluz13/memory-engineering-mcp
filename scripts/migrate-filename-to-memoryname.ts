#!/usr/bin/env node
/**
 * Migration script to rename fileName to memoryName and remove .md extensions
 * This fixes the confusion between MongoDB documents and actual files
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { logger } from '../src/utils/logger.js';
import type { MemoryDocument } from '../src/types/memory.js';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'memory_engineering';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'memory_engineering_documents';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function migrateFileNameToMemoryName(collection: any) {
  logger.info('Starting fileName to memoryName migration...');
  
  // Count documents with old structure
  const oldCount = await collection.countDocuments({ 
    memoryClass: 'core',
    'content.fileName': { $exists: true },
    'content.memoryName': { $exists: false }
  });
  
  if (oldCount === 0) {
    logger.info('No core memories need migration');
    return;
  }
  
  logger.info(`Found ${oldCount} core memories to migrate`);
  
  // Migrate each document
  const cursor = collection.find({
    memoryClass: 'core',
    'content.fileName': { $exists: true },
    'content.memoryName': { $exists: false }
  });
  
  let migrated = 0;
  
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const oldFileName = doc.content.fileName;
    const newMemoryName = oldFileName.replace(/\.md$/, ''); // Remove .md extension
    
    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          'content.memoryName': newMemoryName,
          'metadata.tags': doc.metadata.tags.map((tag: string) => 
            tag === oldFileName.replace('.md', '') ? newMemoryName : tag
          )
        },
        $unset: {
          'content.fileName': '' // Remove old field
        }
      }
    );
    
    migrated++;
    logger.info(`Migrated: ${oldFileName} → ${newMemoryName}`);
  }
  
  logger.info(`Migration complete: ${migrated} documents updated`);
}

async function updateSearchQueries(collection: any) {
  logger.info('Updating any hardcoded search queries...');
  
  // Update any documents that might reference .md in searchableText
  const result = await collection.updateMany(
    { 
      searchableText: { $regex: /\.md/i }
    },
    [{
      $set: {
        searchableText: {
          $replaceAll: {
            input: '$searchableText',
            find: '.md',
            replacement: ''
          }
        }
      }
    }]
  );
  
  logger.info(`Updated ${result.modifiedCount} documents with .md references in searchableText`);
}

async function verifyMigration(collection: any) {
  logger.info('Verifying migration...');
  
  // Check for any remaining fileName fields
  const remaining = await collection.countDocuments({
    'content.fileName': { $exists: true }
  });
  
  if (remaining > 0) {
    logger.warn(`Found ${remaining} documents still with fileName field`);
  }
  
  // List all core memories with new structure
  const coreMemories = await collection.find({
    memoryClass: 'core'
  }).project({
    'content.memoryName': 1,
    'content.fileName': 1
  }).toArray();
  
  console.log('\n📚 Core Memories After Migration:');
  coreMemories.forEach((mem: any) => {
    const name = mem.content.memoryName || mem.content.fileName || 'unnamed';
    const status = mem.content.memoryName ? '✅' : '❌';
    console.log(`${status} ${name}`);
  });
}

async function main() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    logger.info('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('\n🔄 MongoDB Field Migration: fileName → memoryName\n');
    
    console.log('This migration will:');
    console.log('1. Rename content.fileName to content.memoryName');
    console.log('2. Remove .md extensions from core memory names');
    console.log('3. Update tags to match new names');
    console.log('4. Clean up any .md references in searchableText');
    console.log('\n');
    
    // Get confirmation
    if (process.argv[2] !== '--force') {
      console.log('Run with --force to execute migration');
      process.exit(0);
    }
    
    // Run migrations
    await migrateFileNameToMemoryName(collection);
    await updateSearchQueries(collection);
    await verifyMigration(collection);
    
    console.log('\n✅ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Update your code to use memoryName instead of fileName');
    console.log('2. Test reading core memories');
    console.log('3. Consider running memory_engineering_sync to update embeddings');
    
  } catch (error) {
    logger.error('Migration failed', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
main().catch(console.error);