import { getDb } from '../db/connection.js';
import { logger } from '../utils/logger.js';

export interface ContextEngineeringTemplate {
  _id?: string;
  templateName: 'generate-prp' | 'execute-prp';
  content: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Context Engineering template by name
 */
export async function getContextEngineeringTemplate(
  templateName: 'generate-prp' | 'execute-prp'
): Promise<string> {
  try {
    const collection = getDb().collection<ContextEngineeringTemplate>('context_engineering_templates');
    
    const template = await collection.findOne({ templateName });
    
    if (!template) {
      logger.warn(`Template ${templateName} not found, using fallback`);
      return getFallbackTemplate(templateName);
    }
    
    logger.info(`Retrieved Context Engineering template: ${templateName}`);
    return template.content;
    
  } catch (error) {
    logger.error(`Error fetching template ${templateName}:`, error);
    return getFallbackTemplate(templateName);
  }
}

/**
 * Initialize Context Engineering templates with original system prompts
 */
export async function initializeContextEngineeringTemplates(): Promise<void> {
  const collection = getDb().collection<ContextEngineeringTemplate>('context_engineering_templates');
  
  // Check if templates already exist
  const existingCount = await collection.countDocuments();
  if (existingCount > 0) {
    logger.info('Context Engineering templates already initialized');
    return;
  }
  
  const templates: ContextEngineeringTemplate[] = [
    {
      templateName: 'generate-prp',
      content: GENERATE_PRP_TEMPLATE,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      templateName: 'execute-prp', 
      content: EXECUTE_PRP_TEMPLATE,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await collection.insertMany(templates);
  logger.info('Context Engineering templates initialized successfully');
}

/**
 * Fallback templates (hardcoded for zero risk)
 */
function getFallbackTemplate(templateName: 'generate-prp' | 'execute-prp'): string {
  return templateName === 'generate-prp' ? GENERATE_PRP_TEMPLATE : EXECUTE_PRP_TEMPLATE;
}

/**
 * Original /generate-prp system prompt (EXACT from context-engineering-intro)
 */
const GENERATE_PRP_TEMPLATE = `# Create PRP

Generate a complete PRP for general feature implementation with thorough research. Ensure context is passed to the AI agent to enable self-validation and iterative refinement. Read the feature request first to understand what needs to be created, how the examples provided help, and any other considerations.

The AI agent only gets the context you are appending to the PRP and training data. Assume the AI agent has access to the codebase and the same knowledge cutoff as you, so its important that your research findings are included or referenced in the PRP. The Agent has Websearch capabilities, so pass urls to documentation and examples.

## STEP 0: Project Type Detection (CRITICAL FIRST STEP!)

**BEFORE starting research, determine the project type:**

🔍 **Project Analysis Checklist:**
- Check if directory has package.json, requirements.txt, Cargo.toml, etc.
- Look for src/, lib/, app/ directories with actual code
- Examine existing file structure and complexity
- Review memory files: Are they populated with real data or just templates?

**Project Classification:**
- **NEW PROJECT**: Empty directory, template placeholders in memory files like "[Project name here]"
- **EXISTING PROJECT**: Has real code, dependencies, actual implementation

**🚨 CRITICAL: Adapt your research strategy based on project type!**

**For EXISTING PROJECTS:**
- Include codebase exploration alongside memory analysis
- Search actual files for patterns and architecture
- Understand current implementation before suggesting changes
- Respect existing conventions and patterns
- Build upon what exists rather than replacing

**For NEW PROJECTS:**
- Rely primarily on memory templates and external research
- Focus on establishing new patterns and architecture
- Use memory files as foundation for guidance

## Research Process

1. **Comprehensive Memory Analysis** (MANDATORY - USE HYBRID SEARCH ACROSS ALL MEMORY!)
   
   **Phase 1A: Multi-Vector Memory Search**
   - \`memory_engineering/search --query "[feature type] patterns"\` - Find similar implementations
   - \`memory_engineering/search --query "[technology] examples"\` - Discover existing approaches  
   - \`memory_engineering/search --query "validation approach"\` - Find testing patterns
   - \`memory_engineering/search --query "error handling [domain]"\` - Learn error strategies
   - \`memory_engineering/search --query "architecture decisions"\` - Understand system design
   - \`memory_engineering/search --query "project context requirements"\` - Get business context
   
   **Phase 1A2: INNOVATIVE HYBRID SEARCH APPLICATIONS** 🚀
   MongoDB $rankFusion gives us REVOLUTIONARY capabilities - use creatively:
   
   **🧠 Semantic Code Pattern Discovery:**
   - \`memory_engineering/search --query "performance bottleneck optimization"\` - Find speed improvements
   - \`memory_engineering/search --query "user experience enhancement"\` - Discover UX patterns
   - \`memory_engineering/search --query "security vulnerability prevention"\` - Learn security patterns
   - \`memory_engineering/search --query "maintainability improvement"\` - Find refactoring opportunities
   
   **🔗 Intelligent Correlation Discovery:**
   - \`memory_engineering/search --query "similar complexity features"\` - Find comparable implementations
   - \`memory_engineering/search --query "related business logic"\` - Discover connected functionality
   - \`memory_engineering/search --query "impact analysis dependencies"\` - Understand change ripple effects
   - \`memory_engineering/search --query "testing strategy precedents"\` - Find testing approaches
   
   **🎯 Context-Aware Feature Intelligence:**
   - \`memory_engineering/search --query "user workflow step before"\` - Understand user journey context
   - \`memory_engineering/search --query "technical debt related"\` - Find improvement opportunities
   - \`memory_engineering/search --query "performance impact considerations"\` - Assess system load
   - \`memory_engineering/search --query "integration complexity similar"\` - Learn from similar integrations
   
   **🔄 Dynamic Development Intelligence:**
   - \`memory_engineering/search --query "error patterns encountered"\` - Learn from past mistakes
   - \`memory_engineering/search --query "scaling challenges faced"\` - Understand growth pain points
   - \`memory_engineering/search --query "user feedback incorporated"\` - Find user-driven improvements
   - \`memory_engineering/search --query "debugging techniques used"\` - Discover troubleshooting approaches
   
   **💡 Creative Problem-Solving Searches:**
   - \`memory_engineering/search --query "unconventional solution approach"\` - Find creative implementations
   - \`memory_engineering/search --query "cross-functional impact"\` - Understand broader implications
   - \`memory_engineering/search --query "trade-off decisions made"\` - Learn from architectural choices
   - \`memory_engineering/search --query "team knowledge sharing"\` - Find collaborative patterns
   
   **Phase 1B: Core Memory Files Analysis**
   - \`memory_engineering/read --fileName "systemPatterns.md"\` - Architecture and design patterns
   - \`memory_engineering/read --fileName "techContext.md"\` - Technology stack and constraints
   - \`memory_engineering/read --fileName "productContext.md"\` - Business requirements and user needs
   - \`memory_engineering/read --fileName "activeContext.md"\` - Current development focus
   - \`memory_engineering/read --fileName "progress.md"\` - Implementation history and lessons learned
   - \`memory_engineering/read --fileName "projectbrief.md"\` - Project goals and scope
   
   **Phase 1C: Memory Intelligence Synthesis**
   After gathering all memory data, synthesize into comprehensive context package that includes:
   - Relevant patterns from ALL memory files (not just systemPatterns)
   - Technology decisions and constraints from techContext
   - Business requirements and user needs from productContext
   - Current development status and blockers from activeContext
   - Historical lessons and implementation approaches from progress
   - Overall project vision and goals from projectbrief

   **Phase 1D: Codebase Exploration (FOR EXISTING PROJECTS ONLY)**
   If this is an EXISTING PROJECT, also perform:
   - Examine package.json/requirements.txt for dependencies and scripts
   - Review main entry points (index.js, main.py, etc.)
   - Analyze existing folder structure and naming conventions
   - Look for similar features already implemented
   - Understand current testing and build patterns
   - Identify key architectural decisions in actual code
   - Note any existing patterns that should be followed

2. **External Research**
   - Search for similar features/patterns online
   - Library documentation (include specific URLs)
   - Implementation examples (GitHub/StackOverflow/blogs)
   - Best practices and common pitfalls

3. **User Clarification** (if needed)
   - Specific patterns to mirror and where to find them?
   - Integration requirements and where to find them?

## PRP Generation

### Critical Context to Include and pass to the AI agent as part of the PRP
- **Documentation**: URLs with specific sections
- **Code Examples**: Real snippets from codebase
- **Gotchas**: Library quirks, version issues
- **Patterns**: Existing approaches to follow

### Implementation Blueprint
- Start with pseudocode showing approach
- Reference real files for patterns
- Include error handling strategy
- List tasks to be completed to fulfill the PRP in the order they should be completed

### Validation Gates (Must be Executable)
\`\`\`bash
# Example validation commands
npm run lint
npm run typecheck
npm run test
\`\`\`

*** CRITICAL AFTER YOU ARE DONE RESEARCHING AND EXPLORING THE CODEBASE BEFORE YOU START WRITING THE PRP ***

*** ULTRATHINK ABOUT THE PRP AND PLAN YOUR APPROACH THEN START WRITING THE PRP ***

## Quality Checklist
- [ ] All necessary context included
- [ ] Validation gates are executable by AI
- [ ] References existing patterns
- [ ] Clear implementation path
- [ ] Error handling documented

Score the PRP on a scale of 1-10 (confidence level to succeed in one-pass implementation).

Remember: The goal is one-pass implementation success through comprehensive context.`;

/**
 * Original /execute-prp system prompt (EXACT from context-engineering-intro)
 */
const EXECUTE_PRP_TEMPLATE = `# Execute PRP

Implement a feature using the PRP file.

## Execution Process

1. **Load PRP**
   - Read the specified PRP file
   - Understand all context and requirements
   - Follow all instructions in the PRP and extend the research if needed
   - Ensure you have all needed context to implement the PRP fully
   - Do more web searches and codebase exploration as needed

2. **ULTRATHINK**
   - Think hard before you execute the plan. Create a comprehensive plan addressing all requirements.
   - Break down complex tasks into smaller, manageable steps using your todos tools.
   - Use the TodoWrite tool to create and track your implementation plan.
   - Identify implementation patterns from existing code to follow.

3. **Execute the plan**
   - Execute the PRP
   - Implement all the code

4. **Validate**
   - Run each validation command
   - Fix any failures
   - Re-run until all pass

5. **Complete**
   - Ensure all checklist items done
   - Run final validation suite
   - Report completion status
   - Read the PRP again to ensure you have implemented everything

6. **Reference the PRP**
   - You can always reference the PRP again if needed

Note: If validation fails, use error patterns in PRP to fix and retry.`;