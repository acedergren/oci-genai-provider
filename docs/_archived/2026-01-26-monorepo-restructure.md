# Monorepo Restructure Plan

**Status:** Planned (to be executed after test suite completion)

**Rationale:** The OCI GenAI provider is a general-purpose Vercel AI SDK v3 provider that can be used beyond OpenCode - in Next.js apps, CLI tools, GitHub bots, and any Node.js/TypeScript project using AI SDK.

---

## Target Structure

```
opencode-oci-genai/
├── packages/
│   ├── oci-genai-provider/          # Core provider (published to npm)
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── models/
│   │   │   ├── converters/
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── __tests__/               # All current tests
│   │   ├── package.json             # @acedergren/oci-genai-provider
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── opencode-integration/        # OpenCode-specific wrapper
│   │   ├── src/
│   │   │   ├── config.ts            # OpenCode config format
│   │   │   ├── provider-registry.ts # Register with OpenCode
│   │   │   └── index.ts
│   │   ├── __tests__/
│   │   ├── package.json             # @acedergren/opencode-oci-genai
│   │   └── README.md
│   │
│   └── examples/                    # Example applications
│       ├── nextjs-chat/
│       ├── cli-chatbot/
│       └── github-bot/
│
├── docs/                            # Shared documentation
│   ├── getting-started/
│   ├── api-reference/
│   └── ...
│
├── package.json                     # Root workspace config
├── pnpm-workspace.yaml              # pnpm workspaces config
├── tsconfig.json                    # Shared TypeScript config
└── README.md                        # Monorepo overview
```

---

## Package Breakdown

### 1. `@acedergren/oci-genai-provider` (Core)

**Purpose:** Standalone Vercel AI SDK provider for OCI GenAI

**Exports:**

```typescript
// Core provider factory
export function createOCIProvider(config: OCIConfig): OCIProvider;

// Direct model creation
export function oci(modelId: string, config?: OCIConfig): LanguageModel;

// Types
export type { OCIConfig, OCIProvider, ModelMetadata };

// Model registry utilities
export { getModelMetadata, getAllModels, getModelsByFamily };
```

**Dependencies:**

- `ai` (Vercel AI SDK core)
- `oci-common`
- `oci-generativeaiinference`
- `eventsource-parser`

**Use Cases:**

- Next.js AI applications
- CLI chatbots
- Backend services
- GitHub bots
- Any AI SDK v3 application

**Published:** npm, GitHub Packages

---

### 2. `@acedergren/opencode-oci-genai` (Integration)

**Purpose:** OpenCode-specific integration layer

**Exports:**

```typescript
// OpenCode provider registration
export function registerOCIProvider(): void;

// OpenCode config format
export type { OpenCodeOCIConfig };
```

**Dependencies:**

- `@acedergren/oci-genai-provider` (internal workspace dependency)
- `opencode` (peer dependency)

**Use Cases:**

- OpenCode installations
- OpenWork integrations

**Published:** npm, GitHub Packages

---

### 3. Examples

**Purpose:** Reference implementations and starter templates

**Packages:**

- `nextjs-chat` - Next.js chat application using `@acedergren/oci-genai-provider`
- `cli-chatbot` - Terminal-based chatbot
- `github-bot` - GitHub issue/PR bot

**Published:** No (examples only)

---

## Migration Steps

### Phase 1: Setup Monorepo Infrastructure

