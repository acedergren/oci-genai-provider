# Dependency Upgrade Plan

**Created**: 2026-01-28
**Status**: Planning Phase

## Executive Summary

This monorepo has several major dependency upgrades available:
- **Security Fixes**: 3 vulnerabilities (esbuild, Next.js, cookie)
- **Major Upgrades**: Jest 29→30, Vitest 2→4, Vite 6→7, Zod 3→4, OpenAI SDK 4→6
- **Minor Updates**: AI SDK, @types/node, and others

## Prioritized Upgrade Strategy

### Phase 1: Security Fixes (IMMEDIATE)
**Goal**: Resolve security vulnerabilities

1. **esbuild** (via Vite/Vitest transitive dependency)
   - Vulnerability: Development server CORS bypass
   - Fix: Upgrade Vite 6.4.1 → 7.x (which pulls esbuild >=0.25.0)
   - Impact: chatbot-demo example
   - Risk: Medium (Vite major version upgrade)

2. **Next.js** (examples/nextjs-chatbot)
   - Vulnerability: Unbounded memory consumption
   - Fix: Upgrade 15.5.10 → 15.6.0 (patch within v15)
   - Impact: nextjs-chatbot-demo
   - Risk: Low (minor version bump)

3. **cookie** (via @sveltejs/kit transitive)
   - Vulnerability: Out of bounds characters
   - Fix: Upgrade @sveltejs/kit dependencies
   - Impact: chatbot-demo example
   - Risk: Low (transitive dependency)

### Phase 2: Testing Framework Upgrades
**Goal**: Modernize testing infrastructure

