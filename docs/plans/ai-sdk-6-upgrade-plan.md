# AI SDK 6.0 Upgrade Plan

## Overview

This plan covers upgrading all packages in both `oci-genai-provider` and `oci-genai-examples` repositories to AI SDK 6.0.

## Current State

| Package                   | Current Version      | Target    | Status                           |
| ------------------------- | -------------------- | --------- | -------------------------------- |
| **oci-genai-provider**    | `^5.0.0 \|\| ^6.0.0` | `^6.0.0`  | Peer dep OK, code needs review   |
| **oci-openai-compatible** | `^5.0.0 \|\| ^6.0.0` | `^6.0.0`  | Peer dep OK, code needs review   |
| **tui-agent**             | `^4.3.16`            | `^6.0.0`  | ❌ **Full migration required**   |
| chatbot-demo              | `^6.0.57`            | `^6.0.64` | ✅ Fixed (stopWhen, inputSchema) |
| cli-tool                  | `^6.0.57`            | `^6.0.64` | ✅ Fixed (stopWhen)              |
| fraud-analyst-agent       | `^6.0.61`            | `^6.0.64` | Needs audit                      |
| nextjs-chatbot            | `^6.0.61`            | `^6.0.64` | Needs audit                      |
| oci-ai-chat               | `^6.0.64`            | `^6.0.64` | ✅ Already updated               |
| rag-demo                  | `^6.0.57`            | `^6.0.64` | Needs audit                      |
| rag-reranking-demo        | `^6.0.57`            | `^6.0.64` | Needs audit                      |
| stt-demo                  | `^6.0.57`            | `^6.0.64` | Needs audit                      |

---

## Phase 1: tui-agent Full Migration (v4 → v6)

**Priority: HIGH** - Only package still on v4.x

### 1.1 Update Dependencies

```bash
cd oci-genai-examples/tui-agent
pnpm add ai@^6.0.64 zod@^4.3.6
```

### 1.2 Run Codemods

```bash
npx @ai-sdk/codemod upgrade src/
```

### 1.3 Manual Code Changes

| File                             | Change                         |
| -------------------------------- | ------------------------------ |
| `src/services/agent-executor.ts` | `CoreMessage` → `ModelMessage` |
| `src/services/llm-client.ts`     | `CoreMessage` → `ModelMessage` |
| `src/hooks/useLLMStream.ts`      | `CoreMessage` → `ModelMessage` |

### 1.4 Additional v4 → v6 Changes

- [ ] `maxTokens` → `maxOutputTokens` (if used)
- [ ] `parameters` → `inputSchema` in any tool definitions
- [ ] `maxSteps` → `stopWhen: stepCountIs(n)` (if multi-step tools used)
- [ ] `convertToCoreMessages()` → `await convertToModelMessages()` (if used)

---

## Phase 2: Provider Package Audit

### 2.1 oci-genai-provider

The provider uses AI SDK v3 specification (`LanguageModelV3`), which is compatible with AI SDK 6.0.

**Check for:**

- [ ] Any usage of deprecated `CoreMessage` in public APIs
- [ ] Test files using deprecated patterns
- [ ] Documentation examples using deprecated patterns

### 2.2 oci-openai-compatible

**Check for:**

- [ ] `CoreMessage` usage
- [ ] Deprecated parameter names

---

## Phase 3: Example Package Audit

Run codemod on all packages to catch any remaining legacy patterns:

```bash
cd oci-genai-examples

# Audit each package
for pkg in fraud-analyst-agent nextjs-chatbot rag-demo rag-reranking-demo stt-demo; do
  echo "=== Auditing $pkg ==="
  npx @ai-sdk/codemod v6 $pkg/src/ --dry-run
done
```

### Known Patterns to Check

| Pattern           | Search                  | Replace                               |
| ----------------- | ----------------------- | ------------------------------------- |
| Message type      | `CoreMessage`           | `ModelMessage`                        |
| Convert messages  | `convertToCoreMessages` | `await convertToModelMessages`        |
| Multi-step tools  | `maxSteps:`             | `stopWhen: stepCountIs()`             |
| Tool schema       | `parameters:`           | `inputSchema:`                        |
| Max tokens        | `maxTokens:`            | `maxOutputTokens:`                    |
| Agent class       | `Experimental_Agent`    | `ToolLoopAgent`                       |
| Object generation | `generateObject`        | `generateText` with `Output.object()` |
| Embedding model   | `textEmbeddingModel`    | `embeddingModel`                      |

---

## Phase 4: Version Alignment

Update all packages to consistent latest versions:

```bash
# In oci-genai-examples root
pnpm update ai@^6.0.64 --recursive
```

---

## Phase 5: Testing

### 5.1 Unit Tests

```bash
cd oci-genai-provider && pnpm test
```

### 5.2 Type Checking

```bash
# Each package
pnpm exec tsc --noEmit
```

### 5.3 Integration Testing

- [ ] Test tool calling with Cohere model
- [ ] Test multi-step tool execution with `stopWhen`
- [ ] Test streaming responses
- [ ] Test reasoning models

---

## Verification Checklist

- [ ] All packages on `ai@^6.0.64`
- [ ] No `CoreMessage` imports remaining
- [ ] No `maxSteps` usage (replaced with `stopWhen`)
- [ ] No `parameters` in tool definitions (replaced with `inputSchema`)
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Demo apps functional

---

## Rollback Plan

If issues arise:

1. Revert package.json changes
2. Run `pnpm install` to restore previous versions
3. Document the issue for investigation

---

## References

- [AI SDK 5.0 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0)
- [AI SDK 6.0 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0)
- [Codemod Documentation](https://github.com/vercel/ai/tree/main/packages/codemod)
