# Migration Guide

## v2.0.0 - Breaking Changes

### Error Constructor Pattern (v2.0.0+)

**What changed:** The `OCIGenAIError` class and subclasses now use an options object pattern instead of positional parameters.

**Before (v1.x):**
```typescript
// Old pattern with positional parameters
new OCIGenAIError('Request failed', 429, true);
new RateLimitError('Rate limited', 5000);
new NetworkError('Connection timeout');
```

**After (v2.0.0+):**
```typescript
// New pattern with options object
new OCIGenAIError('Request failed', { 
  statusCode: 429, 
  retryable: true 
});
new RateLimitError('Rate limited', { 
  retryAfterMs: 5000 
});
new NetworkError('Connection timeout', { 
  retryable: true 
});
```

**Why?** The options object pattern provides:
- Better readability with named parameters
- Easier to extend with new error properties
- Type-safe parameter handling
- Cleaner stack traces

**How to migrate:**
1. Find all error constructor calls in your code
2. Replace positional parameters with an options object
3. Map parameters as follows:
   - `statusCode` → `{ statusCode: ... }`
   - `retryable` → `{ retryable: ... }`
   - `cause` (Error) → `{ cause: ... }`
4. For subclasses like `RateLimitError`, use appropriate options:
   - `RateLimitError` accepts `retryAfterMs` option

**Search and update:**
```bash
# Find old pattern
grep -r "new OCIGenAIError.*,.*,.*)\" src/
grep -r "new RateLimitError.*,.*)" src/
grep -r "new NetworkError.*,.*)" src/
```

### Error Properties

All error subclasses now properly type their properties:

```typescript
interface OCIErrorOptions {
  cause?: Error;
  retryable?: boolean;
  statusCode?: number;
}

class OCIGenAIError extends Error {
  readonly cause?: Error;
  readonly retryable: boolean;
  readonly statusCode?: number;
}

class RateLimitError extends OCIGenAIError {
  readonly retryAfterMs?: number;
}
```

**Accessing error details:**
```typescript
try {
  // ... OCI call
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Wait ${error.retryAfterMs}ms before retry`);
  }
  if (error instanceof OCIGenAIError) {
    console.log(`Error: ${error.message}`);
    console.log(`Retryable: ${error.retryable}`);
    console.log(`Status: ${error.statusCode}`);
    if (error.cause) {
      console.log(`Caused by: ${error.cause.message}`);
    }
  }
}
```

## No Other Breaking Changes

All other APIs remain unchanged and backward compatible.
