# OCI OpenAI-Compatible Examples

This directory contains usage examples for the `@acedergren/oci-openai-compatible` package.

## Prerequisites

1. Set up OCI credentials:
   ```bash
   export OCI_API_KEY="your-api-key"
   export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..yourcompartmentid"
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Examples

### Basic Chat (`basic-chat.ts`)

Simple chat completion without streaming.

```bash
pnpm tsx examples/basic-chat.ts
```

### Streaming Chat (`streaming-chat.ts`)

Chat completion with streaming response.

```bash
pnpm tsx examples/streaming-chat.ts
```

## Supported Models

- `meta.llama-3.3-70b-instruct`
- `meta.llama-3.2-90b-vision-instruct`
- `meta.llama-3.1-405b-instruct`
- `meta.llama-3.1-70b-instruct`
- `xai.grok-3`
- `xai.grok-3-mini`
- `openai.gpt-oss`

## Supported Regions

- `us-ashburn-1` (US East - Ashburn)
- `us-chicago-1` (US East - Chicago)
- `us-phoenix-1` (US West - Phoenix)
- `eu-frankfurt-1` (Germany - Frankfurt)
- `ap-hyderabad-1` (India - Hyderabad)
- `ap-osaka-1` (Japan - Osaka)
