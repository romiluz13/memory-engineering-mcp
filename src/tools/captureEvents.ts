/**
 * Event-Driven Memory Capture
 * Automatically suggests memory creation based on AI actions
 */

// Import when needed for actual implementation
// import { getMemoryCollection } from '../db/connection.js';
// import { createWorkingMemory } from '../types/memory.js';

export interface CaptureEvent {
  type: 'error_resolved' | 'pattern_used' | 'decision_made' | 'feature_completed' | 'refactor_done';
  context: Record<string, any>;
  timestamp: Date;
}

/**
 * Detects if an event should trigger memory creation
 */
export function shouldCaptureMemory(event: CaptureEvent): {
  capture: boolean;
  memoryType: string;
  suggestion: string;
} {
  switch (event.type) {
    case 'error_resolved':
      // Capture if error took > 5 minutes to solve
      const debugDuration = event.context.duration || 0;
      if (debugDuration > 300000) { // 5 minutes
        return {
          capture: true,
          memoryType: 'working',
          suggestion: `You spent ${Math.round(debugDuration / 60000)} minutes debugging. Save this solution?`
        };
      }
      break;

    case 'pattern_used':
      // Capture if pattern used 3+ times
      if (event.context.usageCount >= 3) {
        return {
          capture: true,
          memoryType: 'systemPatterns',
          suggestion: `This pattern has been used ${event.context.usageCount} times. Document it?`
        };
      }
      break;

    case 'decision_made':
      // Capture architectural decisions
      if (event.context.impact === 'high') {
        return {
          capture: true,
          memoryType: 'activeContext',
          suggestion: 'This seems like an important decision. Add to activeContext?'
        };
      }
      break;

    case 'feature_completed':
      // Always capture completed features
      return {
        capture: true,
        memoryType: 'progress',
        suggestion: 'Feature completed! Document what you learned?'
      };

    case 'refactor_done':
      // Capture significant refactors
      if (event.context.filesChanged > 5) {
        return {
          capture: true,
          memoryType: 'progress',
          suggestion: `Major refactor (${event.context.filesChanged} files). Document the improvement?`
        };
      }
      break;
  }

  return { capture: false, memoryType: '', suggestion: '' };
}

/**
 * Generates memory content from event
 */
export function generateMemoryFromEvent(event: CaptureEvent): {
  content: string;
  format: 'markdown' | 'json';
} {
  switch (event.type) {
    case 'error_resolved':
      return {
        format: 'json',
        content: JSON.stringify({
          action: `Fixed: ${event.context.error}`,
          context: event.context.description,
          solution: event.context.solution,
          code: event.context.codeSnippet,
          prevention: event.context.prevention,
          tags: ['debug', event.context.category]
        }, null, 2)
      };

    case 'pattern_used':
      return {
        format: 'markdown',
        content: `### Pattern: ${event.context.patternName}

**When to use**: ${event.context.when}
**Implementation**:
\`\`\`${event.context.language || 'typescript'}
${event.context.code}
\`\`\`
**Benefits**: ${event.context.benefits}
**Used in**: ${event.context.usedIn.join(', ')}`
      };

    case 'decision_made':
      return {
        format: 'markdown',
        content: `### ${new Date().toLocaleDateString()} - ${event.context.decision}
- **Decision**: ${event.context.what}
- **Rationale**: ${event.context.why}
- **Alternatives considered**: ${event.context.alternatives.join(', ')}
- **Impact**: ${event.context.impact}`
      };

    case 'feature_completed':
      return {
        format: 'markdown',
        content: `### ${new Date().toLocaleDateString()} - ${event.context.featureName}
- **What**: ${event.context.description}
- **How**: ${event.context.implementation}
- **Challenges**: ${event.context.challenges}
- **Lessons**: ${event.context.lessons}
- **Time**: ${event.context.estimatedTime} vs ${event.context.actualTime}`
      };

    case 'refactor_done':
      return {
        format: 'markdown',
        content: `### ${new Date().toLocaleDateString()} - Refactored ${event.context.area}
- **Reason**: ${event.context.why}
- **Changes**: ${event.context.changes}
- **Benefits**: ${event.context.benefits}
- **Files Changed**: ${event.context.filesChanged}
- **Lines Modified**: +${event.context.linesAdded} -${event.context.linesRemoved}`
      };

    default:
      return {
        format: 'json',
        content: JSON.stringify(event.context, null, 2)
      };
  }
}

/**
 * Memory capture workflow integration
 */
export async function suggestMemoryCapture(
  _projectId: string,
  event: CaptureEvent
): Promise<string> {
  const { capture, memoryType, suggestion } = shouldCaptureMemory(event);
  
  if (!capture) {
    return '';
  }

  const { content, format } = generateMemoryFromEvent(event);
  
  // Build suggestion message
  let message = `\n💡 **Memory Capture Suggestion**\n\n${suggestion}\n\n`;
  
  if (format === 'markdown') {
    message += `Suggested content:\n\`\`\`markdown\n${content}\n\`\`\`\n\n`;
    message += `Save with:\n\`\`\`bash\nmemory_engineering_update --fileName "${memoryType}" --content "${content.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n\`\`\``;
  } else {
    message += `Suggested content:\n\`\`\`json\n${content}\n\`\`\`\n\n`;
    message += `Save with:\n\`\`\`bash\nmemory_engineering_update --memoryClass "working" --content '${content}'\n\`\`\``;
  }

  return message;
}

/**
 * Tracks patterns and suggests documentation
 */
export class PatternTracker {
  private patterns: Map<string, number> = new Map();
  
  trackPattern(pattern: string): void {
    const count = this.patterns.get(pattern) || 0;
    this.patterns.set(pattern, count + 1);
    
    // Check if pattern should be documented
    if (count + 1 === 3) {
      // Pattern used 3 times - suggest documentation
      console.log(`Pattern "${pattern}" used 3 times - consider documenting in systemPatterns`);
    }
  }
  
  getFrequentPatterns(): Array<{ pattern: string; count: number }> {
    return Array.from(this.patterns.entries())
      .filter(([_, count]) => count >= 3)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }
}

/**
 * Example event handlers for AI assistants
 */
export const eventHandlers = {
  onErrorResolved: (error: Error, solution: string, duration: number) => ({
    type: 'error_resolved' as const,
    context: {
      error: error.message,
      description: error.stack,
      solution,
      duration,
      category: 'runtime'
    },
    timestamp: new Date()
  }),

  onPatternUsed: (patternName: string, code: string, file: string) => ({
    type: 'pattern_used' as const,
    context: {
      patternName,
      code,
      usedIn: [file],
      when: 'When implementing similar functionality',
      benefits: 'Consistent implementation',
      usageCount: 1 // Would be tracked separately
    },
    timestamp: new Date()
  }),

  onDecisionMade: (decision: string, rationale: string, alternatives: string[]) => ({
    type: 'decision_made' as const,
    context: {
      decision,
      what: decision,
      why: rationale,
      alternatives,
      impact: 'high'
    },
    timestamp: new Date()
  }),

  onFeatureCompleted: (name: string, description: string, lessons: string) => ({
    type: 'feature_completed' as const,
    context: {
      featureName: name,
      description,
      implementation: 'See commit history',
      challenges: 'None significant',
      lessons,
      estimatedTime: 'Unknown',
      actualTime: 'Unknown'
    },
    timestamp: new Date()
  })
};