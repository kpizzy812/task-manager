/**
 * Simple in-memory rate limiter for authentication endpoints
 * Note: For production with multiple instances, use Redis-based solution
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

/**
 * Check rate limit for a given key (e.g., IP or email)
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No existing entry or expired
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }

  // Increment count
  entry.count++;

  if (entry.count > config.maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    success: true,
    remaining: config.maxAttempts - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Reset rate limit for a key (e.g., after successful login)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Preset configurations
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

export const REGISTER_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// AI rate limits
export const AI_GENERATE_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 20,
  windowMs: 60 * 1000, // 20 requests per minute
};

export const AI_DIGEST_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 30 * 60 * 1000, // 5 requests per 30 minutes
};
