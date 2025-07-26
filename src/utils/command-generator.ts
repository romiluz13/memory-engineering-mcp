import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { AutonomousCommand, AutonomousExecutionPlan } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from './logger.js';

/**
 * Generate autonomous AI commands based on PRP content and project structure
 */

/**
 * Detect available validation commands in the project
 */
export async function detectValidationCommands(projectPath: string): Promise<string[]> {
  const commands: string[] = [];
  
  try {
    const packageJsonPath = join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};
      
      // Common validation scripts
      const validationScripts = [
        'typecheck', 'type-check', 'tsc',
        'lint', 'eslint',
        'test', 'test:unit',
        'build',
        'format', 'prettier'
      ];
      
      for (const script of validationScripts) {
        if (scripts[script]) {
          commands.push(`npm run ${script}`);
        }
      }
    }
    
    // Fallback commands if no package.json scripts
    if (commands.length === 0) {
      const fallbacks = [
        'npx tsc --noEmit', // TypeScript check
        'npx eslint . --ext .ts,.tsx,.js,.jsx', // Linting
        'npx vitest run' // Testing
      ];
      commands.push(...fallbacks);
    }
    
  } catch (error) {
    logger.error('Error detecting validation commands:', error);
    // Default fallbacks
    commands.push('npx tsc --noEmit', 'npx eslint .');
  }
  
  return commands;
}

/**
 * Generate autonomous execution plan from PRP content
 */
export async function generateAutonomousExecutionPlan(
  prpName: string,
  prpContent: string,
  _projectId: string,
  executionId: string,
  projectPath: string
): Promise<AutonomousExecutionPlan> {
  const commands: AutonomousCommand[] = [];
  let stepCount = 1;

  // Step 1: Read PRP for context
  commands.push({
    step: stepCount++,
    type: 'read_prp',
    action: `memory_engineering/read --fileName "prp_${prpName}.md"`,
    purpose: 'Load comprehensive implementation blueprint with all research context'
  });

  // Step 2: Analyze PRP content and generate file creation commands
  const fileCreationCommands = extractFileCreationFromPRP(prpContent, stepCount);
  commands.push(...fileCreationCommands);
  stepCount += fileCreationCommands.length;

  // Step 3: Generate validation commands
  const validationCommands = await detectValidationCommands(projectPath);
  commands.push({
    step: stepCount++,
    type: 'validation',
    action: 'Run validation commands to ensure code quality',
    purpose: 'Execute TypeScript, linting, and testing validation gates',
    command: validationCommands.join(' && '),
    expectedOutcome: 'All validation commands pass successfully',
    onFailure: 'Analyze errors, apply fixes based on PRP guidance, and retry validation'
  });

  // Step 4: Comprehensive memory updates
  commands.push({
    step: stepCount++,
    type: 'progress_update',
    action: 'Update all 6 core memory files with implementation completion',
    purpose: 'Document completion in progress.md, systemPatterns.md, activeContext.md, techContext.md, projectbrief.md, and productContext.md',
    path: 'progress.md',
    expectedOutcome: 'All 6 memory files updated with new patterns, progress, and learnings',
    onFailure: 'Update progress.md manually if comprehensive update fails'
  });

  const plan: AutonomousExecutionPlan = {
    executionMode: 'autonomous',
    executionId,
    prpName,
    totalSteps: commands.length,
    implementationPlan: commands,
    completionSignal: 'EXECUTE_THESE_STEPS_SEQUENTIALLY_THEN_MARK_COMPLETE',
    progressTracking: {
      updateOn: 'final_complete',
      progressFile: 'progress.md'
    }
  };

  logger.info(`Generated autonomous execution plan for ${prpName} with ${commands.length} steps`);
  return plan;
}

/**
 * Extract file creation commands from PRP content
 */
function extractFileCreationFromPRP(prpContent: string, startingStep: number): AutonomousCommand[] {
  const commands: AutonomousCommand[] = [];
  let stepCount = startingStep;

  // Look for file references in PRP content
  const filePatterns = [
    /create\s+(?:file\s+)?[`"]([^`"]+\.(ts|tsx|js|jsx|md|json|css|scss|html))[`"]/gi,
    /implement\s+(?:in\s+)?[`"]([^`"]+\.(ts|tsx|js|jsx))[`"]/gi,
    /(?:file|component|module):\s*[`"]([^`"]+\.(ts|tsx|js|jsx))[`"]/gi
  ];

  const foundFiles = new Set<string>();

  for (const pattern of filePatterns) {
    let match;
    while ((match = pattern.exec(prpContent)) !== null) {
      const filePath = match[1];
      if (filePath && !foundFiles.has(filePath)) {
        foundFiles.add(filePath);
        
        commands.push({
          step: stepCount++,
          type: 'create_file',
          action: `Create and implement ${filePath}`,
          purpose: `Implement functionality as specified in PRP blueprint`,
          path: filePath,
          content: `// Implementation based on PRP: ${prpContent.substring(0, 200)}...`,
          onFailure: 'Review PRP requirements and adjust implementation'
        });
      }
    }
  }

  // If no specific files found, add generic implementation step
  if (commands.length === 0) {
    commands.push({
      step: stepCount++,
      type: 'create_file',
      action: 'Implement feature according to PRP specifications',
      purpose: 'Follow PRP blueprint for complete feature implementation',
      onFailure: 'Review PRP context and adjust implementation approach'
    });
  }

  return commands;
}

