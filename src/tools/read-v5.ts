import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ReadToolSchema, CORE_MEMORY_NAMES } from '../types/memory-v5.js';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';

export async function readTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = ReadToolSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Validate memory name
    if (!CORE_MEMORY_NAMES.includes(params.memoryName as any)) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Invalid memory name: ${params.memoryName}\n\nValid names: ${CORE_MEMORY_NAMES.join(', ')}`,
          },
        ],
      };
    }

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Memory Engineering not initialized. Run memory_engineering_init first.',
          },
        ],
      };
    }

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const collection = getMemoryCollection();

    // Find the memory
    const memory = await collection.findOne({
      projectId: config.projectId,
      memoryName: params.memoryName
    });

    if (!memory) {
      return {
        content: [
          {
            type: 'text',
            text: `Memory "${params.memoryName}" not found.\n\nCreate it with:\nmemory_engineering_update --memoryName "${params.memoryName}" --content "..."`,
          },
        ],
      };
    }

    // Return full content
    let response = `# ${params.memoryName}\n\n`;
    response += `Last updated: ${memory.metadata.lastModified.toISOString()}\n\n`;
    response += memory.content;

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };

  } catch (error) {
    logger.error('Read tool error:', error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Read failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
}