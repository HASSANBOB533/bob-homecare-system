/**
 * Performance monitoring utilities
 * Tracks page load times, API calls, and component render times
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'page-load' | 'api-call' | 'component-render' | 'user-interaction';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;
  private timers: Map<string, number> = new Map();

  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  endTimer(
    name: string,
    type: PerformanceMetric['type'],
    metadata?: Record<string, any>
  ): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) {
      return null;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      type,
      metadata,
    });

    if (duration > 200) {
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getSlowOperations(): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > 200);
  }

  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

export const perfMonitor = new PerformanceMonitor();
