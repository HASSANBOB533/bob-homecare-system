/**
 * Rate limiting middleware for API protection
 * Prevents abuse and brute force attacks
 */

import { TRPCError } from '@trpc/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export function rateLimit(config: RateLimitConfig) {
  return function (identifier: string): void {
    const now = Date.now();
    const key = identifier;

    if (!store[key] || store[key].resetTime < now) {
      // Initialize or reset
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return;
    }

    store[key].count++;

    if (store[key].count > config.maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: config.message || `Too many requests. Please try again in ${retryAfter} seconds.`,
      });
    }
  };
}

// Predefined rate limiters
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

export const bookingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many booking requests. Please try again later.',
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: 'Too many requests. Please slow down.',
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Rate limit exceeded. Please try again later.',
});

// Get identifier from context (IP or user ID)
export function getRateLimitIdentifier(ctx: { user?: { id: string }; req?: { ip?: string; headers?: { 'x-forwarded-for'?: string } } }): string {
  // Use user ID if authenticated
  if (ctx.user?.id) {
    return `user:${ctx.user.id}`;
  }

  // Otherwise use IP address
  const ip = ctx.req?.headers?.['x-forwarded-for'] || ctx.req?.ip || 'unknown';
  return `ip:${ip}`;
}
