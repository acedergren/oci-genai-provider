# Dependency Compatibility Matrix

**Last Updated**: 2026-01-28

## Testing Framework Compatibility

### Jest Ecosystem
| Jest Version | @jest/globals | @types/jest | ts-jest | Node.js |
|--------------|---------------|-------------|---------|---------|
| 29.7.0 (current) | 29.7.0 | 29.5.14 | ^29.0.0 | >=14.0.0 |
| 30.2.0 (target) | 30.2.0 | 30.0.0 | ^30.0.0 | >=18.0.0 |

**Breaking Changes (29→30)**:
- Dropped Node.js 14/16 support (requires >=18)
- `expect.toMatchInlineSnapshot()` behavior changes
- Jest config schema updates
- Timer mock API changes

### Vitest Ecosystem
| Vitest Version | @vitest/ui | vite | Node.js |
|----------------|------------|------|---------|
| 2.1.9 (current) | 2.1.9 | ^5.0.0 \|\| ^6.0.0 | >=18.0.0 |
| 4.0.18 (target) | 4.0.18 | ^6.0.0 \|\| ^7.0.0 | >=18.0.0 |

**Breaking Changes (2→4)**:
- Workspace configuration changes
- Browser mode API updates
- Coverage provider updates
- Snapshot format changes

## Build Tools Compatibility

### Vite Ecosystem
| Vite Version | esbuild | Rollup | Node.js |
|--------------|---------|--------|---------|
| 6.4.1 (current) | 0.24.x | ^4.0.0 | >=18.0.0 |
| 7.3.1 (target) | 0.25.x+ | ^4.0.0 | >=18.0.0 |

**Security Impact**:
- esbuild 0.24.x has CORS bypass vulnerability (GHSA-67mh-4wv8-2f99)
- Vite 7.x upgrades to esbuild 0.25.x (patched)

**Breaking Changes (6→7)**:
- Module resolution algorithm updates
- SSR API changes
- Plugin API refinements
- Build output structure changes

### SvelteKit Compatibility
| @sveltejs/kit | @sveltejs/vite-plugin-svelte | Vite | Svelte |
|---------------|------------------------------|------|--------|
| Latest (current) | 5.1.1 | ^6.0.0 | ^5.0.0 |
| Latest (target) | 6.2.4 | ^6.0.0 \|\| ^7.0.0 | ^5.0.0 |

**Dependencies**:
- cookie: <0.7.0 has vulnerability (GHSA-pxg6-pf52-xh8x)
- Upgrade @sveltejs/kit to pull patched cookie version

## Framework Compatibility

### Next.js Ecosystem
| Next.js Version | React | Node.js | TypeScript |
|-----------------|-------|---------|------------|
| 15.5.10 (current) | ^18.2.0 \|\| ^19.0.0 | >=18.18.0 | >=5.0.0 |
| 15.6.0 (security) | ^18.2.0 \|\| ^19.0.0 | >=18.18.0 | >=5.0.0 |
| 16.1.6 (major) | ^18.2.0 \|\| ^19.0.0 | >=20.0.0 | >=5.0.0 |

**Security Fix**:
- 15.5.10 has PPR memory consumption issue (GHSA-5f7q-jpqc-wp7h)
- 15.6.0+ patched (stay on v15 for now)

**Breaking Changes (15→16)**:
- Configuration file changes
- Middleware API updates
- App Router changes
- Image optimization updates

### ESLint Compatibility
| ESLint Version | Config Format | Node.js | TypeScript Parser |
|----------------|---------------|---------|-------------------|
| 8.57.1 (current) | .eslintrc.* | >=12.22.0 | @typescript-eslint/parser@^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0 |
| 9.39.2 (target) | eslint.config.js (flat) | >=18.18.0 | @typescript-eslint/parser@^8.0.0 |

**Breaking Changes (8→9)**:
- **MAJOR**: Flat config format required (eslint.config.js)
- Dropped support for .eslintrc.* files
- Changed rule resolution
- Plugin loading changes

## Validation Libraries

### Zod Ecosystem
| Zod Version | TypeScript | Node.js | Breaking Changes |
|-------------|------------|---------|------------------|
| 3.25.76 (current) | >=4.5.0 | >=14.0.0 | - |
| 4.3.6 (target) | >=5.0.0 | >=18.0.0 | Yes - Major API changes |

**Breaking Changes (3→4)**:
- Schema definition API changes
- Error handling refinements
- Type inference improvements
- Deprecated methods removed

**Impact**:
- Used in: `packages/oci-genai-provider`
- Affects: Request/response validation schemas
- Risk: High (runtime validation changes)

## AI SDK Ecosystem

### Vercel AI SDK
| ai Version | @ai-sdk/react | @ai-sdk/svelte | Node.js |
|------------|---------------|----------------|---------|
| 6.0.57 (current) | 3.0.59 | 4.0.57 | >=18.0.0 |
| 6.0.58 (target) | 3.0.60 | 4.0.58 | >=18.0.0 |

