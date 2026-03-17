interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  maxTokens: number; // max burst
  refillRate: number; // tokens per second
}

const buckets = new Map<string, TokenBucket>();

const LIMITS: Record<string, RateLimitConfig> = {
  // Per-minute: 10 requests
  minute: { maxTokens: 10, refillRate: 10 / 60 },
  // Per-hour: 50 requests
  hour: { maxTokens: 50, refillRate: 50 / 3600 },
};

function getBucket(key: string, config: RateLimitConfig): TokenBucket {
  const existing = buckets.get(key);
  if (existing) return existing;

  const bucket: TokenBucket = {
    tokens: config.maxTokens,
    lastRefill: Date.now(),
  };
  buckets.set(key, bucket);
  return bucket;
}

function refillBucket(bucket: TokenBucket, config: RateLimitConfig): void {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(
    config.maxTokens,
    bucket.tokens + elapsed * config.refillRate
  );
  bucket.lastRefill = now;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds
  remaining: number;
  limit: string;
}

/**
 * In-memory token bucket rate limiter.
 * Checks both per-minute and per-hour limits.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  for (const [limitName, config] of Object.entries(LIMITS)) {
    const key = `${ip}:${limitName}`;
    const bucket = getBucket(key, config);
    refillBucket(bucket, config);

    if (bucket.tokens < 1) {
      const retryAfter = Math.ceil((1 - bucket.tokens) / config.refillRate);
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
        limit: limitName,
      };
    }
  }

  // Consume one token from each bucket
  for (const [limitName, config] of Object.entries(LIMITS)) {
    const key = `${ip}:${limitName}`;
    const bucket = getBucket(key, config);
    bucket.tokens -= 1;
  }

  // Return remaining from the most restrictive bucket
  const minuteKey = `${ip}:minute`;
  const minuteBucket = buckets.get(minuteKey);

  return {
    allowed: true,
    remaining: Math.floor(minuteBucket?.tokens ?? 0),
    limit: "minute",
  };
}

/**
 * Clean up old buckets periodically to prevent memory leaks.
 */
export function cleanupBuckets(): void {
  const now = Date.now();
  const staleThreshold = 2 * 60 * 60 * 1000; // 2 hours

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > staleThreshold) {
      buckets.delete(key);
    }
  }
}

// Cleanup every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupBuckets, 30 * 60 * 1000);
}
