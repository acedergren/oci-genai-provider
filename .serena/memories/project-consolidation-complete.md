# Project Consolidation Complete

## Consolidated Package Naming
- **Old**: `@acedergren/opencode-oci-genai` (OpenCode-specific integration package)
- **New**: `@acedergren/oci-genai-provider` (Core provider package used by OpenCode integration)

## Clean-up Completed (2026-02-01)
- ✅ Removed all references to `@acedergren/opencode-oci-genai` from:
  - `packages/opencode-oci-setup/src/flows/config.ts` (4 references)
  - `packages/opencode-integration/src/index.ts` (1 reference in JSDoc)

## Current Package Structure
- **@acedergren/oci-genai-provider** - Core OCI GenAI provider (location: `packages/oci-genai-provider/`)
- **@acedergren/opencode-oci-setup** - OpenCode setup wizard (location: `packages/opencode-oci-setup/`)
- **@acedergren/opencode-integration** - OpenCode factory function (location: `packages/opencode-integration/`)

## NPM Installation
Users installing the OpenCode OCI integration will use:
```bash
npm install @acedergren/oci-genai-provider
```

This is used both:
1. By the setup wizard (`opencode-oci-setup`) during initialization
2. By the integration package (`opencode-integration`) at runtime

## Related Memories
- `project-overview` - Full project structure
- `monorepo-architecture` - Build and package organization