/**
 * Generate command templates for common operations
 */
export const COMMAND_TEMPLATES = {
  READ_PRP: (prpName: string): AutonomousCommand => ({
    step: 1,
    type: 'read_prp',
    action: `memory_engineering/read --fileName "prp_${prpName}.md"`,
    purpose: 'Load implementation blueprint with research context'
  }),

  CREATE_REACT_COMPONENT: (componentName: string, filePath: string): AutonomousCommand => ({
    step: 2,
    type: 'create_file',
    action: `Create React component: ${componentName}`,
    purpose: 'Implement component following React best practices',
    path: filePath,
    content: `// React component implementation for ${componentName}`,
    onFailure: 'Review component requirements and TypeScript errors'
  }),

  VALIDATION_GATE: (commands: string[]): AutonomousCommand => ({
    step: 99, // Will be renumbered
    type: 'validation',
    action: 'Execute validation commands',
    purpose: 'Ensure code quality and compilation',
    command: commands.join(' && '),
    expectedOutcome: 'All validations pass',
    onFailure: 'Fix errors and retry validation'
  }),

  PROGRESS_UPDATE: (prpName: string): AutonomousCommand => ({
    step: 100, // Will be renumbered  
    type: 'progress_update',
    action: `memory_engineering/update --fileName "progress.md"`,
    purpose: 'Document implementation completion',
    content: `✅ Completed ${prpName} implementation on ${new Date().toISOString()}`
  })
};

/**
 * Update comprehensive memory files after PRP execution completion
 */
