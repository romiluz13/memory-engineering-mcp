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
import { syncCodeTool } from './syncCode.js';
import { checkEnvTool } from './checkEnv.js';
import { logger } from '../utils/logger.js';

export function setupTools(server: Server, version: string): void {
  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
    return {
      tools: [
        {
          name: 'memory_engineering_init',
          description: `[v${version}] Initialize memory system for your project. Creates MongoDB indexes and starts with ZERO memories following Cline's 7 core memory structure.`,
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
          name: 'memory_engineering_read_all',
          description: `[v${version}] MANDATORY: Start every session with this command. Reads ALL 7 core memories to give you full project context. This is the PRIMARY way to access memories in v5.`,
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
          },
        },
        {
          name: 'memory_engineering_read',
          description: `[v${version}] Read a specific memory document by name. Use this for detailed inspection after read_all. Valid names: projectbrief, productContext, activeContext, systemPatterns, techContext, progress, codebaseMap.`,
          inputSchema: {
            type: 'object',
            properties: {
              memoryName: {
                type: 'string',
                description: 'Core memory name (e.g., activeContext, systemPatterns)',
                enum: ['projectbrief', 'productContext', 'activeContext', 'systemPatterns', 'techContext', 'progress', 'codebaseMap']
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
            required: ['memoryName'],
          },
        },
        {
          name: 'memory_engineering_update',
          description: `[v${version}] Update a core memory document. All learnings go into activeContext. Memory names: projectbrief, productContext, activeContext, systemPatterns, techContext, progress, codebaseMap.`,
          inputSchema: {
            type: 'object',
            properties: {
              memoryName: {
                type: 'string',
                description: 'Core memory name',
                enum: ['projectbrief', 'productContext', 'activeContext', 'systemPatterns', 'techContext', 'progress', 'codebaseMap']
              },
              content: {
                type: 'string',
                description: 'Markdown content for the memory',
                minLength: 1
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
            required: ['memoryName', 'content'],
          },
        },
        {
          name: 'memory_engineering_search',
          description: `[v${version}] Search memories and code. This is SECONDARY to read_all. Use for finding specific information. For code search, add --codeSearch with mode: similar, implements, uses, or pattern.`,
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
                description: 'Maximum results (default: 10)',
                default: 10,
                minimum: 1,
                maximum: 50
              },
              codeSearch: {
                type: 'string',
                enum: ['similar', 'implements', 'uses', 'pattern'],
                description: 'Enable code search with specific mode'
              },

              filePath: {
                type: 'string',
                description: 'Filter by file path pattern (for code search)'
              }
            },
            required: ['query'],
          },
        },
        {
          name: 'memory_engineering_sync_code',
          description: `[v${version}] Sync code embeddings using Voyage AI. Run after major code changes to enable semantic code search. Required for codeSearch options in search tool.`,
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
              },
              minChunkSize: {
                type: 'number',
                description: 'Minimum chunk size in characters (default: 100)',
                default: 100
              },
              includeTests: {
                type: 'boolean',
                description: 'Include test files (default: false)',
                default: false
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
          description: `[v${version}] Check environment variables accessible to the MCP server. Useful for debugging configuration issues.`,
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
          uri: 'memory://v5/core',
          name: 'Core Memory Documents (v5)',
          description: 'The 7 core memories following Cline\'s memory bank structure',
          mimeType: 'text/markdown',
        },
        {
          uri: 'memory://v5/principle',
          name: 'Memory Engineering v5 Principle',
          description: 'The core principle: Read ALL memories at session start',
          mimeType: 'text/markdown',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
    const { uri } = request.params;
    
    try {
      switch (uri) {
        case 'memory://v5/core':
          return {
            contents: [{
              uri: 'memory://v5/core',
              mimeType: 'text/markdown',
              text: `# Memory Engineering v5 - Core Memories

Following Cline's proven memory bank structure:

1. **projectbrief** - What you're building (goals, scope, criteria)
2. **productContext** - Who needs this and why
3. **activeContext** - Current work and learnings (ALL learnings go here!)
4. **systemPatterns** - Architecture and code conventions
5. **techContext** - Technology stack and setup
6. **progress** - Completed features and lessons
7. **codebaseMap** - File structure + Voyage AI code embeddings

## Key Principle
**"I MUST read ALL memory bank files at the start of EVERY task"**

Start with: memory_engineering_read_all`,
            }],
          };

        case 'memory://v5/principle':
          return {
            contents: [{
              uri: 'memory://v5/principle',
              mimeType: 'text/markdown',
              text: `# The Core Principle of Memory Engineering v5

**"I MUST read ALL memory bank files at the start of EVERY task"**

This principle, adopted from Cline, ensures:
- No context is lost between sessions
- All learnings are immediately available
- No need to search for "what did we do last time"
- Eliminates the "working memory garbage" problem

## Why This Works
1. Core memories contain ALL important information
2. Reading 7 files is fast and comprehensive
3. No reliance on search or partial memory
4. Learnings in activeContext are always visible

## Implementation
Every session starts with:
\`\`\`bash
memory_engineering_read_all
\`\`\`

This is NOT optional - it's the foundation of v5.`,
            }],
          };

        default:
          return {
            isError: true,
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: `Unknown resource: ${uri}`,
            }],
          };
      }
    } catch (error) {
      logger.error('Resource read error:', error);
      return {
        isError: true,
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: `Error reading resource: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const { name, arguments: args } = request.params;

      logger.info(`Tool called: ${name}`, args);

      switch (name) {
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