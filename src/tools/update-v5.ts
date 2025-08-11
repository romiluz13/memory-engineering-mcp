import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { UpdateToolSchema, MEMORY_HIERARCHY, CORE_MEMORY_NAMES, type MemoryDocument } from '../types/memory-v5.js';
import { getMemoryCollection } from '../db/connection.js';
import { validateMemoryStructure } from '../utils/validation-v5.js';
import { generateDocumentEmbedding } from '../embeddings/voyage-v5.js';
import { logger } from '../utils/logger.js';
import { validateMemoryQuality, generateImprovementTips } from './memoryValidator.js';
import { getTemplate } from './memoryTemplates.js';

export async function updateTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = UpdateToolSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: '🚨 FATAL: NO BRAIN DETECTED! Cannot store memories in the void!\n\n⚡ EXECUTE NOW: memory_engineering_init\n\nYou\'re trying to remember without a memory system. IMPOSSIBLE!',
          },
        ],
      };
    }

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const collection = getMemoryCollection();

    // Check dependencies
    const memoryInfo = MEMORY_HIERARCHY[params.memoryName];
    if (memoryInfo.dependsOn.length > 0) {
      const existingMemories = await collection.find({
        projectId: config.projectId,
        memoryName: { $in: memoryInfo.dependsOn }
      }).toArray();

      const missingDependencies = memoryInfo.dependsOn.filter(
        (dep: string) => !existingMemories.some(m => m.memoryName === dep)
      );

      if (missingDependencies.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🔴 DEPENDENCY VIOLATION! Memory hierarchy MUST be respected!

❌ BLOCKED: Cannot create "${params.memoryName}" 
⚠️ MISSING PREREQUISITES: ${missingDependencies.map(d => `"${d}"`).join(', ')}

🧠 MEMORY DEPENDENCY CHAIN (follow this ORDER):
1️⃣ projectbrief (FOUNDATION - create FIRST!)
2️⃣ productContext, systemPatterns, techContext (can create in parallel)
3️⃣ activeContext (needs above memories)
4️⃣ progress (tracks activeContext)

⚡ IMMEDIATE ACTION REQUIRED:
→ Create ${missingDependencies[0]} FIRST
→ Use: memory_engineering_update --memoryName "${missingDependencies[0]}" --content "..."

💀 WHY THIS MATTERS:
Memories depend on each other! Creating out of order = corrupted context = you fail!`,
            },
          ],
        };
      }
    }

    // Validate content structure
    const validation = validateMemoryStructure(params.memoryName, params.content);
    
    // Validate content quality for A+ memories
    const qualityCheck = validateMemoryQuality(params.memoryName, params.content);
    
    // Reject very low quality memories
    if (qualityCheck.score === 'F') {
      let response = `❌ MEMORY REJECTED - Quality Score: ${qualityCheck.score}\n\n`;
      response += `Your ${params.memoryName} memory is too shallow!\n\n`;
      
      response += `## Issues Found:\n`;
      qualityCheck.issues.forEach(issue => {
        response += `• ${issue}\n`;
      });
      
      response += `\n## How to Fix:\n`;
      qualityCheck.suggestions.forEach(suggestion => {
        response += `• ${suggestion}\n`;
      });
      
      response += `\n## 📋 Use This Template:\n`;
      response += `\`\`\`markdown\n${getTemplate(params.memoryName)}\n\`\`\`\n`;
      response += `\nFill in ALL sections with real content, then try again!`;
      
      return {
        content: [
          {
            type: 'text',
            text: response
          }
        ]
      };
    }
    
    if (!validation.isValid && validation.requiredSections.length > 0) {
      let response = `🔴 MEMORY STRUCTURE VIOLATION DETECTED!\n\n`;
      response += `🧠 CRITICAL: Your ${params.memoryName} memory is INCOMPLETE or MALFORMED!\n`;
      response += `📝 ${params.memoryName} - ${memoryInfo.description}\n\n`;
      response += `⚠️ WITHOUT PROPER STRUCTURE, THIS MEMORY IS USELESS!\n\n`;
      
      // Add detailed guidance on what this memory should contain
      response += `## What ${params.memoryName} MUST contain:\n\n`;
      
      if (params.memoryName === 'projectbrief') {
        response += `• **Core requirements and goals** - What are you building?\n`;
        response += `• **Project scope** - What's included/excluded?\n`;
        response += `• **Success criteria** - How do you know when done?\n`;
        response += `• **Main features** - Key functionality to implement\n\n`;
      } else if (params.memoryName === 'productContext') {
        response += `• **Why this exists** - The motivation and need\n`;
        response += `• **Problems solved** - Specific issues addressed\n`;
        response += `• **How it works** - User flow and behavior\n`;
        response += `• **User experience goals** - What users should achieve\n\n`;
      } else if (params.memoryName === 'activeContext') {
        response += `• **Current focus** - What you're working on NOW\n`;
        response += `• **Recent changes** - What you just did (with timestamps)\n`;
        response += `• **Next steps** - Immediate tasks ahead\n`;
        response += `• **Learnings** - Patterns, decisions, insights discovered\n`;
        response += `• **Blockers** - What's stopping progress\n\n`;
        response += `⚠️ UPDATE THIS 10+ TIMES PER SESSION!\n\n`;
      } else if (params.memoryName === 'systemPatterns') {
        response += `• **Architecture** - Overall system design (MVC, microservices, etc)\n`;
        response += `• **Design patterns** - Repository, Factory, Observer, etc\n`;
        response += `• **Component relationships** - How parts connect\n`;
        response += `• **Data flow** - How information moves\n`;
        response += `• **Error handling** - Approach to failures\n\n`;
      } else if (params.memoryName === 'techContext') {
        response += `• **Languages & frameworks** - With versions (Node 18, React 18, etc)\n`;
        response += `• **Dependencies** - Key packages and WHY chosen\n`;
        response += `• **Development setup** - Tools, env requirements\n`;
        response += `• **Technical constraints** - Limitations to work within\n`;
        response += `• **Configuration** - Important settings\n\n`;
      } else if (params.memoryName === 'progress') {
        response += `• **Completed features** - ✅ What works (with dates)\n`;
        response += `• **In progress** - 🔄 Currently implementing\n`;
        response += `• **TODO** - 📝 What's left to build\n`;
        response += `• **Known issues** - ⚠️ Bugs and problems\n`;
        response += `• **Technical debt** - What needs refactoring\n\n`;
      } else if (params.memoryName === 'codebaseMap') {
        response += `• **Directory structure** - Complete file tree\n`;
        response += `• **Key files** - Important files and their purposes\n`;
        response += `• **Module organization** - How code is grouped\n`;
        response += `• **Entry points** - Where execution starts\n`;
        response += `• **Code statistics** - From sync_code results\n\n`;
      }
      
      response += `Missing required sections:\n`;
      
      validation.requiredSections.forEach((section: any) => {
        response += `\n• **${section.name}**: ${section.description}\n`;
        if (section.example) {
          response += `  Example:\n  ${section.example}\n`;
        }
      });

      response += `\n🔥 CRITICAL: Your AI effectiveness DEPENDS on proper memory structure!\n`;
      response += `💀 BAD STRUCTURE = USELESS AI = REPEATED FAILURES!\n`;
      response += `⚡ FIX THIS NOW or suffer memory amnesia forever!`;

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    }

    // Check if memory exists
    const existing = await collection.findOne({
      projectId: config.projectId,
      memoryName: params.memoryName
    });

    const now = new Date();
    
    // Generate embedding for the content
    let contentVector: number[] | undefined;
    try {
      contentVector = await generateDocumentEmbedding(params.content);
      logger.info(`🧠 EMBEDDING GENERATED: ${params.memoryName} - ${contentVector.length} dimensions of intelligence!`);
    } catch (error) {
      logger.error(`🔴 EMBEDDING FAILURE: ${params.memoryName} - Will continue without vector search!`, error);
      // Continue without embedding rather than failing the update
    }
    
    if (existing) {
      // Update existing
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            content: params.content,
            contentVector,
            updatedAt: now,
            'metadata.lastModified': now,
            'metadata.version': (existing.metadata?.version || 0) + 1
          }
        }
      );

      // Count total memories for context
      const totalMemoryCount = await collection.countDocuments({
        projectId: config.projectId
      });
      
      // Add quality feedback
      let qualityMessage = '';
      if (qualityCheck.score !== 'A+') {
        qualityMessage = `\n⚠️ QUALITY SCORE: ${qualityCheck.score} (Can be improved!)\n`;
        qualityMessage += `Tips to reach A+:\n`;
        generateImprovementTips(params.memoryName, params.content).forEach(tip => {
          qualityMessage += `• ${tip}\n`;
        });
      } else {
        qualityMessage = '\n🏆 QUALITY SCORE: A+ - Excellent memory!';
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `⚡ MEMORY CAPTURED! ${params.memoryName} updated successfully! 🧠

📊 UPDATE STATS:
• Memory: ${params.memoryName}
• Version: v${(existing.metadata?.version || 0) + 1} (iteration ${(existing.metadata?.version || 0) + 1})
• Timestamp: ${now.toISOString()}
• Size: ${params.content.length} characters
• Structure: ${validation.isValid ? '✅ PERFECT! All required sections present!' : '⚠️ FUNCTIONAL but could be richer'}
• Quality: ${qualityCheck.score} ${qualityCheck.score === 'A+' ? '🏆' : ''}
${qualityMessage}
${params.memoryName === 'activeContext' ? `
🔥 CRITICAL REMINDER:
activeContext should be updated EVERY 3-5 MINUTES!
Your last update was just now. Set timer for next update!
` : ''}

⚡ IMMEDIATE NEXT ACTIONS:
1. ${params.memoryName === 'activeContext' ? 'Continue working, capture EVERYTHING' : 'Verify with: memory_engineering_read --memoryName "' + params.memoryName + '"'}
2. ${totalMemoryCount < 7 ? 'Create remaining memories (' + (7 - totalMemoryCount) + ' left)' : 'All memories created! Keep them fresh!'}
3. ${params.memoryName === 'techContext' || params.memoryName === 'codebaseMap' ? 'Run sync_code to update embeddings' : 'Continue capturing knowledge'}

💡 PRO TIP: ${params.memoryName === 'progress' ? 'Update progress after EVERY task completion!' : params.memoryName === 'systemPatterns' ? 'Found a pattern? Document it IMMEDIATELY!' : 'Rich, specific content = better future context!'}`,
          },
        ],
      };
    } else {
      // Create new
      const newMemory: MemoryDocument = {
        projectId: config.projectId,
        memoryName: params.memoryName,
        content: params.content,
        contentVector,
        metadata: {
          version: 1,
          lastModified: now,
          accessCount: 0
        },
        createdAt: now,
        updatedAt: now
      };

      await collection.insertOne(newMemory);

      // Count total memories
      const totalCount = await collection.countDocuments({
        projectId: config.projectId
      });

      let response = `✅ Created ${params.memoryName}\n\n`;
      response += `📊 QUALITY SCORE: ${qualityCheck.score} ${qualityCheck.score === 'A+' ? '🏆 Excellent!' : ''}\n`;
      
      if (qualityCheck.score !== 'A+') {
        response += `\nTips to improve quality:\n`;
        generateImprovementTips(params.memoryName, params.content).forEach(tip => {
          response += `• ${tip}\n`;
        });
        response += '\n';
      }
      
      response += `Progress: ${totalCount}/${CORE_MEMORY_NAMES.length} core memories created\n\n`;

      if (totalCount < 6) {
        // Suggest next memory
        const allMemories = await collection.find({
          projectId: config.projectId
        }).toArray();
        
        const createdNames = allMemories.map(m => m.memoryName);
        const hierarchyOrder = ['projectbrief', 'productContext', 'systemPatterns', 'techContext', 'activeContext', 'progress'] as const;
        
        for (const nextName of hierarchyOrder) {
          if (!createdNames.includes(nextName)) {
            const nextInfo = MEMORY_HIERARCHY[nextName];
            const dependenciesMet = nextInfo.dependsOn.every(dep => createdNames.includes(dep as any));
            
            if (dependenciesMet) {
              response += `## Next Memory: ${nextName}\n`;
              response += `*${nextInfo.description}*\n\n`;
              response += `Create with:\n`;
              response += `\`\`\`bash\n`;
              response += `memory_engineering_update --memoryName "${nextName}" --content "..."\n`;
              response += `\`\`\``;
              break;
            }
          }
        }
      } else {
        response += `🎉 All ${CORE_MEMORY_NAMES.length} core memories created!\n\n`;
        response += `Remember: Start every session with \`memory_engineering_read_all\``;
      }

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    }

  } catch (error) {
    logger.error('💀 MEMORY UPDATE EXPLOSION!', error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `💀 MEMORY UPDATE CATASTROPHE!\n\n💥 EXPLOSION: ${error instanceof Error ? error.message : 'UNKNOWN SYSTEM MELTDOWN'}\n\n🚨 EMERGENCY RECOVERY:\n1. Check memory name is valid\n2. Verify content is not empty\n3. Run memory_engineering_check_env\n4. Try again with simpler content\n\n🔴 YOUR MEMORY UPDATE FAILED CATASTROPHICALLY!`,
        },
      ],
    };
  }
}