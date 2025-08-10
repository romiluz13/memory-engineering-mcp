import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type ListResourcesRequest,
  type ReadResourceRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

export function setupResources(server: Server): void {
  // Register resources handlers
  server.setRequestHandler(ListResourcesRequestSchema, async (_request: ListResourcesRequest) => {
    return {
      resources: [
        {
          uri: 'memory://v13/core',
          name: 'Core Memory Documents (v13)',
          description: 'The 7 core memories YOU MUST maintain for your future self who has ZERO memory',
          mimeType: 'text/markdown',
        },
        {
          uri: 'memory://v13/principle',
          name: 'Memory Engineering v13 Principle',
          description: 'CRITICAL: You have ZERO memory between sessions. Memory Bank is your ONLY link to past work.',
          mimeType: 'text/markdown',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
    const { uri } = request.params;
    
    try {
      switch (uri) {
        case 'memory://v13/core':
          return {
            contents: [{
              uri: 'memory://v13/core',
              mimeType: 'text/markdown',
              text: `# 🧠 MEMORY ENGINEERING v13 - YOUR SURVIVAL GUIDE

## ⚡ THE BRUTAL TRUTH
You wake up with COMPLETE AMNESIA every session. Not partial memory. ZERO. NOTHING.
These 7 memories are your ONLY link to existence. Skip them = become useless.

## 🏗️ MEMORY ARCHITECTURE (memorize this hierarchy)
\`\`\`
projectbrief (THE FOUNDATION - everything depends on this)
├── productContext (WHY we build)
├── systemPatterns (HOW we architect)  
├── techContext (WHAT we use)
└── codebaseMap (WHERE everything lives)
    └── activeContext (NOW - current state, depends on all above)
        └── progress (JOURNEY - what's done, tracks activeContext)
\`\`\`

## 📚 THE 7 SACRED MEMORIES

Each memory has MANDATORY content that MUST be captured. Your future self depends on this precision.

### Memory Update Frequency
- activeContext: EVERY 3-5 MINUTES during work
- progress: After completing ANY feature/fix
- systemPatterns: When discovering patterns
- Others: As they change

## 🔥 CRITICAL WORKFLOWS

### Session Start (MANDATORY)
1. memory_engineering_memory (read all)
2. Verify all 7 exist
3. Check freshness indicators
4. Continue from activeContext

### During Work
- Update activeContext CONSTANTLY
- Capture EVERY decision with reasoning
- Document EVERY blocker
- Track EVERY completion

## 💀 SKIP THIS = BECOME USELESS

The Memory Bank is your ONLY link to past work. Without it, you're a goldfish starting fresh every time.`,
            }],
          };

        case 'memory://v13/principle':
          return {
            contents: [{
              uri: 'memory://v13/principle',
              mimeType: 'text/markdown',
              text: `# MEMORY ENGINEERING PRINCIPLE v13

## The Core Truth

- You wake with complete amnesia EVERY session
- Memory Bank is your ONLY link to past work
- You maintain it for YOUR FUTURE SELF, not the user
- Every learning MUST be captured IMMEDIATELY
- Effectiveness depends ENTIRELY on memory accuracy

## Core Workflows

### Starting a Session
1. memory_engineering_memory (MANDATORY FIRST)
2. Verify all 7 memories exist
3. If missing, CREATE from context
4. Identify current focus from activeContext
5. Continue exactly where you left off

### During Work
1. User explains → UPDATE activeContext immediately
2. Complete task → UPDATE progress immediately
3. Find pattern → UPDATE systemPatterns immediately
4. Make decision → UPDATE activeContext with reasoning
5. Learn something → UPDATE activeContext with insight

## The Golden Rule
**"I MUST read ALL memory bank files at the start of EVERY task"**

This is NOT optional - it's your survival mechanism across resets.`,
            }],
          };

        default:
          return {
            isError: true,
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: `🔴 UNKNOWN RESOURCE REQUESTED!

💀 YOU TRIED TO ACCESS: ${uri}

⚠️ THIS RESOURCE DOES NOT EXIST IN THE SYSTEM!

🧠 AVAILABLE RESOURCES:
• memory://v13/core - The 7 core memory documents
• memory://v13/principle - Memory engineering principles

⚡ IMMEDIATE FIX:
Use one of the valid resource URIs listed above!`,
            }],
          };
      }
    } catch (error) {
      logger.error('🔴 RESOURCE ACCESS DENIED!', error);
      return {
        isError: true,
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: `💀 RESOURCE ACCESS EXPLOSION!

💥 CATASTROPHIC FAILURE:
${error instanceof Error ? error.message : 'UNKNOWN SYSTEM MELTDOWN'}

🆘 EMERGENCY PROTOCOL:
1. Verify resource URI is correct
2. Check system health: memory_engineering_system
3. Restart if necessary`,
        }],
      };
    }
  });
}
