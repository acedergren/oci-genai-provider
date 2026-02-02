# OCI GenAI Provider

Oracle Cloud Infrastructure Generative AI provider for the Vercel AI SDK, with compatibility wrappers and development tools.

## Quick Start

- **Package Manager**: pnpm
- **Build**: `pnpm build`
- **Test**: `pnpm test`
- **Type Check**: `pnpm typecheck`

## Setup & Configuration

Detailed guides for project setup and configuration:

- [Credentials & Secrets](.claude/credentials.md) — GitHub PAT, OCI API keys, vault locations (git-ignored)
- [OCI Configuration](.claude/oci-setup.md) — Tenancy, regions, profiles, environment variables
- [CI/CD & Deployment](.claude/ci-cd.md) — Pre-commit hooks, GitHub Actions, deployment strategy
- [Security Practices](.claude/security.md) — Best practices for credentials, secrets, and access control
- [Code Standards](.claude/code-standards.md) — Naming conventions, patterns, and coding guidelines

## Technical References

- [Dependency Compatibility](.claude/dependency-compatibility-matrix.md) — Version matrix for AI SDK and OCI SDK
- [Upgrade Quick Reference](.claude/upgrade-quick-reference.md) — Migration guides for major version upgrades

## Key Information

- **Active Region**: `eu-frankfurt-1` (FRANKFURT profile)
- **Alternative Regions**: `eu-stockholm-1` (STOCKHOLM), `us-ashburn-1` (ASHBURN)
- **Service**: OCI Generative AI
- **Authentication**: OCI API key from `~/.oci/config`
- **SDK**: OCI SDK for Node.js/TypeScript
- **Package Registry**: GitHub Packages (`@acedergren` scope)

## Project Structure

Monorepo containing the OCI GenAI provider ecosystem for AI development.

```
.
├── packages/
│   ├── oci-genai-provider/        # Core OCI GenAI provider for Vercel AI SDK
│   ├── oci-anthropic-compatible/  # Anthropic API compatibility wrapper
│   ├── oci-openai-compatible/     # OpenAI API compatibility wrapper
│   ├── oci-genai-setup/           # Interactive CLI setup tool
│   └── test-utils/                # Shared test utilities
└── .claude/                        # Agent instructions
```

**Note:** Example applications have been extracted to a separate repository:

- [oci-genai-examples](https://github.com/acedergren/oci-genai-examples) - Demo apps and integration examples

---

**Last Updated**: 2026-02-01
