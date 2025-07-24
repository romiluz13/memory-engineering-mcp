import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Logger that writes to file instead of console (console.log breaks MCP protocol)
class FileLogger {
  private logFile: string;

  constructor() {
    const logDir = join(process.cwd(), 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    this.logFile = join(logDir, `memory-bank-${new Date().toISOString().split('T')[0]}.log`);
  }

  private log(level: string, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message} ${
      args.length > 0 ? JSON.stringify(args) : ''
    }\n`;
    
    try {
      appendFileSync(this.logFile, logEntry);
    } catch (error) {
      // Silently fail if we can't write logs
    }
  }

  info(message: string, ...args: unknown[]): void {
    this.log('INFO', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('ERROR', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('WARN', message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, ...args);
    }
  }
}

export const logger = new FileLogger();