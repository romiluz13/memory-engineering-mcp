/**
 * Memory Synthesis on Demand
 * Generates memories from existing project data without pre-storing
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

/**
 * Synthesizes techContext from package.json and project files
 */
export function synthesizeTechContext(projectPath: string): string {
  let content = '# Tech Context\n\n';
  
  // Analyze package.json
  if (existsSync(join(projectPath, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf-8'));
      
      content += '## Technology Stack\n\n';
      
      // Detect language
      const hasTypescript = pkg.devDependencies?.typescript || existsSync(join(projectPath, 'tsconfig.json'));
      content += `- **Language**: ${hasTypescript ? 'TypeScript' : 'JavaScript'}\n`;
      content += `- **Runtime**: Node.js\n`;
      
      // Detect frameworks
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const frameworks = [];
      if (deps.react) frameworks.push('React');
      if (deps.next) frameworks.push('Next.js');
      if (deps.vue) frameworks.push('Vue');
      if (deps.express) frameworks.push('Express');
      if (deps['@angular/core']) frameworks.push('Angular');
      
      if (frameworks.length > 0) {
        content += `- **Frameworks**: ${frameworks.join(', ')}\n`;
      }
      
      content += '\n### Key Dependencies\n';
      const importantDeps = Object.keys(deps)
        .filter(dep => !dep.startsWith('@types/'))
        .slice(0, 10);
      
      importantDeps.forEach(dep => {
        content += `- **${dep}**: ${deps[dep]}\n`;
      });
      
      // Scripts section
      if (pkg.scripts) {
        content += '\n## Available Scripts\n';
        Object.entries(pkg.scripts).forEach(([name, command]) => {
          content += `- \`npm run ${name}\`: ${command}\n`;
        });
      }
      
      // Dev setup
      content += '\n## Development Setup\n';
      content += '1. Clone repository\n';
      content += '2. Install dependencies: `npm install`\n';
      if (pkg.scripts?.dev) {
        content += '3. Start development: `npm run dev`\n';
      } else if (pkg.scripts?.start) {
        content += '3. Start application: `npm start`\n';
      }
      
    } catch (e) {
      content += 'Unable to parse package.json\n';
    }
  }
  
  // Check for other config files
  const configFiles = [
    { file: '.env.example', section: 'Environment Variables' },
    { file: 'docker-compose.yml', section: 'Docker Configuration' },
    { file: 'Dockerfile', section: 'Container Setup' }
  ];
  
  configFiles.forEach(({ file, section }) => {
    if (existsSync(join(projectPath, file))) {
      content += `\n## ${section}\nFound: \`${file}\`\n`;
    }
  });
  
  return content;
}

/**
 * Synthesizes codebaseMap from file system
 */
export function synthesizeCodebaseMap(projectPath: string): string {
  let content = '# Codebase Map\n\n## Directory Structure\n```\n';
  
  // Generate directory tree
  content += generateDirectoryTree(projectPath, '', 0, 3);
  content += '```\n\n';
  
  // Identify key files
  content += '## Key Files\n\n';
  
  const keyFiles = [
    { pattern: 'index', description: 'Entry points' },
    { pattern: 'main', description: 'Main application files' },
    { pattern: 'app', description: 'Application root' },
    { pattern: 'server', description: 'Server configuration' },
    { pattern: 'config', description: 'Configuration files' },
    { pattern: 'routes', description: 'Route definitions' }
  ];
  
  const foundFiles: Record<string, string[]> = {};
  
  // Find key files
  const allFiles = findFiles(projectPath, 3);
  keyFiles.forEach(({ pattern, description }) => {
    const matches = allFiles.filter(file => 
      basename(file).toLowerCase().includes(pattern)
    );
    if (matches.length > 0) {
      foundFiles[description] = matches;
    }
  });
  
  // Write found files
  Object.entries(foundFiles).forEach(([description, files]) => {
    content += `### ${description}\n`;
    files.slice(0, 5).forEach(file => {
      content += `- \`${file}\`\n`;
    });
    content += '\n';
  });
  
  // Analyze file types
  const extensions: Record<string, number> = {};
  allFiles.forEach(file => {
    const ext = extname(file).toLowerCase();
    if (ext) {
      extensions[ext] = (extensions[ext] || 0) + 1;
    }
  });
  
  content += '## File Type Distribution\n';
  Object.entries(extensions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([ext, count]) => {
      content += `- \`${ext}\`: ${count} files\n`;
    });
  
  return content;
}

/**
 * Synthesizes systemPatterns from source code analysis
 */
export function synthesizeSystemPatterns(projectPath: string): string {
  let content = '# System Patterns\n\n';
  
  const sourceFiles = findFiles(projectPath, 2)
    .filter(file => ['.js', '.ts', '.jsx', '.tsx'].includes(extname(file)));
  
  if (sourceFiles.length === 0) {
    return content + 'No source files found to analyze.\n';
  }
  
  // Analyze patterns
  const patterns = {
    async: 0,
    classes: 0,
    functional: 0,
    imports: new Set<string>(),
    exports: 0,
    tests: 0
  };
  
  // Sample up to 20 files
  sourceFiles.slice(0, 20).forEach(file => {
    try {
      const code = readFileSync(join(projectPath, file), 'utf-8');
      
      // Count patterns
      if (code.includes('async') || code.includes('await')) patterns.async++;
      if (code.match(/class\s+\w+/)) patterns.classes++;
      if (code.match(/const\s+\w+\s*=\s*\(/)) patterns.functional++;
      if (code.match(/export\s+(const|function|class)/)) patterns.exports++;
      if (file.includes('.test.') || file.includes('.spec.')) patterns.tests++;
      
      // Collect imports
      const importMatches = code.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const lib = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
          if (lib && !lib.startsWith('.')) {
            const libName = lib.split('/')[0];
            if (libName) {
              patterns.imports.add(libName);
            }
          }
        });
      }
    } catch {
      // Ignore read errors
    }
  });
  
  content += '## Architecture Overview\n';
  
  // Determine architecture style
  if (patterns.classes > patterns.functional) {
    content += 'Object-Oriented Architecture (class-based)\n';
  } else {
    content += 'Functional Architecture (function-based)\n';
  }
  
  if (patterns.async > sourceFiles.length / 2) {
    content += '- Heavy use of async/await patterns\n';
  }
  
  if (patterns.tests > 0) {
    content += `- Test-driven development (${patterns.tests} test files found)\n`;
  }
  
  content += '\n## Common Patterns Detected\n\n';
  
  if (patterns.async > 0) {
    content += '### Async/Await Pattern\n';
    content += 'Used extensively for asynchronous operations\n';
    content += '```javascript\n';
    content += 'async function fetchData() {\n';
    content += '  try {\n';
    content += '    const result = await apiCall();\n';
    content += '    return result;\n';
    content += '  } catch (error) {\n';
    content += '    // Handle error\n';
    content += '  }\n';
    content += '}\n';
    content += '```\n\n';
  }
  
  if (patterns.classes > 0) {
    content += '### Class-Based Components\n';
    content += 'Object-oriented patterns with class inheritance\n\n';
  }
  
  if (patterns.functional > 0) {
    content += '### Functional Components\n';
    content += 'Functional programming patterns with arrow functions\n\n';
  }
  
  // Common libraries
  if (patterns.imports.size > 0) {
    content += '## Key Libraries Used\n';
    Array.from(patterns.imports)
      .slice(0, 10)
      .forEach(lib => {
        content += `- ${lib}\n`;
      });
  }
  
  return content;
}

