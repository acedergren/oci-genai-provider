# OpenCode Integration Guide

Complete guide to integrating the OCI GenAI provider with OpenCode.

## Overview

OpenCode is an AI-powered development tool that supports multiple LLM providers. This guide shows you how to add OCI Generative AI models to OpenCode.

**Benefits of OpenCode + OCI GenAI:**
- Access to xAI Grok, Meta Llama, Cohere, and Gemini models
- EU data residency (Frankfurt region available)
- Enterprise-grade security and compliance
- Cost-effective alternatives to major providers
- Fine-tuning capabilities (Meta Llama 3.3)

---

## Quick Start

### 1. Install the Provider

```bash
npm install @acedergren/oci-genai-provider
```

### 2. Configure OpenCode

Create or edit `~/.opencode/config.json`:

```json
{
  "providers": {
    "oci-genai": {
      "type": "custom",
      "package": "@acedergren/oci-genai-provider",
      "region": "eu-frankfurt-1",
      "profile": "DEFAULT"
    }
  },
  "models": {
    "oci-grok-4": {
      "provider": "oci-genai",
      "model": "xai.grok-4-maverick",
      "displayName": "Grok 4 Maverick (OCI)"
    },
    "oci-llama-3.3": {
      "provider": "oci-genai",
      "model": "meta.llama-3.3-70b-instruct",
      "displayName": "Llama 3.3 70B (OCI)"
    },
    "oci-cohere": {
      "provider": "oci-genai",
      "model": "cohere.command-r-plus",
      "displayName": "Command R+ (OCI)"
    }
  },
  "defaultModel": "oci-llama-3.3"
}
```

### 3. Configure OCI Authentication

Ensure you have OCI credentials configured (see [Authentication Guide](../authentication/)):

```ini
# ~/.oci/config
[DEFAULT]
user=ocid1.user.oc1..<your_user_id>
fingerprint=<your_fingerprint>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<your_tenancy_id>
region=eu-frankfurt-1
```

### 4. Test in OpenCode

```bash
opencode --model oci-llama-3.3
> What is Oracle Cloud Infrastructure?
```

---

## Provider Configuration

### Configuration Options

```json
{
  "providers": {
    "oci-genai": {
      "type": "custom",
      "package": "@acedergren/oci-genai-provider",

      // Required
      "compartmentId": "ocid1.compartment.oc1..<compartment_id>",

      // Authentication (choose one approach)
      "profile": "DEFAULT",                    // Use OCI config profile
      "configFile": "~/.oci/config",           // Custom config file path

      // Optional
      "region": "eu-frankfurt-1",              // Override config file region
      "auth": "api_key",                       // Or "instance_principal", "resource_principal"

      // Advanced
      "timeout": 60000,                        // Request timeout (ms)
      "maxRetries": 3                          // Max retry attempts
    }
  }
}
```

### Using Environment Variables

```bash
# Set environment variables
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..<compartment_id>"
export OCI_CONFIG_PROFILE="FRANKFURT"
export OCI_REGION="eu-frankfurt-1"

# Run OpenCode (will use environment variables)
opencode --model oci-grok-4
```

---

## Model Configuration

### Model Definition Schema

```json
{
  "models": {
    "model-id": {
      "provider": "oci-genai",               // Provider name
      "model": "xai.grok-4-maverick",        // OCI model ID
      "displayName": "Grok 4 (OCI)",        // Display name in UI
      "description": "Latest xAI Grok model", // Optional description
      "contextWindow": 128000,               // Optional context window
      "supportsStreaming": true,             // Optional feature flags
      "supportsTools": true,
      "supportsVision": false
    }
  }
}
```

### Recommended Model Configurations

