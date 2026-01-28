# Additional Test Coverage Fixes

## FIX #4: Speech Model - Voice Fallback

**File**: `packages/oci-genai-provider/src/speech-models/__tests__/OCISpeechModel.test.ts`
**Uncovered Line**: 28
**Coverage**: 88.88% → Target: 95%+

### Missing Test

```typescript
describe('voice selection', () => {
  it('should use config voice if provided', async () => {
    const model = new OCISpeechModel('oci.tts-1-hd', {
      compartmentId: 'test',
      region: 'us-phoenix-1',
      voice: 'en-US-JennyNeural',
    });

    // Mock client and verify voice is used
    await model.doGenerate({ text: 'test' });
    // Assert: config.voice was used
  });

  it('should fallback to metadata default voice if config voice not provided', async () => {
    const model = new OCISpeechModel('oci.tts-1-hd', {
      compartmentId: 'test',
      region: 'us-phoenix-1',
      // No voice specified
    });

    await model.doGenerate({ text: 'test' });
    // Assert: metadata.defaultVoice was used
  });

  // ✅ MISSING TEST (line 28)
  it('should fallback to en-US-AriaNeural if both config and metadata voice are undefined', async () => {
    // Mock registry to return metadata with NO defaultVoice
    jest.mock('../registry', () => ({
      getSpeechModelMetadata: jest.fn().mockReturnValue({
        id: 'oci.tts-1-hd',
        family: 'oci-speech',
        defaultVoice: undefined,  // No default
      }),
      isValidSpeechModelId: jest.fn().mockReturnValue(true),
    }));

    const model = new OCISpeechModel('oci.tts-1-hd', {
      compartmentId: 'test',
      region: 'us-phoenix-1',
      // No voice in config
    });

    await model.doGenerate({ text: 'test' });
    // Assert: 'en-US-AriaNeural' was used as final fallback
  });
});
```

---

## FIX #5: SSE Parser Edge Cases

**File**: `packages/oci-genai-provider/src/shared/streaming/__tests__/sse-parser.test.ts`
**Uncovered Lines**: 41, 101
**Coverage**: 91.17% stmt, 63.63% branch → Target: 95%+ / 85%+

### Missing Tests

```typescript
describe('SSE Parser edge cases', () => {
  // ✅ MISSING TEST (line 41)
  it('should handle empty event data', () => {
    const parser = createSSEParser();
    const events: any[] = [];

    parser.onEvent = (event) => events.push(event);

    // Event with no data
    parser.feed('event: message\n\n');

    expect(events).toEqual([
      expect.objectContaining({
        type: 'message',
        data: '',  // Empty data
      }),
    ]);
  });

  it('should handle event with only whitespace data', () => {
    const parser = createSSEParser();
    const events: any[] = [];

    parser.onEvent = (event) => events.push(event);

    parser.feed('event: message\ndata:   \n\n');

    expect(events).toEqual([
      expect.objectContaining({
        type: 'message',
        data: '   ',  // Whitespace preserved
      }),
    ]);
  });

  // ✅ MISSING TEST (line 101)
  it('should parse error events correctly', () => {
    const parser = createSSEParser();
    const events: any[] = [];

    parser.onEvent = (event) => events.push(event);

    parser.feed('event: error\ndata: {"error":"Rate limit exceeded"}\n\n');

    expect(events).toEqual([
      expect.objectContaining({
        type: 'error',
        data: '{"error":"Rate limit exceeded"}',
      }),
    ]);
  });

  it('should handle malformed JSON in error events', () => {
    const parser = createSSEParser();
    const events: any[] = [];

    parser.onEvent = (event) => events.push(event);

    parser.feed('event: error\ndata: invalid json\n\n');

    expect(events).toEqual([
      expect.objectContaining({
        type: 'error',
        data: 'invalid json',  // Should not crash
      }),
    ]);
  });

  it('should handle multiple consecutive newlines', () => {
    const parser = createSSEParser();
    const events: any[] = [];

    parser.onEvent = (event) => events.push(event);

    parser.feed('event: message\ndata: test\n\n\n\n');

    expect(events).toHaveLength(1);
  });

  it('should handle mixed line endings (CRLF vs LF)', () => {
    const parser = createSSEParser();
    const events: any[] = [];

    parser.onEvent = (event) => events.push(event);

    // Mix of \r\n and \n
    parser.feed('event: message\r\ndata: test\n\n');

    expect(events).toHaveLength(1);
  });
});
```

