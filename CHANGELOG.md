# Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Zod Validation Schemas**: Runtime validation for provider settings with clear error messages
  - `CompartmentIdSchema`, `RegionSchema`, `ServingModeSchema` for OCID validation
  - `validateProviderSettings()` and `parseProviderSettings()` helpers
  - Cross-field validation (e.g., endpointId required for dedicated mode)
- **agent-state Package**: SQLite-based session persistence for chat applications
  - Session and turn management with full type safety
  - Zod-validated schemas for data integrity
- **oci-genai-setup Package**: Interactive CLI wizard for configuration
  - Profile, region, compartment, model selection
  - Configuration validation via test inference
- **opencode-integration Package**: Pre-configured setup for OpenCode editor
- **oci-ai-chat Example**: Modern Svelte 5 + Tailwind 4 demo application
  - Full session persistence with agent-state
  - Model selection and streaming support
- **Regression Test Suite**: Critical behavior tests (REG-001 to REG-011)
  - Environment variable handling verification
  - Model family detection (Cohere, Google, xAI, Meta)
  - AI SDK V3 interface compliance tests
- **oci-openai-compatible**: OpenAI SDK-compatible wrapper for OCI GenAI
  - Drop-in replacement for OpenAI SDK
  - Support for 6 OCI regions
  - Streaming chat completions
  - Full TypeScript support

### Fixed

- ESLint warnings in embedding model type annotations
- AI SDK V3 type imports in integration tests
- `finishReason` format to return full `{ unified, raw }` object per V3 spec
- COHEREV2 API format detection for Cohere vision models

### Changed

- Repository restructured to include OpenAI-compatible wrapper
- Enhanced model registry with context window and max output metadata
- Cohere vision models now correctly use COHEREV2 API format

## [0.1.0] - 2025-01-28

Initial release of the OCI Generative AI provider for Vercel AI SDK.

### Added

- **Core Provider**
  - Vercel AI SDK v3 `LanguageModelV3` implementation
  - 16+ language models (Llama, Grok, Cohere, Gemini)
  - Streaming responses with Server-Sent Events
  - Tool/function calling support
  - Built-in retry with exponential backoff
  - Configurable timeouts
  - Rich error types (NetworkError, RateLimitError, AuthenticationError)

- **Authentication**
  - API key authentication via OCI config file
  - Instance principal for OCI Compute
  - Resource principal for OCI Functions
  - Multi-profile support

- **OpenCode Integration**
  - Optional convenience wrapper
  - Config helpers and validation
  - Model registry

- **Examples**
  - SvelteKit chatbot with bioluminescence design
  - Next.js 15 App Router chatbot
  - Command-line interface

- **Testing**
  - 121 tests across all modules
  - 80%+ code coverage
  - Shared test utilities package

- **Documentation**
  - Complete API reference
  - Authentication guide
  - Streaming and tool calling guides
  - Architecture documentation

---

## Versioning

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.1.1): Bug fixes

## Release Process

1. Update version in `packages/*/package.json`
2. Update this changelog
3. Run tests: `pnpm test`
4. Create tag: `git tag v0.2.0`
5. Push: `git push origin main --tags`

## Support

| Version  | Status              |
| -------- | ------------------- |
| Latest   | Full support        |
| Previous | Security fixes only |
| Older    | Community support   |
