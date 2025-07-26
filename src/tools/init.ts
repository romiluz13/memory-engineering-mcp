import { join, basename } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { InitToolSchema, type ProjectConfig, createCoreMemory, CORE_MEMORY_FILES } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { createHash } from 'crypto';

const MEMORY_ENGINEERING_DIR = '.memory-engineering';
const CONFIG_FILE = 'config.json';

const INITIAL_MEMORY_TEMPLATES = {
  'projectbrief.md': `# Project Brief

## Project Name
[Project name here]

## Overview
[One sentence: What does this project do?]

## Problem & Solution
- **Problem**: [Specific problem we're solving]
- **Solution**: [How we're solving it]
- **Why Now**: [Why is this the right time?]

## Goals
- **Primary**: [Main objective - be specific]
- **Metrics**: [How we measure success]
- **Timeline**: [Key milestones]

## Scope
### In Scope
- [Core feature 1]
- [Core feature 2]
- [Technical requirement]

### Out of Scope
- [Future feature]
- [Not needed now]

## Success Criteria
- **Technical**: [e.g., 95% test coverage, <100ms response]
- **User**: [e.g., Solves X problem for Y users]
- **Business**: [e.g., Reduces Z by N%]

## AI Context Guide
**🤖 For AI Coding Assistants - Critical Implementation Notes:**
- **Entry Point**: Start with [main component/feature]
- **Architecture**: Follow patterns documented in systemPatterns.md
- **State Management**: [Redux/Context/Zustand - specify approach]
- **Testing Strategy**: [Jest/Vitest/Playwright - specify tools]
- **Key Dependencies**: Check techContext.md for versions
`,

  'systemPatterns.md': `# System Patterns

## Architecture Overview
[High-level architecture description]

## Design Patterns
### Pattern 1: [Name]
- **When to use**: [Specific scenarios]
- **Implementation**: [Code example or reference]
- **Benefits**: [Why this pattern]

### Pattern 2: [Name]
- **When to use**: [Specific scenarios]
- **Implementation**: [Code example or reference]
- **Benefits**: [Why this pattern]

## Code Standards
### Naming Conventions
- **Components**: PascalCase (e.g., UserProfile)
- **Functions**: camelCase (e.g., getUserData)
- **Constants**: UPPER_SNAKE_CASE (e.g., API_ENDPOINT)
- **Files**: kebab-case (e.g., user-profile.tsx)

### File Organization
\`\`\`
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── utils/         # Helper functions
├── services/      # API and external services
└── types/         # TypeScript type definitions
\`\`\`

## Common Patterns
### Error Handling
\`\`\`typescript
try {
  // Operation
} catch (error) {
  logger.error('Context:', error);
  // User-friendly error handling
}
\`\`\`

### Data Fetching
[Your preferred pattern - hooks, services, etc.]

## Performance Guidelines
- Lazy load heavy components
- Memoize expensive computations
- Optimize re-renders with React.memo
- Use virtual scrolling for long lists

## Security Patterns
- Input validation on all user data
- Sanitize HTML content
- Use environment variables for secrets
- Implement proper authentication checks
`,

  'activeContext.md': `# Active Context

## Current Sprint/Focus
**Sprint**: [Current sprint number/name]
**Duration**: [Start date - End date]
**Goal**: [What we're accomplishing]

## Active Tasks
### In Progress
- [ ] [Task 1 - Who's working on it]
- [ ] [Task 2 - Who's working on it]

### Up Next
- [ ] [Next priority task]
- [ ] [Following task]

## Recent Changes
### [Date]
- **Changed**: [What was modified]
- **Reason**: [Why it was changed]
- **Impact**: [What this affects]

## Current Blockers
- **Blocker 1**: [Description] - [Who can help]
- **Blocker 2**: [Description] - [Resolution strategy]

## Key Decisions This Sprint
- **Decision**: [What was decided]
  - **Rationale**: [Why this choice]
  - **Alternatives considered**: [Other options]

## AI Assistant Focus Areas
**🤖 Priority for AI assistance:**
1. [Current feature needing implementation]
2. [Bug that needs fixing]
3. [Code that needs refactoring]

**Context**: [Any special context AI should know for current work]
`,

  'techContext.md': `# Tech Context

## Technology Stack
### Frontend
- **Framework**: [React/Vue/Angular/etc] v[X.X.X]
- **State Management**: [Redux/Context/Zustand/etc]
- **Styling**: [CSS Modules/Styled Components/Tailwind/etc]
- **Build Tool**: [Vite/Webpack/etc]

### Backend
- **Runtime**: [Node.js/Deno/etc] v[X.X.X]
- **Framework**: [Express/Fastify/Next.js/etc]
- **Database**: [MongoDB/PostgreSQL/etc]
- **ORM/ODM**: [Mongoose/Prisma/etc]

### DevOps
- **Hosting**: [AWS/Vercel/Netlify/etc]
- **CI/CD**: [GitHub Actions/CircleCI/etc]
- **Monitoring**: [Sentry/DataDog/etc]

## Key Dependencies
\`\`\`json
{
  "critical": {
    "react": "^18.2.0",
    "mongodb": "^6.17.0",
    "[package]": "[version]"
  }
}
\`\`\`

## Development Environment
### Required Tools
- Node.js [version]
- npm/yarn/pnpm [version]
- [Other tool] [version]

### Environment Variables
\`\`\`bash
# Required
API_URL=
DATABASE_URL=
AUTH_SECRET=

# Optional
DEBUG_MODE=
FEATURE_FLAGS=
\`\`\`

## API Integrations
### [Service Name]
- **Purpose**: [What it's used for]
- **Authentication**: [API key/OAuth/etc]
- **Rate Limits**: [Requests per minute/hour]
- **Documentation**: [Link to docs]

## Performance Targets
- **Page Load**: < [X]s
- **API Response**: < [X]ms
- **Bundle Size**: < [X]KB
- **Lighthouse Score**: > [X]

## Browser Support
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile: iOS 14+, Android 8+
`,

  'progress.md': `# Progress Log

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

  'codebaseMap.md': `# Codebase Map

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

    // Create text search index
    try {
      await collection.createSearchIndex({
        name: 'memory_text',
        type: 'search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              searchableText: { type: 'string' },
              'metadata.tags': { type: 'string' }
            }
          }
        }
      });
    } catch (error) {
      logger.warn('Text search index might already exist or not supported', error);
    }

    // Insert core memory files if new project
    if (isNewProject) {
      const coreMemories = CORE_MEMORY_FILES.map(fileName => {
        const content = INITIAL_MEMORY_TEMPLATES[fileName] || `# ${fileName}\n\n[Content to be added]`;
        return createCoreMemory(projectId, fileName, content);
      });
      
      await collection.insertMany(coreMemories as any[]);
      logger.info('Created core memory files', { count: coreMemories.length });
    }

    const statusMessage = isNewProject ? 'created' : 'already exists';
    
    return {
      content: [
        {
          type: 'text',
          text: `🧠 Memory Engineering 2.0 Initialized!

${isNewProject ? '✨ Created new' : '📂 Found existing'} project memory system:
- Project: ${projectName}
- ID: ${projectId}
- Location: ${memoryDir}

📚 Core Memory Files ${statusMessage}:
${CORE_MEMORY_FILES.map(f => `- ${f}`).join('\n')}

🗄️ MongoDB Setup:
- Collection: memory_engineering_documents
- Indexes: Compound, Vector, Text, TTL
- $rankFusion: Ready for hybrid search

🎯 Next Steps:
1. Update memory files with your project details
2. Run memory_engineering/sync to generate embeddings
3. Use memory_engineering/search for intelligent retrieval

Your AI assistant now has a photographic memory! 🚀`
        }
      ]
    };
  } catch (error) {
    logger.error('Init tool error:', error);
    throw error;
  }
}