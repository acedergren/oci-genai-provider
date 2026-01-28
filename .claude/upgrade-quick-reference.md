# Dependency Upgrade Quick Reference

**Last Updated**: 2026-01-28

Quick commands and common operations for dependency upgrades.

## Quick Status Check

```bash
# Full upgrade status report
./scripts/check-upgrade-status.sh

# Security vulnerabilities only
pnpm audit

# Outdated packages
pnpm outdated --recursive

# Dependency tree
pnpm ls --depth=0
```

## Upgrade Scripts

```bash
# Phase 1: Security fixes (RECOMMENDED START HERE)
./scripts/upgrade-phase1-security.sh

# Check rollback points
./scripts/upgrade-rollback.sh --list

# Rollback to Phase 1
./scripts/upgrade-rollback.sh --phase 1

# Rollback to specific tag
./scripts/upgrade-rollback.sh --tag pre-upgrade-baseline
```

## Manual Upgrade Commands

### Security Fixes (Phase 1)

```bash
# Next.js security patch
cd examples/nextjs-chatbot
pnpm add next@15.6.0

# Vite + esbuild fix
cd examples/chatbot-demo
pnpm add -D vite@^7.0.0

# SvelteKit dependencies
pnpm add -D @sveltejs/vite-plugin-svelte@latest
```

### Testing Frameworks (Phase 2)

```bash
# Jest 30
cd packages/oci-genai-provider
pnpm add -D jest@^30.0.0 @jest/globals@^30.0.0 @types/jest@^30.0.0

# Vitest 4
cd examples/chatbot-demo
pnpm add -D vitest@^4.0.0 @vitest/ui@^4.0.0
```

### Developer Tools (Phase 3)

```bash
# ESLint 9
cd examples/nextjs-chatbot
pnpm add -D eslint@^9.0.0
# Then migrate to flat config (eslint.config.js)

# Svelte tools
cd examples/chatbot-demo
pnpm add -D @sveltejs/vite-plugin-svelte@^6.0.0
pnpm add -D @testing-library/svelte@^5.0.0
```

### Core Dependencies (Phase 4)

```bash
# Zod 4 (HIGH RISK)
cd packages/oci-genai-provider
pnpm add zod@^4.0.0

# OpenAI SDK 6 (VERY HIGH RISK)
cd packages/oci-openai-compatible
pnpm add openai@^6.0.0
```

## Testing & Validation

```bash
# Full test suite
pnpm test

# Type checking
pnpm type-check

# Build all packages
pnpm build

# Test with coverage
pnpm test:coverage

# Lint all code
pnpm lint
```

## Common Issues & Solutions

### Issue: esbuild version mismatch

```bash
# Solution: Clear cache and reinstall
rm -rf node_modules
pnpm install --frozen-lockfile
```

### Issue: Jest 30 tests failing

```bash
# Check for deprecated APIs
grep -r "toMatchInlineSnapshot" src/

# Update jest.config.ts
# Review: https://jestjs.io/docs/upgrading-to-jest30
```

### Issue: Vitest 4 config errors

```bash
# Check vitest.config.ts
# Review: https://vitest.dev/guide/migration.html
```

### Issue: ESLint 9 config not recognized

```bash
# Ensure flat config (eslint.config.js)
# Remove old .eslintrc.* files
rm .eslintrc.json
```

### Issue: Zod 4 schema errors

```bash
# Check schema definitions
grep -r "z\." src/

# Review breaking changes
# https://github.com/colinhacks/zod/releases
```

### Issue: OpenAI SDK 6 type errors

```bash
# Check client initialization
grep -r "new OpenAI" src/

# Review API changes
# https://github.com/openai/openai-node/releases
```

## Git Operations

```bash
# Create backup tag
git tag pre-upgrade-$(date +%Y%m%d)

# Create upgrade branch
git checkout -b upgrade/security-fixes

# Tag phase completion
git tag upgrade-phase1-complete

# View tags
git tag -l "upgrade-*"

# Rollback to tag
git reset --hard <tag-name>
pnpm install --frozen-lockfile
```

## Emergency Rollback

```bash
# Quick rollback (interactive)
./scripts/upgrade-rollback.sh --phase 1

# Force rollback (no confirmation)
./scripts/upgrade-rollback.sh --tag pre-upgrade-baseline --force

# Manual rollback
git reset --hard <previous-tag>
rm -rf node_modules
pnpm install --frozen-lockfile
pnpm build
```

## Dependency Analysis

```bash
# Why is a package installed?
pnpm why <package-name>

# Find duplicate packages
pnpm dedupe

# Check bundle size
pnpm build
du -sh dist/*

# Analyze dependency tree
npx madge --image graph.png src/
```

## Lock File Operations

```bash
# Update lock file only
pnpm install --lockfile-only

# Clean install from lock file
pnpm install --frozen-lockfile

# Force reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Migration Helpers

### ESLint 8 → 9 (Flat Config)

Create `eslint.config.js`:

```javascript
import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // Your rules here
    },
  },
];
```

### Jest 29 → 30 (Config)

Update `jest.config.ts`:

```typescript
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Remove deprecated options
  // Add new options if needed
};

export default config;
```

### Vitest 2 → 4 (Config)

Update `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Update workspace config
    // Check browser mode settings
    // Update coverage provider
  },
});
```

## Monitoring Post-Upgrade

```bash
# Watch for errors
pnpm dev 2>&1 | tee dev.log

# Monitor bundle size
pnpm build && du -sh dist/*

# Performance baseline
time pnpm build
time pnpm test

# Memory usage
/usr/bin/time -l pnpm test
```

## Documentation

```markdown
# After upgrade, update:

- CHANGELOG.md
- package.json version
- README.md dependencies
- Migration guides
```

## Resources

- [Main Upgrade Plan](../UPGRADE_PLAN.md)
- [Compatibility Matrix](.claude/dependency-compatibility-matrix.md)
- [Upgrade Checklist](../UPGRADE_CHECKLIST.md)
- [Jest Migration](https://jestjs.io/docs/upgrading-to-jest30)
- [Vitest Migration](https://vitest.dev/guide/migration.html)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)

## Help Commands

```bash
# Check upgrade status
./scripts/check-upgrade-status.sh

# List rollback points
./scripts/upgrade-rollback.sh --list

# View upgrade plan
cat UPGRADE_PLAN.md | less

# View checklist
cat UPGRADE_CHECKLIST.md | less
```
