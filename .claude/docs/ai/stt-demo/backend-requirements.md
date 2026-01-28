# Backend Requirements: Speech-to-Text Demo

> 📌 **See Also**: [Common Backend Questions](../BACKEND_QUESTIONS.md) — Shared questions across all demos to avoid duplication

## Context

A **speech transcription demo** that converts audio files to text. Supports multiple audio formats and models, with optional language specification and custom vocabulary support. Designed to showcase OCI Speech service capabilities.

---

## Core Functionality

### Audio Transcription

**Purpose**: Convert audio file to text transcription

**Data I need to handle**:

1. **Audio File Input**
   - File path (CLI argument or default)
   - File format (WAV, MP3, FLAC, OGG, M4A, WEBM)
   - Audio data as Uint8Array or buffer

2. **Model Selection**
   - Which transcription model to use
   - Model-specific options (language, custom vocabulary, etc.)

3. **Transcription Configuration**
   - Language code (e.g., en-US, es-ES, fr-FR)
   - Custom vocabulary (optional, model-dependent)
   - Other model-specific settings

4. **Transcription Output**
   - Transcribed text
   - Detected language (if applicable)
   - Confidence score (if available)
   - Additional metadata

**Actions**:
- **Specify audio file** → Load file as buffer
- **Select model** → Choose transcription model
- **Set language** → Specify or detect language
- **Transcribe** → Send to model → Receive text → Display

**States**:
- **Ready**: Audio file loaded, waiting for transcription
- **Processing**: Model processing audio
- **Complete**: Transcription done, display result
- **Error**: File not found, unsupported format, invalid model, API error

---

## Supported Audio Formats

**Current support**:
- WAV (recommended for quality)
- MP3
- FLAC
- OGG
- M4A (Whisper model only)
- WEBM (Whisper model only)

**Need to clarify**:
- Are all formats supported by all models?
- What's the recommended format for best accuracy?
- Are there audio quality requirements (sample rate, bitrate)?
- File size limits?

---

## Transcription Models

**Available models**:

### 1. OCI Speech Standard
- **ID**: `oci.speech.standard`
- **Languages**: 21 languages (English, Spanish, French, etc.)
- **Custom Vocabulary**: Supported
- **Multilingual**: No (language must be specified)

### 2. OCI Speech Whisper
- **ID**: `oci.speech.whisper`
- **Languages**: 99+ languages
- **Custom Vocabulary**: Not supported
- **Multilingual**: Yes (can detect language automatically)

**Questions**:
- Should I default to Standard or Whisper?
- What are the differences in accuracy/latency?
- When should users choose one over the other?
- Are there cost differences?

---

## Language Handling

### Explicit Language Specification

**Current behavior**: Accept language code (e.g., `en-US`)

**Need to define**:
- What language codes are accepted? (ISO 639-1, BCP 47, etc.)
- List of supported languages per model
- Default language if not specified

### Language Detection

**Whisper model capability**: Can detect language automatically

**Questions**:
- Should language detection be automatic or optional?
- When is auto-detection preferred vs. explicit specification?
- What's the detection accuracy?

---

## Custom Vocabulary (Standard Model Only)

**What it does**: Improves accuracy for domain-specific terms

**Need to clarify**:
- Format for custom vocabulary (list of terms, JSON, CSV?)
- How to pass vocabulary to the model?
- Limitations on vocabulary size?
- Performance impact?

**Questions**:
- Should custom vocabulary be optional CLI flag?
- Where should vocabulary come from (file, inline, env var)?
- What's the recommended vocabulary size for best results?

---

## Transcription Output

**Current display**:
- Transcribed text
- Detected language (if available)

**Need to clarify**:
- What metadata should be returned? (confidence score, alternative transcriptions, timing info?)
- Should punctuation/capitalization be added?
- Should paragraph breaks be detected?

**Output format options**:
- Plain text (current)
- JSON with metadata
- Timestamped segments (word/phrase timing)
- Alternative transcriptions

---

## Input/Output

### Input

**File specification**:
- File path as CLI argument: `pnpm start /path/to/audio.wav`
- Or default file: `pnpm start` → uses `sample-audio.wav`

**Configuration**:
- Model selection (env var `OCI_MODEL_ID`?)
- Language specification (env var or CLI flag?)
- Custom vocabulary (file path?)

### Output

**Display**:
- Transcribed text (stdout)
- Optional: detected language, confidence, metadata
- Optional: execution time, audio processing info

---

## Error Handling

**Scenarios**:
- File not found or not readable
- Unsupported audio format
- Invalid language code
- Invalid model selection
- Audio file corrupted
- Model API errors
- File too large or too long

**Need from backend**:
- Clear error messages for each scenario
- Should errors be JSON or human-readable?
- Should there be exit codes for scripting?

---

## Multilingual Demo

**Additional script**: `multilingual-demo.ts` exists

**Purpose**: Demonstrate language detection and transcription across multiple languages

**Need to define**:
- How does this differ from the main demo?
- Should it show language detection in action?
- Should it handle mixing of languages?

---

## Uncertainties

- [ ] **Format support** — Which formats work with which models?
- [ ] **Language list** — Canonical list of supported languages per model?
- [ ] **Default model** — Should Standard or Whisper be the default?
- [ ] **Auto-detection** — When should language be auto-detected vs. specified?
- [ ] **Vocabulary format** — How should custom vocabulary be formatted and passed?
- [ ] **Output options** — What metadata should be included in output?
- [ ] **File size limits** — Are there limits on audio file size or duration?
- [ ] **Performance** — What's typical transcription latency for different file sizes?
- [ ] **Quality** — What audio quality (sample rate, bitrate) is recommended?

---

## Questions for Backend

1. **Model Selection** — What's the recommended default: Standard or Whisper? When should users choose each?

2. **Language Support** — What's the canonical list of supported languages for each model? What format for language codes?

3. **Auto-Detection** — Should Whisper automatically detect language, or require explicit specification?

4. **Audio Format** — What's the recommended audio format for best accuracy? Are all formats supported by both models?

5. **Custom Vocabulary** — For the Standard model, what format should custom vocabulary use? How is it passed to the model?

6. **Output Metadata** — Should transcription results include confidence scores, alternative transcriptions, or timing information?

7. **File Limits** — Are there limits on file size, duration, or number of concurrent transcriptions?

8. **Multilingual Demo** — Should the demo handle multiple languages in a single file, or just demonstrate language detection across different files?

9. **Quality Guidance** — What audio quality (sample rate, bitrate, noise level) is recommended for accurate transcription?

---

## Discussion Log

*Awaiting backend feedback.*

---

## Notes

This demo showcases a practical AI capability—converting speech to text. Keep the implementation straightforward: load audio, specify options, transcribe, display results. The multilingual aspect and custom vocabulary support are nice-to-haves for future iteration.
