import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ExecutePRPSchema, type ProjectConfig } from '../types/memory.js';
import type { z } from 'zod';
import { getMemoryCollection } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { isRepeatedCall, createExecutionState } from '../utils/execution-state.js';
import { generateAutonomousExecutionPlan } from '../utils/command-generator.js';

type ExecutePRPParams = z.infer<typeof ExecutePRPSchema>;

/**
 * Context Engineering Phase 2: Generate Autonomous AI Execution Plan
 * Returns structured commands that autonomous AI assistants can execute directly
 */
export async function executePRPTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = ExecutePRPSchema.parse(args) as ExecutePRPParams;
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [{
          type: 'text',
          text: 'Memory Engineering not initialized. Run memory_engineering/init first.',
        }],
      };
    }

    const config: ProjectConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

    // Find the most recent PRP to execute
    let prpName = params.prp;
    
    if (!prpName) {
      // Auto-detect the most recent PRP
      prpName = (await findLatestPRP(config.projectId, projectPath)) || undefined;
      if (!prpName) {
        return {
          content: [{
            type: 'text',
            text: `No PRP found to execute. Either:
1. Generate a PRP first: memory_engineering/generate-prp --request "your request"  
2. Specify PRP: memory_engineering/execute-prp --prp "prp-name"

Available PRPs can be found via: memory_engineering/search --query "prp_"`,
          }],
        };
      }
    }

    // Check for repeated calls to prevent loops
    if (!params.forceRefresh) {
      const callCheck = await isRepeatedCall(prpName, config.projectId);
      if (callCheck.isRepeated) {
        return {
          content: [{
            type: 'text',
            text: `⚠️ **EXECUTION PLAN ALREADY PROVIDED** for "${prpName}" (called ${callCheck.callCount} times)

**This prevents infinite loops!** The implementation plan was provided in the previous response.

**What you should do now:**
1. **If you haven't started**: Follow the execution plan from the previous response
2. **If you've started**: Continue with the remaining steps  
3. **If you've completed**: Update progress with: \`memory_engineering/update --fileName "progress.md" --content "✅ Completed ${prpName}"\`
4. **If you need fresh instructions**: Use \`--forceRefresh true\`

**Last provided**: ${callCheck.lastCalled?.toISOString() || 'Unknown'}`,
          }],
        };
      }
    }

    // User approval gate for autonomous execution
    if (!params.skipApproval) {
      return {
        content: [{
          type: 'text',
          text: `🚨 **EXECUTION APPROVAL REQUIRED**

Ready to execute PRP "${prpName}" with autonomous AI implementation.

**📋 WHAT HAPPENS NEXT:**
The system will generate a structured, step-by-step execution plan that guides AI assistants through:
- Loading the comprehensive implementation blueprint
- Following researched patterns and architectural decisions  
- Running validation gates (TypeScript, tests, linting)
- Updating memory files with new patterns learned

**🎯 YOUR OPTIONS:**
1. **✅ PROCEED**: Call again with \`--skipApproval true\` to execute
2. **📖 REVIEW FIRST**: \`memory_engineering/read --fileName "prp_${prpName}.md"\`
3. **🔧 POWER USER**: Use \`--skipApproval true\` in future calls to bypass this prompt

**🛡️ SAFETY FEATURES:**
- Loop prevention: Execution state tracking prevents infinite calls
- Validation gates: All implementations must pass TypeScript + tests
- Memory persistence: All changes tracked in project memory system

This one-time approval ensures you maintain control while preserving the system's autonomous capabilities.`,
        }],
      };
    }

    // Get PRP content for command generation
    const collection = getMemoryCollection();
    const prpDoc = await collection.findOne({
      projectId: config.projectId,
      fileName: `prp_${prpName}.md`
    });

    if (!prpDoc) {
      return {
        content: [{
          type: 'text',
          text: `PRP "${prpName}" not found in memory system. Generate it first with memory_engineering/generate-prp.`,
        }],
      };
    }

    // Create execution state for tracking
    const executionId = await createExecutionState(config.projectId, prpName, 5); // Estimated steps

    // Generate autonomous execution plan
    const executionPlan = await generateAutonomousExecutionPlan(
      prpName,
      prpDoc.content,
      config.projectId,
      executionId,
      projectPath
    );

    logger.info(`🚀 Generated autonomous execution plan for ${prpName}: ${executionId}`);

    return {
      content: [{
        type: 'text',
        text: `🤖 **AUTONOMOUS AI EXECUTION PLAN GENERATED**

**PRP**: ${prpName}
**Project**: ${config.projectId}  
**Execution ID**: ${executionId}
**Mode**: ${executionPlan.executionMode}
**Total Steps**: ${executionPlan.totalSteps}

---

## 🎯 STRUCTURED EXECUTION COMMANDS

${executionPlan.implementationPlan.map(cmd => `
**STEP ${cmd.step}**: ${cmd.purpose}
- **Type**: ${cmd.type}
- **Action**: ${cmd.action}
${cmd.path ? `- **Path**: ${cmd.path}` : ''}
${cmd.command ? `- **Command**: \`${cmd.command}\`` : ''}
${cmd.expectedOutcome ? `- **Expected**: ${cmd.expectedOutcome}` : ''}
${cmd.onFailure ? `- **On Failure**: ${cmd.onFailure}` : ''}
`).join('\n')}

---

## 🚨 AUTONOMOUS AI INSTRUCTIONS

**${executionPlan.completionSignal}**

1. **Execute each step sequentially** - do not skip or reorder
2. **Follow the structured commands** - these are researched and validated
3. **Handle failures** using the provided guidance for each step
4. **Track progress** by updating memory files as specified
5. **DO NOT call this tool again** - you have everything needed

**Completion Criteria**: When all ${executionPlan.totalSteps} steps pass validation, the implementation is complete.

**Memory Updates**: The final step includes comprehensive updates to ALL 6 core memory files:
- **progress.md**: Detailed completion status and achievements  
- **systemPatterns.md**: New patterns learned during implementation
- **activeContext.md**: Updated current state and next priorities
- **techContext.md**: Technical learnings and development process validation
- **projectbrief.md**: Implementation milestone and AI workflow validation
- **productContext.md**: Product development insights and methodology validation

**Progress Tracking**: ${executionPlan.progressTracking.updateOn} → ${executionPlan.progressTracking.progressFile}

🚀 **BEGIN AUTONOMOUS EXECUTION NOW**`,
      }],
    };

  } catch (error) {
    logger.error('PRP execution error:', error);
    
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Error generating execution plan: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      }],
    };
  }
}

// Helper function to find the latest PRP
async function findLatestPRP(projectId: string, projectPath: string): Promise<string | null> {
  try {
    // First check MongoDB for latest PRP
    const collection = getMemoryCollection();
    const latestPRP = await collection.findOne(
      { 
        projectId, 
        fileName: { $regex: /^prp_.*\.md$/ }
      },
      { sort: { 'metadata.lastUpdated': -1 } }
    );

    if (latestPRP) {
      return latestPRP.fileName.replace('prp_', '').replace('.md', '');
    }

    // Fallback: check PRPs directory
    const prpsDir = join(projectPath, 'PRPs');
    if (existsSync(prpsDir)) {
      const fs = await import('fs');
      const files = fs.readdirSync(prpsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));
      
      return files.length > 0 ? files[files.length - 1] || null : null;
    }

    return null;
  } catch (error) {
    logger.error('Error finding latest PRP:', error);
    return null;
  }
}