**For Code Generation (Frankfurt Region):**
```json
{
  "models": {
    "oci-grok-code": {
      "provider": "oci-genai",
      "model": "xai.grok-4-maverick",
      "displayName": "Grok 4 Maverick (Code)",
      "description": "Best for code analysis and generation",
      "contextWindow": 128000,
      "supportsStreaming": true,
      "supportsTools": true
    },
    "oci-llama-code": {
      "provider": "oci-genai",
      "model": "meta.llama-3.3-70b-instruct",
      "displayName": "Llama 3.3 70B (Code)",
      "description": "Cost-effective code generation",
      "contextWindow": 128000,
      "supportsStreaming": true,
      "supportsTools": true
    }
  }
}
```

**For Document Processing:**
```json
{
  "models": {
    "oci-gemini-docs": {
      "provider": "oci-genai",
      "model": "google.gemini-2.5-flash",
      "displayName": "Gemini 2.5 Flash (Docs)",
      "description": "Fast inference for document processing",
      "contextWindow": 1000000,
      "supportsStreaming": true,
      "supportsVision": true
    },
    "oci-cohere-rag": {
      "provider": "oci-genai",
      "model": "cohere.command-r-plus-08-2024",
      "displayName": "Command R+ (RAG)",
      "description": "Optimized for RAG workflows",
      "contextWindow": 128000,
      "supportsStreaming": true,
      "supportsTools": true
    }
  }
}
```

---

## Complete Configuration Example

### ~/.opencode/config.json

```json
{
  "providers": {
    "oci-genai": {
      "type": "custom",
      "package": "@acedergren/oci-genai-provider",
      "compartmentId": "ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq",
      "region": "eu-frankfurt-1",
      "profile": "FRANKFURT",
      "configFile": "~/.oci/config"
    }
  },

  "models": {
    "oci-grok-4": {
      "provider": "oci-genai",
      "model": "xai.grok-4-maverick",
      "displayName": "Grok 4 Maverick",
      "description": "Latest xAI model for reasoning",
      "contextWindow": 128000,
      "supportsStreaming": true,
      "supportsTools": true
    },
    "oci-grok-3": {
      "provider": "oci-genai",
      "model": "xai.grok-3",
      "displayName": "Grok 3 (70B)",
      "description": "Cost-effective alternative",
      "contextWindow": 128000,
      "supportsStreaming": true,
      "supportsTools": true
    },
    "oci-llama-3.3": {
      "provider": "oci-genai",
      "model": "meta.llama-3.3-70b-instruct",
      "displayName": "Llama 3.3 70B",
      "description": "Open-source, supports fine-tuning",
      "contextWindow": 128000,
      "supportsStreaming": true,
      "supportsTools": true
    },
    "oci-llama-vision": {
      "provider": "oci-genai",
      "model": "meta.llama-3.2-90b-vision",
      "displayName": "Llama 3.2 90B Vision",
      "description": "Multimodal with vision",
      "contextWindow": 128000,
      "supportsStreaming": true,
      "supportsTools": true,
      "supportsVision": true
    },
    "oci-cohere": {
      "provider": "oci-genai",
      "model": "cohere.command-r-plus-08-2024",
      "displayName": "Cohere Command R+",
      "description": "Enterprise RAG optimized",
      "contextWindow": 128000,
      "supportsStreaming": true,
      "supportsTools": true
    },
    "oci-gemini-pro": {
      "provider": "oci-genai",
      "model": "google.gemini-2.5-pro",
      "displayName": "Gemini 2.5 Pro",
      "description": "Largest context window (2M tokens)",
      "contextWindow": 2000000,
      "supportsStreaming": true,
      "supportsTools": true,
      "supportsVision": true
    },
    "oci-gemini-flash": {
      "provider": "oci-genai",
      "model": "google.gemini-2.5-flash",
      "displayName": "Gemini 2.5 Flash",
      "description": "Fast inference, good value",
      "contextWindow": 1000000,
      "supportsStreaming": true,
      "supportsTools": true,
      "supportsVision": true
    }
  },

  "defaultModel": "oci-llama-3.3",

  "settings": {
    "temperature": 0.7,
    "maxTokens": 4096,
    "streaming": true
  }
}
```

---

## Installation

