/**
 * Status Tool v13 - Complete system state visibility
 * Shows EVERYTHING about current project and memory state
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadSessionContext, getContextHeader } from '../utils/sessionContext.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { CORE_MEMORY_NAMES } from '../types/memory-v5.js';
import { logger } from '../utils/logger.js';
import type { CodeChunk } from '../types/memory-v5.js';

const StatusSchema = z.object({
  all: z.boolean().optional().describe('Show all projects in history'),
  verbose: z.boolean().optional().describe('Show detailed information')
});

export async function statusTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = StatusSchema.parse(args);
    const context = loadSessionContext();
    
    let response = '';
    
    // Show active project
    if (context.activeProject) {
      response += getContextHeader();
      
      // Get memory stats
      const collection = getMemoryCollection();
      const configPath = join(context.activeProject.path, '.memory-engineering', 'config.json');
      
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        
        // Get all memories for this project
        const memories = await collection.find({
          projectId: config.projectId
        }).toArray();
        
        // Get code chunks
        const codeCollection = getDb().collection<CodeChunk>('memory_engineering_code');
        const codeCount = await codeCollection.countDocuments({
          projectId: config.projectId
        });
        
        response += '\n📊 MEMORY STATUS:\n';
        response += '─'.repeat(50) + '\n';
        
        // Check each core memory
        for (const memoryName of CORE_MEMORY_NAMES) {
          const memory = memories.find(m => m.memoryName === memoryName);
          
          if (memory) {
            const age = Date.now() - new Date(memory.metadata.lastModified).getTime();
            const hours = Math.floor(age / (1000 * 60 * 60));
            const freshness = hours < 1 ? '🟢 FRESH' : 
                            hours < 6 ? '🟡 RECENT' : 
                            hours < 24 ? '🟠 STALE' : 
                            '🔴 ANCIENT';
            
            const size = memory.content.length;
            const sizeStr = size > 1000 ? `${Math.floor(size/1000)}k chars` : `${size} chars`;
            
            response += `${freshness} ${memoryName.padEnd(20)} ${sizeStr.padStart(10)} (${hours}h ago)\n`;
            
            if (params.verbose) {
              // Show first line of content
              const firstLine = memory.content.split('\n')[0].substring(0, 50);
              response += `     "${firstLine}..."\n`;
            }
          } else {
            response += `❌ MISSING ${memoryName}\n`;
          }
        }
        
        response += '\n🔍 CODE SYNC STATUS:\n';
        response += '─'.repeat(50) + '\n';
        
        if (codeCount > 0) {
          // Get sync metadata if available
          const syncMeta = await collection.findOne({
            projectId: config.projectId,
            memoryName: 'codebaseMap'
          });
          
          response += `✅ Code chunks indexed: ${codeCount}\n`;
          
          if (syncMeta) {
            const syncAge = Date.now() - new Date(syncMeta.metadata.lastModified).getTime();
            const syncHours = Math.floor(syncAge / (1000 * 60 * 60));
            response += `⏱️ Last sync: ${syncHours}h ago\n`;
          }
          
          // Get file stats
          const uniqueFiles = await codeCollection.distinct('metadata.filePath', {
            projectId: config.projectId
          });
          response += `📁 Files indexed: ${uniqueFiles.length}\n`;
          
          if (params.verbose && uniqueFiles.length > 0) {
            response += '\nRecent files:\n';
            uniqueFiles.slice(0, 5).forEach(file => {
              response += `  • ${file}\n`;
            });
          }
        } else {
          response += `❌ No code synced yet\n`;
          response += `💡 Run: memory_engineering_sync_code\n`;
        }
        
      } else {
        response += '\n⚠️ Project not initialized!\n';
        response += '💡 Run: memory_engineering_init --with-sync\n';
      }
      
    } else {
      response += '🔴 NO ACTIVE PROJECT!\n\n';
      response += 'Set one with: memory_engineering_set_context --projectPath "/path/to/project"\n';
    }
    
    // Show project history if requested
    if (params.all && context.history.length > 0) {
      response += '\n📚 PROJECT HISTORY:\n';
      response += '─'.repeat(50) + '\n';
      
      context.history.forEach((proj, idx) => {
        const age = Date.now() - new Date(proj.lastAccessed).getTime();
        const days = Math.floor(age / (1000 * 60 * 60 * 24));
        response += `${idx + 1}. ${proj.name.padEnd(20)} ${days}d ago\n`;
        response += `   ${proj.path}\n`;
      });
      
      response += '\n💡 Switch with: memory_engineering_set_context --projectPath "[path]"\n';
    }
    
    // System health
    response += '\n🏥 SYSTEM HEALTH:\n';
    response += '─'.repeat(50) + '\n';
    
    // Check MongoDB
    try {
      await getDb().admin().ping();
      response += '✅ MongoDB: Connected\n';
    } catch {
      response += '❌ MongoDB: DISCONNECTED!\n';
    }
    
    // Check Voyage
    const voyageKey = process.env.VOYAGE_API_KEY;
    if (voyageKey && voyageKey.startsWith('pa-')) {
      response += '✅ Voyage AI: API key present\n';
    } else {
      response += '❌ Voyage AI: No valid API key!\n';
    }
    
    // Version - Get dynamically from package.json
    // First try the active project path, then current directory, then parent directories
    let packageJsonPath = '';
    if (context.activeProject?.path) {
      packageJsonPath = join(context.activeProject.path, 'package.json');
    }
    if (!packageJsonPath || !existsSync(packageJsonPath)) {
      packageJsonPath = join(process.cwd(), 'package.json');
    }
    if (!existsSync(packageJsonPath)) {
      // Try parent directory (in case we're in a subdirectory)
      packageJsonPath = join(process.cwd(), '..', 'package.json');
    }
    
    if (existsSync(packageJsonPath)) {
      const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      response += `📦 Version: v${packageJson.version} (PRODUCTION READY)\n`;
    } else {
      response += `📦 Version: Unable to determine (package.json not found)\n`;
    }
    
    // Settings
    response += '\n⚙️ SETTINGS:\n';
    response += '─'.repeat(50) + '\n';
    response += `Verbose: ${context.settings.verbose ? 'ON' : 'OFF'}\n`;
    response += `Auto-sync: ${context.settings.autoSync ? 'ON' : 'OFF'}\n`;
    response += `Show context: ${context.settings.showContext ? 'ON' : 'OFF'}\n`;
    
    if (!params.verbose) {
      response += '\n💡 For more details: memory_engineering_status --verbose\n';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
    
  } catch (error) {
    logger.error('💀 STATUS CHECK FAILED!', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `💀 STATUS CHECK CATASTROPHE!

${error instanceof Error ? error.message : 'Unknown error'}

🆘 Try running:
1. memory_engineering_check_env - Check environment
2. memory_engineering_set_context --projectPath "." - Set project
3. memory_engineering_doctor - Full diagnostics`
        }
      ]
    };
  }
}
