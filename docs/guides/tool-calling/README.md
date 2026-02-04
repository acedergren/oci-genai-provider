# Tool Calling Integration Guide

Complete guide to implementing function/tool calling with the OCI GenAI provider and Vercel AI SDK.

## Overview

Tool calling (also called function calling) allows language models to request execution of user-defined functions, enabling:

- **External data access** (APIs, databases)
- **Action execution** (sending emails, creating files)
- **Dynamic computation** (calculations, data processing)
- **Multi-step workflows** (agentic behavior)

**All OCI GenAI models support tool calling.**

---

## Quick Start

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const oci = createOCI({ region: 'eu-frankfurt-1' });

// Define tools
const tools = {
getWeather: tool({
description: 'Get current weather for a location',
parameters: z.object({
location: z.string().describe('City and country, e.g., Paris, France'),
unit: z.enum(['celsius', 'fahrenheit']).optional(),
}),
execute: async ({ location, unit = 'celsius' }) => {
// Call weather API
return {
location,
temperature: 22,
unit,
conditions: 'Partly cloudy',
};
},
}),
};

// Generate with tools
const { text } = await generateText({
model: oci('cohere.command-r-plus'),
prompt: 'What's the weather like in Frankfurt?',
tools,
});

console.log(text);
// "The weather in Frankfurt is currently 22°C and partly cloudy."
\`\`\`

**That's it!** The AI SDK handles tool calling automatically.

**Sources:**

- [Vercel AI SDK Tools Documentation](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [OCI GenAI Agents Documentation](https://docs.oracle.com/en-us/iaas/Content/generative-ai/use-playground-chat.htm#use-playground-chat-tools)
- Project Archive Requirements Specification
- Context7 Query Results (2026-01-26)

**Last Updated:** 2026-01-26
