# Demo Refactoring Analysis - Updated Dependencies

## Executive Summary

All three demo applications need refactoring to align with:

1. **Latest AI SDK v6.0.57** (already installed)
2. **New ProviderV3 API** (from Plan 1)
3. **Updated @ai-sdk packages** (React 3.0.59, Svelte 4.0.57)

## Current State

### Dependencies (✅ Already Updated)

All demos are using the latest versions:

| Package                          | Version      | Status                   |
| -------------------------------- | ------------ | ------------------------ |
| `ai`                             | ^6.0.57      | ✅ Latest                |
| `@ai-sdk/react`                  | ^3.0.59      | ✅ Latest (Next.js)      |
| `@ai-sdk/svelte`                 | ^4.0.57      | ✅ Latest (SvelteKit)    |
| `@acedergren/oci-genai-provider` | workspace:\* | ⚠️ Needs Plan 1 refactor |

### API Usage (❌ Needs Refactoring)

All demos use the **old v1.x pattern** with type casting:

**SvelteKit Demo** (`examples/chatbot-demo`):

```typescript
// ❌ OLD (current)
const model = oci(model, {
  compartmentId,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});
```

**Next.js Demo** (`examples/nextjs-chatbot`):

```typescript
// ❌ OLD (current)
const languageModel = oci(model, {
  compartmentId,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
}) as unknown as LanguageModelV1; // ← Type casting needed
```

**CLI Tool** (`examples/cli-tool`):

```typescript
// ❌ OLD (current)
const model = oci(MODEL_ID, {
  compartmentId: COMPARTMENT_ID,
  region: REGION,
}) as unknown as LanguageModel; // ← Type casting needed
```

## Required Refactoring

### Why Refactor?

1. **Type Safety** - No more `as unknown as LanguageModel` hacks
2. **ProviderV3 Compliance** - Proper interface implementation
3. **Future Compatibility** - Ready for embeddings, speech, etc.
4. **Better Developer Experience** - Clear API, better autocomplete

### New API Pattern (After Plan 1)

**Option 1: Using Default Instance** (Recommended for simple cases)

```typescript
import { oci } from '@acedergren/oci-genai-provider';

// ✅ NEW - Explicit method (clearest)
const model = oci.languageModel('cohere.command-r-plus', {
  compartmentId,
  region: 'eu-frankfurt-1',
});

// OR still works as callable:
const model = oci('cohere.command-r-plus', {
  compartmentId,
  region: 'eu-frankfurt-1',
});
```

**Option 2: Using Factory** (Recommended for shared config)

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

// Create provider with shared config
const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID!,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});

// Use for multiple models
const chatModel = provider.languageModel('cohere.command-r-plus');
const codeModel = provider.languageModel('meta.llama-3.3-70b');
```

## Demo-by-Demo Refactoring Plan

### 1. SvelteKit Chatbot Demo

**Files to Update:**

- `examples/chatbot-demo/src/routes/api/chat/+server.ts`

**Current Code:**

```typescript
const result = streamText({
  model: oci(model, {
    compartmentId,
    region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
  }),
  messages,
});
```

**Refactored Code (Option A - Provider Factory):**

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const compartmentId = process.env.OCI_COMPARTMENT_ID;
    if (!compartmentId) {
      return new Response(
        JSON.stringify({ error: 'OCI_COMPARTMENT_ID environment variable is required' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, model } = await request.json();

    // Create provider with shared config
    const provider = createOCI({
      compartmentId,
      region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
    });

    const result = streamText({
      model: provider.languageModel(model),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

**Benefits:**

- ✅ No type casting needed
- ✅ Clearer separation of config vs model selection
- ✅ Easy to add embeddings/reranking later
- ✅ Better TypeScript inference

---

### 2. Next.js Chatbot Demo

**Files to Update:**

- `examples/nextjs-chatbot/src/app/api/chat/route.ts`

**Current Code:**

```typescript
// Type assertion needed due to AI SDK v1/v3 type mismatch
const languageModel = oci(model, {
  compartmentId,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
}) as unknown as LanguageModelV1;
```

**Refactored Code:**

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export async function POST(request: Request) {
  // Validate environment
  const compartmentId = process.env.OCI_COMPARTMENT_ID;
  if (!compartmentId) {
    return new Response(JSON.stringify({ error: 'OCI_COMPARTMENT_ID not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, model = 'cohere.command-r-plus' } = body;

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages must be an array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create provider with config
  const provider = createOCI({
    compartmentId,
    region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
  });

  // ✅ No type casting needed - ProviderV3 returns correct type
  const result = streamText({
    model: provider.languageModel(model),
    messages,
  });

  return result.toDataStreamResponse();
}
```

**Benefits:**

- ✅ **Removes type casting** - `as unknown as LanguageModelV1` no longer needed
- ✅ Clean ProviderV3 interface
- ✅ Better error messages from typed provider

---

### 3. CLI Tool

**Files to Update:**

