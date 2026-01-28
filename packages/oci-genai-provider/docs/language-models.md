# Language Models

Complete reference for OCI language models.

## Available Models

All language models support streaming and tool calling.

### Cohere Models

#### Command R Plus

- **Model ID:** `cohere.command-r-plus`
- **Context Window:** 128,000 tokens
- **Best For:** Long context, RAG, document analysis
- **Cost:** Mid-range

#### Command R

- **Model ID:** `cohere.command-r`
- **Context Window:** 128,000 tokens
- **Best For:** General purpose, instruction following
- **Cost:** Lower

### Meta Llama Models

#### Llama 3.3 70B

- **Model ID:** `meta.llama-3.3-70b-instruct`
- **Context Window:** 8,192 tokens
- **Best For:** Instruction following, coding
- **Cost:** Lower

#### Llama 3.1 405B

- **Model ID:** `meta.llama-3.1-405b-instruct`
- **Context Window:** 128,000 tokens
- **Best For:** Most complex tasks, longest context
- **Cost:** Higher

### Anthropic Claude Models

#### Claude 3.5 Sonnet

- **Model ID:** `anthropic.claude-3-5-sonnet-v2`
- **Context Window:** 200,000 tokens
- **Best For:** Analysis, coding, complex reasoning
- **Cost:** Mid-range

### Mistral Models

#### Mistral Large

- **Model ID:** `mistral.mistral-large-2`
- **Context Window:** 128,000 tokens
- **Best For:** Multilingual, instruction following
- **Cost:** Lower

### xAI Grok Models

#### Grok 4 Maverick

- **Model ID:** `xai.grok-4-maverick`
- **Context Window:** 131,072 tokens
- **Best For:** Most capable, longest context
- **Cost:** Higher

## Usage Examples

### Basic Text Generation

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: oci.languageModel('cohere.command-r-plus'),
  prompt: 'Explain quantum computing',
});

console.log(result.text);
```

### Streaming Text

```typescript
import { streamText } from 'ai';

const result = streamText({
  model: oci.languageModel('cohere.command-r-plus'),
  prompt: 'Write a poem about clouds',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Conversation

```typescript
const result = await generateText({
  model: oci.languageModel('cohere.command-r-plus'),
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi\! How can I help?' },
    { role: 'user', content: 'What is AI?' },
  ],
});
```

### Temperature Control

```typescript
// Creative responses
const creative = await generateText({
  model: oci.languageModel('cohere.command-r-plus'),
  prompt: 'Write a story...',
  temperature: 1.0, // Higher = more creative
});

// Focused responses
const focused = await generateText({
  model: oci.languageModel('cohere.command-r-plus'),
  prompt: 'Summarize this text...',
  temperature: 0.2, // Lower = more focused
});
```

## See Also

- [API Reference](./api-reference.md)
- [Configuration Guide](./configuration.md)
