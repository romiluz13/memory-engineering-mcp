import { join, basename } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { InitToolSchema, type ProjectConfig } from '../types/memory-v5.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { createHash } from 'crypto';
import { createSearchIndexes } from '../utils/search-indexes-v5.js';
import { ensureAllIndexes, startIndexBackgroundTask } from '../utils/auto-index-manager.js';
import type { CodeChunk } from '../types/memory-v5.js';

const MEMORY_ENGINEERING_DIR = '.memory-engineering';
const CONFIG_FILE = 'config.json';

function generateProjectId(projectPath: string): string {
  // Create deterministic project ID from path
  return createHash('md5').update(projectPath).digest('hex').substring(0, 8) + 
         '-' + 
         createHash('md5').update(projectPath).digest('hex').substring(8, 12) +
         '-' +
         createHash('md5').update(projectPath).digest('hex').substring(12, 16) +
         '-' +
         createHash('md5').update(projectPath).digest('hex').substring(16, 20) +
         '-' +
         createHash('md5').update(projectPath).digest('hex').substring(20, 32);
}

export async function initTool(params: unknown): Promise<CallToolResult> {
  try {
    const validatedParams = InitToolSchema.parse(params);
    const projectPath = validatedParams.projectPath || process.cwd();
    const projectName = validatedParams.projectName || basename(projectPath);
    
    logger.info('Initializing Memory Engineering v5 - Cline\'s Structure', { projectPath, projectName });

    // Create .memory-engineering directory
    const memoryDir = join(projectPath, MEMORY_ENGINEERING_DIR);
    if (!existsSync(memoryDir)) {
      mkdirSync(memoryDir, { recursive: true });
    }

    // Check if already initialized
    const configPath = join(memoryDir, CONFIG_FILE);
    let isNewProject = true;
    let projectId: string;
    
    if (existsSync(configPath)) {
      try {
        const existingConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
        projectId = existingConfig.projectId;
        isNewProject = false;
        logger.info('Found existing project configuration', { projectId });
      } catch {
        projectId = generateProjectId(projectPath);
      }
    } else {
      projectId = generateProjectId(projectPath);
    }

    // Create/update configuration
    const config: ProjectConfig = {
      projectId,
      projectPath,
      name: projectName,
      createdAt: new Date(),
      memoryVersion: '5.0'  // New version: Cline's Structure
    };
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Initialize MongoDB collections
    const memoryCollection = getMemoryCollection();
    const codeCollection = getDb().collection<CodeChunk>('memory_engineering_code');
    
    // Create all indexes automatically (including Atlas Search)
    logger.info('Auto-creating all indexes for Memory Engineering v5...');
    
    // Use the new auto-index manager for complete setup
    await ensureAllIndexes(memoryCollection, codeCollection);
    
    // Start background task to ensure indexes later (for Atlas delays)
    startIndexBackgroundTask(memoryCollection, codeCollection);
    
    // Still call the old function for compatibility
    const indexResult = await createSearchIndexes(memoryCollection, codeCollection);
    
    // Build index status message
    let indexStatus = '';
    if (indexResult.success) {
      indexStatus = '✅ All indexes configured successfully';
    } else {
      indexStatus = '⚠️  Index configuration needs attention:\n';
      indexResult.details
        .filter(d => d.includes('❌') || d.includes('⚠️'))
        .forEach(d => {
          indexStatus += `   ${d}\n`;
        });
    }

    // NO MEMORIES CREATED! Still organic growth, but with Cline's structure
    
    return {
      content: [
        {
          type: 'text',
          text: `Memory Engineering v5 Initialized - Cline's Structure 🧠

Project: ${projectName}
ID: ${projectId}
Status: ${isNewProject ? 'New project initialized' : 'Existing project found'}
Location: ${memoryDir}

## What's New in v5:
- ✅ Cline's 7 core memory structure
- ✅ NO working memories (they create garbage)
- ✅ ALL learnings go in activeContext
- ✅ Enhanced codebaseMap with Voyage AI embeddings
- ✅ Smart code search (similar, implements, uses, pattern)

## Core Principle:
**"I MUST read ALL memory bank files at the start of EVERY task"**

## The 7 Core Memories:
1. **projectbrief** - What you're building
2. **productContext** - Who needs this and why  
3. **activeContext** - Current work and learnings (ALL learnings here!)
4. **systemPatterns** - Architecture and conventions
5. **techContext** - Technology stack and setup
6. **progress** - Completed features and lessons
7. **codebaseMap** - File structure + code embeddings

## MongoDB Configuration:
- Memory Collection: memory_engineering_documents
- Code Collection: memory_engineering_code
- Search: Auto-configured (vector + text)
- Atlas Indexes: Creating in background (ready in 1-2 min)

${indexStatus}

## Next Steps:
1. Start with: memory_engineering_read_all
2. Create your first memory (usually activeContext):
   memory_engineering_update --memoryName "activeContext" --content "..."
3. For code search, first sync your code:
   memory_engineering_sync_code --patterns "**/*.{ts,js,py}"

Remember: No working memories, no templates. Just 7 core memories that grow naturally.

${!indexResult.success ? `⚠️  IMPORTANT: Some features may not work until indexes are configured.
   Check MongoDB Atlas console to ensure all search indexes are active.` : ''}`
        }
      ]
    };
  } catch (error) {
    logger.error('Init v5 tool error:', error);
    throw error;
  }
}