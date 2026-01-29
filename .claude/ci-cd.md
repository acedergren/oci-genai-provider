# CI/CD & Deployment

Pre-commit hooks, GitHub Actions workflows, and deployment strategy.

## Pre-Commit Hooks

Husky is configured to run the following checks before every commit:

### 1. Linting
**Tool**: ESLint

**Purpose**: Validate code style and catch common mistakes

**Run**: Automatic on staged files

### 2. Type Checking
**Tool**: TypeScript (`tsc --noEmit`)

**Purpose**: Ensure all TypeScript files are type-correct

**Scope**: Entire project (TypeScript strict mode enabled)

### 3. Format Checking
**Tool**: Prettier

**Purpose**: Ensure consistent code formatting

**Config**: `.prettierrc` configuration file

### 4. Security Scanning
**Tool**: Semgrep or secret scanning

**Purpose**: Check for exposed secrets and security vulnerabilities

**Scope**: All files except git-ignored

### 5. Tests
**Tool**: Vitest / Jest (framework-specific)

**Purpose**: Run unit tests before allowing commit

**Requirement**: All tests must pass

## GitHub Actions Workflows

### Build & Test Workflow
**Trigger**: All pushes and pull requests

**Steps**:
1. Checkout code
2. Install dependencies (`pnpm install`)
3. Run linting
4. Run type checks
5. Run tests with coverage
6. Run build

**Status**: Required for PR merge

### Publish Workflow
**Trigger**: Version tags (e.g., `v1.0.0`)

**Steps**:
1. Checkout code
2. Install dependencies
3. Build project
4. Publish to GitHub Packages npm registry
5. Create GitHub release

**Scope**: Only `@acedergren/*` packages

**Registry**: `https://npm.pkg.github.com/@acedergren`

## Deployment Strategy

### Development
1. Create feature branch: `git checkout -b feature/description`
2. Commit changes locally (pre-commit hooks verify quality)
3. Push to feature branch
4. Create pull request to `main`

### Testing
1. PR triggers full test suite on GitHub Actions
2. Linting, type checking, tests, and build must pass
3. Code review before merge

### Publishing
1. Merge PR to `main`
2. Update version in `package.json` (follow semver)
3. Create version tag: `git tag v1.0.0`
4. Push tag: `git push --tags`
5. GitHub Actions automatically publishes to npm

## Environment Variables in CI/CD

Sensitive credentials are stored as GitHub Secrets, not in `.env`:

**Required Secrets**:
- `GITHUB_PAT` — GitHub Personal Access Token
- `OCI_COMPARTMENT_ID` — OCI Compartment ID
- `OCI_REGION` — Default OCI Region
- `OCI_CONFIG_PROFILE` — OCI CLI profile name

**Access**: Available to workflows via `${{ secrets.SECRET_NAME }}`

### Example Workflow Usage
```yaml
- name: Install dependencies
  run: pnpm install
  env:
    GITHUB_PAT: ${{ secrets.GITHUB_PAT }}

- name: Build
  run: pnpm build
  env:
    OCI_COMPARTMENT_ID: ${{ secrets.OCI_COMPARTMENT_ID }}
    OCI_REGION: ${{ secrets.OCI_REGION }}
```

## Versioning Strategy

**Semantic Versioning** (semver):
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- `MAJOR` — Breaking changes
- `MINOR` — New features (backward compatible)
- `PATCH` — Bug fixes

**Tag Format**: `v{version}` (e.g., `v1.0.0`)

## Runners

**Self-Hosted Runners**: gha01, gha02

**Configuration**:
- Private runners shared across organization
- Node.js 22 installed natively
- Docker available for container jobs
- pnpm configured globally
- Zero GitHub Actions minutes cost

**Container Jobs** (CI, Test Suite, Publish):
- Use `node:22-bookworm` image for consistent environments
- Faster than GitHub-hosted runners (no cold start)

**Native Jobs** (Deploy):
- Run directly on runner for faster startup
- Ideal for deployment workflows

**External Workflows** (Claude Code):
- Use GitHub-hosted runners (`ubuntu-latest`)
- Better for external API integrations

## Skipping CI/CD

For commits that don't require full CI/CD (documentation, etc.):

```bash
git commit -m "docs: update README" --no-verify
```

⚠️ **Warning**: Skipping checks can introduce bugs or security issues. Use sparingly.

## Related Files

- [OCI Configuration](./oci-setup.md) — Environment variables and regional setup
- [Security Practices](./security.md) — Handling credentials in workflows
