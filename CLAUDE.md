# OpenCode OCI GenAI Project

This document provides Claude Code with essential project context, credentials locations, and configuration details.

## Project Overview

OpenCode OCI GenAI integration project for enabling OCI Generative AI capabilities within OpenCode.

### Monorepo Architecture

This project uses **pnpm workspaces** with three packages:

- `@acedergren/oci-genai-provider` - Core provider (standalone, published to npm)
- `@acedergren/opencode-oci-genai` - OpenCode integration (published to npm)
- `@acedergren/test-utils` - Shared test mocks and fixtures (private)

**Workspace Commands**:

```bash
pnpm install                          # Install all dependencies
pnpm build                            # Build all packages
pnpm test                             # Run all tests
pnpm --filter @acedergren/oci-genai-provider test    # Test specific package
pnpm --filter @acedergren/oci-genai-provider build   # Build specific package
```

## Credentials & Secrets

### GitHub Authentication

**GitHub Personal Access Token (PAT)**

- Location: `.env` file (variable: `GITHUB_PAT`)
- Current value stored in: `/Users/acedergr/Projects/opencode-oci-genai/.env`
- Scopes: `gist`, `read:org`, `repo`, `workflow`
- GitHub user: `acedergren`
- Used for: GitHub npm registry publishing, GitHub API access

### OCI DevOps Credentials

**DevOps Git Credentials**

- Username: Stored in `.env` as `OCI_DEVOPS_USERNAME`
- Token: Stored in `.env` as `OCI_DEVOPS_TOKEN`
- Used for: OCI DevOps Git repository access

### OCI Vault Secrets

**Vault Location**: `AC-Vault` (to be documented)

- Store sensitive credentials that should not be in `.env`
- Examples: API keys, database passwords, third-party service tokens

## OCI Configuration

### Tenancy Information

**Tenancy OCID**

```
ocid1.tenancy.oc1..aaaaaaaasb6hzdlysstqiacelk35wlgpjuottvsfkm6k7aa4ujrylb4shmra
```

**User OCID**

```
ocid1.user.oc1..aaaaaaaaow3f3fklz7nv7h4z7y7qvxenjrmo4qbe5z5ne7s2id4yhlyhsnpq
```

**Compartment OCID**

```
ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq
```

### Regions

**Available OCI CLI Profiles**:

- `DEFAULT` / `FRANKFURT` - Primary region: `eu-frankfurt-1`
- `STOCKHOLM` - Secondary region: `eu-stockholm-1`
- `ASHBURN` - US region: `us-ashburn-1`

**Current Active Profile**: `FRANKFURT` (eu-frankfurt-1)

**Environment Variables**:

- `OCI_REGION`: `eu-frankfurt-1`
- `OCI_COMPARTMENT_ID`: See compartment OCID above
- `OCI_CONFIG_PROFILE`: `FRANKFURT`
- `OCI_CONFIG_FILE`: `/Users/acedergr/.oci/config`
- `OCI_CLI_AUTH`: `api_key`

### OCI API Key

**Location**: `/Users/acedergr/.oci/oci_api_key.pem`
**Fingerprint**: `94:99:26:62:b4:e1:05:dd:39:fb:94:00:63:e6:2c:dc`

## Development Environment

### Environment Variables

All sensitive environment variables are stored in `.env` file (git-ignored):

- `GITHUB_PAT` - GitHub Personal Access Token
- `OCI_DEVOPS_USERNAME` - OCI DevOps Git username
- `OCI_DEVOPS_TOKEN` - OCI DevOps Git token
- `OCI_COMPARTMENT_ID` - Default OCI compartment
- `OCI_CONFIG_PROFILE` - Active OCI CLI profile
- `OCI_CONFIG_FILE` - Path to OCI config file

### Package Registry

**GitHub Packages (npm)**

- Registry: `https://npm.pkg.github.com/@acedergren`
- Authentication: Uses `GITHUB_PAT` from environment
- Publish scope: `@acedergren`

## Git Configuration

**Local Repository**: Initialized (no remote configured yet)
**Git Ignore**: Ensure `.env`, `*.pem`, and other secrets are excluded

## Pre-Commit Hooks

Pre-commit hooks are configured to run:

1. **Linting** - Code style validation
2. **Type Checking** - TypeScript validation
3. **Format Checking** - Prettier/formatting validation
4. **Security Scanning** - Check for exposed secrets
5. **Tests** - Run unit tests before commit

**Common Linting Issues**:

- Remove `async` from functions without `await` - use `Promise.resolve()` or `Promise.reject()` instead
- Prefix unused parameters with underscore (`_param`)
- Add explicit return types to functions

