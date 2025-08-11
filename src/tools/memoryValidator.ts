/**
 * Memory Quality Validator
 * Ensures memories meet A+ quality standards
 */

import { logger } from '../utils/logger.js';

export interface ValidationResult {
  isValid: boolean;
  score: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  issues: string[];
  suggestions: string[];
  metrics: {
    characterCount: number;
    sectionCount: number;
    placeholderCount: number;
    detailLevel: number;
  };
}

/**
 * Validate memory quality and provide actionable feedback
 */
export function validateMemoryQuality(
  memoryName: string, 
  content: string,
  strict: boolean = false
): ValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Calculate metrics
  const metrics = {
    characterCount: content.length,
    sectionCount: (content.match(/^###? /gm) || []).length,
    placeholderCount: (content.match(/\[([^\]]+)\]/g) || []).length,
    detailLevel: calculateDetailLevel(content)
  };
  
  // Define minimum requirements
  const requirements: Record<string, { minLength: number; minSections: number }> = {
    projectbrief: { minLength: 500, minSections: 4 },
    productContext: { minLength: 400, minSections: 3 },
    activeContext: { minLength: 300, minSections: 4 },
    systemPatterns: { minLength: 500, minSections: 4 },
    techContext: { minLength: 400, minSections: 3 },
    progress: { minLength: 300, minSections: 3 },
    codebaseMap: { minLength: 400, minSections: 4 }
  };
  
  const req = requirements[memoryName] || { minLength: 300, minSections: 2 };
  
  // Check minimum length
  if (metrics.characterCount < req.minLength) {
    issues.push(`Too short: ${metrics.characterCount} chars (minimum: ${req.minLength})`);
    suggestions.push(`Add ${req.minLength - metrics.characterCount} more characters of detail`);
  }
  
  // Check for sections
  if (metrics.sectionCount < req.minSections) {
    issues.push(`Missing sections: only ${metrics.sectionCount} found (need ${req.minSections})`);
    suggestions.push('Add clear section headers using ## or ###');
  }
  
  // Check for unfilled placeholders
  const placeholders = content.match(/\[([^\]]+)\]/g) || [];
  const unfilledPlaceholders = placeholders.filter(p => 
    p.includes('TODO') || 
    p.includes('FILL') || 
    p.includes('Write') ||
    p.includes('Describe') ||
    p.includes('item') ||
    p.includes('feature') ||
    p.includes('requirement')
  );
  
  if (unfilledPlaceholders.length > 0) {
    issues.push(`Contains ${unfilledPlaceholders.length} unfilled placeholders`);
    suggestions.push('Replace all placeholder text with actual content');
  }
  
  // Check for low-quality patterns
  const lowQualityPatterns = [
    { pattern: /^.{0,20}$/gm, message: 'Contains very short lines (under 20 chars)' },
    { pattern: /\.\.\./g, message: 'Contains ellipsis (...) suggesting incomplete content' },
    { pattern: /TBD|TODO|FIXME|XXX/i, message: 'Contains TODO markers' },
    { pattern: /^- \n/gm, message: 'Contains empty bullet points' }
  ];
  
  for (const { pattern, message } of lowQualityPatterns) {
    if (pattern.test(content)) {
      issues.push(message);
    }
  }
  
  // Check for excessive abbreviations
  const abbreviations = (content.match(/\b[A-Z]{2,}:/g) || []).length;
  if (abbreviations > 5) {
    issues.push(`Too many abbreviations (${abbreviations} found)`);
    suggestions.push('Write in complete sentences instead of abbreviated notes');
  }
  
  // Check specific memory requirements
  checkSpecificRequirements(memoryName, content, issues, suggestions);
  
  // Calculate score
  let score: ValidationResult['score'] = 'A+';
  
  if (issues.length >= 1) score = 'A';
  if (issues.length >= 2) score = 'B';
  if (issues.length >= 3) score = 'C';
  if (issues.length >= 4) score = 'D';
  if (issues.length >= 5) score = 'F';
  
  // In strict mode, be harsher
  if (strict && issues.length > 0) {
    score = score === 'A' ? 'B' : 
            score === 'B' ? 'C' : 
            score === 'C' ? 'D' : 'F';
  }
  
  // Log validation result
  logger.debug(`Memory validation for ${memoryName}: Score=${score}, Issues=${issues.length}`);
  
  return {
    isValid: issues.length === 0 || (!strict && score !== 'F'),
    score,
    issues,
    suggestions: suggestions.length > 0 ? suggestions : ['Memory looks good! Consider adding more specific examples.'],
    metrics
  };
}

/**
 * Calculate detail level (0-100)
 */
