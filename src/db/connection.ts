import type { Db, Collection } from 'mongodb';
import { MongoClient } from 'mongodb';
import { logger } from '../utils/logger.js';
import type { MemoryDocument, ExecutionState } from '../types/memory.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(uri, {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
    });

    await client.connect();
    
    const dbName = process.env.MEMORY_ENGINEERING_DB || 'memory_engineering';
    db = client.db(dbName);
    
    // Verify connection
    await db.admin().ping();
    logger.info(`Connected to MongoDB database: ${dbName}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function closeMongoDBConnection(): Promise<void> {
  if (client) {
    try {
      await client.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToMongoDB() first.');
  }
  return db;
}

export function getMemoryCollection(): Collection<MemoryDocument> {
  const collectionName = process.env.MEMORY_ENGINEERING_COLLECTION || 'memory_engineering_documents';
  return getDb().collection<MemoryDocument>(collectionName);
}

export function getExecutionStateCollection(): Collection<ExecutionState> {
  const collectionName = 'memory_engineering_execution_states';
  return getDb().collection<ExecutionState>(collectionName);
}