---

## FIX #6: Language Model Converter Branch Coverage

**File**: `packages/oci-genai-provider/src/language-models/converters/__tests__/messages.test.ts`
**Uncovered Branch**: Line 39
**Coverage**: 100% stmt, 80% branch → Target: 100%

### Missing Test

```typescript
describe('convertToOCIMessages - all content types', () => {
  it('should convert text content', () => {
    const messages = [
      {
        role: 'user' as const,
        content: [{ type: 'text' as const, text: 'Hello' }],
      },
    ];

    const result = convertToOCIMessages(messages);

    expect(result).toEqual([
      {
        role: 'USER',
        content: [{ type: 'TEXT', text: 'Hello' }],
      },
    ]);
  });

  // ✅ MISSING TEST (branch at line 39)
  it('should handle non-text content types', () => {
    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'image' as const, image: new Uint8Array([1, 2, 3]) },
        ],
      },
    ];

    // Should either convert or throw error depending on OCI support
    expect(() => convertToOCIMessages(messages)).toThrow();
    // OR if OCI supports images:
    // expect(result).toEqual([...expected image conversion...]);
  });

  it('should handle mixed content types', () => {
    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: 'What is this?' },
          { type: 'image' as const, image: new Uint8Array() },
        ],
      },
    ];

    // Test multimodal message handling
    const result = convertToOCIMessages(messages);
    expect(result).toBeDefined();
  });

  it('should handle file content type', () => {
    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'file' as const, data: new Uint8Array(), mimeType: 'application/pdf' },
        ],
      },
    ];

    // Test file handling
    expect(() => convertToOCIMessages(messages)).not.toThrow();
  });
});
```

---

## FIX #7: Provider Integration Tests

**File**: `packages/oci-genai-provider/src/__tests__/provider.test.ts`
**Status**: Currently failing due to transcription type error

### Additional Integration Tests Needed

```typescript
describe('OCIGenAIProvider - Integration', () => {
  // After fixing transcription type error, add these:

  it('should create all model types successfully', () => {
    const provider = new OCIGenAIProvider({
      compartmentId: 'test',
      region: 'eu-frankfurt-1',
    });

    expect(() => provider.languageModel('cohere.command-r-plus')).not.toThrow();
    expect(() => provider.embeddingModel('cohere.embed-multilingual-v3.0')).not.toThrow();
    expect(() => provider.rerankingModel('cohere.rerank-v3.5')).not.toThrow();
    expect(() => provider.speechModel('oci.tts-1-hd', { region: 'us-phoenix-1' })).not.toThrow();
    expect(() => provider.transcriptionModel('oci.speech.whisper')).not.toThrow();
  });

  it('should merge config with model-specific settings', () => {
    const provider = new OCIGenAIProvider({
      compartmentId: 'provider-compartment',
      region: 'eu-frankfurt-1',
    });

    const model = provider.languageModel('cohere.command-r-plus', {
      compartmentId: 'model-compartment',  // Override
    });

    // Model should use model-specific compartment
    expect(model).toBeDefined();
  });

  it('should throw NoSuchModelError for imageModel', () => {
    const provider = new OCIGenAIProvider({});

    expect(() => provider.imageModel('any-model')).toThrow();
    expect(() => provider.imageModel('any-model')).toThrow(/does not provide image generation/);
  });

  it('should handle optional model methods', () => {
    const provider = new OCIGenAIProvider({});

    // These are optional in ProviderV3
    expect(provider.speechModel).toBeDefined();
    expect(provider.transcriptionModel).toBeDefined();
    expect(provider.rerankingModel).toBeDefined();
  });
});
```

---

## FIX #8: End-to-End Workflow Tests

**File**: `packages/oci-genai-provider/src/__tests__/e2e-workflows.test.ts` (NEW)
**Purpose**: Test realistic usage patterns

