/**
 * Memory Templates for A+ Quality
 * These templates ensure consistent, high-quality memory creation
 */

export const MEMORY_TEMPLATES: Record<string, string> = {
  projectbrief: `## Project Overview
[Write 2-3 sentences about what you're building]

### Core Requirements
- [Requirement 1 - be specific]
- [Requirement 2 - be specific]
- [Requirement 3 - be specific]
- [Requirement 4 - be specific]
- [Requirement 5 - be specific]

### Project Scope
**In Scope:**
- [What IS included - item 1]
- [What IS included - item 2]
- [What IS included - item 3]

**Out of Scope:**
- [What is NOT included - item 1]
- [What is NOT included - item 2]

### Success Criteria
1. [Measurable criterion 1]
2. [Measurable criterion 2]
3. [Measurable criterion 3]

### Key Features (Priority Order)
- P0: [Critical feature 1]
- P0: [Critical feature 2]
- P1: [Important feature 1]
- P1: [Important feature 2]
- P2: [Nice-to-have feature]`,

  productContext: `## Product Context

### Problem Being Solved
[Describe the specific problem in 2-3 sentences]

### Target Users
- [User persona 1 and their needs]
- [User persona 2 and their needs]
- [User persona 3 and their needs]

### User Journey
1. [Step 1 - how user starts]
2. [Step 2 - main interaction]
3. [Step 3 - key value moment]
4. [Step 4 - outcome achieved]

### Expected Impact
- Before: [Current painful situation]
- After: [Improved situation with product]
- Metrics: [How we measure success]

### User Experience Goals
- [UX goal 1 - e.g., intuitive onboarding]
- [UX goal 2 - e.g., minimal learning curve]
- [UX goal 3 - e.g., delightful interactions]`,

  activeContext: `## Active Context - [${new Date().toISOString()}]

### Current Work Session
**Session Goal:** [What are you trying to accomplish right now?]
**Current Task:** [Specific task you're working on]

### Recent Actions (Last 5)
1. [${new Date().toISOString()}]: [Action taken]
2. [Timestamp]: [Action taken]
3. [Timestamp]: [Action taken]
4. [Timestamp]: [Action taken]
5. [Timestamp]: [Action taken]

### Key Decisions Made
- **Decision:** [What was decided]
  **Reasoning:** [Why this choice]
- **Decision:** [What was decided]
  **Reasoning:** [Why this choice]

### Patterns & Insights Discovered
- [Insight 1 - what you learned]
- [Insight 2 - pattern noticed]
- [Insight 3 - important realization]

### Current Blockers
- [Blocker 1 and attempted solutions]
- [Blocker 2 or write "None currently"]

### Next Immediate Steps
1. [Next action to take]
2. [Following action]
3. [Third priority action]

### Important Context to Remember
[Any crucial information for next session]`,

  systemPatterns: `## System Architecture

### High-Level Architecture
[Describe the overall architecture in 3-5 sentences - e.g., microservices, monolith, event-driven]

### Key Design Patterns
1. **Pattern:** [Pattern name]
   - **Where Used:** [Specific components]
   - **Why Chosen:** [Reasoning]

2. **Pattern:** [Pattern name]
   - **Where Used:** [Specific components]
   - **Why Chosen:** [Reasoning]

3. **Pattern:** [Pattern name]
   - **Where Used:** [Specific components]
   - **Why Chosen:** [Reasoning]

### Component Relationships
[Describe how main components interact - 3-4 sentences]

### Data Flow
1. [Step 1 - where data originates]
2. [Step 2 - processing layer]
3. [Step 3 - transformation]
4. [Step 4 - storage/output]
5. [Step 5 - response/feedback]

### Critical Implementation Paths
- **Path 1:** [Component A] → [Component B] → [Component C]
  - Purpose: [Why this path matters]
- **Path 2:** [Component X] → [Component Y] → [Component Z]
  - Purpose: [Why this path matters]

### Architecture Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]
- [Decision 3 and rationale]`,

  techContext: `## Technical Context

### Core Technology Stack
- **Language:** [Primary language and version]
- **Framework:** [Main framework and version]
- **Database:** [Database system and version]
- **Runtime:** [Runtime environment and version]

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| [package1] | [version] | [why needed] |
| [package2] | [version] | [why needed] |
| [package3] | [version] | [why needed] |
| [package4] | [version] | [why needed] |
| [package5] | [version] | [why needed] |

### Development Setup
- **IDE:** [Preferred IDE and extensions]
- **Package Manager:** [npm/yarn/pnpm and version]
- **Build Tool:** [webpack/vite/etc]
- **Testing:** [test framework]
- **Linting:** [linter configuration]

### Technical Constraints
- [Constraint 1 - e.g., must run on 2GB RAM]
- [Constraint 2 - e.g., needs Node 18+]
- [Constraint 3 - e.g., MongoDB Atlas required]

### Environment Requirements
- **Development:** [Dev environment needs]
- **Staging:** [Staging requirements]
- **Production:** [Production requirements]

### Tool Usage Patterns
- [How we use tool 1]
- [How we use tool 2]
- [Conventions we follow]`,

  progress: `## Progress Tracking

### ✅ Completed Features
- [Date]: [Feature completed] (time spent)
- [Date]: [Feature completed] (time spent)
- [Date]: [Feature completed] (time spent)

### 🔄 Currently In Progress
- [Feature/task] - [XX]% complete
  - What's done: [Completed parts]
  - What's left: [Remaining work]
- [Feature/task] - [XX]% complete
  - What's done: [Completed parts]
  - What's left: [Remaining work]

### 📝 TODO Queue (Priority Order)
1. **[P0]** [Critical task]
2. **[P0]** [Critical task]
3. **[P1]** [Important task]
4. **[P1]** [Important task]
5. **[P2]** [Nice to have]

### 🐛 Known Issues
- **[Critical]** [Issue description]
  - Reproduction: [How to reproduce]
  - Attempted fixes: [What was tried]
- **[Medium]** [Issue description]
  - Impact: [Who/what affected]

### 💡 Technical Debt
- [Debt item 1 - what needs refactoring]
- [Debt item 2 - what needs improvement]
- [Test coverage: XX%]

### 📊 Project Metrics
- Total files: [number]
- Lines of code: [number]
- Test coverage: [percentage]
- Open issues: [number]
- Completion: [percentage]`,

  codebaseMap: `## Codebase Structure

### Directory Layout
\`\`\`
/project-root
  /src
    /[directory] - [purpose]
    /[directory] - [purpose]
    /[directory] - [purpose]
  /tests - [test organization]
  /docs - [documentation]
  /config - [configuration files]
\`\`\`

### Key Files and Their Purposes
| File | Purpose | Critical? |
|------|---------|-----------|
| [file1] | [what it does] | Yes/No |
| [file2] | [what it does] | Yes/No |
| [file3] | [what it does] | Yes/No |
| [file4] | [what it does] | Yes/No |

### Entry Points
- **Main:** [primary entry file]
- **API:** [API entry point]
- **CLI:** [CLI entry point]
- **Tests:** [test entry point]

### Module Organization
- **Core Modules:** [List main modules]
- **Utilities:** [Helper functions location]
- **Services:** [Business logic location]
- **Models:** [Data models location]

### Code Statistics
- Total source files: [number]
- Total test files: [number]
- Primary language: [language]
- Code-to-test ratio: [ratio]

### Critical Paths
- Startup sequence: [file1] → [file2] → [file3]
- Request flow: [entry] → [middleware] → [handler] → [response]
- Build process: [source] → [transform] → [bundle] → [output]

### Dependencies Graph
- [Core module] depends on → [modules]
- [Service layer] depends on → [modules]
- [API layer] depends on → [modules]`
};

