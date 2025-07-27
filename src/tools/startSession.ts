import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { type ProjectConfig } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';

// Schema for start session tool
export const StartSessionSchema = z.object({
  projectPath: z.string().optional(),
  skipReading: z.boolean().optional(), // ONLY for testing
});

// Global session state (reset on each server start)
let sessionStarted = false;
let lastSessionProject: string | null = null;

export async function startSessionTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = StartSessionSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Memory Engineering not initialized for this project. Run memory_engineering_init first.',
          },
        ],
      };
    }

    const config: ProjectConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    
    // Check if session already started for this project
    if (sessionStarted && lastSessionProject === config.projectId && !params.skipReading) {
      return {
        content: [
          {
            type: 'text',
            text: '✅ Session already started for this project. You have access to all memories.',
          },
        ],
      };
    }

    // Get MongoDB collection
    const collection = getMemoryCollection();

    // MANDATORY: Read ALL core memory documents
    const coreMemories = await collection
      .find({
        projectId: config.projectId,
        memoryClass: 'core',
      })
      .sort({ 'metadata.importance': -1 })
      .toArray();

    if (coreMemories.length < 6) {
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ Warning: Only found ${coreMemories.length} of 6 core memory documents. Some may be missing.

Run memory_engineering_init to create missing core memories.`,
        },
      ],
    };
  }

  // Build the mandatory reading output
  let output = `# 🧠 Memory Engineering Session Started

## Mandatory Memory Reading Complete

As per the original Memory Bank discipline, I have read ALL core memory documents:

`;

  // Find and display activeContext FIRST (most important)
  const activeContext = coreMemories.find(m => 
    m.content.memoryName === 'activeContext' || 
    m.content.fileName === 'activeContext.md'
  );

  if (activeContext) {
    output += `### 📍 Active Context (Current Focus)\n\n`;
    output += activeContext.content.markdown || '[Empty - needs update]';
    output += '\n\n---\n\n';
  }

  // Then show other core memories
  const otherMemories = coreMemories.filter(m => {
    const name = m.content.memoryName || m.content.fileName?.replace(/\.md$/, '');
    return name !== 'activeContext';
  });

  for (const memory of otherMemories) {
    const memoryName = memory.content.memoryName || memory.content.fileName?.replace(/\.md$/, '') || 'unnamed';
    const displayName = memoryName.charAt(0).toUpperCase() + memoryName.slice(1);
    
    output += `### 📄 ${displayName}\n\n`;
    
    // Truncate very long content for readability
    const content = memory.content.markdown || '[Empty]';
    if (content.length > 1000) {
      output += content.substring(0, 1000) + '\n\n... [truncated for session start - use memory_engineering_read to see full content]\n\n';
    } else {
      output += content + '\n\n';
    }
    
    output += '---\n\n';
  }

  // Update access counts for all core memories
  await collection.updateMany(
    { _id: { $in: coreMemories.map(m => m._id) } },
    { 
      $set: { 'metadata.freshness': new Date() },
      $inc: { 'metadata.accessCount': 1 }
    }
  );

  // Mark session as started
  sessionStarted = true;
  lastSessionProject = config.projectId;

  // Add workflow guidance
  output += `## ✅ Session Ready

I have read all ${coreMemories.length} core memory documents as required.

### 🎯 Next Steps:
1. **If activeContext is empty/outdated** → Update it first
2. **For new features** → Search for patterns: \`memory_engineering_search --query "authentication"\`
3. **After solving problems** → Create working memory: \`memory_engineering_update --memoryClass "working"\`
4. **When done** → Update progress: \`memory_engineering_update --fileName "progress"\`

### 📝 Remember:
- This is the MANDATORY start to every session
- Always update activeContext when starting new work
- Use "update memory bank" to systematically update all relevant files
`;

  logger.info('Session started with mandatory reading', { 
    projectId: config.projectId,
    memoriesRead: coreMemories.length 
  });

  return {
    content: [
      {
        type: 'text',
        text: output,
      },
    ],
  };

  } catch (error) {
    logger.error('Start session error:', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to start session: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
    };
  }
}

// Helper to check if session is active
export function isSessionActive(projectId?: string): boolean {
  if (!sessionStarted) return false;
  if (projectId && lastSessionProject !== projectId) return false;
  return true;
}

// Helper to enforce session requirement
export function enforceSession(projectId: string): CallToolResult | null {
  if (!isSessionActive(projectId)) {
    return {
      content: [
        {
          type: 'text',
          text: `⚠️ Session not started! 

As per Memory Bank discipline, you MUST start each session by reading all core memories.

Run: memory_engineering_start_session

This is MANDATORY and ensures you have full context before any work.`,
        },
      ],
    };
  }
  return null;
}