```typescript
describe('E2E Workflows', () => {
  describe('RAG Pipeline', () => {
    it('should complete full RAG workflow: embed → rerank → generate', async () => {
      const provider = createOCI({ compartmentId: 'test' });

      // 1. Embed documents
      const embeddingModel = provider.embeddingModel('cohere.embed-multilingual-v3.0');
      const embeddings = await embeddingModel.doEmbed({
        values: [
          'AI is transforming industries',
          'Machine learning requires data',
          'Weather forecast for tomorrow',
        ],
      });
      expect(embeddings.embeddings).toHaveLength(3);

      // 2. Rerank documents
      const rerankingModel = provider.rerankingModel('cohere.rerank-v3.5');
      const reranked = await rerankingModel.doRerank({
        query: 'artificial intelligence applications',
        documents: {
          type: 'text',
          values: [
            'AI is transforming industries',
            'Machine learning requires data',
            'Weather forecast for tomorrow',
          ],
        },
        topN: 2,
      });
      expect(reranked.ranking[0].relevanceScore).toBeGreaterThan(reranked.ranking[1].relevanceScore);

      // 3. Generate response with top documents
      const languageModel = provider.languageModel('cohere.command-r-plus');
      const topDocs = reranked.ranking.slice(0, 2).map(r =>
        `Doc ${r.index}: ${documents[r.index]}`
      ).join('\n');

      // Would call languageModel.doGenerate() here
      expect(languageModel).toBeDefined();
    });
  });

  describe('Multimodal Pipeline', () => {
    it('should handle speech → transcription → generation workflow', async () => {
      const provider = createOCI({ compartmentId: 'test' });

      // 1. Generate speech from text
      const speechModel = provider.speechModel('oci.tts-1-hd', { region: 'us-phoenix-1' });
      const audio = await speechModel.doGenerate({ text: 'Hello world' });
      expect(audio.audioData).toBeInstanceOf(Uint8Array);

      // 2. Transcribe audio back to text
      const transcriptionModel = provider.transcriptionModel('oci.speech.whisper');
      const transcription = await transcriptionModel.doGenerate({ audioData: audio.audioData });
      expect(transcription.text).toContain('Hello');

      // 3. Generate response based on transcription
      const languageModel = provider.languageModel('cohere.command-r');
      // Would call languageModel.doGenerate() here
    });
  });

  describe('Error Handling Pipeline', () => {
    it('should handle API errors gracefully across model types', async () => {
      // Mock API failures
      // Test retry logic
      // Test error propagation
      // Test recovery mechanisms
    });
  });
});
```

---

## Coverage Summary After All Fixes

| Module | Before | After (Target) | Improvement |
|--------|--------|----------------|-------------|
| **Overall** | 83.49% | **95%+** | +11.5% |
| Embedding Models | 63.15% | **95%+** | +31.85% |
| Reranking Models | 62.5% | **95%+** | +32.5% |
| Transcription Models | 45.9% | **90%+** | +44.1% |
| Speech Models | 93.33% | **98%+** | +4.67% |
| SSE Parser | 91.17% | **98%+** | +6.83% |
| Language Models | 98.7% | **99%+** | +0.3% |
| **Branch Coverage** | **67.53%** | **85%+** | **+17.47%** |

---

## Implementation Priority

### 🔴 Critical (Do First)
1. **FIX #1**: Transcription type compatibility
2. **FIX #2**: Embedding model tests (core functionality)
3. **FIX #3**: Reranking model tests (core functionality)

### 🟡 High Priority (Do Soon)
4. **FIX #4**: Speech voice fallback test
5. **FIX #5**: SSE parser edge cases
6. **FIX #7**: Provider integration tests

### 🟢 Medium Priority (Nice to Have)
7. **FIX #6**: Language model converter branch
8. **FIX #8**: E2E workflow tests

---

## Estimated Time

- **Critical Fixes (1-3)**: 4-6 hours
- **High Priority (4-7)**: 3-4 hours
- **Medium Priority (8)**: 2-3 hours
- **Total**: 9-13 hours of focused development

---

## Testing Commands

```bash
# Run all tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test embedding-models/__tests__/oci-embedding-model.test.ts

# Run tests in watch mode
pnpm test:watch

# Check type errors
pnpm type-check

# Verify coverage thresholds
pnpm test:coverage:ci
```
