# Getting Started

Get the OCI Generative AI provider running in your project.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
2. **OCI account** with Generative AI access
3. **OCI credentials** configured (we'll cover this below)
4. **Compartment ID** for your OCI resources

## Installation

Install the core provider and Vercel AI SDK:

```bash
npm install @acedergren/oci-genai-provider ai
```

Or with other package managers:

```bash
pnpm add @acedergren/oci-genai-provider ai
yarn add @acedergren/oci-genai-provider ai
```

## Configure OCI Credentials

The provider uses your OCI configuration file for authentication.

### Create the Config File

Create `~/.oci/config` if it doesn't exist:

```ini
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaaxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..aaaaaaaaxxx
region=us-ashburn-1
key_file=~/.oci/oci_api_key.pem
```

**Where to find these values:**

- **user**: OCI Console → Profile Icon → User Settings
- **tenancy**: OCI Console → Profile Icon → Tenancy
- **fingerprint**: Displayed when you upload your API key
- **key_file**: Path to your private key

### Set Your Compartment ID

```bash
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..your_compartment_id"
```

For detailed setup including API key generation, see the [Authentication Guide](../guides/authentication/README.md).

## First Request

Create a simple script to verify everything works:

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const oci = createOCI({
  region: 'us-ashburn-1',
  profile: 'DEFAULT',
});

const { text } = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'What is Oracle Cloud Infrastructure?',
});

console.log(text);
```

Run it:

```bash
npx tsx your-script.ts
```

If you see a response about OCI, you're set up correctly.

## Streaming Responses

For real-time output, use `streamText`:

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const oci = createOCI();

const stream = streamText({
  model: oci('meta.llama-3.3-70b-instruct'),
  prompt: 'Explain React hooks in detail',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

## Common Issues

### Authentication Errors

If you see authentication failures:

1. Verify `~/.oci/config` exists and is formatted correctly
2. Check that your API key file exists at the specified path
3. Confirm your fingerprint matches the key in OCI Console
4. Ensure your user has required IAM policies

See [Troubleshooting](../guides/troubleshooting.md) for detailed solutions.

### Model Not Found

If a model isn't found:

1. Check the model ID spelling (case-sensitive)
2. Verify the model is available in your region
3. Confirm your IAM policies allow access

See [Model Catalog](../reference/oci-genai-models/README.md) for available models.

### Rate Limiting

The provider automatically retries rate-limited requests with exponential backoff. For persistent issues:

- The `RateLimitError` includes `retryAfterMs` when available
- Consider using dedicated AI clusters for higher throughput
- Contact OCI support for quota increases

## Next Steps

- **[Authentication Guide](../guides/authentication/README.md)** — Detailed credential setup
- **[Model Catalog](../reference/oci-genai-models/README.md)** — All available models
- **[Streaming Guide](../guides/streaming/README.md)** — Real-time responses
- **[Tool Calling](../guides/tool-calling/README.md)** — Function integration
- **[Examples](../../examples/)** — Working applications

## For Contributors

Setting up the development environment:

```bash
git clone https://github.com/acedergren/oci-genai-provider.git
cd oci-genai-provider
pnpm install
pnpm build
pnpm test
```

See [DEVELOPMENT.md](../../DEVELOPMENT.md) for complete setup.
