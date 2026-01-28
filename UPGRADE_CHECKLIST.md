# Dependency Upgrade Checklist

**Last Updated**: 2026-01-28
**Status**: Not Started

Use this checklist to track progress through the dependency upgrade plan.

## Pre-Upgrade Preparation

- [ ] Read UPGRADE_PLAN.md completely
- [ ] Review .claude/dependency-compatibility-matrix.md
- [ ] Run `./scripts/check-upgrade-status.sh` to establish baseline
- [ ] Create backup branch: `git checkout -b upgrade/backup`
- [ ] Tag current state: `git tag pre-upgrade-$(date +%Y%m%d)`
- [ ] Capture baseline metrics:
  ```bash
  pnpm test:coverage > baseline-coverage.txt
  pnpm build > baseline-build.log 2>&1
  ```
- [ ] Notify team of upgrade plan
- [ ] Schedule upgrade window (low-traffic period)

## Phase 1: Security Fixes (Week 1)

**Priority**: CRITICAL
**Risk**: Low-Medium
**Estimated Time**: 2-3 days

### Day 1-2: Next.js Security Patch

- [ ] Run pre-flight checks
  ```bash
  cd examples/nextjs-chatbot
  pnpm test
  pnpm build
  ```
- [ ] Upgrade Next.js
  ```bash
  pnpm add next@15.6.0 eslint-config-next@15.6.0
  ```
- [ ] Test upgrade
  ```bash
  pnpm build
  pnpm dev # Manual testing
  ```
- [ ] Verify security fix
  ```bash
  pnpm audit | grep GHSA-5f7q-jpqc-wp7h  # Should not appear
  ```
- [ ] Commit changes
  ```bash
  git add package.json pnpm-lock.yaml
  git commit -m "chore: upgrade Next.js to 15.6.0 (security fix)"
  ```

### Day 3-4: Vite Upgrade (esbuild fix)

- [ ] Run pre-flight checks
  ```bash
  cd examples/chatbot-demo
  pnpm test
  pnpm build
  ```
