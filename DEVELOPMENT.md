# Development Guide

Complete guide for setting up the development environment and working with the OpenCode OCI GenAI project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Building & Testing](#building--testing)
4. [Working with Packages](#working-with-packages)
5. [Debugging](#debugging)
6. [Committing & CI](#committing--ci)
7. [Publishing](#publishing)

## Prerequisites

### Required

- **Node.js**: 20.0.0 or higher ([download](https://nodejs.org/))
- **pnpm**: 8.0.0 or higher
  ```bash
  npm install -g pnpm
  ```
- **Git**: Latest version

### Optional but Recommended

- **OCI Account**: For testing with real OCI services
  - Tenancy OCID
  - User OCID
  - API key and fingerprint
  - Compartment OCID
- **VS Code**: With extensions:
  - TypeScript Vue Plugin
  - Prettier - Code formatter
  - ESLint
  - Svelte for VS Code (if working on examples)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/acedergren/opencode-oci-genai.git
cd opencode-oci-genai
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs dependencies for all packages in the monorepo.

### 3. Set Up Environment Variables

Create `.env.local` in the root directory:

```bash
# OCI Configuration
export OCI_REGION="us-ashburn-1"
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1...."
export OCI_API_KEY="$(cat ~/.oci/oci_api_key.pem)"
export OCI_FINGERPRINT="94:99:26:62:b4:e1:05:dd:39:fb:94:00:63:e6:2c:dc"
export OCI_TENANCY_ID="ocid1.tenancy.oc1...."
export OCI_USER_ID="ocid1.user.oc1...."

# GitHub Package Registry (if publishing)
export GITHUB_PAT="your-personal-access-token"
```

**Never commit `.env.local` to git!** It's already in `.gitignore`.

### 4. Verify Setup

```bash
# Check Node version
node --version  # Should be 20+

# Check pnpm version
pnpm --version  # Should be 8+

# List all packages
pnpm ls --depth=0

# Build all packages
pnpm build
```

## Building & Testing

### Development Workflow

```bash
# Install dependencies (one-time)
pnpm install

# Build all packages
pnpm build

# Watch mode (auto-rebuild on changes)
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm type-check

# Linting
pnpm lint

# Code formatting
pnpm format
```

### Build Specific Package

```bash
# Build just one package
pnpm --filter @acedergren/oci-openai-compatible build

# Run tests for one package
pnpm --filter @acedergren/oci-openai-compatible test

# Watch mode for one package
pnpm --filter @acedergren/oci-openai-compatible dev
```

### Pre-commit Checks

The project uses Husky hooks that automatically:

1. Run ESLint and Prettier
2. Type check all files
3. Run test suite
4. Check for exposed secrets

If checks fail:

```bash
# Fix formatting issues
pnpm format

# Fix ESLint issues
pnpm lint -- --fix

# Re-run type checking
pnpm type-check
```

## Working with Packages

### Package Structure

```
packages/
├── oci-openai-compatible/     # OpenAI-compatible wrapper
│   ├── src/
│   │   ├── types.ts
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── endpoint.ts
│   │   ├── index.ts
│   │   └── __tests__/
│   ├── examples/
│   ├── docs/
│   ├── package.json
│   └── README.md
├── oci-genai-provider/        # Native OCI provider
├── opencode-integration/      # OpenCode integration
└── test-utils/                # Shared test utilities
```

### Adding a New File

1. Create the file in the appropriate package
2. Add proper TypeScript types
3. Add JSDoc comments for public exports
4. Create tests in `__tests__/` directory
5. Update relevant documentation

### Modifying Dependencies

```bash
# Add a dependency to a specific package
pnpm --filter @acedergren/oci-openai-compatible add lodash

# Add a dev dependency
pnpm --filter @acedergren/oci-openai-compatible add -D @types/lodash

# Update dependencies
pnpm update

# Check for security vulnerabilities
npm audit
```

## Debugging

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Single Run",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Watch",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--watch", "--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Console Debugging

```typescript
// Add temporary console logs
console.log('Debug info:', variable);

// Use debugger statement (then run node with --inspect)
debugger;

// Run with inspector
node --inspect-brk dist/index.js
```

### Running Single Test

```bash
# Run one test file
pnpm test src/__tests__/client.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="should create client"

# Run with verbose output
pnpm test -- --verbose
```

## Committing & CI

### Pre-commit Workflow

1. Make changes
2. Verify tests pass: `pnpm test`
3. Format code: `pnpm format`
4. Stage changes: `git add .`
5. Commit: `git commit -m "feat: description"`
6. Hooks run automatically
7. If checks fail, fix and re-commit

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance
- `refactor`: Code refactoring
- `perf`: Performance improvement

**Scopes:**
- `oci-openai-compatible`
- `oci-genai-provider`
- `opencode-integration`
- `test-utils`
- (empty for project-wide changes)

**Examples:**

```bash
git commit -m "feat(oci-openai-compatible): add streaming support"
git commit -m "fix(oci-genai-provider): handle timeout errors"
git commit -m "docs: update README with examples"
```

### CI/CD Checks

When you push to GitHub, automated checks run:

1. **Build**: Verify packages build
2. **Tests**: Run full test suite
3. **Type Check**: TypeScript validation
4. **Lint**: Code style validation
5. **Security**: Dependency audit

View logs in GitHub Actions tab.

## Publishing

### Publishing to npm

**Automated (Recommended):**

1. Update version in `packages/*/package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v0.2.0`
4. Push: `git push origin main --tags`
5. GitHub Actions publishes automatically

**Manual (if needed):**

```bash
# Publish specific package
pnpm --filter @acedergren/oci-openai-compatible publish

# Publish from dist directory
pnpm --filter @acedergren/oci-openai-compatible publish --tag latest
```

### Version Bumping

```bash
# Manual version update
npm version patch    # 0.1.0 -> 0.1.1 (bug fixes)
npm version minor    # 0.1.0 -> 0.2.0 (new features)
npm version major    # 0.1.0 -> 1.0.0 (breaking changes)
```

## Useful Commands Reference

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages |
| `pnpm dev` | Watch mode |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm type-check` | TypeScript validation |
| `pnpm lint` | Code linting |
| `pnpm format` | Code formatting |
| `pnpm --filter <pkg> build` | Build specific package |
| `pnpm --filter <pkg> test` | Test specific package |
| `git status` | Check git status |
| `git log --oneline` | View commit history |

## Troubleshooting

### Issue: Build fails with "module not found"

```bash
# Clean and reinstall
rm -rf node_modules
pnpm install
pnpm build
```

### Issue: Tests fail intermittently

```bash
# Clear cache
pnpm test -- --clearCache

# Run single test to isolate
pnpm test src/__tests__/specific.test.ts
```

### Issue: Pre-commit hook fails

```bash
# Fix formatting
pnpm format

# Fix ESLint errors
pnpm lint -- --fix

# Re-stage and commit
git add .
git commit -m "fix: message"
```

### Issue: Type errors after dependency update

```bash
# Regenerate types
pnpm type-check

# May need to clear TypeScript cache
rm -rf dist
pnpm build
```

## Getting Help

- **Setup Issues**: Check [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Security Questions**: See [SECURITY.md](./SECURITY.md)
- **Contributing**: Review [CONTRIBUTING.md](./CONTRIBUTING.md)
- **GitHub Discussions**: Ask in [GitHub Discussions](https://github.com/acedergren/opencode-oci-genai/discussions)

---

Happy coding! 🚀
