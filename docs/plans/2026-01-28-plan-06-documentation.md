# Plan 6: Documentation & Examples

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create comprehensive documentation and working examples for all model types, ensuring developers can quickly understand and use the provider.

**Architecture:** Complete documentation suite covering API reference, configuration guide, migration guide, troubleshooting, and working examples with READMEs for each model type.

**Tech Stack:** Markdown, TypeScript examples, JSDoc comments

---

## Prerequisites

**Required:**
- ✅ Plan 1 must be complete (Core Provider Refactoring)
- Plan 2-5 should be complete or at least started (for model-specific docs)
- Provider implements ProviderV3 interface
- All model types are functional

---

## Task 1: Update Main README

**Files:**
- Modify: `packages/oci-genai-provider/README.md`

**Step 1: Write test for README completeness**

Create: `packages/oci-genai-provider/src/__tests__/docs-validation.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Documentation Validation', () => {
  it('README should document all model types', () => {
    const readme = readFileSync(
      join(__dirname, '../../README.md'),
      'utf-8'
    );

    // Check for all model types
    expect(readme).toContain('Language Models');
    expect(readme).toContain('Embeddings');
    expect(readme).toContain('Speech Models');
    expect(readme).toContain('Transcription Models');
    expect(readme).toContain('Reranking Models');
  });

  it('README should include installation instructions', () => {
    const readme = readFileSync(
      join(__dirname, '../../README.md'),
      'utf-8'
    );

    expect(readme).toContain('npm install');
    expect(readme).toContain('pnpm add');
  });

  it('README should document authentication', () => {
    const readme = readFileSync(
      join(__dirname, '../../README.md'),
      'utf-8'
    );

    expect(readme).toContain('Authentication');
    expect(readme).toContain('OCI_CONFIG_PROFILE');
  });

  it('README should link to examples', () => {
    const readme = readFileSync(
      join(__dirname, '../../README.md'),
      'utf-8'
    );

    expect(readme).toContain('examples/');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/docs-validation.test.ts`
Expected: FAIL - Missing sections

**Step 3: Update README with complete content**

Replace `packages/oci-genai-provider/README.md`:

```markdown
# OCI Generative AI Provider for Vercel AI SDK

Complete ProviderV3 implementation for Oracle Cloud Infrastructure (OCI) Generative AI services.

## Features

- **16+ Language Models** - Cohere Command, Meta Llama, Claude, Mistral
- **Embeddings** - Cohere Embed models with 384/1024 dimensions
- **Speech (TTS)** - OCI Speech Synthesis in Phoenix region
- **Transcription (STT)** - OCI Speech to Text services
- **Reranking** - Cohere Rerank models for search optimization
- **Streaming Support** - Full streaming for language models
- **Type Safety** - Complete TypeScript definitions
- **Auth Flexibility** - Config file, instance principal, resource principal

## Installation

```bash
npm install @acedergren/oci-genai-provider ai
# or
pnpm add @acedergren/oci-genai-provider ai
# or
yarn add @acedergren/oci-genai-provider ai
```

## Quick Start

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: oci.languageModel('cohere.command-r-plus'),
  prompt: 'Explain quantum computing',
});

console.log(result.text);
```

## Authentication

### Option 1: OCI Config File (Recommended)

Create `~/.oci/config`:

```ini
[DEFAULT]
user=ocid1.user.oc1..aaa...
fingerprint=12:34:56:78:...
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..aaa...
region=us-phoenix-1
```

Set environment variables:

```bash
export OCI_CONFIG_PROFILE=DEFAULT
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaa...
```

### Option 2: Explicit Configuration

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI({
  region: 'us-phoenix-1',
  compartmentId: 'ocid1.compartment.oc1..aaa...',
  profile: 'DEFAULT',
});
```

### Option 3: Instance Principal (OCI Compute)

```typescript
const provider = createOCI({
  auth: 'instance_principal',
  region: 'us-phoenix-1',
});
```

## Language Models

### Available Models

| Model ID | Family | Context | Best For |
|----------|--------|---------|----------|
| `cohere.command-r-plus` | Cohere | 128K | Long context, RAG |
| `cohere.command-r-08-2024` | Cohere | 128K | General purpose |
| `meta.llama-3.3-70b` | Meta | 8K | Instruction following |
| `meta.llama-3.1-405b-instruct` | Meta | 128K | Most capable |
| `anthropic.claude-3-5-sonnet-v2` | Anthropic | 200K | Analysis, coding |
| `mistral.mistral-large-2` | Mistral | 128K | Multilingual |

[See full model list](./docs/models.md)

### Usage

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const result = streamText({
  model: oci.languageModel('cohere.command-r-plus'),
  messages: [
    { role: 'user', content: 'Write a poem about clouds' }
  ],
  temperature: 0.7,
  maxTokens: 500,
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

## Embeddings

Generate text embeddings for semantic search and RAG:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embed, embedMany } from 'ai';

// Single embedding
const { embedding } = await embed({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  value: 'Hello world',
});

// Batch embeddings (up to 96 texts)
const { embeddings } = await embedMany({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  values: ['Text 1', 'Text 2', 'Text 3'],
});
```

### Available Embedding Models

| Model ID | Dimensions | Max Batch | Use Case |
|----------|-----------|-----------|----------|
| `cohere.embed-multilingual-v3.0` | 1024 | 96 | Multilingual semantic search |
| `cohere.embed-english-v3.0` | 1024 | 96 | English semantic search |
| `cohere.embed-english-light-v3.0` | 384 | 96 | Fast English embeddings |

## Speech Models (TTS)

Generate speech from text using OCI Speech services:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateSpeech } from 'ai';

const result = await generateSpeech({
  model: oci.speechModel('oci-tts-standard', {
    voice: 'en-US-Standard-A',
    region: 'us-phoenix-1', // Speech only in Phoenix
  }),
  text: 'Hello, this is a test.',
});

// result.audio is a Buffer containing MP3 audio
```

**Note:** Speech services are only available in the `us-phoenix-1` region.

## Transcription Models (STT)

Convert speech to text:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { transcribe } from 'ai';
import { readFileSync } from 'fs';

const audioBuffer = readFileSync('./audio.mp3');

const result = await transcribe({
  model: oci.transcriptionModel('oci-stt-standard', {
    language: 'en',
    region: 'us-phoenix-1',
  }),
  audio: audioBuffer,
});

console.log(result.text);
```

## Reranking Models

Improve search results with semantic reranking:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { rerank } from 'ai';

