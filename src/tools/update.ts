import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { 
  UpdateToolSchema, 
  type ProjectConfig, 
  type MemoryDocument,
  createCoreMemory,
  createWorkingMemory,
  // Removed insight and evolution - simplified to 2 classes
  CORE_MEMORY_FILES
} from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';

export async function updateTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = UpdateToolSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Memory Engineering not initialized for this project. Run memory_engineering/init first.',
          },
        ],
      };
    }

    const config: ProjectConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    const collection = getMemoryCollection();

    // Handle different update types
    if (params.fileName) {
      // Legacy: Update core memory by fileName
      return await updateCoreMemoryByFileName(collection, config.projectId, params.fileName, params.content);
    } else if (params.memoryClass) {
      // New: Create memories based on class
      return await createNewMemory(collection, config.projectId, params);
    } else {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Either fileName or memoryClass must be specified',
          },
        ],
      };
    }

  } catch (error) {
    logger.error('Update tool error:', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to update memory: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
    };
  }
}

async function updateCoreMemoryByFileName(
  collection: any,
  projectId: string,
  fileName: string,
  content: string
): Promise<CallToolResult> {
  // Strip .md extension if provided - we don't use file extensions in MongoDB
  const memoryName = fileName.replace(/\.md$/, '');
  
  // Check if it's a known core memory
  const validNames = CORE_MEMORY_FILES.map(f => f.replace(/\.md$/, ''));
  if (!validNames.includes(memoryName)) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Unknown core memory: ${memoryName}\n\nValid core memories:\n${validNames.join('\n')}\n\nExample: memory_engineering_update --fileName "activeContext" --content "..."`,
        },
      ],
    };
  }

  // Find existing core memory by memoryName (not fileName)
  const existing = await collection.findOne({
    projectId,
    memoryClass: 'core',
    'content.memoryName': memoryName,
  });

  const now = new Date();

  if (!existing) {
    // Create new core memory with memoryName (no .md)
    const memory = createCoreMemory(projectId, memoryName, content);
    await collection.insertOne(memory);

    logger.info(`Created new core memory: ${memoryName} for project: ${projectId}`);

    return {
      content: [
        {
          type: 'text',
          text: `Created new core memory: ${memoryName}

Remember to run memory_engineering_sync to generate embeddings for search.`,
        },
      ],
    };
  }

  // Update existing core memory
  const result = await collection.updateOne(
    {
      _id: existing._id,
    },
    {
      $set: {
        'content.markdown': content,
        'metadata.freshness': now,
        updatedAt: now,
        contentVector: undefined, // Clear embeddings
        searchableText: extractSearchableText(content),
      },
      $inc: {
        'metadata.version': 1,
      },
    },
  );

  if (result.modifiedCount === 0) {
    throw new Error('Failed to update core memory');
  }

  logger.info(`Updated core memory: ${memoryName} for project: ${projectId}`);

  return {
    content: [
      {
        type: 'text',
        text: `Updated core memory: ${memoryName}
Version: ${(existing.metadata.version || 0) + 1}

Note: Embeddings cleared. Run memory_engineering_sync to regenerate for search.

Next steps:
${memoryName === 'activeContext' ? '- Continue updating this memory as you progress through your work' : ''}
${memoryName === 'systemPatterns' ? '- Search for similar patterns to ensure consistency' : ''}
${memoryName === 'progress' ? '- Update activeContext for your next task' : ''}`,
      },
    ],
  };
}

async function createNewMemory(
  collection: any,
  projectId: string,
  params: any
): Promise<CallToolResult> {
  let memory: Partial<MemoryDocument>;
  let description = '';

  switch (params.memoryClass) {
    case 'working':
      // Parse content as JSON for working memory
      try {
        const eventData = JSON.parse(params.content);
        memory = createWorkingMemory(projectId, {
          timestamp: new Date(),
          action: eventData.action || 'unknown',
          context: eventData.context || {},
          solution: eventData.solution,
          duration: eventData.duration,
          outcome: eventData.outcome,
        });
        description = `Created working memory for action: ${eventData.action}`;
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Working memory content must be valid JSON with action, context, and optional solution/outcome',
            },
          ],
        };
      }
      break;

    default:
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Invalid memory class: ${params.memoryClass}. Valid: working (core memories use fileName parameter)`,
          },
        ],
      };
  }

  // Add searchable text
  memory.searchableText = extractSearchableText(params.content);

  // Insert the memory
  const result = await collection.insertOne(memory);
  
  logger.info(`Created ${params.memoryClass} memory: ${result.insertedId}`);

  return {
    content: [
      {
        type: 'text',
        text: `${description}
ID: ${result.insertedId}
Class: ${params.memoryClass}
Type: ${params.memoryType || memory.memoryType}

Run memory_engineering_sync to generate embeddings for search.

${params.memoryClass === 'working' ? 'Working memory saved with 30-day TTL. Search for it when you encounter similar issues.' : ''}`,
      },
    ],
  };
}

function extractSearchableText(content: string): string {
  // Extract text content for search, removing markdown formatting
  return content
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/```[^`]*```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\n{3,}/g, '\n\n') // Normalize newlines
    .trim();
}