1. **Jest 29 → 30** (packages/oci-genai-provider)
   - Breaking Changes: [Review changelog](https://github.com/jestjs/jest/releases/tag/v30.0.0)
   - Dependencies affected: @jest/globals, @types/jest
   - Impact: Core provider package tests
   - Risk: Medium

2. **Vitest 2 → 4** (examples/chatbot-demo)
   - Breaking Changes: [Review changelog](https://github.com/vitest-dev/vitest/releases)
   - Dependencies affected: @vitest/ui
   - Impact: SvelteKit chatbot tests
   - Risk: Medium

### Phase 3: Build Tools & Framework Updates
**Goal**: Upgrade build tooling

1. **Vite 6 → 7** (examples/chatbot-demo)
   - Prerequisite for esbuild security fix
   - Breaking Changes: Expected in module resolution
   - Impact: SvelteKit build process
   - Risk: Medium

2. **ESLint 8 → 9** (examples/nextjs-chatbot)
   - Breaking Changes: Flat config required
   - Impact: Linting configuration
   - Risk: Medium (configuration changes)

### Phase 4: Core Dependencies
**Goal**: Update runtime dependencies

1. **Zod 3 → 4** (packages/oci-genai-provider)
   - Breaking Changes: [Review migration guide](https://zod.dev)
   - Impact: Schema validation in core package
   - Risk: High (affects runtime behavior)

2. **OpenAI SDK 4 → 6** (packages/oci-openai-compatible)
   - Breaking Changes: Major API changes expected
   - Impact: OpenAI compatibility layer
   - Risk: High (major version skip)

### Phase 5: Minor Updates (LOW PRIORITY)
**Goal**: Stay current with patch/minor releases

- AI SDK 6.0.57 → 6.0.58 (all examples)
- @types/node (various versions → 25.1.0)
- eslint-config-next 15.5.10 → 16.1.6
- @sveltejs/vite-plugin-svelte 5.1.1 → 6.2.4
- jsdom 24.1.3 → 27.4.0

## Upgrade Sequence

### Week 1: Security & Stability
```bash
# Day 1-2: Next.js security patch
cd examples/nextjs-chatbot
pnpm add next@15.6.0

# Day 3-4: Vite upgrade (pulls esbuild fix)
cd examples/chatbot-demo
pnpm add -D vite@^7.0.0

# Day 5: Validate & test
pnpm test
```

### Week 2: Testing Framework
```bash
# Day 1-3: Jest 30 upgrade
cd packages/oci-genai-provider
pnpm add -D jest@^30.0.0 @jest/globals@^30.0.0 @types/jest@^30.0.0
# Fix breaking changes
pnpm test

# Day 4-5: Vitest 4 upgrade
cd examples/chatbot-demo
pnpm add -D vitest@^4.0.0 @vitest/ui@^4.0.0
# Fix breaking changes
pnpm test
```

### Week 3: Build Tools
```bash
# Day 1-2: ESLint 9 migration
cd examples/nextjs-chatbot
# Create flat config
pnpm add -D eslint@^9.0.0
# Migrate configuration
pnpm lint

# Day 3-5: Svelte tooling updates
cd examples/chatbot-demo
pnpm add -D @sveltejs/vite-plugin-svelte@^6.0.0
pnpm add -D @testing-library/svelte@^5.0.0
```

### Week 4: Core Dependencies
```bash
# Day 1-3: Zod 4 migration
cd packages/oci-genai-provider
pnpm add zod@^4.0.0
# Update schema definitions
pnpm test

# Day 4-5: OpenAI SDK upgrade
cd packages/oci-openai-compatible
pnpm add openai@^6.0.0
# Update API calls
pnpm test
```

## Breaking Change Mitigation

### Jest 29 → 30
- Update test configuration format
- Check for removed APIs (expect.toMatchInlineSnapshot changes)
- Verify transformer configurations

### Vitest 2 → 4
- Update vitest.config.ts
- Check for changed assertion APIs
- Verify UI plugin compatibility

### Vite 6 → 7
- Update vite.config.ts
- Check plugin compatibility
- Verify SSR configuration

### Zod 3 → 4
- Review schema definitions
- Update error handling
- Check for deprecated methods

### OpenAI SDK 4 → 6
- Major API restructuring expected
- Update client initialization
- Revise request/response handling

## Testing Strategy

### Pre-Upgrade Baseline
```bash
# Run full test suite
pnpm test

# Run type checking
pnpm type-check

# Build all packages
pnpm build

# Capture baseline metrics
pnpm test:coverage > baseline-coverage.txt
```

### Per-Phase Testing
```bash
# After each upgrade:
1. Unit tests: pnpm test --filter=<package>
2. Type checking: pnpm type-check --filter=<package>
3. Build verification: pnpm build --filter=<package>
4. Integration tests: pnpm test:examples (if applicable)
```

### Post-Upgrade Validation
```bash
# Full regression suite
pnpm test
pnpm type-check
pnpm build

# Compare coverage
pnpm test:coverage > post-upgrade-coverage.txt
diff baseline-coverage.txt post-upgrade-coverage.txt
```

## Rollback Plan

### Git Strategy
```bash
# Create upgrade branch
git checkout -b upgrade/security-fixes
git tag pre-upgrade-baseline

# After each phase
git commit -m "chore: upgrade <dependency>"
git tag upgrade-phase-<N>

# If rollback needed
git reset --hard upgrade-phase-<N-1>
pnpm install
```

### Package Lock Management
```bash
# Backup lock file before each phase
cp pnpm-lock.yaml pnpm-lock.yaml.backup

# Restore if needed
mv pnpm-lock.yaml.backup pnpm-lock.yaml
pnpm install --frozen-lockfile
```

## Risk Assessment

| Upgrade | Risk Level | Impact | Mitigation |
|---------|-----------|--------|------------|
| Next.js 15.5→15.6 | Low | Security fix | Test deploy flow |
| Vite 6→7 | Medium | Build process | Review changelog, test dev/prod builds |
| Jest 29→30 | Medium | Test suite | Incremental migration, codemods |
| Vitest 2→4 | Medium | Test suite | Check plugin compatibility |
| Zod 3→4 | High | Runtime validation | Thorough testing, gradual rollout |
| OpenAI 4→6 | High | API compatibility | Major refactoring needed |
| ESLint 8→9 | Medium | Developer experience | Flat config migration |

## Success Criteria

- [ ] All security vulnerabilities resolved
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Build succeeds for all packages
- [ ] Examples run without errors
- [ ] No performance regressions
- [ ] Documentation updated
- [ ] Team trained on breaking changes

## Communication Plan

1. **Before starting**: Share this plan with team
2. **During upgrade**: Daily status updates on critical phases
3. **After completion**: Document lessons learned
4. **Ongoing**: Monitor for runtime issues

## Resources

- [Jest 30 Release Notes](https://github.com/jestjs/jest/releases/tag/v30.0.0)
- [Vitest 4 Migration Guide](https://vitest.dev/guide/migration.html)
- [Vite 7 Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)
- [Zod 4 Migration](https://zod.dev/migration)
- [ESLint 9 Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)

## Notes

- Coordinate with CI/CD pipeline updates
- Consider feature flags for Zod/OpenAI changes
- Schedule upgrades during low-traffic periods
- Keep security fixes separate from feature upgrades
