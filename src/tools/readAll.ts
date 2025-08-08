import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ReadAllToolSchema, CORE_MEMORY_NAMES, MEMORY_HIERARCHY, CLINE_PRINCIPLE, type MemoryDocument } from '../types/memory-v5.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { ensureAllIndexes } from '../utils/auto-index-manager.js';
import type { CodeChunk } from '../types/memory-v5.js';

export async function readAllTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = ReadAllToolSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Memory Engineering not initialized for this project.

Run: memory_engineering_init

This will set up your 7 core memory files following Cline's structure.`,
          },
        ],
      };
    }

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const collection = getMemoryCollection();
    
    // Ensure indexes exist (fast if already created)
    try {
      const codeCollection = getDb().collection<CodeChunk>('memory_engineering_code');
      await ensureAllIndexes(collection, codeCollection);
    } catch (error) {
      logger.debug('Index check during read:', error);
    }

    // Fetch all 6 core memories
    const memories = await collection.find({
      projectId: config.projectId,
      memoryName: { $in: CORE_MEMORY_NAMES }
    }).toArray() as MemoryDocument[];

    // Create a map for easy access
    const memoryMap = new Map(memories.map(m => [m.memoryName, m]));

    // Build response following Cline's principle
    let response = `# 🧠 Memory Bank - Complete Context\n\n`;
    response += `**${CLINE_PRINCIPLE}**\n\n`;
    response += `Project: ${config.projectName || 'Unnamed Project'}\n`;
    response += `Memories Found: ${memories.length}/${CORE_MEMORY_NAMES.length}\n\n`;

    // Show memories in hierarchy order
    const hierarchyOrder: typeof CORE_MEMORY_NAMES[number][] = [
      'projectbrief',
      'productContext', 
      'systemPatterns',
      'techContext',
      'activeContext',
      'progress',
      'codebaseMap'
    ];

    for (const memoryName of hierarchyOrder) {
      const memory = memoryMap.get(memoryName);
      const info = MEMORY_HIERARCHY[memoryName];
      
      response += `## 📄 ${memoryName}\n`;
      response += `*${info.description}*\n`;
      
      if (info.dependsOn.length > 0) {
        response += `Depends on: ${info.dependsOn.join(', ')}\n`;
      }
      
      response += '\n';
      
      if (memory) {
        response += memory.content;
        response += '\n\n';
        
        // Update access count
        await collection.updateOne(
          { _id: memory._id },
          { 
            $inc: { 'metadata.accessCount': 1 },
            $set: { 'metadata.lastAccessed': new Date() }
          }
        );
      } else {
        response += `⚠️ Not created yet. This memory ${info.dependsOn.length > 0 ? 'depends on: ' + info.dependsOn.join(', ') : 'is foundational'}.\n\n`;
        response += `Create with:\n`;
        response += `\`\`\`bash\n`;
        response += `memory_engineering_update --memoryName "${memoryName}" --content "..."\n`;
        response += `\`\`\`\n\n`;
      }
      
      response += '---\n\n';
    }

    // Add guidance for missing memories
    const missingCount = CORE_MEMORY_NAMES.length - memories.length;
    if (missingCount > 0) {
      response += `## 🚀 Next Steps\n\n`;
      response += `You have ${missingCount} memories to create. `;
      
      // Find first missing memory in hierarchy
      for (const memoryName of hierarchyOrder) {
        if (!memoryMap.has(memoryName)) {
          const info = MEMORY_HIERARCHY[memoryName];
          
          // Check if dependencies are met
          const dependenciesMet = info.dependsOn.every(dep => memoryMap.has(dep as typeof CORE_MEMORY_NAMES[number]));
          
          if (dependenciesMet) {
            response += `Start with **${memoryName}** - ${info.description}.\n\n`;
            break;
          }
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };

  } catch (error) {
    logger.error('Read all tool error:', error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to read memories: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
}