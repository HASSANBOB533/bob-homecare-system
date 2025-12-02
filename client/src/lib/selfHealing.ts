/**
 * Self-Healing System for Automatic Bug Detection and Recovery
 * Monitors runtime errors, implements retry logic, and provides self-healing capabilities
 */

export interface ErrorLog {
  id: string;
  type: 'runtime' | 'api' | 'render' | 'network';
  message: string;
  stack?: string;
  page: string;
  component?: string;
  browser: string;
  userAgent: string;
  timestamp: number;
  recovered: boolean;
  recoveryMethod?: string;
}

export interface PerformanceLog {
  id: string;
  operation: string;
  duration: number;
  page: string;
  timestamp: number;
  slow: boolean;
}

class SelfHealingSystem {
  private errorLogs: ErrorLog[] = [];
  private performanceLogs: PerformanceLog[] = [];
  private debugMode: boolean = false;
  private maxLogs: number = 100;
  private slowThreshold: number = 200; // ms
  
  constructor() {
    this.init();
  }

  private init() {
    // Load debug mode from localStorage
    this.debugMode = localStorage.getItem('debug-mode') === 'true';
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'runtime',
        message: event.message,
        stack: event.error?.stack,
        page: window.location.pathname,
        browser: this.getBrowserInfo(),
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        recovered: false,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'runtime',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        page: window.location.pathname,
        browser: this.getBrowserInfo(),
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        recovered: false,
      });
    });

    // Log system initialization
    if (this.debugMode) {
      console.log('[Self-Healing] System initialized');
    }
  }

  /**
   * Handle and log errors
   */
  private handleError(error: Omit<ErrorLog, 'id'>) {
    const errorLog: ErrorLog = {
      ...error,
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.errorLogs.push(errorLog);
    this.trimLogs();

    if (this.debugMode) {
      console.error('[Self-Healing] Error detected:', errorLog);
    }

    // Attempt recovery
    this.attemptRecovery(errorLog);

    // Notify admin if critical
    if (this.isCriticalError(errorLog)) {
      this.notifyAdmin(errorLog);
    }
  }

  /**
   * Attempt to recover from error
   */
  private attemptRecovery(errorLog: ErrorLog) {
    // Recovery strategies based on error type
    if (errorLog.type === 'api' || errorLog.type === 'network') {
      // API errors are handled by retry logic in apiRetry.ts
      return;
    }

    if (errorLog.type === 'render') {
      // Render errors are handled by ErrorBoundary
      return;
    }

    // For runtime errors, try to recover by reloading the component
    if (errorLog.component) {
      this.reloadComponent(errorLog.component);
      errorLog.recovered = true;
      errorLog.recoveryMethod = 'component-reload';
    }
  }

  /**
   * Reload a specific component
   */
  private reloadComponent(componentName: string) {
    if (this.debugMode) {
      console.log(`[Self-Healing] Attempting to reload component: ${componentName}`);
    }
    
    // Dispatch custom event that components can listen to
    window.dispatchEvent(new CustomEvent('component-reload', {
      detail: { component: componentName },
    }));
  }

  /**
   * Check if error is critical
   */
  private isCriticalError(error: ErrorLog): boolean {
    // Critical errors that should notify admin
    const criticalPatterns = [
      'payment',
      'booking',
      'authentication',
      'database',
      'security',
    ];

    return criticalPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Notify admin of critical error
   */
  private notifyAdmin(error: ErrorLog) {
    // Store in localStorage for admin dashboard
    const adminNotifications = JSON.parse(
      localStorage.getItem('admin-error-notifications') || '[]'
    );
    
    adminNotifications.push({
      ...error,
      notified: false,
    });

    // Keep only last 50 notifications
    if (adminNotifications.length > 50) {
      adminNotifications.splice(0, adminNotifications.length - 50);
    }

    localStorage.setItem(
      'admin-error-notifications',
      JSON.stringify(adminNotifications)
    );
  }

  /**
   * Log slow operations
   */
  logPerformance(operation: string, duration: number) {
    const slow = duration > this.slowThreshold;
    
    const perfLog: PerformanceLog = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      duration,
      page: window.location.pathname,
      timestamp: Date.now(),
      slow,
    };

    this.performanceLogs.push(perfLog);
    this.trimLogs();

    if (slow && this.debugMode) {
      console.warn(`[Self-Healing] Slow operation detected: ${operation} (${duration}ms)`);
    }
  }

  /**
   * Measure and log operation performance
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.logPerformance(operation, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.logPerformance(operation, duration);
      throw error;
    }
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Trim logs to max size
   */
  private trimLogs() {
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogs);
    }
    if (this.performanceLogs.length > this.maxLogs) {
      this.performanceLogs = this.performanceLogs.slice(-this.maxLogs);
    }
  }

  /**
   * Get all error logs
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Get all performance logs
   */
  getPerformanceLogs(): PerformanceLog[] {
    return [...this.performanceLogs];
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const total = this.errorLogs.length;
    const recovered = this.errorLogs.filter(e => e.recovered).length;
    const byType = this.errorLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      recovered,
      recoveryRate: total > 0 ? (recovered / total) * 100 : 0,
      byType,
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const total = this.performanceLogs.length;
    const slow = this.performanceLogs.filter(p => p.slow).length;
    const avgDuration = total > 0
      ? this.performanceLogs.reduce((sum, p) => sum + p.duration, 0) / total
      : 0;

    return {
      total,
      slow,
      slowRate: total > 0 ? (slow / total) * 100 : 0,
      avgDuration,
    };
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.errorLogs = [];
    this.performanceLogs = [];
    if (this.debugMode) {
      console.log('[Self-Healing] Logs cleared');
    }
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    localStorage.setItem('debug-mode', enabled.toString());
    console.log(`[Self-Healing] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * Export logs for analysis
   */
  exportLogs() {
    return {
      errors: this.errorLogs,
      performance: this.performanceLogs,
      stats: {
        errors: this.getErrorStats(),
        performance: this.getPerformanceStats(),
      },
      exportedAt: new Date().toISOString(),
    };
  }
}

// Create singleton instance
export const selfHealing = new SelfHealingSystem();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).selfHealing = selfHealing;
}
