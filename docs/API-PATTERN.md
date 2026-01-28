# OCI Provider API Pattern (v2.0+)

## Supported Patterns

The OCI provider supports **two patterns** for ProviderV3 compliance:

### Pattern 1: Default Instance (Simple Cases)

```typescript
import { oci } from '@acedergren/oci-genai-provider';

// Language models
const model = oci.languageModel('cohere.command-r-plus', {
  compartmentId: 'ocid1.compartment...',
  region: 'eu-frankfurt-1',
});

// Embeddings
const embedding = oci.embeddingModel('cohere.embed-multilingual-v3.0', {
  compartmentId: 'ocid1.compartment...',
});

// Speech (TTS)
const speech = oci.speechModel('oci.tts-1-hd', {
  compartmentId: 'ocid1.compartment...',
  region: 'us-phoenix-1', // Required for speech
});

// Transcription (STT)
const transcription = oci.transcriptionModel('oci.speech.whisper', {
  compartmentId: 'ocid1.compartment...',
});

// Reranking
const reranker = oci.rerankingModel('cohere.rerank-v3.5', {
  compartmentId: 'ocid1.compartment...',
});
```

### Pattern 2: Factory Function (Shared Config)

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

// Create provider with shared config
const provider = createOCI({
  compartmentId: 'ocid1.compartment...',
  region: 'eu-frankfurt-1',
  auth: 'config_file',
});

// Use for multiple models
const chatModel = provider.languageModel('cohere.command-r-plus');
const codeModel = provider.languageModel('meta.llama-3.3-70b-instruct');
const embedding = provider.embeddingModel('cohere.embed-multilingual-v3.0');
const reranker = provider.rerankingModel('cohere.rerank-v3.5');
```

---

## NOT Supported (Breaking Change from v1.x)

### ❌ Old v1.x Callable Pattern

```typescript
// ❌ NO LONGER SUPPORTED
const model = oci('cohere.command-r-plus', { config });

// ✅ USE THIS INSTEAD
const model = oci.languageModel('cohere.command-r-plus', { config });
```

---

## Complete Example: RAG with Multiple Model Types

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText, embed, embedMany, rerank } from 'ai';

// Create provider with shared config
const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID!,
  region: 'eu-frankfurt-1',
});

// Get models
const languageModel = provider.languageModel('cohere.command-r-plus');
const embeddingModel = provider.embeddingModel('cohere.embed-multilingual-v3.0');
const rerankingModel = provider.rerankingModel('cohere.rerank-v3.5');

// 1. Embed documents
const { embeddings } = await embedMany({
  model: embeddingModel,
  values: documents,
});

// 2. Embed query
const { embedding: queryEmbedding } = await embed({
  model: embeddingModel,
  value: query,
});

// 3. Find top candidates (e.g., top 50)
const candidates = findTopK(queryEmbedding, embeddings, 50);

// 4. Rerank for precision (top 3)
const { ranking } = await rerank({
  model: rerankingModel,
  query,
  documents: candidates,
  topK: 3,
});

// 5. Generate response
const { text } = await generateText({
  model: languageModel,
  prompt: `Context: ${ranking.map(r => candidates[r.index]).join('\n\n')}\n\nQuestion: ${query}`,
});
```

---

## Migration from v1.x

### Before (v1.x)

```typescript
import { oci } from '@acedergren/oci-genai-provider';

// Old callable pattern
const model = oci('cohere.command-r-plus', {
  compartmentId: 'ocid1...',
  region: 'eu-frankfurt-1',
}) as unknown as LanguageModel; // Type casting needed
```

### After (v2.0+)

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

// New explicit method
const provider = createOCI({
  compartmentId: 'ocid1...',
  region: 'eu-frankfurt-1',
});

const model = provider.languageModel('cohere.command-r-plus'); // No casting!
```

---

## Benefits of v2.0 API

✅ **Type-Safe** - No type casting required
✅ **ProviderV3 Compliant** - Full AI SDK v6 support
✅ **Multi-Model** - Language, Embeddings, Speech, Transcription, Reranking
✅ **Clear Intent** - Explicit method names
✅ **Shared Config** - Factory pattern for multiple models
✅ **Future-Proof** - Ready for new model types

---

## TypeScript Types

```typescript
import type {
  OCIProvider,
  OCIBaseConfig,
  OCILanguageModelSettings,
  OCIEmbeddingSettings,
  OCISpeechSettings,
  OCITranscriptionSettings,
  OCIRerankingSettings,
} from '@acedergren/oci-genai-provider';

// Provider interface
interface OCIProvider extends ProviderV3 {
  languageModel(modelId: string, settings?: OCILanguageModelSettings): LanguageModelV3;
  embeddingModel(modelId: string, settings?: OCIEmbeddingSettings): EmbeddingModelV3;
  speechModel(modelId: string, settings?: OCISpeechSettings): SpeechModelV3;
  transcriptionModel(modelId: string, settings?: OCITranscriptionSettings): TranscriptionModelV3;
  rerankingModel(modelId: string, settings?: OCIRerankingSettings): RerankingModelV3;
  imageModel(modelId: string): never; // Throws - OCI has no image generation
}
```

---

## Environment Variables

```bash
# Required
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..."

# Optional
export OCI_REGION="eu-frankfurt-1"          # Default region
export OCI_CONFIG_PROFILE="DEFAULT"         # OCI config profile
export OCI_CONFIG_FILE="~/.oci/config"      # OCI config path
```

---

## Regional Availability

| Service | Regions |
|---------|---------|
| **Language Models** | eu-frankfurt-1, eu-stockholm-1, us-ashburn-1, + more |
| **Embeddings** | eu-frankfurt-1, eu-stockholm-1, us-ashburn-1, + more |
| **Reranking** | eu-frankfurt-1, eu-stockholm-1, us-ashburn-1, + more |
| **Speech (TTS)** | **us-phoenix-1 ONLY** ⚠️ |
| **Transcription (STT)** | **us-phoenix-1 ONLY** ⚠️ |

---

## Error Handling

```typescript
import { OCIGenAIError, NetworkError, RateLimitError } from '@acedergren/oci-genai-provider';

try {
  const result = await generateText({ model, prompt });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting (429)
    console.error('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof NetworkError) {
    // Handle network errors (retryable)
    console.error('Network error:', error.message);
  } else if (error instanceof OCIGenAIError) {
    // Handle other OCI errors
    console.error('OCI error:', error.message);
  }
}
```

---

## Summary

**v2.0 is a clean break from v1.x:**

- ❌ **Removed:** Callable provider pattern `oci(modelId)`
- ✅ **Added:** Explicit methods `oci.languageModel(modelId)`
- ✅ **Added:** Factory pattern `createOCI(config)`
- ✅ **Added:** 4 new model types (embeddings, speech, transcription, reranking)
- ✅ **Added:** Full ProviderV3 compliance
- ✅ **Added:** Type safety without casting

**No backward compatibility** - v1.x code will not work with v2.0+ without updates.
