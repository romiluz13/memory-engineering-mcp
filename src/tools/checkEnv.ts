import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export async function checkEnvTool(): Promise<CallToolResult> {
  try {
    // Get version from package.json
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgPath = join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const version = pkg.version;
    
    // List of environment variables that the MCP server uses
    const envVars = {
      // MongoDB
      MONGODB_URI: process.env.MONGODB_URI,
      MEMORY_ENGINEERING_DB: process.env.MEMORY_ENGINEERING_DB,
      MEMORY_ENGINEERING_COLLECTION: process.env.MEMORY_ENGINEERING_COLLECTION,
      MONGODB_MAX_POOL_SIZE: process.env.MONGODB_MAX_POOL_SIZE,
      MONGODB_MIN_POOL_SIZE: process.env.MONGODB_MIN_POOL_SIZE,
      
      // Voyage AI
      VOYAGE_API_KEY: process.env.VOYAGE_API_KEY,
      
      // Node environment
      NODE_ENV: process.env.NODE_ENV,
      
      // Working directory
      PWD: process.env.PWD,
      
      // MCP specific
      MCP_SERVER_NAME: process.env.MCP_SERVER_NAME,
      
      // Check if running in MCP context
      IS_MCP: process.env.IS_MCP,
    };
    
    // Check which env vars are set
    const envStatus: Record<string, { value?: string; status: string }> = {};
    
    for (const [key, value] of Object.entries(envVars)) {
      if (value !== undefined) {
        // Mask sensitive values
        if (key.includes('KEY') || key.includes('URI')) {
          const maskedValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
          envStatus[key] = { value: maskedValue, status: 'SET (masked)' };
        } else {
          envStatus[key] = { value, status: 'SET' };
        }
      } else {
        envStatus[key] = { status: 'NOT SET' };
      }
    }
    
    // Check if .env files exist
    const fs = await import('fs');
    const path = await import('path');
    
    const envFiles = {
      '.env': fs.existsSync(path.join(process.cwd(), '.env')),
      '.env.local': fs.existsSync(path.join(process.cwd(), '.env.local')),
    };
    
    // Get process info
    const processInfo = {
      cwd: process.cwd(),
      platform: process.platform,
      nodeVersion: process.version,
      argv: process.argv,
      execPath: process.execPath,
    };
    
    const report = {
      version: `Memory Engineering MCP v${version}`,
      timestamp: new Date().toISOString(),
      environmentVariables: envStatus,
      envFilesDetected: envFiles,
      processInfo,
      dotenvLoaded: {
        description: 'dotenv is loaded in src/index.ts with .env.local checked first, then .env',
        loadedFrom: 'MCP server startup'
      }
    };
    
    logger.info('Environment check completed', report);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error checking environment', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error checking environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}