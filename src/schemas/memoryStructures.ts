/**
 * Memory Structure Schemas
 * Enforces consistent structure without pre-stored templates
 */

export interface MemorySection {
  required: boolean;
  minLength?: number;
  description: string;
  example?: string;
}

export interface MemoryStructure {
  sections: Record<string, MemorySection>;
  minSections: number;
  guidance: string;
}

export const MEMORY_STRUCTURES: Record<string, MemoryStructure> = {
  projectbrief: {
    minSections: 4,
    guidance: 'Project Brief must clearly explain what you\'re building, why, and how success is measured.',
    sections: {
      'overview': {
        required: true,
        minLength: 100,
        description: 'Clear explanation of what the project does',
        example: '## Overview\nThis project provides...'
      },
      'goals': {
        required: true,
        description: 'Primary objectives, metrics, and timeline',
        example: '## Goals\n- **Primary**: Achieve X\n- **Metrics**: Measure by Y\n- **Timeline**: Complete by Z'
      },
      'scope': {
        required: true,
        description: 'What\'s included and excluded',
        example: '## Scope\n### In Scope\n- Feature A\n### Out of Scope\n- Feature B'
      },
      'success criteria': {
        required: true,
        description: 'How to measure success',
        example: '## Success Criteria\n- **Technical**: Performance targets\n- **User**: Experience goals'
      },
      'problem statement': {
        required: false,
        description: 'The problem being solved'
      },
      'solution approach': {
        required: false,
        description: 'How the problem is solved'
      }
    }
  },

  productContext: {
    minSections: 3,
    guidance: 'Product Context explains WHY this project exists and WHO it helps.',
    sections: {
      'why this exists': {
        required: true,
        minLength: 100,
        description: 'The motivation and need for this project'
      },
      'target users': {
        required: true,
        description: 'Who will use this and why'
      },
      'user problems': {
        required: true,
        description: 'Specific problems users face'
      },
      'how it helps': {
        required: true,
        description: 'How this solves user problems'
      },
      'success metrics': {
        required: false,
        description: 'How to measure product success'
      }
    }
  },

  systemPatterns: {
    minSections: 3,
    guidance: 'System Patterns document HOW to build consistently. Include real examples from your codebase.',
    sections: {
      'architecture overview': {
        required: true,
        description: 'High-level system design',
        example: '## Architecture Overview\nMVC pattern with...'
      },
      'design patterns': {
        required: true,
        description: 'Patterns used with examples',
        example: '### Pattern: Repository\n**When**: Data access\n**Implementation**: `class UserRepo`\n**Benefits**: Abstraction'
      },
      'code standards': {
        required: true,
        description: 'Coding conventions and style'
      },
      'common patterns': {
        required: false,
        description: 'Frequently used code patterns'
      },
      'error handling': {
        required: false,
        description: 'How errors are handled'
      }
    }
  },

  activeContext: {
    minSections: 2,
    guidance: 'Active Context tracks WHAT you\'re working on right now.',
    sections: {
      'current focus': {
        required: true,
        description: 'What you\'re actively working on',
        example: '## Current Focus\nImplementing user authentication...'
      },
      'active tasks': {
        required: true,
        description: 'Current task list',
        example: '## Active Tasks\n- [ ] Set up JWT\n- [ ] Create login endpoint'
      },
      'recent changes': {
        required: false,
        description: 'What was recently completed'
      },
      'blockers': {
        required: false,
        description: 'Current obstacles'
      },
      'key decisions': {
        required: false,
        description: 'Important choices made'
      }
    }
  },

  techContext: {
    minSections: 3,
    guidance: 'Tech Context documents the technology stack and how to work with it.',
    sections: {
      'technology stack': {
        required: true,
        description: 'Languages, frameworks, and tools used'
      },
      'key dependencies': {
        required: true,
        description: 'Important libraries and versions'
      },
      'development setup': {
        required: true,
        description: 'How to get started developing'
      },
      'configuration': {
        required: false,
        description: 'Important configuration details'
      },
      'external services': {
        required: false,
        description: 'APIs and services used'
      }
    }
  },

  progress: {
    minSections: 1,
    guidance: 'Progress tracks what\'s been completed and lessons learned.',
    sections: {
      'completed features': {
        required: true,
        description: 'What has been built',
        example: '### [Date] - Feature Name\n**What**: Description\n**Lessons**: What we learned'
      },
      'milestones': {
        required: false,
        description: 'Major achievements'
      },
      'lessons learned': {
        required: false,
        description: 'Technical and process insights'
      },
      'performance improvements': {
        required: false,
        description: 'Optimizations made'
      }
    }
  },

  codebaseMap: {
    minSections: 2,
    guidance: 'Codebase Map shows WHERE everything is located.',
    sections: {
      'directory structure': {
        required: true,
        description: 'Project file organization',
        example: '```\nproject/\n├── src/\n├── tests/\n└── docs/\n```'
      },
      'key files': {
        required: true,
        description: 'Important files and their purposes'
      },
      'module organization': {
        required: false,
        description: 'How code is organized'
      },
      'data flow': {
        required: false,
        description: 'How data moves through the system'
      }
    }
  }
};

