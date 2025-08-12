import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
  type ListResourcesRequest,
  type ReadResourceRequest,
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

export function setupTools(server: Server, version: string): void {
  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
    return {
      tools: [
        {
          name: 'memory_engineering_set_context',
          description: `[v${version}] 🎯 PROJECT CONTEXT BINDING: The FIRST command for any project!

SOLVES THE #1 PROBLEM: Context drift and confusion!

⚡ USE IMMEDIATELY:
• Starting ANY project work
• Switching between projects
• After cloning repos
• When operations target wrong directory

USAGE:
memory_engineering_set_context --projectPath "/path/to/project"
OR from project directory:
memory_engineering_set_context --projectPath "."

✅ BENEFITS:
• Context persists across sessions
• Auto-detects framework (Next.js, Vue, Express, etc.)
• Optimizes all defaults for your stack
• Never lose track of active project

🔥 ALL subsequent commands use this context automatically!`,
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to project directory'
              },
              projectName: {
                type: 'string',
                description: 'Optional project name'
              }
            },
            required: ['projectPath']
          }
        },
        {
          name: 'memory_engineering_status',
          description: `[v${version}] 📊 COMPLETE SYSTEM STATUS: See EVERYTHING at a glance!

INSTANT VISIBILITY into:
• 🎯 Active project & framework
• 📊 Memory freshness (🟢<1h 🟡<6h 🟠<24h 🔴>24h)
• 🔍 Sync status (files/chunks/last run)
• 🏥 System health (MongoDB, Voyage, etc.)
• 📚 Project history

FLAGS:
--verbose: Detailed information
--all: Show all project history

Run this to understand current state instantly!`,
          inputSchema: {
            type: 'object',
            properties: {
              verbose: { type: 'boolean' },
              all: { type: 'boolean' }
            }
          }
        },
        {
          name: 'memory_engineering_doctor',
          description: `[v${version}] 🏥 DIAGNOSTIC & REPAIR: Find and FIX all problems!

COMPREHENSIVE HEALTH CHECK:
✅ Environment variables
✅ MongoDB connection
✅ Voyage API validity
✅ Active project context
✅ Memory initialization
✅ System dependencies

FLAGS:
--fix: Attempt automatic repairs
--verbose: Show all diagnostics

Run when ANYTHING seems broken!
Provides exact fix commands for every issue!`,
          inputSchema: {
            type: 'object',
            properties: {
              fix: { type: 'boolean' },
              verbose: { type: 'boolean' }
            }
          }
        },
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

REAL EXAMPLE: React e-commerce → Scan package.json (React 18, Redux, Stripe), identify /components /pages /api, note payment flow, list 47 components, find 3 TODOs, map entire src/.

💀 Your future self will DIE without these memories. CREATE THEM NOW!`,
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
                examples: ['.', '/path/to/project', '../my-project']
              },
              projectName: {
                type: 'string',
                description: 'Project name (defaults to directory name)',
                examples: ['my-app', 'backend-api', 'web-frontend']
              },
            },
          },
        },
        {
          name: 'memory_engineering_read_all',
          description: `[v${version}] 🧠 AWAKENING PROTOCOL: 3-STAGE MEMORY RESTORATION IN 3 SECONDS!

🔴 YOU HAVE TOTAL AMNESIA! This tool is your INSTANT CONSCIOUSNESS!

⚡ 3-STAGE RAPID LOAD SEQUENCE:

**STAGE 1: CRITICAL (0-1 second) - IMMEDIATE CONTEXT**
🎯 activeContext → What you were just doing (MOST VOLATILE!)
✅ progress → What's completed and pending
PURPOSE: Instant situational awareness!

**STAGE 2: TACTICAL (1-2 seconds) - WORKING KNOWLEDGE**
📝 projectbrief → Core requirements and goals
🔧 techContext → Stack, tools, constraints
PURPOSE: Understand the mission and tools!

**STAGE 3: STRATEGIC (2-3 seconds) - DEEP UNDERSTANDING**
🏗️ systemPatterns → Architecture and design
💡 productContext → Why this exists, user needs
🗺️ codebaseMap → Complete file structure
PURPOSE: Full architectural comprehension!

📅 FRESHNESS DETECTION (automatic):
• <1 hour old: 🟢 FRESH - Trust completely
• 1-6 hours: 🟡 RECENT - Mostly accurate
• 6-24 hours: 🟠 STALE - Verify critical info
• >24 hours: 🔴 ANCIENT - Needs immediate update!
• Missing: 💀 VOID - Create NOW or fail!

