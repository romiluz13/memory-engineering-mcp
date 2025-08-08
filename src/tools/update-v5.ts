import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { UpdateToolSchema, MEMORY_HIERARCHY, CORE_MEMORY_NAMES, type MemoryDocument } from '../types/memory-v5.js';
import { getMemoryCollection } from '../db/connection.js';
import { validateMemoryStructure } from '../utils/validation-v5.js';
import { generateDocumentEmbedding } from '../embeddings/voyage-v5.js';
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
            text: 'Memory Engineering not initialized. Run memory_engineering_init first.',
          },
        ],
      };
    }

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const collection = getMemoryCollection();

    // Check dependencies
    const memoryInfo = MEMORY_HIERARCHY[params.memoryName];
    if (memoryInfo.dependsOn.length > 0) {
      const existingMemories = await collection.find({
        projectId: config.projectId,
        memoryName: { $in: memoryInfo.dependsOn }
      }).toArray();

      const missingDependencies = memoryInfo.dependsOn.filter(
        (dep: string) => !existingMemories.some(m => m.memoryName === dep)
      );

      if (missingDependencies.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: `⚠️ Cannot create ${params.memoryName} yet!

This memory depends on: ${missingDependencies.join(', ')}

Create the dependencies first, following the hierarchy:
projectbrief → productContext/systemPatterns/techContext → activeContext → progress`,
            },
          ],
        };
      }
    }

    // Validate content structure
    const validation = validateMemoryStructure(params.memoryName, params.content);
    
    if (!validation.isValid && validation.requiredSections.length > 0) {
      let response = `⚠️ Memory structure needs improvement\n\n`;
      response += `📝 ${params.memoryName} - ${memoryInfo.description}\n\n`;
      response += `Missing required sections:\n`;
      
      validation.requiredSections.forEach((section: any) => {
        response += `\n• **${section.name}**: ${section.description}\n`;
        if (section.example) {
          response += `  Example:\n  ${section.example}\n`;
        }
      });

      response += `\nWould you like to:\n`;
      response += `1. Update anyway (not recommended)\n`;
      response += `2. Add the missing sections to your content\n\n`;
      response += `💡 Tip: Good memories follow Cline's structure. This ensures consistency across sessions.`;

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    }

    // Check if memory exists
    const existing = await collection.findOne({
      projectId: config.projectId,
      memoryName: params.memoryName
    });

    const now = new Date();
    
    // Generate embedding for the content
    let contentVector: number[] | undefined;
    try {
      contentVector = await generateDocumentEmbedding(params.content);
      logger.info(`Generated embedding for ${params.memoryName} (${contentVector.length} dimensions)`);
    } catch (error) {
      logger.error(`Failed to generate embedding for ${params.memoryName}:`, error);
      // Continue without embedding rather than failing the update
    }
    
    if (existing) {
      // Update existing
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            content: params.content,
            contentVector,
            updatedAt: now,
            'metadata.lastModified': now,
            'metadata.version': (existing.metadata?.version || 0) + 1
          }
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: `✅ Updated ${params.memoryName}

Version: ${(existing.metadata?.version || 0) + 1}
Modified: ${now.toISOString()}

${validation.isValid ? '✨ Memory structure validated!' : '⚠️ Structure could be improved'}

Next: Run \`memory_engineering_read_all\` to see all memories in context.`,
          },
        ],
      };
    } else {
      // Create new
      const newMemory: MemoryDocument = {
        projectId: config.projectId,
        memoryName: params.memoryName,
        content: params.content,
        contentVector,
        metadata: {
          version: 1,
          lastModified: now,
          accessCount: 0
        },
        createdAt: now,
        updatedAt: now
      };

      await collection.insertOne(newMemory);

      // Count total memories
      const totalCount = await collection.countDocuments({
        projectId: config.projectId
      });

      let response = `✅ Created ${params.memoryName}\n\n`;
      response += `Progress: ${totalCount}/${CORE_MEMORY_NAMES.length} core memories created\n\n`;

      if (totalCount < 6) {
        // Suggest next memory
        const allMemories = await collection.find({
          projectId: config.projectId
        }).toArray();
        
        const createdNames = allMemories.map(m => m.memoryName);
        const hierarchyOrder = ['projectbrief', 'productContext', 'systemPatterns', 'techContext', 'activeContext', 'progress'] as const;
        
        for (const nextName of hierarchyOrder) {
          if (!createdNames.includes(nextName)) {
            const nextInfo = MEMORY_HIERARCHY[nextName];
            const dependenciesMet = nextInfo.dependsOn.every(dep => createdNames.includes(dep as any));
            
            if (dependenciesMet) {
              response += `## Next Memory: ${nextName}\n`;
              response += `*${nextInfo.description}*\n\n`;
              response += `Create with:\n`;
              response += `\`\`\`bash\n`;
              response += `memory_engineering_update --memoryName "${nextName}" --content "..."\n`;
              response += `\`\`\``;
              break;
            }
          }
        }
      } else {
        response += `🎉 All ${CORE_MEMORY_NAMES.length} core memories created!\n\n`;
        response += `Remember: Start every session with \`memory_engineering_read_all\``;
      }

      return {
        content: [
          {
            type: 'text',
            text: response,
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
          text: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
}