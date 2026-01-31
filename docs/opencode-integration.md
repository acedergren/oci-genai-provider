# OpenCode Integration for OCI Generative AI

This guide explains how to integrate the OCI Generative AI provider with OpenCode.

## Prerequisites

- OCI Account with Generative AI enabled
- OCI CLI configured (`~/.oci/config`)
- OpenCode installed

## Installation

You can install the OCI provider integration package using `npm`, `pnpm`, or `yarn`.

```bash
npm install @acedergren/opencode-oci-genai
```

## Configuration

To use the OCI GenAI provider in OpenCode, you need to configure `opencode.json`.

### Manual Configuration

Add the following to your `opencode.json`:

```json
{
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "options": {
        "compartmentId": "{env:OCI_COMPARTMENT_ID}",
        "configProfile": "DEFAULT"
      }
    }
  }
}
```

Make sure to set the `OCI_COMPARTMENT_ID` environment variable.

### Automatic Setup (Recommended)

We provide a setup wizard to automatically configure OpenCode for OCI GenAI.

```bash
npx @acedergren/opencode-oci-setup
```

This wizard will:
1.  Discover your OCI configuration profiles.
2.  Help you select a compartment.
3.  Choose available models.
4.  Generate or update `opencode.json`.

## Usage

Once configured, you can start OpenCode with the OCI provider:

```bash
opencode --model oci-genai:cohere.command-r-plus
```

Or switch models inside OpenCode:

```
/model oci-genai:meta.llama-3.3-70b-instruct
```

## Troubleshooting

-   **Authentication Errors**: Ensure your `~/.oci/config` is correct and the profile specified in `opencode.json` exists.
-   **Compartment Errors**: Verify the `compartmentId` is correct and your user has permissions to access Generative AI services in that compartment.
-   **Model Not Found**: Check if the model is available in your region. Use `oci-tui models` or OCI Console to list available models.

## Development

To build the integration package locally:

```bash
pnpm install
pnpm build
```

The integration package is located in `packages/opencode-integration`.
