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
  language: 'en-US', // Default: "en-US"
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

Transcription jobs are processed asynchronously:

1. Submit audio file to create a job
2. Poll for job completion
3. Retrieve transcribed text when ready

The SDK handles all polling automatically.

## Error Handling

```typescript
try {
  const { text } = await transcribe({
    model: oci.transcriptionModel('oci.speech.standard'),
    audioData,
  });
} catch (error) {
  console.error('Transcription failed:', error.message);
}
```

## Examples

See `examples/stt-demo/` for:

- Basic transcription example
- Multilingual transcription
