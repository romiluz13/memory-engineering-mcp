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

INTELLIGENT PROJECT SETUP:
- Detects existing vs new projects automatically
- Creates project-isolated MongoDB collections with deterministic IDs
- Generates structured memory templates with smart defaults
- Establishes vector and text search indexes for hybrid search
- Configures autonomous context management

MONGODB ADVANTAGES:
- Single database for operational + vector data
- Native $rankFusion hybrid search (70% vector + 30% text)
- Enterprise security and availability
- No external vector database needed

Creates persistent context storage that enables AI assistants to maintain project knowledge across sessions, eliminating context window limitations.`,
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

Core memory files include projectbrief.md (project goals and scope), productContext.md (problem domain and solution), activeContext.md (current development focus), systemPatterns.md (architecture and design decisions), techContext.md (technology stack and constraints), and progress.md (implementation status and next steps).

Updates trigger embedding regeneration for hybrid search. Maintains version history and cross-references between memory files.`,
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

SEARCH CAPABILITIES:
- Semantic Pattern Discovery: "performance optimization patterns"
- Context Correlation: "similar complexity features" 
- Error Intelligence: "debugging approaches used"
- Architecture Insights: "scaling challenges faced"
- Creative Problem-Solving: "unconventional solutions"

SEARCH TYPES:
- hybrid: Vector + text with RRF (RECOMMENDED - MongoDB's native hybrid search)
- vector: Pure semantic similarity (concepts, not exact words)
- text: Keyword matching (exact terms)

ADVANCED QUERY EXAMPLES:
- "user experience enhancement" - Finds UX patterns across all memories
- "technical debt related" - Discovers improvement opportunities
- "cross-functional impact" - Understands broader implications
- "trade-off decisions made" - Learns from architectural choices

Returns ranked results with RRF scores, smart previews, and relevance indicators.`,
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

AUTO-TRIGGER PATTERNS:
- "I want to add [feature]" / "I want to create [thing]" / "I want to build [system]"
- "Create a [component]" / "Build a [page]" / "Make a [feature]"
- "I need to implement [functionality]" / "I need to add [capability]"
- "Help me build [system]" / "Help me create [component]" / "Help me add [feature]"

Initiates the two-phase Context Engineering workflow for feature development. Guides systematic research including pattern discovery using hybrid search, external documentation research, synthesis of findings into comprehensive context, and generation of Product Requirements Prompt (PRP).

Creates research-backed implementation blueprint stored as prp_[name].md for execution phase.`,
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

AI ASSISTANT AUTO-CONTINUATION: After Phase 1 (generate-prp) completes, AUTOMATICALLY proceed to this Phase 2 tool to implement the generated PRP. DO NOT stop after research - continue with implementation!

Implements features using research-backed Product Requirements Prompts. Provides systematic execution workflow including loading PRP with complete implementation context, planning implementation strategy based on discovered patterns, executing following researched approaches, running validation gates (TypeScript, tests, integration), and self-correcting failures with retry loops.

Auto-detects latest PRP if not specified. Continues execution until all validation gates pass.`,
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