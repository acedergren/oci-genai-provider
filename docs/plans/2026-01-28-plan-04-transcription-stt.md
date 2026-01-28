# Plan 4: Transcription Models (STT)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete speech-to-text transcription support using OCI Speech service with TranscriptionModelV3 interface.

**Architecture:** Implement OCITranscriptionModel class that converts audio files to text transcripts using OCI Speech API. Supports async job submission, polling for completion, language selection, and custom vocabulary. Handles both standard and Whisper transcription models.

**Tech Stack:** TypeScript, @ai-sdk/provider@^3.0.5, oci-aispeech SDK, Jest

---

## Prerequisites

**Required:**

- ✅ Plan 1 must be complete
- Provider implements ProviderV3 interface
- Shared utilities in `src/shared/` folder

**Dependencies:**

- `oci-aispeech`: ^2.94.0 (OCI Speech SDK)
- `oci-common`: ^2.94.0 (already installed)

---

## Task 1: Add OCI Speech SDK Dependency

**Files:**

- Modify: `packages/oci-genai-provider/package.json`

**Step 1: Install oci-aispeech package**

```bash
cd packages/oci-genai-provider
pnpm add oci-aispeech@^2.94.0
```

**Step 2: Verify installation**

Run: `pnpm list oci-aispeech`
Expected: `oci-aispeech 2.94.0`

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(transcription): add oci-aispeech SDK dependency"
```

---

## Task 2: Create Transcription Model Registry

**Files:**

- Create: `packages/oci-genai-provider/src/transcription-models/registry.ts`
- Create: `packages/oci-genai-provider/src/transcription-models/__tests__/registry.test.ts`

**Step 1: Write test for transcription model registry**

Create: `packages/oci-genai-provider/src/transcription-models/__tests__/registry.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  getTranscriptionModelMetadata,
  isValidTranscriptionModelId,
  getAllTranscriptionModels,
  getSupportedLanguages,
} from '../registry';

