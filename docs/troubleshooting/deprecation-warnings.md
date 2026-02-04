# Deprecation Warnings - Troubleshooting Guide

This document explains common deprecation warnings you may encounter and how to fix them.

## Table of Contents

1. [Punycode Deprecation Warning](#punycode-deprecation-warning)
2. [Vite Forced Re-optimization](#vite-forced-re-optimization)
3. [Husky Install Deprecation](#husky-install-deprecation)

---

## Punycode Deprecation Warning

### Error Message

```bash
[DEP0040] DeprecationWarning: The `punycode` module is deprecated.
Please use a userland alternative instead.
```

### What It Means

- Node.js is deprecating the built-in `punycode` module
- Some dependency in your dependency tree is using it (usually `uri-js`)
- This is a **warning only** - everything still works fine
- Will become an error in a future Node.js version

### Root Cause

```bash
# Dependency chain
uri-js → punycode (deprecated)
↑
ajv (used by various tools)
```

The `punycode` module is used for encoding international domain names. The warning comes from transitive dependencies (dependencies of dependencies), not your code.

### Solutions

#### Solution 1: Suppress the Warning (Recommended)

**For Development:**
Update `package.json` scripts to suppress Node.js deprecation warnings:

```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--no-deprecation' vite dev",
    "build": "NODE_OPTIONS='--no-deprecation' vite build"
  }
}
```

**Already Applied To:**

- ✅ `examples/chatbot-demo/package.json`

**Apply to Other Examples:**

```bash
# For CLI tool
cd examples/cli-tool
# Update package.json scripts similarly

# For Next.js chatbot
cd examples/nextjs-chatbot
# Update package.json scripts similarly
```

#### Solution 2: Wait for Dependency Updates

The warning will disappear when:

- `uri-js` updates to use a userland `punycode` alternative
- Tools like `ajv` switch to alternatives
- Or those dependencies are removed from the chain

**No action needed** - this is on the dependency maintainers.

#### Solution 3: Override with .npmrc (Not Recommended)

You can force npm/pnpm to use a specific package version:

```bash
# .npmrc
legacy-peer-deps=true
```

**Not recommended** because it can cause version conflicts.

---

## Vite Forced Re-optimization

### Warning Message

```bash
9:35:45 AM [vite] (client) Forced re-optimization of dependencies
```

### What It Means

- Vite detected changes in dependencies
- Re-running dependency pre-bundling for optimal performance
- This is **normal behavior** after:
  - Installing new dependencies
  - Updating dependency versions
  - Clearing caches
  - First run after git pull

### Why It Happens

Vite pre-bundles dependencies for faster dev server startup. When dependencies change, it must rebuild.

### Solutions

#### Solution 1: Configure optimizeDeps (Applied)

**Updated `vite.config.ts`:**

```typescript
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  optimizeDeps: {
    include: ['ai', '@ai-sdk/svelte'],
    exclude: ['@acedergren/oci-genai-provider'],
  },
});
```

**Why This Helps:**

- `include`: Pre-bundle these packages (faster startup)
- `exclude`: Don't pre-bundle workspace packages (they're already fast)

**Already Applied To:**

- ✅ `examples/chatbot-demo/vite.config.ts`

#### Solution 2: Clear Caches (If Issues Persist)

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear SvelteKit cache
rm -rf .svelte-kit

# Reinstall and rebuild
pnpm install
pnpm dev
```

#### Solution 3: Ignore the Warning

If re-optimization only happens once per session, **it's fine to ignore**. It's working as designed.

---

## Husky Install Deprecation

### Warning Message

```bash
husky - install command is DEPRECATED
```

### What It Means

- Husky 9 changed how it initializes
- The `husky install` command is deprecated
- Your hooks still work, but the setup method changed

### Current Setup (Deprecated)

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

### Migration to Husky 9 (✅ COMPLETE)

**Status:** Completed in commit bcd1292 (2026-01-28)

**Changes Applied:**

1. ✅ Updated `package.json` prepare script:

   ```json
   {
     "scripts": {
       "prepare": "husky"
     }
   }
   ```

2. ✅ Updated `.husky/pre-commit` hook to work with pnpm and turbo:

   ```bash
   #!/usr/bin/env sh

   pnpm exec lint-staged
   pnpm exec turbo run type-check
   pnpm exec turbo run test
   ```

3. ✅ Hooks tested and verified working

**Note:** The Husky 9 migration is complete. If you see "husky install is DEPRECATED" warnings, they are historical and can be ignored.

### See Also

- [Husky 9 Migration Guide](https://typicode.github.io/husky/migrating-from-v8-to-v9.html)

---

## Summary

### Deprecation Warnings Status

| Warning         | Severity | Action Required       | Status                       |
| --------------- | -------- | --------------------- | ---------------------------- |
| **Punycode**    | Low      | Optional suppression  | ✅ Fixed in chatbot-demo     |
| **Vite Re-opt** | Info     | Optional config       | ✅ Fixed in chatbot-demo     |
| **Husky**       | Low      | Migration recommended | ✅ Complete (commit bcd1292) |

### Major Dependency Migrations

For detailed information on completed infrastructure migrations, see [Major Dependency Migrations](./major-dependency-migrations.md).

| Migration       | Severity | Completion Date | Status      |
| --------------- | -------- | --------------- | ----------- |
| **npm → pnpm**  | High     | 2026-01-28      | ✅ Complete |
| **@types/node** | Medium   | 2026-01-28      | ✅ Complete |
| **ESLint 9**    | High     | 2026-01-28      | ✅ Complete |
| **Husky 9**     | Medium   | 2026-01-28      | ✅ Complete |
| **lint-staged** | Low      | 2026-01-28      | ✅ Complete |
| **Jest 30**     | Low      | Deferred        | ⏳ Future   |

### Quick Fixes Applied

**Chatbot Demo:**

- ✅ Suppressed punycode warning via `NODE_OPTIONS`
- ✅ Configured Vite optimizeDeps
- ✅ Cleared build caches

**Next Steps:**

1. Apply same fixes to other examples (cli-tool, nextjs-chatbot)
2. ~~Migrate Husky to v9~~ ✅ Complete
3. Test all examples after changes

**Additional Migrations Completed:**

For detailed information on other major dependency migrations (pnpm, @types/node, ESLint 9, lint-staged), see [Major Dependency Migrations](./major-dependency-migrations.md).

---

## Testing the Fixes

### Chatbot Demo

```bash
cd examples/chatbot-demo
pnpm dev
```

**Expected Result:**

- ✅ No punycode warnings
- ✅ Vite starts without forced re-optimization
- ✅ App runs normally

### If Issues Persist

**Check Node.js version:**

```bash
node --version
# Should be v18+ (v22 recommended)
```

**Clear all caches:**

```bash
# From project root
pnpm install
rm -rf examples/*/node_modules/.vite
rm -rf examples/*/.svelte-kit
rm -rf examples/*/.next

# Rebuild
pnpm build
```

**Verify dependencies:**

```bash
pnpm list | grep -E "(ai|vite|svelte)"
```

---

## Additional Resources

- [Node.js Deprecations](https://nodejs.org/api/deprecations.html)
- [Vite Dependency Pre-Bundling](https://vitejs.dev/guide/dep-pre-bundling.html)
- [Husky Documentation](https://typicode.github.io/husky/)
- [SvelteKit Configuration](https://kit.svelte.dev/docs/configuration)

---

**Last Updated:** 2026-01-28
**Applies To:** All examples after dependency updates to v6