/**
 * Validates if content meets structure requirements
 */
export function validateMemoryStructure(
  memoryName: string, 
  content: string
): { 
  valid: boolean; 
  missing: string[]; 
  suggestions: string[] 
} {
  const structure = MEMORY_STRUCTURES[memoryName];
  if (!structure) {
    return { valid: true, missing: [], suggestions: [] };
  }

  const contentLower = content.toLowerCase();
  const missing: string[] = [];
  const suggestions: string[] = [];

  // Check required sections
  for (const [section, config] of Object.entries(structure.sections)) {
    if (config.required) {
      // Look for section headers
      const sectionExists = 
        contentLower.includes(`# ${section}`) ||
        contentLower.includes(`## ${section}`) ||
        contentLower.includes(`### ${section}`);

      if (!sectionExists) {
        missing.push(section);
        if (config && config.example) {
          suggestions.push(config.example);
        }
      }

      // Check minimum length
      if (config && config.minLength && sectionExists) {
        const sectionStart = contentLower.indexOf(section);
        const nextSection = content.indexOf('\n#', sectionStart + 1);
        const sectionContent = nextSection > -1 
          ? content.substring(sectionStart, nextSection)
          : content.substring(sectionStart);
        
        if (sectionContent.length < config.minLength) {
          suggestions.push(`Expand "${section}" section - needs at least ${config.minLength} characters`);
        }
      }
    }
  }

  // Check minimum sections
  const sectionCount = (content.match(/^#{1,3}\s+/gm) || []).length;
  if (sectionCount < structure.minSections) {
    suggestions.push(`Add more sections - ${memoryName} should have at least ${structure.minSections} sections`);
  }

  return {
    valid: missing.length === 0,
    missing,
    suggestions
  };
}

/**
 * Generates a minimal valid structure example
 */
export function generateMinimalStructure(memoryName: string): string {
  const structure = MEMORY_STRUCTURES[memoryName];
  if (!structure) {
    return `# ${memoryName}\n\n[Content to be added]`;
  }

  let content = `# ${memoryName.charAt(0).toUpperCase() + memoryName.slice(1)}\n\n`;
  
  for (const [section, config] of Object.entries(structure.sections)) {
    if (config.required) {
      content += `## ${section.charAt(0).toUpperCase() + section.slice(1)}\n`;
      content += config.description + '\n\n';
      if (config.example) {
        content += `Example:\n${config.example}\n\n`;
      }
    }
  }

  return content;
}

/**
 * Provides guidance for missing structure
 */
export function getStructureGuidance(memoryName: string, missing: string[]): string {
  const structure = MEMORY_STRUCTURES[memoryName];
  if (!structure || missing.length === 0) return '';

  let guidance = `📝 ${structure.guidance}\n\nMissing required sections:\n`;
  
  for (const section of missing) {
    const config = structure.sections[section];
    if (config) {
      guidance += `\n• **${section}**: ${config.description}`;
      if (config.example) {
        guidance += `\n  Example:\n  ${config.example.split('\n').join('\n  ')}`;
      }
    }
  }

  return guidance;
}