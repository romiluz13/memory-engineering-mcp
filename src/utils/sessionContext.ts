/**
 * Session Context Management v13 - Persistent project binding
 * SOLVES THE #1 PROBLEM: Context drift and confusion!
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { logger } from './logger.js';
import { detectFramework, type FrameworkConfig } from './frameworkDetection.js';

interface SessionContext {
  activeProject: {
    name: string;
    path: string;
    framework: FrameworkConfig;
    lastAccessed: Date;
  } | null;
  history: Array<{
    name: string;
    path: string;
    lastAccessed: Date;
  }>;
  settings: {
    verbose: boolean;
    autoSync: boolean;
    showContext: boolean;
  };
}

const SESSION_FILE = join(homedir(), '.memory-engineering', 'session.json');

/**
 * Load the current session context
 */
export function loadSessionContext(): SessionContext {
  try {
    if (existsSync(SESSION_FILE)) {
      const data = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
      // Convert dates back from strings
      if (data.activeProject?.lastAccessed) {
        data.activeProject.lastAccessed = new Date(data.activeProject.lastAccessed);
      }
      data.history = data.history?.map((h: any) => ({
        ...h,
        lastAccessed: new Date(h.lastAccessed)
      })) || [];
      return data;
    }
  } catch (error) {
    logger.warn('⚠️ Could not load session context, using defaults', error);
  }
  
  return {
    activeProject: null,
    history: [],
    settings: {
      verbose: false,
      autoSync: true,
      showContext: true
    }
  };
}

/**
 * Save the session context
 */
export function saveSessionContext(context: SessionContext): void {
  try {
    const dir = join(homedir(), '.memory-engineering');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(SESSION_FILE, JSON.stringify(context, null, 2));
    logger.debug('💾 Session context saved');
  } catch (error) {
    logger.error('❌ Failed to save session context', error);
  }
}

/**
 * Set the active project context
 */
export function setActiveProject(projectPath: string, projectName?: string): SessionContext {
  const resolvedPath = resolve(projectPath);
  
  if (!existsSync(resolvedPath)) {
    throw new Error(`Project path does not exist: ${resolvedPath}`);
  }
  
  const framework = detectFramework(resolvedPath);
  const name = projectName || resolvedPath.split('/').pop() || 'unnamed';
  
  const context = loadSessionContext();
  
  // Add to history if not already there
  const historyIndex = context.history.findIndex(h => h.path === resolvedPath);
  if (historyIndex === -1) {
    context.history.push({
      name,
      path: resolvedPath,
      lastAccessed: new Date()
    });
  } else {
    context.history[historyIndex].lastAccessed = new Date();
  }
  
  // Keep only last 10 projects in history
  context.history = context.history
    .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
    .slice(0, 10);
  
  // Set as active
  context.activeProject = {
    name,
    path: resolvedPath,
    framework,
    lastAccessed: new Date()
  };
  
  saveSessionContext(context);
  
  logger.info(`🎯 ACTIVE PROJECT SET: ${name}`, {
    path: resolvedPath,
    framework: framework.displayName
  });
  
  return context;
}

/**
 * Get the active project or throw an error
 */
export function getActiveProject(): SessionContext['activeProject'] {
  const context = loadSessionContext();
  
  if (!context.activeProject) {
    throw new Error(`
🔴 NO ACTIVE PROJECT SET!

You MUST set an active project before running any commands:
  memory_engineering_set_context --projectPath "/path/to/project"

Or if you're in a project directory:
  memory_engineering_set_context --projectPath "."

Recent projects:
${context.history.slice(0, 5).map(h => `  • ${h.name}: ${h.path}`).join('\n')}
`);
  }
  
  // Re-detect framework in case it changed
  context.activeProject.framework = detectFramework(context.activeProject.path);
  
  return context.activeProject;
}

/**
 * Clear the active project
 */
export function clearActiveProject(): void {
  const context = loadSessionContext();
  context.activeProject = null;
  saveSessionContext(context);
  logger.info('🧹 Active project cleared');
}

/**
 * Get a formatted context header for all responses
 */
export function getContextHeader(): string {
  try {
    const context = loadSessionContext();
    
    if (!context.settings.showContext || !context.activeProject) {
      return '';
    }
    
    const timeSinceAccess = Date.now() - new Date(context.activeProject.lastAccessed).getTime();
    const hours = Math.floor(timeSinceAccess / (1000 * 60 * 60));
    const freshness = hours < 1 ? '🟢' : hours < 6 ? '🟡' : hours < 24 ? '🟠' : '🔴';
    
    return `
╔════════════════════════════════════════════════════════════════╗
║ 🎯 Active: ${context.activeProject.name.padEnd(20)} ${freshness} ${hours}h ago     ║
║ 📁 Path: ${context.activeProject.path.substring(0, 45).padEnd(45)}║
║ 🏗️ Stack: ${context.activeProject.framework.displayName.padEnd(20)}                      ║
╚════════════════════════════════════════════════════════════════╝
`;
  } catch {
    return '';
  }
}

/**
 * Get or infer project path with smart fallbacks
 */
export function resolveProjectPath(explicitPath?: string): string {
  // 1. Explicit path takes priority
  if (explicitPath) {
    return resolve(explicitPath);
  }
  
  // 2. Try active project
  try {
    const active = getActiveProject();
    if (active) {
      logger.debug(`📍 Using active project: ${active.name}`);
      return active.path;
    }
  } catch {
    // No active project
  }
  
  // 3. Try to detect from current directory
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'package.json')) || 
      existsSync(join(cwd, '.git')) ||
      existsSync(join(cwd, '.memory-engineering'))) {
    logger.debug(`📍 Using current directory as project: ${cwd}`);
    return cwd;
  }
  
  // 4. Give up and throw helpful error
  throw new Error(`
🔴 CANNOT DETERMINE PROJECT PATH!

No project context found. You have 3 options:

1. Set active project (RECOMMENDED):
   memory_engineering_set_context --projectPath "/path/to/project"

2. Run from project directory:
   cd /path/to/project
   memory_engineering_[command]

3. Specify explicitly:
   memory_engineering_[command] --projectPath "/path/to/project"
`);
}
