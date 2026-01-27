# OpenCode Integration Guide

> **Integration Package**: [@acedergren/opencode-oci-genai](../../../packages/opencode-integration)

## Overview

OpenCode is a terminal-based AI coding assistant that uses the Vercel AI SDK internally. Since our core provider implements the Vercel AI SDK's `LanguageModelV1` interface, **it works with OpenCode out of the box**.

The `@acedergren/opencode-oci-genai` package is an **optional convenience layer** that provides:

- ✅ Default export factory function for OpenCode's plugin system
- ✅ Configuration validation and environment loading
- ✅ Model registry in OpenCode's expected format
- ✅ OCI-specific configuration helpers

**You can use either approach**:

1. **Direct (Core Provider)** - Use `@acedergren/oci-genai-provider` directly
2. **Convenience (Integration Package)** - Use `@acedergren/opencode-oci-genai` for easier setup

---

## Installation

### Option A: Direct Integration (Core Provider)

```bash
cd ~/.config/opencode
npm install @acedergren/oci-genai-provider ai
```

Then configure in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/oci-genai-provider",
      "name": "OCI GenAI",
      "models": {
        "xai.grok-4-maverick": {
          "name": "Grok 4 Maverick",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "cohere.command-r-plus": {
          "name": "Command R+",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        }
      }
    }
  }
}
```

### Option B: Integration Package (Easier)

```bash
cd ~/.config/opencode
npm install @acedergren/opencode-oci-genai
```

Then configure in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "options": {
        "compartmentId": "ocid1.compartment.oc1...",
        "configProfile": "FRANKFURT"
      }
    }
  }
}
```

The integration package automatically:

- Loads configuration from environment variables
- Validates OCI credentials
- Generates the model registry
- Provides helpful error messages

---

## Configuration

### Required: OCI Credentials

Ensure you have OCI credentials configured:

```bash
# ~/.oci/config
[DEFAULT]
user=ocid1.user.oc1..your_user_id
fingerprint=your_fingerprint
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..your_tenancy_id
region=eu-frankfurt-1
```

### Required: Compartment ID

```bash
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..your_id"
```

Or set in `opencode.json`:

```json
{
  "provider": {
    "oci-genai": {
      "options": {
        "compartmentId": "ocid1.compartment.oc1..your_id"
      }
    }
  }
}
```

---

## Usage

Once configured, use OCI models in OpenCode:

```bash
# Start OpenCode
opencode

# In OpenCode TUI
/models
# Select an OCI GenAI model

# Chat with the model
> Explain Rust ownership
```

---

## Available Models

All models from the core provider are available:

- **xAI Grok**: `xai.grok-4-maverick`, `xai.grok-4-scout`, `xai.grok-3`
- **Meta Llama**: `meta.llama-3.3-70b-instruct`, `meta.llama-3.2-vision-90b-instruct`
- **Cohere**: `cohere.command-r-plus`, `cohere.command-a`, `cohere.command-a-vision`
- **Google Gemini**: `google.gemini-2.5-pro`, `google.gemini-2.5-flash`

[Full model list →](../../../packages/oci-genai-provider/README.md#available-models)

---

## Troubleshooting

### "Compartment ID not found"

```bash
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..your_id"
```

### "Authentication failed"

Check your `~/.oci/config` file and ensure the key file path is correct.

### "Model not found"

Ensure the model is available in your OCI region. Some models are region-specific.

---

## OpenCode TUI vs Desktop

The integration works identically in both:

- **OpenCode TUI** (terminal) - Uses the same config file
- **OpenCode Desktop** - Uses the same config file

Both versions use the Vercel AI SDK internally, so our provider works seamlessly.

---

## Further Reading

- [Core Provider Documentation](../../../packages/oci-genai-provider/README.md)
- [Integration Package Documentation](../../../packages/opencode-integration/README.md)
- [OpenCode Documentation](https://opencode.ai/docs/)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
