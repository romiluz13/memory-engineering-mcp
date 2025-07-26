import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { initTool } from './init.js';
import { readTool } from './read.js';
import { updateTool } from './update.js';
import { searchTool } from './search.js';
import { syncTool } from './sync.js';
import { generatePRPTool } from './generate-prp.js';
import { executePRPTool } from './execute-prp.js';
import { logger } from '../utils/logger.js';

export function setupTools(server: Server): void {
  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
    return {
      tools: [
        {
          name: 'memory_engineering/init',
          description: `Initialize Memory Engineering system with intelligent project detection and MongoDB setup.

AUTOMATIC INITIALIZATION: If Memory Engineering is not initialized when user requests features, automatically run this tool first before any other memory operations.

AI ASSISTANT 5-STEPS-AHEAD WORKFLOW GUIDANCE:
1. DETECTION: Run init → Creates 6 core memory files + MongoDB setup
2. POPULATION: Use update tool → Fill memory files with real project data
3. SYNCHRONIZATION: Run sync → Generate embeddings for hybrid search
4. DISCOVERY: Use search → Find patterns and context across all memories
5. EVOLUTION: Continue updating memories as project develops

INTELLIGENT PROJECT SETUP:
- Detects existing vs new projects automatically
- Creates project-isolated MongoDB collections with deterministic IDs
- Generates structured memory templates with smart defaults
- Establishes vector and text search indexes for hybrid search
- Configures autonomous context management

THE 6 CORE MEMORY FILES CREATED:
- projectbrief.md: Project goals, scope, success criteria, AI implementation guide
- productContext.md: Problem statement, target users, competitive analysis
- activeContext.md: Current tasks, recent changes, real-time development state
- systemPatterns.md: Architecture, design patterns, AI implementation workflow
- techContext.md: Technology stack, dependencies, development environment
- progress.md: Timeline, completed work, lessons learned, AI effectiveness notes

MONGODB ADVANTAGES:
- Single database for operational + vector data
- Native $rankFusion hybrid search (70% vector + 30% text)
- Enterprise security and availability
- No external vector database needed

Creates persistent context storage that enables AI assistants to maintain project knowledge across sessions, eliminating context window limitations. This becomes the "brain" that makes AI coding assistants exponentially more effective.`,
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
            },
          },
          annotations: {
            title: 'Initialize Memory Engineering',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
          },
        },
        {
          name: 'memory_engineering/read',
          description: `Read stored memory files from the project's MongoDB-powered context database.

Retrieves core memory files (projectbrief.md, activeContext.md, systemPatterns.md, etc.), Context Engineering PRPs (prp_[name].md), and any file stored in the memory system.

Provides access to persistent project knowledge with metadata including version history, file size, cross-references, and last access tracking.`,
          inputSchema: {
            type: 'object',
            properties: {
              fileName: {
                type: 'string',
                description: 'Name of the memory file to read (e.g., projectbrief.md)',
                pattern: '^[a-zA-Z0-9-_]+\\.md$'
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
            required: ['fileName'],
          },
          annotations: {
            title: 'Read Memory File',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
          },
        },
        {
          name: 'memory_engineering/update',
          description: `Update memory files in the project's MongoDB-powered context database.

INTELLIGENT UPDATE vs CREATE LOGIC:
- UPDATES existing files: Increments version, preserves history, clears embeddings for regeneration
- CREATES new files: Only if file doesn't exist, starts at version 1
- NEVER duplicates: Always checks existence first

THE 6-FILE MEMORY WORKFLOW FOR AI ASSISTANTS:
1. projectbrief.md: UPDATE when project scope, goals, or requirements change
2. productContext.md: UPDATE when understanding user needs or market context evolves  
3. activeContext.md: UPDATE frequently with current tasks, recent changes, immediate focus
4. systemPatterns.md: UPDATE when discovering new patterns, refactoring, or architectural changes
5. techContext.md: UPDATE when adding dependencies, changing environment, or tech decisions
6. progress.md: UPDATE after completing features, hitting milestones, or learning lessons

WHEN TO UPDATE EACH FILE:
- BEFORE coding: Update activeContext.md with current task details
- DURING development: Update systemPatterns.md with new patterns discovered
- AFTER implementation: Update progress.md with what was accomplished and learned
- ON architecture changes: Update systemPatterns.md and techContext.md
- ON scope changes: Update projectbrief.md and productContext.md

Updates trigger embedding regeneration for hybrid search. Maintains version history and cross-references between memory files. This creates the evolving "brain" that makes AI assistants progressively smarter about your project.`,
          inputSchema: {
            type: 'object',
            properties: {
              fileName: {
                type: 'string',
                description: 'Name of the memory file to update',
                pattern: '^[a-zA-Z0-9-_]+\\.md$'
              },
              content: {
                type: 'string',
                description: 'New content for the memory file',
                minLength: 1
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
            required: ['fileName', 'content'],
          },
          annotations: {
            title: 'Update Memory File',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
          },
        },
        {
          name: 'memory_engineering/search',
          description: `MongoDB $rankFusion Hybrid Search - Revolutionary unified search across project memories.

Uses MongoDB 8.1+ native $rankFusion operator combining 70% Semantic Vector Search (Voyage AI embeddings) with 30% Full-Text Search (Atlas Search) using Reciprocal Rank Fusion algorithm for intelligent result ranking.

20+ CREATIVE SEARCH PATTERN LIBRARY FOR AI ASSISTANTS:

PERFORMANCE & OPTIMIZATION PATTERNS:
- "performance optimization patterns" - Learn from speed improvements
- "bottleneck optimization patterns" - Discover performance solutions
- "scaling challenges faced" - Find scalability approaches
- "performance metrics tracking" - Measurement strategies

ERROR & DEBUGGING PATTERNS:
- "debugging approaches used" - Troubleshooting methodologies
- "error handling strategies" - Robust error management
- "recovery patterns implemented" - Resilience approaches
- "testing strategy precedents" - Quality assurance methods

USER EXPERIENCE PATTERNS:
- "user feedback incorporated" - Learn from user insights
- "user experience enhancement" - UX improvement patterns
- "user workflow optimization" - Journey enhancement techniques
- "interface design decisions" - UI pattern discoveries

ARCHITECTURE & DESIGN PATTERNS:
- "similar complexity features" - Find comparable implementations
- "trade-off decisions made" - Learn architectural choices
- "design pattern applications" - Reusable design solutions
- "cross-functional impact" - Understand system relationships

CREATIVE DISCOVERY PATTERNS:
- "unconventional solutions" - Find innovative approaches
- "related business logic" - Discover connected functionality
- "technical debt related" - Improvement opportunities
- "lessons learned documented" - Implementation insights

SEARCH TYPES:
- hybrid: Vector + text with RRF (RECOMMENDED - MongoDB's revolutionary fusion)
- vector: Pure semantic similarity (concepts, not exact words)
- text: Keyword matching (exact terms)

Returns ranked results with RRF scores, smart previews, relevance indicators, and contextual suggestions for deeper discovery.`,
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
                minLength: 1
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 10, max: 50)',
                default: 10,
                minimum: 1,
                maximum: 50
              },
              searchType: {
                type: 'string',
                enum: ['hybrid', 'vector', 'text'],
                description: 'Type of search to perform (default: hybrid)',
                default: 'hybrid',
              },
            },
            required: ['query'],
          },
          annotations: {
            title: 'Search Memory Files',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
          },
        },
        {
          name: 'memory_engineering/sync',
          description: `Synchronize memory files with vector embeddings and MongoDB search indexes.

Operations include generating Voyage AI embeddings (1024-dimension vectors), creating/updating MongoDB vector and text search indexes, updating cross-references between memory files, and enabling $rankFusion hybrid search functionality.

Run after content updates to maintain search consistency. Required for search operations to function properly.`,
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
              forceRegenerate: {
                type: 'boolean',
                description: 'Force regeneration of all embeddings (default: false)',
                default: false,
              },
            },
          },
          annotations: {
            title: 'Synchronize Memory System',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
          },
        },
        {
          name: 'memory_engineering/generate-prp',
          description: `Context Engineering Phase 1: Research and PRP generation.

AI ASSISTANT AUTO-ACTIVATION: When users make requests for implementation (building/creating/adding specific features), automatically trigger this tool to start the Context Engineering workflow. DO NOT provide general coding advice - use this tool first!

AI ASSISTANT 5-STEPS-AHEAD RESEARCH WORKFLOW:
1. MEMORY ANALYSIS: Search existing memories for patterns and constraints
2. PATTERN DISCOVERY: Use hybrid search to find similar implementations
3. EXTERNAL RESEARCH: Gather documentation, best practices, gotchas
4. ULTRATHINK SYNTHESIS: Deep analysis combining all research findings
5. PRP GENERATION: Create comprehensive implementation blueprint

AUTO-TRIGGER PATTERNS:
- "I want to add [feature]" / "I want to create [thing]" / "I want to build [system]"
- "Create a [component]" / "Build a [page]" / "Make a [feature]"  
- "I need to implement [functionality]" / "I need to add [capability]"
- "Help me build [system]" / "Help me create [component]" / "Help me add [feature]"

RESEARCH METHODOLOGY:
- Project Type Detection: Distinguish existing vs new projects
- Memory-Driven Research: Use search patterns to discover existing approaches
- Pattern Synthesis: Combine findings from multiple memory files
- Validation Planning: Include testing and quality gates in PRP

Creates research-backed implementation blueprint stored as prp_[name].md for execution phase. This ensures AI assistants never code blindly - they research first, then implement with complete context.`,
          inputSchema: {
            type: 'object',
            properties: {
              request: {
                type: 'string',
                description: 'Your simple feature request in natural language (e.g., "I want a dark mode toggle")',
                minLength: 3
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
          },
          annotations: {
            title: 'Generate Product Requirements Prompt',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
          },
        },
        {
          name: 'memory_engineering/execute-prp',
          description: `Context Engineering Phase 2: PRP execution with validation loops.

AI ASSISTANT WORKFLOW CONTINUATION: After Phase 1 (generate-prp) completes, this Phase 2 tool provides structured implementation guidance with user approval gates.

AI ASSISTANT 5-STEPS-AHEAD IMPLEMENTATION WORKFLOW:
1. PRP LOADING: Load research-backed implementation blueprint with full context
2. STRATEGY PLANNING: ULTRATHINK implementation approach based on discovered patterns
3. PATTERN EXECUTION: Follow researched approaches and architectural decisions
4. VALIDATION GATES: Run TypeScript, tests, integration checks with self-correction
5. MEMORY UPDATES: Document new patterns learned in systemPatterns.md and progress.md

SYSTEMATIC EXECUTION METHODOLOGY:
- Context Transfer: Complete research findings from Phase 1 guide implementation
- Pattern Adherence: Follow discovered patterns exactly, don't improvise
- Validation Loops: Self-correct until ALL validation gates pass
- Memory Evolution: Update memories with implementation learnings

CROSS-TOOL INTEGRATION:
- Reads PRP from memory_engineering/read
- Uses memory_engineering/search for additional pattern discovery during implementation
- Updates memory_engineering/update with new patterns and progress
- Triggers memory_engineering/sync for search index updates

Auto-detects latest PRP if not specified. Continues execution until all validation gates pass. This ensures AI assistants deliver production-ready features that integrate perfectly with existing codebase patterns.`,
          inputSchema: {
            type: 'object',
            properties: {
              prp: {
                type: 'string',
                description: 'PRP name to execute (auto-detects latest if not specified)',
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
              force: {
                type: 'boolean',
                description: 'Force execution even with low confidence PRP',
                default: false,
              },
              skipApproval: {
                type: 'boolean',
                description: 'Skip user approval prompt and proceed directly to execution',
                default: false,
              },
            },
          },
          annotations: {
            title: 'Execute Product Requirements Prompt',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
          },
        },
      ],
    };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const { name, arguments: args } = request.params;

      logger.info(`Tool called: ${name}`, args);

      switch (name) {
        case 'memory_engineering/init':
          return await initTool(args);
        case 'memory_engineering/read':
          return await readTool(args);
        case 'memory_engineering/update':
          return await updateTool(args);
        case 'memory_engineering/search':
          return await searchTool(args);
        case 'memory_engineering/sync':
          return await syncTool(args);
        case 'memory_engineering/generate-prp':
          return await generatePRPTool(args);
        case 'memory_engineering/execute-prp':
          return await executePRPTool(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error('Tool execution error:', error);
      
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
      };
    }
  });
}