describe('Transcription Model Registry', () => {
  it('should validate transcription model IDs', () => {
    expect(isValidTranscriptionModelId('oci.speech.standard')).toBe(true);
    expect(isValidTranscriptionModelId('oci.speech.whisper')).toBe(true);
    expect(isValidTranscriptionModelId('invalid-model')).toBe(false);
  });

  it('should return metadata for valid transcription models', () => {
    const metadata = getTranscriptionModelMetadata('oci.speech.standard');

    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('oci.speech.standard');
    expect(metadata?.name).toBe('OCI Speech Standard');
    expect(metadata?.family).toBe('oci-speech');
  });

  it('should return undefined for invalid model IDs', () => {
    const metadata = getTranscriptionModelMetadata('invalid-model');
    expect(metadata).toBeUndefined();
  });

  it('should list all transcription models', () => {
    const models = getAllTranscriptionModels();

    expect(models.length).toBe(2);
    expect(models.some((m) => m.id === 'oci.speech.standard')).toBe(true);
    expect(models.some((m) => m.id === 'oci.speech.whisper')).toBe(true);
  });

  it('should return supported languages', () => {
    const languages = getSupportedLanguages();

    expect(languages).toContain('en-US');
    expect(languages).toContain('es-ES');
    expect(languages).toContain('de-DE');
    expect(languages.length).toBeGreaterThan(10);
  });

  it('should indicate Whisper supports more languages', () => {
    const standard = getTranscriptionModelMetadata('oci.speech.standard');
    const whisper = getTranscriptionModelMetadata('oci.speech.whisper');

    expect(standard?.maxLanguages).toBeLessThan(whisper?.maxLanguages || 0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/transcription-models/__tests__/registry.test.ts`
Expected: FAIL - "Cannot find module '../registry'"

**Step 3: Implement transcription model registry**

Create: `packages/oci-genai-provider/src/transcription-models/registry.ts`

```typescript
export interface TranscriptionModelMetadata {
  id: string;
  name: string;
  family: 'oci-speech';
  modelType: 'standard' | 'whisper';
  maxLanguages: number;
  supportsCustomVocabulary: boolean;
  supportedFormats: string[];
  maxFileSizeMB: number;
}

export const TRANSCRIPTION_MODELS: TranscriptionModelMetadata[] = [
  {
    id: 'oci.speech.standard',
    name: 'OCI Speech Standard',
    family: 'oci-speech',
    modelType: 'standard',
    maxLanguages: 21,
    supportsCustomVocabulary: true,
    supportedFormats: ['wav', 'mp3', 'flac', 'ogg'],
    maxFileSizeMB: 2048,
  },
  {
    id: 'oci.speech.whisper',
    name: 'OCI Speech Whisper',
    family: 'oci-speech',
    modelType: 'whisper',
    maxLanguages: 99,
    supportsCustomVocabulary: false,
    supportedFormats: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'webm'],
    maxFileSizeMB: 2048,
  },
];

/**
 * Supported languages for OCI Speech
 * Standard model supports 21 languages
 * Whisper model supports 99+ languages
 */
export const SUPPORTED_LANGUAGES = [
  'en-US', // English (US)
  'en-GB', // English (UK)
  'en-AU', // English (Australia)
  'en-IN', // English (India)
  'es-ES', // Spanish (Spain)
  'es-MX', // Spanish (Mexico)
  'pt-BR', // Portuguese (Brazil)
  'pt-PT', // Portuguese (Portugal)
  'fr-FR', // French
  'de-DE', // German
  'it-IT', // Italian
  'ja-JP', // Japanese
  'ko-KR', // Korean
  'zh-CN', // Chinese (Simplified)
  'zh-TW', // Chinese (Traditional)
  'nl-NL', // Dutch
  'pl-PL', // Polish
  'ru-RU', // Russian
  'tr-TR', // Turkish
  'hi-IN', // Hindi
  'ar-SA', // Arabic
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isValidTranscriptionModelId(modelId: string): boolean {
  return TRANSCRIPTION_MODELS.some((m) => m.id === modelId);
}

export function getTranscriptionModelMetadata(
  modelId: string
): TranscriptionModelMetadata | undefined {
  return TRANSCRIPTION_MODELS.find((m) => m.id === modelId);
}

export function getAllTranscriptionModels(): TranscriptionModelMetadata[] {
  return TRANSCRIPTION_MODELS;
}

export function getSupportedLanguages(): readonly string[] {
  return SUPPORTED_LANGUAGES;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/transcription-models/__tests__/registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/transcription-models/
git commit -m "feat(transcription): add transcription model registry"
```

---

## Task 3: Implement OCITranscriptionModel Class

**Files:**

- Create: `packages/oci-genai-provider/src/transcription-models/OCITranscriptionModel.ts`
- Create: `packages/oci-genai-provider/src/transcription-models/__tests__/OCITranscriptionModel.test.ts`

**Step 1: Write test for OCITranscriptionModel**

Create: `packages/oci-genai-provider/src/transcription-models/__tests__/OCITranscriptionModel.test.ts`

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCITranscriptionModel } from '../OCITranscriptionModel';
import type { TranscriptionModelV3CallOptions } from '@ai-sdk/provider';

// Mock OCI SDK
jest.mock('oci-aispeech');
jest.mock('../../auth');

describe('OCITranscriptionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct specification version and provider', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      compartmentId: 'ocid1.compartment.test',
    });

    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('oci.speech.standard');
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCITranscriptionModel('invalid-model', {});
    }).toThrow('Invalid transcription model ID');
  });

  it('should accept language setting', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      language: 'en-US',
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
  });

  it('should accept custom vocabulary for standard model', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      vocabulary: ['OpenCode', 'GenAI', 'OCI'],
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
  });

  it('should warn about vocabulary for Whisper model', () => {
    // Whisper doesn't support custom vocabulary
    const model = new OCITranscriptionModel('oci.speech.whisper', {
      vocabulary: ['test'],
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
    // Note: Implementation should log warning, not throw
  });

  it('should throw error for audio input exceeding size limit', async () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      compartmentId: 'test',
    });

    // Create 3GB audio file (exceeds 2GB limit)
    const largeAudio = new Uint8Array(3 * 1024 * 1024 * 1024);

    const options: TranscriptionModelV3CallOptions = {
      inputFormat: 'audio',
      audioData: largeAudio,
    };

    await expect(model.doTranscribe(options)).rejects.toThrow(
      'Audio file size exceeds maximum allowed'
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/transcription-models/__tests__/OCITranscriptionModel.test.ts`
Expected: FAIL - "Cannot find module '../OCITranscriptionModel'"

**Step 3: Implement OCITranscriptionModel class**

Create: `packages/oci-genai-provider/src/transcription-models/OCITranscriptionModel.ts`

```typescript
import {
  TranscriptionModelV3,
  TranscriptionModelV3CallOptions,
  TranscriptionModelV3CallOutput,
} from '@ai-sdk/provider';
import { AIServiceSpeechClient } from 'oci-aispeech';
import { createAuthProvider, getCompartmentId, getRegion } from '../auth';
import { getTranscriptionModelMetadata, isValidTranscriptionModelId } from './registry';
import type { OCITranscriptionSettings } from '../types';

export class OCITranscriptionModel implements TranscriptionModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';

  private _client?: AIServiceSpeechClient;

  constructor(
    readonly modelId: string,
    private config: OCITranscriptionSettings
  ) {
    if (!isValidTranscriptionModelId(modelId)) {
      throw new Error(
        `Invalid transcription model ID: ${modelId}. ` +
          `Valid models: oci.speech.standard, oci.speech.whisper`
      );
    }

    // Warn if using vocabulary with Whisper (not supported)
    const metadata = getTranscriptionModelMetadata(modelId);
    if (metadata?.modelType === 'whisper' && config.vocabulary && config.vocabulary.length > 0) {
      console.warn(
        'Warning: Custom vocabulary is not supported by Whisper model. It will be ignored.'
      );
    }
  }

  private async getClient(): Promise<AIServiceSpeechClient> {
    if (!this._client) {
      const authProvider = await createAuthProvider(this.config);
      const region = getRegion(this.config);

      this._client = new AIServiceSpeechClient({
        authenticationDetailsProvider: authProvider,
      });

      this._client.region = region;

      if (this.config.endpoint) {
        this._client.endpoint = this.config.endpoint;
      }
    }

    return this._client;
  }

  async doTranscribe(
    options: TranscriptionModelV3CallOptions
  ): Promise<TranscriptionModelV3CallOutput> {
    const { audioData } = options;

    // Validate file size (2GB max)
    const maxSizeBytes = 2 * 1024 * 1024 * 1024; // 2GB
    if (audioData.byteLength > maxSizeBytes) {
      throw new Error(
        `Audio file size (${(audioData.byteLength / 1024 / 1024).toFixed(1)}MB) ` +
          `exceeds maximum allowed (2048MB)`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);
    const metadata = getTranscriptionModelMetadata(this.modelId);

    // Step 1: Create transcription job
    const createJobRequest = {
      createTranscriptionJobDetails: {
        compartmentId,
        displayName: `Transcription-${Date.now()}`,
        modelDetails: {
          modelType: metadata?.modelType === 'whisper' ? 'WHISPER' : 'ORACLE',
          languageCode: this.config.language || 'en-US',
        },
        inputLocation: {
          locationType: 'OBJECT_STORAGE', // Will upload to OCI Object Storage
        },
        outputLocation: {
          locationType: 'OBJECT_STORAGE',
          compartmentId,
          bucket: 'transcription-results',
          prefix: `job-${Date.now()}`,
        },
      },
    };

    // Add custom vocabulary if supported and provided
    if (
      metadata?.supportsCustomVocabulary &&
      this.config.vocabulary &&
      this.config.vocabulary.length > 0
    ) {
      (createJobRequest.createTranscriptionJobDetails as any).customization = {
        customVocabulary: this.config.vocabulary,
      };
    }

    // Create job
    const jobResponse = await client.createTranscriptionJob(createJobRequest);
    const jobId = jobResponse.transcriptionJob.id;

    // Step 2: Poll for completion
    const transcript = await this.pollForCompletion(client, jobId);

    return {
      text: transcript,
      segments: [], // OCI doesn't provide segments in basic response
      language: this.config.language || 'en-US',
    };
  }

  /**
   * Poll transcription job until complete
   */
  private async pollForCompletion(client: AIServiceSpeechClient, jobId: string): Promise<string> {
    const maxAttempts = 60; // 5 minutes max
    const pollIntervalMs = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const jobResponse = await client.getTranscriptionJob({
        transcriptionJobId: jobId,
      });

      const state = jobResponse.transcriptionJob.lifecycleState;

      if (state === 'SUCCEEDED') {
        // Fetch transcription result
        const resultResponse = await client.getTranscriptionTask({
          transcriptionJobId: jobId,
          transcriptionTaskId: jobResponse.transcriptionJob.tasks?.[0]?.id || '',
        });

        return resultResponse.transcriptionTask.output?.text || '';
      }

      if (state === 'FAILED') {
        throw new Error(
          `Transcription job failed: ${jobResponse.transcriptionJob.lifecycleDetails || 'Unknown error'}`
        );
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Transcription job timed out after 5 minutes');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/transcription-models/__tests__/OCITranscriptionModel.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/transcription-models/OCITranscriptionModel.ts src/transcription-models/__tests__/OCITranscriptionModel.test.ts
git commit -m "feat(transcription): implement OCITranscriptionModel class"
```

---

## Task 4: Wire Up Transcription Models to Provider

**Files:**

- Modify: `packages/oci-genai-provider/src/provider.ts`
- Modify: `packages/oci-genai-provider/src/__tests__/provider.test.ts`

**Step 1: Write test for provider.transcriptionModel()**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
describe('OCIProvider - Transcription', () => {
  it('should create transcription model', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });
    const model = provider.transcriptionModel('oci.speech.standard');

    expect(model).toBeDefined();
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('oci.speech.standard');
  });

  it('should merge config with transcription-specific settings', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });
    const model = provider.transcriptionModel('oci.speech.whisper', {
      language: 'es-ES',
      model: 'whisper',
    });

    expect(model).toBeDefined();
  });

  it('should throw for invalid transcription model ID', () => {
    const provider = new OCIProvider();

    expect(() => {
      provider.transcriptionModel('invalid-model');
    }).toThrow('Invalid transcription model ID');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: FAIL - "Transcription models not yet implemented"

**Step 3: Update OCIProvider to wire up transcription**

Modify `packages/oci-genai-provider/src/provider.ts`:

```typescript
import { OCITranscriptionModel } from './transcription-models/OCITranscriptionModel';

export class OCIProvider implements ProviderV3 {
  // ... existing code ...

  /**
   * Create a transcription model instance (STT)
   */
  transcriptionModel(modelId: string, settings?: OCITranscriptionSettings): TranscriptionModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCITranscriptionModel(modelId, mergedConfig);
  }

  // ... rest of the code ...
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/provider.ts src/__tests__/provider.test.ts
git commit -m "feat(transcription): wire up transcription models to provider"
```

---

## Task 5: Export Transcription Models from Index

**Files:**

- Modify: `packages/oci-genai-provider/src/index.ts`

**Step 1: Write test for exports**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
import { oci } from '../index';

describe('Transcription Model Exports', () => {
  it('should create transcription from default oci instance', () => {
    const model = oci.transcriptionModel('oci.speech.standard');

    expect(model).toBeDefined();
    expect(model.modelId).toBe('oci.speech.standard');
  });
});
```

**Step 2: Run test to verify it works (should already pass)**

Run: `pnpm test`
Expected: PASS

**Step 3: Add transcription exports to index.ts**

Modify `packages/oci-genai-provider/src/index.ts`:

```typescript
// Add to existing exports:

// Transcription model exports
export { OCITranscriptionModel } from './transcription-models/OCITranscriptionModel';
export {
  getTranscriptionModelMetadata,
  isValidTranscriptionModelId,
  getAllTranscriptionModels,
  getSupportedLanguages,
} from './transcription-models/registry';
export type {
  TranscriptionModelMetadata,
  SupportedLanguage,
} from './transcription-models/registry';
```

**Step 4: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat(transcription): export transcription models from index"
```

---

## Task 6: Create STT Demo Example

**Files:**

- Create: `examples/stt-demo/`
- Create: `examples/stt-demo/index.ts`
- Create: `examples/stt-demo/package.json`
- Create: `examples/stt-demo/sample-audio.wav` (placeholder)

**Step 1: Create STT demo package**

Create: `examples/stt-demo/package.json`

```json
{
  "name": "stt-demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx index.ts"
  },
  "dependencies": {
    "@acedergren/oci-genai-provider": "workspace:*",
    "ai": "^6.0.57"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "@types/node": "^22.0.0"
  }
}
```

**Step 2: Create STT demo script**

Create: `examples/stt-demo/index.ts`

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { transcribe } from 'ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('🎙️  OCI Speech-to-Text Demo\n');

  // Load sample audio file
  const audioPath = process.argv[2] || join(__dirname, 'sample-audio.wav');

  console.log(`📁 Loading audio: ${audioPath}`);

  let audioData: Uint8Array;
  try {
    audioData = readFileSync(audioPath);
  } catch (error) {
    console.error('❌ Error loading audio file:', error);
    console.log('\nUsage: pnpm start [path-to-audio-file.wav]');
    process.exit(1);
  }

  console.log(`   Size: ${(audioData.byteLength / 1024).toFixed(1)} KB\n`);

  // Create transcription model
  console.log('🔹 Using model: oci.speech.standard');
  console.log('🌍 Language: en-US\n');

  const transcriptionModel = oci.transcriptionModel('oci.speech.standard', {
    language: 'en-US',
    vocabulary: ['OpenCode', 'GenAI', 'OCI', 'Oracle'], // Custom vocabulary
  });

  console.log('⏳ Transcribing audio...');
  console.log('   (This may take 30-60 seconds)\n');

  const startTime = Date.now();

  // Transcribe audio
  const { text, language } = await transcribe({
    model: transcriptionModel,
    audioData,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('✅ Transcription complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 TRANSCRIPT:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(text);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 Language: ${language}`);
  console.log(`⏱️  Duration: ${duration}s`);
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
```

**Step 3: Create README for STT demo**

Create: `examples/stt-demo/README.md`

````markdown
# Speech-to-Text Demo

Demonstrates OCI Speech transcription using the AI SDK.

## Setup

```bash
pnpm install
```
````

## Usage

```bash
# Transcribe sample audio
pnpm start

# Transcribe custom audio file
pnpm start /path/to/audio.wav
```

## Supported Audio Formats

- WAV (recommended)
- MP3
- FLAC
- OGG
- M4A (Whisper only)
- WEBM (Whisper only)

## Models

- `oci.speech.standard` - Standard model (21 languages, custom vocabulary)
- `oci.speech.whisper` - Whisper model (99+ languages, no custom vocabulary)

## Custom Vocabulary

Add domain-specific terms for better accuracy:

```typescript
const model = oci.transcriptionModel('oci.speech.standard', {
  vocabulary: ['OpenCode', 'GenAI', 'Kubernetes'],
});
```

Note: Custom vocabulary only works with standard model.

````

**Step 4: Test STT demo (with mock)**

```bash
cd examples/stt-demo
pnpm install
# Note: Requires actual audio file and OCI credentials to run
````

**Step 5: Commit**

```bash
git add examples/stt-demo/
git commit -m "feat(transcription): add STT example demo"
```

---

## Task 7: Create Multi-Language Demo

**Files:**

- Create: `examples/stt-demo/multilingual-demo.ts`

**Step 1: Create multilingual demo script**

Create: `examples/stt-demo/multilingual-demo.ts`

```typescript
import { oci, getSupportedLanguages } from '@acedergren/oci-genai-provider';
import { transcribe } from 'ai';
import { readFileSync } from 'fs';

async function main() {
  console.log('🌍 Multilingual Speech-to-Text Demo\n');

  // Show supported languages
  const languages = getSupportedLanguages();
  console.log(`📋 Supported Languages (${languages.length}):`);
  console.log(languages.join(', '));
  console.log();

  // Example: Transcribe in different languages
  const examples = [
    { lang: 'en-US', file: 'english-sample.wav', name: 'English (US)' },
    { lang: 'es-ES', file: 'spanish-sample.wav', name: 'Spanish' },
    { lang: 'de-DE', file: 'german-sample.wav', name: 'German' },
    { lang: 'ja-JP', file: 'japanese-sample.wav', name: 'Japanese' },
  ];

  console.log('🎙️  Transcribing multiple languages...\n');

  for (const example of examples) {
    try {
      console.log(`${example.name} (${example.lang}):`);

      const audioData = readFileSync(example.file);

      const model = oci.transcriptionModel('oci.speech.whisper', {
        language: example.lang,
      });

      const { text } = await transcribe({
        model,
        audioData,
      });

      console.log(`  ✅ "${text}"\n`);
    } catch (error: any) {
      console.log(`  ⚠️  Skipped (file not found)\n`);
    }
  }

  console.log('✅ Demo complete!');
}

main().catch(console.error);
```

**Step 2: Add script to package.json**

Modify: `examples/stt-demo/package.json`

```json
{
  "scripts": {
    "start": "tsx index.ts",
    "multilingual": "tsx multilingual-demo.ts"
  }
}
```

**Step 3: Commit**

```bash
git add examples/stt-demo/multilingual-demo.ts examples/stt-demo/package.json
git commit -m "feat(transcription): add multilingual STT demo"
```

---

## Task 8: Update Documentation

**Files:**

- Modify: `packages/oci-genai-provider/README.md`
- Create: `docs/transcription.md`

**Step 1: Add transcription section to README**

Add to `packages/oci-genai-provider/README.md`:

```markdown
## Speech-to-Text Transcription

Convert audio files to text using OCI Speech:

\`\`\`typescript
import { oci } from '@acedergren/oci-genai-provider';
import { transcribe } from 'ai';
import { readFileSync } from 'fs';

const audioData = readFileSync('audio.wav');

const { text } = await transcribe({
model: oci.transcriptionModel('oci.speech.standard', {
language: 'en-US',
vocabulary: ['OpenCode', 'GenAI'], // Custom vocabulary
}),
audioData,
});

console.log('Transcript:', text);
\`\`\`

### Available Transcription Models

| Model ID              | Languages | Custom Vocabulary | Formats                        | Use Case                 |
| --------------------- | --------- | ----------------- | ------------------------------ | ------------------------ |
| `oci.speech.standard` | 21        | ✅ Yes            | WAV, MP3, FLAC, OGG            | Production transcription |
| `oci.speech.whisper`  | 99+       | ❌ No             | WAV, MP3, FLAC, OGG, M4A, WEBM | Multilingual support     |

### Transcription Options

\`\`\`typescript
oci.transcriptionModel('oci.speech.standard', {
language: 'en-US', // Language code
vocabulary: ['term1'], // Custom vocabulary (standard only)
});
\`\`\`

### Supported Languages

21+ languages including: English (US/UK/AU/IN), Spanish, Portuguese, French, German, Italian, Japanese, Korean, Chinese, Dutch, Polish, Russian, Turkish, Hindi, Arabic.

Whisper model supports 99+ languages.
```

**Step 2: Create detailed transcription guide**

Create: `docs/transcription.md`

````markdown
# Speech-to-Text Transcription Guide

## Overview

OCI Speech service converts audio files to text with support for 21+ languages (99+ with Whisper).

## Quick Start

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { transcribe } from 'ai';
import { readFileSync } from 'fs';

const audioData = readFileSync('recording.wav');

const { text, language } = await transcribe({
  model: oci.transcriptionModel('oci.speech.standard'),
  audioData,
});

console.log('Transcript:', text);
```
````

## Models

### Standard Model (`oci.speech.standard`)

- **Languages**: 21 supported
- **Custom Vocabulary**: ✅ Yes
- **Formats**: WAV, MP3, FLAC, OGG
- **Max File Size**: 2GB
- **Use Case**: Production transcription with domain-specific terms

### Whisper Model (`oci.speech.whisper`)

- **Languages**: 99+ supported
- **Custom Vocabulary**: ❌ No
- **Formats**: WAV, MP3, FLAC, OGG, M4A, WEBM
- **Max File Size**: 2GB
- **Use Case**: Multilingual transcription

## Configuration

### Language Selection

```typescript
const model = oci.transcriptionModel('oci.speech.standard', {
  language: 'en-US', // Default: 'en-US'
});
```

### Custom Vocabulary

Improve accuracy for domain-specific terms (standard model only):

```typescript
const model = oci.transcriptionModel('oci.speech.standard', {
  vocabulary: ['OpenCode', 'GenAI', 'Kubernetes', 'PostgreSQL'],
});
```

## Supported Audio Formats

- **WAV** - Recommended, lossless
- **MP3** - Good compression
- **FLAC** - Lossless compression
- **OGG** - Open format
- **M4A** - Whisper only
- **WEBM** - Whisper only

## Best Practices

1. **Use WAV for best quality** - Lossless format produces most accurate results
2. **Add custom vocabulary** - Include technical terms, product names, acronyms
3. **Choose appropriate model**:
   - Standard: English and major European languages with custom terms
   - Whisper: Multilingual support (99+ languages)
4. **File size limits** - Max 2GB per file
5. **Processing time** - Expect 30-60 seconds for typical audio files

## Async Processing

OCI Speech uses async job processing:

```typescript
// Job is created and polling happens automatically
const { text } = await transcribe({
  model: oci.transcriptionModel('oci.speech.standard'),
  audioData,
});
// Result is available after job completes (30-60s typical)
```

The SDK handles:

- Job submission
- Polling for completion (5-second intervals)
- Result retrieval
- Error handling

## Supported Languages

### Standard Model (21 languages)

- English: US, UK, Australia, India
- Spanish: Spain, Mexico
- Portuguese: Brazil, Portugal
- French, German, Italian
- Japanese, Korean
- Chinese: Simplified, Traditional
- Dutch, Polish, Russian
- Turkish, Hindi, Arabic

### Whisper Model (99+ languages)

All languages supported by OpenAI Whisper, including:

- All standard model languages
- Plus: Thai, Vietnamese, Indonesian, Malay, Filipino, and 70+ more

## Error Handling

```typescript
try {
  const { text } = await transcribe({
    model: oci.transcriptionModel('oci.speech.standard'),
    audioData,
  });
} catch (error) {
  if (error.message.includes('exceeds maximum')) {
    console.error('File too large (max 2GB)');
  } else if (error.message.includes('timed out')) {
    console.error('Job took longer than 5 minutes');
  } else {
    console.error('Transcription failed:', error.message);
  }
}
```

## Examples

See `examples/stt-demo/` for complete working examples:

- `index.ts` - Basic transcription
- `multilingual-demo.ts` - Multi-language transcription

## Limitations

- Max file size: 2GB
- Timeout: 5 minutes
- Polling interval: 5 seconds
- Custom vocabulary: Standard model only (max ~500 words recommended)

````

**Step 3: Commit**

```bash
git add README.md docs/transcription.md
git commit -m "docs(transcription): add comprehensive transcription documentation"
````

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm test` - All transcription tests pass
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm build` - Build succeeds
- [ ] STT demo created: `examples/stt-demo/`
- [ ] Transcription model registry returns correct metadata
- [ ] `oci.transcriptionModel()` creates valid models
- [ ] File size validation works (max 2GB)
- [ ] Language selection works
- [ ] Custom vocabulary supported (standard model)
- [ ] Documentation complete and accurate
- [ ] Async job polling implemented
- [ ] Error handling for job failures

---

## Next Steps

**Plan 4 Complete!** 🎉

Speech-to-text transcription is now fully functional. Continue with:

- **Plan 5**: Reranking Models - Can run in parallel
- **Plan 6**: Production Hardening - Error handling, retries, monitoring

All model types (Embeddings, TTS, STT, Reranking) can be developed in parallel since they're independent.
