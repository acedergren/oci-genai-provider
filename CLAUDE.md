# OpenCode OCI GenAI Project

Enables OCI Generative AI capabilities within OpenCode.

## Quick Start

- **Package Manager**: pnpm
- **Build**: `pnpm build`
- **Test**: `pnpm test`
- **Type Check**: `pnpm typecheck`

## Setup & Configuration

Detailed guides for project setup and configuration:

- [Credentials & Secrets](.claude/credentials.md) — GitHub PAT, OCI API keys, vault locations
- [OCI Configuration](.claude/oci-setup.md) — Tenancy, regions, profiles, environment variables
- [CI/CD & Deployment](.claude/ci-cd.md) — Pre-commit hooks, GitHub Actions, deployment strategy
- [Security Practices](.claude/security.md) — Best practices for credentials, secrets, and access control

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
├── packages/                   # Core packages
│   ├── oci-genai-provider/    # OCI GenAI provider (Vercel AI SDK integration)
│   └── ...
├── examples/                   # Demo applications
│   ├── chatbot-demo/          # SvelteKit chatbot
│   ├── nextjs-chatbot/        # Next.js chatbot
│   ├── cli-tool/              # Terminal REPL chat
│   ├── rag-demo/              # Semantic document retrieval
│   ├── rag-reranking-demo/    # RAG with reranking
│   └── stt-demo/              # Speech-to-text transcription
└── .claude/                    # Agent instructions
```

---

**Last Updated**: 2026-01-28
