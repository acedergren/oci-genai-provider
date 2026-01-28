# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OCI OpenAI-compatible wrapper package (@acedergren/oci-openai-compatible)
  - Drop-in OpenAI SDK compatibility for OCI Generative AI
  - Support for 6 OCI regions
  - TypeScript support with full type definitions
  - Streaming chat completion support

### Fixed
- ESLint warnings in embedding model type annotations

### Changed
- Repository structure to include OpenAI-compatible wrapper

## [0.1.0] - 2025-01-28

### Added
- Initial OCI Generative AI Provider implementation
- Native OCI provider with ProviderV3 interface
- Support for language models (16+ models)
- ChatCompletion streaming support
- TypeScript support with full type definitions
- Comprehensive test suite
- Examples (SvelteKit, Next.js, CLI)
- OpenCode integration package
- Documentation and architecture guides

### Features
- ✅ 16+ language models (Llama, Grok, Cohere, Gemini)
- ✅ Streaming responses with SSE
- ✅ Type-safe model definitions
- ✅ Error handling with OCI-specific context
- ✅ Multi-region support
- ✅ Authentication via OCI config or instance principal
- ✅ Full Vercel AI SDK integration

---

## Release Guidelines

### Version Numbers

- **MAJOR**: Breaking changes (0.1.0 → 1.0.0)
- **MINOR**: New features, backwards compatible (0.1.0 → 0.2.0)
- **PATCH**: Bug fixes (0.1.0 → 0.1.1)

### Before Release

1. Update version in `packages/*/package.json`
2. Update this file with changes
3. Run full test suite: `pnpm test`
4. Verify builds: `pnpm build`
5. Create git tag: `git tag v0.2.0`
6. Push with tags: `git push origin main --tags`

### Categories for Changes

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes

### Example Entry

```markdown
## [0.2.0] - 2025-02-15

### Added
- Support for embeddings API
- New `createEmbeddings()` function
- Example for embeddings usage

### Changed
- Refactored error handling for better context
- Updated type definitions for clarity

### Fixed
- Memory leak in streaming handler
- Incorrect region validation

### Security
- Updated dependency with security fix
```

## Deprecation Policy

- Deprecated features are marked in documentation
- Deprecated for minimum 2 releases (or 2 months)
- Removal announced in advance with migration path
- Breaking changes only in MAJOR versions

## Support Policy

- **Latest Release**: Full support
- **Previous Release**: Security fixes only
- **Older Releases**: Community support only

---

**Last Updated**: January 2025
