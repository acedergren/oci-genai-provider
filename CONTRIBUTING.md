# Contributing

Thank you for considering a contribution. This guide will help you get started.

## Before You Start

1. **Check existing issues** — Someone may already be working on what you have in mind. Look at [open issues](https://github.com/acedergren/oci-genai-provider/issues) and [discussions](https://github.com/acedergren/oci-genai-provider/discussions).

2. **Read the code of conduct** — We maintain a welcoming environment. Please review our [Code of Conduct](./CODE_OF_CONDUCT.md).

3. **Set up your environment** — Follow [DEVELOPMENT.md](./DEVELOPMENT.md) to configure your development setup.

## Making Changes

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/oci-genai-provider.git
cd oci-genai-provider
pnpm install
```

### 2. Create a Branch

Use a descriptive branch name that indicates what you're working on:

```bash
git checkout -b feature/add-embedding-support
git checkout -b fix/streaming-timeout
git checkout -b docs/improve-auth-guide
```

**Branch prefixes:**

- `feature/` — New functionality
- `fix/` — Bug fixes
- `docs/` — Documentation changes
- `refactor/` — Code restructuring without behavior changes
- `test/` — Test additions or improvements
- `chore/` — Maintenance tasks

### 3. Write Your Code

Follow these standards:

**TypeScript**

- Use strict mode (no `any` types)
- Add explicit return types to functions
- Include JSDoc comments for public APIs
- Run `pnpm lint` before committing

**Testing**

- Write tests for new functionality
- Update tests when modifying existing code
- Target 80%+ code coverage
- Run `pnpm test` before committing

**Documentation**

- Update README files when adding features
- Add JSDoc comments with examples
- Update CHANGELOG.md for notable changes

### 4. Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

Body explaining what and why (optional)

Closes #123 (optional)
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

**Scopes:** `provider`, `opencode`, `openai-compat`, `auth`, `streaming`, `docs`

**Examples:**

```bash
git commit -m "feat(provider): add embedding model support"
git commit -m "fix(streaming): handle connection reset errors"
git commit -m "docs: clarify authentication setup"
```

### 5. Push and Open a Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub with:

- A clear title describing the change
- A description of what changed and why
- Reference to any related issues
- Screenshots for UI changes

## Pull Request Checklist

Before requesting review, verify:

- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Code follows style guidelines (`pnpm lint`)
- [ ] Documentation is updated if needed
- [ ] CHANGELOG.md is updated for notable changes
- [ ] Commits follow conventional format

## What We're Looking For

**Good contributions:**

- Fix bugs that affect users
- Add features that align with project goals
- Improve documentation clarity
- Increase test coverage
- Enhance error messages

**We'll likely decline:**

- Breaking changes without prior discussion
- Features that significantly increase complexity
- Code that doesn't pass tests or type checking
- Changes without tests for new behavior

## Types of Contributions

### Bug Reports

Open an issue with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS)
- Error messages or stack traces

### Feature Requests

Open an issue or discussion with:

- Description of the feature
- Use case explaining why it's needed
- Proposed implementation approach
- Consideration of alternatives

### Documentation

Documentation improvements are always welcome:

- Fix typos or unclear explanations
- Add missing examples
- Improve troubleshooting guides
- Update outdated information

### Code

For significant changes, open an issue first to discuss the approach. This prevents wasted effort on changes that may not fit the project direction.

## Package-Specific Guidelines

### oci-genai-provider

The core provider should:

- Maintain Vercel AI SDK compatibility
- Support all OCI regions
- Handle errors gracefully with actionable messages
- Keep bundle size reasonable

### oci-openai-compatible

The OpenAI wrapper should:

- Match OpenAI SDK behavior closely
- Document any behavioral differences
- Remain lightweight with minimal dependencies

### opencode-integration

The OpenCode integration should:

- Stay thin (delegate to core provider)
- Focus on OpenCode-specific configuration
- Document OpenCode setup clearly

## Getting Help

- **Questions**: Open a [discussion](https://github.com/acedergren/oci-genai-provider/discussions)
- **Bugs**: Open an [issue](https://github.com/acedergren/oci-genai-provider/issues)
- **Security**: See [SECURITY.md](./SECURITY.md) for responsible disclosure

## Recognition

Contributors are acknowledged in:

- GitHub's contributors page
- Release notes for significant contributions

---

Thank you for helping improve this project.