/**
 * Synthesizes projectbrief from README and package.json
 */
export function synthesizeProjectBrief(projectPath: string): string {
  let content = '# Project Brief\n\n';
  
  // Try to extract from README
  if (existsSync(join(projectPath, 'README.md'))) {
    try {
      const readme = readFileSync(join(projectPath, 'README.md'), 'utf-8');
      const lines = readme.split('\n');
      
      // Extract title
      const title = lines.find(line => line.startsWith('# '))?.replace('# ', '');
      if (title) {
        content += `## Project Name\n${title}\n\n`;
      }
      
      // Extract description (usually first paragraph)
      const descStart = lines.findIndex(line => line.trim() && !line.startsWith('#'));
      if (descStart >= 0) {
        const descEnd = lines.findIndex((line, i) => i > descStart && (!line.trim() || line.startsWith('#')));
        const description = lines.slice(descStart, descEnd > 0 ? descEnd : descStart + 3).join('\n');
        content += `## Overview\n${description}\n\n`;
      }
      
    } catch {
      // Continue with package.json
    }
  }
  
  // Supplement with package.json
  if (existsSync(join(projectPath, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf-8'));
      
      if (!content.includes('## Project Name')) {
        content += `## Project Name\n${pkg.name || 'Unknown'}\n\n`;
      }
      
      if (!content.includes('## Overview') && pkg.description) {
        content += `## Overview\n${pkg.description}\n\n`;
      }
      
    } catch {
      // Ignore
    }
  }
  
  // Add template sections
  content += `## Goals
- **Primary**: [Define main objective]
- **Metrics**: [How to measure success]
- **Timeline**: [Target completion]

## Scope
### In Scope
- [Core features]

### Out of Scope  
- [Future features]

## Success Criteria
- **Technical**: [Performance targets]
- **User**: [User satisfaction]
- **Business**: [Business metrics]
`;
  
  return content;
}

/**
 * Helper functions
 */
function generateDirectoryTree(dirPath: string, prefix: string, depth: number, maxDepth: number): string {
  if (depth >= maxDepth) return '';
  
  try {
    const items = readdirSync(dirPath, { withFileTypes: true })
      .filter(item => !item.name.startsWith('.') && 
        !['node_modules', 'dist', 'build', '.git'].includes(item.name))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    return items.map((item, index) => {
      const isLast = index === items.length - 1;
      const extension = isLast ? '└── ' : '├── ';
      const line = prefix + extension + item.name + (item.isDirectory() ? '/' : '') + '\n';
      
      if (item.isDirectory() && depth < maxDepth - 1) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        const itemPath = join(dirPath, item.name);
        return line + generateDirectoryTree(itemPath || '', newPrefix, depth + 1, maxDepth);
      }
      
      return line;
    }).join('');
  } catch (e) {
    return '';
  }
}