const result = await rerank({
  model: oci.rerankingModel('cohere.rerank-v3.0'),
  query: 'What is quantum computing?',
  documents: [
    'Quantum computing uses qubits...',
    'Classical computers use bits...',
    'Machine learning is a subset...',
  ],
  topN: 2,
});

console.log(result.rankings); // Top 2 most relevant documents
```

## Configuration Options

### Global Provider Configuration

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI({
  region: 'us-phoenix-1',
  compartmentId: 'ocid1.compartment.oc1..aaa...',
  profile: 'DEFAULT',
  configPath: '/custom/path/to/config',
  endpoint: 'https://custom-endpoint.com', // For testing
  auth: 'config_file', // 'instance_principal' | 'resource_principal'
});
```

### Model-Specific Settings

```typescript
// Language model settings
oci.languageModel('cohere.command-r-plus', {
  requestOptions: {
    timeoutMs: 60000,
    retry: {
      enabled: true,
      maxRetries: 3,
    },
  },
});

// Embedding settings
oci.embeddingModel('cohere.embed-multilingual-v3.0', {
  truncate: 'END', // 'START' | 'END' | 'NONE'
  inputType: 'DOCUMENT', // 'QUERY' | 'DOCUMENT'
  dimensions: 1024, // 384 | 1024
});

// Speech settings
oci.speechModel('oci-tts-standard', {
  voice: 'en-US-Standard-A',
  speed: 1.0, // 0.5 to 2.0
  format: 'mp3', // 'mp3' | 'wav' | 'pcm'
});
```

## Regional Availability

| Service | Available Regions |
|---------|-------------------|
| Language Models | All OCI regions |
| Embeddings | All OCI regions |
| Speech (TTS) | **us-phoenix-1 only** |
| Transcription (STT) | **us-phoenix-1 only** |
| Reranking | All OCI regions |

## Examples

Complete working examples in `examples/` directory:

- **[chatbot-demo](../examples/chatbot-demo/)** - SvelteKit chatbot with streaming
- **[nextjs-chatbot](../examples/nextjs-chatbot/)** - Next.js chatbot
- **[rag-demo](../examples/rag-demo/)** - RAG with embeddings
- **[speech-demo](../examples/speech-demo/)** - Text-to-speech
- **[transcription-demo](../examples/transcription-demo/)** - Speech-to-text
- **[reranking-demo](../examples/reranking-demo/)** - Search reranking

## Migration from v1.x

See [Migration Guide](./docs/migration.md) for detailed upgrade instructions.

### Quick Migration

```typescript
// v1.x (deprecated)
import { oci } from '@acedergren/oci-genai-provider';
const model = oci('cohere.command-r-plus'); // ❌ No longer supported

// v2.x (ProviderV3)
import { oci } from '@acedergren/oci-genai-provider';
const model = oci.languageModel('cohere.command-r-plus'); // ✅ Use this
```

## Troubleshooting

### Common Issues

**Authentication Error**

```
Error: Authentication failed
```

Solution: Verify your OCI config file and ensure `OCI_COMPARTMENT_ID` is set.

**Region Not Available for Speech**

```
Error: Speech services not available in this region
```

Solution: Use `us-phoenix-1` region for speech/transcription services.

**Model Not Found**

```
Error: Invalid model ID
```

Solution: Check [available models](./docs/models.md) for correct model IDs.

See [Troubleshooting Guide](./docs/troubleshooting.md) for more solutions.

## API Reference

- [Language Models](./docs/language-models.md)
- [Embeddings](./docs/embeddings.md)
- [Speech Models](./docs/speech.md)
- [Transcription Models](./docs/transcription.md)
- [Reranking Models](./docs/reranking.md)
- [Configuration](./docs/configuration.md)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT - See [LICENSE](../../LICENSE)

## Support

