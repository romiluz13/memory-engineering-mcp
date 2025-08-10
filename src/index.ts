#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { setupToolsConsolidated as setupTools } from './tools/index-v6-consolidated.js';
import { setupResources } from './tools/resources.js';
import { connectToMongoDB, closeMongoDBConnection } from './db/connection.js';
import { logger } from './utils/logger.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables (check .env.local first, then .env)
config({ path: '.env.local' });
config({ path: '.env' });

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const SERVER_NAME = 'memory-engineering-mcp';
const SERVER_VERSION = packageJson.version;

async function main(): Promise<void> {
  // Create server instance
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {
          subscribe: false,
          listChanged: false,
        },
      },
    },
  );

  // Connect to MongoDB
  try {
    await connectToMongoDB();
    logger.info('🌐 MONGODB NEURAL LINK ESTABLISHED - Memory system online!');
  } catch (error) {
    logger.error('💀 MONGODB CONNECTION CATASTROPHE - Memory system OFFLINE!', error);
    process.exit(1);
  }

  // Set up consolidated tools (6 instead of 10)
  setupTools(server);
  
  // Set up resources
  setupResources(server);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('🛑 GRACEFUL SHUTDOWN INITIATED - Saving all memories...');
    await closeMongoDBConnection();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('🛑 GRACEFUL SHUTDOWN INITIATED - Saving all memories...');
    await closeMongoDBConnection();
    process.exit(0);
  });

  // Create transport and start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(`🚀 ${SERVER_NAME} v${SERVER_VERSION} ACTIVATED - AI Memory System ONLINE!`);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('💀 UNCAUGHT EXCEPTION - System crash imminent!', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('💥 UNHANDLED REJECTION - Promise explosion!', error);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  logger.error('🔴 SERVER STARTUP CATASTROPHE - Memory system FAILED!', error);
  process.exit(1);
});