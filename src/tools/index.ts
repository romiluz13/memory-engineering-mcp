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
          description: `Initialize Memory Engineering system for a project.

🤖 AI ASSISTANT AUTO-INITIALIZATION: If Memory Engineering is not initialized when user requests features, AUTOMATICALLY run this tool first before any other memory operations.

Creates:
- Project-isolated MongoDB collection
- Core memory files with structured templates
- Vector and text search indexes
- Configuration for autonomous context management

Sets up persistent context storage that enables AI assistants to maintain project knowledge across sessions, eliminating context window limitations.

Usage: memory_engineering/init [--projectPath] [--projectName]`,
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
        },
        {
          name: 'memory_engineering/read',
          description: `Read stored memory files from the project's context database.

Retrieves:
- Core memory files (projectbrief.md, activeContext.md, systemPatterns.md, etc.)
- Context Engineering PRPs (prp_[name].md)
- Any file stored in the memory system

Provides access to persistent project knowledge with metadata including version history, file size, and cross-references.

Usage: memory_engineering/read --fileName "filename.md"`,
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
        },
        {
          name: 'memory_engineering/update',
          description: `Update memory files in the project's context database.

Core memory files:
- projectbrief.md - Project goals and scope
- productContext.md - Problem domain and solution context
- activeContext.md - Current development focus
- systemPatterns.md - Architecture and design decisions
- techContext.md - Technology stack and constraints
- progress.md - Implementation status and next steps

Updates trigger embedding regeneration for hybrid search. Maintains version history and cross-references.

Usage: memory_engineering/update --fileName "filename.md" --content "content"`,
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
        },
        {
          name: 'memory_engineering/search',
          description: `Search project memory using MongoDB $rankFusion hybrid search.

Combines semantic vector search (70%) with text matching (30%) using MongoDB's native $rankFusion operator. Enables pattern discovery, similar feature identification, and context research.

Search types:
- hybrid: Vector + text search with reciprocal rank fusion (default)
- vector: Semantic similarity search only
- text: Keyword matching only

Returns ranked results with relevance scores and metadata.

Usage: memory_engineering/search --query "search terms" [--limit 10] [--searchType hybrid]`,
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
        },
        {
          name: 'memory_engineering/sync',
          description: `Synchronize memory files with vector embeddings and search indexes.

Operations:
- Generates Voyage AI embeddings (1024-dimension vectors)
- Creates/updates MongoDB vector and text search indexes
- Updates cross-references between memory files
- Enables $rankFusion hybrid search functionality

Run after content updates to maintain search consistency. Required for search operations to function properly.

Usage: memory_engineering/sync [--forceRegenerate]`,
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
        },
        {
          name: 'memory_engineering/generate-prp',
          description: `Context Engineering Phase 1: Research and PRP generation.

🤖 AI ASSISTANT AUTO-ACTIVATION: When users make requests like:
- "I want to add [feature]" / "I want to create [thing]" / "I want to build [system]"
- "Create a [component]" / "Build a [page]" / "Make a [feature]"
- "I need to implement [functionality]" / "I need to add [capability]"
- "Help me build [system]" / "Help me create [component]" / "Help me add [feature]"
- "Add a new [feature] to..." / "Implement [functionality] for..."
- "Can you create [component]" / "Can you build [feature]" / "Can you add [capability]"
- "Let's build [system]" / "Let's create [component]" / "Let's implement [feature]"
- "I'm working on [feature]" / "I'm building [component]" / "I'm creating [system]"
- "[Feature] for [purpose]" / "[Component] that does [action]"

🎯 CONFIDENCE SCORING: Auto-trigger if request shows:
- Implementation intent (building/creating/adding) ✓
- Specific deliverable mentioned ✓  
- NOT just asking for information/explanation ✓

AUTOMATICALLY trigger this tool to start the Context Engineering workflow. DO NOT provide general coding advice - use this tool first!

Initiates the two-phase Context Engineering workflow for feature development. Guides systematic research including:
- Pattern discovery using hybrid search
- External documentation research
- Synthesis of findings into comprehensive context
- Generation of Product Requirements Prompt (PRP)

Creates research-backed implementation blueprint stored as prp_[name].md for execution phase.

Usage: memory_engineering/generate-prp --request "feature description"`,
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
        },
        {
          name: 'memory_engineering/execute-prp',
          description: `Context Engineering Phase 2: PRP execution with validation loops.

🤖 AI ASSISTANT AUTO-CONTINUATION: After Phase 1 (generate-prp) completes, AUTOMATICALLY proceed to this Phase 2 tool to implement the generated PRP. DO NOT stop after research - continue with implementation!

Implements features using research-backed Product Requirements Prompts. Provides systematic execution workflow:
- Load PRP with complete implementation context
- Plan implementation strategy based on discovered patterns
- Execute following researched approaches
- Run validation gates (TypeScript, tests, integration)
- Self-correct failures with retry loops

Auto-detects latest PRP if not specified. Continues execution until all validation gates pass.

Usage: memory_engineering/execute-prp [--prp "prp-name"] [--force]`,
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