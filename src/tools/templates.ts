import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export function generateProjectSpecificTemplates(projectPath: string, projectName: string): Record<string, string> {
  // Detect project type and technologies
  const hasPackageJson = existsSync(join(projectPath, 'package.json'));
  const hasTsConfig = existsSync(join(projectPath, 'tsconfig.json'));
  const hasGitignore = existsSync(join(projectPath, '.gitignore'));
  const hasReadme = existsSync(join(projectPath, 'README.md'));
  
  // Try to read package.json for more info
  let dependencies: string[] = [];
  let projectDescription = '';
  let scripts: Record<string, string> = {};
  
  if (hasPackageJson) {
    try {
      const pkg = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf-8'));
      projectDescription = pkg.description || '';
      dependencies = [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {})
      ];
      scripts = pkg.scripts || {};
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Detect common frameworks
  const isReact = dependencies.some(d => d.includes('react'));
  const isNext = dependencies.some(d => d.includes('next'));
  const isExpress = dependencies.some(d => d.includes('express'));
  const isTypescript = hasTsConfig || dependencies.includes('typescript');
  const isMCP = dependencies.some(d => d.includes('@modelcontextprotocol'));

  // Analyze directory structure
  const srcExists = existsSync(join(projectPath, 'src'));
  const hasTests = existsSync(join(projectPath, 'tests')) || existsSync(join(projectPath, 'test'));
  
  return {
    'projectbrief': `# Project Brief

## Project Name
${projectName}

## Overview
${projectDescription || `[Describe what ${projectName} does and its main purpose]`}

## Problem Statement
[What problem does this project solve?]

## Solution Approach
[How does this project solve the problem?]

## Goals
- **Primary**: [Main objective]
- **Secondary**: [Additional objectives]
- **Metrics**: [How will success be measured?]

## Scope
### In Scope
- [Core features to be implemented]
- [Key functionality]

### Out of Scope
- [Features not included in current version]
- [Future considerations]

## Success Criteria
- **Technical**: [Performance, reliability, scalability requirements]
- **User**: [User experience goals]
- **Business**: [Business objectives]
`,

    'productContext': `# Product Context

## Why This Project Exists
[Explain the motivation behind ${projectName}]

## Target Users
- **Primary Users**: [Who will use this most?]
- **Secondary Users**: [Who else might use this?]

## User Problems
- [Problem 1 users face]
- [Problem 2 users face]
- [Problem 3 users face]

## How This Helps
- [How it solves problem 1]
- [How it solves problem 2]
- [How it solves problem 3]

## User Journey
1. [Step 1 - User discovers the product]
2. [Step 2 - User starts using it]
3. [Step 3 - User achieves their goal]

## Success Metrics
- **Adoption**: [How many users?]
- **Engagement**: [How often used?]
- **Satisfaction**: [How to measure?]

## Competitive Landscape
- **Alternative 1**: [What it does, pros/cons]
- **Alternative 2**: [What it does, pros/cons]
- **Our Advantage**: [What makes this better]
`,

    'systemPatterns': `# System Patterns

## Architecture Overview
${isMCP ? 'MCP Server Architecture' : isNext ? 'Next.js Application' : isReact ? 'React Application' : isExpress ? 'Express API Server' : 'Node.js Application'}

## Technology Stack
- **Language**: ${isTypescript ? 'TypeScript' : 'JavaScript'}
- **Runtime**: Node.js
${isReact ? '- **Frontend**: React' : ''}
${isNext ? '- **Framework**: Next.js' : ''}
${isExpress ? '- **Backend**: Express.js' : ''}
${isMCP ? '- **Protocol**: Model Context Protocol (MCP)' : ''}

## Project Structure
\`\`\`
${projectName}/
${srcExists ? `├── src/           # Source code
│   ├── [modules]   # Core modules
│   └── [utils]     # Utilities` : '├── [source files]'}
${hasTests ? `├── tests/         # Test files` : ''}
├── package.json   # Dependencies
${hasTsConfig ? '├── tsconfig.json  # TypeScript config' : ''}
└── README.md      # Documentation
\`\`\`

## Code Standards
- **Style Guide**: [ESLint/Prettier configuration]
- **Naming Conventions**: [camelCase, PascalCase rules]
- **File Organization**: [How files should be structured]

## Common Patterns

### Error Handling
\`\`\`${isTypescript ? 'typescript' : 'javascript'}
try {
  // Operation
} catch (error) {
  // Handle error appropriately
}
\`\`\`

### Data Flow
1. [Input/Request]
2. [Validation]
3. [Processing]
4. [Response/Output]

## Testing Strategy
- **Unit Tests**: [Testing individual functions]
- **Integration Tests**: [Testing modules together]
- **E2E Tests**: [Testing full workflows]

## Performance Considerations
- [Optimization strategies]
- [Caching approach]
- [Resource management]
`,

    'activeContext': `# Active Context

## Current Sprint/Focus
**Sprint**: Initial Development
**Duration**: ${new Date().toLocaleDateString()} - [End date]
**Goal**: [What should be accomplished this sprint?]

## Active Tasks
### In Progress
- [ ] Set up project structure
- [ ] [Current task 1]
- [ ] [Current task 2]

### Up Next
- [ ] [Next task 1]
- [ ] [Next task 2]
- [ ] [Next task 3]

## Recent Changes
### ${new Date().toLocaleDateString()}
- **Started**: Project initialization
- **Set up**: Memory Engineering integration

## Current Blockers
- [Any blockers or dependencies]

## Key Decisions This Sprint
- **Decision**: [What was decided]
  - **Rationale**: [Why this decision]
  - **Alternatives considered**: [Other options]

## Notes for AI Assistant
- Focus on: [What AI should prioritize]
- Watch out for: [Common pitfalls]
- Reference: [Important files or patterns]
`,

    'techContext': `# Tech Context

## Technology Stack

### Core Technologies
- **Language**: ${isTypescript ? 'TypeScript' : 'JavaScript'}
- **Runtime**: Node.js
- **Package Manager**: ${hasPackageJson ? 'npm/yarn/pnpm' : 'Unknown'}

### Key Dependencies
${dependencies.slice(0, 10).map(dep => `- ${dep}`).join('\n') || '- [List key dependencies]'}

### Development Tools
- **Version Control**: Git
- **Testing**: ${dependencies.find(d => d.includes('jest')) ? 'Jest' : dependencies.find(d => d.includes('vitest')) ? 'Vitest' : '[Testing framework]'}
- **Linting**: ${dependencies.includes('eslint') ? 'ESLint' : '[Linting tool]'}
- **Formatting**: ${dependencies.includes('prettier') ? 'Prettier' : '[Code formatter]'}

## Development Environment

### Prerequisites
- Node.js (version requirement)
- [Other requirements]

### Setup Instructions
1. Clone repository
2. Install dependencies: \`npm install\`
3. [Additional setup steps]

### Available Scripts
${Object.entries(scripts).slice(0, 5).map(([name, cmd]) => `- \`npm run ${name}\`: ${cmd}`).join('\n') || '- [List available scripts]'}

## Configuration

### Environment Variables
\`\`\`bash
# Required
[VAR_NAME]=value

# Optional
[OTHER_VAR]=value
\`\`\`

### Build Configuration
- **Output**: [Where build files go]
- **Target**: [Build target environment]
- **Optimizations**: [Build optimizations]

## API/External Services
- [Service 1]: [Purpose and configuration]
- [Service 2]: [Purpose and configuration]

## Performance Targets
- **Response Time**: [Target latency]
- **Memory Usage**: [Target memory limit]
- **Build Time**: [Target build duration]

## Security Considerations
- [Security measure 1]
- [Security measure 2]
- [Security measure 3]
`,

    'progress': `# Progress Log

## Completed Features
### ${new Date().toLocaleDateString()} - Project Initialization
- **What**: Set up ${projectName} with Memory Engineering
- **How**: Initialized memory system, created core documents
- **Time**: [Actual time taken]

## Milestones Reached
### ${new Date().toLocaleDateString()} - Project Started
- **Achievement**: Project structure created
- **Next Steps**: Begin implementing core features

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

## Code Quality Metrics
- **Test Coverage**: [Current %]
- **Linting Issues**: [Current count]
- **Type Coverage**: ${isTypescript ? '[Current %]' : 'N/A'}
- **Bundle Size**: [Current size]

## Performance Metrics
- **Build Time**: [Current duration]
- **Test Suite**: [Current duration]
- **Memory Usage**: [Current usage]

## Team Velocity
- **Tasks Completed**: [This sprint]
- **Story Points**: [If using]
- **Blockers Resolved**: [Count]
`,

    'codebaseMap': `# Codebase Map

## Directory Structure
\`\`\`
${projectName}/
${generateDirectoryTree(projectPath, '', 0, 3)}
\`\`\`

## Key Files
### Entry Points
${hasPackageJson ? '- `package.json` - Project configuration' : ''}
${srcExists ? '- `src/index` - Main entry point' : '- `index` - Main entry point'}
${hasReadme ? '- `README.md` - Project documentation' : ''}

### Configuration Files
${hasTsConfig ? '- `tsconfig.json` - TypeScript configuration' : ''}
${hasGitignore ? '- `.gitignore` - Git ignore rules' : ''}
- [Other config files]

## Module Organization
${srcExists ? `### Source Code (\`src/\`)
- **Structure**: [How code is organized]
- **Naming**: [File naming conventions]
- **Exports**: [Export patterns]` : `### Code Organization
- [How code is organized]`}

## Data Flow
1. **Input**: [Where data enters]
2. **Processing**: [How data is processed]
3. **Storage**: [Where data is stored]
4. **Output**: [Where data exits]

## Key Patterns Used
- **Pattern 1**: [Description and location]
- **Pattern 2**: [Description and location]
- **Pattern 3**: [Description and location]

## Testing Structure
${hasTests ? `- **Test Files**: Located in \`tests/\` or alongside source
- **Test Naming**: [Test file naming convention]
- **Test Organization**: [How tests are structured]` : '- [Testing approach]'}

