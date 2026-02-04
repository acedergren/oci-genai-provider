# Plan 3: Speech Models (Text-to-Speech)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete text-to-speech (TTS) support using OCI Speech service with SpeechModelV3 interface.

**Architecture:** Implement OCISpeechModel class that converts text to speech audio using OCI Speech service. Supports multiple voices and output formats (MP3, OGG, PCM).

**Tech Stack:** TypeScript, @ai-sdk/provider@^3.0.5, oci-aispeech SDK, Jest

**Important:** OCI Speech service is **only available in us-phoenix-1 region**.

---

## Prerequisites

**Required:**

- ✅ Plan 1 must be complete
- Provider implements ProviderV3 interface
- Shared utilities in `src/shared/` folder

---

## Dependencies

**Required:**

- `oci-aispeech`: ^3.5.0 (OCI AI Speech SDK)

**Update package.json:**

```json
{
  "dependencies": {
    "oci-aispeech": "^3.5.0"
  }
}
```

---

## Task 1: Update Dependencies

**Files:**

- Modify: `packages/oci-genai-provider/package.json`

**Step 1: Add oci-aispeech SDK**

```bash
cd packages/oci-genai-provider
pnpm add oci-aispeech@^3.5.0
```

**Step 2: Verify installation**

Run: `pnpm list oci-aispeech`
Expected: `oci-aispeech 3.5.0` or higher

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add oci-aispeech SDK dependency"
```

---

## Task 2: Create Speech Model Registry

**Files:**

- Create: `packages/oci-genai-provider/src/speech-models/registry.ts`
- Create: `packages/oci-genai-provider/src/speech-models/__tests__/registry.test.ts`

**Step 1: Write test for speech model registry**

Create: `packages/oci-genai-provider/src/speech-models/__tests__/registry.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  getSpeechModelMetadata,
  isValidSpeechModelId,
  getAllSpeechModels,
  getAllVoices,
} from '../registry';

