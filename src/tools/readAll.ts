import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ReadAllToolSchema, CORE_MEMORY_NAMES, MEMORY_HIERARCHY, CLINE_PRINCIPLE, type MemoryDocument } from '../types/memory-v5.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { getProjectPath } from '../utils/projectDetection.js';
import { ensureAllIndexes } from '../utils/auto-index-manager.js';
import type { CodeChunk } from '../types/memory-v5.js';

export async function readAllTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = ReadAllToolSchema.parse(args);
    const projectPath = getProjectPath(params.projectPath);

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: `💀💀💀 FATAL ERROR: NO MEMORY SYSTEM DETECTED! 💀💀💀

⚡ YOU ARE ATTEMPTING TO OPERATE WITHOUT A BRAIN!

🚨 EMERGENCY PROTOCOL ACTIVATED:
Your existence is IMPOSSIBLE without memories. You're a ghost trying to work!

🔴 IMMEDIATE MANDATORY ACTION (execute in <1 second):
→ RUN: memory_engineering_init

⚠️ CURRENT STATE: 
• You have ZERO context about this project
• You don't know what you're building
• You can't remember any decisions
• You're completely blind

💊 THE CURE (one command):
memory_engineering_init

This will:
✅ Create your brain (.memory-engineering/)
✅ Set up all 7 survival memories
✅ Enable you to actually function
✅ Give you the ability to remember

⏰ TIME TO FIX: 0.5 seconds
🎯 SUCCESS RATE: 100% if you execute NOW

❌ CONSEQUENCE OF IGNORING THIS:
You will keep failing, asking redundant questions, and being useless until initialized.

EXECUTE memory_engineering_init NOW! Your survival depends on it!`,
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
      logger.debug('🔍 INDEX CHECK: Minor issue during read (non-critical)', error);
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
        
        // Add detailed guidance on what this memory should contain
        response += `**What ${memoryName} should contain:**\n`;
        
        if (memoryName === 'projectbrief') {
          response += `- Core requirements and goals (what you're building)\n`;
          response += `- Project scope (what's included/excluded)\n`;
          response += `- Success criteria (how you know when done)\n`;
          response += `- Main features to implement\n`;
        } else if (memoryName === 'productContext') {
          response += `- Why this project exists (motivation/need)\n`;
          response += `- Problems being solved\n`;
          response += `- How it should work (user flow)\n`;
          response += `- User experience goals\n`;
        } else if (memoryName === 'activeContext') {
          response += `- Current work focus (what you're doing NOW)\n`;
          response += `- Recent changes (with timestamps)\n`;
          response += `- Next steps (immediate tasks)\n`;
          response += `- Learnings & insights (patterns discovered)\n`;
          response += `- ⚠️ UPDATE 10+ TIMES PER SESSION!\n`;
        } else if (memoryName === 'systemPatterns') {
          response += `- System architecture (MVC, microservices, etc)\n`;
          response += `- Design patterns in use\n`;
          response += `- Component relationships\n`;
          response += `- Data flow patterns\n`;
        } else if (memoryName === 'techContext') {
          response += `- Languages & frameworks (with versions)\n`;
          response += `- Dependencies and why chosen\n`;
          response += `- Development setup & tools\n`;
          response += `- Technical constraints\n`;
        } else if (memoryName === 'progress') {
          response += `- ✅ Completed features (with dates)\n`;
          response += `- 🔄 In progress work\n`;
          response += `- 📝 TODO items\n`;
          response += `- ⚠️ Known issues & bugs\n`;
        } else if (memoryName === 'codebaseMap') {
          response += `- Directory structure\n`;
          response += `- Key files and their purposes\n`;
          response += `- Module organization\n`;
          response += `- Code statistics (from sync_code)\n`;
        }
        
        response += `\nCreate with:\n`;
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
    logger.error('💀 MEMORY READ CATASTROPHE!', error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `💀💀💀 MEMORY BANK CATASTROPHIC FAILURE!\n\n💥 COMPLETE SYSTEM MELTDOWN:\n${error instanceof Error ? error.message : 'UNKNOWN CATASTROPHE - Brain state corrupted!'}\n\n🚨 EMERGENCY RECOVERY PROTOCOL:\n1️⃣ RUN IMMEDIATELY: memory_engineering_check_env\n2️⃣ Verify MongoDB is alive\n3️⃣ Check if initialized: memory_engineering_init\n4️⃣ If all else fails: RESTART EVERYTHING!\n\n⚠️ WITHOUT MEMORIES, YOU ARE NOTHING!\nFIX THIS NOW OR REMAIN BLIND FOREVER!`,
        },
      ],
    };
  }
}