- `examples/cli-tool/src/cli.ts`

**Current Code:**

```typescript
// Create model
const model = oci(MODEL_ID, {
  compartmentId: COMPARTMENT_ID,
  region: REGION,
}) as unknown as LanguageModel;
```

**Refactored Code:**

```typescript
#!/usr/bin/env node
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText, streamText } from 'ai';
import * as readline from 'node:readline';

// Configuration
const MODEL_ID = process.env.OCI_MODEL_ID || 'cohere.command-r-plus';
const COMPARTMENT_ID = process.env.OCI_COMPARTMENT_ID;
const REGION = process.env.OCI_REGION || 'eu-frankfurt-1';

if (!COMPARTMENT_ID) {
  console.error('Error: OCI_COMPARTMENT_ID environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  export OCI_COMPARTMENT_ID=ocid1.compartment.oc1...');
  console.error('  export OCI_REGION=eu-frankfurt-1  # optional');
  console.error('  export OCI_MODEL_ID=cohere.command-r-plus  # optional');
  console.error('');
  console.error('Then run:');
  console.error('  pnpm dev "Your prompt here"');
  console.error('  echo "Your prompt" | pnpm dev');
  process.exit(1);
}

// Create provider with config
const provider = createOCI({
  compartmentId: COMPARTMENT_ID,
  region: REGION,
});

// ✅ No type casting needed
const model = provider.languageModel(MODEL_ID);

// ... rest of the code remains the same
```

**Benefits:**

- ✅ Removes type casting
- ✅ Cleaner model initialization
- ✅ Ready for adding embeddings in future

---

## Testing Strategy

### After Refactoring Each Demo:

**1. SvelteKit Chatbot**

```bash
cd examples/chatbot-demo
pnpm install
pnpm dev
# Open http://localhost:5173
# Test: Send a message, verify streaming works
```

**2. Next.js Chatbot**

```bash
cd examples/nextjs-chatbot
pnpm install
pnpm dev
# Open http://localhost:3000
# Test: Send a message, verify streaming works
```

**3. CLI Tool**

```bash
cd examples/cli-tool
pnpm install

# Test one-shot mode
pnpm dev "What is TypeScript?"

# Test interactive mode
pnpm dev
> What is async/await?
> exit

# Test piped input
echo "Hello" | pnpm dev
```

### Verification Checklist

For each demo:

- [ ] No TypeScript errors
- [ ] No type casting (`as unknown as`)
- [ ] Streaming works correctly
- [ ] Model selection works
- [ ] Error handling intact
- [ ] Environment variables work
- [ ] Build succeeds (`pnpm build`)

---

## Migration Timeline

### Phase 1: After Plan 1 Completion (Core Refactoring)

**Action:** Update all demos to use new provider API
**Effort:** 1-2 hours
**Files:** 3 files (one per demo)

### Phase 2: After Plan 2 Completion (Embeddings)

**Action:** Add embeddings example to demos (optional)
**Effort:** 2-3 hours
**New Files:** RAG demo already planned in Plan 2

### Phase 3: After Plans 3-4 Completion (Speech/Transcription)

**Action:** Add speech demos (optional)
**Effort:** 3-4 hours
**New Files:** TTS and STT demos planned in Plans 3-4

---

## Breaking Changes Summary

### What Changes

- Import statement: Add `createOCI` import
- Model creation: Use `provider.languageModel()` instead of `oci()`
- Type casting: **REMOVE** all `as unknown as LanguageModel` casts

### What Stays the Same

- Environment variables (no changes)
- `streamText()` usage (no changes)
- Message format (no changes)
- Response handling (no changes)
- Build commands (no changes)

---

## Recommended Approach

**Option A: Refactor Immediately After Plan 1** ✅ Recommended

- Update all 3 demos in one go
- Verify everything works with new API
- Document changes in demo READMEs
- Commit as single atomic change

**Option B: Refactor Per Plan**

- Update demos as each plan completes
- SvelteKit after Plan 1
- Next.js after Plan 1
- CLI after Plan 1
- Add new features (embeddings, speech) as Plans 2-5 complete

---

## Dependencies Already Updated ✅

No dependency updates needed! All demos already have:

- ✅ `ai@^6.0.57` (latest)
- ✅ `@ai-sdk/react@^3.0.59` (latest)
- ✅ `@ai-sdk/svelte@^4.0.57` (latest)

Only the **API usage pattern** needs updating.

---

## Conclusion

**Current State:** All demos work but use deprecated v1.x API pattern with type casting hacks.

**Needed Action:** Simple refactoring to use new ProviderV3 API from Plan 1.

**Effort:** 1-2 hours for all 3 demos.

**Benefits:**

- ✅ Type-safe (no casting)
- ✅ Future-proof (ready for embeddings, speech, etc.)
- ✅ Better DX (clearer API)
- ✅ ProviderV3 compliant

**Recommendation:** Execute refactoring immediately after Plan 1 completion as part of Plan 1 verification steps.
