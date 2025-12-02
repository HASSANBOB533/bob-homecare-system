/**
 * Comprehensive Error Logging System
 * Tracks all errors, button clicks, and critical actions
 */

export interface ErrorLog {
  timestamp: string;
  type: 'error' | 'warning' | 'info' | 'click' | 'navigation';
  message: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
  stack?: string;
  userAction?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 1000;
  private debugMode = false;

  constructor() {
    this.initializeGlobalErrorHandlers();
    // Check for debug flag in localStorage or URL
    this.debugMode = localStorage.getItem('DEBUG_MODE') === 'true' || 
                     new URLSearchParams(window.location.search).has('debug');
    
    if (this.debugMode) {
      console.log('[ErrorLogger] Debug mode enabled');
    }
  }

  /**
   * Initialize global error handlers
   */
  private initializeGlobalErrorHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'error',
        message: event.message,
        source: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Handle console errors (override console.error)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.logError({
        type: 'error',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        url: window.location.href,
      });
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Log an error
   */
  logError(error: Partial<ErrorLog>) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type: error.type || 'error',
      message: error.message || 'Unknown error',
      source: error.source,
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
      stack: error.stack,
      userAction: error.userAction,
      url: error.url || window.location.href,
      userAgent: error.userAgent || navigator.userAgent,
      userId: error.userId,
      additionalData: error.additionalData,
    };

    this.logs.push(log);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in debug mode
    if (this.debugMode) {
      console.group(`[${log.type.toUpperCase()}] ${log.timestamp}`);
      console.log('Message:', log.message);
      if (log.source) console.log('Source:', `${log.source}:${log.lineNumber}:${log.columnNumber}`);
      if (log.userAction) console.log('User Action:', log.userAction);
      if (log.stack) console.log('Stack:', log.stack);
      if (log.additionalData) console.log('Additional Data:', log.additionalData);
      console.groupEnd();
    }

    // Store in localStorage for persistence
    try {
      const recentLogs = this.logs.slice(-100); // Keep last 100 logs
      localStorage.setItem('error_logs', JSON.stringify(recentLogs));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Log a button click
   */
  logClick(buttonId: string, buttonText: string, additionalData?: Record<string, any>) {
    this.logError({
      type: 'click',
      message: `Button clicked: ${buttonText}`,
      userAction: `click:${buttonId}`,
      additionalData: {
        buttonId,
        buttonText,
        ...additionalData,
      },
    });
  }

  /**
   * Log a navigation event
   */
  logNavigation(from: string, to: string, method: string = 'unknown') {
    this.logError({
      type: 'navigation',
      message: `Navigation: ${from} → ${to}`,
      userAction: `navigate:${method}`,
      additionalData: {
        from,
        to,
        method,
      },
    });
  }

  /**
   * Log a warning
   */
  logWarning(message: string, additionalData?: Record<string, any>) {
    this.logError({
      type: 'warning',
      message,
      additionalData,
    });
  }

  /**
   * Log an info message
   */
  logInfo(message: string, additionalData?: Record<string, any>) {
    this.logError({
      type: 'info',
      message,
      additionalData,
    });
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: ErrorLog['type']): ErrorLog[] {
    return this.logs.filter(log => log.type === type);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.logs
      .filter(log => log.type === 'error')
      .slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('error_logs');
    if (this.debugMode) {
      console.log('[ErrorLogger] Logs cleared');
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Enable debug mode
   */
  enableDebugMode() {
    this.debugMode = true;
    localStorage.setItem('DEBUG_MODE', 'true');
    console.log('[ErrorLogger] Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode() {
    this.debugMode = false;
    localStorage.removeItem('DEBUG_MODE');
    console.log('[ErrorLogger] Debug mode disabled');
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).errorLogger = errorLogger;
}

/**
 * Log React component errors
 * Use this in componentDidCatch or error boundaries
 */
export function logComponentError(componentName: string, error: Error, errorInfo?: any) {
  errorLogger.logError({
    type: 'error',
    message: `React Error in ${componentName}: ${error.message}`,
    stack: error.stack,
    additionalData: {
      componentName,
      errorInfo,
    },
  });
}

/**
 * Utility to wrap async functions with error logging
 */
export function withAsyncErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  actionName: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorLogger.logError({
        type: 'error',
        message: `Async error in ${actionName}: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
        userAction: actionName,
        additionalData: {
          args,
        },
      });
      throw error;
    }
  }) as T;
}