function findFiles(dir: string, maxDepth: number, currentDepth = 0, basePath = ''): string[] {
  if (currentDepth >= maxDepth) return [];
  
  const files: string[] = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      if (['node_modules', '.git', 'dist', 'build'].includes(item)) continue;
      
      const fullPath = join(dir, item);
      const relativePath = basePath ? join(basePath, item) : item;
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findFiles(fullPath, maxDepth, currentDepth + 1, relativePath));
      } else {
        files.push(relativePath);
      }
    }
  } catch {
    // Ignore permission errors
  }
  
  return files;
}

/**
 * Main synthesis function
 */
export async function synthesizeMemory(
  memoryName: string,
  projectPath: string
): Promise<{ content: string; confidence: 'high' | 'medium' | 'low' }> {
  switch (memoryName) {
    case 'techContext':
      return {
        content: synthesizeTechContext(projectPath),
        confidence: existsSync(join(projectPath, 'package.json')) ? 'high' : 'low'
      };
      
    case 'codebaseMap':
      return {
        content: synthesizeCodebaseMap(projectPath),
        confidence: 'high'
      };
      
    case 'systemPatterns':
      const patterns = synthesizeSystemPatterns(projectPath);
      return {
        content: patterns,
        confidence: patterns.includes('No source files') ? 'low' : 'medium'
      };
      
    case 'projectbrief':
      const brief = synthesizeProjectBrief(projectPath);
      return {
        content: brief,
        confidence: brief.includes('[Define main objective]') ? 'low' : 'medium'
      };
      
    default:
      return {
        content: `# ${memoryName}\n\n[Content to be added]`,
        confidence: 'low'
      };
  }
}