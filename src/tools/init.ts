import { join, basename } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { InitToolSchema, type ProjectConfig, type MemoryFileType } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { createHash } from 'crypto';
import { initializeContextEngineeringTemplates } from '../services/context-engineering.js';

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
**When coding this project, remember:**
- Start with [this component/feature]
- Use [specific patterns/libraries]
- Avoid [anti-patterns]
- See systemPatterns.md for architecture
`,
  'productContext.md': `# Product Context

## Problem Statement
**The Problem**: [Specific problem in 1-2 sentences]
**Current Solutions**: [What exists today and why it's not enough]
**Our Approach**: [How we're different/better]

## Target Users
### Primary User
- **Who**: [Specific user type]
- **Needs**: [What they're trying to accomplish]
- **Pain Points**: [Current frustrations]

### User Journey
1. [Step 1: Discovery]
2. [Step 2: First use]
3. [Step 3: Regular use]

## Key Features
- **Feature 1**: [What it does] → [User benefit]
- **Feature 2**: [What it does] → [User benefit]

## Competitive Analysis
- **Alternative 1**: [Pros/Cons]
- **Alternative 2**: [Pros/Cons]
- **Our Advantage**: [Why choose us]

## Success Metrics
- **Adoption**: [Target metrics]
- **Engagement**: [Usage patterns]
- **Satisfaction**: [Quality measures]
`,
  'activeContext.md': `# Active Context

## Current Sprint/Phase
**Goal**: [What we're trying to achieve this sprint]
**Deadline**: [When it needs to be done]

## Active Tasks
### In Progress
- [ ] [Current task with context]
  - Status: [Where we are]
  - Blockers: [Any issues]
  - Next: [Immediate next step]

### Up Next
- [ ] [Next priority]
- [ ] [Following task]

## Recent Changes
- **[Date]**: [What changed and why]
- **[Date]**: [Important update]

## Working Directory Structure
\`\`\`
src/
├── [Key directories with purpose]
└── [Current focus area]
\`\`\`

## Key Commands
\`\`\`bash
# Development
npm run dev  # [What this does]
npm test     # [Test command]

# Project-specific
[Important commands]
\`\`\`

## Open Questions
- [ ] [Technical decision needed]
- [ ] [Design choice to make]

## AI Coding Notes
- Currently working in: [file/module]
- Watch out for: [gotchas]
- Related files: [see techContext.md for stack]
`,
  'systemPatterns.md': `# System Patterns

## Architecture Overview
\`\`\`
[ASCII diagram or component layout]
\`\`\`

## Core Design Principles
1. **[Principle]**: [Why it matters here]
2. **[Principle]**: [How we implement it]

## Key Components
### [Component Name]
- **Purpose**: [What it does]
- **Interface**: [How to use it]
- **Location**: \`src/path/to/component\`
- **Example**:
\`\`\`typescript
// Quick usage example
\`\`\`

## Design Patterns
### [Pattern Name]
- **Where**: [Which components use this]
- **Why**: [Problem it solves]
- **Implementation**:
\`\`\`typescript
// Code example
\`\`\`

## Data Flow
1. **Input**: [How data enters]
2. **Processing**: [Key transformations]
3. **Storage**: [Where/how stored]
4. **Output**: [How data exits]

## Error Handling Strategy
- **Validation**: [Input validation approach]
- **Error Types**: [Common errors and handling]
- **User Feedback**: [How errors are communicated]

## Performance Considerations
- **Bottlenecks**: [Known slow points]
- **Optimizations**: [What we've optimized]
- **Monitoring**: [How to measure]

## AI Implementation Guide
- **Entry Points**: Start with [these files]
- **Core Logic**: Located in [these modules]
- **Extension Points**: Add features at [these interfaces]
- **Testing**: Run [these tests] when changing [this]
`,
  'techContext.md': `# Technical Context

## Technology Stack
### Core
- **Language**: [Language + version]
- **Runtime**: [Node.js/Python/etc + version]
- **Framework**: [Framework + why chosen]
- **Database**: MongoDB Atlas (Vector Search enabled)

### Key Dependencies
\`\`\`json
{
  "critical": {
    "[package]": "[version] - [why essential]"
  }
}
\`\`\`

## Development Environment
### Prerequisites
- [Requirement 1 with version]
- [Requirement 2 with install command]

### Setup Steps
\`\`\`bash
# 1. Clone and install
git clone [repo]
npm install

# 2. Environment variables
cp .env.example .env.local
# Edit: [Which vars to set]

# 3. Run development
npm run dev
\`\`\`

## Architecture Decisions
### [Decision 1]
- **Choice**: [What we chose]
- **Alternatives**: [What we didn't choose]
- **Rationale**: [Why this was best]

## API/Interface Design
### [Main API/Interface]
\`\`\`typescript
// Interface example
interface Example {
  // Key method signatures
}
\`\`\`

## Performance Profile
- **Load Time**: [Target metrics]
- **Memory Usage**: [Constraints]
- **Scalability**: [Considerations]

## Security Considerations
- **Authentication**: [Approach]
- **Data Protection**: [Methods]
- **Input Validation**: [Strategy]

## Testing Strategy
- **Unit Tests**: [Framework, coverage target]
- **Integration**: [Key test scenarios]
- **E2E**: [Critical paths]

## Deployment
- **Environment**: [Where it runs]
- **CI/CD**: [Pipeline details]
- **Monitoring**: [What we track]
`,
  'progress.md': `# Progress

## Project Timeline
- **Started**: [Date]
- **Target**: [Date]
- **Phase**: [Current phase]

## Completed ✅
### [Week/Sprint]
- [x] [Achievement with impact]
  - Result: [What this enabled]
  - Learning: [Key insight]

## In Progress 🚧
### [Current Task]
- [ ] [Subtask 1] - [% complete]
- [ ] [Subtask 2] - [Status]

## Upcoming 📋
### Next Sprint
- [ ] [Priority 1]
- [ ] [Priority 2]

## Issues & Solutions 🔧
### [Issue Name]
- **Problem**: [What went wrong]
- **Solution**: [How we fixed it]
- **Prevention**: [Avoiding in future]

## Metrics 📊
- **Coverage**: [Test %]
- **Performance**: [Key metric]
- **Progress**: [% to goal]

## Lessons Learned 💡
1. **[Topic]**: [Insight]
2. **[Pattern]**: [What worked]

## AI Notes
- **Effective**: [Patterns that worked]
- **Avoid**: [What slowed us down]
- **Remember**: [Key context for AI]
`,
};

function generateProjectId(projectPath: string): string {
  // Create deterministic project ID from path
  const hash = createHash('sha256').update(projectPath).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

export async function initTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = InitToolSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();
    const projectName = params.projectName || basename(projectPath);

    // Create .memory-engineering directory
    const memoryEngineeringPath = join(projectPath, MEMORY_ENGINEERING_DIR);
    if (!existsSync(memoryEngineeringPath)) {
      mkdirSync(memoryEngineeringPath, { recursive: true });
    }

    // Check if already initialized
    const configPath = join(memoryEngineeringPath, CONFIG_FILE);
    if (existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Memory Engineering already initialized for this project. Use memory_engineering/read to access existing memories.',
          },
        ],
      };
    }

    // Generate project ID (deterministic from path)
    const projectId = generateProjectId(projectPath);

    // Create project config
    const config: ProjectConfig = {
      projectId,
      projectPath,
      name: projectName,
      createdAt: new Date().toISOString(),
    };

    // Save config
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Create initial memory files in MongoDB
    const collection = getMemoryCollection();
    const now = new Date();

    const memoryDocuments = Object.entries(INITIAL_MEMORY_TEMPLATES).map(([fileName, content]) => ({
      projectId,
      fileName,
      content,
      metadata: {
        lastUpdated: now,
        version: 1,
        type: fileName.replace('.md', '') as MemoryFileType,
        fileSize: Buffer.byteLength(content, 'utf-8'),
      },
      references: [],
      createdAt: now,
      updatedAt: now,
    }));

    await collection.insertMany(memoryDocuments);

    // Initialize Context Engineering templates
    logger.info('Initializing Context Engineering templates...');
    await initializeContextEngineeringTemplates();

    // Create regular indexes if they don't exist
    try {
      await collection.createIndex({ projectId: 1, fileName: 1 }, { unique: true });
    } catch (e) {
      logger.debug('Index already exists:', e);
    }
    
    try {
      await collection.createIndex({ projectId: 1, 'metadata.type': 1 });
    } catch (e) {
      logger.debug('Index already exists:', e);
    }
    
    // Note: Text search now uses Atlas Search index created during sync

    logger.info(`Initialized memory bank for project: ${projectName} (${projectId})`);

    return {
      content: [
        {
          type: 'text',
          text: `Memory Engineering initialized successfully!

Project: ${projectName}
ID: ${projectId}
Path: ${projectPath}

Created files:
${Object.keys(INITIAL_MEMORY_TEMPLATES).map((f) => `- ${f}`).join('\n')}

Next steps:
1. Update memory files with project-specific information
2. Use memory_engineering/sync to generate embeddings
3. Use memory_engineering/search to query your memories`,
        },
      ],
    };
  } catch (error) {
    logger.error('Init tool error:', error);
    throw error;
  }
}