function calculateDetailLevel(content: string): number {
  let score = 0;
  
  // Length contributes to detail
  if (content.length > 1000) score += 20;
  else if (content.length > 500) score += 10;
  
  // Sections contribute to structure
  const sections = (content.match(/^###? /gm) || []).length;
  score += Math.min(sections * 5, 20);
  
  // Lists show organization
  const listItems = (content.match(/^[\-\*\d]\. /gm) || []).length;
  score += Math.min(listItems * 2, 20);
  
  // Code blocks show technical detail
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  score += Math.min(codeBlocks * 10, 20);
  
  // Specific numbers/dates show precision
  const specifics = (content.match(/\d{2,}/g) || []).length;
  score += Math.min(specifics * 3, 20);
  
  return Math.min(score, 100);
}

/**
 * Check memory-specific requirements
 */
function checkSpecificRequirements(
  memoryName: string, 
  content: string, 
  issues: string[], 
  suggestions: string[]
): void {
  const contentLower = content.toLowerCase();
  
  switch (memoryName) {
    case 'projectbrief':
      if (!contentLower.includes('requirement') && !contentLower.includes('goal')) {
        issues.push('Missing requirements or goals section');
        suggestions.push('Add specific requirements and goals');
      }
      if (!contentLower.includes('scope')) {
        issues.push('Missing scope definition');
        suggestions.push('Define what is in and out of scope');
      }
      break;
      
    case 'productContext':
      if (!contentLower.includes('problem') && !contentLower.includes('solve')) {
        issues.push('Missing problem statement');
        suggestions.push('Clearly state the problem being solved');
      }
      if (!contentLower.includes('user') && !contentLower.includes('customer')) {
        issues.push('Missing user/customer information');
        suggestions.push('Identify target users and their needs');
      }
      break;
      
    case 'activeContext':
      // Check for timestamps
      const hasTimestamp = /\d{4}-\d{2}-\d{2}/.test(content) || /\d{2}:\d{2}/.test(content);
      if (!hasTimestamp) {
        issues.push('Missing timestamps for current activity');
        suggestions.push('Add timestamps to show when actions occurred');
      }
      if (!contentLower.includes('next')) {
        issues.push('Missing next steps');
        suggestions.push('Add what you plan to do next');
      }
      break;
      
    case 'systemPatterns':
      if (!contentLower.includes('architecture') && !contentLower.includes('pattern')) {
        issues.push('Missing architecture or pattern descriptions');
        suggestions.push('Describe the system architecture and design patterns');
      }
      if (!contentLower.includes('component') && !contentLower.includes('module')) {
        issues.push('Missing component/module relationships');
        suggestions.push('Explain how components interact');
      }
      break;
      
    case 'techContext':
      if (!contentLower.includes('version') && !contentLower.includes('dependency')) {
        issues.push('Missing version information');
        suggestions.push('Include specific versions of technologies used');
      }
      if (!contentLower.includes('constraint') && !contentLower.includes('requirement')) {
        issues.push('Missing technical constraints');
        suggestions.push('Document technical limitations and requirements');
      }
      break;
      
    case 'progress':
      if (!contentLower.includes('complete') && !contentLower.includes('done')) {
        issues.push('Missing completed items');
        suggestions.push('List what has been completed');
      }
      if (!contentLower.includes('todo') && !contentLower.includes('next')) {
        issues.push('Missing TODO items');
        suggestions.push('Add upcoming tasks and priorities');
      }
      break;
      
    case 'codebaseMap':
      if (!contentLower.includes('structure') && !contentLower.includes('directory')) {
        issues.push('Missing structure information');
        suggestions.push('Describe the directory structure');
      }
      if (!contentLower.includes('entry') && !contentLower.includes('main')) {
        issues.push('Missing entry points');
        suggestions.push('Identify main entry points of the application');
      }
      break;
  }
}

/**
 * Generate improvement suggestions based on current content
 */
export function generateImprovementTips(
  memoryName: string,
  currentContent: string
): string[] {
  const tips: string[] = [];
  const validation = validateMemoryQuality(memoryName, currentContent);
  
  if (validation.score === 'A+') {
    return ['Excellent memory! Consider adding recent updates to keep it fresh.'];
  }
  
  // Prioritize suggestions
  if (validation.metrics.characterCount < 300) {
    tips.push('📝 Add more detail - aim for at least 500 characters');
  }
  
  if (validation.metrics.sectionCount < 3) {
    tips.push('🏗️ Add clear sections with ## headers');
  }
  
  if (validation.metrics.placeholderCount > 3) {
    tips.push('✏️ Fill in the placeholder text with actual content');
  }
  
  if (validation.metrics.detailLevel < 50) {
    tips.push('🎯 Add specific examples, numbers, and dates');
  }
  
  // Memory-specific tips
  const specificTips: Record<string, string> = {
    projectbrief: '💡 Include measurable success criteria',
    productContext: '👥 Describe user personas in detail',
    activeContext: '⏰ Update with current timestamp and recent actions',
    systemPatterns: '📊 Add a diagram or data flow description',
    techContext: '📦 List all key dependencies with versions',
    progress: '✅ Include completion dates and time estimates',
    codebaseMap: '🗺️ Map out the critical file paths'
  };
  
  if (specificTips[memoryName]) {
    tips.push(specificTips[memoryName]);
  }
  
  return tips.slice(0, 3); // Return top 3 tips
}

/**
 * Check if content appears to be auto-generated poorly
 */
export function detectLowEffortContent(content: string): boolean {
  const lowEffortSignals = [
    content.length < 100,
    /^(This is |Here is |This contains )/i.test(content),
    (content.match(/\[.*?\]/g) || []).length > 10, // Too many placeholders
    content.split('\n').filter(line => line.trim()).length < 3, // Too few lines
    /^[A-Z]+:/.test(content) && content.length < 200 // Just abbreviations
  ];
  
  const signalCount = lowEffortSignals.filter(Boolean).length;
  return signalCount >= 2;
}
