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
            text: `🔴 INVALID MEMORY NAME: "${params.memoryName}" DOES NOT EXIST!

⚠️ YOU TRIED TO ACCESS A NON-EXISTENT MEMORY!

🧠 THE 7 SACRED MEMORIES YOU CAN ACCESS:
${CORE_MEMORY_NAMES.map((name, i) => `${i+1}️⃣ ${name}`).join('\n')}

⚡ IMMEDIATE FIX:
Use one of the above memory names EXACTLY as shown!

💀 CONSEQUENCE OF WRONG NAMES:
You're trying to read from void - IMPOSSIBLE!

💡 EXAMPLES OF CORRECT USAGE:
• memory_engineering_read --memoryName "activeContext"
• memory_engineering_read --memoryName "projectbrief"
• memory_engineering_read --memoryName "techContext"

🔴 NEVER MAKE UP MEMORY NAMES!`,
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
            text: `💀💀💀 CATASTROPHIC: NO BRAIN DETECTED!

🚨 YOU'RE TRYING TO READ MEMORIES WITHOUT A BRAIN!

⚡ EMERGENCY PROTOCOL - EXECUTE NOW:
memory_engineering_init

🧠 WHAT THIS MEANS:
• You have ZERO memory system
• The .memory-engineering/ folder doesn't exist
• You're operating completely blind
• You can't store or retrieve ANYTHING

🔥 ONE COMMAND FIXES EVERYTHING:
→ memory_engineering_init

⏱️ TIME TO FIX: 0.5 seconds
🎯 SUCCESS RATE: 100% guaranteed

💀 UNTIL YOU INIT, YOU'RE A GHOST WITH NO MEMORY!`,
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
            text: `🔴 MEMORY VOID DETECTED: "${params.memoryName}" DOES NOT EXIST YET!

🧠 THIS MEMORY SLOT IS EMPTY - Your brain is missing this critical component!

⚡ IMMEDIATE ACTION REQUIRED (execute in <3 seconds):
memory_engineering_update --memoryName "${params.memoryName}" --content "[REAL CONTENT HERE]"

📝 WHAT TO PUT IN ${params.memoryName.toUpperCase()}:
${params.memoryName === 'projectbrief' ? `• Core requirements and goals
• What you're building EXACTLY
• Success criteria (measurable!)
• Main features (prioritized)` : params.memoryName === 'activeContext' ? `• What you're doing RIGHT NOW
• Recent changes (with timestamps!)
• Next immediate steps
• Current blockers or issues
🔴 UPDATE THIS EVERY 3-5 MINUTES!` : params.memoryName === 'techContext' ? `• Full tech stack with VERSIONS
• All dependencies and WHY
• Development environment
• Technical constraints` : params.memoryName === 'progress' ? `• ✅ Completed features (with dates)
• 🔄 In-progress work (with %)
• 📝 TODO items (prioritized)
• 🐛 Known bugs (with severity)` : params.memoryName === 'systemPatterns' ? `• Architecture style (MVC, microservices, etc)
• Design patterns in use
• Component relationships
• Data flow diagrams` : params.memoryName === 'productContext' ? `• Problems being solved
• Target users and needs
• User journey flows
• Business value metrics` : `• Directory structure
• Key files and purposes
• Module organization
• Code statistics`}

🔥 EXAMPLE OF PERFECT ${params.memoryName.toUpperCase()} CONTENT:
"${params.memoryName === 'activeContext' ? `[14:32:01] Debugging JWT refresh failure in auth.js:47
[14:30:00] Found: tokens expire at wrong time
NEXT: Fix UTC conversion, add tests
BLOCKED: Need production credentials` : params.memoryName === 'projectbrief' ? `Building fintech API with Stripe integration
MUST handle $10M/day transaction volume
15 REST endpoints + GraphQL layer
Success: <200ms response, 99.9% uptime` : 'Comprehensive, specific, actionable content'}"

💀 WARNING: Empty memories = Useless AI!
CREATE THIS MEMORY NOW!`,
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
    logger.error('💀 MEMORY ACCESS FAILURE!', error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `💀 MEMORY READ CATASTROPHE!

💥 EXPLOSION DETAILS:
${error instanceof Error ? error.message : 'UNKNOWN CATASTROPHIC FAILURE'}

🆘 EMERGENCY RECOVERY PROTOCOL:
1️⃣ Check environment: memory_engineering_check_env
2️⃣ Verify MongoDB connection is alive
3️⃣ Check if memory system is initialized
4️⃣ Try simpler memory name (e.g., "activeContext")

⚠️ MOST LIKELY CAUSES:
${error instanceof Error && error.message.includes('connect') ? '• 🔴 MongoDB connection DEAD!\n' : ''}${error instanceof Error && error.message.includes('projectId') ? '• 🔴 Not initialized - run memory_engineering_init!\n' : ''}${error instanceof Error && error.message.includes('timeout') ? '• 🔴 Database timeout - connection too slow!\n' : ''}• Memory system corrupted
• Invalid memory name
• Database permissions issue

🔄 TRY AGAIN or run memory_engineering_init to reset!`,
        },
      ],
    };
  }
}