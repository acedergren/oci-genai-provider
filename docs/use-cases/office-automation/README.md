# Office Automation Use Case

Using OCI GenAI for document processing, automation, and business workflows.

## Overview

Automate document processing, data extraction, and business workflows with OCI GenAI integration.

**Best Models for Automation:**

- **cohere.command-r-plus** - RAG and document processing
- **google.gemini-2.5-flash** - Fast, multimodal
- **meta.llama-3.2-90b-vision** - Document images

## Use Cases

### 1. Document Summarization

### 2. Data Extraction

### 3. Batch Processing

### 4. Email Automation

### 5. Report Generation

### 6. OpenWork Integration

## Example: Batch Document Processing

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';
import { readdir, readFile } from 'fs/promises';

const oci = createOCI({ region: 'eu-frankfurt-1' });

async function processBatch(directory: string) {
const files = await readdir(directory);
const results = [];

for (const file of files) {
const content = await readFile(\`\${directory}/\${file}\`, 'utf-8');

    const { text } = await generateText({
      model: oci('cohere.command-r-plus'),
      prompt: \`Summarize this document in 3 bullet points:\n\n\${content}\`,
    });

    results.push({ file, summary: text });

}

return results;
}
\`\`\`

## Best Practices

### Cost Optimization

- Batch requests when possible
- Use smaller models for simple tasks
- Implement caching for repeated patterns
- Consider dedicated clusters for high volume

### Error Handling

- Implement retry logic with exponential backoff
- Log failures for manual review
- Validate outputs before downstream use

### OpenWork Integration

- Use RAG for knowledge base
- Implement tool calling for actions
- Stream results for real-time feedback

**Sources:** Project Archive Requirements (Section 8.2), OpenWork Documentation
**Last Updated:** 2026-01-26