**Notes**: Minor patch release, low risk

### OpenAI SDK
| OpenAI Version | Node.js | TypeScript | Breaking Changes |
|----------------|---------|------------|------------------|
| 4.104.0 (current) | >=18.0.0 | >=4.5.0 | - |
| 6.16.0 (target) | >=18.0.0 | >=5.0.0 | Yes - Major API restructuring |

**Breaking Changes (4→6)**:
- Client initialization changes
- Request/response types restructured
- Streaming API updates
- Error handling changes

**Impact**:
- Used in: `packages/oci-openai-compatible`
- Affects: OpenAI compatibility layer
- Risk: High (skipping v5)

## Node.js & TypeScript

### Type Definitions
| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| @types/node | 20.19.30 / 22.19.7 / 25.0.10 | 25.1.0 | Align all packages to same version |
| @types/jest | 29.5.14 | 30.0.0 | Upgrade with Jest 30 |
| TypeScript | 5.7.3 | 5.7.3 | Keep current version |

## Testing Libraries

### Testing Library Ecosystem
| Package | Current | Target | React/Svelte Version |
|---------|---------|--------|---------------------|
| @testing-library/svelte | 4.2.3 | 5.3.1 | Svelte 5 |

**Breaking Changes (4→5)**:
- Svelte 5 compatibility
- API refinements for runes
- Query API updates

## Compatibility Decision Matrix

### Safe to Upgrade (Low Risk)
✅ Next.js 15.5.10 → 15.6.0 (security patch)
✅ ai 6.0.57 → 6.0.58 (minor patch)
✅ @ai-sdk/* (minor patches)
✅ @types/node (align versions)

### Upgrade with Caution (Medium Risk)
⚠️ Vite 6 → 7 (build tool changes)
⚠️ Jest 29 → 30 (test configuration)
⚠️ Vitest 2 → 4 (test API changes)
⚠️ ESLint 8 → 9 (config format change)
⚠️ @sveltejs/vite-plugin-svelte 5 → 6

### High Risk / Major Refactoring (Plan Carefully)
🔴 Zod 3 → 4 (runtime validation changes)
🔴 OpenAI 4 → 6 (major API restructuring)
🔴 Next.js 15 → 16 (defer for now)
🔴 jsdom 24 → 27 (skip 2 major versions)

## Recommended Upgrade Path

### Phase 1: Security + Stability (Week 1)
```
Next.js: 15.5.10 → 15.6.0
Vite: 6.4.1 → 7.3.1 (pulls esbuild fix)
@sveltejs/kit: upgrade (pulls cookie fix)
```

### Phase 2: Testing Infrastructure (Week 2)
```
Jest: 29.7.0 → 30.2.0
  ├─ @jest/globals: 29.7.0 → 30.2.0
  └─ @types/jest: 29.5.14 → 30.0.0

Vitest: 2.1.9 → 4.0.18
  └─ @vitest/ui: 2.1.9 → 4.0.18
```

### Phase 3: Developer Tools (Week 3)
```
ESLint: 8.57.1 → 9.39.2 (migrate to flat config)
@sveltejs/vite-plugin-svelte: 5.1.1 → 6.2.4
@testing-library/svelte: 4.2.3 → 5.3.1
```

### Phase 4: Core Dependencies (Week 4)
```
Zod: 3.25.76 → 4.3.6 (careful migration)
OpenAI: 4.104.0 → 6.16.0 (major refactoring)
```

### Phase 5: Type Definitions (Ongoing)
```
@types/node: align all to 25.1.0
```

## Version Pinning Strategy

### Production Dependencies (Exact Versions)
- Pin exact versions for critical runtime deps
- Example: `"zod": "4.3.6"` (not `^4.3.6`)

### Development Dependencies (Caret Ranges)
- Allow minor/patch updates for dev tools
- Example: `"vitest": "^4.0.18"`

### Transitive Dependencies (Lock File)
- Use `pnpm-lock.yaml` to freeze all transitive deps
- Audit before upgrading transitive deps

## Monitoring & Rollback

### Post-Upgrade Monitoring
```bash
# Check bundle size
pnpm build
ls -lh dist/

# Run full test suite
pnpm test:coverage

# Type checking
pnpm type-check

# Performance baseline
pnpm test --reporter=verbose
```

### Rollback Triggers
- Test suite failures >5%
- Build errors
- Runtime exceptions in examples
- Performance degradation >20%
- Security audit failures

## Additional Resources

- [Jest Migration Guide](https://jestjs.io/docs/upgrading-to-jest30)
- [Vitest Migration Guide](https://vitest.dev/guide/migration.html)
- [Vite Migration Guide](https://vitejs.dev/guide/migration.html)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [Zod Migration](https://github.com/colinhacks/zod/releases)
- [OpenAI SDK Changelog](https://github.com/openai/openai-node/releases)
