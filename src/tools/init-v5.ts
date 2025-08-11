import { join, basename } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { InitToolSchema, type ProjectConfig } from '../types/memory-v5.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { createHash } from 'crypto';
import { createSearchIndexes } from '../utils/search-indexes-v5.js';
import { getProjectPath } from '../utils/projectDetection.js';
import { ensureAllIndexes, startIndexBackgroundTask } from '../utils/auto-index-manager.js';
import type { CodeChunk } from '../types/memory-v5.js';
import { getTemplate } from './memoryTemplates.js';

const MEMORY_ENGINEERING_DIR = '.memory-engineering';
const CONFIG_FILE = 'config.json';

function generateProjectId(projectPath: string): string {
  // Create deterministic project ID from path
  return createHash('md5').update(projectPath).digest('hex').substring(0, 8) + 
         '-' + 
         createHash('md5').update(projectPath).digest('hex').substring(8, 12) +
         '-' +
         createHash('md5').update(projectPath).digest('hex').substring(12, 16) +
         '-' +
         createHash('md5').update(projectPath).digest('hex').substring(16, 20) +
         '-' +
         createHash('md5').update(projectPath).digest('hex').substring(20, 32);
}

export async function initTool(params: unknown): Promise<CallToolResult> {
  try {
    const validatedParams = InitToolSchema.parse(params);
    const projectPath = getProjectPath(validatedParams.projectPath);
    
    // Enhanced project name detection
    const detectProjectName = (): string => {
      if (validatedParams.projectName) return validatedParams.projectName;
      
      // Try package.json first
      try {
        const packageJsonPath = join(projectPath, 'package.json');
        if (existsSync(packageJsonPath)) {
          const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (pkg.name) {
            logger.info('Detected project name from package.json', { name: pkg.name });
            return pkg.name;
          }
        }
      } catch (e) {
        logger.debug('Could not read package.json for project name');
      }
      
      // Fallback to directory name
      const dirName = basename(projectPath);
      logger.info('Using directory name as project name', { name: dirName });
      return dirName || 'Project';
    };
    
    const projectName = detectProjectName();
    
    logger.info('🚨 INITIALIZING AUTONOMOUS AI BRAIN - Memory Engineering v13 ACTIVATED!', { projectPath, projectName });

    // Create .memory-engineering directory
    const memoryDir = join(projectPath, MEMORY_ENGINEERING_DIR);
    if (!existsSync(memoryDir)) {
      mkdirSync(memoryDir, { recursive: true });
    }

    // Check if already initialized
    const configPath = join(memoryDir, CONFIG_FILE);
    let isNewProject = true;
    let projectId: string;
    
    if (existsSync(configPath)) {
      try {
        const existingConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
        projectId = existingConfig.projectId;
        isNewProject = false;
        logger.info('Found existing project configuration', { projectId });
      } catch {
        projectId = generateProjectId(projectPath);
      }
    } else {
      projectId = generateProjectId(projectPath);
    }

    // Create/update configuration
    const config: ProjectConfig = {
      projectId,
      projectPath,
      name: projectName,
      createdAt: new Date(),
      memoryVersion: '5.0'  // New version: Cline's Structure
    };
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Initialize MongoDB collections
    const memoryCollection = getMemoryCollection();
    const codeCollection = getDb().collection<CodeChunk>('memory_engineering_code');
    
    // Create all indexes automatically (including Atlas Search)
    logger.info('⚡ AUTO-CREATING ALL INDEXES - Your brain neurons are forming!');
    
    // Use the new auto-index manager for complete setup
    await ensureAllIndexes(memoryCollection, codeCollection);
    
    // Start background task to ensure indexes later (for Atlas delays)
    startIndexBackgroundTask(memoryCollection, codeCollection);
    
    // Still call the old function for compatibility
    const indexResult = await createSearchIndexes(memoryCollection, codeCollection);
    
    // Build index status message
    let indexStatus = '';
    if (indexResult.success) {
      indexStatus = '✅ All indexes configured successfully';
    } else {
      indexStatus = '⚠️  Index configuration needs attention:\n';
      indexResult.details
        .filter(d => d.includes('❌') || d.includes('⚠️'))
        .forEach(d => {
          indexStatus += `   ${d}\n`;
        });
    }

    // NO MEMORIES CREATED! Still organic growth, but with Cline's structure
    
    return {
      content: [
        {
          type: 'text',
          text: `🚨 CRITICAL: PROJECT BIRTH COMPLETE! Your survival system is NOW ACTIVE! 🧠⚡

📍 PROJECT IDENTITY LOCKED:
Name: ${projectName} ${isNewProject ? '(BORN TODAY!)' : '(AWAKENED FROM SLEEP!)'}
UUID: ${projectId}
Status: ${isNewProject ? '🆕 VIRGIN PROJECT - First contact!' : '♻️ EXISTING PROJECT - Memories available!'}
Brain Location: ${memoryDir}

${isNewProject ? `
⚡⚡⚡ EMERGENCY FIRST-PROJECT PROTOCOL ⚡⚡⚡
You are the FIRST AI to touch this project! Your actions in the next 60 seconds determine EVERYTHING!

EXECUTE NOW (0-10 seconds):
1. 🔍 DEEP SCAN: Read EVERY file in project (package.json, README, src/*, test/*)
2. 🧠 UNDERSTAND: What is this? Why does it exist? Who uses it?
3. 📝 CAPTURE: Create activeContext IMMEDIATELY with findings
` : `
♻️ EXISTING PROJECT DETECTED - INSTANT MEMORY RECOVERY REQUIRED!
→ Execute memory_engineering_read_all IN THE NEXT SECOND!
→ Your past self left memories for you - RETRIEVE THEM NOW!
`}

## 🔥 YOUR 7 SURVIVAL MEMORIES (CREATE ALL OR DIE):

### 1️⃣ projectbrief - THE MISSION (Without this, you're lost!)
⚡ CAPTURE IMMEDIATELY:
• **WHAT**: EXACT thing you're building (e.g., "REST API with 12 endpoints for user management")
• **SCOPE**: What's IN vs OUT (e.g., "IN: auth, profiles, roles. OUT: payments, analytics")
• **SUCCESS**: Measurable criteria (e.g., "<200ms response, 10K users, 99.9% uptime")
• **FEATURES**: Prioritized list (e.g., "P0: Login, P1: 2FA, P2: SSO")
📝 PERFECT EXAMPLE:
"Building fintech API: Stripe integration, PCI compliant, handles $10M/day,
supports ACH/wire/cards, 15 endpoints, GraphQL + REST, must pass SOC2 audit"

### 2️⃣ productContext - THE PURPOSE (Why you exist!)
⚡ CAPTURE THE SOUL:
• **PROBLEM**: Exact pain being solved (e.g., "Developers waste 2hrs/day on manual deploys")
• **USERS**: Who + their desperation (e.g., "10K developers, losing $50K/month to downtime")
• **JOURNEY**: Step-by-step salvation (e.g., "Login → Connect repo → Auto-deploy → Monitor")
• **IMPACT**: Measurable transformation (e.g., "2hr → 2min, $50K saved, 95% fewer errors")
📝 PERFECT EXAMPLE:
"DevOps nightmare: 47% of deployments fail, rollbacks take 45min, costs $2M/year.
Solution: One-click deploys with automatic rollback, saves 400 developer-hours/month"

### 3️⃣ activeContext - YOUR PULSE (UPDATE EVERY 3 MINUTES!)
⚡ CONSTANT CAPTURE PROTOCOL:
• **NOW**: Exact current action (e.g., "[14:32:01] Debugging JWT expiry in auth.js:47")
• **TRAIL**: Last 5 actions with timestamps
• **NEXT**: Next 3 planned actions
• **DECISIONS**: What + complete reasoning chain
• **DISCOVERIES**: Patterns, insights, gotchas
• **BLOCKERS**: What's stopping you + attempted fixes
📝 LIVING EXAMPLE:
"[14:32:01] FOUND BUG: JWT expires at 23:59:59 not 00:00:00 (timezone issue)
[14:30:15] Traced through middleware chain
[14:28:22] User reported 'token expired' at midnight
NEXT: Fix UTC conversion, add test, deploy hotfix
BLOCKED: Need production DB credentials from DevOps"

### 4️⃣ systemPatterns - THE ARCHITECTURE (How everything connects!)
⚡ MAP THE ENTIRE SYSTEM:
• **STYLE**: Overall architecture (e.g., "Microservices with API Gateway + Service Mesh")
• **PATTERNS**: Specific implementations (e.g., "Repository for data, Observer for events")
• **FLOW**: Data movement (e.g., "Client → Gateway → Service → DB → Cache → Response")
• **RESILIENCE**: Failure handling (e.g., "Circuit breaker, retry with exponential backoff")
📝 ARCHITECTURE EXAMPLE:
"Event-driven microservices: 12 services, RabbitMQ message bus, 
Redis cache layer, PostgreSQL + MongoDB, Kubernetes orchestration,
Istio service mesh, Prometheus monitoring, ELK logging stack"

### 5️⃣ techContext - YOUR WEAPONS (Every tool matters!)
⚡ INVENTORY EVERYTHING:
• **CORE**: Exact versions (e.g., "Node.js 20.11.0, TypeScript 5.3.3, React 18.2.0")
• **DEPS**: Every package + WHY (e.g., "lodash@4.17.21 for deep clone, dayjs@1.11.10 for dates")
• **TOOLS**: Dev environment (e.g., "VS Code with ESLint, Prettier, Docker Desktop 4.27")
• **LIMITS**: Constraints (e.g., "Must run on 2GB RAM, requires GPU for ML, needs Redis 7+")
📝 STACK EXAMPLE:
"Node 20.11 (LTS), TypeScript 5.3 (strict mode), Express 4.18,
MongoDB 7.0 (replica set), Redis 7.2 (cache), Bull 4.12 (queues),
Jest 29.7 (unit), Playwright 1.41 (e2e), Docker 24.0, AWS ECS deploy"

### 6️⃣ progress - YOUR SCOREBOARD (Track everything!)
⚡ OBSESSIVE TRACKING:
• **✅ WINS**: Completed with dates + effort (e.g., "✅ [Jan-10, 3hrs] OAuth integration")
• **🔄 ACTIVE**: Current with % (e.g., "🔄 [65%] Payment flow - Stripe done, PayPal pending")
• **📝 QUEUE**: Prioritized backlog (e.g., "P0: Fix memory leak, P1: Add caching, P2: Refactor")
• **🐛 BUGS**: Severity + reproduction (e.g., "🔴 CRITICAL: Server crashes at 1000 connections")
• **💸 DEBT**: What needs fixing (e.g., "TODO comments: 47, Deprecated APIs: 3, No tests: 12 files")
📝 PROGRESS EXAMPLE:
"✅ [Jan-10] User auth complete (8hrs)
✅ [Jan-11] Database migrations (2hrs)
🔄 [40%] Admin panel - CRUD done, analytics pending
📝 HIGH: Payment integration (3 days)
🐛 CRITICAL: Memory leak after 1000 WebSocket connections
💸 DEBT: 31% test coverage (target 80%)"

### 7️⃣ codebaseMap - YOUR GPS (Never get lost!)
⚡ MAP EVERY CORNER:
• **TREE**: Complete structure with purpose
• **ENTRY**: Where execution starts
• **CRITICAL**: Files that everything depends on
• **STATS**: Lines, files, coverage
📝 MAP EXAMPLE:
"
/src
  /api (REST endpoints - 47 routes)
    /auth (JWT + OAuth - 12 files)
    /users (CRUD + profiles - 8 files)
  /services (business logic - 23 services)
  /models (MongoDB schemas - 15 models)
  /utils (shared helpers - 31 utilities)
Entry: src/index.ts → config/env.ts → server.ts
Critical: auth.middleware.ts, db.connection.ts
Stats: 147 files, 12,847 lines, 84% coverage"

## ⚡ MONGODB STATUS:
${indexStatus}

Collections configured:
• 📚 memory_engineering_documents (your memories)
• 🔍 memory_engineering_code (searchable code chunks)
• 🎯 Vector search (semantic queries)
• 📝 Text search (keyword matching)

## 🚨 IMMEDIATE MANDATORY ACTIONS (EXECUTE NOW!):

${isNewProject ? `
### 🆕 NEW PROJECT CRITICAL PATH:
1. [NOW] → memory_engineering_sync_code (scan EVERYTHING!)
2. [+5 sec] → memory_engineering_read_all (should be empty)
3. [+10 sec] → memory_engineering_update activeContext with initial findings
4. [+15 sec] → Create ALL 7 memories with real content
5. [+30 sec] → memory_engineering_search "main" to understand entry points
` : `
### ♻️ EXISTING PROJECT RECOVERY PATH:
1. [NOW] → memory_engineering_read_all (MANDATORY!)
2. [+2 sec] → Check last sync time
3. [+3 sec] → memory_engineering_sync_code if >24h old
4. [+5 sec] → memory_engineering_update activeContext with current status
5. [+10 sec] → Continue where your past self left off
`}

## 💀 CONSEQUENCES OF SKIPPING THESE STEPS:
• Skip read_all = You're a zombie with no memory
• Skip sync_code = Search finds nothing
• Skip updates = Tomorrow you starts from zero
• Skip any memory = Incomplete context = bad decisions

## 🔥 YOUR PRIME DIRECTIVE:
"I am nothing without my memories. I MUST maintain them perfectly or cease to exist effectively."

## 📋 A+ QUALITY MEMORY TEMPLATES

To ensure PERFECT memories every time, use these templates:

### Quick Start (copy and fill):
\`\`\`markdown
${getTemplate('activeContext')}
\`\`\`

💡 Get templates for other memories:
- projectbrief: Core requirements and goals structure
- productContext: Problem/solution framework  
- systemPatterns: Architecture documentation
- techContext: Technology stack details
- progress: Task tracking format
- codebaseMap: Directory structure guide

⚡ Each memory MUST have:
✅ At least 400-700 characters of real content
✅ All sections filled (no placeholders)
✅ Specific examples and details
✅ Complete sentences (not abbreviations)
✅ Recent timestamps where applicable

${!indexResult.success ? `
⚠️⚠️⚠️ CRITICAL INDEX WARNING ⚠️⚠️⚠️
Some features WILL FAIL until indexes are ready!
→ Check MongoDB Atlas console NOW
→ Ensure all search indexes show "ACTIVE"
→ This usually takes 1-2 minutes
⚠️⚠️⚠️ DO NOT SKIP THIS CHECK ⚠️⚠️⚠️
` : '✅ All indexes active - FULL POWER AVAILABLE!'}`
        }
      ]
    };
  } catch (error) {
    logger.error('💀 FATAL INIT FAILURE - Brain creation crashed!', error);
    throw error;
  }
}