/**
 * Get a template with current timestamp
 */
export function getTemplate(memoryName: string): string {
  const template = MEMORY_TEMPLATES[memoryName];
  if (!template) {
    return '';
  }
  
  // Replace timestamp placeholder if it's activeContext
  if (memoryName === 'activeContext') {
    return template.replace('[${new Date().toISOString()}]', new Date().toISOString());
  }
  
  return template;
}

/**
 * Get a simplified template for quick starts
 */
export function getQuickTemplate(memoryName: string): string {
  const quickTemplates: Record<string, string> = {
    projectbrief: 'Project: [name]\nGoal: [what it does]\nScope: [main features]\nSuccess: [how we measure]',
    productContext: 'Problem: [what problem]\nUsers: [who needs this]\nSolution: [how it helps]',
    activeContext: `[${new Date().toISOString()}] Currently: [what you're doing]\nNext: [what's next]`,
    systemPatterns: 'Architecture: [type]\nPatterns: [list patterns]\nFlow: [data flow]',
    techContext: 'Stack: [languages/frameworks]\nDeps: [key packages]\nConstraints: [limitations]',
    progress: 'Done: [completed]\nDoing: [in progress]\nTodo: [next tasks]',
    codebaseMap: 'Structure: [main directories]\nEntry: [entry points]\nKey files: [important files]'
  };
  
  return quickTemplates[memoryName] || '';
}