### Option 1: Global Installation

```bash
# Install globally
npm install -g @acedergren/oci-genai-provider

# Verify installation
opencode --list-providers
# Should show "oci-genai" in the list
```

### Option 2: Project-Local Installation

```bash
# In your project directory
npm install @acedergren/oci-genai-provider

# Run OpenCode from project
npx opencode --model oci-llama-3.3
```

### Option 3: Development Installation

```bash
# Clone repository
git clone https://github.com/acedergren/opencode-oci-genai.git
cd opencode-oci-genai

# Install dependencies
npm install

# Build
npm run build

# Link locally
npm link

# Use in OpenCode
opencode --model oci-grok-4
```

---

## Usage Examples

### Basic Chat

```bash
opencode --model oci-llama-3.3
> Explain quantum computing in simple terms
```

### Code Generation

```bash
opencode --model oci-grok-4
> Write a TypeScript function to calculate Fibonacci numbers
```

### Code Review

```bash
opencode --model oci-cohere review main.ts
# Reviews main.ts and provides feedback
```

### Interactive Session

```bash
opencode --model oci-llama-3.3 --interactive
> What files are in the current directory?
> Explain the purpose of package.json
> How can I optimize this code?
```

### Streaming Mode

```bash
opencode --model oci-gemini-flash --stream
> Write a long essay about AI ethics
# Tokens stream as they're generated
```

### With Tools/Functions

```bash
opencode --model oci-grok-4 --tools
> Search for "TypeScript best practices" and summarize
# Model can call web search and file system tools
```

---

## Switching Models

### In Interactive Mode

```bash
opencode
> /model oci-grok-4
Switched to Grok 4 Maverick

> /model oci-llama-3.3
Switched to Llama 3.3 70B

> /models
Available models:
  - oci-grok-4 (current)
  - oci-llama-3.3
  - oci-cohere
  ...
```

### Via Command Line

```bash
# Start with specific model
opencode --model oci-grok-4

# Override default model for one command
opencode --model oci-gemini-flash --once "Summarize this file"
```

---

## Regional Configuration

### Using Frankfurt (EU) Region

```json
{
  "providers": {
    "oci-genai": {
      "type": "custom",
      "package": "@acedergren/oci-genai-provider",
      "region": "eu-frankfurt-1",
      "profile": "FRANKFURT"
    }
  }
}
```

**Benefits:**
- ✅ EU data residency
- ✅ GDPR compliance
- ✅ Lower latency for European users
- ✅ All models available (as of Jan 2026)

### Multi-Region Setup

```json
{
  "providers": {
    "oci-frankfurt": {
      "type": "custom",
      "package": "@acedergren/oci-genai-provider",
      "region": "eu-frankfurt-1",
      "profile": "FRANKFURT"
    },
    "oci-ashburn": {
      "type": "custom",
      "package": "@acedergren/oci-genai-provider",
      "region": "us-ashburn-1",
      "profile": "ASHBURN"
    }
  },

  "models": {
    "oci-eu-llama": {
      "provider": "oci-frankfurt",
      "model": "meta.llama-3.3-70b-instruct",
      "displayName": "Llama 3.3 (EU)"
    },
    "oci-us-llama": {
      "provider": "oci-ashburn",
      "model": "meta.llama-3.3-70b-instruct",
      "displayName": "Llama 3.3 (US)"
    }
  }
}
```

---

## Troubleshooting

### Provider Not Found

**Error:** `Provider oci-genai not found`

**Solutions:**
1. Verify installation: `npm list @acedergren/oci-genai-provider`
2. Check config file path: `~/.opencode/config.json`
3. Reinstall: `npm install -g @acedergren/oci-genai-provider`

### Authentication Errors

**Error:** `401 NotAuthenticated`

**Solutions:**
1. Verify OCI config exists: `ls ~/.oci/config`
2. Test OCI CLI: `oci iam region list`
3. Check profile name in config matches
4. See [Authentication Guide](../authentication/)

### Model Not Available

