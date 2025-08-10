/**
 * Framework Detection System v13 - Auto-detect project stack and optimize defaults
 * PRODUCTION-READY with zero manual configuration!
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';

export interface FrameworkConfig {
  name: string;
  displayName: string;
  patterns: string[];
  excludes: string[];
  minChunkSize: number;
  syncStrategy: 'incremental' | 'full';
  guidance: {
    architecture: string;
    bestPractices: string;
    commonIssues: string;
  };
}

/**
 * Detect the framework of a project and return optimized configuration
 */
export function detectFramework(projectPath: string): FrameworkConfig {
  logger.info('🔍 FRAMEWORK DETECTION INITIATED - Analyzing project DNA...', { projectPath });
  
  // Check for package.json
  const packageJsonPath = join(projectPath, 'package.json');
  let packageJson: any = {};
  
  if (existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    } catch (error) {
      logger.warn('⚠️ Could not parse package.json', error);
    }
  }
  
  const deps = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };
  
  // Next.js Detection (HIGHEST PRIORITY for frontend)
  if (deps.next || existsSync(join(projectPath, 'next.config.js')) || 
      existsSync(join(projectPath, 'next.config.mjs')) || 
      existsSync(join(projectPath, 'src/app')) ||
      existsSync(join(projectPath, 'app'))) {
    logger.info('⚡ NEXT.JS DETECTED! Optimizing for React Server Components & App Router.');
    return {
      name: 'nextjs',
      displayName: 'Next.js',
      patterns: ['**/*.{ts,tsx,js,jsx,mjs,json}', 'app/**/*', 'src/app/**/*', 'components/**/*'],
      excludes: ['.next/**', 'node_modules/**', '**/*.d.ts', 'out/**', '.vercel/**'],
      minChunkSize: 20, // Small for component files!
      syncStrategy: 'incremental',
      guidance: {
        architecture: 'App Router with Server/Client Components',
        bestPractices: 'Use Server Components by default, Client Components for interactivity',
        commonIssues: 'Hydration mismatches, "use client" directive placement'
      }
    };
  }
  
  // Vue.js Detection
  if (deps.vue || deps['@vue/cli-service'] || existsSync(join(projectPath, 'vue.config.js'))) {
    logger.info('💚 VUE.JS DETECTED! Optimizing for Single File Components.');
    return {
      name: 'vue',
      displayName: 'Vue.js',
      patterns: ['**/*.{vue,js,ts,jsx,tsx}', 'src/**/*'],
      excludes: ['dist/**', 'node_modules/**', '**/*.d.ts'],
      minChunkSize: 30,
      syncStrategy: 'incremental',
      guidance: {
        architecture: 'Component-based with Composition API',
        bestPractices: 'Use Composition API, script setup syntax',
        commonIssues: 'Reactivity gotchas, prop mutations'
      }
    };
  }
  
  // React (non-Next.js) Detection
  if (deps.react && !deps.next) {
    logger.info('⚛️ REACT DETECTED! Optimizing for component architecture.');
    return {
      name: 'react',
      displayName: 'React',
      patterns: ['**/*.{js,jsx,ts,tsx}', 'src/**/*'],
      excludes: ['build/**', 'dist/**', 'node_modules/**', '**/*.d.ts'],
      minChunkSize: 30,
      syncStrategy: 'incremental',
      guidance: {
        architecture: 'Component-based with hooks',
        bestPractices: 'Functional components, custom hooks for logic',
        commonIssues: 'useEffect dependencies, state batching'
      }
    };
  }
  
  // Angular Detection
  if (deps['@angular/core'] || existsSync(join(projectPath, 'angular.json'))) {
    logger.info('🅰️ ANGULAR DETECTED! Optimizing for TypeScript modules.');
    return {
      name: 'angular',
      displayName: 'Angular',
      patterns: ['**/*.{ts,html,scss,css}', 'src/**/*'],
      excludes: ['dist/**', 'node_modules/**', '**/*.spec.ts'],
      minChunkSize: 40,
      syncStrategy: 'incremental',
      guidance: {
        architecture: 'Module-based with dependency injection',
        bestPractices: 'Standalone components, signals for state',
        commonIssues: 'Change detection cycles, memory leaks in subscriptions'
      }
    };
  }
  
  // Express/Node.js Backend Detection
  if (deps.express || deps.koa || deps.fastify || deps.hapi) {
    logger.info('🚂 NODE.JS BACKEND DETECTED! Optimizing for API routes.');
    return {
      name: 'node-backend',
      displayName: 'Node.js Backend',
      patterns: ['**/*.{js,ts}', 'src/**/*', 'routes/**/*', 'controllers/**/*'],
      excludes: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.js', '**/*.spec.js'],
      minChunkSize: 80,
      syncStrategy: 'incremental',
      guidance: {
        architecture: 'MVC or layered architecture',
        bestPractices: 'Middleware composition, error boundaries',
        commonIssues: 'Async error handling, memory leaks'
      }
    };
  }
  
  // Python Detection
  if (existsSync(join(projectPath, 'requirements.txt')) || 
      existsSync(join(projectPath, 'pyproject.toml')) ||
      existsSync(join(projectPath, 'setup.py'))) {
    logger.info('🐍 PYTHON PROJECT DETECTED! Optimizing for Python modules.');
    return {
      name: 'python',
      displayName: 'Python',
      patterns: ['**/*.py', '**/*.pyi'],
      excludes: ['__pycache__/**', '*.pyc', 'venv/**', '.venv/**', 'dist/**', 'build/**'],
      minChunkSize: 60,
      syncStrategy: 'incremental',
      guidance: {
        architecture: 'Module-based or Django/FastAPI patterns',
        bestPractices: 'Type hints, virtual environments',
        commonIssues: 'Import cycles, mutable default arguments'
      }
    };
  }
  
  // Go Detection
  if (existsSync(join(projectPath, 'go.mod'))) {
    logger.info('🐹 GO PROJECT DETECTED! Optimizing for Go modules.');
    return {
      name: 'go',
      displayName: 'Go',
      patterns: ['**/*.go'],
      excludes: ['vendor/**', '**/*_test.go'],
      minChunkSize: 70,
      syncStrategy: 'incremental',
      guidance: {
        architecture: 'Package-based with interfaces',
        bestPractices: 'Interface segregation, error handling',
        commonIssues: 'Goroutine leaks, nil pointer dereferences'
      }
    };
  }
  
  // Rust Detection
  if (existsSync(join(projectPath, 'Cargo.toml'))) {
    logger.info('🦀 RUST PROJECT DETECTED! Optimizing for Rust modules.');
    return {
      name: 'rust',
      displayName: 'Rust',
      patterns: ['**/*.rs'],
      excludes: ['target/**'],
      minChunkSize: 70,
      syncStrategy: 'incremental',
      guidance: {
        architecture: 'Module system with crates',
        bestPractices: 'Ownership patterns, trait design',
        commonIssues: 'Lifetime annotations, borrow checker conflicts'
      }
    };
  }
  
  // Default/Generic JavaScript/TypeScript
  logger.info('📦 GENERIC JS/TS PROJECT - Using balanced defaults.');
  return {
    name: 'generic',
    displayName: 'JavaScript/TypeScript',
    patterns: ['**/*.{js,ts,jsx,tsx,mjs,cjs}'],
    excludes: ['node_modules/**', 'dist/**', 'build/**', '**/*.d.ts'],
    minChunkSize: 50,
    syncStrategy: 'incremental',
    guidance: {
      architecture: 'Unknown - analyze codebase structure',
      bestPractices: 'Consistent module patterns',
      commonIssues: 'Review project-specific patterns'
    }
  };
}

/**
 * Get framework-specific sync recommendations
 */
export function getSyncRecommendations(framework: FrameworkConfig): string {
  const recommendations: string[] = [
    `🎯 Framework: ${framework.displayName}`,
    `📁 Patterns: ${framework.patterns.join(', ')}`,
    `📏 Min chunk size: ${framework.minChunkSize} lines`,
    `🚫 Excludes: ${framework.excludes.join(', ')}`,
    '',
    `💡 Architecture: ${framework.guidance.architecture}`,
    `✅ Best practices: ${framework.guidance.bestPractices}`,
    `⚠️ Common issues: ${framework.guidance.commonIssues}`
  ];
  
  return recommendations.join('\n');
}
