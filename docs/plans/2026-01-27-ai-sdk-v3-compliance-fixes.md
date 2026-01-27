# AI SDK v3 Finish Reason Compliance Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix finish reason type compliance to use proper `{ unified, raw }` object structure throughout codebase and tests.

**Architecture:** The `mapFinishReason` function was already updated to return `LanguageModelV3FinishReason` objects, but type casts in `oci-language-model.ts` need removal and tests need updating to verify the new structure. This is a cleanup/alignment task.

**Tech Stack:** TypeScript, Jest, Vercel AI SDK v3 (`@ai-sdk/provider`)

---

## Current State

The `mapFinishReason` function in `sse-parser.ts` correctly returns:

```typescript
{ unified: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other', raw: string }
```

But there are two issues:

1. **Type casts remain** in `oci-language-model.ts:100` and `oci-language-model.ts:172`
2. **Tests still expect strings** like `'stop'` instead of `{ unified: 'stop', raw: 'STOP' }`

## Files Overview

**Need Modification:**

- `src/models/oci-language-model.ts` - Remove type casts
- `src/streaming/__tests__/sse-parser.test.ts` - Update assertions
- `src/models/__tests__/oci-language-model.test.ts` - Update assertions
- `src/models/__tests__/oci-language-model.stream.test.ts` - Update assertions

**Reference (already correct):**

- `src/streaming/sse-parser.ts` - `mapFinishReason` returns proper structure
- `src/streaming/types.ts` - `FinishPart` uses `LanguageModelV3FinishReason`

---

### Task 1: Update SSE Parser Unit Tests

**Files:**

- Modify: `src/streaming/__tests__/sse-parser.test.ts:7-25`

**Step 1: Write the updated test for STOP mapping**

Replace the test at line 7-9:

```typescript
it('should map STOP to stop', () => {
  const result = mapFinishReason('STOP');
  expect(result).toEqual({ unified: 'stop', raw: 'STOP' });
});
```

**Step 2: Write the updated test for LENGTH mapping**

Replace the test at line 11-13:

```typescript
it('should map LENGTH to length', () => {
  const result = mapFinishReason('LENGTH');
  expect(result).toEqual({ unified: 'length', raw: 'LENGTH' });
});
```

**Step 3: Write the updated test for CONTENT_FILTER mapping**

Replace the test at line 15-17:

```typescript
it('should map CONTENT_FILTER to content-filter', () => {
  const result = mapFinishReason('CONTENT_FILTER');
  expect(result).toEqual({ unified: 'content-filter', raw: 'CONTENT_FILTER' });
});
```

**Step 4: Write the updated test for unknown mapping**

Replace the test at line 19-21:

```typescript
it('should map unknown to other', () => {
  const result = mapFinishReason('UNKNOWN');
  expect(result).toEqual({ unified: 'other', raw: 'UNKNOWN' });
});
```

**Step 5: Write the updated test for empty string mapping**

Replace the test at line 23-25:

```typescript
it('should map empty string to other', () => {
  const result = mapFinishReason('');
  expect(result).toEqual({ unified: 'other', raw: '' });
});
```

**Step 6: Run tests to verify mapFinishReason tests pass**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern=sse-parser.test.ts --testNamePattern="mapFinishReason" -v`

Expected: 5 tests PASS

**Step 7: Commit**

```bash
git add packages/oci-genai-provider/src/streaming/__tests__/sse-parser.test.ts
git commit -m "test: update mapFinishReason tests for V3 object structure

Update assertions from string comparison to object comparison:
- 'stop' -> { unified: 'stop', raw: 'STOP' }
- 'length' -> { unified: 'length', raw: 'LENGTH' }
- etc.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Update SSE Parser Stream Tests

**Files:**

- Modify: `src/streaming/__tests__/sse-parser.test.ts:58-66` and `src/streaming/__tests__/sse-parser.test.ts:175-180`

**Step 1: Update the SSE data format finish part test**

Replace lines 58-66:

```typescript
it('should yield finish part with usage', () => {
  const part = {
    type: 'finish' as const,
    finishReason: { unified: 'stop' as const, raw: 'STOP' },
    usage: { promptTokens: 1, completionTokens: 1 },
  };
  expect(part.type).toBe('finish');
  expect(part.finishReason).toEqual({ unified: 'stop', raw: 'STOP' });
});
```

**Step 2: Update the parseSSEStream finish event test**

Replace lines 175-180:

```typescript
const finishPart = parts.find((p) => p.type === 'finish');
expect(finishPart).toBeDefined();
if (finishPart?.type === 'finish') {
  expect(finishPart.finishReason).toEqual({ unified: 'stop', raw: 'STOP' });
  expect(finishPart.usage.promptTokens).toBe(10);
}
```

**Step 3: Run tests to verify all SSE parser tests pass**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern=sse-parser.test.ts -v`

Expected: All tests PASS

**Step 4: Commit**

```bash
git add packages/oci-genai-provider/src/streaming/__tests__/sse-parser.test.ts
git commit -m "test: update SSE parser stream tests for V3 finish reason

