import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { logger } from './logger.js';

/**
 * Find project root by looking for marker files
 * Walks up the directory tree from current working directory
 */
export function findProjectRoot(startPath: string = process.cwd()): string | null {
  const markerFiles = [
    '.memory-engineering/config.json',  // Existing memory project
    'package.json',                     // Node.js project
    'go.mod',                           // Go project
    'Cargo.toml',                       // Rust project
    'requirements.txt',                 // Python project
    'pyproject.toml',                   // Modern Python project
    'Gemfile',                          // Ruby project
    '.git',                             // Git repository root
  ];
  
  let currentPath = startPath;
  let previousPath = '';
  
  while (currentPath !== previousPath) {
    // Check for any marker file
    for (const marker of markerFiles) {
      if (existsSync(join(currentPath, marker))) {
        logger.debug(`🎯 PROJECT ROOT FOUND: ${currentPath} (marker: ${marker})`);
        return currentPath;
      }
    }
    
    // Move up one directory
    previousPath = currentPath;
    currentPath = dirname(currentPath);
  }
  
  // No project root found, use original path
  logger.debug(`🤷 NO PROJECT MARKERS - Using: ${startPath}`);
  return startPath;
}

/**
 * Get project path with smart fallback
 * Priority: provided path > project root > current directory
 */
export function getProjectPath(providedPath?: string): string {
  if (providedPath) {
    logger.debug(`📦 USING PROVIDED PATH: ${providedPath}`);
    return providedPath;
  }
  
  const detected = findProjectRoot();
  if (detected) {
    logger.info(`🔍 AUTO-DETECTED PROJECT: ${detected}`);
    return detected;
  }
  
  const cwd = process.cwd();
  logger.debug(`📁 USING CURRENT DIRECTORY: ${cwd}`);
  return cwd;
}
