import { runCommand, runTestsWithCoverage } from './commands.js';
import { logger } from './logger.js';

export interface ValidationResult {
  typescript: {
    success: boolean;
    errors: string[];
  };
  tests: {
    success: boolean;
    coverage: number;
    errors: string[];
  };
  integration: {
    success: boolean;
    errors: string[];
  };
  performance: {
    success: boolean;
    impact: number; // milliseconds
    errors: string[];
  };
}

/**
 * Run TypeScript compilation check
 */
export async function runTypeScriptCheck(projectPath: string): Promise<ValidationResult['typescript']> {
  logger.info('Running TypeScript validation...');
  
  const result = await runCommand('npm run typecheck', projectPath);
  
  const errors: string[] = [];
  if (!result.success && result.stderr) {
    // Extract TypeScript errors
    const errorLines = result.stderr.split('\n').filter(line => 
      line.includes('error TS') || line.includes('Error:')
    );
    errors.push(...errorLines);
  }
  
  return {
    success: result.success,
    errors,
  };
}

/**
 * Run test suite for a feature
 */
export async function runTestSuite(
  featureName: string,
  projectPath: string
): Promise<ValidationResult['tests']> {
  logger.info(`Running tests for feature: ${featureName}`);
  
  // Try to run feature-specific tests
  let result = await runTestsWithCoverage(`feature-${featureName}`, projectPath);
  
  // If no feature-specific tests, run all tests
  if (!result.success && result.errors.some(e => e.includes('No tests found'))) {
    logger.info('No feature-specific tests found, running all tests');
    result = await runTestsWithCoverage('', projectPath);
  }
  
  return {
    success: result.success && result.coverage >= 80,
    coverage: result.coverage,
    errors: result.errors,
  };
}

/**
 * Check end-to-end integration
 */
export async function checkIntegration(
  featureName: string,
  projectPath: string
): Promise<ValidationResult['integration']> {
  logger.info(`Checking integration for feature: ${featureName}`);
  
  const errors: string[] = [];
  
  // Run integration tests if they exist
  const integrationResult = await runCommand(
    `npm run test:integration -- ${featureName}`,
    projectPath
  );
  
  if (!integrationResult.success) {
    // Check if command exists
    if (integrationResult.stderr.includes('Missing script')) {
      // No integration tests defined, check basic build
      const buildResult = await runCommand('npm run build', projectPath);
      if (!buildResult.success) {
        errors.push('Build failed - feature may have integration issues');
      }
    } else {
      errors.push(...integrationResult.stderr.split('\n').filter(line => line.trim()));
    }
  }
  
  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Measure performance impact
 */
export async function measurePerformance(
  featureName: string,
  projectPath: string
): Promise<ValidationResult['performance']> {
  logger.info(`Measuring performance impact for feature: ${featureName}`);
  
  // Simple performance check - measure build time
  const startTime = Date.now();
  const result = await runCommand('npm run build', projectPath);
  const buildTime = Date.now() - startTime;
  
  const errors: string[] = [];
  let impact = 0;
  
  if (!result.success) {
    errors.push('Build failed during performance check');
    impact = 999999; // Very high impact
  } else {
    // Consider < 100ms impact as acceptable
    impact = Math.max(0, buildTime - 5000); // Baseline 5 seconds
    if (impact > 100) {
      errors.push(`Performance impact too high: ${impact}ms over baseline`);
    }
  }
  
  return {
    success: impact < 100,
    impact,
    errors,
  };
}

/**
 * Calculate confidence score based on validation results
 */
export function calculateConfidence(validation: ValidationResult): number {
  let score = 0;
  
  // TypeScript: 3 points
  if (validation.typescript.success) score += 3;
  
  // Tests: 3 points (scaled by coverage)
  if (validation.tests.success) {
    score += 3 * (validation.tests.coverage / 100);
  }
  
  // Integration: 2 points
  if (validation.integration.success) score += 2;
  
  // Performance: 2 points
  if (validation.performance.success) score += 2;
  
  return Math.round(score);
}

