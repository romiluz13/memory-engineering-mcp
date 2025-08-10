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
    
    // Build rich diagnostic response
    let richResponse = `🔬 ENVIRONMENT DIAGNOSTIC COMPLETE - System Health Report 🏥\n\n`;
    
    // Version status
    richResponse += `📦 VERSION STATUS:\n`;
    richResponse += `• Current: ${report.version}\n`;
    richResponse += `• Status: ${report.version.includes(version) ? '✅ LATEST VERSION!' : '⚠️ Update available (run: npm install -g memory-engineering-mcp@latest)'}\n\n`;
    
    // Critical services
    richResponse += `🔐 CRITICAL SERVICES:\n`;
    const mongoStatus = envStatus.MONGODB_URI?.status === 'SET (masked)';
    const voyageStatus = envStatus.VOYAGE_API_KEY?.status === 'SET (masked)';
    
    richResponse += `• MongoDB: ${mongoStatus ? '✅ Connected' : '🔴 NOT CONFIGURED!'}\n`;
    richResponse += `• Voyage AI: ${voyageStatus ? '✅ API Key Present' : '🔴 NO API KEY!'}\n\n`;
    
    // Working directory
    richResponse += `📁 WORKING DIRECTORY:\n`;
    richResponse += `• Current: ${processInfo.cwd}\n`;
    richResponse += `• Status: ${processInfo.cwd.includes('node_modules') ? '⚠️ Wrong directory!' : '✅ Looks correct'}\n\n`;
    
    // Environment files
    richResponse += `📄 CONFIGURATION FILES:\n`;
    richResponse += `• .env: ${envFiles['.env'] ? '✅ Found' : '⚠️ Not found (optional)'}\n`;
    richResponse += `• .env.local: ${envFiles['.env.local'] ? '✅ Found' : '⚠️ Not found (recommended)'}\n\n`;
    
    // Overall health
    const healthScore = (mongoStatus ? 40 : 0) + (voyageStatus ? 40 : 0) + (processInfo.cwd.includes('node_modules') ? 0 : 20);
    richResponse += `🏥 OVERALL HEALTH: ${healthScore}%\n`;
    if (healthScore === 100) {
      richResponse += `✅✅✅ PERFECT! All systems operational!\n\n`;
    } else if (healthScore >= 80) {
      richResponse += `✅ Good health, minor issues only\n\n`;
    } else if (healthScore >= 60) {
      richResponse += `⚠️ Functional but needs attention\n\n`;
    } else {
      richResponse += `🔴 CRITICAL ISSUES DETECTED!\n\n`;
    }
    
    // Action items
    if (!mongoStatus || !voyageStatus) {
      richResponse += `🚨 IMMEDIATE ACTIONS REQUIRED:\n\n`;
      
      if (!mongoStatus) {
        richResponse += `1️⃣ **Configure MongoDB:**\n`;
        richResponse += `   • Create .env.local file\n`;
        richResponse += `   • Add: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname\n`;
        richResponse += `   • Get URI from MongoDB Atlas → Connect → Drivers\n\n`;
      }
      
      if (!voyageStatus) {
        richResponse += `2️⃣ **Configure Voyage AI:**\n`;
        richResponse += `   • Sign up at https://voyageai.com (free tier available)\n`;
        richResponse += `   • Add to .env.local: VOYAGE_API_KEY=pa-xxxxx\n`;
        richResponse += `   • Restart after adding key\n\n`;
      }
    }
    
    // Success path
    if (healthScore === 100) {
      richResponse += `⚡ NEXT STEPS (You're ready!):\n`;
      richResponse += `1. Run: memory_engineering_init (if new project)\n`;
      richResponse += `2. Run: memory_engineering_read_all (if existing project)\n`;
      richResponse += `3. Start working with full memory power!\n`;
    }
    
    // Add raw JSON at the end for debugging
    richResponse += `\n📊 RAW DIAGNOSTIC DATA:\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\``;
    
    return {
      content: [
        {
          type: 'text',
          text: richResponse,
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