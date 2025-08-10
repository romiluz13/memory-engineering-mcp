/**
 * Set Context Tool v13 - Session-level project binding
 * THE MOST IMPORTANT COMMAND - Solves context drift!
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { setActiveProject, getContextHeader } from '../utils/sessionContext.js';
import { getSyncRecommendations } from '../utils/frameworkDetection.js';
import { logger } from '../utils/logger.js';

const SetContextSchema = z.object({
  projectPath: z.string().describe('Path to the project directory'),
  projectName: z.string().optional().describe('Optional project name')
});

export async function setContextTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = SetContextSchema.parse(args);
    
    logger.info('🎯 SETTING PROJECT CONTEXT', params);
    
    // Set the active project
    const context = setActiveProject(params.projectPath, params.projectName);
    
    if (!context.activeProject) {
      throw new Error('\ud83d\udc80 CONTEXT SETTING FAILED! Unable to establish project binding!');
    }
    
    // Build success response
    let response = getContextHeader();
    
    response += `
✅ PROJECT CONTEXT ACTIVATED!

This project is now your active context for ALL commands.
All memory operations will use this project automatically.

${getSyncRecommendations(context.activeProject.framework)}

📊 Next Steps:
1. Check project status: memory_engineering_status
2. Initialize memories: memory_engineering_init --with-sync
3. Start working: Your context is saved!

💡 Pro Tips:
• This context persists across sessions
• Switch projects anytime with set_context
• View all projects with status --all

🔥 Your AI now knows EXACTLY where to work!`;
    
    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
    
  } catch (error) {
    logger.error('💀 SET CONTEXT FAILED!', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `💀 CONTEXT SETTING CATASTROPHE!

${error instanceof Error ? error.message : 'Unknown error'}

🆘 TROUBLESHOOTING:
1. Check path exists: ls "${(args as any)?.projectPath || 'path/not/provided'}"
2. Use absolute paths: /Users/you/project
3. Or use current dir: memory_engineering_set_context --projectPath "."

📁 Common Paths:
• Current directory: "."
• Parent directory: ".."
• Home directory: "~"
• Absolute: "/Users/username/Dev/project"

🔥 CANNOT PROCEED WITHOUT VALID PROJECT CONTEXT!`
        }
      ]
    };
  }
}
