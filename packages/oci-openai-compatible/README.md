# @acedergren/oci-openai-compatible

OpenAI-compatible wrapper for Oracle Cloud Infrastructure (OCI) Generative AI Service.

## Status

🚧 **Under Development** - Initial implementation in progress

## Overview

This package provides a lightweight OpenAI-compatible interface for OCI Generative AI models, enabling teams familiar with OpenAI's API to seamlessly migrate to OCI with minimal code changes.

## Installation

```bash
pnpm add @acedergren/oci-openai-compatible
```

## Quick Start

```typescript
import { createOCIOpenAI } from '@acedergren/oci-openai-compatible';

const client = createOCIOpenAI({
  region: 'us-ashburn-1',
  apiKey: process.env.OCI_API_KEY,
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});

const response = await client.chat.completions.create({
  model: 'meta.llama-3.3-70b-instruct',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

## Documentation

Full documentation coming soon.

## License

MIT
