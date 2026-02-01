# OpenCode OCI GenAI Project

Enables OCI Generative AI capabilities within OpenCode.

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

```
.
├── packages/
│   ├── oci-genai-provider/    # Core AI SDK V3 provider
│   ├── oci-openai-compatible/ # OpenAI-compatible API wrapper
│   ├── opencode-integration/  # OpenCode CLI integration
│   ├── oci-genai-setup/       # Setup wizard (AI SDK, OpenCode, Claude Code)
│   ├── agent-state/           # Agent state management
│   └── test-utils/            # Shared test utilities
├── examples/
│   ├── oci-ai-chat/           # SvelteKit chat application
│   ├── chatbot-demo/          # Basic chatbot demo
│   ├── nextjs-chatbot/        # Next.js chatbot
│   ├── cli-tool/              # Terminal REPL chat
│   ├── fraud-analyst-agent/   # AI agent demo
│   ├── rag-demo/              # Semantic document retrieval
│   ├── rag-reranking-demo/    # RAG with reranking
│   ├── stt-demo/              # Speech-to-text transcription
│   └── realtime-stt-demo/     # Realtime STT demo
└── .claude/                    # Agent instructions
```

---

**Last Updated**: 2026-02-01
