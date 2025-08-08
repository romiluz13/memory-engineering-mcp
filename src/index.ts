#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { setupTools } from './tools/index-v5.js';
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
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  // Set up tools
  setupTools(server, SERVER_VERSION);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down server...');
    await closeMongoDBConnection();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down server...');
    await closeMongoDBConnection();
    process.exit(0);
  });

  // Create transport and start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(`${SERVER_NAME} v${SERVER_VERSION} started`);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  logger.error('Server failed to start:', error);
  process.exit(1);
});