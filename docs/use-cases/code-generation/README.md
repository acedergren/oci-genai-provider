# Code Generation Use Case

Using OCI GenAI for code generation, analysis, and development tasks.

## Overview

OCI GenAI models excel at code-related tasks with support for multiple programming languages, frameworks, and development workflows.

**Best Models for Code:**
- **xai.grok-4-maverick** - Superior reasoning and analysis
- **meta.llama-3.3-70b-instruct** - Cost-effective, fine-tunable
- **xai.grok-3-mini** - High-throughput simple tasks

## Use Cases

### 1. Code Generation
### 2. Code Review & Analysis
### 3. Documentation Generation
### 4. Test Generation
### 5. Refactoring Suggestions
### 6. Bug Detection

## Example: Code Generation

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const oci = createOCI({ region: 'eu-frankfurt-1' });

const { text } = await generateText({
  model: oci('xai.grok-4-maverick'),
  prompt: \`Write a TypeScript function that:
- Accepts an array of numbers
- Returns the median value
- Handles edge cases
- Includes JSDoc comments\`,
});

console.log(text);
\`\`\`

## Best Practices

### Prompt Engineering
- Be specific about language and framework
- Request error handling explicitly
- Ask for tests when appropriate
- Specify code style preferences

### Model Selection
- **Grok 4**: Complex algorithms, architecture decisions
- **Llama 3.3**: General coding, can be fine-tuned
- **Grok Mini**: Simple functions, snippets

### Context Window Optimization
- Include relevant code context
- Use streaming for long outputs
- Split large codebases into chunks

**Sources:** Project Archive Requirements (Section 8.1), OCI GenAI Documentation
**Last Updated:** 2026-01-26
