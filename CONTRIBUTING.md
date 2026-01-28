# Contributing to OpenCode OCI GenAI

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (preferred) or npm
- OCI account with Generative AI access (for testing)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/acedergren/opencode-oci-genai.git
cd opencode-oci-genai

# Install dependencies
pnpm install

# Build packages
pnpm build

# Run tests
pnpm test

# Start development mode
pnpm dev
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

## How to Contribute

### Reporting Bugs

Before creating a bug report:

1. Check existing [GitHub Issues](https://github.com/acedergren/opencode-oci-genai/issues)
2. Check [Discussions](https://github.com/acedergren/opencode-oci-genai/discussions)

**When creating a bug report, include:**

- Clear, descriptive title
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (Node version, OS, etc.)
- Code examples (if applicable)
- Screenshots (if applicable)

### Requesting Features

**Before requesting a feature:**

1. Check existing issues and discussions
2. Consider if it's in scope for the project
3. Think about impact and use cases

**When requesting a feature:**

- Clear, descriptive title
- Use case and motivation
- Proposed solution (if you have ideas)
- Alternative approaches (if applicable)
- Additional context

### Submitting Code Changes

#### Process

1. **Fork** the repository
2. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Make your changes** following code standards
4. **Write or update tests** for your changes
5. **Commit** with meaningful messages
6. **Push** to your fork
7. **Open a Pull Request** with a clear description

#### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates
- `chore/description` - Maintenance tasks

#### Commit Messages

Use clear, conventional commit messages:

```
feat(package): add new feature
fix(package): resolve issue with X
docs: update README with example
test: add tests for auth module
chore: update dependencies
```

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

See [Conventional Commits](https://www.conventionalcommits.org/) for details.

#### Code Standards

**TypeScript/JavaScript:**

- Follow ESLint rules (configured in project)
- Format code with Prettier: `pnpm format`
- Use strict TypeScript (`strict: true` in tsconfig)
- Add JSDoc comments for public APIs
- Write tests for new functionality

**Example:**

```typescript
/**
 * Creates an OCI-configured OpenAI client
 *
 * @param config - OCI configuration
 * @returns Configured OpenAI client
 *
 * @example
 * ```typescript
 * const client = createOCIOpenAI({
 *   region: 'us-ashburn-1',
 *   apiKey: process.env.OCI_API_KEY,
 *   compartmentId: process.env.OCI_COMPARTMENT_ID,
 * });
 * ```
 */
export function createOCIOpenAI(config: OCIOpenAIConfig): OpenAI {
  // implementation
}
```

### Pull Request Guidelines

**Before submitting:**

1. Ensure all tests pass: `pnpm test`
2. Verify type checking: `pnpm type-check`
3. Check formatting: `pnpm format`
4. Lint code: `pnpm lint`
5. Update relevant documentation

**PR Description:**

```markdown
## Summary
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Changes
- Bullet point describing each change
- Another change

## Testing
Describe how you tested the changes:
- [ ] Added unit tests
- [ ] Added integration tests
- [ ] Tested locally with: [steps]

## Documentation
- [ ] Updated README
- [ ] Added JSDoc comments
- [ ] Updated CHANGELOG

## Checklist
- [ ] Code follows project style guidelines
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter @acedergren/oci-openai-compatible test

# Run tests with coverage
pnpm test -- --coverage
```

### Writing Tests

- Use Jest for unit tests
- Place tests in `src/__tests__/` directory
- Use `.test.ts` file extension
- Aim for >80% code coverage
- Test both happy path and error cases

**Example:**

```typescript
import { describe, it, expect } from '@jest/globals';
import { createOCIOpenAI } from '../client';

describe('createOCIOpenAI', () => {
  it('should create client with valid config', () => {
    const client = createOCIOpenAI({
      region: 'us-ashburn-1',
      compartmentId: 'ocid1.test',
    });

    expect(client).toBeDefined();
  });

  it('should throw error if compartment ID missing', () => {
    expect(() => createOCIOpenAI({})).toThrow();
  });
});
```

## Documentation

### README Standards

- Clear overview of what the package does
- Installation instructions
- Quick start example
- API documentation
- Configuration options
- Examples for common use cases
- Links to detailed docs

### JSDoc Comments

- Document all public exports
- Include `@param`, `@returns`, `@example` tags
- Explain non-obvious logic
- Link to related documentation

### Changelog

Update `CHANGELOG.md` (or package-specific changelog) with:

```markdown
## [0.2.0] - 2025-01-28

### Added
- New feature X
- Support for region Y

### Fixed
- Bug with authentication
- Documentation typo

### Changed
- Renamed function from X to Y
```

## Package-Specific Guidelines

### oci-openai-compatible

- Maintain OpenAI SDK compatibility
- Document deviations from OpenAI behavior
- Test with multiple OCI regions
- Keep bundle size minimal
- Add examples for new features

### oci-genai-provider

- Follow Vercel AI SDK patterns
- Support new models as OCI releases them
- Maintain backwards compatibility where possible
- Document model capabilities

### opencode-integration

- Keep integration lightweight
- Document OpenCode setup steps
- Test with OpenCode CLI

## Getting Help

- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/acedergren/opencode-oci-genai/discussions)
- **Issues**: Report bugs in [GitHub Issues](https://github.com/acedergren/opencode-oci-genai/issues)
- **Security**: Report vulnerabilities in [SECURITY.md](./SECURITY.md)

## Project Structure

```
opencode-oci-genai/
├── packages/
│   ├── oci-openai-compatible/   # OpenAI-compatible wrapper
│   ├── oci-genai-provider/      # Native OCI provider
│   ├── opencode-integration/    # OpenCode integration
│   └── test-utils/              # Shared testing utilities
├── examples/                    # Example applications
├── docs/                        # Project documentation
└── .github/                     # GitHub configuration
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm --filter @acedergren/oci-openai-compatible build

# Run tests
pnpm test

# Format code
pnpm format

# Lint code
pnpm lint

# Type check
pnpm type-check

# Watch mode for development
pnpm dev
```

## Release Process

(Documented in [DEVELOPMENT.md](./DEVELOPMENT.md))

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Create git tag
5. Push to remote
6. Publish to npm via GitHub Actions

## Recognition

Contributors are recognized in:

- GitHub Contributors page
- `CONTRIBUTORS.md` (if maintained)
- Release notes for major contributions

## Questions?

- Check [DEVELOPMENT.md](./DEVELOPMENT.md) for setup details
- Review [SECURITY.md](./SECURITY.md) for security guidelines
- Read existing code and tests for examples

---

**Thank you for contributing!** 🙏

Your contributions make this project better for everyone.
