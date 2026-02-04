# Comparison: OpenAI-Compatible vs Native Provider

This document helps you choose between `@acedergren/oci-openai-compatible` and `@acedergren/oci-genai-provider`.

## Quick Decision Matrix

| Scenario                     | Recommended Package      |
| ---------------------------- | ------------------------ |
| Migrating from OpenAI        | ✅ oci-openai-compatible |
| Building OCI-native app      | ✅ oci-genai-provider    |
| Need instance principal auth | ✅ oci-genai-provider    |
| Want minimal bundle size     | ✅ oci-openai-compatible |
| Need embeddings support      | ✅ oci-genai-provider    |
| Need all OCI regions         | ✅ oci-genai-provider    |
| Familiar with OpenAI SDK     | ✅ oci-openai-compatible |
| Team has OCI expertise       | ✅ oci-genai-provider    |

## Detailed Comparison

### Bundle Size

**oci-openai-compatible:**

- Dependencies: `openai` (~100 KB), `oci-common` (~50 KB)
- Total: ~150 KB

**oci-genai-provider:**

- Dependencies: `oci-sdk` (~2.94 MB), `@ai-sdk/provider` (~50 KB)
- Total: ~3 MB

**Winner:** oci-openai-compatible (20x smaller)

### Authentication

**oci-openai-compatible:**

- ✅ API key (Bearer token)
- ❌ Instance principal
- ❌ Resource principal

**oci-genai-provider:**

- ✅ API key (OCI config file)
- ✅ Instance principal
- ✅ Resource principal

**Winner:** oci-genai-provider (more auth options)

### Regional Support

**oci-openai-compatible:**

- Supports: 6 regions
- Ashburn, Chicago, Phoenix, Frankfurt, Hyderabad, Osaka

**oci-genai-provider:**

- Supports: All OCI regions
- Any region with Generative AI service

**Winner:** oci-genai-provider (complete coverage)

### Model Support

**oci-openai-compatible:**

- Language models: 7 models
- Embeddings: ❌ (not via OpenAI API)
- Speech: ❌
- Transcription: ❌

**oci-genai-provider:**

- Language models: 16+ models
- Embeddings: ✅ (v0.2)
- Speech: ✅ (v0.3)
- Transcription: ✅ (v0.4)

**Winner:** oci-genai-provider (full capability)

### Developer Experience

**oci-openai-compatible:**

```typescript
import { createOCIOpenAI } from '@acedergren/oci-openai-compatible';

const client = createOCIOpenAI({
  region: 'us-ashburn-1',
  apiKey: process.env.OCI_API_KEY,
});

// Familiar OpenAI SDK pattern
const response = await client.chat.completions.create({
  model: 'meta.llama-3.3-70b-instruct',
  messages: [...],
});
```

**oci-genai-provider:**

```typescript
import { oci } from '@acedergren/oci-genai-provider';

// AI SDK ProviderV3 pattern
const response = await streamText({
  model: oci.languageModel('meta.llama-3.3-70b-instruct'),
  messages: [...],
});
```

**Winner:** Tie (different patterns for different audiences)

### Setup Complexity

**oci-openai-compatible:**

1. Set environment variables:
   ```bash
   export OCI_API_KEY="..."
   export OCI_COMPARTMENT_ID="..."
   ```
2. Import and use

**oci-genai-provider:**

1. Configure `~/.oci/config` file
2. Set compartment ID
3. Import and use

**Winner:** oci-openai-compatible (simpler setup)

### Error Handling

**oci-openai-compatible:**

- Generic OpenAI errors
- Less context about OCI-specific issues

**oci-genai-provider:**

- OCI-specific error types
- Detailed error messages
- Retry strategies

**Winner:** oci-genai-provider (better error context)

### Streaming

**oci-openai-compatible:**

```typescript
const stream = await client.chat.completions.create({
  model: '...',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  console.log(chunk.choices[0]?.delta?.content);
}
```

**oci-genai-provider:**

```typescript
const { textStream } = streamText({
  model: oci.languageModel('...'),
  messages: [...],
});

for await (const text of textStream) {
  console.log(text);
}
```

**Winner:** Tie (both support streaming well)

## Migration Paths

### From OpenAI → OCI

**Step 1: Use oci-openai-compatible**

```typescript
// Minimal code changes
- import OpenAI from 'openai';
+ import { createOCIOpenAI } from '@acedergren/oci-openai-compatible';

- const client = new OpenAI({ apiKey: '...' });
+ const client = createOCIOpenAI({ apiKey: '...', region: 'us-ashburn-1' });
```

**Step 2 (optional): Migrate to native provider**

```typescript
import { oci } from '@acedergren/oci-genai-provider';

// Unlock OCI-native features
const model = oci.languageModel('meta.llama-3.3-70b-instruct', {
  auth: 'instance_principal', // Now available
});
```

### From Native Provider → OpenAI-Compatible

**Why migrate down?**

- Reduce bundle size for serverless
- Simplify auth for edge deployments
- Standardize on OpenAI SDK patterns

**Migration:**

```typescript
- import { oci } from '@acedergren/oci-genai-provider';
+ import { createOCIOpenAI } from '@acedergren/oci-openai-compatible';

- const response = await streamText({
-   model: oci.languageModel('meta.llama-3.3-70b-instruct'),
-   messages: [...],
- });

+ const client = createOCIOpenAI({ region: '...' });
+ const response = await client.chat.completions.create({
+   model: 'meta.llama-3.3-70b-instruct',
+   messages: [...],
+ });
```

## Recommendations

### Use oci-openai-compatible if:

- ✅ You're coming from OpenAI
- ✅ Bundle size is critical
- ✅ You only need chat completions
- ✅ Simple API key auth is sufficient
- ✅ Your regions: US, EU, or Asia Pacific (6 regions)

### Use oci-genai-provider if:

- ✅ You're building OCI-native apps
- ✅ You need instance/resource principal auth
- ✅ You want embeddings, speech, transcription
- ✅ You need all OCI regions
- ✅ You want sophisticated error handling

### Use both if:

- ✅ Different teams with different expertise
- ✅ Migration path from OpenAI → OCI native
- ✅ Some services need lightweight (edge), others need full features (backend)

## Performance

**Latency:** Identical (both hit same OCI endpoints)

**Throughput:** Identical (OCI service handles both)

**Bundle size impact:**

- oci-openai-compatible: Faster initial load (smaller bundle)
- oci-genai-provider: More features but larger bundle

## Conclusion

**Both packages are valuable and serve different needs:**

- **oci-openai-compatible**: Best for migration, lightweight deployments, OpenAI familiarity
- **oci-genai-provider**: Best for OCI-native apps, full features, advanced auth

**Not redundant** - they target different user segments and use cases.
