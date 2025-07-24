import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ExecutePRPSchema, type ProjectConfig } from '../types/memory.js';
import type { z } from 'zod';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { getContextEngineeringTemplate } from '../services/context-engineering.js';

type ExecutePRPParams = z.infer<typeof ExecutePRPSchema>;

/**
 * Context Engineering Phase 2: Execute PRP with validation loops
 * Fetches the original /execute-prp system prompt from MongoDB
 */
export async function executePRPTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = ExecutePRPSchema.parse(args) as ExecutePRPParams;
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [{
          type: 'text',
          text: 'Memory Engineering not initialized. Run memory_engineering/init first.',
        }],
      };
    }

    const config: ProjectConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

    // Find the most recent PRP to execute
    let prpName = params.prp;
    
    if (!prpName) {
      // Auto-detect the most recent PRP
      prpName = (await findLatestPRP(config.projectId, projectPath)) || undefined;
      if (!prpName) {
        return {
          content: [{
            type: 'text',
            text: `No PRP found to execute. Either:
1. Generate a PRP first: memory_engineering/generate-prp --request "your request"
2. Specify PRP: memory_engineering/execute-prp --prp "prp-name"

Available PRPs can be found via: memory_engineering/search --query "prp_"`,
          }],
        };
      }
    }

    logger.info('Fetching Context Engineering /execute-prp template...');
    
    // Fetch the exact original /execute-prp system prompt from MongoDB
    const systemPrompt = await getContextEngineeringTemplate('execute-prp');

    logger.info(`🚀 Context Engineering Phase 2: Implementation & Validation`);

    return {
      content: [{
        type: 'text',
        text: `🚀 **Context Engineering Phase 2: Implementation & Validation**

**PRP to Execute**: ${prpName}
**Project**: ${config.projectId}

---

## 🤖 AI Assistant Instructions

You are now in Context Engineering Phase 2. Follow these instructions EXACTLY:

${systemPrompt}

---

## 🎯 Your Task

**PRP File**: ${prpName}

**Steps to Follow**:
1. **Load PRP**: Use \`memory_engineering/read --fileName "prp_${prpName}.md"\` to load the PRP
2. **ULTRATHINK**: Plan implementation strategy based on PRP content
3. **Execute Implementation**: Follow the PRP blueprint exactly
4. **Run Validation Gates**: Execute each validation command from the PRP
5. **Self-Correction**: Fix failures and retry until all gates pass
6. **Complete**: Ensure all requirements are met

**Available Tools**:
- \`memory_engineering/read\` - Read PRP and memory files
- \`memory_engineering/search\` - Find implementation patterns
- \`memory_engineering/update\` - Update progress
- Standard coding tools (bash, file operations, etc.)

🚀 **Start implementation NOW following the Context Engineering methodology above!**`,
      }],
    };

  } catch (error) {
    logger.error('PRP execution error:', error);
    return {
      content: [{
        type: 'text',
        text: `Error fetching Context Engineering template: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      }],
    };
  }
}

// Helper function to find the latest PRP
async function findLatestPRP(projectId: string, projectPath: string): Promise<string | null> {
  try {
    // First check MongoDB for latest PRP
    const collection = getMemoryCollection();
    const latestPRP = await collection.findOne(
      { 
        projectId, 
        fileName: { $regex: /^prp_.*\.md$/ }
      },
      { sort: { 'metadata.lastUpdated': -1 } }
    );

    if (latestPRP) {
      return latestPRP.fileName.replace('prp_', '').replace('.md', '');
    }

    // Fallback: check PRPs directory
    const prpsDir = join(projectPath, 'PRPs');
    if (existsSync(prpsDir)) {
      const fs = await import('fs');
      const files = fs.readdirSync(prpsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));
      
      return files.length > 0 ? files[files.length - 1] || null : null;
    }

    return null;
  } catch (error) {
    logger.error('Error finding latest PRP:', error);
    return null;
  }
}