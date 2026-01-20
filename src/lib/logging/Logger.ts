/**
 * Structured Logger for IP-NEXUS
 * Production-ready logging with log levels, context, and redaction
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Fields to redact from logs
const REDACT_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'apiKey',
  'api_key',
  'secret',
  'credential',
  'creditCard',
  'credit_card',
  'ssn',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
];

const REDACT_PLACEHOLDER = '[REDACTED]';

// Log level priorities
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// Get current log level from environment
function getLogLevel(): LogLevel {
  const envLevel = (typeof window !== 'undefined' 
    ? localStorage.getItem('LOG_LEVEL') 
    : process.env.LOG_LEVEL) as LogLevel | null;
  return envLevel && LOG_LEVELS[envLevel] !== undefined ? envLevel : 'info';
}

// Redact sensitive fields from objects
function redactSensitive(obj: unknown, visited = new WeakSet()): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Prevent circular reference issues
  if (visited.has(obj as object)) {
    return '[Circular]';
  }
  visited.add(obj as object);

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitive(item, visited));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (REDACT_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      result[key] = REDACT_PLACEHOLDER;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitive(value, visited);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Format log entry for output
function formatLogEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'development') {
    // Pretty format for development
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[90m', // Gray
      info: '\x1b[36m',  // Cyan
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];
    
    let output = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`;
    
    if (entry.duration !== undefined) {
      output += ` (${entry.duration}ms)`;
    }
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return output;
  }
  
  // JSON format for production (for log aggregation systems)
  return JSON.stringify(entry);
}

// Logger class
class Logger {
  private context: LogContext = {};
  private minLevel: LogLevel;

  constructor(context?: LogContext) {
    this.context = context || {};
    this.minLevel = getLogLevel();
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number,
    metadata?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    const mergedContext = { ...this.context, ...context };
    if (Object.keys(mergedContext).length > 0) {
      entry.context = redactSensitive(mergedContext) as LogContext;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (duration !== undefined) {
      entry.duration = duration;
    }

    if (metadata && Object.keys(metadata).length > 0) {
      entry.metadata = redactSensitive(metadata) as Record<string, unknown>;
    }

    return entry;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createEntry(level, message, context, error, duration, metadata);
    const formatted = formatLogEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
      case 'fatal':
        console.error(formatted);
        break;
    }

    // For fatal errors, you might want to send to error tracking service
    if (level === 'fatal' && typeof window !== 'undefined') {
      // Could integrate with Sentry, etc.
      // Sentry.captureException(error);
    }
  }

  // Public logging methods
  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.log('debug', message, context, undefined, undefined, metadata);
  }

  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.log('info', message, context, undefined, undefined, metadata);
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.log('warn', message, context, undefined, undefined, metadata);
  }

  error(message: string, error?: Error | unknown, context?: LogContext, metadata?: Record<string, unknown>): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log('error', message, context, err, undefined, metadata);
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext, metadata?: Record<string, unknown>): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log('fatal', message, context, err, undefined, metadata);
  }

  // Timing utilities
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      this.info(`${label} completed`, { action: label }, { duration });
    };
  }

  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      this.info(`${label} completed`, { action: label }, { duration });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`${label} failed`, error, { action: label }, { duration });
      throw error;
    }
  }

  // Create child logger with additional context
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }

  // Set global context
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  // Clear context
  clearContext(): void {
    this.context = {};
  }
}

// Default logger instance
export const logger = new Logger();

// Factory function for component-specific loggers
export function createLogger(component: string, context?: LogContext): Logger {
  return new Logger({ component, ...context });
}

// Request logger for API calls
export function createRequestLogger(requestId: string): Logger {
  return new Logger({ requestId });
}

// Export Logger class for advanced usage
export { Logger };
export type { LogContext, LogEntry };