- GitHub Issues: [opencode-oci-genai/issues](https://github.com/acedergren/opencode-oci-genai/issues)
- Documentation: [docs/](./docs/)
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/docs-validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add README.md src/__tests__/docs-validation.test.ts
git commit -m "docs: update main README with all model types"
```

---

## Task 2: Create API Reference Documentation

**Files:**
- Create: `packages/oci-genai-provider/docs/api-reference.md`

**Step 1: Write test for API reference completeness**

Add to `packages/oci-genai-provider/src/__tests__/docs-validation.test.ts`:

```typescript
describe('API Reference Documentation', () => {
  it('should document all provider methods', () => {
    const apiRef = readFileSync(
      join(__dirname, '../../docs/api-reference.md'),
      'utf-8'
    );

    expect(apiRef).toContain('languageModel()');
    expect(apiRef).toContain('embeddingModel()');
    expect(apiRef).toContain('speechModel()');
    expect(apiRef).toContain('transcriptionModel()');
    expect(apiRef).toContain('rerankingModel()');
  });

  it('should document createOCI factory', () => {
    const apiRef = readFileSync(
      join(__dirname, '../../docs/api-reference.md'),
      'utf-8'
    );

    expect(apiRef).toContain('createOCI');
    expect(apiRef).toContain('OCIBaseConfig');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/docs-validation.test.ts`
Expected: FAIL - File doesn't exist

**Step 3: Create API reference documentation**

Create: `packages/oci-genai-provider/docs/api-reference.md`

```markdown
# API Reference

Complete API documentation for `@acedergren/oci-genai-provider`.

## Provider Factory

### createOCI(config?: OCIBaseConfig): OCIProvider

Creates a new OCI provider instance with custom configuration.

**Parameters:**
- `config` (optional): Base configuration object

**Returns:** `OCIProvider` instance

**Example:**
```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI({
  region: 'us-phoenix-1',
  compartmentId: 'ocid1.compartment.oc1..aaa...',
});
```

### oci: OCIProvider

Default provider instance using environment variables or OCI config file.

**Example:**
```typescript
import { oci } from '@acedergren/oci-genai-provider';

const model = oci.languageModel('cohere.command-r-plus');
```

## OCIProvider Class

### languageModel(modelId: string, settings?: OCILanguageModelSettings): LanguageModelV3

Creates a language model instance.

**Parameters:**
- `modelId`: Model identifier (e.g., 'cohere.command-r-plus')
- `settings` (optional): Language model configuration

**Returns:** `LanguageModelV3` instance

**Example:**
```typescript
const model = oci.languageModel('cohere.command-r-plus', {
  requestOptions: {
    timeoutMs: 60000,
  },
});
```

### embeddingModel(modelId: string, settings?: OCIEmbeddingSettings): EmbeddingModelV3

Creates an embedding model instance.

**Parameters:**
- `modelId`: Embedding model identifier (e.g., 'cohere.embed-multilingual-v3.0')
- `settings` (optional): Embedding configuration

**Returns:** `EmbeddingModelV3` instance

**Example:**
```typescript
const model = oci.embeddingModel('cohere.embed-multilingual-v3.0', {
  truncate: 'END',
  inputType: 'DOCUMENT',
});
```

### speechModel(modelId: string, settings?: OCISpeechSettings): SpeechModelV3

Creates a speech synthesis model instance.

**Parameters:**
- `modelId`: Speech model identifier (e.g., 'oci-tts-standard')
- `settings` (optional): Speech configuration

**Returns:** `SpeechModelV3` instance

**Example:**
```typescript
const model = oci.speechModel('oci-tts-standard', {
  voice: 'en-US-Standard-A',
  speed: 1.0,
  region: 'us-phoenix-1',
});
```

### transcriptionModel(modelId: string, settings?: OCITranscriptionSettings): TranscriptionModelV3

Creates a speech-to-text model instance.

**Parameters:**
- `modelId`: Transcription model identifier (e.g., 'oci-stt-standard')
- `settings` (optional): Transcription configuration

**Returns:** `TranscriptionModelV3` instance

**Example:**
```typescript
const model = oci.transcriptionModel('oci-stt-standard', {
  language: 'en',
  region: 'us-phoenix-1',
});
```

### rerankingModel(modelId: string, settings?: OCIRerankingSettings): RerankingModelV3

Creates a reranking model instance.

**Parameters:**
- `modelId`: Reranking model identifier (e.g., 'cohere.rerank-v3.0')
- `settings` (optional): Reranking configuration

**Returns:** `RerankingModelV3` instance

**Example:**
```typescript
const model = oci.rerankingModel('cohere.rerank-v3.0', {
  topN: 5,
});
```

## Configuration Types

### OCIBaseConfig

Base configuration shared across all model types.

```typescript
interface OCIBaseConfig {
  /** OCI region (e.g., 'eu-frankfurt-1') */
  region?: string;

  /** OCI config profile name */
  profile?: string;

  /** Authentication method */
  auth?: 'config_file' | 'instance_principal' | 'resource_principal';

  /** OCI compartment OCID */
  compartmentId?: string;

  /** Custom endpoint URL (for testing) */
  endpoint?: string;

  /** Path to OCI config file */
  configPath?: string;
}
```

### OCILanguageModelSettings

Settings specific to language models.

```typescript
interface OCILanguageModelSettings extends OCIBaseConfig {
  /** Request options for timeout and retry behavior */
  requestOptions?: {
    timeoutMs?: number;
    retry?: {
      enabled: boolean;
      maxRetries?: number;
    };
  };
}
```

### OCIEmbeddingSettings

Settings for embedding models.

```typescript
interface OCIEmbeddingSettings extends OCIBaseConfig {
  /** Embedding dimensions (384 for light, 1024 for standard) */
  dimensions?: 384 | 1024;

  /** How to truncate input text if it exceeds model limits */
  truncate?: 'START' | 'END' | 'NONE';

  /** Input type optimization */
  inputType?: 'QUERY' | 'DOCUMENT';
}
```

### OCISpeechSettings

Settings for speech models (TTS).

```typescript
interface OCISpeechSettings extends OCIBaseConfig {
  /** Voice ID */
  voice?: string;

  /** Speech speed multiplier (0.5 to 2.0) */
  speed?: number;

  /** Audio output format */
  format?: 'mp3' | 'wav' | 'pcm';
}
```

### OCITranscriptionSettings

Settings for transcription models (STT).

```typescript
interface OCITranscriptionSettings extends OCIBaseConfig {
  /** Language code (e.g., 'en', 'es', 'de') */
  language?: string;

  /** Transcription model to use */
  model?: 'standard' | 'whisper';

  /** Custom vocabulary words */
  vocabulary?: string[];
}
```

### OCIRerankingSettings

Settings for reranking models.

```typescript
interface OCIRerankingSettings extends OCIBaseConfig {
  /** Return only top N results */
  topN?: number;

  /** Include document text in response */
  returnDocuments?: boolean;
}
```

## Model Registry Functions

### Language Models

```typescript
// Check if model ID is valid
isValidModelId(modelId: string): boolean

// Get model metadata
getModelMetadata(modelId: string): ModelMetadata | undefined

// Get all language models
getAllModels(): ModelMetadata[]

// Get models by family
getModelsByFamily(family: string): ModelMetadata[]
```

### Embedding Models

```typescript
// Check if embedding model ID is valid
isValidEmbeddingModelId(modelId: string): boolean

// Get embedding model metadata
getEmbeddingModelMetadata(modelId: string): EmbeddingModelMetadata | undefined

// Get all embedding models
getAllEmbeddingModels(): EmbeddingModelMetadata[]
```

## Error Classes

### OCIGenAIError

Base error class for all OCI GenAI errors.

```typescript
class OCIGenAIError extends Error {
  constructor(message: string, cause?: unknown)
}
```

### NetworkError

Network-related errors.

```typescript
class NetworkError extends OCIGenAIError {
  constructor(message: string, cause?: unknown)
}
```

### RateLimitError

Rate limit exceeded errors.

```typescript
class RateLimitError extends OCIGenAIError {
  constructor(message: string, retryAfter?: number)
}
```

### AuthenticationError

Authentication and authorization errors.

```typescript
class AuthenticationError extends OCIGenAIError {
  constructor(message: string, cause?: unknown)
}
```

### ModelNotFoundError

Invalid or unavailable model errors.

```typescript
class ModelNotFoundError extends OCIGenAIError {
  constructor(modelId: string, modelType: string)
}
```

## Examples

See the [examples/](../../examples/) directory for complete working examples.
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/docs-validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add docs/api-reference.md src/__tests__/docs-validation.test.ts
git commit -m "docs: create comprehensive API reference"
```

---

## Task 3: Create Configuration Guide

**Files:**
- Create: `packages/oci-genai-provider/docs/configuration.md`

**Step 1: Write test for configuration guide**

Add to `packages/oci-genai-provider/src/__tests__/docs-validation.test.ts`:

```typescript
describe('Configuration Guide', () => {
  it('should document all authentication methods', () => {
    const configGuide = readFileSync(
      join(__dirname, '../../docs/configuration.md'),
      'utf-8'
    );

    expect(configGuide).toContain('config_file');
    expect(configGuide).toContain('instance_principal');
    expect(configGuide).toContain('resource_principal');
  });

  it('should document environment variables', () => {
    const configGuide = readFileSync(
      join(__dirname, '../../docs/configuration.md'),
      'utf-8'
    );

    expect(configGuide).toContain('OCI_CONFIG_PROFILE');
    expect(configGuide).toContain('OCI_COMPARTMENT_ID');
    expect(configGuide).toContain('OCI_REGION');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/docs-validation.test.ts`
Expected: FAIL - File doesn't exist

**Step 3: Create configuration guide**

Create: `packages/oci-genai-provider/docs/configuration.md`

```markdown
# Configuration Guide

Complete guide to configuring the OCI Generative AI Provider.

## Authentication Methods

The provider supports three authentication methods:

### 1. Config File (Recommended for Development)

Uses OCI config file (`~/.oci/config`) for authentication.

**Setup:**

1. Create `~/.oci/config`:

```ini
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaa...
fingerprint=12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..aaaaaaaa...
region=us-phoenix-1
```

2. Set environment variables:

```bash
export OCI_CONFIG_PROFILE=DEFAULT
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaaaaaa...
```

**Usage:**

```typescript
import { oci } from '@acedergren/oci-genai-provider';

// Uses config file automatically
const model = oci.languageModel('cohere.command-r-plus');
```

### 2. Instance Principal (Production on OCI Compute)

Uses instance metadata for authentication when running on OCI compute instances.

**Setup:**

1. Create dynamic group for your compute instances
2. Add policy to allow dynamic group to use GenAI services

```
Allow dynamic-group MyComputeInstances to use generative-ai-family in compartment MyCompartment
```

**Usage:**

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI({
  auth: 'instance_principal',
  region: 'us-phoenix-1',
  compartmentId: 'ocid1.compartment.oc1..aaaaaaaa...',
});
```

### 3. Resource Principal (Production on OCI Functions)

Uses resource metadata when running in OCI Functions or other resource-based services.

**Setup:**

Add policy for function:

```
Allow resource MyFunctionResource to use generative-ai-family in compartment MyCompartment
```

**Usage:**

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI({
  auth: 'resource_principal',
  region: 'us-phoenix-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OCI_COMPARTMENT_ID` | Compartment OCID | `ocid1.compartment.oc1..aaa...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OCI_CONFIG_PROFILE` | Config file profile name | `DEFAULT` |
| `OCI_CONFIG_FILE` | Path to config file | `~/.oci/config` |
| `OCI_REGION` | OCI region | From config file |
| `OCI_CLI_AUTH` | Authentication method | `api_key` |

### Setting Variables

**Linux/macOS:**

```bash
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaa...
export OCI_CONFIG_PROFILE=FRANKFURT
export OCI_REGION=eu-frankfurt-1
```

**Windows (PowerShell):**

```powershell
$env:OCI_COMPARTMENT_ID="ocid1.compartment.oc1..aaa..."
$env:OCI_CONFIG_PROFILE="FRANKFURT"
$env:OCI_REGION="eu-frankfurt-1"
```

**Node.js (.env file):**

```bash
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaa...
OCI_CONFIG_PROFILE=FRANKFURT
OCI_REGION=eu-frankfurt-1
```

## Region Configuration

### Available Regions

OCI services are available in multiple regions. Choose the region closest to your users.

| Region Code | Location |
|-------------|----------|
| `us-phoenix-1` | Phoenix, AZ (USA) |
| `us-ashburn-1` | Ashburn, VA (USA) |
| `eu-frankfurt-1` | Frankfurt (Germany) |
| `eu-stockholm-1` | Stockholm (Sweden) |
| `uk-london-1` | London (UK) |
| `ap-tokyo-1` | Tokyo (Japan) |
| `ap-mumbai-1` | Mumbai (India) |

### Regional Service Availability

⚠️ **Important:** Speech and Transcription services are only available in `us-phoenix-1`.

```typescript
// Language models - All regions
oci.languageModel('cohere.command-r-plus', {
  region: 'eu-frankfurt-1',
});

// Speech - Phoenix only
oci.speechModel('oci-tts-standard', {
  region: 'us-phoenix-1', // Required
});
```

## Multiple Profiles

If you work with multiple OCI accounts, configure multiple profiles:

**~/.oci/config:**

```ini
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaa...
fingerprint=12:34:56:...
key_file=~/.oci/default_key.pem
tenancy=ocid1.tenancy.oc1..aaaaaaaa...
region=us-phoenix-1

[PRODUCTION]
user=ocid1.user.oc1..bbbbbbbb...
fingerprint=ab:cd:ef:...
key_file=~/.oci/prod_key.pem
tenancy=ocid1.tenancy.oc1..bbbbbbbb...
region=eu-frankfurt-1

[DEVELOPMENT]
user=ocid1.user.oc1..cccccccc...
fingerprint=11:22:33:...
key_file=~/.oci/dev_key.pem
tenancy=ocid1.tenancy.oc1..cccccccc...
region=us-ashburn-1
```

**Usage:**

```typescript
// Use production profile
const prodProvider = createOCI({
  profile: 'PRODUCTION',
  compartmentId: 'ocid1.compartment.prod...',
});

// Use development profile
const devProvider = createOCI({
  profile: 'DEVELOPMENT',
  compartmentId: 'ocid1.compartment.dev...',
});
```

## Custom Endpoints

For testing or dedicated clusters:

```typescript
const provider = createOCI({
  endpoint: 'https://custom-endpoint.oci.com',
  region: 'us-phoenix-1',
});
```

## Configuration Priority

The provider resolves configuration in this order (highest to lowest priority):

1. **Model-specific settings** passed to `languageModel()`, etc.
2. **Provider configuration** passed to `createOCI()`
3. **Environment variables** (`OCI_*`)
4. **OCI config file** (`~/.oci/config`)

**Example:**

```typescript
// Region precedence example
const provider = createOCI({
  region: 'eu-frankfurt-1', // Priority 2
});

const model = oci.languageModel('cohere.command-r-plus', {
  region: 'us-phoenix-1', // Priority 1 - this wins
});
```

## Best Practices

### Development

- Use config file authentication
- Store credentials in `~/.oci/config`
- Use `.env` file for compartment ID
- Never commit credentials to git

### Production

- Use instance principal or resource principal
- Store compartment ID in environment variables
- Use different profiles for different environments
- Rotate API keys regularly

### Security

- Never expose API keys in code
- Use `.gitignore` for `.env` files
- Restrict file permissions on `~/.oci/config` (chmod 600)
- Use OCI Vault for sensitive configuration

## Troubleshooting

### "Authentication failed"

- Verify `~/.oci/config` exists and has correct format
- Check file permissions (should be 600)
- Ensure API key file exists and path is correct
- Verify fingerprint matches the key

### "Compartment not found"

- Check `OCI_COMPARTMENT_ID` is set correctly
- Verify you have access to the compartment
- Ensure compartment OCID is valid

### "Region not available"

- Check service availability in your region
- Use `us-phoenix-1` for speech/transcription
- Verify region code is correct

See [Troubleshooting Guide](./troubleshooting.md) for more solutions.
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/docs-validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add docs/configuration.md src/__tests__/docs-validation.test.ts
git commit -m "docs: create comprehensive configuration guide"
```

---

## Task 4: Create Migration Guide

**Files:**
- Create: `packages/oci-genai-provider/docs/migration.md`

**Step 1: Create migration guide**

Create: `packages/oci-genai-provider/docs/migration.md`

```markdown
# Migration Guide: v1.x to v2.0

This guide helps you migrate from v1.x to v2.0 with ProviderV3 support.

## Overview

v2.0 introduces breaking changes to align with Vercel AI SDK v4+ and ProviderV3 interface:

- Explicit model type methods (`.languageModel()`, `.embeddingModel()`, etc.)
- Support for embeddings, speech, transcription, and reranking
- Improved type safety and configuration
- Better error handling

## Breaking Changes

### 1. Language Model Creation

**v1.x (deprecated):**
```typescript
import { oci } from '@acedergren/oci-genai-provider';

const model = oci('cohere.command-r-plus'); // ❌ No longer supported
```

**v2.0 (ProviderV3):**
```typescript
import { oci } from '@acedergren/oci-genai-provider';

const model = oci.languageModel('cohere.command-r-plus'); // ✅ Required
```

### 2. Provider Factory

**v1.x (deprecated):**
```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI(config);
const model = provider(modelId); // ❌ No longer supported
```

**v2.0 (ProviderV3):**
```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI(config);
const model = provider.languageModel(modelId); // ✅ Required
```

### 3. Configuration Structure

**v1.x:**
```typescript
const provider = createOCI({
  region: 'us-phoenix-1',
  compartmentId: 'ocid1...',
  timeout: 60000,
});
```

**v2.0:**
```typescript
const provider = createOCI({
  region: 'us-phoenix-1',
  compartmentId: 'ocid1...',
});

const model = provider.languageModel('model-id', {
  requestOptions: {
    timeoutMs: 60000,
  },
});
```

### 4. Error Handling

**v1.x:**
```typescript
try {
  await generateText({ model, prompt });
} catch (error) {
  // Generic error handling
}
```

**v2.0:**
```typescript
import {
  NetworkError,
  RateLimitError,
  AuthenticationError,
} from '@acedergren/oci-genai-provider';

try {
  await generateText({ model, prompt });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limit
  } else if (error instanceof AuthenticationError) {
    // Handle auth error
  }
}
```

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
npm install @acedergren/oci-genai-provider@^2.0.0 ai@^6.0.0
# or
pnpm add @acedergren/oci-genai-provider@^2.0.0 ai@^6.0.0
```

### Step 2: Update Imports

No changes needed for imports - they remain the same.

### Step 3: Update Model Creation

Find and replace pattern:

```typescript
// Before (v1.x - deprecated)
const model = oci('cohere.command-r-plus'); // ❌ Remove
const model = provider('model-id'); // ❌ Remove

// After (v2.0 - ProviderV3)
const model = oci.languageModel('cohere.command-r-plus'); // ✅ Use
const model = provider.languageModel('model-id'); // ✅ Use
```

### Step 4: Move Model Settings

Move model-specific settings from provider config to model config:

**Before:**
```typescript
const provider = createOCI({
  region: 'us-phoenix-1',
  timeout: 60000,
  maxRetries: 3,
});
```

**After:**
```typescript
const provider = createOCI({
  region: 'us-phoenix-1',
});

const model = provider.languageModel('model-id', {
  requestOptions: {
    timeoutMs: 60000,
    retry: {
      enabled: true,
      maxRetries: 3,
    },
  },
});
```

### Step 5: Update Error Handling

Add specific error type handling:

```typescript
import {
  OCIGenAIError,
  RateLimitError,
  AuthenticationError,
  NetworkError,
} from '@acedergren/oci-genai-provider';

try {
  // Your code
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof AuthenticationError) {
    console.log('Auth failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.message);
  }
}
```

## New Features in v2.0

### 1. Embeddings

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embedMany } from 'ai';

const { embeddings } = await embedMany({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  values: ['text 1', 'text 2'],
});
```

### 2. Speech Synthesis

```typescript
import { generateSpeech } from 'ai';

const result = await generateSpeech({
  model: oci.speechModel('oci-tts-standard', {
    voice: 'en-US-Standard-A',
    region: 'us-phoenix-1',
  }),
  text: 'Hello world',
});
```

### 3. Transcription

```typescript
import { transcribe } from 'ai';

const result = await transcribe({
  model: oci.transcriptionModel('oci-stt-standard', {
    language: 'en',
  }),
  audio: audioBuffer,
});
```

### 4. Reranking

```typescript
import { rerank } from 'ai';

const result = await rerank({
  model: oci.rerankingModel('cohere.rerank-v3.0'),
  query: 'search query',
  documents: ['doc1', 'doc2', 'doc3'],
});
```

## Automated Migration

Use this script to help automate the migration:

```typescript
// migrate.ts
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'dist/**'],
});

for (const file of files) {
  let content = readFileSync(file, 'utf-8');

  // Replace old v1.x callable pattern with ProviderV3 method
  content = content.replace(
    /oci\(['"`]([^'"`]+)['"`]\)/g,
    "oci.languageModel('$1')"
  );

  // Replace provider callable pattern with explicit method
  content = content.replace(
    /provider\(['"`]([^'"`]+)['"`]\)/g,
    "provider.languageModel('$1')"
  );

  writeFileSync(file, content);
  console.log(`Updated: ${file}`);
}
```

Run with:
```bash
npx tsx migrate.ts
```

## Testing After Migration

### 1. Run Type Checker

```bash
tsc --noEmit
```

Fix any type errors that appear.

### 2. Run Tests

```bash
npm test
# or
pnpm test
```

### 3. Test in Development

```bash
npm run dev
```

Verify all functionality works as expected.

## Compatibility

### AI SDK Version

- **v1.x:** Works with `ai@^3.0.0`
- **v2.0:** Requires `ai@^6.0.0`

### Node.js Version

- **Minimum:** Node.js 18+
- **Recommended:** Node.js 20+

### TypeScript Version

- **Minimum:** TypeScript 5.0+
- **Recommended:** TypeScript 5.6+

## Getting Help

If you encounter issues during migration:

1. Check [Troubleshooting Guide](./troubleshooting.md)
2. Review [API Reference](./api-reference.md)
3. See [examples/](../../examples/) for working code
4. Open an issue on GitHub

## Rollback Plan

If you need to rollback to v1.x:

```bash
npm install @acedergren/oci-genai-provider@^1.0.0 ai@^3.0.0
# or
pnpm add @acedergren/oci-genai-provider@^1.0.0 ai@^3.0.0
```

Then revert your code changes using git:

```bash
git checkout -- .
```
```

**Step 2: Commit**

```bash
git add docs/migration.md
git commit -m "docs: create migration guide from v1.x to v2.0"
```

---

## Task 5: Create Troubleshooting Guide

**Files:**
- Create: `packages/oci-genai-provider/docs/troubleshooting.md`

**Step 1: Create troubleshooting guide**

Create: `packages/oci-genai-provider/docs/troubleshooting.md`

```markdown
# Troubleshooting Guide

Common issues and solutions for OCI Generative AI Provider.

## Authentication Issues

### Error: "Authentication failed"

**Symptoms:**
```
Error: Authentication failed
```

**Causes:**
- Invalid OCI config file
- Missing API key file
- Incorrect fingerprint
- Missing environment variables

**Solutions:**

1. **Verify config file exists:**
   ```bash
   cat ~/.oci/config
   ```

2. **Check file permissions:**
   ```bash
   chmod 600 ~/.oci/config
   chmod 600 ~/.oci/oci_api_key.pem
   ```

3. **Verify fingerprint:**
   ```bash
   openssl rsa -pubout -outform DER -in ~/.oci/oci_api_key.pem | \
     openssl md5 -c | \
     awk '{print $2}'
   ```

4. **Check environment variables:**
   ```bash
   echo $OCI_CONFIG_PROFILE
   echo $OCI_COMPARTMENT_ID
   ```

5. **Test OCI CLI:**
   ```bash
   oci iam region list
   ```

### Error: "Compartment not found"

**Symptoms:**
```
Error: Compartment ocid1.compartment... not found
```

**Solutions:**

1. **Verify compartment exists:**
   ```bash
   oci iam compartment get --compartment-id <OCID>
   ```

2. **Check permissions:**
   ```bash
   # Ensure user has access to compartment
   oci iam policy list --compartment-id <TENANCY_OCID>
   ```

3. **Use correct compartment ID:**
   ```typescript
   // Ensure you're using the right compartment
   const provider = createOCI({
     compartmentId: 'ocid1.compartment.oc1..correct-id',
   });
   ```

## Model Issues

### Error: "Invalid model ID"

**Symptoms:**
```
Error: Invalid model ID: my-model
```

**Solutions:**

1. **Check available models:**
   ```typescript
   import { getAllModels } from '@acedergren/oci-genai-provider';

   const models = getAllModels();
   console.log(models.map(m => m.id));
   ```

2. **Use correct model ID format:**
   ```typescript
   // Correct
   oci.languageModel('cohere.command-r-plus');

   // Wrong
   oci.languageModel('command-r-plus'); // Missing family prefix
   ```

3. **Verify model type:**
   ```typescript
   // Language models
   oci.languageModel('cohere.command-r-plus');

   // Embedding models
   oci.embeddingModel('cohere.embed-multilingual-v3.0');
   ```

### Error: "Model not available in region"

**Symptoms:**
```
Error: Model not available in region eu-frankfurt-1
```

**Solutions:**

1. **Check model availability:**
   - All language models: Available in all regions
   - Speech/Transcription: Only `us-phoenix-1`

2. **Use correct region for speech:**
   ```typescript
   oci.speechModel('oci-tts-standard', {
     region: 'us-phoenix-1', // Required
   });
   ```

3. **Check OCI documentation:**
   Visit [OCI Service Availability](https://docs.oracle.com/iaas/Content/General/Concepts/serviceavailability.htm)

## Regional Issues

### Error: "Speech services not available in this region"

**Symptoms:**
```
Error: Speech services are only available in us-phoenix-1
```

**Solution:**

Always use `us-phoenix-1` for speech and transcription:

```typescript
const provider = createOCI({
  region: 'us-phoenix-1', // Required for speech
});

const speechModel = provider.speechModel('oci-tts-standard');
const transcriptionModel = provider.transcriptionModel('oci-stt-standard');
```

### Error: "Region not configured"

**Symptoms:**
```
Error: Region must be specified
```

**Solutions:**

1. **Set region in config:**
   ```typescript
   const provider = createOCI({
     region: 'us-phoenix-1',
   });
   ```

2. **Set environment variable:**
   ```bash
   export OCI_REGION=us-phoenix-1
   ```

3. **Add to OCI config file:**
   ```ini
   [DEFAULT]
   region=us-phoenix-1
   ```

## Network Issues

### Error: "Connection timeout"

**Symptoms:**
```
Error: Request timeout after 30000ms
```

**Solutions:**

1. **Increase timeout:**
   ```typescript
   oci.languageModel('cohere.command-r-plus', {
     requestOptions: {
       timeoutMs: 60000, // 60 seconds
     },
   });
   ```

2. **Check network connectivity:**
   ```bash
   ping inference.generativeai.us-phoenix-1.oci.oraclecloud.com
   ```

3. **Check firewall rules:**
   - Allow outbound HTTPS (443)
   - Allow access to `*.oraclecloud.com`

### Error: "Rate limit exceeded"

**Symptoms:**
```
Error: Rate limit exceeded. Retry after 60 seconds
```

**Solutions:**

1. **Implement retry logic:**
   ```typescript
   import { RateLimitError } from '@acedergren/oci-genai-provider';

   try {
     await generateText({ model, prompt });
   } catch (error) {
     if (error instanceof RateLimitError) {
       const retryAfter = error.retryAfter || 60;
       await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
       // Retry request
     }
   }
   ```

2. **Enable automatic retry:**
   ```typescript
   oci.languageModel('cohere.command-r-plus', {
     requestOptions: {
       retry: {
         enabled: true,
         maxRetries: 3,
       },
     },
   });
   ```

3. **Request rate limit increase:**
   - Contact OCI support
   - Request service limit increase

## Streaming Issues

### Error: "Stream connection closed unexpectedly"

**Symptoms:**
- Incomplete responses
- Stream ends abruptly
- Connection reset errors

**Solutions:**

1. **Handle stream errors:**
   ```typescript
   const result = streamText({
     model: oci.languageModel('cohere.command-r-plus'),
     prompt: 'Write a story',
   });

   try {
     for await (const chunk of result.textStream) {
       process.stdout.write(chunk);
     }
   } catch (error) {
     console.error('Stream error:', error);
     // Handle error
   }
   ```

2. **Increase timeout:**
   ```typescript
   oci.languageModel('cohere.command-r-plus', {
     requestOptions: {
       timeoutMs: 120000, // 2 minutes for long responses
     },
   });
   ```

3. **Check network stability:**
   - Use wired connection instead of WiFi
   - Avoid VPNs that may drop connections

## Embedding Issues

### Error: "Batch size exceeds maximum"

**Symptoms:**
```
Error: Batch size (100) exceeds maximum allowed (96)
```

**Solution:**

Batch embeddings in groups of 96 or less:

```typescript
const texts = [...]; // 100+ texts

// Split into batches of 96
const batchSize = 96;
const batches = [];

for (let i = 0; i < texts.length; i += batchSize) {
  const batch = texts.slice(i, i + batchSize);
  batches.push(batch);
}

// Embed each batch
for (const batch of batches) {
  const { embeddings } = await embedMany({
    model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
    values: batch,
  });
  // Process embeddings
}
```

### Error: "Text exceeds maximum length"

**Symptoms:**
```
Error: Input text exceeds 512 tokens
```

**Solutions:**

1. **Use truncation:**
   ```typescript
   oci.embeddingModel('cohere.embed-multilingual-v3.0', {
     truncate: 'END', // Truncate from end
   });
   ```

2. **Split long texts:**
   ```typescript
   function splitText(text: string, maxLength: number): string[] {
     const chunks = [];
     for (let i = 0; i < text.length; i += maxLength) {
       chunks.push(text.slice(i, i + maxLength));
     }
     return chunks;
   }
   ```

## TypeScript Issues

### Error: "Type 'OCIProvider' is not assignable..."

**Symptoms:**
```
Type 'OCIProvider' is not assignable to type 'ProviderV1'
```

**Solutions:**

1. **Update AI SDK:**
   ```bash
   npm install ai@^6.0.0
   ```

2. **Update TypeScript:**
   ```bash
   npm install -D typescript@^5.6.0
   ```

3. **Check tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "strict": true
     }
   }
   ```

## Build Issues

### Error: "Cannot find module '@acedergren/oci-genai-provider'"

**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

2. **Clear build cache:**
   ```bash
   pnpm build
   rm -rf dist
   pnpm build
   ```

3. **Check package.json:**
   ```json
   {
     "dependencies": {
       "@acedergren/oci-genai-provider": "^2.0.0",
       "ai": "^6.0.0"
     }
   }
   ```

## Getting More Help

If your issue isn't covered here:

1. **Check documentation:**
   - [API Reference](./api-reference.md)
   - [Configuration Guide](./configuration.md)
   - [Migration Guide](./migration.md)

2. **Search existing issues:**
   - [GitHub Issues](https://github.com/acedergren/opencode-oci-genai/issues)

3. **Create a new issue:**
   - Include error messages
   - Provide minimal reproduction
   - Share environment details (Node.js version, OS, etc.)

4. **Check OCI status:**
   - [OCI Service Health](https://ocistatus.oraclecloud.com/)

## Debug Mode

Enable debug logging:

```typescript
// Set environment variable
process.env.DEBUG = 'oci-genai:*';

// Or in code
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI({
  // Config
});
```

This will output detailed logs to help diagnose issues.
```

**Step 2: Commit**

```bash
git add docs/troubleshooting.md
git commit -m "docs: create comprehensive troubleshooting guide"
```

---

## Task 6: Add JSDoc Comments to Public APIs

**Files:**
- Modify: `packages/oci-genai-provider/src/provider.ts`
- Modify: `packages/oci-genai-provider/src/index.ts`
- Modify: `packages/oci-genai-provider/src/types.ts`

**Step 1: Add JSDoc to provider.ts**

Modify `packages/oci-genai-provider/src/provider.ts`:

```typescript
/**
 * OCI Provider implementing ProviderV3 interface
 *
 * Supports language models, embeddings, speech, transcription, and reranking
 *
 * @example
 * ```typescript
 * const provider = new OCIProvider({
 *   region: 'us-phoenix-1',
 *   compartmentId: 'ocid1.compartment...',
 * });
 *
 * const model = provider.languageModel('cohere.command-r-plus');
 * ```
 */
export class OCIProvider implements ProviderV3 {
  readonly specificationVersion = 'v3' as const;

  /**
   * Create a new OCI provider instance
   *
   * @param config - Base configuration for all model types
   */
  constructor(private config: OCIBaseConfig = {}) {}

  /**
   * Create a language model instance
   *
   * @param modelId - Model identifier (e.g., 'cohere.command-r-plus')
   * @param settings - Language model configuration
   * @returns Language model instance
   *
   * @example
   * ```typescript
   * const model = provider.languageModel('cohere.command-r-plus', {
   *   requestOptions: { timeoutMs: 60000 },
   * });
   * ```
   */
  languageModel(
    modelId: string,
    settings?: OCILanguageModelSettings
  ): LanguageModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCILanguageModel(modelId, mergedConfig);
  }

  /**
   * Create an embedding model instance
   *
   * @param modelId - Embedding model identifier (e.g., 'cohere.embed-multilingual-v3.0')
   * @param settings - Embedding configuration
   * @returns Embedding model instance
   *
   * @example
   * ```typescript
   * const model = provider.embeddingModel('cohere.embed-multilingual-v3.0', {
   *   truncate: 'END',
   *   inputType: 'DOCUMENT',
   * });
   * ```
   */
  embeddingModel(
    modelId: string,
    settings?: OCIEmbeddingSettings
  ): EmbeddingModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCIEmbeddingModel(modelId, mergedConfig);
  }

  /**
   * Create a speech model instance (TTS)
   *
   * @param modelId - Speech model identifier
   * @param settings - Speech configuration
   * @returns Speech model instance
   *
   * @example
   * ```typescript
   * const model = provider.speechModel('oci-tts-standard', {
   *   voice: 'en-US-Standard-A',
   *   region: 'us-phoenix-1',
   * });
   * ```
   *
   * @remarks
   * Speech services are only available in us-phoenix-1 region
   */
  speechModel(
    modelId: string,
    settings?: OCISpeechSettings
  ): SpeechModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCISpeechModel(modelId, mergedConfig);
  }

  /**
   * Create a transcription model instance (STT)
   *
   * @param modelId - Transcription model identifier
   * @param settings - Transcription configuration
   * @returns Transcription model instance
   *
   * @example
   * ```typescript
   * const model = provider.transcriptionModel('oci-stt-standard', {
   *   language: 'en',
   *   region: 'us-phoenix-1',
   * });
   * ```
   *
   * @remarks
   * Transcription services are only available in us-phoenix-1 region
   */
  transcriptionModel(
    modelId: string,
    settings?: OCITranscriptionSettings
  ): TranscriptionModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCITranscriptionModel(modelId, mergedConfig);
  }

  /**
   * Create a reranking model instance
   *
   * @param modelId - Reranking model identifier (e.g., 'cohere.rerank-v3.0')
   * @param settings - Reranking configuration
   * @returns Reranking model instance
   *
   * @example
   * ```typescript
   * const model = provider.rerankingModel('cohere.rerank-v3.0', {
   *   topN: 5,
   * });
   * ```
   */
  rerankingModel(
    modelId: string,
    settings?: OCIRerankingSettings
  ): RerankingModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCIRerankingModel(modelId, mergedConfig);
  }

  /**
   * Image generation is not supported by OCI
   *
   * @throws {NoSuchModelError} Always throws - no OCI image generation service
   */
  imageModel(modelId: string): ImageModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'imageModel',
      message: 'OCI does not provide image generation models',
    });
  }
}
```

**Step 2: Commit**

```bash
git add src/provider.ts
git commit -m "docs: add JSDoc comments to OCIProvider class"
```

---

## Task 7: Update Example README Files

**Files:**
- Create: `examples/chatbot-demo/README.md`
- Create: `examples/nextjs-chatbot/README.md`
- Create: `examples/rag-demo/README.md`
- Create: `examples/speech-demo/README.md`
- Create: `examples/transcription-demo/README.md`
- Create: `examples/reranking-demo/README.md`

**Step 1: Create chatbot-demo README**

Create: `examples/chatbot-demo/README.md`

```markdown
# Chatbot Demo - SvelteKit

Full-featured chatbot using OCI Generative AI with streaming responses.

## Features

- Real-time streaming responses
- Multiple model support
- Modern SvelteKit UI
- Message history
- Error handling

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure OCI credentials:
   ```bash
   export OCI_CONFIG_PROFILE=DEFAULT
   export OCI_COMPARTMENT_ID=ocid1.compartment...
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```

4. Open http://localhost:5173

## Usage

1. Select a model from the dropdown
2. Type your message
3. Watch the AI respond in real-time

## Models

Supports all OCI language models:
- Cohere Command R+
- Meta Llama 3.3 70B
- Anthropic Claude 3.5 Sonnet
- And more...

## Code Structure

```
src/
├── routes/
│   ├── +page.svelte        # Chat UI
│   └── api/
│       └── chat/
│           └── +server.ts  # API endpoint
```

## API Endpoint

The chat API endpoint streams responses:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export async function POST({ request }) {
  const { messages, modelId } = await request.json();

  const result = streamText({
    model: oci.languageModel(modelId),
    messages,
  });

  return result.toDataStreamResponse();
}
```

## Learn More

- [OCI GenAI Provider](../../packages/oci-genai-provider)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [SvelteKit](https://kit.svelte.dev)
```

**Step 2: Create other example READMEs**

Create: `examples/rag-demo/README.md`

```markdown
# RAG Demo - Retrieval Augmented Generation

Simple RAG implementation using OCI embeddings for semantic search.

## Features

- Text embedding generation
- Cosine similarity search
- Batch embedding support
- Multiple embedding models

## Setup

```bash
pnpm install
export OCI_COMPARTMENT_ID=ocid1.compartment...
pnpm start
```

## How It Works

1. Documents are converted to embeddings
2. Query is embedded using the same model
3. Cosine similarity finds most relevant documents
4. Results ranked by similarity score

## Models

- `cohere.embed-multilingual-v3.0` - 1024 dimensions, multilingual
- `cohere.embed-english-v3.0` - 1024 dimensions, English
- `cohere.embed-english-light-v3.0` - 384 dimensions, fast

## Example Output

```
📚 Documents:
  1. The capital of France is Paris.
  2. Python is a popular programming language.
  3. The Pacific Ocean is the largest ocean.
  4. Claude is an AI assistant made by Anthropic.

🔍 Query: "What is the largest ocean?"

📊 Results:
  1. [23.5%] The capital of France is Paris.
  2. [18.2%] Python is a popular programming language.
  3. [91.7%] The Pacific Ocean is the largest ocean.
  4. [15.3%] Claude is an AI assistant made by Anthropic.

🎯 Best match: "The Pacific Ocean is the largest ocean."
```

## Learn More

- [Embeddings Guide](../../packages/oci-genai-provider/docs/embeddings.md)
- [RAG Best Practices](https://docs.oracle.com/iaas/Content/generative-ai/use-cases/rag.htm)
```

**Step 3: Commit**

```bash
git add examples/*/README.md
git commit -m "docs: add comprehensive README files for all examples"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm test` - All documentation tests pass
- [ ] Main README documents all model types
- [ ] API reference is complete and accurate
- [ ] Configuration guide covers all auth methods
- [ ] Migration guide has step-by-step instructions
- [ ] Troubleshooting guide covers common issues
- [ ] JSDoc comments added to all public APIs
- [ ] All examples have README files
- [ ] Regional availability documented (Phoenix for speech)
- [ ] All docs are accurate and tested

---

## Next Steps

**Plan 6 Complete!** 🎉

Documentation is now comprehensive. Consider:

- **Plan 7**: Performance optimization and monitoring
- **Plan 8**: Advanced features (caching, rate limiting)
- **Release**: Publish v2.0.0 to npm

All documentation should be reviewed and updated regularly as new features are added.
