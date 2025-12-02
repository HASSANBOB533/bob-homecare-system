/**
 * Shared validation utilities for input sanitization and validation
 * Used on both client and server side
 */

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Phone number validation (international format)
export function isValidPhone(phone: string): boolean {
  // Allow +, digits, spaces, hyphens, parentheses
  const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
  return phoneRegex.test(phone);
}

// Name validation (no special characters except spaces, hyphens, apostrophes)
export function isValidName(name: string): boolean {
  const nameRegex = /^[a-zA-Z\u0600-\u06FF\s\-']{2,100}$/;
  return nameRegex.test(name);
}

// Address validation
export function isValidAddress(address: string): boolean {
  return address.length >= 10 && address.length <= 500;
}

// Referral code validation
export function isValidReferralCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9]{6,12}$/;
  return codeRegex.test(code);
}

// Sanitize string input (remove dangerous characters)
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

// Sanitize HTML (basic XSS prevention)
export function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

// Validate date string
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Validate time string (HH:MM format)
export function isValidTime(timeString: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

// Validate booking input
export interface BookingInput {
  serviceId: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  referralCode?: string;
}

export function validateBookingInput(input: BookingInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.serviceId || input.serviceId < 1) {
    errors.push('Invalid service selected');
  }

  if (!isValidDate(input.date)) {
    errors.push('Invalid date format');
  }

  if (!isValidTime(input.time)) {
    errors.push('Invalid time format');
  }

  if (!isValidName(input.name)) {
    errors.push('Invalid name format (2-100 characters, letters only)');
  }

  if (!isValidPhone(input.phone)) {
    errors.push('Invalid phone number format');
  }

  if (!isValidEmail(input.email)) {
    errors.push('Invalid email format');
  }

  if (!isValidAddress(input.address)) {
    errors.push('Invalid address (10-500 characters required)');
  }

  if (input.notes && input.notes.length > 1000) {
    errors.push('Notes too long (max 1000 characters)');
  }

  if (input.referralCode && !isValidReferralCode(input.referralCode)) {
    errors.push('Invalid referral code format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Rate limiting helper (for client-side)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// SQL injection prevention patterns
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /('|('')|;|--|\/\*|\*\/)/gi,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Command injection prevention
export function containsCommandInjection(input: string): boolean {
  const cmdPatterns = [
    /[;&|`$(){}[\]<>]/g,
    /(bash|sh|cmd|powershell|eval|exec)/gi,
  ];
  
  return cmdPatterns.some(pattern => pattern.test(input));
}

// Path traversal prevention
export function containsPathTraversal(input: string): boolean {
  const pathPatterns = [
    /\.\./g,
    /[\/\\]etc[\/\\]/gi,
    /[\/\\]windows[\/\\]/gi,
    /[\/\\]system32[\/\\]/gi,
  ];
  
  return pathPatterns.some(pattern => pattern.test(input));
}

// Comprehensive security check
export function isSecureInput(input: string): { secure: boolean; reason?: string } {
  if (containsSQLInjection(input)) {
    return { secure: false, reason: 'Potential SQL injection detected' };
  }
  
  if (containsCommandInjection(input)) {
    return { secure: false, reason: 'Potential command injection detected' };
  }
  
  if (containsPathTraversal(input)) {
    return { secure: false, reason: 'Potential path traversal detected' };
  }
  
  return { secure: true };
}
