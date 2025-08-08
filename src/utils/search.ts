export function generateSearchableText(content: { memoryName?: string; markdown: string }): string {
  const parts = [];
  
  if (content.memoryName) {
    parts.push(content.memoryName);
  }
  
  // Extract meaningful text from markdown
  const cleanText = content.markdown
    // Remove markdown formatting
    .replace(/^#{1,6}\s+/gm, '') // Headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/^[-*+]\s+/gm, '') // Lists
    .replace(/^\d+\.\s+/gm, '') // Numbered lists
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim();
  
  parts.push(cleanText);
  
  return parts.join(' ');
}