**Error:** `Model not found in region`

**Solutions:**
1. Check model availability: See [Model Catalog](../../reference/oci-genai-models/)
2. Verify region supports model
3. Check compartment has access

### IAM Policy Errors

**Error:** `403 NotAuthorizedOrNotFound`

**Solutions:**
1. Apply required IAM policies: See [IAM Policies Guide](../iam-policies/)
2. Wait 1-2 minutes for policy propagation
3. Verify compartment OCID is correct

### Slow Response Times

**Problem:** High latency

**Solutions:**
1. **Use Frankfurt region** for EU users: `region: "eu-frankfurt-1"`
2. Use faster models: `gemini-2.5-flash` instead of `gemini-2.5-pro`
3. Use dedicated AI clusters for production
4. Check network latency to OCI region

---

## Performance Optimization

### Model Selection

**For Low Latency:**
- `google.gemini-2.5-flash` - Fastest inference
- `xai.grok-4-scout` - Optimized Grok variant
- `xai.grok-3-mini` - Lightweight option

**For Cost Optimization:**
- `meta.llama-3.3-70b-instruct` - Open-source, lower cost
- `xai.grok-3-mini` - Reduced pricing
- `google.gemini-2.5-flash-lite` - Most economical

**For Quality:**
- `xai.grok-4-maverick` - Best reasoning
- `google.gemini-2.5-pro` - Largest context
- `cohere.command-r-plus` - RAG-optimized

### Caching Strategy

```json
{
  "settings": {
    "caching": {
      "enabled": true,
      "ttl": 3600,
      "maxSize": 100
    }
  }
}
```

### Dedicated Clusters

For high-volume production use:

```json
{
  "providers": {
    "oci-genai": {
      "type": "custom",
      "package": "@acedergren/oci-genai-provider",
      "servingMode": "DEDICATED",
      "endpointId": "ocid1.generativeaiendpoint.oc1..<endpoint_id>"
    }
  }
}
```

**Benefits:**
- No rate limiting
- Guaranteed capacity
- Lower per-token cost at scale

---

## Integration with CI/CD

### GitHub Actions

```yaml
name: Code Review with OCI GenAI

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup OCI Config
        run: |
          mkdir -p ~/.oci
          echo "${{ secrets.OCI_CONFIG }}" > ~/.oci/config
          echo "${{ secrets.OCI_API_KEY }}" > ~/.oci/oci_api_key.pem
          chmod 600 ~/.oci/oci_api_key.pem

      - name: Install OpenCode with OCI Provider
        run: |
          npm install -g opencode @acedergren/oci-genai-provider

      - name: Run Code Review
        run: |
          opencode --model oci-llama-3.3 review-pr
        env:
          OCI_COMPARTMENT_ID: ${{ secrets.OCI_COMPARTMENT_ID }}
          OCI_REGION: eu-frankfurt-1
```

### GitLab CI

```yaml
code-review:
  stage: review
  image: node:20
  script:
    - npm install -g opencode @acedergren/oci-genai-provider
    - echo "$OCI_CONFIG" > ~/.oci/config
    - echo "$OCI_API_KEY" > ~/.oci/oci_api_key.pem
    - chmod 600 ~/.oci/oci_api_key.pem
    - opencode --model oci-cohere review-mr
  variables:
    OCI_REGION: eu-frankfurt-1
  only:
    - merge_requests
```

---

## Next Steps

- **[Configuration Reference](configuration.md)** - Complete configuration options
- **[Authentication Guide](../authentication/)** - OCI auth setup
- **[Model Catalog](../../reference/oci-genai-models/)** - All available models
- **[OpenCode Tutorial](../../tutorials/04-opencode-integration.md)** - Step-by-step guide

---

**Sources:**
- Project Archive Configuration Documentation
- OpenCode Documentation (inferred)
- OCI GenAI Service Documentation
- [Vercel AI SDK](https://sdk.vercel.ai)

**Last Updated:** 2026-01-26
