import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { UpdateToolSchema, type ProjectConfig, type MemoryFileType } from '../types/memory.js';
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

    // Update in MongoDB
    const collection = getMemoryCollection();
    const now = new Date();

    // Check if file exists
    const existing = await collection.findOne({
      projectId: config.projectId,
      fileName: params.fileName,
    });

    if (!existing) {
      // Create new file if it doesn't exist (for custom files)
      const fileType: MemoryFileType = params.fileName.replace('.md', '') as MemoryFileType;
      
      await collection.insertOne({
        projectId: config.projectId,
        fileName: params.fileName,
        content: params.content,
        metadata: {
          lastUpdated: now,
          version: 1,
          type: fileType === 'projectbrief' || 
                fileType === 'productContext' || 
                fileType === 'activeContext' ||
                fileType === 'systemPatterns' ||
                fileType === 'techContext' ||
                fileType === 'progress' ? fileType : 'custom',
          fileSize: Buffer.byteLength(params.content, 'utf-8'),
        },
        references: extractReferences(params.content),
        createdAt: now,
        updatedAt: now,
      });

      logger.info(`Created new memory file: ${params.fileName} for project: ${config.projectId}`);

      return {
        content: [
          {
            type: 'text',
            text: `Created new memory file: ${params.fileName}

Remember to run memory_engineering/sync to generate embeddings for search.`,
          },
        ],
      };
    }

    // Update existing file
    const result = await collection.updateOne(
      {
        projectId: config.projectId,
        fileName: params.fileName,
      },
      {
        $set: {
          content: params.content,
          'metadata.lastUpdated': now,
          'metadata.fileSize': Buffer.byteLength(params.content, 'utf-8'),
          references: extractReferences(params.content),
          updatedAt: now,
          contentVector: undefined, // Clear embeddings - will be regenerated
        },
        $inc: {
          'metadata.version': 1,
        },
      },
    );

    if (result.modifiedCount === 0) {
      throw new Error('Failed to update memory file');
    }

    logger.info(`Updated memory file: ${params.fileName} for project: ${config.projectId}`);

    return {
      content: [
        {
          type: 'text',
          text: `Updated memory file: ${params.fileName}
Version: ${existing.metadata.version + 1}

Note: Embeddings have been cleared. Run memory_engineering/sync to regenerate them for search functionality.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Update tool error:', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to update memory file: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
    };
  }
}

function extractReferences(content: string): string[] {
  // Extract references to other memory files
  const references: string[] = [];
  const patterns = [
    /\b(projectbrief|productContext|activeContext|systemPatterns|techContext|progress)\.md\b/gi,
    /\bprp_[a-z0-9-]+\.md\b/gi,
  ];
  
  patterns.forEach(regex => {
    const matches = content.match(regex);
    if (matches) {
      references.push(...matches.map(m => m.toLowerCase()));
    }
  });

  return [...new Set(references)];
}