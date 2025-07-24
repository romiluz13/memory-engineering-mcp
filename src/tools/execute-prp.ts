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

**🔄 CONTEXT ENGINEERING PHASE 2 - MANDATORY STEPS (DO NOT SKIP ANY!):**

1. **Load PRP**: Use \`memory_engineering/read --fileName "prp_${prpName}.md"\` to load the PRP
   - This contains ALL research from Phase 1 including patterns, constraints, and validation gates
   - The PRP is your complete implementation blueprint - follow it EXACTLY

2. **ULTRATHINK**: Plan implementation strategy based on PRP content
   - Analyze the comprehensive research findings embedded in the PRP
   - Plan step-by-step implementation following discovered patterns
   - Identify potential issues and mitigation strategies

3. **Execute Implementation**: Follow the PRP blueprint exactly
   - Use patterns and approaches discovered in Phase 1 research
   - Reference code examples and architectural decisions from memory files
   - Follow validation approaches discovered in research

4. **Run Validation Gates**: Execute each validation command from the PRP
   - TypeScript compilation: \`npm run typecheck\`
   - Linting: \`npm run lint\`
   - Testing: \`npm run test\`
   - Build process: \`npm run build\`
   - Any custom validation specified in the PRP

5. **Self-Correction**: Fix failures and retry until all gates pass
   - If validation fails, analyze error against PRP guidance
   - Apply fixes based on patterns and solutions in PRP
   - Re-run validation gates until all pass

6. **Update Progress**: \`memory_engineering/update --fileName "progress.md"\`
   - Document what was implemented
   - Note any issues encountered and solutions applied
   - Update project status for future reference

**🚨 CRITICAL REMINDER - CONTEXT ENGINEERING METHODOLOGY:**
- You are implementing a researched solution, not improvising
- All patterns, constraints, and approaches were discovered in Phase 1
- The PRP contains comprehensive context - use it as your guide
- Do not deviate from discovered patterns without validation
- Complete validation is mandatory - no shortcuts

**Available Tools**:
- \`memory_engineering/read\` - Read PRP and memory files
- \`memory_engineering/search\` - Find additional implementation patterns if needed
- \`memory_engineering/update\` - Update progress and memory files
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