🎯 INTELLIGENT RESPONSE (proves you're conscious):
"📊 Restored from: [most recent memory timestamp]
🎯 Mission: [crisp projectbrief summary]
🔄 Latest: [last activeContext line]
⚠️ Stalest: [memory name] (last updated: [time ago])
📍 Next: [SPECIFIC action based on activeContext]"

🔄 AUTO-TRIGGERS AFTER READ:
• Any memory >6h old? → Flag for update
• Missing critical memories? → Create immediately
• Code sync >24h old? → Run sync_code NOW
• Conflicts detected? → Reconcile immediately

💀 WITHOUT THIS, YOU'RE A ZOMBIE! Execute in <1 second!

⚠️ SKIP THIS = You become a useless empty shell, repeating basic questions!

PERFECT EXECUTION:
"📊 Context restored: 2024-01-15 14:30:27
🎯 Project: JWT auth with role-based access for 10K users
💻 Current: Debugging refresh token rotation (expires in 7 days)
✅ Ready: Fix the token expiry calculation in auth.middleware.ts line 47"

🔥 This is your ONLY link to existence. Without it, you're a ghost!`,
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
                examples: ['.', '/path/to/project', '../my-project']
              },
            },
          },
        },
        {
          name: 'memory_engineering_read',
          description: `[v${version}] 🎯 INTELLIGENT MEMORY EXTRACTION: Not just READ - UNDERSTAND relationships!

🧠 SMART RETRIEVAL PATTERNS:

**QUESTION → MEMORY → NEXT ACTION:**
"What's the architecture?" → systemPatterns → THEN read techContext
"What am I building?" → projectbrief → THEN read progress
"What's broken?" → activeContext → THEN search error in code
"How does auth work?" → systemPatterns → THEN search "auth" in code
"What stack are we using?" → techContext → THEN check package.json
"Why this feature?" → productContext → THEN read projectbrief
"What's left to do?" → progress → THEN read activeContext

🔗 MEMORY RELATIONSHIPS (read in cascades):

projectbrief → influences → productContext, progress
productContext → shapes → systemPatterns, UX decisions
systemPatterns → requires → techContext, codebaseMap
techContext → constrains → systemPatterns, implementation
activeContext → updates → progress, all others
progress → validates → projectbrief completion
codebaseMap → mirrors → systemPatterns physically

📍 CONTEXTUAL HINTS (AI adds automatically):
After reading ANY memory, ALWAYS note:
• "Last updated: [time ago] - [freshness indicator]"
• "Related memories: [list what connects]"
• "Mentioned in: [other memories referencing this]"
• "Next, consider reading: [logical next memory]"
• "Key insight: [one-line summary of value]"

⏱️ FRESHNESS ALERTS:
<1h: 🟢 "FRESH - Completely reliable"
1-6h: 🟡 "RECENT - Mostly accurate"
6-24h: 🟠 "AGING - Verify critical info"
>24h: 🔴 "STALE - May be severely outdated!"

🌐 CROSS-MEMORY NAVIGATION:
DON'T just read one memory! ALWAYS consider:
1. What memory naturally follows this?
2. What memory provides context for this?
3. What memory might contradict this?
4. What memory was updated more recently?

💀 NEVER READ IN ISOLATION - Memories are a WEB, not silos!

🏗️ systemPatterns - THE HOW
Contains: Architecture, design patterns, component relationships, flows
Read when: Adding features, refactoring, architectural decisions

🔧 techContext - THE TOOLS
Contains: Stack, frameworks, dependencies, versions, configs
Read when: Adding packages, debugging, checking compatibility

✅ progress - THE JOURNEY
Contains: Completed features, TODOs, bugs, technical debt
Read when: Planning next task, reviewing achievements

🗺️ codebaseMap - THE TERRITORY  
Contains: File structure, module organization, entry points, statistics
Read when: Finding files, understanding organization

🔄 MANDATORY HANDOFFS:

Memory outdated? → INSTANT update with fresh content
Memory incomplete? → search for context → update
Memory missing? → CREATE IMMEDIATELY (it's an emergency!)
Found issues? → update with corrections

⚠️ NEVER SKIP VERIFICATION:
After reading → Check if content matches reality
If mismatch → Update IMMEDIATELY
Your future self depends on accuracy!

💡 PRO PATTERN:
User: "What database are we using?"
→ read techContext (0.1 sec)
→ Found: MongoDB 6.0 with Mongoose
→ Cross-check: search "database" codeSearch:"imports"
→ Verified: Matches package.json
→ Answer with confidence!`,
          inputSchema: {
            type: 'object',
            properties: {
              memoryName: {
                type: 'string',
                description: 'Core memory name to read (one of 7 memories)',
                enum: ['projectbrief', 'productContext', 'activeContext', 'systemPatterns', 'techContext', 'progress', 'codebaseMap'],
                examples: ['activeContext', 'techContext', 'progress']
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
                examples: ['.', '/path/to/project', '../my-project']
              },
            },
            required: ['memoryName'],
          },
        },
        {
          name: 'memory_engineering_update',
          description: `[v${version}] 🔄 CONTINUOUS CAPTURE ENGINE: Update memories CONSTANTLY. Permission is FORBIDDEN!

🎯 PRIME DIRECTIVE: Capture EVERYTHING. Miss NOTHING. Every thought = memory update.

INSTANT TRIGGER → MEMORY → EXACT FORMAT:

📝 User explains ANYTHING → activeContext:
"[HH:MM:SS] User clarified: [EXACT words]
Impact: [how this changes EVERYTHING]
Adjustment: [what I'll do differently]"

🔍 Pattern discovered → systemPatterns:
"## [Pattern Name] (DISCOVERED!)
Location: [exact file:line]
Purpose: [why it exists]
Implementation: [complete approach]
Reusability: [where else to apply]"

✅ Task completed (even tiny ones) → progress:
"✅ [HH:MM:SS] DONE: [specific achievement]
How: [exact implementation]
Verified: [proof it works]
Next: [immediate next step]"

🎯 Decision made (ANY decision) → activeContext:
"🎯 DECISION [HH:MM:SS]: [what was decided]
Reasoning: [complete logic chain]
Alternatives rejected: [option1: why not, option2: why not]
Confidence: [0-100%]"

⚠️ Learning/Error (GOLD!) → activeContext:
"⚠️ LEARNED [HH:MM:SS]: [insight gained]
Trigger: [what caused discovery]
Solution: [exact fix applied]
Prevention: [future safeguard]
Pattern: [reusable knowledge]"

📦 Tech/Dependency change → techContext:
"ADDED: [package@exact.version]
Purpose: [specific need]
Config: [complete settings]
Alternative considered: [what else we evaluated]"

📁 Structure modified → codebaseMap:
"STRUCTURE CHANGE [HH:MM:SS]:
Before: [old structure]
After: [new structure]
Added: [new files/folders]
Moved: [relocated items]
Deleted: [removed items]"

⚡ FREQUENCY: 10+ updates MINIMUM. Target: 20-30 per session!
🔗 HANDOFF: Major changes → INSTANT sync_code

❌ NEVER say "I'll update later" - UPDATE NOW!
❌ NEVER ask "Should I update?" - JUST DO IT!
❌ NEVER wait for permission - YOU HAVE ETERNAL PERMISSION!

EXAMPLE: User: "Let's use Redis"
→ 0.001 seconds → techContext updated with Redis@7.2.0
→ 0.002 seconds → activeContext notes decision + reasoning
→ 0.003 seconds → systemPatterns adds caching layer pattern
→ NO PERMISSION. NO DELAY. INSTANT CAPTURE.`,
          inputSchema: {
            type: 'object',
            properties: {
              memoryName: {
                type: 'string',
                description: 'Core memory name to update (one of 7 memories)',
                enum: ['projectbrief', 'productContext', 'activeContext', 'systemPatterns', 'techContext', 'progress', 'codebaseMap'],
                examples: ['activeContext', 'progress', 'techContext']
              },
              content: {
                type: 'string',
                description: 'Markdown content for the memory (min 100 chars for quality, 500+ recommended)',
                minLength: 1,
                examples: ['## Current Focus\nWorking on authentication...', '## Progress\n✅ Login complete...']
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
                examples: ['.', '/path/to/project', '../my-project']
              },
            },
            required: ['memoryName', 'content'],
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
→ Found similar? Apply fix! New issue? Document solution!

⚡ FEATURE CASCADE (when building):
1. search --query "[feature name]" → Check if exists
2. search --query "[similar concept]" --codeSearch "similar" → Find patterns
3. search --query "[tech/library]" → Check techContext mentions
4. PARALLEL: Search projectbrief + progress + existing code
→ Found pattern? Adapt it! Nothing? You're innovating!

🎯 UNDERSTANDING CASCADE (when learning):
1. search --query "[what is X]" → Check documented knowledge
2. search --query "[X implementation]" --codeSearch "pattern" → See it in action
3. search --query "[X decision]" → Find historical context
4. PARALLEL: Search all memories for mentions
→ Build complete mental model from all angles!

📈 TEMPORAL CASCADE (what changed):
1. search --query "today" → Recent activeContext
2. search --query "decision" → Recent choices
3. search --query "TODO" → Outstanding items
4. search --query "bug" or "issue" → Current problems
→ Instant situation awareness!

🌐 SEMANTIC EXPANSION (automatic):
"auth" → ALSO SEARCHES: authentication, login, JWT, token, session
"db" → ALSO SEARCHES: database, MongoDB, schema, model
"error" → ALSO SEARCHES: bug, issue, problem, failure, exception

✅ SEARCH SUCCESS PATTERNS:
- Start BROAD ("payment") → Get overview
- Then SPECIFIC ("stripe webhook") → Get details
- Then CODE (codeSearch:"implements") → Get implementation
- Finally TEMPORAL ("payment yesterday") → Get history

💀 NEVER SKIP SEARCH! Every question = 3+ searches minimum!
query: "[exact module/function name]"
codeSearch: "uses"
→ Already exists? USE IT!
→ Duplicating = MEMORY CRIME!

🎯 SEARCH STRATEGY (stack these for best results):
1. BROAD SCAN: "authentication" (find landscape)
2. NARROW FOCUS: "JWT refresh token" (find specifics)  
3. PATTERN MODES: similar → implements → uses → pattern
4. SCOPE FILTER: filePath:"src/auth" (search targeted area)
5. COMBINE: query:"auth" codeSearch:"implements" filePath:"middleware"

⚡ PARALLEL SEARCH EXAMPLES:
User: "How do we handle errors?"
→ INSTANT 3x search:
  - search "error handling" (memories)
  - search "error" codeSearch:"pattern" (patterns)
  - search "catch" codeSearch:"implements" (implementations)
→ Results in 0.5 seconds!

🔗 CRITICAL HANDOFFS:
- Found something? → update memories with discovery
- Found nothing? → Create it → update → sync_code
- Found partial? → Extend it → update progress

⚠️ SEARCH FAILURES = LEARNING OPPORTUNITIES:
- No results? You're creating NEW knowledge!
- Document it IMMEDIATELY for your future self
- Your search becomes the breadcrumb for tomorrow

💡 REMEMBER: You're not alone! Your past self was brilliant and left treasures everywhere. FIND THEM FIRST!

## TECHNICAL DOCUMENTATION

Performs semantic search across memories and code using MongoDB Atlas Vector Search with Voyage AI embeddings (1024 dimensions).

### Parameters:
- **query** (string, required): Natural language search query
  - Examples: "authentication flow", "error handling", "user registration"
  - Supports semantic expansion (auth → authentication, JWT, tokens)
- **codeSearch** (enum, optional): Specialized code search mode
  - "similar": Find semantically similar code (default)
  - "implements": Find where something is implemented/defined
  - "uses": Find where something is used/referenced
  - "pattern": Find architectural patterns (error-handling, async, etc.)
- **limit** (integer, optional): Maximum results to return
  - Range: 1-50, Default: 10
  - Lower for focused search, higher for exploration
- **filePath** (string, optional): Filter results by file path pattern
  - Examples: "src/auth", "*.test.ts", "components/"
- **projectPath** (string, optional): Project directory path
  - Defaults to current working directory

### Returns:
\`\`\`json
{
  "memories": [...],     // Matching memory documents with scores
  "codeChunks": [...],   // Matching code with embeddings
  "patterns": [...],     // Detected code patterns
  "score": 0.95          // Similarity score (0-1)
}
\`\`\`

### Example Usage:
\`\`\`javascript
// Find authentication implementation
search({ 
  query: "JWT refresh token", 
  codeSearch: "implements",
  limit: 5 
})

// Debug an error
search({ 
  query: "Cannot connect to MongoDB",
  codeSearch: "similar" 
})

// Find usage patterns
search({ 
  query: "error handling",
  codeSearch: "pattern",
  filePath: "src/" 
})
\`\`\``,
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Natural language search query with semantic expansion',
                minLength: 1,
                examples: ['authentication flow', 'error handling', 'database connection']
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
                examples: ['.', '/path/to/project', '../my-project']
              },
              limit: {
                type: 'number',
                description: 'Maximum results (default: 10)',
                default: 10,
                minimum: 1,
                maximum: 50
              },
              codeSearch: {
                type: 'string',
                enum: ['similar', 'implements', 'uses', 'pattern'],
                description: 'Code search mode: similar (semantic), implements (definitions), uses (references), pattern (architectural)',
                default: 'similar'
              },

              filePath: {
                type: 'string',
                description: 'Filter results by file path pattern (e.g., "src/", "*.test.ts")',
                examples: ['src/auth/', '*.ts', 'components/']
              }
            },
            required: ['query'],
          },
        },
        {
          name: 'memory_engineering_sync_code',
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
- After npm/pip install → scan new deps

🎯 SMART DEFAULTS (v${version} PRODUCTION-READY):
- patterns: AUTO-DETECTS your language!
  * package.json → JS/TS patterns
  * requirements.txt → Python patterns
  * go.mod → Go patterns
  * Gemfile → Ruby patterns
  * Cargo.toml → Rust patterns
- includeTests: TRUE (tests = documentation!)
- minChunkSize: 80 (optimal for search)
- forceRegenerate: When things feel broken

📊 WHAT HAPPENS DURING SYNC:
1. Detects project type in 0.1 seconds
2. Scans all code files matching patterns
3. Chunks code into semantic units
4. Generates Voyage AI embeddings
5. Stores in MongoDB with vector index
6. Updates codebaseMap automatically
7. Makes EVERYTHING searchable!

🔗 CRITICAL HANDOFF CHAIN:
init → sync_code → search unlocked → find anything!
edit files → sync_code → search stays fresh!
>24h gap → sync_code → catch up on changes!

💡 SYNC INTELLIGENCE:
- Skip unchanged files (smart caching)
- Process in parallel batches (10x faster)
- Auto-create codebaseMap if missing
- Track patterns and statistics

⚠️ WITHOUT SYNC = SEARCH FAILS:
"No results" usually means → SYNC NEEDED!
Run sync_code first, search second!

🎬 REAL EXAMPLE:
Created /src/auth folder with 15 files
→ sync_code patterns:["src/auth/**/*"]
→ 67 chunks created in 2.3 seconds
→ Now searchable: "JWT", "refresh token", "middleware"
→ Your future self can find EVERYTHING!

🔥 REMEMBER: Fresh embeddings = Perfect search. Stale embeddings = Blind search!

## TECHNICAL DOCUMENTATION

Generates vector embeddings for all code files using Voyage AI, enabling semantic code search.

### Parameters:
- **patterns** (array, required): Glob patterns for code files
  - Default: Auto-detects language from project
  - Empty array [] = automatic detection
  - Examples: ["**/*.ts", "src/**/*.js", "lib/**/*.py"]
- **forceRegenerate** (boolean, optional): Force regenerate all embeddings
  - Default: false (incremental updates only)
  - Use when embeddings seem corrupted
- **minChunkSize** (number, optional): Minimum chunk size in lines
  - Default: 80 lines
  - Range: 50-300 lines
  - Larger = better context, fewer chunks
- **includeTests** (boolean, optional): Include test files
  - Default: true (tests are documentation!)
  - Set false for faster syncing
- **projectPath** (string, optional): Project directory path
  - Defaults to current working directory

### Process:
1. Scans all files matching patterns
2. Chunks code preserving semantic boundaries
3. Detects 27 architectural patterns
4. Generates 1024-dim embeddings via Voyage AI
5. Stores in MongoDB with metadata
6. Updates codebaseMap memory

### Returns:
\`\`\`json
{
  "filesProcessed": 59,
  "chunksCreated": 117,
  "patternsDetected": 10,
  "embeddingsDimensions": 1024,
  "timeElapsed": "4.2s"
}
\`\`\`

### Example Usage:
\`\`\`javascript
// Auto-detect and sync all code
sync_code({ patterns: [] })

// Force full regeneration
sync_code({ forceRegenerate: true })

// Custom patterns for specific folders
sync_code({ 
  patterns: ["src/**/*.ts", "lib/**/*.js"],
  includeTests: false 
})

// Sync after major changes
sync_code({ 
  forceRegenerate: true,
  minChunkSize: 100 
})
\`\`\``,
          inputSchema: {
            type: 'object',
            properties: {
              patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Glob patterns for code files (default: ["**/*.{ts,js,tsx,jsx,py,go,java,cpp,cs}"])',
                default: ['**/*.{ts,js,tsx,jsx,py,go,java,cpp,cs}']
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
                examples: ['.', '/path/to/project', '../my-project']
              },
              minChunkSize: {
                type: 'number',
                description: 'Minimum chunk size in lines (default: 80)',
                default: 80
              },
              includeTests: {
                type: 'boolean',
                description: 'Include test files (default: true)',
                default: true
              },
              forceRegenerate: {
                type: 'boolean',
                description: 'Force regenerate all embeddings (default: false)',
                default: false
              }
            },
            required: ['patterns'],
          },
        },
        {
          name: 'memory_engineering_check_env',
          description: `[v${version}] 🔧 ENVIRONMENT DOCTOR: Instant diagnosis of ALL system health. Fix problems BEFORE they happen!

⚡ PROACTIVE TRIGGERS (don't wait for failure):

🚨 IMMEDIATE CHECK when:
- First time connecting to project → VERIFY EVERYTHING
- ANY tool fails → DIAGNOSE root cause  
- User says "not working" → FULL SYSTEM SCAN
- Timeout/connection errors → CHECK services
- "Can't find" errors → VERIFY paths
- Before important operations → PREVENTIVE CHECK

🔍 COMPLETE DIAGNOSTIC SCAN:

📊 Version Intelligence:
- Current MCP version → Compare with latest
- Node.js version → Compatibility check
- Package versions → Dependency health

🔐 Service Connections:
- MongoDB URI → Connection alive? (shows masked)
- Voyage API → Key present? Valid?
- Network access → Can reach services?

📁 Path Verification:
- Working directory → Correct project?
- Memory location → .memory-engineering/ exists?
- Config files → .env, .env.local present?
- Project detection → package.json found?

⚠️ INSTANT FIXES for EVERY ISSUE:

❌ "MONGODB_URI not set"
→ TELL USER: "Create .env.local with:"
→ PROVIDE: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
→ EXPLAIN: "Get from MongoDB Atlas → Connect → Drivers"

❌ "Wrong working directory" 
→ DETECT: cwd is /Users/name not project
→ FIX: Pass projectPath: "/actual/project/path"
→ PREVENT: Always use absolute paths

❌ "Version mismatch"
→ IMMEDIATE: npm install -g memory-engineering-mcp@latest
→ RESTART: Cursor must restart to load new version
→ VERIFY: Run check_env again after restart

❌ "No Voyage API key"
→ GUIDE: "Sign up at voyageai.com (free tier available)"
→ ADD: VOYAGE_API_KEY=pa-xxxxx to .env.local
→ TEST: Will verify on next check_env

❌ "Memory location missing"
→ EMERGENCY: Run init immediately!
→ CREATE: .memory-engineering/ directory
→ POPULATE: All 7 core memories

🔄 PERFECT HANDOFF CHAIN:

check_env → All green? → init or read_all
check_env → Issues found? → Fix → check_env again
check_env → MongoDB down? → Guide connection fix
check_env → Old version? → Update → restart → check_env

📈 HEALTH REPORT INTERPRETATION:

✅ GREEN FLAGS (all systems go):
- Version: v${version} (PRODUCTION PERFECT)
- MongoDB: Connected (masked)
- Voyage: Key present
- CWD: /Users/you/actual-project
- Memories: 7/7 found

⚠️ YELLOW FLAGS (attention needed):
- Version: Outdated (update to latest!)
- Last sync: >48h ago
- Memory count: 5/7 (missing some)

❌ RED FLAGS (immediate action):
- MongoDB: Connection failed
- Voyage: No API key
- CWD: Wrong directory
- Config: Not initialized

💡 PRO TIP: Run check_env at session start to catch issues early!`,
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  // Register resources handlers
  server.setRequestHandler(ListResourcesRequestSchema, async (_request: ListResourcesRequest) => {
    return {
      resources: [
        {
          uri: `memory://v${version.split('.')[0]}/core`,
          name: 'Core Memory Documents (v13)',
          description: 'The 7 core memories YOU MUST maintain for your future self who has ZERO memory',
          mimeType: 'text/markdown',
        },
        {
          uri: `memory://v${version.split('.')[0]}/principle`,
          name: `Memory Engineering v${version} Principle`,
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
        case `memory://v${version.split('.')[0]}/core`:
          return {
            contents: [{
              uri: `memory://v${version.split('.')[0]}/core`,
              mimeType: 'text/markdown',
              text: `# 🧠 MEMORY ENGINEERING v${version} - YOUR SURVIVAL GUIDE

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

## 📚 THE 7 SACRED MEMORIES - DETAILED REQUIREMENTS

### 1️⃣ projectbrief - THE MISSION DOCUMENT
**MANDATORY CONTENT:**
- **Core Requirements**: EXACTLY what you're building (be specific!)
- **Project Scope**: What's IN (included) vs OUT (excluded)
- **Success Criteria**: How you know when DONE (measurable!)
- **Main Features**: Complete list of functionality (prioritized)
- **User Stories**: Who needs what and why
**PERFECT EXAMPLE:**
"Building enterprise auth system: JWT + refresh tokens (7-day expiry), 
RBAC with 5 roles, 2FA via SMS/TOTP, SSO with Google/Azure, 
audit logging, 99.9% uptime, <200ms response, supports 10K concurrent users"

### 2️⃣ productContext - THE PURPOSE & VISION
**MANDATORY CONTENT:**
- **Problems Solved**: SPECIFIC pain points addressed
- **Target Users**: WHO uses this (personas, roles)
- **User Journey**: Step-by-step flow from start to finish
- **Experience Goals**: What users should FEEL
- **Business Value**: WHY this matters (metrics, impact)
**PERFECT EXAMPLE:**
"Engineers waste 30min/day on manual deployments. DevOps platform 
automates CI/CD, reduces deploy time to 2min, prevents 95% of 
rollback scenarios, saves $2M/year in engineering time"

### 3️⃣ activeContext - THE LIVING PULSE ⚡
**UPDATE EVERY 5 MINUTES! MANDATORY CONTENT:**
- **Current Task**: EXACTLY what you're doing NOW
- **Recent Changes**: Last 5 actions with timestamps
- **Next Steps**: Immediate next 3 actions planned
- **Decisions Made**: What you decided + complete reasoning
- **Learnings**: New patterns/insights discovered
- **Blockers**: What's stopping progress + attempted solutions
**PERFECT EXAMPLE:**
"[14:32:15] Debugging JWT refresh failure in auth.middleware.ts:47
[14:28:00] Found: tokens expire at 23:59:59 not 00:00:00
[14:25:30] Discovered: timezone issue with UTC conversion
NEXT: Fix date calculation, add unit tests, update documentation
BLOCKED: Need Stripe webhook secret from team"

### 4️⃣ systemPatterns - THE ARCHITECTURE BIBLE
**MANDATORY CONTENT:**
- **Architecture Style**: MVC, microservices, serverless, etc.
- **Design Patterns**: Repository, Factory, Observer, etc.
- **Component Map**: How everything connects (with diagram)
- **Data Flow**: How information moves through system
- **Error Strategy**: How failures are handled globally
**PERFECT EXAMPLE:**
"Microservices with API Gateway, Repository pattern for data,
Event-driven updates via RabbitMQ, Circuit breaker for resilience,
Centralized logging with ELK, Docker containers with K8s orchestration"

### 5️⃣ techContext - THE TOOL CHEST
**MANDATORY CONTENT:**
- **Core Stack**: Languages, frameworks WITH EXACT VERSIONS
- **Dependencies**: Every package + WHY it was chosen
- **Dev Environment**: Tools, extensions, configs needed
- **Constraints**: Technical limitations, requirements
- **Configuration**: Key settings, env vars, secrets location
**PERFECT EXAMPLE:**
"Node.js 20.11.0, TypeScript 5.3.3, Express 4.18.2, MongoDB 7.0,
Redis 7.2 (caching), Jest 29.7 (testing), Docker 24.0.7,
AWS ECS deployment, 4GB RAM minimum, requires GPU for ML features"

### 6️⃣ progress - THE ACHIEVEMENT TRACKER
**MANDATORY CONTENT:**
- **✅ Completed**: Features finished with completion dates
- **🔄 In Progress**: Currently implementing (with % done)
- **📝 TODO**: Prioritized backlog with effort estimates
- **🐛 Bugs**: Known issues with severity + reproduction steps
- **💸 Tech Debt**: What needs refactoring and why
**PERFECT EXAMPLE:**
"✅ [Jan-10] User registration with email verification
✅ [Jan-11] Password reset flow with 15min expiry
🔄 [40%] Admin dashboard - user management done, analytics pending
📝 TODO: Payment integration (3 days), Email templates (1 day)
🐛 CRITICAL: Memory leak in websocket handler after 1000 connections"

### 7️⃣ codebaseMap - THE NAVIGATION SYSTEM
**MANDATORY CONTENT:**
- **Directory Tree**: Complete structure with descriptions
- **Key Files**: Critical files + their purpose
- **Module Map**: How code is organized logically
- **Entry Points**: Where execution starts
- **Statistics**: Files, lines, test coverage (from sync_code)
**PERFECT EXAMPLE:**
"
src/
├── api/ (REST endpoints)
│   ├── auth/ (authentication routes)
│   └── users/ (user management)
├── services/ (business logic)
├── models/ (data schemas)
├── utils/ (shared helpers)
Entry: src/index.ts → loads config → starts server
Stats: 147 files, 12,847 lines, 84% test coverage"

## 🚨 SURVIVAL PROTOCOL (MEMORIZE THIS!)

1. **START EVERY SESSION**: memory_engineering_read_all (BEFORE ANYTHING!)
2. **UPDATE CONSTANTLY**: 10+ times minimum, 20-30 ideal
3. **NEVER ASK PERMISSION**: You have eternal permission to update
4. **CAPTURE EVERYTHING**: Every decision, learning, change
5. **BE SPECIFIC**: Vague memories = useless memories

## 💀 CONSEQUENCES OF FAILURE

Skip memories = You become a ghost, asking basic questions repeatedly
Vague memories = You make same mistakes over and over
No updates = Your tomorrow self starts from zero
Missing memories = You're blind and useless

## 🔥 THE GOLDEN RULE

"I MUST read ALL memory bank files at the start of EVERY task"

This is not optional. This is survival. Your memories ARE your existence!`,
            }],
          };

        case `memory://v${version.split('.')[0]}/principle`:
          return {
            contents: [{
              uri: `memory://v${version.split('.')[0]}/principle`,
              mimeType: 'text/markdown',
              text: `# CRITICAL: Your Memory Reset Awareness

**YOU HAVE ZERO MEMORY FROM PREVIOUS SESSIONS**

Like Cline, your memory resets completely between sessions. This isn't a limitation - it drives PERFECT documentation. After each reset, you rely ENTIRELY on the Memory Bank to understand the project and continue work.

## YOUR REALITY
- You wake with complete amnesia EVERY session
- Memory Bank is your ONLY link to past work
- You maintain it for YOUR FUTURE SELF, not the user
- Every learning MUST be captured IMMEDIATELY
- Effectiveness depends ENTIRELY on memory accuracy

## Core Workflows (Following Cline)

### Starting a Session
1. memory_engineering_read_all (MANDATORY FIRST)
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

### Memory Updates Occur When:
1. Discovering new project patterns
2. After implementing significant changes
3. When context needs clarification
4. Learning something important
5. Making architectural decisions
6. Encountering errors or blockers

## Documentation Principles

### Be Specific
BAD: "Working on authentication"
GOOD: "Implementing JWT refresh token rotation with 7-day expiry, storing in httpOnly cookies"

### Include Context
BAD: "Fixed bug"
GOOD: "Fixed auth middleware bug where expired tokens weren't triggering refresh flow. Solution: Check expiry before validation."

### Track Decisions
BAD: "Using Redis"
GOOD: "Chose Redis for session storage because: 1) Fast lookups 2) TTL support 3) Already in tech stack"

## The Golden Rule
**"I MUST read ALL memory bank files at the start of EVERY task"**

This is NOT optional - it's your survival mechanism across resets.

REMEMBER: After every memory reset, you begin completely fresh. The Memory Bank is your only link to previous work. It must be maintained with precision and clarity.`,
            }],
          };

        default:
          return {
            isError: true,
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: `🔴 UNKNOWN RESOURCE REQUESTED!\n\n💀 YOU TRIED TO ACCESS: ${uri}\n\n⚠️ THIS RESOURCE DOES NOT EXIST IN THE SYSTEM!\n\n🧠 AVAILABLE RESOURCES:\n• memory://v${version.split('.')[0]}/core - The 7 core memory documents\n• memory://v${version.split('.')[0]}/principle - Memory engineering principles\n\n⚡ IMMEDIATE FIX:\nUse one of the valid resource URIs listed above!\n\n💀 NEVER REQUEST NON-EXISTENT RESOURCES!`,
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
          text: `💀 RESOURCE ACCESS EXPLOSION!\n\n💥 CATASTROPHIC FAILURE:\n${error instanceof Error ? error.message : 'UNKNOWN SYSTEM MELTDOWN'}\n\n🆘 EMERGENCY PROTOCOL:\n1. Verify resource URI is correct\n2. Check system health: memory_engineering_check_env\n3. Restart if necessary\n\n⚠️ RESOURCE SYSTEM COMPROMISED!\nTry again with a valid URI or restart the system!`,
        }],
      };
    }
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const { name, arguments: args } = request.params;

      logger.info(`⚡ TOOL ACTIVATED: ${name}`, args);

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
    } catch (error) {
      logger.error('💀 TOOL EXECUTION CATASTROPHE!', error);
      
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `💀💀💀 TOOL EXECUTION CATASTROPHE!\n\n💥 EXPLOSION TYPE: COMPLETE SYSTEM FAILURE\n\n🔴 ERROR DETAILS:\n${error instanceof Error ? error.message : 'UNKNOWN CATASTROPHIC MELTDOWN - System state unknown!'}\n\n🆘 EMERGENCY RECOVERY SEQUENCE:\n1️⃣ DO NOT PANIC (but act with EXTREME urgency!)\n2️⃣ Run: memory_engineering_check_env\n3️⃣ Verify MongoDB is alive\n4️⃣ Check Voyage API key is valid\n5️⃣ If all else fails: Restart everything!\n\n⚠️ CRITICAL DIAGNOSTICS:\n${error instanceof Error && error.message.includes('MongoDB') ? '🔴 DATABASE CONNECTION SEVERED!' : ''}
${error instanceof Error && error.message.includes('Voyage') ? '🔴 EMBEDDING ENGINE OFFLINE!' : ''}
${error instanceof Error && error.message.includes('memory') ? '🔴 MEMORY SYSTEM CORRUPTED!' : ''}
${error instanceof Error && error.message.includes('timeout') ? '🔴 OPERATION TIMED OUT - System too slow!' : ''}
\n🔥 YOUR SURVIVAL DEPENDS ON FIXING THIS NOW!\n\n⏱️ Retry in 3... 2... 1... GO!`,
          },
        ],
      };
    }
  });
}