import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: Error;
}

/**
 * Execute a shell command and return the result
 */
export async function runCommand(
  command: string,
  cwd: string
): Promise<CommandResult> {
  try {
    logger.info(`Executing command: ${command} in ${cwd}`);
    
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    const success = !stderr || stderr.length === 0;
    
    return {
      success,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    logger.error(`💀 COMMAND EXECUTION EXPLODED: ${command}`, error);
    
    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : '💥 CATASTROPHIC COMMAND FAILURE - System in unknown state!',
      error: error instanceof Error ? error : new Error('🔴 UNKNOWN SYSTEM MELTDOWN - Command execution catastrophically failed!'),
    };
  }
}

/**
 * Run npm test command and extract coverage
 */
export async function runTestsWithCoverage(
  testPattern: string,
  cwd: string
): Promise<{ success: boolean; coverage: number; errors: string[] }> {
  const result = await runCommand(`npm test -- ${testPattern} --coverage`, cwd);
  
  // Parse coverage from output
  let coverage = 0;
  const coverageMatch = result.stdout.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*([0-9.]+)/);
  if (coverageMatch && coverageMatch[1]) {
    coverage = parseFloat(coverageMatch[1]);
  }
  
  const errors: string[] = [];
  if (!result.success) {
    // Extract test failures
    const failureMatches = result.stderr.match(/✖ .*/g) || [];
    errors.push(...failureMatches);
  }
  
  return {
    success: result.success,
    coverage,
    errors,
  };
}

/**
 * Check if a command exists
 */
export async function commandExists(
  command: string,
  cwd: string
): Promise<boolean> {
  const result = await runCommand(`which ${command}`, cwd);
  return result.success;
}