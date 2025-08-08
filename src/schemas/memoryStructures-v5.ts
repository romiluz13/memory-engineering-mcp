/**
 * Memory Structure Schemas v5 - Following Cline's exact structure
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
    guidance: 'Foundation document that shapes all other files. Defines core requirements and goals.',
    sections: {
      'overview': {
        required: true,
        minLength: 100,
        description: 'What is this project?',
        example: '## Overview\nThis project...'
      },
      'goals': {
        required: true,
        description: 'What are we trying to achieve?',
        example: '## Goals\n- Primary: ...\n- Secondary: ...'
      },
      'scope': {
        required: true,
        description: 'What\'s included and what\'s not?',
        example: '## Scope\n### Included\n- ...\n### Excluded\n- ...'
      },
      'success criteria': {
        required: true,
        description: 'How do we know when we\'re done?',
        example: '## Success Criteria\n- [ ] ...\n- [ ] ...'
      }
    }
  },

  productContext: {
    minSections: 4,
    guidance: 'Why this project exists, problems it solves, how it should work, user experience goals.',
    sections: {
      'why this exists': {
        required: true,
        minLength: 100,
        description: 'The motivation and need for this project'
      },
      'problems it solves': {
        required: true,
        description: 'Specific problems being addressed'
      },
      'how it should work': {
        required: true,
        description: 'Expected behavior and functionality'
      },
      'user experience goals': {
        required: true,
        description: 'What users should feel and achieve'
      }
    }
  },

  activeContext: {
    minSections: 4,
    guidance: 'Current work focus, recent changes, next steps, learnings and insights.',
    sections: {
      'current focus': {
        required: true,
        description: 'What you\'re actively working on',
        example: '## Current Focus\nImplementing authentication...'
      },
      'active tasks': {
        required: true,
        description: 'Current task list',
        example: '## Active Tasks\n- [ ] Set up JWT\n- [x] Create user model'
      },
      'recent changes': {
        required: true,
        description: 'What was changed recently',
        example: '## Recent Changes\n### 2025-01-28\n- Added login endpoint\n- Fixed validation bug'
      },
      'learnings & insights': {
        required: true,
        description: 'Important patterns, preferences, and project insights',
        example: '## Learnings & Insights\n### Authentication Pattern\n**Problem**: JWT expiry handling\n**Solution**: Refresh token rotation\n**Key Learning**: Always validate on server side'
      },
      'blockers & questions': {
        required: false,
        description: 'Current blockers and open questions'
      }
    }
  },

  systemPatterns: {
    minSections: 4,
    guidance: 'System architecture, key technical decisions, design patterns in use, component relationships.',
    sections: {
      'architecture overview': {
        required: true,
        description: 'High-level system design',
        example: '## Architecture Overview\nLayered architecture with...'
      },
      'key technical decisions': {
        required: true,
        description: 'Important choices made and why'
      },
      'design patterns': {
        required: true,
        description: 'Patterns in use with examples',
        example: '### Pattern: Repository\n**When to use**: Data access\n**Implementation**: ...\n**Benefits**: ...'
      },
      'component relationships': {
        required: true,
        description: 'How components interact'
      },
      'critical implementation paths': {
        required: false,
        description: 'Key flows through the system'
      }
    }
  },

  techContext: {
    minSections: 4,
    guidance: 'Technologies used, development setup, technical constraints, dependencies, tool usage patterns.',
    sections: {
      'technologies used': {
        required: true,
        description: 'Complete tech stack',
        example: '## Technologies Used\n- Runtime: Node.js v20\n- Framework: Express\n- Database: MongoDB'
      },
      'development setup': {
        required: true,
        description: 'How to get started developing',
        example: '## Development Setup\n1. Clone repo\n2. npm install\n3. cp .env.example .env'
      },
      'technical constraints': {
        required: true,
        description: 'Limitations and requirements'
      },
      'dependencies': {
        required: true,
        description: 'Key dependencies and why they\'re used'
      },
      'tool usage patterns': {
        required: false,
        description: 'How tools are used in the project'
      }
    }
  },

  progress: {
    minSections: 4,
    guidance: 'What works, what\'s left to build, current status, known issues, evolution of decisions.',
    sections: {
      'what works': {
        required: true,
        description: 'Completed features and functionality',
        example: '## What Works\n- ✅ User authentication\n- ✅ Basic CRUD operations'
      },
      'what\'s left to build': {
        required: true,
        description: 'Remaining features and tasks'
      },
      'current status': {
        required: true,
        description: 'Overall project state'
      },
      'known issues': {
        required: true,
        description: 'Bugs and problems to address'
      },
      'evolution of decisions': {
        required: false,
        description: 'How decisions have changed over time'
      }
    }
  }
};