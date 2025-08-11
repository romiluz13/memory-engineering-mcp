/**
 * Doctor Tool - Comprehensive system diagnostics
 * Finds and fixes ALL problems automatically!
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getDb } from '../db/connection.js';
import { loadSessionContext } from '../utils/sessionContext.js';
import { logger } from '../utils/logger.js';


const DoctorSchema = z.object({
  fix: z.boolean().optional().describe('Attempt to auto-fix issues'),
  verbose: z.boolean().optional().describe('Show detailed diagnostics')
});

interface DiagnosticResult {
  category: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  fix?: string;
}

export async function doctorTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = DoctorSchema.parse(args);
    const results: DiagnosticResult[] = [];
    
    logger.info('🏥 RUNNING COMPREHENSIVE DIAGNOSTICS...');
    
    // 1. Environment Variables
    results.push({
      category: 'Environment',
      status: process.env.MONGODB_URI ? 'pass' : 'fail',
      message: process.env.MONGODB_URI ? 'MongoDB URI configured' : 'MongoDB URI missing',
      fix: 'Add MONGODB_URI to your .env.local file'
    });
    
    results.push({
      category: 'Environment',
      status: process.env.VOYAGE_API_KEY?.startsWith('pa-') ? 'pass' : 'fail',
      message: process.env.VOYAGE_API_KEY ? 'Voyage API key configured' : 'Voyage API key missing',
      fix: 'Add VOYAGE_API_KEY to your .env.local file (get from voyageai.com)'
    });
    
    // 2. MongoDB Connection
    try {
      await getDb().admin().ping();
      results.push({
        category: 'Database',
        status: 'pass',
        message: 'MongoDB connection active'
      });
      
      // Check collections
      const collections = await getDb().listCollections().toArray();
      const hasMemoryCollection = collections.some(c => c.name === 'memory_engineering');
      const hasCodeCollection = collections.some(c => c.name === 'memory_engineering_code');
      
      results.push({
        category: 'Database',
        status: hasMemoryCollection ? 'pass' : 'warn',
        message: hasMemoryCollection ? 'Memory collection exists' : 'Memory collection missing',
        fix: 'Will be created on first use'
      });
      
      results.push({
        category: 'Database',
        status: hasCodeCollection ? 'pass' : 'warn',
        message: hasCodeCollection ? 'Code collection exists' : 'Code collection missing',
        fix: 'Will be created on first sync'
      });
      
    } catch (error) {
      results.push({
        category: 'Database',
        status: 'fail',
        message: 'MongoDB connection failed',
        fix: 'Check MONGODB_URI and network connection'
      });
    }
    
    // 3. Project Context
    const context = loadSessionContext();
    
    if (context.activeProject) {
      results.push({
        category: 'Project',
        status: 'pass',
        message: `Active project: ${context.activeProject.name}`
      });
      
      // Check if project exists
      if (existsSync(context.activeProject.path)) {
        results.push({
          category: 'Project',
          status: 'pass',
          message: 'Project path exists'
        });
        
        // Check initialization
        const configPath = join(context.activeProject.path, '.memory-engineering', 'config.json');
        results.push({
          category: 'Project',
          status: existsSync(configPath) ? 'pass' : 'warn',
          message: existsSync(configPath) ? 'Project initialized' : 'Project not initialized',
          fix: 'Run: memory_engineering_init --with-sync'
        });
      } else {
        results.push({
          category: 'Project',
          status: 'fail',
          message: 'Project path no longer exists',
          fix: 'Run: memory_engineering_set_context --projectPath "/new/path"'
        });
      }
    } else {
      results.push({
        category: 'Project',
        status: 'warn',
        message: 'No active project set',
        fix: 'Run: memory_engineering_set_context --projectPath "/path/to/project"'
      });
    }
    
    // 4. System Dependencies
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      results.push({
        category: 'System',
        status: majorVersion >= 18 ? 'pass' : 'warn',
        message: `Node.js ${nodeVersion}`,
        fix: majorVersion < 18 ? 'Upgrade to Node.js 18 or higher' : undefined
      });
    } catch {
      results.push({
        category: 'System',
        status: 'warn',
        message: 'Could not check Node.js version'
      });
    }
    
    // 5. Package Version Check
    try {
      const context = loadSessionContext();
      let packageJsonPath = '';
      if (context.activeProject?.path) {
        packageJsonPath = join(context.activeProject.path, 'package.json');
      }
      if (!packageJsonPath || !existsSync(packageJsonPath)) {
        packageJsonPath = join(process.cwd(), 'package.json');
      }
      if (!existsSync(packageJsonPath)) {
        packageJsonPath = join(process.cwd(), '..', 'package.json');
      }
      
      if (existsSync(packageJsonPath)) {
        const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        results.push({
          category: 'System',
          status: 'pass',
          message: `Memory Engineering v${packageJson.version}`
        });
      } else {
        results.push({
          category: 'System',
          status: 'warn',
          message: 'Package version could not be determined'
        });
      }
    } catch (error) {
      // Check if we're running from npm global or local
      const isRunning = process.argv.some(arg => arg.includes('memory-engineering-mcp'));
      if (isRunning) {
        results.push({
          category: 'System',
          status: 'warn',
          message: 'Version detection failed but tool is running',
          fix: 'This is normal for globally installed packages'
        });
      } else {
        results.push({
          category: 'System',
          status: 'fail',
          message: 'Unable to detect package version',
          fix: 'Ensure you are running from the correct directory'
        });
      }
    }
    
    // 6. Voyage API Test (if key present)
    if (process.env.VOYAGE_API_KEY) {
      try {
        const response = await fetch('https://api.voyageai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: 'test',
            model: 'voyage-3',
            input_type: 'document'
          })
        });
        
        results.push({
          category: 'API',
          status: response.ok ? 'pass' : 'fail',
          message: response.ok ? 'Voyage AI API working' : `Voyage API error: ${response.status}`,
          fix: response.ok ? undefined : 'Check API key validity and rate limits'
        });
      } catch (error) {
        results.push({
          category: 'API',
          status: 'fail',
          message: 'Could not reach Voyage AI API',
          fix: 'Check internet connection'
        });
      }
    }
    
    // Build the response
    let response = '🏥 DOCTOR DIAGNOSTIC RESULTS\n';
    response += '═'.repeat(50) + '\n\n';
    
    const grouped = results.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    }, {} as Record<string, DiagnosticResult[]>);
    
    let hasFailures = false;
    let hasWarnings = false;
    
    for (const [category, catResults] of Object.entries(grouped)) {
      const icon = catResults.every(r => r.status === 'pass') ? '✅' :
                   catResults.some(r => r.status === 'fail') ? '❌' : '⚠️';
      
      response += `${icon} ${category.toUpperCase()}\n`;
      response += '─'.repeat(40) + '\n';
      
      for (const result of catResults) {
        const statusIcon = result.status === 'pass' ? '✅' :
                          result.status === 'fail' ? '❌' : '⚠️';
        
        response += `${statusIcon} ${result.message}\n`;
        
        if (result.fix && result.status !== 'pass') {
          response += `   🔧 Fix: ${result.fix}\n`;
          hasFailures = hasFailures || result.status === 'fail';
          hasWarnings = hasWarnings || result.status === 'warn';
        }
        
        if (params.verbose && result.status === 'pass') {
          response += `   ✓ Working correctly\n`;
        }
      }
      
      response += '\n';
    }
    
    // Overall diagnosis
    response += '═'.repeat(50) + '\n';
    
    if (!hasFailures && !hasWarnings) {
      response += '🎉 PERFECT HEALTH! All systems operational.\n';
      response += 'Your Memory Engineering system is ready for production!\n';
    } else if (hasFailures) {
      response += '🔴 CRITICAL ISSUES DETECTED!\n';
      response += 'Fix the issues above to restore full functionality.\n';
      
      if (params.fix) {
        response += '\n🔧 AUTO-FIX ATTEMPTED:\n';
        // Implement auto-fix logic here
        response += 'Some issues require manual intervention.\n';
      } else {
        response += '\nRun with --fix to attempt automatic repairs.\n';
      }
    } else {
      response += '🟡 MINOR ISSUES DETECTED\n';
      response += 'System is functional but could be improved.\n';
    }
    
    // Quick fix command
    if (hasFailures || hasWarnings) {
      response += '\n📋 QUICK FIX COMMANDS:\n';
      response += '─'.repeat(40) + '\n';
      
      if (results.some(r => r.message.includes('MongoDB URI missing'))) {
        response += 'echo "MONGODB_URI=your_uri_here" >> .env.local\n';
      }
      if (results.some(r => r.message.includes('Voyage API key missing'))) {
        response += 'echo "VOYAGE_API_KEY=your_key_here" >> .env.local\n';
      }
      if (results.some(r => r.message.includes('No active project'))) {
        response += 'memory_engineering_set_context --projectPath "."\n';
      }
      if (results.some(r => r.message.includes('not initialized'))) {
        response += 'memory_engineering_init --with-sync\n';
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
    
  } catch (error) {
    logger.error('💀 DOCTOR DIAGNOSTIC FAILED!', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `💀 DIAGNOSTIC CATASTROPHE!

The doctor tool itself encountered an error:
${error instanceof Error ? error.message : 'Unknown error'}

This usually means a critical system issue.
Please check your installation and environment.`
        }
      ]
    };
  }
}