Update finish event assertions to use object structure:
- finishReason: { unified: 'stop', raw: 'STOP' }

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Remove Type Cast in doGenerate

**Files:**

- Modify: `src/models/oci-language-model.ts:98-100`

**Step 1: Update the finishReason assignment**

Replace lines 98-100:

```typescript
const finishReason = mapFinishReason(choice?.finishReason ?? 'STOP');
```

This removes `as unknown as LanguageModelV3FinishReason` since `mapFinishReason` already returns the correct type.

**Step 2: Run type check to verify**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm --filter @acedergren/oci-genai-provider type-check`

Expected: No errors

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/models/oci-language-model.ts
git commit -m "refactor: remove type cast in doGenerate finish reason

mapFinishReason now returns LanguageModelV3FinishReason directly,
eliminating the need for unsafe type assertion.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Update doGenerate Test for Finish Reason

**Files:**

- Modify: `src/models/__tests__/oci-language-model.test.ts:205`

**Step 1: Update the finish reason assertion**

Replace line 205:

```typescript
expect(result.finishReason).toEqual({ unified: 'stop', raw: 'STOP' });
```

**Step 2: Run the specific test**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern=oci-language-model.test.ts --testNamePattern="should return content from response" -v`

Expected: PASS

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/models/__tests__/oci-language-model.test.ts
git commit -m "test: update doGenerate test for V3 finish reason structure

Update assertion from string to object:
- .toBe('stop') -> .toEqual({ unified: 'stop', raw: 'STOP' })

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Remove Type Cast in doStream

**Files:**

- Modify: `src/models/oci-language-model.ts:170-172`

**Step 1: Update the stream finish enqueue**

Replace lines 170-172:

```typescript
controller.enqueue({
  type: 'finish',
  finishReason: part.finishReason,
  usage: {
```

This removes `as unknown as LanguageModelV3FinishReason` since `part.finishReason` already has the correct type from the SSE parser.

**Step 2: Run type check to verify**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm --filter @acedergren/oci-genai-provider type-check`

Expected: No errors

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/models/oci-language-model.ts
git commit -m "refactor: remove type cast in doStream finish reason

part.finishReason from SSE parser already has correct
LanguageModelV3FinishReason type.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Update doStream Test for Finish Reason

**Files:**

- Modify: `src/models/__tests__/oci-language-model.stream.test.ts:136-141`

**Step 1: Update the type guard and assertion**

Replace lines 136-141:

```typescript
// Should have finish part
const finishPart = parts.find(
  (p): p is { type: 'finish'; finishReason: { unified: string; raw: string } } =>
    (p as { type: string }).type === 'finish'
);
expect(finishPart).toBeDefined();
expect(finishPart?.finishReason).toEqual({ unified: 'stop', raw: 'STOP' });
```

**Step 2: Run the specific test**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern=oci-language-model.stream.test.ts --testNamePattern="should include finish part with usage" -v`

Expected: PASS

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/models/__tests__/oci-language-model.stream.test.ts
git commit -m "test: update doStream test for V3 finish reason structure

Update type guard and assertion for object structure:
- finishReason: string -> finishReason: { unified, raw }
- .toBe('stop') -> .toEqual({ unified: 'stop', raw: 'STOP' })

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Final Verification

**Files:**

- None (verification only)

**Step 1: Run full test suite**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm test`

Expected: All 128+ tests PASS

**Step 2: Run type check**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm --filter @acedergren/oci-genai-provider type-check`

Expected: No errors

**Step 3: Run lint**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm --filter @acedergren/oci-genai-provider lint`

Expected: No errors

**Step 4: Run build**

Run: `cd /Users/acedergr/Projects/oci-genai-provider && pnpm build`

Expected: Build succeeds

**Step 5: Commit final state**

```bash
git add .
git commit -m "chore: verify AI SDK v3 compliance fixes complete

All tests passing, type-safe, production ready:
- mapFinishReason returns proper { unified, raw } structure
- No type casts in oci-language-model.ts
- All tests verify object structure

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description                       | Files Modified                    |
| ---- | --------------------------------- | --------------------------------- |
| 1    | Update mapFinishReason unit tests | sse-parser.test.ts                |
| 2    | Update SSE stream tests           | sse-parser.test.ts                |
| 3    | Remove cast in doGenerate         | oci-language-model.ts             |
| 4    | Update doGenerate test            | oci-language-model.test.ts        |
| 5    | Remove cast in doStream           | oci-language-model.ts             |
| 6    | Update doStream test              | oci-language-model.stream.test.ts |
| 7    | Final verification                | None                              |

**Total Commits:** 7
**Estimated Time:** 15-20 minutes
**Risk Level:** Low (cleanup task, no new functionality)

---

## Success Criteria

- [ ] Zero `as unknown as LanguageModelV3FinishReason` casts in codebase
- [ ] All finish reason assertions use `.toEqual({ unified: '...', raw: '...' })`
- [ ] All 128+ tests passing
- [ ] TypeScript type check clean
- [ ] ESLint clean
- [ ] Build succeeds
