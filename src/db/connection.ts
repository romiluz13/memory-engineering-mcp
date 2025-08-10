import type { Db, Collection } from 'mongodb';
import { MongoClient } from 'mongodb';
import { logger } from '../utils/logger.js';
import type { MemoryDocument } from '../types/memory-v5.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(uri, {
      // Connection pool settings
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '100'),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5'),

      // Retry and reliability settings (official MongoDB driver options)
      retryWrites: true,                    // Enable retryable writes
      retryReads: true,                     // Enable retryable reads
      serverSelectionTimeoutMS: 30000,     // 30s server selection timeout
      connectTimeoutMS: 30000,              // 30s connection timeout
      socketTimeoutMS: 0,                   // No socket timeout (recommended for long operations)
      heartbeatFrequencyMS: 10000,          // 10s server monitoring interval

      // Additional reliability options
      maxIdleTimeMS: 300000,                // 5min max idle time for connections
      waitQueueTimeoutMS: 10000,            // 10s wait queue timeout
    });

    await client.connect();
    
    const dbName = process.env.MEMORY_ENGINEERING_DB || 'memory_engineering';
    db = client.db(dbName);
    
    // Verify connection
    await db.admin().ping();
    logger.info(`🌐 MONGODB NEURAL LINK ESTABLISHED: ${dbName} database online!`);
  } catch (error) {
    logger.error('💀 MONGODB CONNECTION EXPLODED!', error);
    throw error;
  }
}

export async function closeMongoDBConnection(): Promise<void> {
  if (client) {
    try {
      await client.close();
      logger.info('🚪 MONGODB CONNECTION TERMINATED - Brain offline');
    } catch (error) {
      logger.error('⚠️ MONGODB DISCONNECT FAILED - Connection stuck!', error);
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

// Re-export original functions for backward compatibility
export { connectToMongoDB as connectDB }