describe('Speech Model Registry', () => {
  it('should validate OCI TTS model IDs', () => {
    expect(isValidSpeechModelId('oci.tts-1-hd')).toBe(true);
    expect(isValidSpeechModelId('oci.tts-1')).toBe(true);
    expect(isValidSpeechModelId('invalid-model')).toBe(false);
  });

  it('should return metadata for valid speech models', () => {
    const metadata = getSpeechModelMetadata('oci.tts-1-hd');

    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('oci.tts-1-hd');
    expect(metadata?.family).toBe('oci-speech');
    expect(metadata?.supportedFormats).toContain('mp3');
  });

  it('should return undefined for invalid model IDs', () => {
    const metadata = getSpeechModelMetadata('invalid-model');
    expect(metadata).toBeUndefined();
  });

  it('should list all speech models', () => {
    const models = getAllSpeechModels();

    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.family === 'oci-speech')).toBe(true);
  });

  it('should list all available voices', () => {
    const voices = getAllVoices();

    expect(voices.length).toBeGreaterThan(0);
    expect(voices).toContain('en-US-Neural2-A');
    expect(voices).toContain('en-US-Neural2-C');
  });

  it('should indicate Phoenix region requirement', () => {
    const metadata = getSpeechModelMetadata('oci.tts-1-hd');

    expect(metadata?.requiredRegion).toBe('us-phoenix-1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/speech-models/__tests__/registry.test.ts`
Expected: FAIL - "Cannot find module '../registry'"

**Step 3: Implement speech model registry**

Create: `packages/oci-genai-provider/src/speech-models/registry.ts`

```typescript
export interface SpeechModelMetadata {
  id: string;
  name: string;
  family: 'oci-speech';
  supportedFormats: ('mp3' | 'ogg' | 'pcm')[];
  supportedVoices: string[];
  maxTextLength: number;
  requiredRegion: 'us-phoenix-1';
}

/**
 * Available voices for OCI TTS
 * These are Neural2 voices from OCI Speech
 */
export const OCI_TTS_VOICES = [
  'en-US-Neural2-A', // Male
  'en-US-Neural2-C', // Female
  'en-US-Neural2-D', // Male
  'en-US-Neural2-E', // Female
  'en-US-Neural2-F', // Female
  'en-US-Neural2-G', // Female
  'en-US-Neural2-H', // Female
  'en-US-Neural2-I', // Male
  'en-US-Neural2-J', // Male
] as const;

export const SPEECH_MODELS: SpeechModelMetadata[] = [
  {
    id: 'oci.tts-1-hd',
    name: 'OCI TTS High Definition',
    family: 'oci-speech',
    supportedFormats: ['mp3', 'ogg', 'pcm'],
    supportedVoices: [...OCI_TTS_VOICES],
    maxTextLength: 5000,
    requiredRegion: 'us-phoenix-1',
  },
  {
    id: 'oci.tts-1',
    name: 'OCI TTS Standard',
    family: 'oci-speech',
    supportedFormats: ['mp3', 'ogg', 'pcm'],
    supportedVoices: [...OCI_TTS_VOICES],
    maxTextLength: 5000,
    requiredRegion: 'us-phoenix-1',
  },
];

export function isValidSpeechModelId(modelId: string): boolean {
  return SPEECH_MODELS.some((m) => m.id === modelId);
}

export function getSpeechModelMetadata(modelId: string): SpeechModelMetadata | undefined {
  return SPEECH_MODELS.find((m) => m.id === modelId);
}

export function getAllSpeechModels(): SpeechModelMetadata[] {
  return SPEECH_MODELS;
}

export function getAllVoices(): string[] {
  return [...OCI_TTS_VOICES];
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/speech-models/__tests__/registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/speech-models/
git commit -m "feat(speech): add speech model registry with Phoenix region requirement"
```

---

## Task 3: Implement OCISpeechModel Class

**Files:**

- Create: `packages/oci-genai-provider/src/speech-models/OCISpeechModel.ts`
- Create: `packages/oci-genai-provider/src/speech-models/__tests__/OCISpeechModel.test.ts`

**Step 1: Write test for OCISpeechModel**

Create: `packages/oci-genai-provider/src/speech-models/__tests__/OCISpeechModel.test.ts`

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCISpeechModel } from '../OCISpeechModel';
import type { SpeechModelV3CallOptions } from '@ai-sdk/provider';

// Mock OCI SDK
jest.mock('oci-aispeech');
jest.mock('../../auth');

describe('OCISpeechModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct specification version and provider', () => {
    const model = new OCISpeechModel('oci.tts-1-hd', {
      compartmentId: 'ocid1.compartment.test',
      region: 'us-phoenix-1',
    });

    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('oci.tts-1-hd');
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCISpeechModel('invalid-model', {});
    }).toThrow('Invalid speech model ID');
  });

  it('should throw error if region is not us-phoenix-1', () => {
    expect(() => {
      new OCISpeechModel('oci.tts-1-hd', {
        region: 'eu-frankfurt-1',
      });
    }).toThrow('OCI Speech is only available in us-phoenix-1 region');
  });

  it('should allow us-phoenix-1 region', () => {
    expect(() => {
      new OCISpeechModel('oci.tts-1-hd', {
        region: 'us-phoenix-1',
      });
    }).not.toThrow();
  });

  it('should validate text length does not exceed max', async () => {
    const model = new OCISpeechModel('oci.tts-1-hd', {
      compartmentId: 'test',
      region: 'us-phoenix-1',
    });

    const longText = 'a'.repeat(5001); // 5001 > 5000 max

    const options: SpeechModelV3CallOptions = {
      text: longText,
    };

    await expect(model.doGenerate(options)).rejects.toThrow(
      'Text length (5001) exceeds maximum allowed (5000)'
    );
  });

  it('should use default voice if none specified', () => {
    const model = new OCISpeechModel('oci.tts-1', {
      region: 'us-phoenix-1',
    });

    expect(model).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/speech-models/__tests__/OCISpeechModel.test.ts`
Expected: FAIL - "Cannot find module '../OCISpeechModel'"

**Step 3: Implement OCISpeechModel class**

Create: `packages/oci-genai-provider/src/speech-models/OCISpeechModel.ts`

```typescript
import { SpeechModelV3, SpeechModelV3CallOptions } from '@ai-sdk/provider';
import { AIServiceSpeechClient } from 'oci-aispeech';
import { createAuthProvider, getCompartmentId, getRegion } from '../auth';
import { getSpeechModelMetadata, isValidSpeechModelId } from './registry';
import type { OCISpeechSettings } from '../types';

export class OCISpeechModel implements SpeechModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';

  private _client?: AIServiceSpeechClient;

  constructor(
    readonly modelId: string,
    private config: OCISpeechSettings
  ) {
    // Validate model ID
    if (!isValidSpeechModelId(modelId)) {
      throw new Error(
        `Invalid speech model ID: ${modelId}. ` + `Valid models: oci.tts-1-hd, oci.tts-1`
      );
    }

    // Validate region (OCI Speech only available in Phoenix)
    const region = getRegion(config);
    if (region !== 'us-phoenix-1') {
      throw new Error(
        `OCI Speech is only available in us-phoenix-1 region. ` +
          `Current region: ${region}. Please set region to 'us-phoenix-1' in your config.`
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

  async doGenerate(options: SpeechModelV3CallOptions): Promise<{
    audio: string | Uint8Array;
    warnings: Array<{ type: string; message: string }>;
    request?: { body?: unknown };
    response: {
      timestamp: Date;
      modelId: string;
      headers?: Record<string, string | string[]>;
      body?: unknown;
    };
    providerMetadata?: Record<string, any>;
  }> {
    const { text, voice, outputFormat, speed } = options;
    const metadata = getSpeechModelMetadata(this.modelId);

    // Validate text length
    if (text.length > metadata!.maxTextLength) {
      throw new Error(
        `Text length (${text.length}) exceeds maximum allowed (${metadata!.maxTextLength})`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);

    // Determine voice (use config or option or default)
    const selectedVoice = voice || this.config.voice || 'en-US-Neural2-C';

    // Determine output format
    const selectedFormat = outputFormat || this.config.format || 'mp3';

    // Validate format
    if (!metadata!.supportedFormats.includes(selectedFormat as any)) {
      throw new Error(
        `Unsupported output format: ${selectedFormat}. ` +
          `Supported formats: ${metadata!.supportedFormats.join(', ')}`
      );
    }

    // Build OCI request
    const request = {
      synthesizeSpeechDetails: {
        text,
        compartmentId,
        configuration: {
          modelDetails: {
            modelName: this.modelId,
            voiceId: selectedVoice,
          },
          audioConfig: {
            format: selectedFormat.toUpperCase(),
            sampleRateHz: selectedFormat === 'pcm' ? 16000 : undefined,
          },
          speechSettings: {
            speechMarkTypes: [],
            ...(speed && { rate: speed.toString() }),
          },
        },
      },
    };

    const timestamp = new Date();

    // Call OCI API
    const response = await client.synthesizeSpeech(request);

    // Get audio data from response
    const audioData = response.value as Uint8Array;

    return {
      audio: audioData,
      warnings: [],
      request: {
        body: request,
      },
      response: {
        timestamp,
        modelId: this.modelId,
        body: {
          format: selectedFormat,
          voice: selectedVoice,
        },
      },
      providerMetadata: {
        'oci-speech': {
          voice: selectedVoice,
          format: selectedFormat,
        },
      },
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/speech-models/__tests__/OCISpeechModel.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/speech-models/OCISpeechModel.ts src/speech-models/__tests__/OCISpeechModel.test.ts
git commit -m "feat(speech): implement OCISpeechModel class with region validation"
```

---

## Task 4: Wire Up Speech Models to Provider

**Files:**

- Modify: `packages/oci-genai-provider/src/provider.ts`
- Modify: `packages/oci-genai-provider/src/__tests__/provider.test.ts`

**Step 1: Write test for provider.speechModel()**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
describe('OCIProvider - Speech', () => {
  it('should create speech model with us-phoenix-1 region', () => {
    const provider = new OCIProvider({ region: 'us-phoenix-1' });
    const model = provider.speechModel('oci.tts-1-hd');

    expect(model).toBeDefined();
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('oci.tts-1-hd');
  });

  it('should merge config with speech-specific settings', () => {
    const provider = new OCIProvider({ region: 'us-phoenix-1' });
    const model = provider.speechModel('oci.tts-1', {
      voice: 'en-US-Neural2-A',
      format: 'mp3',
    });

    expect(model).toBeDefined();
  });

  it('should throw for invalid speech model ID', () => {
    const provider = new OCIProvider({ region: 'us-phoenix-1' });

    expect(() => {
      provider.speechModel('invalid-model');
    }).toThrow('Invalid speech model ID');
  });

  it('should throw when region is not us-phoenix-1', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });

    expect(() => {
      provider.speechModel('oci.tts-1-hd');
    }).toThrow('OCI Speech is only available in us-phoenix-1 region');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: FAIL - "Speech models not yet implemented"

**Step 3: Update OCIProvider to wire up speech**

Modify `packages/oci-genai-provider/src/provider.ts`:

```typescript
import { OCISpeechModel } from './speech-models/OCISpeechModel';

export class OCIProvider implements ProviderV3 {
  // ... existing code ...

  /**
   * Create a speech model instance (TTS)
   *
   * IMPORTANT: OCI Speech is only available in us-phoenix-1 region.
   * You must configure the provider or model with region: 'us-phoenix-1'.
   */
  speechModel(modelId: string, settings?: OCISpeechSettings): SpeechModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCISpeechModel(modelId, mergedConfig);
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
git commit -m "feat(speech): wire up speech models to provider"
```

---

## Task 5: Export Speech Models from Index

**Files:**

- Modify: `packages/oci-genai-provider/src/index.ts`

**Step 1: Write test for exports**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
import { oci } from '../index';

describe('Speech Model Exports', () => {
  it('should create speech model from default oci instance', () => {
    const provider = new OCIProvider({ region: 'us-phoenix-1' });
    const model = provider.speechModel('oci.tts-1-hd');

    expect(model).toBeDefined();
    expect(model.modelId).toBe('oci.tts-1-hd');
  });
});
```

**Step 2: Run test to verify it works**

Run: `pnpm test`
Expected: PASS

**Step 3: Add speech exports to index.ts**

Modify `packages/oci-genai-provider/src/index.ts`:

```typescript
// Add to existing exports:

// Speech model exports
export { OCISpeechModel } from './speech-models/OCISpeechModel';
export {
  getSpeechModelMetadata,
  isValidSpeechModelId,
  getAllSpeechModels,
  getAllVoices,
} from './speech-models/registry';
export type { SpeechModelMetadata } from './speech-models/registry';
```

**Step 4: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat(speech): export speech models from index"
```

---

## Task 6: Create TTS Demo Example

**Files:**

- Create: `examples/tts-demo/`
- Create: `examples/tts-demo/index.ts`
- Create: `examples/tts-demo/package.json`

**Step 1: Create TTS demo package**

Create: `examples/tts-demo/package.json`

```json
{
  "name": "tts-demo",
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
    "tsx": "^4.19.2"
  }
}
```

**Step 2: Create TTS demo script**

Create: `examples/tts-demo/index.ts`

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateSpeech } from 'ai';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('🎙️  OCI Text-to-Speech Demo\n');

  // IMPORTANT: OCI Speech only works in us-phoenix-1 region
  const oci = createOCI({
    region: 'us-phoenix-1',
  });

  const textToSpeak =
    'Hello! This is Oracle Cloud Infrastructure Speech service converting text to natural sounding speech.';

  console.log(`📝 Text: "${textToSpeak}"\n`);

  // Example 1: Generate speech with default voice (female)
  console.log('🔊 Generating speech with default voice...');
  const result1 = await generateSpeech({
    model: oci.speechModel('oci.tts-1-hd'),
    text: textToSpeak,
  });

  // Save to file
  const outputPath1 = path.join(process.cwd(), 'output-default.mp3');
  await fs.writeFile(outputPath1, result1.audio);
  console.log(`✅ Saved to: ${outputPath1}\n`);

  // Example 2: Generate speech with male voice
  console.log('🔊 Generating speech with male voice...');
  const result2 = await generateSpeech({
    model: oci.speechModel('oci.tts-1-hd', {
      voice: 'en-US-Neural2-D',
      format: 'mp3',
    }),
    text: textToSpeak,
  });

  const outputPath2 = path.join(process.cwd(), 'output-male.mp3');
  await fs.writeFile(outputPath2, result2.audio);
  console.log(`✅ Saved to: ${outputPath2}\n`);

  // Example 3: Generate speech with custom speed
  console.log('🔊 Generating speech with 1.5x speed...');
  const result3 = await generateSpeech({
    model: oci.speechModel('oci.tts-1'),
    text: textToSpeak,
    speed: 1.5,
  });

  const outputPath3 = path.join(process.cwd(), 'output-fast.mp3');
  await fs.writeFile(outputPath3, result3.audio);
  console.log(`✅ Saved to: ${outputPath3}\n`);

  // Example 4: Generate speech in OGG format
  console.log('🔊 Generating speech in OGG format...');
  const result4 = await generateSpeech({
    model: oci.speechModel('oci.tts-1-hd', {
      format: 'ogg',
    }),
    text: textToSpeak,
  });

  const outputPath4 = path.join(process.cwd(), 'output.ogg');
  await fs.writeFile(outputPath4, result4.audio);
  console.log(`✅ Saved to: ${outputPath4}\n`);

  console.log('🎉 Demo complete!');
  console.log('\nℹ️  Note: OCI Speech service is only available in us-phoenix-1 region.');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
```

**Step 3: Test TTS demo**

```bash
cd examples/tts-demo
pnpm install
pnpm start
```

Expected: Demo runs and creates audio files

**Step 4: Commit**

```bash
git add examples/tts-demo/
git commit -m "feat(speech): add TTS demo example with multiple voices"
```

---

## Task 7: Update Documentation

**Files:**

- Modify: `packages/oci-genai-provider/README.md`
- Create: `docs/speech-tts.md`

**Step 1: Add speech section to README**

Add to `packages/oci-genai-provider/README.md`:

```markdown
## Text-to-Speech (TTS)

Generate natural sounding speech from text:

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateSpeech } from 'ai';
import fs from 'fs/promises';

// IMPORTANT: OCI Speech only available in us-phoenix-1
const oci = createOCI({ region: 'us-phoenix-1' });

const result = await generateSpeech({
model: oci.speechModel('oci.tts-1-hd'),
text: 'Hello, this is a text-to-speech demo.',
});

await fs.writeFile('output.mp3', result.audio);
\`\`\`

### ⚠️ Region Limitation

**OCI Speech service is ONLY available in `us-phoenix-1` region.**

You must explicitly set the region:

\`\`\`typescript
// Correct - specify Phoenix region
const oci = createOCI({ region: 'us-phoenix-1' });

// Incorrect - will throw error
const oci = createOCI({ region: 'eu-frankfurt-1' });
\`\`\`

### Available Speech Models

| Model ID       | Quality         | Use Case                       |
| -------------- | --------------- | ------------------------------ |
| `oci.tts-1-hd` | High Definition | Production, high-quality audio |
| `oci.tts-1`    | Standard        | Development, faster generation |

### Speech Options

\`\`\`typescript
oci.speechModel('oci.tts-1-hd', {
voice: 'en-US-Neural2-A', // Male voice
format: 'mp3', // 'mp3' | 'ogg' | 'pcm'
speed: 1.0, // 0.5 to 2.0
});
\`\`\`

### Available Voices

**Male voices:**

- `en-US-Neural2-A`
- `en-US-Neural2-D`
- `en-US-Neural2-I`
- `en-US-Neural2-J`

**Female voices:**

- `en-US-Neural2-C` (default)
- `en-US-Neural2-E`
- `en-US-Neural2-F`
- `en-US-Neural2-G`
- `en-US-Neural2-H`
```

**Step 2: Create detailed TTS guide**

Create: `docs/speech-tts.md`

```markdown
# Text-to-Speech (TTS) Guide

## Overview

OCI Speech service converts text to natural sounding speech using neural voices.

## ⚠️ Critical Region Requirement

**OCI Speech is ONLY available in the `us-phoenix-1` region.**

This is a hard requirement from OCI. Attempts to use other regions will result in an error.

### Correct Configuration

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';

// Explicitly set Phoenix region
const oci = createOCI({
region: 'us-phoenix-1',
});

const model = oci.speechModel('oci.tts-1-hd');
\`\`\`

### Error Handling

If you forget to set the region or use the wrong region:

\`\`\`typescript
const oci = createOCI({ region: 'eu-frankfurt-1' });
const model = oci.speechModel('oci.tts-1-hd');
// ❌ Throws: "OCI Speech is only available in us-phoenix-1 region"
\`\`\`

## Quick Start

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateSpeech } from 'ai';
import fs from 'fs/promises';

const oci = createOCI({ region: 'us-phoenix-1' });

const result = await generateSpeech({
model: oci.speechModel('oci.tts-1-hd'),
text: 'Hello world!',
});

await fs.writeFile('speech.mp3', result.audio);
\`\`\`

## Voice Selection

### Default Voice

If no voice is specified, `en-US-Neural2-C` (female) is used.

### All Available Voices

**Male:**

- `en-US-Neural2-A` - Warm, conversational
- `en-US-Neural2-D` - Clear, professional
- `en-US-Neural2-I` - Young, energetic
- `en-US-Neural2-J` - Deep, authoritative

**Female:**

- `en-US-Neural2-C` - Natural, friendly (default)
- `en-US-Neural2-E` - Calm, soothing
- `en-US-Neural2-F` - Professional, articulate
- `en-US-Neural2-G` - Bright, upbeat
- `en-US-Neural2-H` - Mature, confident

## Output Formats

### Supported Formats

| Format | Extension | Use Case                   |
| ------ | --------- | -------------------------- |
| MP3    | `.mp3`    | General use, web playback  |
| OGG    | `.ogg`    | Open source, web streaming |
| PCM    | `.pcm`    | Raw audio, processing      |

### Format Examples

\`\`\`typescript
// MP3 (default)
oci.speechModel('oci.tts-1-hd', { format: 'mp3' });

// OGG
oci.speechModel('oci.tts-1-hd', { format: 'ogg' });

// PCM (16kHz sample rate)
oci.speechModel('oci.tts-1-hd', { format: 'pcm' });
\`\`\`

## Speed Control

Control speech rate from 0.5x (slow) to 2.0x (fast):

\`\`\`typescript
await generateSpeech({
model: oci.speechModel('oci.tts-1'),
text: 'This will be spoken slowly.',
speed: 0.75, // 75% speed
});
\`\`\`

## Limits

- **Max text length:** 5000 characters
- **Region:** us-phoenix-1 only
- **Concurrent requests:** Subject to OCI service limits

## Best Practices

1. **Always set region to us-phoenix-1**
2. Choose appropriate voice for your audience
3. Use HD model for production
4. Test with different voices to find best fit
5. Handle errors gracefully

## Examples

See `examples/tts-demo/` for complete working examples.
```

**Step 3: Commit**

```bash
git add README.md docs/speech-tts.md
git commit -m "docs(speech): add comprehensive TTS documentation with region warnings"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm test` - All speech tests pass
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm build` - Build succeeds
- [ ] TTS demo works: `cd examples/tts-demo && pnpm start`
- [ ] Speech model registry returns correct metadata
- [ ] `oci.speechModel()` creates valid models
- [ ] Region validation enforces us-phoenix-1
- [ ] Text length validation works (max 5000)
- [ ] Documentation emphasizes region requirement
- [ ] Audio files are generated correctly

---

## Next Steps

**Plan 3 Complete!** 🎉

Text-to-Speech is now fully functional. Continue with:

- **Plan 4**: Transcription Models (STT) - Can run in parallel
- **Plan 5**: Reranking Models - Can run in parallel

Plans 4-5 are independent and can be implemented in any order.
