import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ReadToolSchema, type ProjectConfig } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';

export async function readTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = ReadToolSchema.parse(args);
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

    // Read from MongoDB
    const collection = getMemoryCollection();
    const document = await collection.findOne({
      projectId: config.projectId,
      fileName: params.fileName,
    });

    if (!document) {
      // List available files
      const availableFiles = await collection
        .find({ projectId: config.projectId })
        .project({ fileName: 1 })
        .toArray();

      return {
        content: [
          {
            type: 'text',
            text: `File not found: ${params.fileName}

Available memory files:
${availableFiles.map((f) => `- ${f.fileName}`).join('\n')}`,
          },
        ],
      };
    }

    logger.info(`Read memory file: ${params.fileName} for project: ${config.projectId}`);

    // Detect references to other memory files
    const detectedReferences: string[] = [];
    const memoryFiles = ['projectbrief.md', 'productContext.md', 'activeContext.md', 
                        'systemPatterns.md', 'techContext.md', 'progress.md'];
    
    memoryFiles.forEach(file => {
      if (file !== params.fileName && 
          (document.content.includes(file) || 
           document.content.toLowerCase().includes(file.replace('.md', '')))) {
        detectedReferences.push(file);
      }
    });

    // Also detect PRP file references
    const prpRegex = /\bprp_[a-z0-9-]+\.md\b/gi;
    const prpMatches = document.content.match(prpRegex);
    if (prpMatches) {
      prpMatches.forEach(match => {
        if (match.toLowerCase() !== params.fileName.toLowerCase()) {
          detectedReferences.push(match.toLowerCase());
        }
      });
    }

    // Track access for freshness (simple update to lastUpdated)
    await collection.updateOne(
      { projectId: config.projectId, fileName: params.fileName },
      { $set: { 'metadata.lastAccessed': new Date() } }
    );

    // Build related files section
    const relatedSection = detectedReferences.length > 0
      ? `\n## Related Memories
${detectedReferences.map(ref => `- ${ref} (use memory_engineering/read to view)`).join('\n')}\n`
      : '';

    return {
      content: [
        {
          type: 'text',
          text: `# Memory: ${params.fileName}

Last Updated: ${document.metadata.lastUpdated.toISOString()}
Version: ${document.metadata.version}
Size: ${(document.metadata.fileSize / 1024).toFixed(1)}KB
Type: ${document.metadata.type}
${relatedSection}
---

${document.content}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Read tool error:', error);
    throw error;
  }
}