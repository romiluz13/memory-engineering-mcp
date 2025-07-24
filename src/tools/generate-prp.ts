import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GeneratePRPSchema, type ProjectConfig } from '../types/memory.js';
import type { z } from 'zod';
import { logger } from '../utils/logger.js';
import { getContextEngineeringTemplate } from '../services/context-engineering.js';

type GeneratePRPParams = z.infer<typeof GeneratePRPSchema>;

/**
 * Context Engineering Phase 1: Generate PRP from simple user request
 * Fetches the original /generate-prp system prompt from MongoDB
 */
export async function generatePRPTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = GeneratePRPSchema.parse(args) as GeneratePRPParams;
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
    const userRequest = params.request;

    logger.info('Fetching Context Engineering /generate-prp template...');
    
    // Fetch the exact original /generate-prp system prompt from MongoDB
    const systemPrompt = await getContextEngineeringTemplate('generate-prp');

    logger.info('🎯 Context Engineering Phase 1: Research & PRP Generation');

    return {
      content: [{
        type: 'text',
        text: `🎯 **Context Engineering Phase 1: Research & PRP Generation**

**Your Request**: "${userRequest}"
**Project**: ${config.projectId}

---

## 🤖 AI Assistant Instructions

You are now in Context Engineering Phase 1. Follow these instructions EXACTLY:

${systemPrompt}

---

## 🎯 Your Task

**Feature Request**: ${userRequest}

**Steps to Follow**:
1. **Research Process**: Follow the research steps in the system prompt above
2. **Use Memory Engineering Tools**: 
   - \`memory_engineering/search --query "[relevant patterns]"\` to find existing patterns
   - \`memory_engineering/read --fileName "[relevant-file.md]"\` to read project context
3. **ULTRATHINK**: Deep analysis before writing the PRP
4. **Generate PRP**: Create comprehensive implementation blueprint
5. **Store PRP**: Use \`memory_engineering/update --fileName "prp_[feature-name].md" --content "[PRP content]"\` to store the PRP

**🔄 CRITICAL: AUTOMATIC PHASE 2 TRIGGER**
After storing the PRP, you MUST IMMEDIATELY proceed to Phase 2 without waiting for user input:

6. **Auto-Execute Phase 2**: \`memory_engineering/execute-prp\` - This will automatically detect and implement the PRP you just created

**⚠️ DO NOT STOP after Phase 1! The Context Engineering workflow requires BOTH phases to complete successfully.**

🚀 **Start your research NOW following the Context Engineering methodology above!**`,
      }],
    };

  } catch (error) {
    logger.error('PRP generation error:', error);
    return {
      content: [{
        type: 'text',
        text: `Error fetching Context Engineering template: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      }],
    };
  }
}