## Testing Strategy

**Test-Driven Development (TDD)**:

- 121 comprehensive tests across 14 test files
- 80%+ code coverage target (branches, functions, lines, statements)
- RED-GREEN-REFACTOR-COMMIT cycles with atomic commits
- Implementation plan: `docs/plans/2026-01-27-core-provider-tdd-implementation.md`

**Test Infrastructure** (`@acedergren/test-utils`):

- Shared OCI SDK mocks (oci-common, oci-generativeaiinference)
- Test fixtures: `TEST_CONFIG`, `TEST_MODEL_IDS`, `TEST_OCIDS`
- Usage: `import { TEST_CONFIG, TEST_MODEL_IDS } from '@acedergren/test-utils'`

## CI/CD Pipeline

**GitHub Actions Workflows**:

- **Build & Test**: Run on all pushes and PRs
- **Publish**: Publish to GitHub npm registry on version tags
- **Runners**: GitHub-hosted runners (ubuntu-latest)

### Deployment Strategy

1. **Development**: Push to feature branches
2. **Testing**: PR to main triggers full test suite
3. **Publishing**: Create version tag to trigger npm publish

## OCI Resources Discovery

Use OCI CLI to discover additional OCIDs:

```bash
# List compartments
oci iam compartment list --all

# List available regions
oci iam region-subscription list

# List resources in compartment
oci search resource structured-search --query-text "query all resources"
```

## Additional Notes

### Security Best Practices

1. **Never commit** `.env` file or `*.pem` files
2. **Use OCI Vault** for production secrets
3. **Rotate credentials** regularly
4. **Limit token scopes** to minimum required permissions
5. **Use GitHub Secrets** for CI/CD credentials

### OCI GenAI Integration

- Service: OCI Generative AI
- API Endpoint: Regional (based on active profile)
- Authentication: OCI API key (from `~/.oci/config`)
- SDK: OCI SDK for Node.js/TypeScript

## Serena Integration

**Project Memory**: Serena memories created for this project (activate with project path):

```bash
# Activate project: /Users/acedergr/Projects/opencode-oci-genai
```

**Available Memories**:

- `monorepo-architecture` - Package structure, dependencies, workspace commands
- `testing-strategy-tdd` - 121 tests, TDD workflow, test utilities
- `implementation-status` - Current status, completed/pending tasks, key decisions
- `core-provider-api` - Public API, module structure, usage examples

**When to Use**: Read relevant memories at session start to understand project context without re-exploration.

## Project Agents

**Agent Definitions**: Specialized Claude Code agents are defined in `agents.md` for workflow-specific tasks.

**Available Agents**:

1. **tdd-implementor** (color: green)
   - **Purpose**: Implements features following strict TDD RED-GREEN-REFACTOR-COMMIT cycles
   - **When to Use**: When implementing tasks from the TDD plan
   - **Tools**: Read, Write, Edit, Bash, Grep, Glob
   - **Example**: "Implement Task 1 from the TDD plan"

2. **monorepo-navigator** (color: purple)
   - **Purpose**: Navigate pnpm workspace monorepo, run package-specific commands
   - **When to Use**: When running tests/builds in specific packages or analyzing dependencies
   - **Tools**: Read, Bash, Grep, Glob
   - **Example**: "Run tests for the core provider package"

3. **docs-synchronizer** (color: cyan)
   - **Purpose**: Update documentation consistently across all files (docs/, READMEs, llms.txt, CLAUDE.md, Serena)
   - **When to Use**: When architecture changes or documentation needs syncing
   - **Tools**: Read, Edit, Write, Grep, Glob, Serena memory tools
   - **Example**: "Update documentation for the new streaming implementation"

4. **test-utils-manager** (color: yellow)
   - **Purpose**: Manage @acedergren/test-utils package, OCI SDK mocks, and test fixtures
   - **When to Use**: When adding fixtures, updating mocks, or managing test infrastructure
   - **Tools**: Read, Edit, Write, Grep, Bash
   - **Example**: "Add a new model ID fixture for testing"

**How to Invoke**: Use the Task tool with the appropriate `subagent_type` when the task matches an agent's purpose.

## Key Documentation

- **Architecture**: `docs/architecture/README.md` - Monorepo structure, design decisions
- **Testing Guide**: `docs/testing/README.md` - TDD workflow, best practices, coverage
- **Implementation Plans**: `docs/plans/` - TDD plan, test specifications
- **Getting Started**: `docs/getting-started/README.md` - Package selection, installation
- **Package READMEs**: `packages/*/README.md` - Package-specific documentation

---

**Last Updated**: 2026-01-27
**Maintained By**: Claude Code
