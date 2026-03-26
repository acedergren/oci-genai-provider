# Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.3] - 2026-03-26

### Added

- OCI Generative AI service API-key auth support through the OpenAI-compatible Bearer-token transport for supported chat models.
- Typed OCI AI Guardrails input preflight support for chat and embedding requests, including provider metadata surfaced back to callers.
- `cohere.embed-v4.0` plus OCI image-capable embedding variants and configurable embedding dimensions/encodings.
- Current OCI model catalog coverage for `openai.gpt-oss-120b`, `openai.gpt-oss-20b`, `xai.grok-code-fast-1`, `xai.grok-4.20-0309-reasoning`, `xai.grok-4.20-0309-non-reasoning`, and `xai.grok-4.20-multi-agent-0309`.
- New examples for API-key auth and Embed 4 usage.

### Changed

- Refreshed language-model capability metadata to align with current OCI documentation, especially Grok 4.x/4.20, GPT-OSS, and Cohere Command A.
- Refreshed public README and embedding docs with updated auth, model, embedding, and regional-availability guidance.
- Fixed the package integration-test script and strengthened local Jest module mapping for OCI SDK-backed tests.

### Fixed

- Cohere Command A reasoning and vision models now use the Cohere V2 path consistently.
- Streaming finish-reason fallback now maps unknown OCI reasons to `other` instead of incorrectly defaulting to `stop`.
- AI SDK tool-calling compatibility coverage now includes GPT-OSS and current Cohere/Grok catalog entries.

## [0.3.2] - 2026-03-22

### Fixed

- Cohere Command-A tool loops now serialize tool schemas using Cohere-compatible parameter types such as `List[str]` and `Dict`, which fixes `generateText({ tools })` requests rejected with `Please pass in correct format of request`.
- Cohere follow-up tool-loop requests now preserve assistant tool calls and `toolResults` after the latest user turn, so multi-step AI SDK tool execution completes correctly.
- Cohere tool-result payloads now unwrap AI SDK JSON result envelopes into real output objects for better follow-up context.

### Added

- Opt-in serialized Cohere request logging via `OCI_GENAI_DEBUG_COHERE_REQUESTS=1` for debugging `/actions/chat` payloads.
- Regression coverage for Cohere Command-A tool conversion, follow-up tool-result formatting, and AI SDK multi-step tool loops.

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
