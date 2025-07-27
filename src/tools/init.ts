import { join, basename } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { InitToolSchema, type ProjectConfig, createCoreMemory, CORE_MEMORY_NAMES } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { createHash } from 'crypto';
import { generateProjectSpecificTemplates } from './templates.js';

const MEMORY_ENGINEERING_DIR = '.memory-engineering';
const CONFIG_FILE = 'config.json';

const FALLBACK_TEMPLATES = {
  'projectbrief': `# Project Brief

## Project Name
Memory Engineering MCP Integration

## Overview
Give AI coding assistants perfect memory between sessions, enabling them to remember context, patterns, and solutions across time.

## Problem & Solution
- **Problem**: AI assistants lose all context between sessions, forcing developers to re-explain everything
- **Solution**: MongoDB-powered memory system with intelligent search and pattern recognition
- **Why Now**: MCP protocol standardization makes this the perfect time for memory integration

## Goals
- **Primary**: Achieve 90%+ memory utilization by AI assistants
- **Metrics**: Track search usage, memory creation frequency, pattern discovery rate
- **Timeline**: 
  - Week 1: Core integration
  - Week 2: Search optimization
  - Week 3: Pattern recognition
  - Week 4: Performance tuning

## Scope
### In Scope
- Core memory CRUD operations
- Hybrid search with $rankFusion
- Pattern discovery and insights
- Auto-expiring working memories
- Evolution tracking

### Out of Scope (v4.0)
- Knowledge graph relationships
- Real-time memory streaming
- Cross-project memory sharing
- Memory visualization UI

## Success Criteria
- **Technical**: <100ms search response, 99.9% uptime, zero data loss
- **User**: AI remembers all context, finds patterns automatically, improves over time
- **Business**: 10x productivity improvement for developers using AI assistants

## AI Context Guide
**🤖 For AI Coding Assistants - Critical Implementation Notes:**
- **Entry Point**: Always start by reading activeContext
- **Architecture**: Follow patterns in systemPatterns religiously
- **State Management**: Stateless MCP tools, MongoDB for all persistence
- **Testing Strategy**: Integration tests for each memory operation
- **Key Dependencies**: MongoDB 8.1+ (for $rankFusion), Voyage AI for embeddings

## Example Usage Flow
1. AI reads activeContext at session start
2. AI searches for relevant patterns before implementing
3. AI updates working memory after solving problems
4. AI discovers patterns and creates insights
5. AI updates progress when features complete
`,

  'productContext': `# Product Context

## Why This Project Exists
Memory Engineering exists because every AI coding assistant forgets everything between sessions. This creates a frustrating cycle where developers must re-explain context, patterns, and decisions every time they start a new session.

## The Problem We're Solving
- **Context Loss**: Every new session starts from zero
- **Pattern Repetition**: Same bugs solved multiple times
- **Decision Amnesia**: Architectural choices forgotten
- **Productivity Drain**: Constant re-explanation wastes time

## How It Should Work
1. **Seamless Continuity**: AI picks up exactly where it left off
2. **Pattern Recognition**: Automatically learns from repeated solutions
3. **Smart Search**: Finds relevant past experiences instantly
4. **Progressive Learning**: Gets smarter with every interaction

## User Experience Goals
- **Zero Friction**: Memory system works invisibly in background
- **Natural Language**: AI interacts with memory conversationally
- **Instant Recall**: Sub-100ms retrieval of relevant context
- **Trust Building**: AI feels like a long-term team member

## Success Looks Like
- Developer: "My AI assistant remembers our entire project history"
- AI: "I found 3 similar bugs we fixed before, here's the pattern..."
- Result: 10x productivity boost, fewer repeated mistakes

## The Deeper Mission
We're not just storing data - we're giving AI assistants the ability to build genuine expertise over time. Each session adds to a growing understanding of the codebase, team patterns, and project evolution.

## User Persona
**The Frustrated Developer**: Tired of explaining the same context repeatedly to AI assistants. Wants an AI that truly understands their project and grows smarter over time.

## Competitive Landscape
- **Without Memory Engineering**: AI restarts from zero every session
- **With Memory Engineering**: AI has perfect recall and pattern recognition
- **Future Vision**: AI becomes a true expert on your specific codebase

## Product Principles
1. **Memory First**: Every interaction should strengthen memory
2. **Natural Integration**: Works with how developers already code
3. **Progressive Enhancement**: System improves itself over time
4. **Trust Through Transparency**: AI explains what it remembers and why
`,

  'systemPatterns': `# System Patterns

## Architecture Overview
MCP Server (TypeScript) → MongoDB Atlas → AI Assistant Integration
- Stateless MCP tools for all operations
- MongoDB as single source of truth
- Voyage AI for semantic embeddings
- Natural language tool descriptions for AI psychology

## Design Patterns

### Pattern 1: Memory Class Hierarchy
- **When to use**: Organizing different types of memories
- **Implementation**: 
  \`\`\`typescript
  type MemoryClass = 'core' | 'working' | 'insight' | 'evolution';
  // Core: 6 markdown files, permanent
  // Working: Event-based, 30-day TTL
  // Insight: AI-discovered patterns
  // Evolution: Search tracking (daily aggregated)
  \`\`\`
- **Benefits**: Clear separation of concerns, appropriate retention policies

### Pattern 2: Unified Search with $rankFusion
- **When to use**: Any memory retrieval operation
- **Implementation**:
  \`\`\`typescript
  const results = await executeRankFusionSearch({
    semantic: 0.4,   // Vector similarity
    text: 0.3,       // Keyword matching
    temporal: 0.2,   // Recent memories
    importance: 0.1  // High-value memories
  });
  \`\`\`
- **Benefits**: Best of all search methods, MongoDB-native performance

### Pattern 3: Natural Language Tool Descriptions
- **When to use**: All MCP tool definitions
- **Implementation**: Focus on WHEN and WHY, not HOW
- **Benefits**: 33% → 88% tool usage by AI assistants

## Code Standards

### Memory Operations
- **Create**: Always include searchableText field
- **Read**: Increment accessCount for learning
- **Update**: Preserve version history in metadata
- **Delete**: Soft delete with importance=0

### MongoDB Best Practices
\`\`\`typescript
// Always use projection for large documents
const memory = await collection.findOne(
  { _id: memoryId },
  { projection: { contentVector: 0 } } // Exclude embeddings
);

// Batch operations when possible
const bulk = collection.initializeUnorderedBulkOp();
bulk.find({ projectId }).update({ $inc: { 'metadata.accessCount': 1 } });
await bulk.execute();
\`\`\`

## Common Patterns

### Error Handling
\`\`\`typescript
try {
  const result = await memoryOperation();
  return formatSuccess(result);
} catch (error) {
  logger.error('Memory operation failed:', error);
  // Return helpful error for AI to understand
  return {
    content: [{
      type: 'text',
      text: \`Operation failed: \${error.message}\n\nTry: \${getSuggestion(error)}\`
    }]
  };
}
\`\`\`

### Memory Creation Flow
1. Validate input schema
2. Generate searchableText
3. Set appropriate TTL if working memory
4. Create with proper metadata
5. Queue for embedding generation

## Performance Guidelines
- Index all fields used in queries
- Use aggregation pipelines for complex operations
- Implement cursor-based pagination for large results
- Cache projectId lookup for 5 minutes
- Batch embedding generation (max 50 at once)

## Security Patterns
- Validate all input with Zod schemas
- Sanitize markdown content before storage
- Use projectId for tenant isolation
- Never expose MongoDB connection strings
- Implement rate limiting on search operations

## AI Integration Patterns

### Proactive Memory Usage
\`\`\`typescript
// Good: Natural language hints
"No results found. Try searching for 'authentication' or 'error handling'"

// Bad: Technical jargon
"404: Document not found in collection"
\`\`\`

### Contextual Guidance
- After search: "Found 3 similar implementations. Update working memory after implementing."
- After create: "Memory saved. Run sync to make it searchable."
- After error: "This usually means [explanation]. Try [solution]."
`,

  'activeContext': `# Active Context

## Current Sprint/Focus
**Sprint**: Memory Integration v1.0
**Duration**: 2025-01-20 - 2025-02-03
**Goal**: Integrate Memory Engineering with your AI coding workflow

## Active Tasks
### In Progress
- [ ] Set up MongoDB Atlas cluster with vector search
- [ ] Configure MCP server in your AI assistant settings
- [ ] Test memory creation and search functionality

### Up Next
- [ ] Create your first working memory from a debug session
- [ ] Run sync to generate embeddings
- [ ] Search for patterns before implementing new features

## Recent Changes
### 2025-01-26
- **Changed**: Simplified from 5 to 4 memory classes
- **Reason**: Reduce complexity, improve AI adoption
- **Impact**: Easier to understand and use

## Current Blockers
- **Atlas Search Index**: Need to manually configure if using existing cluster
- **API Keys**: Ensure VOYAGE_API_KEY is set in environment

## Key Decisions This Sprint
- **Decision**: Use natural language for all tool descriptions
  - **Rationale**: Increased AI usage from 33% to 88%
  - **Alternatives considered**: Technical specifications (too complex)

## AI Assistant Focus Areas
**🤖 Priority for AI assistance:**
1. Testing search functionality after index creation
2. Creating meaningful working memories
3. Discovering patterns in existing code

**Context**: This is a memory system FOR AI assistants. Every design decision should optimize for AI comprehension and usage. Think of it as building a brain extension for your AI.

## Quick Start Checklist
- [ ] Run memory_engineering_init
- [ ] Read all 6 core memory files
- [ ] Create a test working memory
- [ ] Search for "test" to verify search works
- [ ] Update this file with your current focus

## Remember
🧠 **Update this file at the start of each session** so your AI knows what you're working on!
`,

  'techContext': `# Tech Context

## Technology Stack

### Core MCP Server
- **Runtime**: Node.js v20.11.0+
- **Language**: TypeScript 5.0+
- **Protocol**: MCP (Model Context Protocol) over stdio
- **Database**: MongoDB Atlas 8.1+ (required for $rankFusion)

### AI Integration
- **Embeddings**: Voyage AI (voyage-3-large, 1024 dimensions)
- **Compatible With**: Cursor, Claude Code, Windsurf
- **Transport**: stdio (standard input/output)

### Key Dependencies
\`\`\`json
{
  "@modelcontextprotocol/sdk": "^2.0.0",
  "mongodb": "^6.17.0",
  "voyageai": "^0.0.1-5",
  "zod": "^3.24.1",
  "dotenv": "^17.2.0"
}
\`\`\`

## Development Environment

### Required Tools
- Node.js 20.11.0+ (LTS recommended)
- npm 10.2.4+ or pnpm 8.0+
- TypeScript 5.0+
- MongoDB Atlas account (free tier works)
- Voyage AI API key

### Environment Variables
\`\`\`bash
# Required (.env.local)
MONGODB_URI=mongodb+srv://...
VOYAGE_API_KEY=pa-...

# Optional
MEMORY_ENGINEERING_DB=memory_engineering
MEMORY_ENGINEERING_COLLECTION=memory_engineering_documents
LOG_LEVEL=info
\`\`\`

## MongoDB Configuration

### Required Features
- **Version**: 8.1+ (for $rankFusion)
- **Atlas Search**: Enabled
- **Vector Search**: Configured with 1024 dimensions
- **Indexes**:
  - Compound: projectId + memoryClass + freshness
  - Vector: contentVector field
  - Text: searchableText field (with projectId as token)
  - TTL: metadata.autoExpire

### Connection Best Practices
- Use connection pooling (default in driver)
- Set appropriate timeouts
- Handle reconnection gracefully
- Monitor connection health

## API Integrations

### Voyage AI
- **Purpose**: Generate semantic embeddings for memories
- **Model**: voyage-3-large (1024 dimensions)
- **Rate Limits**: 300 requests/minute, 10M tokens/month (free)
- **Documentation**: https://docs.voyageai.com
- **Best Practice**: Batch requests (max 50 texts)

## Performance Targets
- **Search Response**: < 100ms (with warm cache)
- **Memory Creation**: < 50ms
- **Embedding Generation**: < 500ms (batched)
- **Tool Discovery**: < 10ms
- **MongoDB Operations**: < 30ms average

## MCP Integration

### Cursor Configuration
\`\`\`.cursorrules
# Add to .cursorrules in project root
memory_engineering_server:
  command: node
  args: ["node_modules/.bin/memory-engineering-mcp"]
  env:
    MONGODB_URI: \${MONGODB_URI}
    VOYAGE_API_KEY: \${VOYAGE_API_KEY}
\`\`\`

### Claude Code Configuration
\`\`\`json
// Add to claude_config.json
{
  "memory-engineering": {
    "command": "npx",
    "args": ["memory-engineering-mcp"]
  }
}
\`\`\`

## Monitoring & Debugging

### Logging
- Structured JSON logs
- Contextual information included
- Error stack traces preserved
- Performance metrics tracked

### Health Checks
- MongoDB connection status
- Voyage AI API availability
- Memory count by class
- Search performance metrics

## Security Considerations
- Never commit API keys
- Use environment variables
- Implement projectId isolation
- Validate all inputs with Zod
- Sanitize markdown content
- Rate limit API endpoints
`,

  'progress': `# Progress Log

## Completed Features
### [Date] - [Feature Name]
- **What**: [Description of what was built]
- **How**: [Key implementation details]
- **Challenges**: [Problems encountered and solutions]
- **Lessons**: [What we learned]
- **Time**: [Estimated vs Actual]

## Milestones Reached
### [Date] - [Milestone Name]
- **Achievement**: [What was accomplished]
- **Impact**: [How this moves the project forward]
- **Next Steps**: [What this enables]

## Lessons Learned
### Technical
- **Learning**: [Technical insight gained]
  - **Context**: [When/how discovered]
  - **Application**: [How to use this knowledge]

### Process
- **Learning**: [Process improvement discovered]
  - **Before**: [Old approach]
  - **After**: [New approach]
  - **Result**: [Impact of change]

## Performance Improvements
### [Date] - [Optimization Name]
- **Metric**: [What was measured]
- **Before**: [Original performance]
- **After**: [Improved performance]
- **Method**: [How it was achieved]

## Refactoring Wins
### [Date] - [Area Refactored]
- **Reason**: [Why refactoring was needed]
- **Changes**: [What was changed]
- **Benefits**: [Improvements gained]

## AI Assistant Effectiveness
### Helpful Patterns
- **Pattern**: [What worked well with AI]
- **Example**: [Specific instance]

### Areas for Improvement
- **Challenge**: [Where AI struggled]
- **Solution**: [How to improve]
`,

  'codebaseMap': `# Codebase Map

## Directory Structure
\`\`\`
project-root/
├── src/
│   ├── components/    # UI components
│   ├── pages/        # Page components
│   ├── services/     # Business logic
│   ├── utils/        # Helpers
│   └── types/        # TypeScript types
├── public/           # Static assets
├── tests/           # Test files
└── docs/            # Documentation
\`\`\`

## Key Files
### Entry Points
- \`src/index.ts\` - Application entry
- \`src/app.ts\` - Main app component
- \`src/router.ts\` - Route definitions

### Core Modules
#### Authentication (\`src/services/auth/\`)
- \`auth.service.ts\` - Auth logic
- \`auth.middleware.ts\` - Route protection
- \`auth.types.ts\` - Type definitions

#### Data Layer (\`src/services/data/\`)
- \`database.ts\` - DB connection
- \`models/\` - Data models
- \`repositories/\` - Data access

### Configuration
- \`.env.example\` - Environment template
- \`config/\` - App configuration
- \`scripts/\` - Build/deploy scripts

## Component Hierarchy
\`\`\`
App
├── Layout
│   ├── Header
│   ├── Navigation
│   └── Footer
├── Pages
│   ├── Home
│   ├── Dashboard
│   └── Settings
└── Shared
    ├── Button
    ├── Modal
    └── Form
\`\`\`

## Data Flow
1. **User Action** → Component
2. **Component** → Service/Hook
3. **Service** → API/Database
4. **Response** → State Update
5. **State** → Component Re-render

## Key Patterns Locations
- **State Management**: \`src/store/\`
- **API Calls**: \`src/services/api/\`
- **Custom Hooks**: \`src/hooks/\`
- **Utilities**: \`src/utils/\`
- **Types**: \`src/types/\`

## Testing Structure
- **Unit Tests**: Alongside source files
- **Integration**: \`tests/integration/\`
- **E2E**: \`tests/e2e/\`

## Build Outputs
- **Development**: \`dist/\`
- **Production**: \`build/\`
- **Types**: \`types/\`
`
};

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
    const projectPath = validatedParams.projectPath || process.cwd();
    const projectName = validatedParams.projectName || basename(projectPath);
    
    logger.info('Initializing Memory Engineering', { projectPath, projectName });

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
        const existingConfig = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'));
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
      memoryVersion: '2.0'
    };
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Initialize MongoDB collection
    const collection = getMemoryCollection();
    
    // Create indexes for the new schema
    await collection.createIndex({ projectId: 1, memoryClass: 1, 'metadata.freshness': -1 });
    await collection.createIndex({ projectId: 1, 'metadata.importance': -1 });
    await collection.createIndex({ 'metadata.autoExpire': 1 }, { expireAfterSeconds: 0 });
    
    // Create vector search index
    try {
      await collection.createSearchIndex({
        name: 'memory_vectors',
        type: 'vectorSearch',
        definition: {
          fields: [{
            type: 'vector',
            path: 'contentVector',
            numDimensions: 1024,
            similarity: 'cosine'
          }]
        }
      });
    } catch (error) {
      logger.warn('Vector search index might already exist or not supported', error);
    }

    // Create text search index with all required fields
    try {
      await collection.createSearchIndex({
        name: 'memory_text',
        type: 'search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              // CRITICAL: projectId must be indexed as token for filtering
              projectId: {
                type: 'token',
                normalizer: 'lowercase'
              },
              searchableText: {
                type: 'string',
                analyzer: 'lucene.standard'
              },
              memoryClass: {
                type: 'token',
                normalizer: 'lowercase'
              },
              memoryType: {
                type: 'token',
                normalizer: 'lowercase'
              },
              'metadata.tags': {
                type: 'string',
                analyzer: 'lucene.standard'
              },
              'metadata.importance': {
                type: 'number'
              },
              'metadata.freshness': {
                type: 'date'
              },
              'content.memoryName': {
                type: 'token',
                normalizer: 'lowercase'
              },
              'content.markdown': {
                type: 'string',
                analyzer: 'lucene.standard'
              }
            }
          }
        }
      });
    } catch (error) {
      logger.warn('Text search index might already exist or not supported', error);
    }

    // Insert core memory files if new project
    if (isNewProject) {
      // Generate project-specific templates
      const templates = generateProjectSpecificTemplates(projectPath, projectName);
      
      const coreMemories = CORE_MEMORY_NAMES.map(memoryName => {
        const content = templates[memoryName] || FALLBACK_TEMPLATES[memoryName] || `# ${memoryName}\n\n[Content to be added]`;
        return createCoreMemory(projectId, memoryName, content);
      });
      
      await collection.insertMany(coreMemories as any[]);
      logger.info('Created core memory files', { count: coreMemories.length });
    }

    const statusMessage = isNewProject ? 'created' : 'already exists';
    
    return {
      content: [
        {
          type: 'text',
          text: `Memory Engineering Initialized

Project: ${projectName}
ID: ${projectId}
Status: ${isNewProject ? 'New project created' : 'Existing project found'}
Location: ${memoryDir}

Core Memory Documents (${statusMessage}):
${CORE_MEMORY_NAMES.map(name => `- ${name}`).join('\n')}

MongoDB Configuration:
- Collection: memory_engineering_documents
- Indexes: compound, vector, text, TTL
- Search: $rankFusion ready

Next steps:
1. Update core memory documents with project details
2. Run memory_engineering_sync to generate embeddings
3. Use memory_engineering_search to query memories`
        }
      ]
    };
  } catch (error) {
    logger.error('Init tool error:', error);
    throw error;
  }
}