# @acedergren/oci-anthropic-compatible

> **Community Project** — This is an independent, community-maintained project with no official affiliation with Oracle Corporation or Anthropic.

Anthropic-compatible proxy server for OCI Generative AI Service. Enables Claude Code and other Anthropic API clients to use OCI GenAI models.

## Features

- **Anthropic Messages API Compatible** - Drop-in replacement for Anthropic API
- **Multiple Model Support** - Maps Claude models to capable OCI equivalents
- **Streaming Support** - Full SSE streaming for real-time responses
- **Secure by Default** - CORS protection, input validation, port validation

## Installation

```bash
npm install @acedergren/oci-anthropic-compatible
# or
pnpm add @acedergren/oci-anthropic-compatible
```

## Quick Start

### CLI Usage

```bash
# Set required environment variables
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..."
export OCI_REGION="eu-frankfurt-1"

# Start the proxy
npx oci-anthropic-proxy -p 8080

# Configure Claude Code to use the proxy
export ANTHROPIC_API_URL="http://localhost:8080"
claude
```

### Programmatic Usage

```typescript
import { startServer } from '@acedergren/oci-anthropic-compatible';

const { stop } = startServer({
  port: 8080,
  host: 'localhost',
  region: 'eu-frankfurt-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID!,
  profile: 'DEFAULT',
  verbose: true,
});

// Graceful shutdown
process.on('SIGINT', () => stop());
```

## CLI Options

```
Options:
  -p, --port <port>        Port to listen on (default: 8080)
  -h, --host <host>        Host to bind to (default: localhost)
  -r, --region <region>    OCI region (default: eu-frankfurt-1)
  -c, --compartment <id>   OCI compartment OCID (required)
      --profile <name>     OCI config profile (default: DEFAULT)
  -v, --verbose            Enable verbose logging
      --help               Show help message
```

## Environment Variables

| Variable             | Description                  | Default              |
| -------------------- | ---------------------------- | -------------------- |
| `OCI_REGION`         | OCI region                   | `eu-frankfurt-1`     |
| `OCI_COMPARTMENT_ID` | OCI compartment OCID         | Required             |
| `OCI_CONFIG_PROFILE` | OCI config profile           | `DEFAULT`            |
| `ALLOWED_ORIGINS`    | Comma-separated CORS origins | `http://localhost:*` |

## Model Mapping

Claude model requests are mapped to OCI models:

| Anthropic Model              | OCI Model                      |
| ---------------------------- | ------------------------------ |
| `claude-3-opus-20240229`     | `meta.llama-3.1-405b-instruct` |
| `claude-3-sonnet-20240229`   | `meta.llama-3.3-70b-instruct`  |
| `claude-3-haiku-20240307`    | `meta.llama-3.1-70b-instruct`  |
| `claude-3-5-sonnet-20241022` | `xai.grok-3`                   |
| `claude-3-5-haiku-20241022`  | `xai.grok-3-mini`              |

You can also use OCI model IDs directly (e.g., `meta.llama-3.3-70b-instruct`).

## Security

- **CORS Protection**: Only allows configured origins (defaults to localhost)
- **Input Validation**: All requests validated with Zod schemas
- **Port Validation**: Ensures valid port range (1-65535)
- **Error Sanitization**: Internal errors don't leak sensitive information

## API Endpoints

| Endpoint       | Method | Description            |
| -------------- | ------ | ---------------------- |
| `/v1/messages` | POST   | Anthropic Messages API |
| `/health`      | GET    | Health check           |
| `/`            | GET    | Health check           |

## Legal

**Community Project** — This package is not affiliated with, endorsed by, or sponsored by Oracle Corporation or Anthropic. "OCI" and "Oracle Cloud Infrastructure" are trademarks of Oracle Corporation. "Claude" and "Anthropic" are trademarks of Anthropic, PBC.

## License

MIT
