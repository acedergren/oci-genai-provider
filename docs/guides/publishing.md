# Publishing to GitHub Package Registry

This guide covers how to publish the OCI GenAI Provider packages to GitHub Package Registry.

## Prerequisites

- GitHub Personal Access Token with `write:packages` scope
- Access to the `acedergren` GitHub organization/user

## Package Configuration

Both packages are configured for GitHub Package Registry:

- **Registry**: `https://npm.pkg.github.com`
- **Scope**: `@acedergren`
- **Access**: Public (within GitHub authentication)

### Packages

| Package                          | Description                  | Size    |
| -------------------------------- | ---------------------------- | ------- |
| `@acedergren/oci-genai-provider` | Core Vercel AI SDK provider  | ~23 KB  |
| `@acedergren/opencode-oci-genai` | OpenCode integration wrapper | ~2.6 KB |

### Package Contents

Each package includes:

- `dist/index.js` - CommonJS bundle
- `dist/index.mjs` - ESM bundle
- `dist/index.d.ts` - TypeScript declarations
- `dist/index.d.mts` - ESM TypeScript declarations
- `README.md` - Package documentation
- `package.json` - Package metadata

## Automated Publishing

Packages are automatically published when you create a version tag:

```bash
# Bump version (updates all workspace packages)
pnpm version patch  # or minor, major

# Push tags to trigger publish
git push --tags
```

The GitHub Actions workflow (`.github/workflows/publish.yml`) handles:

1. Building all packages
2. Running tests
3. Publishing to GitHub Package Registry

### Workflow Trigger

The publish workflow triggers on:

- Version tags matching `v*` pattern (e.g., `v0.1.0`, `v1.0.0`)

## Manual Publishing

For manual publishing (requires `GITHUB_TOKEN` environment variable):

```bash
# Build packages
pnpm build

# Dry run to verify
pnpm --filter @acedergren/oci-genai-provider publish --dry-run --no-git-checks
pnpm --filter @acedergren/opencode-oci-genai publish --dry-run --no-git-checks

# Actual publish
pnpm -r publish --no-git-checks
```

### Environment Setup

Set the GitHub token for authentication:

```bash
# Using environment variable
export GITHUB_TOKEN=your_github_pat

# Or configure npm/pnpm
npm login --registry=https://npm.pkg.github.com
```

## Installing Published Packages

Users need to configure npm/pnpm for the GitHub registry:

### 1. Create .npmrc Configuration

Add to your project's `.npmrc` (or global `~/.npmrc`):

```
@acedergren:registry=https://npm.pkg.github.com
```

### 2. Authenticate with GitHub

```bash
# Option 1: npm login
npm login --registry=https://npm.pkg.github.com

# Option 2: Set token in .npmrc
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

### 3. Install Packages

```bash
# Install core provider
pnpm add @acedergren/oci-genai-provider

# Or install OpenCode wrapper (includes core provider)
pnpm add @acedergren/opencode-oci-genai
```

## Version Management

This monorepo uses independent versioning for each package. To bump versions:

```bash
# Bump patch version (0.1.0 -> 0.1.1)
cd packages/oci-genai-provider
pnpm version patch

# Bump minor version (0.1.0 -> 0.2.0)
pnpm version minor

# Bump major version (0.1.0 -> 1.0.0)
pnpm version major
```

## Troubleshooting

### Authentication Errors

**Error**: `401 Unauthorized` or `403 Forbidden`

**Solution**: Ensure your `GITHUB_TOKEN` has `write:packages` permission:

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Create or update token with `write:packages` scope
3. For organization packages, ensure the token has SSO authorization if required

### Package Already Exists

**Error**: `403 Forbidden - Package version already exists`

**Solution**: GitHub Package Registry doesn't allow overwriting versions. You must bump the version number before publishing again.

### 404 Not Found on Install

**Error**: `404 Not Found` when trying to install

**Solutions**:

1. Ensure the installing user has `read:packages` scope on their GitHub PAT
2. Verify the user is authenticated: `npm login --registry=https://npm.pkg.github.com`
3. Check that `.npmrc` has the correct registry configuration

### Git Checks Failure

**Error**: `ERR_PNPM_GIT_UNCLEAN Unclean working tree`

**Solution**: Either commit your changes first, or use `--no-git-checks` flag:

```bash
pnpm -r publish --no-git-checks
```

### Workspace Protocol Resolution

**Error**: Dependencies with `workspace:*` not resolved

**Solution**: The pnpm publish command automatically converts `workspace:*` to actual version numbers. If this fails, ensure you've built the packages first:

```bash
pnpm build
pnpm -r publish --no-git-checks
```

## Verifying Published Packages

After publishing, verify packages are accessible:

```bash
# View package info
npm view @acedergren/oci-genai-provider --registry=https://npm.pkg.github.com

# List available versions
npm view @acedergren/oci-genai-provider versions --registry=https://npm.pkg.github.com
```

## Security Considerations

1. **Never commit tokens** - Use environment variables or secure credential storage
2. **Use minimal scopes** - Only request `read:packages` for consumers, `write:packages` for publishers
3. **Rotate tokens regularly** - Update PATs periodically
4. **Audit package contents** - Use `pnpm pack` to inspect what's included before publishing