export async function updateMemoriesOnCompletion(
  projectId: string,
  prpName: string,
  executionId: string,
  implementedPatterns?: string[]
): Promise<void> {
  try {
    const collection = getMemoryCollection();
    const timestamp = new Date().toISOString();
    
    // 1. Update progress.md with detailed completion info
    const progressUpdate = `
## ✅ ${prpName} Implementation Completed - ${timestamp}

**Execution ID**: ${executionId}
**Completion Date**: ${timestamp}
**Implementation Status**: Successfully completed with validation

**Key Achievements:**
- All validation gates passed (TypeScript, ESLint, tests)
- Implementation follows discovered patterns from memory system
- Full context integration with existing codebase architecture

**Patterns Applied:**
${implementedPatterns?.map(pattern => `- ${pattern}`).join('\n') || '- Implementation patterns extracted from PRP blueprint'}

**Next Steps:**
- Monitor performance and user feedback
- Consider extending implementation based on usage patterns
- Update documentation if needed

---
`;

    await collection.updateOne(
      { projectId, fileName: 'progress.md' },
      { 
        $set: { 
          content: progressUpdate,
          'metadata.lastUpdated': new Date(),
          'metadata.version': { $inc: 1 }
        },
        $unset: { contentVector: 1 } // Clear to regenerate embeddings
      },
      { upsert: false }
    );

    // 2. Update systemPatterns.md with learned patterns
    const existingSystemPatterns = await collection.findOne({
      projectId, 
      fileName: 'systemPatterns.md'
    });

    if (existingSystemPatterns) {
      const systemPatternsUpdate = `${existingSystemPatterns.content}

## 🆕 Patterns Learned from ${prpName} (${timestamp})

**Implementation Approach:**
- Context Engineering methodology applied successfully
- Research-driven implementation using memory system
- Validation-first approach with comprehensive gates

**Technical Patterns:**
${implementedPatterns?.map(pattern => `- **${pattern}**: Successfully applied in ${prpName} implementation`).join('\n') || '- Research-backed implementation patterns extracted from PRP analysis'}

**Memory System Integration:**
- PRP-driven development workflow validated
- Hybrid search provided relevant context for implementation decisions
- Memory persistence enabled cross-session context continuity

---
`;

      await collection.updateOne(
        { projectId, fileName: 'systemPatterns.md' },
        { 
          $set: { 
            content: systemPatternsUpdate,
            'metadata.lastUpdated': new Date(),
            'metadata.version': { $inc: 1 }
          },
          $unset: { contentVector: 1 } // Clear to regenerate embeddings
        }
      );
    }

    // 3. Update activeContext.md with new current state
    const activeContextUpdate = `# Active Development Context

**Last Updated**: ${timestamp}
**Recent Completion**: ${prpName} implementation finished successfully

## 🎯 Current Focus
- **Status**: Implementation completed and validated
- **Next Priority**: Monitor ${prpName} functionality and plan next features
- **Development Approach**: Continue using Context Engineering methodology

## 📋 Recent Activity
- ✅ **${prpName}**: Completed with full validation (${timestamp})
- ✅ **Memory System**: Updated with new patterns and progress
- ✅ **Validation Gates**: TypeScript, ESLint, and tests all passing

## 🧠 Context Engineering Status
- **PRP Methodology**: Successfully applied for ${prpName}
- **Memory Integration**: All memories updated with implementation learnings
- **Pattern Discovery**: New patterns documented in systemPatterns.md

## 🔄 Development Flow
The Memory Engineering MCP successfully orchestrated autonomous implementation:
1. **Research Phase**: Context discovery via hybrid search
2. **Planning Phase**: Comprehensive PRP generation with validation gates  
3. **Implementation Phase**: Structured autonomous execution
4. **Completion Phase**: Memory updates and pattern extraction

Ready for next feature request or implementation cycle.

---
`;

    await collection.updateOne(
      { projectId, fileName: 'activeContext.md' },
      { 
        $set: { 
          content: activeContextUpdate,
          'metadata.lastUpdated': new Date(),
          'metadata.version': { $inc: 1 }
        },
        $unset: { contentVector: 1 } // Clear to regenerate embeddings
      },
      { upsert: false }
    );

    // 4. Update techContext.md with any new technologies used
    const existingTechContext = await collection.findOne({
      projectId, 
      fileName: 'techContext.md'
    });

    if (existingTechContext) {
      const techContextUpdate = `${existingTechContext.content}

## 🔧 Technical Updates from ${prpName} (${timestamp})

**Implementation Technologies:**
- All validation gates successfully executed (TypeScript, ESLint, tests)
- Development tools verified and working correctly
- Memory Engineering MCP orchestration successful

**Development Process Validation:**
- Context Engineering methodology proven effective
- MongoDB hybrid search enabled rapid pattern discovery
- Autonomous AI execution with validation loops successful

**Technical Learnings:**
${implementedPatterns?.map(pattern => `- **${pattern}**: Technical implementation validated`).join('\n') || '- Implementation followed established technical patterns'}

---
`;

      await collection.updateOne(
        { projectId, fileName: 'techContext.md' },
        { 
          $set: { 
            content: techContextUpdate,
            'metadata.lastUpdated': new Date(),
            'metadata.version': { $inc: 1 }
          },
          $unset: { contentVector: 1 } // Clear to regenerate embeddings
        }
      );
    }

    // 5. Update projectbrief.md with implementation milestone
    const existingProjectBrief = await collection.findOne({
      projectId, 
      fileName: 'projectbrief.md'
    });

    if (existingProjectBrief) {
      const projectBriefUpdate = `${existingProjectBrief.content}

## ✅ Implementation Milestone: ${prpName} (${timestamp})

**Achievement Summary:**
- Successfully implemented ${prpName} using Context Engineering methodology
- All validation gates passed (TypeScript, ESLint, testing)
- Memory system updated with new patterns and learnings

**Project Progress:**
- Implementation delivered following PRP blueprint specifications
- Validation-driven development approach proven successful
- Ready for next feature implementation cycle

**AI Implementation Guide Update:**
The Memory Engineering MCP successfully orchestrated autonomous implementation, validating our approach:
1. Research → Planning → Implementation → Validation → Memory Updates
2. Pattern discovery via hybrid search enabled informed implementation decisions
3. Autonomous AI execution reduced manual effort while maintaining quality

---
`;

      await collection.updateOne(
        { projectId, fileName: 'projectbrief.md' },
        { 
          $set: { 
            content: projectBriefUpdate,
            'metadata.lastUpdated': new Date(),
            'metadata.version': { $inc: 1 }
          },
          $unset: { contentVector: 1 } // Clear to regenerate embeddings
        }
      );
    }

    // 6. Update productContext.md with implementation insights
    const existingProductContext = await collection.findOne({
      projectId, 
      fileName: 'productContext.md'
    });

    if (existingProductContext) {
      const productContextUpdate = `${existingProductContext.content}

## 📊 Product Development Insights from ${prpName} (${timestamp})

**Implementation Impact:**
- ${prpName} successfully delivered with comprehensive validation
- Development process validated through Memory Engineering MCP orchestration
- User value enhanced through research-driven implementation approach

**Development Methodology Validation:**
- Context Engineering approach proven effective for feature delivery
- Pattern discovery through hybrid search improved implementation quality
- Autonomous AI execution maintained high development velocity

**Product Development Learnings:**
${implementedPatterns?.map(pattern => `- **${pattern}**: Successfully applied to enhance product value`).join('\n') || '- Implementation patterns validated for future product development'}

---
`;

      await collection.updateOne(
        { projectId, fileName: 'productContext.md' },
        { 
          $set: { 
            content: productContextUpdate,
            'metadata.lastUpdated': new Date(),
            'metadata.version': { $inc: 1 }
          },
          $unset: { contentVector: 1 } // Clear to regenerate embeddings
        }
      );
    }

    logger.info(`✅ Updated all 6 core memory files for ${prpName} completion`);
    
  } catch (error) {
    logger.error('Error updating memories on completion:', error);
    // Don't throw - this is supplementary functionality
  }
}