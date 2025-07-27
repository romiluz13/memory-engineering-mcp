import { join } from 'path';
import { existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { updateTool } from './update.js';

// Schema for memory bank update
export const MemoryBankUpdateSchema = z.object({
  projectPath: z.string().optional(),
  updates: z.object({
    activeContext: z.string().optional(),
    systemPatterns: z.string().optional(),
    progress: z.string().optional(),
    techContext: z.string().optional(),
    projectbrief: z.string().optional(),
    productContext: z.string().optional(),
    codebaseMap: z.string().optional(),
  }),
});

export async function memoryBankUpdateTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = MemoryBankUpdateSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Memory Engineering not initialized for this project. Run memory_engineering_init first.',
          },
        ],
      };
    }

    if (!params.updates || Object.keys(params.updates).length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No updates provided. Please specify which memories to update.

Example usage:
memory_engineering_memory_bank_update --updates '{
  "activeContext": "Working on: implementing authentication...",
  "progress": "Completed: basic auth flow...",
  "systemPatterns": "Authentication pattern: JWT with refresh tokens..."
}'`,
          },
        ],
      };
    }

    // Update each specified memory
    const results: string[] = [];
    const errors: string[] = [];

    for (const [memoryName, content] of Object.entries(params.updates)) {
      if (!content) continue;

      try {
        // Use the existing update tool for each memory
        const result = await updateTool({
          fileName: memoryName, // The update tool handles both with and without .md
          content,
          projectPath,
        });

        if (result.isError) {
          errors.push(`Failed to update ${memoryName}: ${result.content?.[0]?.text || 'Unknown error'}`);
        } else {
          results.push(`Updated ${memoryName}`);
        }
      } catch (error) {
        errors.push(`Error updating ${memoryName}: ${error}`);
      }
    }

    // Build response
    const response = `Memory Bank Update Complete

Results:
${results.join('\n')}
${errors.length > 0 ? '\n' + errors.join('\n') : ''}

Updated ${results.length} of ${Object.keys(params.updates).length} memories

Next Steps:
1. Run memory_engineering_sync to generate embeddings
2. Continue with your work
3. Remember to update memories as you progress`;

    logger.info('Memory bank update completed', { 
      updated: results.length,
      failed: errors.length 
    });

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };

  } catch (error) {
    logger.error('Memory bank update error:', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to update memory bank: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
    };
  }
}