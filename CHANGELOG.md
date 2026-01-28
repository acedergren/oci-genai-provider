# Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **oci-openai-compatible**: OpenAI SDK-compatible wrapper for OCI GenAI
  - Drop-in replacement for OpenAI SDK
  - Support for 6 OCI regions
  - Streaming chat completions
  - Full TypeScript support

### Fixed
- ESLint warnings in embedding model type annotations

### Changed
- Repository restructured to include OpenAI-compatible wrapper

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

| Version | Status |
|---------|--------|
| Latest | Full support |
| Previous | Security fixes only |
| Older | Community support |