**Step 1: Initialize pnpm workspaces**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'packages/examples/*'
```

**Step 2: Update root package.json**

```json
{
  "name": "opencode-oci-genai",
  "private": true,
  "workspaces": ["packages/*", "packages/examples/*"],
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

### Phase 2: Create Core Provider Package

**Step 1: Create package structure**

```bash
mkdir -p packages/oci-genai-provider
```

**Step 2: Move existing code**

```bash
mv src/ packages/oci-genai-provider/
mv jest.config.js packages/oci-genai-provider/
mv tsconfig.json packages/oci-genai-provider/
```

**Step 3: Create package.json**

```json
{
  "name": "@acedergren/oci-genai-provider",
  "version": "0.1.0",
  "description": "Oracle Cloud Infrastructure Generative AI provider for Vercel AI SDK",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "README.md"],
  "keywords": [
    "ai",
    "ai-sdk",
    "vercel-ai",
    "oci",
    "oracle-cloud",
    "generative-ai",
    "grok",
    "llama",
    "cohere",
    "gemini"
  ],
  "scripts": {
    "build": "tsup",
    "test": "jest",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "ai": "^3.0.0",
    "oci-common": "^2.95.0",
    "oci-generativeaiinference": "^2.18.0",
    "eventsource-parser": "^2.0.1"
  },
  "peerDependencies": {
    "ai": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "tsup": "^8.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://npm.pkg.github.com"
  }
}
```

**Step 4: Create tsup config** (`packages/oci-genai-provider/tsup.config.ts`)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
```

---

### Phase 3: Create OpenCode Integration Package

**Step 1: Create package structure**

```bash
mkdir -p packages/opencode-integration/src
```

**Step 2: Create integration layer**

`packages/opencode-integration/src/index.ts`:

```typescript
import { createOCIProvider } from '@acedergren/oci-genai-provider';
import type { OCIConfig } from '@acedergren/oci-genai-provider';

export interface OpenCodeOCIConfig extends OCIConfig {
  // OpenCode-specific extensions
  displayName?: string;
  description?: string;
}

export function registerOCIProvider(config?: OpenCodeOCIConfig) {
  return createOCIProvider(config || {});
}

export { createOCIProvider };
export type { OCIConfig, OpenCodeOCIConfig };
```

**Step 3: Create package.json**

```json
{
  "name": "@acedergren/opencode-oci-genai",
  "version": "0.1.0",
  "description": "OpenCode integration for OCI Generative AI provider",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@acedergren/oci-genai-provider": "workspace:*"
  },
  "peerDependencies": {
    "opencode": "^1.0.0"
  }
}
```

---

### Phase 4: Create Examples

**Example: Next.js Chat App**

`packages/examples/nextjs-chat/package.json`:

```json
{
  "name": "nextjs-oci-chat-example",
  "private": true,
  "dependencies": {
    "@acedergren/oci-genai-provider": "workspace:*",
    "ai": "^3.0.0",
    "next": "^15.0.0",
    "react": "^19.0.0"
  }
}
```

`packages/examples/nextjs-chat/app/api/chat/route.ts`:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: oci('cohere.command-r-plus', {
      region: process.env.OCI_REGION,
      compartmentId: process.env.OCI_COMPARTMENT_ID,
    }),
    messages,
  });

  return result.toDataStreamResponse();
}
```

---

## Benefits

### For Core Provider Users

✅ **Standalone usage** - No OpenCode dependency
✅ **Smaller bundle** - Only AI SDK dependencies
✅ **Better docs** - Focused on AI SDK usage
✅ **Framework agnostic** - Use with Next.js, Nuxt, SvelteKit, etc.

### For OpenCode Users

✅ **Simple installation** - `npm install @acedergren/opencode-oci-genai`
✅ **Zero config** - Works out of the box
✅ **OpenCode conventions** - Follows OpenCode patterns

### For Development

✅ **Faster iteration** - Build only what changed
✅ **Better testing** - Isolated test suites
✅ **Independent versioning** - Core provider vs integration
✅ **Code sharing** - Examples use core provider

---

## Publishing Strategy

### Core Provider (`@acedergren/oci-genai-provider`)

**Version:** Semantic versioning (0.1.0 → 1.0.0)
**Frequency:** Every feature/fix
**Channels:**

- npm (public)
- GitHub Packages

### OpenCode Integration (`@acedergren/opencode-oci-genai`)

**Version:** Follows core provider major version
**Frequency:** When core provider updates or OpenCode integration changes
**Channels:**

- npm (public)
- GitHub Packages

---

## Documentation Updates

### Core Provider README

Focus on:

- AI SDK usage patterns
- Model selection
- Authentication methods
- Streaming examples
- Tool calling examples

### OpenCode Integration README

Focus on:

- OpenCode installation
- Configuration in `opencode.json`
- OpenWork integration
- CI/CD usage

### Monorepo Root README

Focus on:

- Package overview
- Development setup
- Contributing guidelines
- Architecture decisions

---

## Timeline

**After Test Suite Completion:**

- Day 1: Setup monorepo infrastructure, migrate core provider
- Day 2: Create OpenCode integration package, update docs
- Day 3: Create examples, test end-to-end
- Day 4: Update CI/CD, publish to npm

---

## Success Criteria

✅ Core provider published to npm
✅ OpenCode integration working
✅ All tests passing in monorepo
✅ Examples running successfully
✅ Documentation updated
✅ CI/CD publishing both packages

---

**Next Steps:** Complete test suite (Tasks 7-11), then execute this plan.
