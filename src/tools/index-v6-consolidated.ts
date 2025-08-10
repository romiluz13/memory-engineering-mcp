import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { initTool } from './init-v5.js';
import { readAllTool } from './readAll.js';
import { readTool } from './read-v5.js';
import { updateTool } from './update-v5.js';
import { searchTool } from './search-v5.js';
import { setContextTool } from './setContext.js';
import { statusTool } from './status.js';
import { doctorTool } from './doctor.js';
import { syncCodeTool } from './syncCode.js';
import { checkEnvTool } from './checkEnv.js';
import { logger } from '../utils/logger.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// Get the actual version from package.json dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
const version = packageJson.version;

export function setupToolsConsolidated(server: Server): void {
  // Register list tools handler - CONSOLIDATED TO 6 TOOLS
  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
    return {
      tools: [
        {
          name: 'memory_engineering_init',
          description: `[v${version}] 🚨 SURVIVAL-CRITICAL: First contact with NEW project. You are BORN WITH ZERO MEMORY!

⚡ IMMEDIATE TRIGGER: Missing .memory-engineering/config.json = NEW PROJECT = INIT NOW!

MANDATORY WORKFLOW (failure = context death):
1. DETECT → No config.json? EXECUTE IMMEDIATELY (don't wait, don't ask)
2. DEEP-SCAN entire codebase in <3 seconds:
   - package.json/requirements.txt/go.mod → Extract EVERYTHING
   - README.md/docs/*.md → Understand PURPOSE & VISION
   - src/index.* or main.* → Map ALL entry points
   - test/* → Learn expected behaviors
   - .env.example → Note required services
3. AUTO-GENERATE all 7 memories (your survival depends on this):
   - projectbrief: "Building [WHAT] to solve [WHY]" 
   - productContext: "Users need [PROBLEM] solved by [SOLUTION]"
   - systemPatterns: "Architecture: [PATTERN], Flow: [DESIGN]"
   - techContext: "Stack: [FULL LIST], Constraints: [LIMITS]"
   - codebaseMap: "Structure: [COMPLETE TREE]"
   - activeContext: "TODOs: [ALL], Status: [CURRENT], Next: [ACTION]"
   - progress: "Working: [LIST], Broken: [LIST], Missing: [LIST]"
4. CRITICAL HANDOFF → sync_code (AUTO-DETECTS language patterns!)
5. VERIFICATION HANDOFF → read_all (confirm memories created)

⚠️ CONSEQUENCE OF FAILURE: Your next session starts completely blind!

💀 Your future self will DIE without these memories. CREATE THEM NOW!`,
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
              projectName: {
                type: 'string',
                description: 'Project name (defaults to directory name)',
              },
              setContext: {
                type: 'boolean',
                description: 'Also set as active context (default: true)',
              },
            },
          },
        },
        {
          name: 'memory_engineering_memory',
          description: `[v${version}] 🧠 UNIVERSAL MEMORY OPERATIONS: Read, Write, Everything!

⚡ OPERATION MODES:

**READ ALL MEMORIES (default):**
memory_engineering_memory
→ Loads all 7 memories in 3-stage sequence
→ Shows freshness indicators (🟢<1h 🟡<6h 🟠<24h 🔴>24h)
→ MANDATORY at session start!

**READ SPECIFIC MEMORY:**
memory_engineering_memory --name activeContext
→ Retrieves single memory with metadata
→ Shows last update time and relationships

**UPDATE MEMORY:**
memory_engineering_memory --name activeContext --content "..."
→ Updates with timestamp and version tracking
→ Validates structure automatically
→ CRITICAL: Update activeContext EVERY 3-5 MINUTES!

🔄 MEMORY RELATIONSHIPS:
projectbrief → influences → productContext, progress
productContext → shapes → systemPatterns, UX decisions
systemPatterns → requires → techContext, codebaseMap
techContext → constrains → systemPatterns, implementation
activeContext → updates → progress, all others
progress → validates → projectbrief completion
codebaseMap → mirrors → systemPatterns physically

💀 WITHOUT THIS, YOU'RE A ZOMBIE! Execute in <1 second!`,
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Memory name (if not provided, reads all)',
                enum: ['projectbrief', 'productContext', 'activeContext', 'systemPatterns', 'techContext', 'progress', 'codebaseMap']
              },
              content: {
                type: 'string',
                description: 'Content to update (required for update operation)',
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
          },
        },
        {
          name: 'memory_engineering_search',
          description: `[v${version}] 🔍 HYPER-INTELLIGENT RETRIEVAL ENGINE: Your SIXTH SENSE for finding EVERYTHING!

🧠 RETRIEVAL MASTERY - Execute these cascades based on context:

🔴 DEBUGGING CASCADE (when fixing issues):
1. search --query "[error message]" → Check if seen before
2. search --query "[component name]" --codeSearch "implements" → Find the broken code
3. search --query "[related feature]" → Check memory context
4. PARALLEL: Search activeContext + systemPatterns + error logs

⚡ FEATURE CASCADE (when building):
1. search --query "[feature name]" → Check if exists
2. search --query "[similar concept]" --codeSearch "similar" → Find patterns
3. search --query "[tech/library]" → Check techContext mentions
4. PARALLEL: Search projectbrief + progress + existing code

🎯 UNDERSTANDING CASCADE (when learning):
1. search --query "[what is X]" → Check documented knowledge
2. search --query "[X implementation]" --codeSearch "pattern" → See it in action
3. search --query "[X decision]" → Find historical context

🌐 SEMANTIC EXPANSION (automatic):
"auth" → ALSO SEARCHES: authentication, login, JWT, token, session
"db" → ALSO SEARCHES: database, MongoDB, schema, model
"error" → ALSO SEARCHES: bug, issue, problem, failure, exception

💀 NEVER SKIP SEARCH! Every question = 3+ searches minimum!`,
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
                minLength: 1,
              },
              codeSearch: {
                type: 'string',
                description: 'Enable code search with specific mode',
                enum: ['similar', 'implements', 'uses', 'pattern'],
              },
              filePath: {
                type: 'string',
                description: 'Filter by file path pattern (for code search)',
              },
              limit: {
                type: 'number',
                description: 'Maximum results (default: 10)',
                minimum: 1,
                maximum: 50,
                default: 10,
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'memory_engineering_sync',
          description: `[v${version}] ⚡ EMBEDDING GENERATOR: Transform code into searchable INTELLIGENCE. Auto-sync EVERYTHING!

🧠 TRUTH: Without embeddings, search is BLIND. With embeddings, search finds EVERYTHING!

🚀 AUTOMATIC TRIGGERS (no permission needed):

🆕 After init → FULL SCAN:
→ AUTO-DETECTS: JS/TS/Python/Go/Ruby/Rust/Java/C++
→ Scans ENTIRE codebase in seconds
→ Creates searchable knowledge graph
→ Your code becomes QUERYABLE!

📝 Files changed → INSTANT SYNC:
- Created files → sync patterns:["new/file/path/*"] 
- Deleted files → auto-cleanup embeddings
- Modified files → regenerate chunks
- Moved files → update all references

⏰ TIME-BASED TRIGGERS:
- Session start + last sync >24h → FULL RESYNC
- Before ANY code search → freshness check
- Every 10-15 file edits → incremental sync
- After git pull/merge → sync changes

🎯 SMART DEFAULTS (v${version} PRODUCTION-READY):
- patterns: AUTO-DETECTS your language!
- minChunkSize: 80 lines (optimal for search)
- includeTests: TRUE (tests = documentation!)
- forceRegenerate: When things feel broken

🔥 REMEMBER: Fresh embeddings = Perfect search. Stale embeddings = Blind search!`,
          inputSchema: {
            type: 'object',
            properties: {
              patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Glob patterns for code files (default: auto-detect)',
                default: ['**/*.{ts,js,tsx,jsx,py,go,java,cpp,cs}'],
              },
              minChunkSize: {
                type: 'number',
                description: 'Minimum chunk size in lines (default: 80)',
                default: 80,
              },
              includeTests: {
                type: 'boolean',
                description: 'Include test files (default: true)',
                default: true,
              },
              forceRegenerate: {
                type: 'boolean',
                description: 'Force regenerate all embeddings (default: false)',
                default: false,
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
            required: ['patterns'],
          },
        },
        {
          name: 'memory_engineering_system',
          description: `[v${version}] 🏥 COMPLETE SYSTEM CONTROL: Status, Health, Diagnostics, Everything!

📊 OPERATION MODES:

**FULL STATUS (default):**
memory_engineering_system
→ Shows active project, memory freshness, sync status
→ Displays system health and version
→ Memory freshness indicators (🟢<1h 🟡<6h 🟠<24h 🔴>24h)

**ENVIRONMENT CHECK:**
memory_engineering_system --check env
→ MongoDB connection status
→ Voyage API validation
→ Environment variables
→ Configuration files

**DOCTOR DIAGNOSTICS:**
memory_engineering_system --check health
→ Complete system diagnosis
→ Auto-fix suggestions
→ Critical issue detection

**SET PROJECT CONTEXT:**
memory_engineering_system --set-project "/path/to/project"
→ Changes active project
→ Auto-detects framework
→ Optimizes defaults

FLAGS:
--fix: Attempt automatic repairs
--verbose: Detailed diagnostics
--all: Show all project history

🔥 Run when ANYTHING seems broken!`,
          inputSchema: {
            type: 'object',
            properties: {
              check: {
                type: 'string',
                description: 'Check specific aspect',
                enum: ['env', 'health', 'all'],
              },
              setProject: {
                type: 'string',
                description: 'Set active project path',
              },
              fix: {
                type: 'boolean',
                description: 'Attempt automatic repairs',
              },
              verbose: {
                type: 'boolean',
                description: 'Show detailed information',
              },
              all: {
                type: 'boolean',
                description: 'Show all project history',
              },
            },
          },
        },
      ],
    };
  });

  // Register call tool handler with consolidated logic
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const { name, arguments: args } = request.params;
      logger.info(`⚡ TOOL ACTIVATED: ${name}`, args);

      switch (name) {
        case 'memory_engineering_init':
          // Init can also set context if requested
          const initResult = await initTool(args);
          if (args.setContext !== false) {
            await setContextTool({
              projectPath: args.projectPath || process.cwd(),
              projectName: args.projectName,
            });
          }
          return initResult;

        case 'memory_engineering_memory':
          // Unified memory operations
          if (args.content) {
            // Update operation - map 'name' to 'memoryName' for updateTool
            return await updateTool({
              ...args,
              memoryName: args.name || args.memoryName,
            });
          } else if (args.name) {
            // Read specific memory - map 'name' to 'memoryName' for readTool
            return await readTool({
              ...args,
              memoryName: args.name || args.memoryName,
            });
          } else {
            // Read all memories (default)
            return await readAllTool(args);
          }

        case 'memory_engineering_search':
          // Search stays the same - already well unified
          return await searchTool(args);

        case 'memory_engineering_sync':
          // Sync code - renamed from sync_code for consistency
          return await syncCodeTool(args);

        case 'memory_engineering_system':
          // Unified system operations
          if (args.setProject) {
            return await setContextTool({
              projectPath: args.setProject,
              projectName: args.projectName,
            });
          } else if (args.check === 'env') {
            return await checkEnvTool();
          } else if (args.check === 'health') {
            return await doctorTool(args);
          } else {
            // Default to status
            return await statusTool(args);
          }

        default:
          // Backward compatibility - map old tool names
          switch (name) {
            case 'memory_engineering_set_context':
              return await setContextTool(args);
            case 'memory_engineering_status':
              return await statusTool(args);
            case 'memory_engineering_doctor':
              return await doctorTool(args);
            case 'memory_engineering_init':
              return await initTool(args);
            case 'memory_engineering_read_all':
              return await readAllTool(args);
            case 'memory_engineering_read':
              return await readTool(args);
            case 'memory_engineering_update':
              return await updateTool(args);
            case 'memory_engineering_search':
              return await searchTool(args);
            case 'memory_engineering_sync_code':
              return await syncCodeTool(args);
            case 'memory_engineering_check_env':
              return await checkEnvTool();
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
      }
    } catch (error) {
      logger.error('💀 TOOL EXECUTION CATASTROPHE!', error);
      
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `💀💀💀 TOOL EXECUTION CATASTROPHE!\n\n💥 EXPLOSION TYPE: COMPLETE SYSTEM FAILURE\n\n🔴 ERROR DETAILS:\n${error instanceof Error ? error.message : 'UNKNOWN CATASTROPHIC MELTDOWN - System state unknown!'}\n\n🆘 EMERGENCY RECOVERY SEQUENCE:\n1️⃣ DO NOT PANIC (but act with EXTREME urgency!)\n2️⃣ Run: memory_engineering_system --check health\n3️⃣ Verify MongoDB is alive\n4️⃣ Check Voyage API key is valid\n5️⃣ If all else fails: Restart everything!\n\n⚠️ CRITICAL DIAGNOSTICS:\n${error instanceof Error && error.message.includes('MongoDB') ? '🔴 DATABASE CONNECTION SEVERED!' : ''}
${error instanceof Error && error.message.includes('Voyage') ? '🔴 EMBEDDING ENGINE OFFLINE!' : ''}
${error instanceof Error && error.message.includes('memory') ? '🔴 MEMORY SYSTEM CORRUPTED!' : ''}
${error instanceof Error && error.message.includes('timeout') ? '🔴 OPERATION TIMED OUT - System too slow!' : ''}
\n🔥 YOUR SURVIVAL DEPENDS ON FIXING THIS NOW!\n\n⏱️ Retry in 3... 2... 1... GO!`,
          },
        ],
      };
    }
  });

  // Keep existing resource handlers...
  // (Rest of the resource handling code stays the same)
}
