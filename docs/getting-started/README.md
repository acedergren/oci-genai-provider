# Getting Started with OCI GenAI Provider

Get up and running with the OCI Generative AI provider for Vercel AI SDK in under 5 minutes.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
2. **Oracle Cloud Infrastructure (OCI) account** with access to Generative AI services
3. **OCI API credentials** configured (see [Authentication Guide](../guides/authentication/))
4. **Required IAM policies** in place (see [IAM Policies Guide](../guides/iam-policies/))

## Quick Start

### 1. Installation

```bash
npm install @acedergren/oci-genai-provider
# or
pnpm add @acedergren/oci-genai-provider
# or
yarn add @acedergren/oci-genai-provider
```

### 2. Configuration

Create or update your `~/.oci/config` file:

```ini
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaaxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..aaaaaaaaxxx
region=us-ashburn-1
key_file=~/.oci/oci_api_key.pem
```

### 3. First Chat

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

### 4. Verify It Works

Run your script:

```bash
node your-script.js
```

You should see a response about Oracle Cloud Infrastructure!

## Next Steps

Now that you have the basics working:

- **[Configure Authentication](../guides/authentication/)** - Learn about different auth methods
- **[Explore Models](../reference/oci-genai-models/)** - See all available models
- **[Try Streaming](../tutorials/02-streaming-responses.md)** - Implement real-time responses
- **[Add Tool Calling](../tutorials/03-tool-calling.md)** - Integrate function calling
- **[Integrate with OpenCode](../tutorials/04-opencode-integration.md)** - Use with OpenCode

## Common Issues

### Authentication Errors

If you see authentication errors, verify:

- Your `~/.oci/config` file exists and is properly formatted
- Your API key file exists at the path specified in `key_file`
- Your user has the required IAM policies (see [IAM Policies Guide](../guides/iam-policies/))

### Model Not Found

Ensure the model you're requesting is:

- Available in your region (see [Model Availability](../reference/oci-genai-models/))
- Spelled correctly (case-sensitive)
- Accessible with your IAM policies

### Rate Limiting

OCI GenAI has rate limits. If you hit them:

- Implement exponential backoff (built into the provider)
- Consider using dedicated AI clusters for higher throughput
- Review your usage patterns

## Getting Help

- 📖 [Full Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/acedergren/opencode-oci-genai/issues)
- 💬 [Discussions](https://github.com/acedergren/opencode-oci-genai/discussions)

---

**Ready to build?** Continue to [First Chat Tutorial](first-chat.md) for a detailed walkthrough.
