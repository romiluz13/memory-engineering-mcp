import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ReadToolSchema, type ProjectConfig, type MemoryDocument } from '../types/memory.js';
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

    // Build query based on parameters
    const query: any = { projectId: config.projectId };
    
    if (params.fileName) {
      // Support both old and new field names during transition
      const cleanName = params.fileName.replace(/\.md$/, '');
      query.$or = [
        { 'content.fileName': params.fileName },     // Old field (with .md)
        { 'content.memoryName': cleanName },         // New field (no .md)
        { 'content.memoryName': params.fileName }    // In case someone passes with .md
      ];
    } else if (params.memoryClass) {
      query.memoryClass = params.memoryClass;
      if (params.memoryType) {
        query.memoryType = params.memoryType;
      }
    } else {
      // Default to showing all core memories
      query.memoryClass = 'core';
    }

    // Read from MongoDB
    const collection = getMemoryCollection();
    const documents = await collection
      .find(query)
      .sort({ 'metadata.importance': -1, 'metadata.freshness': -1 })
      .limit(params.fileName ? 1 : 10)
      .toArray();

    if (documents.length === 0) {
      // List available options
      const availableCore = await collection
        .find({ projectId: config.projectId, memoryClass: 'core' })
        .project({ 'content.fileName': 1, 'content.memoryName': 1 })
        .toArray();

      const memoryCounts = await collection.aggregate([
        { $match: { projectId: config.projectId } },
        { $group: { _id: { class: '$memoryClass', type: '$memoryType' }, count: { $sum: 1 } } },
        { $sort: { '_id.class': 1, '_id.type': 1 } }
      ]).toArray();

      return {
        content: [
          {
            type: 'text',
            text: `No memories found matching your query.

Available core memory files:
${availableCore.map((f) => {
  const name = f.content?.memoryName || f.content?.fileName || 'unnamed';
  return `- ${name}`;
}).join('\n')}

Memory distribution:
${memoryCounts.map(c => `- ${c._id.class}/${c._id.type}: ${c.count} memories`).join('\n')}

Examples:
- memory_engineering/read --fileName "systemPatterns"
- memory_engineering/read --memoryClass "working"
- memory_engineering/read --memoryClass "insight" --memoryType "pattern"`,
          },
        ],
      };
    }

    // Track access for evolution memory
    await collection.updateMany(
      { _id: { $in: documents.map(d => d._id) } },
      { 
        $set: { 'metadata.freshness': new Date() },
        $inc: { 'metadata.accessCount': 1 }
      }
    );

    // Format output based on memory class
    if (params.fileName || documents.length === 1) {
      // Single memory detail view
      const doc = documents[0];
      return formatSingleMemory(doc!);
    } else {
      // Multiple memories summary view
      return formatMultipleMemories(documents);
    }

  } catch (error) {
    logger.error('Read tool error:', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to read memory: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
    };
  }
}

function formatSingleMemory(doc: MemoryDocument): CallToolResult {
  let content = '';
  
  // Header with metadata
  content += `# Memory: ${doc.memoryClass}/${doc.memoryType}\n\n`;
  content += `**Importance**: ${doc.metadata.importance}/10\n`;
  content += `**Access Count**: ${doc.metadata.accessCount}\n`;
  content += `**Last Accessed**: ${doc.metadata.freshness.toISOString()}\n`;
  content += `**Created**: ${doc.createdAt.toISOString()}\n`;
  
  if (doc.metadata.version) {
    content += `**Version**: ${doc.metadata.version}\n`;
  }
  
  if (doc.metadata.tags.length > 0) {
    content += `**Tags**: ${doc.metadata.tags.join(', ')}\n`;
  }
  
  content += '\n---\n\n';
  
  // Content based on memory class
  switch (doc.memoryClass) {
    case 'core':
      // Support both old fileName and new memoryName
      const memoryDisplayName = doc.content.memoryName || doc.content.fileName || 'unnamed';
      content += `## ${memoryDisplayName}\n\n`;
      content += doc.content.markdown || '[No content]';
      break;
      
    case 'working':
      if (doc.content.event) {
        const event = doc.content.event;
        content += `## Event: ${event.action}\n\n`;
        content += `**Time**: ${event.timestamp}\n`;
        content += `**Duration**: ${event.duration}ms\n\n`;
        
        if (event.context) {
          content += `### Context\n\`\`\`json\n${JSON.stringify(event.context, null, 2)}\n\`\`\`\n\n`;
        }
        
        if (event.solution) {
          content += `### Solution\n${event.solution}\n\n`;
        }
        
        if (event.outcome) {
          content += `### Outcome\n`;
          content += `- **Success**: ${event.outcome.success}\n`;
          if (event.outcome.errors) {
            content += `- **Errors**: ${event.outcome.errors.map(e => e.message).join(', ')}\n`;
          }
        }
      }
      break;
      
    // Removed insight case - not needed in back-to-basics
    // Removed evolution case - not needed in back-to-basics
  }
  
  // Removed code references section - not needed in back-to-basics
  
  // Add contextual hints based on what was read
  let hint = '';
  const memoryName = doc.content.memoryName || doc.content.fileName?.replace(/\.md$/, '');
  if (doc.memoryClass === 'core' && memoryName === 'activeContext') {
    hint = '\n\n📝 Starting new work? Remember to update this file with: memory_engineering_update --fileName "activeContext"';
  } else if (doc.memoryClass === 'core' && memoryName === 'systemPatterns') {
    hint = '\n\n💡 Found a new pattern? Add it with: memory_engineering_update --fileName "systemPatterns"';
  }

  return {
    content: [
      {
        type: 'text',
        text: content + hint,
      },
    ],
  };
}

function formatMultipleMemories(docs: MemoryDocument[]): CallToolResult {
  let content = `# Found ${docs.length} memories\n\n`;
  
  // Group by class
  const byClass = docs.reduce((acc, doc) => {
    const memClass = doc.memoryClass;
    if (!acc[memClass]) acc[memClass] = [];
    acc[memClass].push(doc);
    return acc;
  }, {} as Record<string, MemoryDocument[]>);
  
  for (const [memClass, memories] of Object.entries(byClass)) {
    content += `## ${memClass.charAt(0).toUpperCase() + memClass.slice(1)} Memories (${memories.length})\n\n`;
    
    memories.forEach(doc => {
      content += `### `;
      
      // Title based on content
      switch (doc.memoryClass) {
        case 'core':
          content += doc.content.memoryName || doc.content.fileName?.replace(/\.md$/, '') || 'Unnamed';
          break;
        case 'working':
          content += doc.content.event?.action || 'Event';
          break;
        // Removed insight and evolution cases
      }
      
      content += `\n`;
      content += `- **Importance**: ${doc.metadata.importance}/10\n`;
      content += `- **Accessed**: ${doc.metadata.accessCount} times\n`;
      content += `- **Tags**: ${doc.metadata.tags.join(', ')}\n`;
      content += `- **ID**: ${doc._id}\n\n`;
    });
  }
  
  content += `\n---\n`;
  content += `Use memory_engineering/read with --fileName or specific --memoryClass/--memoryType to view details.`;
  
  return {
    content: [
      {
        type: 'text',
        text: content,
      },
    ],
  };
}