## Build Pipeline
1. **Source**: [Source files]
2. **Transpile**: ${isTypescript ? 'TypeScript → JavaScript' : 'Process files'}
3. **Bundle**: [Bundling process]
4. **Output**: [Output location]

## Important Conventions
- **Imports**: [Import style and organization]
- **Exports**: [Export patterns]
- **Async**: [Async/await patterns]
- **Types**: ${isTypescript ? '[Type definition patterns]' : 'N/A'}
`
  };
}

function generateDirectoryTree(dirPath: string, prefix: string, depth: number, maxDepth: number): string {
  if (depth >= maxDepth) return '';
  
  try {
    const items = readdirSync(dirPath, { withFileTypes: true })
      .filter(item => !item.name.startsWith('.') && 
        !['node_modules', 'dist', 'build', '.git'].includes(item.name))
      .sort((a, b) => {
        // Directories first, then files
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    return items.map((item, index) => {
      const isLast = index === items.length - 1;
      const extension = isLast ? '└── ' : '├── ';
      const line = prefix + extension + item.name + (item.isDirectory() ? '/' : '') + '\n';
      
      if (item.isDirectory() && depth < maxDepth - 1) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        return line + generateDirectoryTree(join(dirPath, item.name), newPrefix, depth + 1, maxDepth);
      }
      
      return line;
    }).join('');
  } catch (e) {
    return '';
  }
}