/**
 * API Retry Logic with Exponential Backoff
 * Automatically retries failed API calls with intelligent backoff strategy
 */

import { selfHealing } from './selfHealing';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Log successful retry
      if (attempt > 0 && selfHealing.isDebugMode()) {
        console.log(`[API Retry] Success after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error, opts.retryableStatuses);
      
      // If not retryable or max retries reached, throw immediately
      if (!isRetryable || attempt === opts.maxRetries) {
        if (selfHealing.isDebugMode()) {
          console.error(`[API Retry] Failed after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}:`, error);
        }
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const finalDelay = delay + jitter;
      
      if (selfHealing.isDebugMode()) {
        console.warn(`[API Retry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed, retrying in ${Math.round(finalDelay)}ms...`);
      }
      
      // Call retry callback
      opts.onRetry(attempt + 1, error);
      
      // Wait before retrying
      await sleep(finalDelay);
    }
  }
  
  throw lastError;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableStatuses: number[]): boolean {
  // Network errors are retryable
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return true;
  }
  
  // Timeout errors are retryable
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return true;
  }
  
  // Check HTTP status codes
  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }
  
  // tRPC errors
  if (error.data?.httpStatus && retryableStatuses.includes(error.data.httpStatus)) {
    return true;
  }
  
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap fetch with retry logic
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(input, init);
    
    // Throw on non-OK responses to trigger retry
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response;
  }, options);
}

/**
 * Create a retry wrapper for tRPC queries
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  return (async (...args: any[]) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}

/**
 * Circuit breaker to prevent cascading failures
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        // Try half-open state
        this.state = 'half-open';
        if (selfHealing.isDebugMode()) {
          console.log('[Circuit Breaker] Entering half-open state');
        }
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset circuit
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
        if (selfHealing.isDebugMode()) {
          console.log('[Circuit Breaker] Circuit closed');
        }
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      // Open circuit if threshold reached
      if (this.failureCount >= this.threshold) {
        this.state = 'open';
        if (selfHealing.isDebugMode()) {
          console.error('[Circuit Breaker] Circuit opened after', this.failureCount, 'failures');
        }
      }
      
      throw error;
    }
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
  
  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

// Export global circuit breaker for API calls
export const apiCircuitBreaker = new CircuitBreaker();