- [ ] Review Vite 7 breaking changes
  - [ ] Read [Vite 7 Migration Guide](https://vitejs.dev/guide/migration.html)
  - [ ] Check vite.config.ts for deprecated options
- [ ] Upgrade Vite
  ```bash
  pnpm add -D vite@^7.0.0
  ```
- [ ] Update vite.config.ts if needed
- [ ] Test upgrade
  ```bash
  pnpm build
  pnpm dev
  pnpm test
  ```
- [ ] Verify esbuild version
  ```bash
  pnpm ls esbuild  # Should be 0.25.x or higher
  ```
- [ ] Verify security fix
  ```bash
  pnpm audit | grep GHSA-67mh-4wv8-2f99  # Should not appear
  ```
- [ ] Commit changes
  ```bash
  git add package.json pnpm-lock.yaml vite.config.ts
  git commit -m "chore: upgrade Vite to 7.x (esbuild security fix)"
  ```

### Day 5: SvelteKit Dependencies

- [ ] Upgrade SvelteKit plugins
  ```bash
  cd examples/chatbot-demo
  pnpm add -D @sveltejs/vite-plugin-svelte@latest
  ```
- [ ] Verify cookie vulnerability fix
  ```bash
  pnpm audit | grep GHSA-pxg6-pf52-xh8x  # Should not appear
  ```
- [ ] Run full test suite
  ```bash
  cd ../..
  pnpm test
  pnpm build
  ```
- [ ] Commit changes
  ```bash
  git add -A
  git commit -m "chore: upgrade SvelteKit dependencies (cookie fix)"
  ```
- [ ] Tag phase completion
  ```bash
  git tag upgrade-phase1-complete
  ```

### Phase 1 Validation

- [ ] All security vulnerabilities resolved
  ```bash
  pnpm audit  # Should show 0 vulnerabilities
  ```
- [ ] All tests passing
  ```bash
  pnpm test
  ```
- [ ] All builds successful
  ```bash
  pnpm build
  ```
- [ ] Manual smoke tests
  - [ ] Next.js chatbot runs: `cd examples/nextjs-chatbot && pnpm dev`
  - [ ] SvelteKit chatbot runs: `cd examples/chatbot-demo && pnpm dev`
- [ ] Create PR for Phase 1
  ```bash
  git push origin upgrade/security-fixes
  # Open PR on GitHub
  ```

## Phase 2: Testing Framework Upgrades (Week 2)

**Priority**: HIGH
**Risk**: Medium
**Estimated Time**: 3-5 days

### Jest 29 → 30 Migration

- [ ] Read [Jest 30 Migration Guide](https://jestjs.io/docs/upgrading-to-jest30)
- [ ] Create migration branch
  ```bash
  git checkout -b upgrade/jest30
  ```
- [ ] Backup current test results
  ```bash
  cd packages/oci-genai-provider
  pnpm test > jest29-results.txt
  ```
- [ ] Upgrade Jest packages
  ```bash
  pnpm add -D jest@^30.0.0 @jest/globals@^30.0.0 @types/jest@^30.0.0 ts-jest@^30.0.0
  ```
- [ ] Update jest.config.ts
  - [ ] Check for deprecated config options
  - [ ] Update transformer configuration
- [ ] Fix breaking changes
  - [ ] Update `expect.toMatchInlineSnapshot()` calls if any
  - [ ] Fix timer mock usage
  - [ ] Update snapshot formats
- [ ] Run tests
  ```bash
  pnpm test
  ```
- [ ] Fix failing tests
- [ ] Compare coverage
  ```bash
  pnpm test:coverage > jest30-results.txt
  diff jest29-results.txt jest30-results.txt
  ```
- [ ] Commit Jest 30 upgrade
  ```bash
  git add -A
  git commit -m "chore: upgrade Jest to 30.x"
  ```

### Vitest 2 → 4 Migration

- [ ] Read [Vitest 4 Migration Guide](https://vitest.dev/guide/migration.html)
- [ ] Backup current test results
  ```bash
  cd examples/chatbot-demo
  pnpm test > vitest2-results.txt
  ```
- [ ] Upgrade Vitest packages
  ```bash
  pnpm add -D vitest@^4.0.0 @vitest/ui@^4.0.0
  ```
- [ ] Update vitest.config.ts
  - [ ] Check workspace configuration
  - [ ] Update coverage provider
  - [ ] Check browser mode settings
- [ ] Run tests
  ```bash
  pnpm test
  ```
- [ ] Fix failing tests
  - [ ] Update assertion APIs
  - [ ] Fix snapshot formats
- [ ] Compare coverage
  ```bash
  pnpm test:coverage > vitest4-results.txt
  diff vitest2-results.txt vitest4-results.txt
  ```
- [ ] Commit Vitest 4 upgrade
  ```bash
  git add -A
  git commit -m "chore: upgrade Vitest to 4.x"
  ```

### Phase 2 Validation

- [ ] All Jest tests passing
- [ ] All Vitest tests passing
- [ ] Coverage maintained or improved
- [ ] No performance regressions
- [ ] Tag phase completion
  ```bash
  git tag upgrade-phase2-complete
  ```

## Phase 3: Developer Tools (Week 3)

**Priority**: MEDIUM
**Risk**: Medium
**Estimated Time**: 3-4 days

### ESLint 8 → 9 Migration

- [ ] Read [ESLint 9 Flat Config Guide](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [ ] Create migration branch
  ```bash
  git checkout -b upgrade/eslint9
  cd examples/nextjs-chatbot
  ```
- [ ] Backup current config
  ```bash
  cp .eslintrc.json .eslintrc.json.backup
  ```
- [ ] Install ESLint 9
  ```bash
  pnpm add -D eslint@^9.0.0
  ```
- [ ] Create flat config
  - [ ] Create `eslint.config.js`
  - [ ] Migrate rules from `.eslintrc.json`
  - [ ] Update TypeScript parser config
- [ ] Test linting
  ```bash
  pnpm lint
  ```
- [ ] Fix any linting errors
- [ ] Remove old config
  ```bash
  rm .eslintrc.json
  ```
- [ ] Commit ESLint 9 upgrade
  ```bash
  git add -A
  git commit -m "chore: migrate to ESLint 9 flat config"
  ```

### Svelte Tooling Updates

- [ ] Upgrade @sveltejs/vite-plugin-svelte
  ```bash
  cd examples/chatbot-demo
  pnpm add -D @sveltejs/vite-plugin-svelte@^6.0.0
  ```
- [ ] Upgrade @testing-library/svelte
  ```bash
  pnpm add -D @testing-library/svelte@^5.0.0
  ```
- [ ] Update tests for Svelte 5 runes if needed
- [ ] Run tests
  ```bash
  pnpm test
  ```
- [ ] Commit Svelte tooling upgrades
  ```bash
  git add -A
  git commit -m "chore: upgrade Svelte tooling"
  ```

### Phase 3 Validation

- [ ] Linting works correctly
- [ ] All tests passing
- [ ] Development experience intact
- [ ] Tag phase completion
  ```bash
  git tag upgrade-phase3-complete
  ```

## Phase 4: Core Dependencies (Week 4)

**Priority**: HIGH
**Risk**: HIGH
**Estimated Time**: 5-7 days

### Zod 3 → 4 Migration

⚠️ **HIGH RISK**: This affects runtime validation

- [ ] Read [Zod 4 Migration Guide](https://github.com/colinhacks/zod/releases)
- [ ] Create feature branch
  ```bash
  git checkout -b upgrade/zod4
  cd packages/oci-genai-provider
  ```
- [ ] Find all Zod usage
  ```bash
  grep -r "z\." src/ | wc -l  # Count usages
  ```
- [ ] Backup validation tests
  ```bash
  pnpm test src/**/*.test.ts > zod3-tests.txt
  ```
- [ ] Upgrade Zod
  ```bash
  pnpm add zod@^4.0.0
  ```
- [ ] Fix breaking changes
  - [ ] Update schema definitions
  - [ ] Fix error handling
  - [ ] Update type inference usage
- [ ] Run validation tests
  ```bash
  pnpm test
  ```
- [ ] Test with real API calls
  ```bash
  # Run integration tests
  pnpm test:integration
  ```
- [ ] Compare test results
  ```bash
  pnpm test src/**/*.test.ts > zod4-tests.txt
  diff zod3-tests.txt zod4-tests.txt
  ```
- [ ] Commit Zod 4 upgrade
  ```bash
  git add -A
  git commit -m "chore: upgrade Zod to 4.x"
  ```

### OpenAI SDK 4 → 6 Migration

⚠️ **VERY HIGH RISK**: Major version skip, significant API changes

- [ ] Read [OpenAI SDK v6 Changelog](https://github.com/openai/openai-node/releases)
- [ ] Create feature branch
  ```bash
  git checkout -b upgrade/openai6
  cd packages/oci-openai-compatible
  ```
- [ ] Document current API usage
  ```bash
  grep -r "openai\." src/ > openai4-usage.txt
  ```
- [ ] Backup tests
  ```bash
  pnpm test > openai4-tests.txt
  ```
- [ ] Upgrade OpenAI SDK
  ```bash
  pnpm add openai@^6.0.0
  ```
- [ ] Refactor API calls
  - [ ] Update client initialization
  - [ ] Update request/response types
  - [ ] Update streaming API
  - [ ] Update error handling
- [ ] Run tests
  ```bash
  pnpm test
  ```
- [ ] Test with real OpenAI API
  ```bash
  # Integration tests
  pnpm test:integration
  ```
- [ ] Compare behavior
  ```bash
  pnpm test > openai6-tests.txt
  diff openai4-tests.txt openai6-tests.txt
  ```
- [ ] Commit OpenAI SDK upgrade
  ```bash
  git add -A
  git commit -m "chore: upgrade OpenAI SDK to 6.x"
  ```

### Phase 4 Validation

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing with live APIs
  - [ ] OCI GenAI provider
  - [ ] OpenAI compatibility layer
- [ ] No runtime errors in examples
- [ ] Tag phase completion
  ```bash
  git tag upgrade-phase4-complete
  ```

## Phase 5: Minor Updates (Ongoing)

**Priority**: LOW
**Risk**: Low
**Estimated Time**: 1 day

### Patch/Minor Version Updates

- [ ] Update AI SDK
  ```bash
  pnpm add ai@latest @ai-sdk/react@latest @ai-sdk/svelte@latest
  ```
- [ ] Align @types/node versions
  ```bash
  # Update all to same version
  find . -name "package.json" -exec sed -i '' 's/"@types\/node": "[^"]*"/"@types\/node": "^25.1.0"/g' {} \;
  pnpm install
  ```
- [ ] Update jsdom
  ```bash
  cd examples/chatbot-demo
  pnpm add -D jsdom@latest
  ```
- [ ] Run full test suite
  ```bash
  cd ../..
  pnpm test
  ```
- [ ] Commit minor updates
  ```bash
  git add -A
  git commit -m "chore: update minor dependencies"
  ```

## Post-Upgrade Validation

### Comprehensive Testing

- [ ] Run full test suite
  ```bash
  pnpm test
  ```
- [ ] Run coverage check
  ```bash
  pnpm test:coverage
  diff baseline-coverage.txt current-coverage.txt
  ```
- [ ] Type checking
  ```bash
  pnpm type-check
  ```
- [ ] Build all packages
  ```bash
  pnpm build
  ```
- [ ] Lint all code
  ```bash
  pnpm lint
  ```

### Manual Testing

- [ ] Test chatbot-demo
  ```bash
  cd examples/chatbot-demo
  pnpm dev
  # Manual interaction testing
  ```
- [ ] Test nextjs-chatbot
  ```bash
  cd examples/nextjs-chatbot
  pnpm dev
  # Manual interaction testing
  ```
- [ ] Test CLI tool
  ```bash
  cd examples/cli-tool
  pnpm start
  # Manual interaction testing
  ```
- [ ] Test RAG demos
  ```bash
  cd examples/rag-demo
  pnpm dev
  # Manual interaction testing
  ```

### Performance Validation

- [ ] Measure bundle sizes
  ```bash
  pnpm build
  du -sh dist/*
  ```
- [ ] Compare with baseline
  ```bash
  diff baseline-build.log current-build.log
  ```
- [ ] Check for performance regressions
  - [ ] Test response times
  - [ ] Memory usage
  - [ ] Build times

### Documentation

- [ ] Update CHANGELOG.md
- [ ] Update package versions in README
- [ ] Document breaking changes
- [ ] Update contribution guide if needed

### Deployment

- [ ] Create final PR
  ```bash
  git push origin upgrade/final
  # Open PR on GitHub
  ```
- [ ] Code review
- [ ] CI/CD pipeline passes
- [ ] Deploy to staging
- [ ] Smoke test staging
- [ ] Deploy to production
- [ ] Monitor for errors

### Cleanup

- [ ] Delete upgrade branches
  ```bash
  git branch -D upgrade/security-fixes
  git branch -D upgrade/jest30
  git branch -D upgrade/eslint9
  git branch -D upgrade/zod4
  git branch -D upgrade/openai6
  ```
- [ ] Remove backup files
- [ ] Archive upgrade documentation

## Rollback Procedures

If anything goes wrong:

### Immediate Rollback
```bash
# Rollback to previous tag
git reset --hard <previous-tag>
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

### Phase-Specific Rollback
```bash
# Rollback to phase N
git reset --hard upgrade-phase<N>-complete
pnpm install --frozen-lockfile
```

### Emergency Hotfix
```bash
# Create hotfix branch from production
git checkout -b hotfix/upgrade-issue main
# Fix issue
git commit -m "hotfix: resolve upgrade issue"
# Deploy immediately
```

## Success Metrics

- [ ] ✅ Zero security vulnerabilities
- [ ] ✅ All tests passing
- [ ] ✅ No TypeScript errors
- [ ] ✅ Build succeeds
- [ ] ✅ Coverage maintained/improved
- [ ] ✅ Performance maintained
- [ ] ✅ All examples working
- [ ] ✅ Team trained on changes

## Notes & Lessons Learned

[Add notes during upgrade process]

- **What went well**:

- **What could be improved**:

- **Unexpected issues**:

- **Time estimates accuracy**:

---

**Status Legend**:
- [ ] Not Started
- [~] In Progress
- [x] Complete
- [!] Blocked
