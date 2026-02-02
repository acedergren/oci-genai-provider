# OpenCode OCI GenAI Project Overview

## Project Identity

**Name**: OpenCode OCI GenAI
**Purpose**: Enables OCI (Oracle Cloud Infrastructure) Generative AI capabilities within OpenCode
**Repository**: oci-genai-provider
**Location**: `/Users/acedergr/Projects/oci-genai-provider`

## Technology Stack

- **Package Manager**: pnpm (workspace monorepo)
- **Language**: TypeScript with strict mode
- **Runtime**: Node.js
- **SDK**: OCI SDK for Node.js/TypeScript
- **AI Framework**: Vercel AI SDK v3 (LanguageModelV3)
- **Build Tool**: tsup (dual CJS + ESM)
- **Test Framework**: Jest with @jest/globals
- **Registry**: GitHub Packages (`@acedergren` scope)

## OCI Configuration

### Active Configuration

- **Primary Region**: `eu-frankfurt-1` (FRANKFURT profile)
- **Alternative Regions**:
  - `eu-stockholm-1` (STOCKHOLM)
  - `us-ashburn-1` (ASHBURN)
- **Service**: OCI Generative AI
- **Authentication**: OCI API key from `~/.oci/config`

### Authentication Methods

1. **Config File** (default): Reads from ~/.oci/config
2. **Instance Principal**: For OCI Compute instances
3. **Resource Principal**: For OCI Functions

## Project Structure

```
oci-genai-provider/
├── packages/                      # Core packages
│   ├── oci-genai-provider/       # Standalone Vercel AI SDK provider
│   ├── oci-openai-compatible/     # OpenCode-specific wrapper
│   └── test-utils/               # Shared test mocks and fixtures
├── examples/                      # Demo applications
│   ├── chatbot-demo/             # SvelteKit chatbot
│   ├── nextjs-chatbot/           # Next.js chatbot
│   ├── cli-tool/                 # Terminal REPL chat
│   ├── rag-demo/                 # Semantic document retrieval
│   ├── rag-reranking-demo/       # RAG with reranking
│   └── stt-demo/                 # Speech-to-text transcription
├── .claude/                       # AI agent instructions
│   ├── oci-setup.md              # OCI configuration guide
│   ├── ci-cd.md                  # CI/CD and deployment
│   ├── security.md               # Security best practices
│   ├── code-standards.md         # Naming conventions
│   ├── credentials.md            # Credentials guide (local only)
│   └── dependency-compatibility-matrix.md
├── scripts/                       # Automation scripts
│   ├── check-upgrade-status.sh
│   ├── upgrade-phase1-security.sh
│   └── upgrade-rollback.sh
├── CLAUDE.md                      # Main project instructions
├── UPGRADE_PLAN.md               # Dependency upgrade plan
└── UPGRADE_CHECKLIST.md          # Upgrade progress tracking
```

## Key Commands

```bash
# Build
pnpm build                         # Build all packages

# Test
pnpm test                          # Run all tests
pnpm test:coverage                 # Coverage report
pnpm typecheck                     # TypeScript validation

# Development
pnpm --filter <package> dev        # Watch mode for specific package
pnpm --filter <package> build      # Build specific package
pnpm --filter <package> test       # Test specific package
```

## Package Publishing

**Registry**: GitHub Packages
**Scope**: `@acedergren`

**Published Packages**:

1. `@acedergren/oci-genai-provider` - Core provider (public)
2. `@acedergren/oci-genai-provider` - OpenCode integration (public)

**Private Packages**:

- `@acedergren/test-utils` - Internal test utilities

## Recent Git Activity

**Current Branch**: main

**Recent Commits** (latest first):

1. `7c60291` - test(coverage): add object-storage and transcription error path tests
2. `dc84954` - docs: link code standards from CLAUDE.md
3. `d0e7795` - docs: add code standards and naming conventions
4. `fd0bd82` - test(e2e): add workflow integration tests for RAG and multimodal pipelines
5. `6520a45` - test(01-02): add converter branch coverage for non-text content

**Untracked Files**:

- `.claude/credentials.md` - Local credentials guide
- `.claude/dependency-compatibility-matrix.md` - Dependency tracking
- `.firecrawl/` - Web scraping integration
- `UPGRADE_CHECKLIST.md` - Upgrade progress
- `UPGRADE_PLAN.md` - Upgrade strategy
- `scripts/check-upgrade-status.sh` - Status checker
- `scripts/upgrade-phase1-security.sh` - Security upgrades
- `scripts/upgrade-rollback.sh` - Rollback script
- `examples/chatbot-demo/vitest.config.ts.timestamp-*` - Build artifact

## Development Workflow

**Approach**: Test-Driven Development (TDD)
**Cycle**: RED → GREEN → REFACTOR → COMMIT
**Coverage Target**: 80%+ (branches, functions, lines, statements)
**Commit Convention**: Conventional Commits with Co-Authored-By: Claude

## Current Phase

**Status**: Active development
**Focus Areas**:

1. Dependency upgrades and compatibility verification
2. Test coverage completion and quality improvements
3. Example application enhancements
4. Documentation refinement

## Documentation Locations

- **Main Instructions**: `CLAUDE.md`
- **Agent Guides**: `.claude/` directory
- **API Docs**: `packages/*/README.md`
- **Implementation Plans**: `docs/plans/`
- **Architecture**: `docs/architecture/`
- **Testing Guide**: `docs/testing/`

## External Dependencies

**Core Runtime**:

- `oci-sdk` - Official OCI SDK for Node.js
- `ai` - Vercel AI SDK v3
- `eventsource-parser` - SSE stream parsing

**Build & Test**:

- `tsup` - TypeScript bundler
- `jest` - Test runner
- `typescript` - Type checking

**Examples**:

- `@sveltejs/kit` - SvelteKit framework (chatbot-demo)
- `next` - Next.js framework (nextjs-chatbot)

## Integration Points

**OpenCode**: Via `@acedergren/oci-genai-provider` wrapper package
**Vercel AI SDK**: Implements `LanguageModelV3` interface
**OCI GenAI**: Authenticated API calls to OCI Generative AI service

## Security & Credentials

- **Credentials Storage**: ~/.oci/config (standard OCI location)
- **Environment Variables**: OCI_REGION, OCI_COMPARTMENT_ID, OCI_PROFILE
- **Secrets**: Never committed to git
- **Documentation**: `.claude/credentials.md` (gitignored)
- **Security Guide**: `.claude/security.md`
