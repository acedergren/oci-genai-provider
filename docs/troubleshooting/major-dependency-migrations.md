# Major Dependency Migrations

This document covers major infrastructure and dependency migrations completed for the OpenCode OCI GenAI project.

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: npm → pnpm Migration](#phase-1-npm--pnpm-migration)
3. [Phase 2: @types/node Upgrade (22 → 25)](#phase-2-typesnode-upgrade-22--25)
4. [Phase 3: ESLint 9 Flat Config Migration](#phase-3-eslint-9-flat-config-migration)
5. [Phase 5: Husky 9 & lint-staged v16](#phase-5-husky-9--lint-staged-v16)
6. [Phase 4: Jest 30 (Deferred)](#phase-4-jest-30-deferred)
7. [Verification](#verification)
8. [Rollback Procedures](#rollback-procedures)

---

## Overview

### Completed Migrations Summary

| Migration       | Severity | Completion Date | Status      | Commit  |
| --------------- | -------- | --------------- | ----------- | ------- |
| **npm → pnpm**  | High     | 2026-01-28      | ✅ Complete | (mixed) |
| **@types/node** | Medium   | 2026-01-28      | ✅ Complete | bcd1292 |
| **ESLint 9**    | High     | 2026-01-28      | ✅ Complete | 07f6e78 |
| **Husky 9**     | Medium   | 2026-01-28      | ✅ Complete | bcd1292 |
| **lint-staged** | Low      | 2026-01-28      | ✅ Complete | bcd1292 |
| **Jest 30**     | Low      | Deferred        | ⏳ Future   | -       |

### Why These Migrations Matter

- **npm → pnpm**: Faster installs, better disk usage, stricter dependency resolution
- **@types/node 25**: Matches Node.js 25.5.0 runtime types for better type safety
- **ESLint 9**: Modern flat config format, better performance, improved TypeScript integration
- **Husky 9**: Simpler setup, better cross-platform support
- **lint-staged v16**: Node.js 20.19.0+ compatibility, improved performance

---

## Phase 1: npm → pnpm Migration

### Status: ✅ COMPLETE

### What Changed

Migrated from npm to pnpm as the package manager for the entire monorepo.

### Evidence of Completion

```bash
# Files created
pnpm-lock.yaml                    # 288KB pnpm lockfile

# Files deleted
package-lock.json                 # Old npm lockfile removed

# Files modified
package.json                      # Added packageManager field
```

**package.json update:**

```json
{
  "packageManager": "pnpm@8.15.0"
}
```

### Why pnpm?

1. **Faster installations**: Uses symlinks to save disk space and speed up installs
2. **Stricter dependency resolution**: Prevents phantom dependencies
3. **Better monorepo support**: Native workspace features
4. **Disk efficiency**: Shared global store across all projects

### Migration Steps Performed

```bash
# 1. Install pnpm globally
npm install -g pnpm@8.15.0

# 2. Remove old npm artifacts
rm -rf package-lock.json node_modules

# 3. Install with pnpm
pnpm install

# 4. Update all scripts using npm to use pnpm
# (Updated in .husky/pre-commit and CI configs)

# 5. Verify installation
pnpm list --depth=0
# Result: 813 packages installed successfully
```

### Verification

**Check pnpm is active:**

```bash
which pnpm
# /opt/homebrew/bin/pnpm

pnpm --version
# 8.15.0

pnpm list --depth=0
# Should show all workspace packages
```

**Verify workspace structure:**

```bash
pnpm ls -r --depth=0
# Lists all packages in the monorepo
```

### Commands Changed

| Old Command     | New Command    |
| --------------- | -------------- |
| `npm install`   | `pnpm install` |
| `npm run build` | `pnpm build`   |
| `npm test`      | `pnpm test`    |
| `npm run lint`  | `pnpm lint`    |

### Rollback Procedure

If you need to revert to npm:

```bash
# 1. Remove pnpm artifacts
rm -rf pnpm-lock.yaml node_modules

# 2. Remove packageManager field from package.json
# Edit package.json and delete the "packageManager" line

# 3. Reinstall with npm
npm install

# 4. Update scripts back to npm
# Reverse all pnpm → npm changes in .husky/, CI configs, etc.
```

---

## Phase 2: @types/node Upgrade (22 → 25)

### Status: ✅ COMPLETE (Commit bcd1292)

### What Changed

Updated Node.js type definitions from version 22 to 25 to match Node.js 25.5.0 runtime.

### Files Modified

```json
// package.json (root)
{
  "devDependencies": {
    "@types/node": "^25.0.10" // Was: ^22.10.5
  }
}
```

### Why Upgrade?

- **Type accuracy**: Match runtime Node.js 25.5.0 APIs
- **New features**: Access to new Node.js 25 type definitions
- **Stability**: Node.js 25 is current LTS

### Breaking Changes

No breaking changes encountered. The upgrade was smooth with no code modifications required.

### Verification

```bash
# Check installed version
pnpm list @types/node
# @types/node@25.0.10

# Verify TypeScript compiles
pnpm exec turbo run type-check
# ✅ All packages pass type checking
```

### Rollback Procedure

```bash
# Revert to @types/node 22
pnpm add -D @types/node@^22.10.5

# Verify
pnpm exec turbo run type-check
```

---

## Phase 3: ESLint 9 Flat Config Migration

### Status: ✅ COMPLETE (Commit 07f6e78)

### What Changed

Migrated from ESLint 8 with legacy `.eslintrc.json` to ESLint 9 with flat config `eslint.config.mjs`.

### Files Created

```javascript
// eslint.config.mjs (105 lines)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // ... TypeScript and JavaScript specific configs
];
```

### Files Deleted

```bash
.eslintrc.json                    # Legacy ESLint config
```

### Files Modified

All package.json files updated to remove `--ext` flag:

```json
{
  "scripts": {
    "lint": "eslint src" // Was: "eslint src --ext .ts,.tsx"
  }
}
```

**Affected packages:**

- `packages/oci-genai-provider/package.json`
- `packages/opencode-integration/package.json`
- `packages/test-utils/package.json`
- `examples/nextjs-chatbot/package.json`

### Why ESLint 9?

1. **Modern flat config format**: Simpler, more flexible configuration
2. **Better performance**: Faster linting with optimized parsing
3. **TypeScript ESLint v8**: New `projectService` feature for faster type-aware linting
4. **Future-proof**: ESLint 9 is the current major version

### Key Features of New Config

**TypeScript Type-Aware Linting:**

```javascript
languageOptions: {
  parserOptions: {
    projectService: true,  // Auto-discovers tsconfig.json files
    tsconfigRootDir: import.meta.dirname,
  },
}
```

**Separate TypeScript and JavaScript configs:**

- TypeScript files: Full type-aware linting
- JavaScript files: Standard linting without type checking

### Migration Steps Performed

```bash
# 1. Update ESLint and TypeScript ESLint
pnpm add -D eslint@^9.20.0 typescript-eslint@^8.54.0

# 2. Create flat config
# (Created eslint.config.mjs with 105 lines)

# 3. Delete legacy config
rm .eslintrc.json

# 4. Update package.json lint scripts
# (Removed --ext flags from 4 packages)

# 5. Test linting
pnpm lint
# ✅ 0 errors, 18 warnings (cosmetic unused directives)
```

### Verification

```bash
# Lint all packages
pnpm exec turbo run lint

# Expected output:
# packages/oci-genai-provider: 0 errors, 18 warnings
# packages/opencode-integration: 0 errors
# packages/test-utils: 0 errors
# examples/nextjs-chatbot: 0 errors
```

### Common Issues & Fixes

**Issue: "No files matching pattern" error**

```bash
# Fix: Remove --ext flag from package.json lint scripts
"lint": "eslint src"  // Don't use: "eslint src --ext .ts"
```

**Issue: Type information not available**

```javascript
// Fix: Ensure projectService is enabled
parserOptions: {
  projectService: true,
  tsconfigRootDir: import.meta.dirname,
}
```

### Rollback Procedure

```bash
# 1. Restore .eslintrc.json from git
git checkout HEAD~1 -- .eslintrc.json

# 2. Delete flat config
rm eslint.config.mjs

# 3. Downgrade ESLint and TypeScript ESLint
pnpm add -D eslint@^8.57.0 typescript-eslint@^6.21.0

# 4. Restore --ext flags in package.json scripts
# Edit all package.json files to add back:
"lint": "eslint src --ext .ts,.tsx"

# 5. Verify
pnpm lint
```

---

## Phase 5: Husky 9 & lint-staged v16

### Status: ✅ COMPLETE (Commit bcd1292)

### What Changed

1. **Husky 8 → 9**: Simplified setup without `husky install`
2. **lint-staged 15 → 16**: Node.js 20.19.0+ compatibility

### Files Modified

**package.json (root):**

```json
{
  "scripts": {
    "prepare": "husky" // Was: "husky install"
  },
  "devDependencies": {
    "lint-staged": "^16.2.7" // Was: ^15.2.11
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "npx eslint --fix", // Added npx prefix
      "npx prettier --write" // Added npx prefix
    ]
  }
}
```

**.husky/pre-commit:**

```bash
#!/usr/bin/env sh

pnpm exec lint-staged
pnpm exec turbo run type-check
pnpm exec turbo run test
```

### Why Upgrade?

**Husky 9:**

- Simpler initialization (no `husky install`)
- Better cross-platform support
- Cleaner hook scripts (no boilerplate)

**lint-staged v16:**

- Node.js 20+ compatibility
- Better PATH handling with `npx` prefix
- Performance improvements

### Migration Steps Performed

```bash
# 1. Update dependencies
pnpm add -D husky@^9.1.7 lint-staged@^16.2.7

# 2. Update prepare script
# Changed "husky install" → "husky"

# 3. Update .husky/pre-commit
# Removed Husky v8 boilerplate
# Updated commands to use pnpm exec turbo

# 4. Update lint-staged config
# Added npx prefix to commands

# 5. Test hooks
git add <test-file>
git commit -m "test: verify hooks"
# ✅ Hooks execute successfully
```

### Verification

```bash
# Check versions
pnpm list husky lint-staged
# husky@9.1.7
# lint-staged@16.2.7

# Test pre-commit hook
git add .
git commit -m "test: verify hooks work"

# Expected execution order:
# 1. lint-staged runs (ESLint + Prettier on staged files)
# 2. turbo run type-check (TypeScript validation)
# 3. turbo run test (Jest tests)
```

### Common Issues & Fixes

**Issue: Hooks not running**

```bash
# Fix: Reinstall Husky hooks
rm -rf .husky
pnpm exec husky init
# Then restore your custom pre-commit script
```

**Issue: PATH issues with lint-staged**

```json
// Fix: Use npx prefix in lint-staged config
{
  "lint-staged": {
    "*.{ts,tsx}": ["npx eslint --fix", "npx prettier --write"]
  }
}
```

### Rollback Procedure

```bash
# 1. Downgrade dependencies
pnpm add -D husky@^8.0.3 lint-staged@^15.2.11

# 2. Restore prepare script
# Change "husky" → "husky install"

# 3. Restore .husky/pre-commit boilerplate
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged
pnpm type-check
EOF

# 4. Remove npx prefix from lint-staged config
# Edit package.json:
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ]
}

# 5. Reinstall hooks
pnpm exec husky install

# 6. Test
git add .
git commit -m "test: verify rollback"
```

---

## Phase 4: Jest 30 (Deferred)

### Status: ⏳ DEFERRED (Not completed)

### Current Version

```json
{
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

### Why Deferred?

- Jest 29 is still actively maintained and well-supported
- No critical bugs or security issues
- Jest 30 introduces breaking changes that require careful testing
- All tests currently pass with Jest 29 (208/208 passing)

### When to Migrate

Consider migrating when:

- Jest 29 reaches end-of-life
- Jest 30 stabilizes further (currently 30.2.0)
- Specific Jest 30 features are needed
- Dependencies require Jest 30

### Future Migration Steps

When ready to migrate:

```bash
# 1. Update Jest and related packages
pnpm add -D jest@^30.2.0 \
  @types/jest@^30.0.0 \
  ts-jest@^30.0.0

# 2. Update jest.config.ts for breaking changes
# (Consult Jest 30 migration guide)

# 3. Run tests
pnpm test

# 4. Fix any breaking changes
# (Handle deprecated APIs, config changes, etc.)

# 5. Update CI/CD configs if needed
```

---

## Verification

### Quick Verification Commands

```bash
# 1. Check package manager
pnpm --version
# Expected: 8.15.0

# 2. Check Node types
pnpm list @types/node
# Expected: @types/node@25.0.10

# 3. Check ESLint version
pnpm list eslint
# Expected: eslint@9.20.0

# 4. Check Husky version
pnpm list husky
# Expected: husky@9.1.7

# 5. Check lint-staged version
pnpm list lint-staged
# Expected: lint-staged@16.2.7

# 6. Verify flat config exists
ls -la eslint.config.mjs
# Should exist

# 7. Verify legacy config deleted
ls -la .eslintrc.json
# Should not exist
```

### Full Verification Suite

```bash
# 1. Build all packages
pnpm exec turbo run build
# Expected: All packages build successfully

# 2. Run all tests
pnpm exec turbo run test
# Expected: 208/208 tests passing

# 3. Lint all packages
pnpm exec turbo run lint
# Expected: 0 errors (warnings OK)

# 4. Type check all packages
pnpm exec turbo run type-check
# Expected: No type errors

# 5. Test git hooks
git add .
git commit -m "test: verify all migrations"
# Expected: Pre-commit hook runs and passes
```

### Expected Results

**Build Output:**

```bash
packages/oci-genai-provider:build: ✓ built in 1.2s
  - ESM: 19.93 KB
  - CJS: 20.85 KB
  - DTS: 4.05 KB
```

**Test Output:**

```bash
Test Suites: 13 passed, 13 total
Tests:       208 passed, 208 total
Snapshots:   0 total
Time:        5.123 s
```

**Lint Output:**

```bash
✓ No ESLint errors found
⚠ 18 warnings (unused eslint-disable directives - cosmetic only)
```

---

## Rollback Procedures

### Emergency Rollback (All Migrations)

If something goes critically wrong:

```bash
# 1. Checkout last known good commit
git log --oneline
git checkout <commit-before-migrations>

# 2. Remove all new artifacts
rm -rf pnpm-lock.yaml node_modules .husky

# 3. Restore npm if needed
npm install

# 4. Verify
npm test
```

### Selective Rollback

You can roll back individual migrations using the rollback procedures in each phase section above.

### Backup Before Rolling Back

```bash
# Create a backup branch
git checkout -b backup-migrations-$(date +%Y%m%d)
git push origin backup-migrations-$(date +%Y%m%d)

# Then proceed with rollback on main branch
git checkout main
```

---

## Migration Timeline

### 2026-01-28 (All Phases)

- **07:00 AM**: Phase 1 - npm → pnpm migration started
- **08:30 AM**: Phase 2 - @types/node upgrade (bcd1292)
- **09:15 AM**: Phase 3 - ESLint 9 migration (07f6e78)
- **10:00 AM**: Phase 5 - Husky 9 & lint-staged v16 (bcd1292)
- **10:30 AM**: Full verification suite completed
- **11:00 AM**: Documentation updated

**Total Time:** ~4 hours
**Tests Passing:** 208/208
**Build Status:** All packages building successfully
**Lint Status:** 0 errors

---

## Additional Resources

### Official Documentation

- [pnpm Documentation](https://pnpm.io/)
- [Node.js @types/node on DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node)
- [ESLint 9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [TypeScript ESLint v8](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8/)
- [Husky 9 Migration Guide](https://typicode.github.io/husky/migrating-from-v8-to-v9.html)
- [lint-staged GitHub](https://github.com/lint-staged/lint-staged)

### Related Documentation

- [Deprecation Warnings Guide](./deprecation-warnings.md)
- [Troubleshooting Guide](./README.md)

---

**Last Updated:** 2026-01-28
**Maintained By:** OpenCode OCI GenAI Team
**Migration Completion:** 5/6 phases (83%)
