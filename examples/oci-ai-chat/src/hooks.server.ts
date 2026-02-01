import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a distributed store
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60_000, // 1 minute window
  maxRequests: {
    chat: 20, // Chat endpoint: 20 requests/minute
    api: 60, // Other API endpoints: 60 requests/minute
  },
};

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header or falls back to a default for local dev
 */
function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // In development without proxy, use a default
  return 'local-dev';
}

/**
 * Check and update rate limit for a client
 * Returns remaining requests or -1 if limit exceeded
 */
function checkRateLimit(clientId: string, endpoint: 'chat' | 'api'): number {
  const now = Date.now();
  const key = `${clientId}:${endpoint}`;
  const maxRequests = RATE_LIMIT.maxRequests[endpoint];

  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    const keysToDelete: string[] = [];
    rateLimitStore.forEach((v, k) => {
      if (v.resetAt < now) {
        keysToDelete.push(k);
      }
    });
    keysToDelete.forEach((k) => rateLimitStore.delete(k));
  }

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    });
    return maxRequests - 1;
  }

  if (entry.count >= maxRequests) {
    return -1; // Rate limited
  }

  entry.count++;
  return maxRequests - entry.count;
}

/**
 * Content Security Policy configuration
 * Restricts resource loading to prevent XSS and data injection attacks
 */
function getCSPHeader(): string {
  const directives = [
    // Only allow resources from same origin by default
    "default-src 'self'",

    // Scripts: self + inline (needed for Svelte) + unsafe-eval only in dev
    dev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",

    // Styles: self + inline (needed for Tailwind/Svelte)
    "style-src 'self' 'unsafe-inline'",

    // Images: self + data URIs (for embedded images)
    "img-src 'self' data: blob:",

    // Fonts: self
    "font-src 'self'",

    // Connect: self (for API calls)
    "connect-src 'self'",

    // Frames: none (no iframes needed)
    "frame-src 'none'",

    // Objects: none (no plugins)
    "object-src 'none'",

    // Base URI: self
    "base-uri 'self'",

    // Form actions: self
    "form-action 'self'",

    // Frame ancestors: none (prevent clickjacking)
    "frame-ancestors 'none'",

    // Upgrade insecure requests in production
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ];

  return directives.join('; ');
}

/**
 * Security headers applied to all responses
 */
function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Content Security Policy
  headers.set('Content-Security-Policy', getCSPHeader());

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  headers.set('X-Frame-Options', 'DENY');

  // XSS filter (legacy browsers)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (restrict browser features)
  headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  const { url, request } = event;

  // Apply rate limiting to API routes
  if (url.pathname.startsWith('/api/')) {
    const clientId = getClientId(request);
    const endpoint = url.pathname.startsWith('/api/chat') ? 'chat' : 'api';
    const remaining = checkRateLimit(clientId, endpoint);

    if (remaining < 0) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again later.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }

    // Process request and add rate limit headers
    const response = await resolve(event);
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Remaining', String(remaining));
    headers.set('X-RateLimit-Limit', String(RATE_LIMIT.maxRequests[endpoint]));

    return addSecurityHeaders(
      new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    );
  }

  // Non-API routes: just add security headers
  const response = await resolve(event);
  return addSecurityHeaders(response);
};
