# OCI GenAI Provider Consolidation - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILLS:
> - Use `superpowers:executing-plans` to implement this plan task-by-task
> - Use `/ai-sdk` skill for AI SDK ProviderV3 interface questions
> - Use `/OCI Generative AI Services` skill for OCI GenAI API questions
> - Use `/zod` skill for Zod schema validation best practices
> - Use `/qa-lead` skill for test strategy and quality assurance

**Goal:** Consolidate the best features from `opencode-oci-genai` into `oci-genai-provider` to create the definitive OCI GenAI provider.

**Architecture:** Copy packages and features from source repo (`~/Projects/opencode-oci-genai`) into target repo (`~/Projects/oci-genai-provider`), adapting imports and ensuring all tests pass. Each task is atomic and can be executed in a fresh session.

**Tech Stack:** TypeScript, Zod, Vitest, pnpm workspace, better-sqlite3, AI SDK 6.x (ProviderV3), OCI GenAI Inference SDK

**Commit Strategy:** Commit early and often. Each task has explicit commit points. Phase tags (`phase-N-complete`) provide rollback points.

**Model Assignment:**
- 🟣 **Opus 4.5**: Complex refactoring, architecture decisions, test writing
- 🔵 **Sonnet**: Straightforward file copies, simple modifications
- 🟢 **Haiku**: Verification steps, running commands, checking outputs

---

## Required Skills Reference

### AI SDK Skill (`/ai-sdk`)
Use when:
- Implementing `LanguageModelV3` interface methods (`doGenerate`, `doStream`)
- Working with AI SDK types (`LanguageModelV3CallOptions`, `LanguageModelV3StreamPart`)
- Fixing type errors related to AI SDK exports
- Understanding provider registration and model creation

**Key AI SDK V3 concepts:**
```typescript
// LanguageModelV3 interface requirements
interface LanguageModelV3 {
  specificationVersion: 'v3';
  provider: string;
  modelId: string;
  doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>;
  doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult>;
}
```

### OCI Generative AI Skill (`/OCI Generative AI Services`)
Use when:
- Working with OCI SDK types (`GenerativeAiInferenceClient`, `ChatRequest`)
- Understanding Cohere vs Generic API formats
- Handling OCI authentication (`ConfigFileAuthenticationDetailsProvider`)
- Debugging OCI API errors or response formats

**Key OCI concepts:**
```typescript
// OCI API formats
type OCIApiFormat = 'COHERE' | 'GENERIC';

// Model family detection
function getModelFamily(modelId: string): OCIApiFormat {
  return modelId.startsWith('cohere.') ? 'COHERE' : 'GENERIC';
}
```

### Zod Skill (`/zod`)
Use when:
- Writing or modifying Zod schemas
- Implementing validation with `.refine()` or `.transform()`
- Type inference with `z.infer<>` or `z.input<>`/`z.output<>`
- Choosing between `parse()` vs `safeParse()`
- Error handling and custom error messages

**Key Zod patterns:**
```typescript
// Best practices from /zod skill
const schema = z.object({
  id: z.string().min(1),
  mode: z.enum(['on-demand', 'dedicated']),
}).refine(
  (data) => !(data.mode === 'dedicated' && !data.endpointId),
  { message: 'endpointId required for dedicated mode', path: ['endpointId'] }
);

// Type inference
type Input = z.input<typeof schema>;   // Before transforms
type Output = z.output<typeof schema>; // After transforms

// Safe parsing for user input
const result = schema.safeParse(input);
if (!result.success) {
  console.error(result.error.issues);
}
```

### QA Lead Skill (`/qa-lead`)
Use when:
- Designing test strategy for new features
- Writing regression tests (REG-XXX pattern)
- Setting up test fixtures and mocks
- Deciding test coverage priorities
- Implementing integration vs unit test boundaries

**Key QA patterns:**
```typescript
// Regression test naming convention
describe('Regression: Provider Configuration', () => {
  it('REG-001: Provider must accept compartmentId from environment', () => {
    // Critical behavior that must not break
  });
});

// Test isolation
beforeEach(() => {
  // Clear state
  delete process.env.OCI_COMPARTMENT_ID;
});

afterEach(() => {
  // Restore state
  process.env = { ...originalEnv };
});

// Mock structure matching real SDK
vi.mock('oci-generativeaiinference', () => ({
  GenerativeAiInferenceClient: class MockClient { /* ... */ }
}));
```

---

## Phase 0: Safety Setup

### Task 0.1: Create Backup Branch 🟢 Haiku

**Purpose:** Safety net before any changes

**Step 1: Navigate and create backup**
```bash
cd ~/Projects/oci-genai-provider
git checkout main
git pull origin main
git checkout -b backup/pre-consolidation-2025-02-01
git push origin backup/pre-consolidation-2025-02-01
```

**Step 2: Create working branch**
```bash
git checkout main
git checkout -b feat/consolidation
```

**Step 3: Verify**
```bash
git branch -a | grep -E "(backup|consolidation)"
```
Expected: See both branches listed

**Checkpoint:** Working branch created, backup pushed to remote

---

### Task 0.2: Verify Source Repo State 🟢 Haiku

**Purpose:** Ensure source files exist before copying

**Step 1: Verify source packages exist**
```bash
ls -la ~/Projects/opencode-oci-genai/packages/
```
Expected: See `agent-state`, `oci-genai-provider`, `oci-genai-setup`, `opencode-integration`, `oci-tui`

**Step 2: Verify source tests exist**
```bash
ls ~/Projects/opencode-oci-genai/packages/oci-genai-provider/src/__tests__/
```
Expected: See `regression.test.ts`, `schemas.test.ts`

**Step 3: Verify source example exists**
```bash
ls ~/Projects/opencode-oci-genai/examples/
```
Expected: See `oci-ai-chat`

**Checkpoint:** Source repo verified, all expected files present

**Phase 0 Complete - Ready to proceed**
```bash
git tag phase-0-complete
```

---

## Phase 1: Zod Validation Schemas

### Task 1.1: Add Zod Dependency 🟢 Haiku

**Files:**
- Modify: `packages/oci-genai-provider/package.json`

**Step 1: Add zod dependency**
```bash
cd ~/Projects/oci-genai-provider/packages/oci-genai-provider
pnpm add zod
```

**Step 2: Verify installation**
```bash
cat package.json | grep zod
```
Expected: `"zod": "^3.x.x"` in dependencies

**Step 3: Commit**
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(oci-genai-provider): add zod dependency"
```

**Checkpoint:** Zod installed, committed

---

### Task 1.2: Create Validation Directory Structure 🟢 Haiku

**Files:**
- Create: `packages/oci-genai-provider/src/shared/validation/`

**Step 1: Create directory**
```bash
mkdir -p ~/Projects/oci-genai-provider/packages/oci-genai-provider/src/shared/validation
```

**Step 2: Verify**
```bash
ls -la ~/Projects/oci-genai-provider/packages/oci-genai-provider/src/shared/
```
Expected: See `validation/` directory

**Step 3: Commit directory structure**
```bash
git add packages/oci-genai-provider/src/shared/validation
git commit --allow-empty -m "chore: create validation directory structure"
```

**Checkpoint:** Directory created, committed

---

### Task 1.3: Port Zod Schemas 🟣 Opus

> **Skill Reference:**
> - Use `/zod` for schema patterns, refinements, and type inference
> - Use `/OCI Generative AI Services` for OCID patterns and region formats

**Files:**
- Create: `packages/oci-genai-provider/src/shared/validation/schemas.ts`
- Reference: `~/Projects/opencode-oci-genai/packages/oci-genai-provider/src/schemas.ts`

**Step 1: Read source file**
```bash
cat ~/Projects/opencode-oci-genai/packages/oci-genai-provider/src/schemas.ts
```

**Step 2: Create schemas.ts**

Create file at `packages/oci-genai-provider/src/shared/validation/schemas.ts`:

```typescript
/**
 * Zod schemas for OCI GenAI Provider settings validation
 *
 * Following Zod best practices:
 * - schema-use-enums: Using z.enum for fixed string values
 * - type-use-z-infer: Using z.infer for type derivation
 * - error-custom-messages: Providing custom error messages
 * - parse-use-safeparse: Exposing safeParse for user input
 *
 * OCI OCID Format Reference (/OCI Generative AI Services):
 * - Format: ocid1.<resource-type>.<realm>.[region.]<unique-id>
 * - Example: ocid1.compartment.oc1..aaaaaaaxxxxxxx
 */
import { z } from 'zod';

/**
 * OCI resource identifier pattern (OCID)
 * Format: ocid1.<resource-type>.<realm>.[region.]<unique-id>
 */
const ocidPattern = /^ocid1\.[a-z0-9]+\.[a-z0-9]+\.[a-z0-9-]*\.[a-z0-9]+$/i;

/**
 * OCI region identifier pattern
 * Format: <geo>-<city>-<number> (e.g., us-chicago-1, eu-frankfurt-1)
 * See: https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm
 */
const regionPattern = /^[a-z]{2,3}-[a-z]+-\d+$/;

/**
 * Schema for OCI compartment ID
 */
export const CompartmentIdSchema = z
  .string()
  .regex(ocidPattern, {
    message: 'Invalid compartment ID format. Expected OCID format: ocid1.compartment.oc1..xxxxx',
  })
  .describe('The compartment OCID for OCI GenAI requests');

/**
 * Schema for OCI region identifier
 */
export const RegionSchema = z
  .string()
  .regex(regionPattern, {
    message: 'Invalid region format. Expected format: <geo>-<city>-<number> (e.g., us-chicago-1)',
  })
  .describe('The OCI region identifier');

/**
 * Schema for OCI config profile name
 */
export const ConfigProfileSchema = z
  .string()
  .min(1, { message: 'Config profile cannot be empty' })
  .default('DEFAULT')
  .describe('The OCI config profile name from ~/.oci/config');

/**
 * Schema for serving mode
 * OCI GenAI supports on-demand (shared) and dedicated AI clusters
 */
export const ServingModeSchema = z
  .enum(['on-demand', 'dedicated'], {
    errorMap: () => ({ message: "Serving mode must be either 'on-demand' or 'dedicated'" }),
  })
  .default('on-demand')
  .describe('The serving mode for model inference');

/**
 * Schema for endpoint ID (used with dedicated serving mode)
 */
export const EndpointIdSchema = z
  .string()
  .regex(ocidPattern, {
    message: 'Invalid endpoint ID format. Expected OCID format: ocid1.generativeaiendpoint.oc1..xxxxx',
  })
  .describe('The endpoint OCID for dedicated serving mode');

/**
 * Schema for OCI GenAI provider settings
 */
export const OCIProviderSettingsSchema = z
  .object({
    compartmentId: CompartmentIdSchema.optional(),
    region: RegionSchema.optional(),
    configProfile: ConfigProfileSchema.optional(),
    servingMode: ServingModeSchema.optional(),
    endpointId: EndpointIdSchema.optional(),
  })
  .refine(
    (data) => {
      // If servingMode is 'dedicated', endpointId should be provided
      if (data.servingMode === 'dedicated' && !data.endpointId) {
        return false;
      }
      return true;
    },
    {
      message: "endpointId is required when servingMode is 'dedicated'",
      path: ['endpointId'],
    }
  )
  .describe('Configuration settings for the OCI GenAI provider');

/**
 * Type inferred from the schema
 */
export type OCIProviderSettingsInput = z.input<typeof OCIProviderSettingsSchema>;
export type OCIProviderSettingsValidated = z.output<typeof OCIProviderSettingsSchema>;

/**
 * Validate provider settings with safeParse (returns success/error, doesn't throw)
 */
export function validateProviderSettings(settings: unknown) {
  return OCIProviderSettingsSchema.safeParse(settings);
}

/**
 * Parse provider settings (throws on validation failure)
 */
export function parseProviderSettings(settings: unknown): OCIProviderSettingsValidated {
  return OCIProviderSettingsSchema.parse(settings);
}

/**
 * Schema for model ID validation
 * Supports both on-demand model IDs and dedicated endpoint OCIDs
 */
export const ModelIdSchema = z
  .string()
  .min(1, { message: 'Model ID cannot be empty' })
  .describe('The model ID or endpoint OCID');

/**
 * Schema for chat model options
 */
export const OCIChatModelIdSchema = z.object({
  modelId: ModelIdSchema,
  isDedicatedEndpoint: z.boolean().optional().default(false),
});

export type OCIChatModelId = z.infer<typeof OCIChatModelIdSchema>;
```

**Step 3: Verify file created**
```bash
wc -l ~/Projects/oci-genai-provider/packages/oci-genai-provider/src/shared/validation/schemas.ts
```
Expected: ~110+ lines

**Step 4: Commit schemas file**
```bash
git add packages/oci-genai-provider/src/shared/validation/schemas.ts
git commit -m "feat(validation): add Zod schemas for OCI settings

- CompartmentIdSchema with OCID validation
- RegionSchema with geo-city-number pattern
- ServingModeSchema (on-demand/dedicated)
- OCIProviderSettingsSchema with refinements"
```

**Checkpoint:** Schemas file created, committed

---

### Task 1.4: Create Validation Index Export 🟢 Haiku

**Files:**
- Create: `packages/oci-genai-provider/src/shared/validation/index.ts`

**Step 1: Create index.ts**

Create file at `packages/oci-genai-provider/src/shared/validation/index.ts`:

```typescript
export {
  CompartmentIdSchema,
  RegionSchema,
  ConfigProfileSchema,
  ServingModeSchema,
  EndpointIdSchema,
  OCIProviderSettingsSchema,
  ModelIdSchema,
  OCIChatModelIdSchema,
  validateProviderSettings,
  parseProviderSettings,
} from './schemas';

export type {
  OCIProviderSettingsInput,
  OCIProviderSettingsValidated,
  OCIChatModelId,
} from './schemas';
```

**Step 2: Verify**
```bash
cat ~/Projects/oci-genai-provider/packages/oci-genai-provider/src/shared/validation/index.ts
```

**Step 3: Commit index file**
```bash
git add packages/oci-genai-provider/src/shared/validation/index.ts
git commit -m "feat(validation): add validation module exports"
```

**Checkpoint:** Index file created, committed

---

### Task 1.5: Update Main Shared Index 🔵 Sonnet

**Files:**
- Modify: `packages/oci-genai-provider/src/shared/index.ts` (if exists)

**Step 1: Check if shared index exists**
```bash
ls ~/Projects/oci-genai-provider/packages/oci-genai-provider/src/shared/
```

**Step 2: If index.ts exists, add validation export**

Add to `packages/oci-genai-provider/src/shared/index.ts`:
```typescript
export * from './validation';
```

**Step 3: If no index.ts, create it**

Create `packages/oci-genai-provider/src/shared/index.ts`:
```typescript
export * from './validation';
```

**Step 4: Commit shared index**
```bash
git add packages/oci-genai-provider/src/shared/index.ts
git commit -m "chore: export validation from shared module"
```

**Checkpoint:** Shared index updated, committed

---

### Task 1.6: Update Main Package Index 🔵 Sonnet

> **Skill Reference:** Use `/ai-sdk` if unsure about export conventions for AI SDK providers

**Files:**
- Modify: `packages/oci-genai-provider/src/index.ts`

**Step 1: Read current index**
```bash
cat ~/Projects/oci-genai-provider/packages/oci-genai-provider/src/index.ts
```

**Step 2: Add validation exports**

Add these lines to `packages/oci-genai-provider/src/index.ts` (near other exports):

```typescript
// ============================================================================
// Validation Exports
// ============================================================================

export {
  CompartmentIdSchema,
  RegionSchema,
  ConfigProfileSchema,
  ServingModeSchema,
  EndpointIdSchema,
  OCIProviderSettingsSchema,
  ModelIdSchema,
  OCIChatModelIdSchema,
  validateProviderSettings,
  parseProviderSettings,
} from './shared/validation';

export type {
  OCIProviderSettingsInput,
  OCIProviderSettingsValidated,
  OCIChatModelId,
} from './shared/validation';
```

**Step 3: Verify build**
```bash
cd ~/Projects/oci-genai-provider
pnpm build --filter=@acedergren/oci-genai-provider
```
Expected: Build succeeds

**Step 4: Commit main index updates**
```bash
git add packages/oci-genai-provider/src/index.ts packages/oci-genai-provider/package.json pnpm-lock.yaml
git commit -m "feat(oci-genai-provider): export validation schemas from package

- Add Zod dependency
- Export all validation schemas and helpers
- Build verified"
```

**Checkpoint:** Main index updated, build passes, committed

---

### Task 1.7: Port Schema Tests 🟣 Opus

> **Skill Reference:**
> - Use `/zod` for testing safeParse vs parse behavior
> - Use `/qa-lead` for test structure and coverage strategy

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/schemas.test.ts`
- Reference: `~/Projects/opencode-oci-genai/packages/oci-genai-provider/src/__tests__/schemas.test.ts`

**Step 1: Read source test file**
```bash
cat ~/Projects/opencode-oci-genai/packages/oci-genai-provider/src/__tests__/schemas.test.ts
```

**Step 2: Create test file**

Create file at `packages/oci-genai-provider/src/__tests__/schemas.test.ts`:

```typescript
/**
 * Tests for Zod validation schemas
 *
 * These tests verify OCI-specific validation rules:
 * - OCID format validation
 * - Region format validation
 * - Serving mode constraints
 */
import { describe, it, expect } from 'vitest';
import {
  CompartmentIdSchema,
  RegionSchema,
  ServingModeSchema,
  EndpointIdSchema,
  OCIProviderSettingsSchema,
  validateProviderSettings,
  parseProviderSettings,
} from '../shared/validation';

describe('CompartmentIdSchema', () => {
  it('accepts valid compartment OCID', () => {
    const valid = 'ocid1.compartment.oc1..aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    expect(CompartmentIdSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid compartment OCID', () => {
    const invalid = 'not-an-ocid';
    const result = CompartmentIdSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid compartment ID format');
    }
  });

  it('rejects empty string', () => {
    const result = CompartmentIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('RegionSchema', () => {
  it('accepts valid region identifiers', () => {
    // OCI GenAI available regions
    const validRegions = ['us-chicago-1', 'eu-frankfurt-1', 'ap-tokyo-1', 'uk-london-1'];
    validRegions.forEach((region) => {
      expect(RegionSchema.safeParse(region).success).toBe(true);
    });
  });

  it('rejects invalid region format', () => {
    const invalid = 'invalid-region';
    const result = RegionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects region without number suffix', () => {
    const invalid = 'us-chicago';
    const result = RegionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ServingModeSchema', () => {
  it('accepts on-demand mode', () => {
    expect(ServingModeSchema.safeParse('on-demand').success).toBe(true);
  });

  it('accepts dedicated mode', () => {
    expect(ServingModeSchema.safeParse('dedicated').success).toBe(true);
  });

  it('defaults to on-demand', () => {
    const result = ServingModeSchema.parse(undefined);
    expect(result).toBe('on-demand');
  });

  it('rejects invalid mode', () => {
    const result = ServingModeSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('OCIProviderSettingsSchema', () => {
  it('accepts valid complete settings', () => {
    const settings = {
      compartmentId: 'ocid1.compartment.oc1..aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      region: 'us-chicago-1',
      configProfile: 'DEFAULT',
      servingMode: 'on-demand',
    };
    expect(OCIProviderSettingsSchema.safeParse(settings).success).toBe(true);
  });

  it('accepts empty settings (all optional)', () => {
    expect(OCIProviderSettingsSchema.safeParse({}).success).toBe(true);
  });

  it('requires endpointId when servingMode is dedicated', () => {
    const settings = {
      servingMode: 'dedicated',
      // missing endpointId
    };
    const result = OCIProviderSettingsSchema.safeParse(settings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('endpointId is required');
    }
  });

  it('accepts dedicated mode with endpointId', () => {
    const settings = {
      servingMode: 'dedicated',
      endpointId: 'ocid1.generativeaiendpoint.oc1..aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    };
    expect(OCIProviderSettingsSchema.safeParse(settings).success).toBe(true);
  });
});

describe('validateProviderSettings', () => {
  it('returns success for valid settings', () => {
    const result = validateProviderSettings({ region: 'us-chicago-1' });
    expect(result.success).toBe(true);
  });

  it('returns error for invalid settings', () => {
    const result = validateProviderSettings({ region: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('parseProviderSettings', () => {
  it('returns parsed settings for valid input', () => {
    const result = parseProviderSettings({ region: 'us-chicago-1' });
    expect(result.region).toBe('us-chicago-1');
  });

  it('throws for invalid input', () => {
    expect(() => parseProviderSettings({ region: 'invalid' })).toThrow();
  });
});
```

**Step 3: Run tests**
```bash
cd ~/Projects/oci-genai-provider
pnpm test --filter=@acedergren/oci-genai-provider -- schemas.test.ts
```
Expected: All tests pass

**Step 4: Commit tests**
```bash
git add packages/oci-genai-provider/src/__tests__/schemas.test.ts
git commit -m "test(validation): add comprehensive schema test coverage

- OCID format validation tests
- Region pattern validation tests
- Serving mode constraint tests
- safeParse vs parse behavior tests"
```

**Checkpoint:** Zod schemas complete with tests, committed

**Phase 1 Summary Commit (optional safety checkpoint):**
```bash
git tag phase-1-complete
```

---

## Phase 2: Copy Packages

### Task 2.1: Copy agent-state Package 🔵 Sonnet

**Files:**
- Copy: `packages/agent-state/` (entire directory)

**Step 1: Copy package**
```bash
cp -r ~/Projects/opencode-oci-genai/packages/agent-state ~/Projects/oci-genai-provider/packages/
```

**Step 2: Verify copy**
```bash
ls -la ~/Projects/oci-genai-provider/packages/agent-state/src/
```
Expected: See `connection.ts`, `repository.ts`, `schema.ts`, `types.ts`, `index.ts`

**Step 3: Verify package.json**
```bash
cat ~/Projects/oci-genai-provider/packages/agent-state/package.json | head -10
```

**Step 4: Initial commit (before install)**
```bash
git add packages/agent-state
git commit -m "feat: copy agent-state package from opencode-oci-genai

- SQLite session persistence
- Zod-validated types
- Not yet built/tested"
```

**Checkpoint:** agent-state copied, committed

---

### Task 2.2: Install agent-state Dependencies 🟢 Haiku

**Files:**
- Modify: `pnpm-lock.yaml` (auto-generated)

**Step 1: Install dependencies**
```bash
cd ~/Projects/oci-genai-provider
pnpm install
```

**Step 2: Verify agent-state builds**
```bash
pnpm build --filter=@acedergren/agent-state
```
Expected: Build succeeds

**Step 3: Verify agent-state tests**
```bash
pnpm test --filter=@acedergren/agent-state
```
Expected: Tests pass

**Step 4: Commit verified build**
```bash
git add pnpm-lock.yaml
git commit -m "chore(agent-state): install dependencies and verify build

- All tests pass
- Package builds successfully"
```

**Checkpoint:** agent-state installed, tested, committed

---

### Task 2.3: Copy oci-genai-setup Package 🔵 Sonnet

> **Skill Reference:** Use `/OCI Generative AI Services` for understanding region/model availability

**Files:**
- Copy: `packages/oci-genai-setup/` (entire directory)

**Step 1: Copy package**
```bash
cp -r ~/Projects/opencode-oci-genai/packages/oci-genai-setup ~/Projects/oci-genai-provider/packages/
```

**Step 2: Verify copy**
```bash
ls -la ~/Projects/oci-genai-provider/packages/oci-genai-setup/src/
```
Expected: See `cli.ts`, `index.ts`, `prompts/`, `services/`, `data/`

**Step 3: Commit copy**
```bash
git add packages/oci-genai-setup
git commit -m "feat: copy oci-genai-setup CLI from opencode-oci-genai"
```

**Step 4: Install and build**
```bash
cd ~/Projects/oci-genai-provider
pnpm install
pnpm build --filter=@acedergren/oci-genai-setup
```
Expected: Build succeeds

**Step 5: Commit verified build**
```bash
git add pnpm-lock.yaml
git commit -m "chore(oci-genai-setup): verify build succeeds

- Interactive setup wizard
- Region/model selection
- Config file generation"
```

**Checkpoint:** oci-genai-setup installed, committed

---

### Task 2.4: Copy opencode-integration Package 🔵 Sonnet

> **Skill Reference:** Use `/ai-sdk` for understanding provider registration patterns

**Files:**
- Copy: `packages/opencode-integration/` (entire directory)

**Step 1: Copy package**
```bash
cp -r ~/Projects/opencode-oci-genai/packages/opencode-integration ~/Projects/oci-genai-provider/packages/
```

**Step 2: Commit copy**
```bash
git add packages/opencode-integration
git commit -m "feat: copy opencode-integration from opencode-oci-genai"
```

**Step 3: Install and build**
```bash
cd ~/Projects/oci-genai-provider
pnpm install
pnpm build --filter=@acedergren/opencode-integration
```

**Step 4: Commit verified build**
```bash
git add pnpm-lock.yaml
git commit -m "chore(opencode-integration): verify build succeeds"
```

**Checkpoint:** opencode-integration installed, committed

**Phase 2 Summary Commit (safety checkpoint):**
```bash
git tag phase-2-complete
```

---

### Task 2.5: Update pnpm-workspace.yaml 🟢 Haiku

**Files:**
- Verify: `pnpm-workspace.yaml`

**Step 1: Check workspace config**
```bash
cat ~/Projects/oci-genai-provider/pnpm-workspace.yaml
```

**Step 2: Ensure it includes packages/*
Expected content:
```yaml
packages:
  - "packages/*"
  - "examples/*"
```

**Step 3: If missing, update**

The default config should already include `packages/*`, so no changes needed if it does.

**Checkpoint:** Workspace configured

---

## Phase 3: Port Regression Tests

### Task 3.1: Port Regression Test Suite 🟣 Opus

> **Skill Reference:**
> - Use `/qa-lead` for regression test strategy and REG-XXX naming
> - Use `/ai-sdk` for `LanguageModelV3` interface requirements
> - Use `/OCI Generative AI Services` for OCI SDK mock structure

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/regression.test.ts`
- Reference: `~/Projects/opencode-oci-genai/packages/oci-genai-provider/src/__tests__/regression.test.ts`

**Step 1: Read source test file**
```bash
cat ~/Projects/opencode-oci-genai/packages/oci-genai-provider/src/__tests__/regression.test.ts
```

**Step 2: Adapt for target repo structure**

Create file at `packages/oci-genai-provider/src/__tests__/regression.test.ts`:

```typescript
/**
 * Regression tests for OCI GenAI Provider core functionality
 * These tests verify critical behaviors that must not break between releases
 *
 * Test naming: REG-XXX for traceability
 *
 * AI SDK Reference (/ai-sdk):
 * - LanguageModelV3 must have specificationVersion: 'v3'
 * - Provider must implement doGenerate and doStream
 *
 * OCI Reference (/OCI Generative AI Services):
 * - Model families: cohere.*, google.*, xai.*, meta.*
 * - API formats: COHERE (for cohere.*), GENERIC (for others)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOCI, OCIGenAIProvider } from '../provider';

// Mock OCI SDK - structure matches oci-generativeaiinference
vi.mock('oci-generativeaiinference', () => {
  return {
    GenerativeAiInferenceClient: class MockClient {
      region: unknown = null;
      endpoint?: string;
      constructor(_options: unknown) {}
      async chat(_request: unknown) {
        return {
          chatResult: {
            modelId: 'test-model',
            chatResponse: {
              choices: [{
                message: { content: [{ type: 'TEXT', text: 'Hello!' }] },
                finishReason: 'COMPLETE',
              }],
              usage: { promptTokens: 10, completionTokens: 5 },
            },
          },
        };
      }
    },
    models: {
      CohereChatRequest: { apiFormat: 'COHERE' },
      GenericChatRequest: { apiFormat: 'GENERIC' },
      TextContent: { type: 'TEXT' },
    },
  };
});

// Mock OCI Common - authentication providers
vi.mock('oci-common', () => {
  return {
    ConfigFileAuthenticationDetailsProvider: class MockAuthProvider {
      constructor(_configPath?: string, _profile?: string) {}
    },
    Region: {
      fromRegionId: (id: string) => ({ regionId: id }),
    },
  };
});

describe('Regression: Provider Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars
    delete process.env.OCI_COMPARTMENT_ID;
    delete process.env.OCI_REGION;
    delete process.env.OCI_GENAI_ENDPOINT_ID;
    delete process.env.OCI_CONFIG_PROFILE;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  it('REG-001: Provider must accept compartmentId from environment', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';

    const provider = createOCI();
    expect(provider).toBeInstanceOf(OCIGenAIProvider);
  });

  it('REG-002: Provider must accept region from environment', () => {
    process.env.OCI_REGION = 'us-chicago-1';

    const provider = createOCI();
    expect(provider).toBeInstanceOf(OCIGenAIProvider);
  });

  it('REG-003: Provider must accept explicit config over environment', () => {
    process.env.OCI_REGION = 'us-chicago-1';

    const provider = createOCI({ region: 'eu-frankfurt-1' });
    expect(provider).toBeInstanceOf(OCIGenAIProvider);
  });

  it('REG-004: Provider must create valid language model', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    const model = provider.languageModel('cohere.command-r-plus');

    // AI SDK V3 requirement
    expect(model.specificationVersion).toBe('v3');
    expect(model.modelId).toBe('cohere.command-r-plus');
  });

  it('REG-005: Provider must support Cohere model family', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    const model = provider.languageModel('cohere.command-r-plus');

    expect(model.modelId.startsWith('cohere.')).toBe(true);
  });

  it('REG-006: Provider must support Google model family', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    const model = provider.languageModel('google.gemini-2.5-pro');

    expect(model.modelId.startsWith('google.')).toBe(true);
  });

  it('REG-007: Provider must support xAI model family', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    const model = provider.languageModel('xai.grok-4');

    expect(model.modelId.startsWith('xai.')).toBe(true);
  });

  it('REG-008: Provider must support Meta model family', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    const model = provider.languageModel('meta.llama-3.3-70b-instruct');

    expect(model.modelId.startsWith('meta.')).toBe(true);
  });
});

describe('Regression: Model Creation (AI SDK V3)', () => {
  it('REG-009: languageModel() must return LanguageModelV3', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    const model = provider.languageModel('cohere.command-r-plus');

    // AI SDK V3 interface requirements
    expect(model.specificationVersion).toBe('v3');
    expect(typeof model.doGenerate).toBe('function');
    expect(typeof model.doStream).toBe('function');
  });

  it('REG-010: Provider name must be oci-genai', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    const model = provider.languageModel('cohere.command-r-plus');

    expect(model.provider).toBe('oci-genai');
  });
});

describe('Regression: Error Handling', () => {
  it('REG-011: Empty model ID should throw', () => {
    const provider = createOCI({ region: 'us-chicago-1' });

    expect(() => provider.languageModel('')).toThrow();
  });
});
```

**Step 3: Run tests**
```bash
cd ~/Projects/oci-genai-provider
pnpm test --filter=@acedergren/oci-genai-provider -- regression.test.ts
```

**Step 4: Fix any import paths based on actual provider structure**

The imports may need adjustment based on actual exports in `provider.ts`. Adapt as needed.

**Step 5: Commit**
```bash
git add packages/oci-genai-provider/src/__tests__/regression.test.ts
git commit -m "test: add regression test suite

- REG-001 to REG-011: Critical behavior tests
- Environment variable handling
- Model family detection (Cohere, Google, xAI, Meta)
- AI SDK V3 interface compliance"
```

**Checkpoint:** Regression tests added, committed

**Phase 3 Summary Commit (safety checkpoint):**
```bash
git tag phase-3-complete
```

---

## Phase 4: Copy Example

### Task 4.1: Copy oci-ai-chat Example 🔵 Sonnet

> **Skill Reference:** Use `/ai-sdk` for understanding how examples integrate with providers

**Files:**
- Copy: `examples/oci-ai-chat/` (entire directory)

**Step 1: Copy example**
```bash
cp -r ~/Projects/opencode-oci-genai/examples/oci-ai-chat ~/Projects/oci-genai-provider/examples/
```

**Step 2: Verify copy**
```bash
ls -la ~/Projects/oci-genai-provider/examples/oci-ai-chat/
```

**Step 3: Commit copy**
```bash
git add examples/oci-ai-chat
git commit -m "feat(examples): copy oci-ai-chat from opencode-oci-genai"
```

**Step 4: Update dependencies to point to local packages**

Edit `examples/oci-ai-chat/package.json`:
- Ensure `@acedergren/oci-genai-provider` and `@acedergren/agent-state` use `workspace:*`

**Step 5: Install and verify**
```bash
cd ~/Projects/oci-genai-provider
pnpm install
pnpm build --filter=oci-ai-chat
```

**Step 6: Commit verified build**
```bash
git add examples/oci-ai-chat/package.json pnpm-lock.yaml
git commit -m "chore(oci-ai-chat): update deps to workspace and verify build

- Svelte 5 + Tailwind 4
- Uses agent-state for sessions"
```

**Checkpoint:** oci-ai-chat example added, committed

**Phase 4 Summary Commit (safety checkpoint):**
```bash
git tag phase-4-complete
```

---

## Phase 5: Final Verification

### Task 5.1: Full Build Verification 🟢 Haiku

**Step 1: Clean build**
```bash
cd ~/Projects/oci-genai-provider
pnpm clean
pnpm install
pnpm build
```
Expected: All packages build successfully

**Step 2: Type check**
```bash
pnpm type-check
```
Expected: No type errors

**Checkpoint:** Full build passes

---

### Task 5.2: Full Test Suite 🟢 Haiku

> **Skill Reference:** Use `/qa-lead` if tests fail and you need to diagnose coverage gaps

**Step 1: Run all tests**
```bash
cd ~/Projects/oci-genai-provider
pnpm test
```
Expected: All tests pass

**Step 2: Generate coverage (optional)**
```bash
pnpm test:coverage
```

**Checkpoint:** All tests pass

---

### Task 5.3: Update CHANGELOG 🔵 Sonnet

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add consolidation entry**

Add to top of `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- **Zod Validation Schemas**: Runtime validation for provider settings with clear error messages
  - `CompartmentIdSchema`, `RegionSchema`, `ServingModeSchema`
  - `validateProviderSettings()` and `parseProviderSettings()` helpers
- **agent-state Package**: SQLite-based session persistence for chat applications
  - Session and turn management with full type safety
- **oci-genai-setup Package**: Interactive CLI wizard for configuration
  - Profile, region, compartment, model selection
  - Configuration validation via test inference
- **opencode-integration Package**: Pre-configured setup for OpenCode editor
- **oci-ai-chat Example**: Modern Svelte 5 + Tailwind 4 demo application
- **Regression Test Suite**: Critical behavior tests (REG-001 to REG-011)

### Changed
- Enhanced model registry with context window and max output metadata
```

**Step 2: Commit**
```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG with consolidation changes"
```

**Checkpoint:** CHANGELOG updated

---

### Task 5.4: Merge to Main 🟣 Opus

**Step 1: Review all changes**
```bash
cd ~/Projects/oci-genai-provider
git log --oneline feat/consolidation ^main
```

**Step 2: Ensure all tests pass one more time**
```bash
pnpm test
```

**Step 3: Merge**
```bash
git checkout main
git merge feat/consolidation --no-ff -m "feat: consolidate opencode-oci-genai features

Merge feat/consolidation into main

- Add Zod validation schemas
- Add agent-state, oci-genai-setup, opencode-integration packages
- Add oci-ai-chat example
- Add regression test suite"
```

**Step 4: Push**
```bash
git push origin main
```

**Checkpoint:** Merged to main, pushed

---

### Task 5.5: Archive Source Repository 🟢 Haiku

**Step 1: Create archive directory**
```bash
mkdir -p ~/Projects/_archived
```

**Step 2: Move source repo**
```bash
mv ~/Projects/opencode-oci-genai ~/Projects/_archived/opencode-oci-genai-$(date +%Y%m%d)
```

**Step 3: Verify**
```bash
ls ~/Projects/_archived/
```

**Checkpoint:** Source repo archived, consolidation complete!

---

## Summary

| Phase | Tasks | Model | Required Skills |
|-------|-------|-------|-----------------|
| Phase 0: Safety | 0.1-0.2 | 🟢 Haiku | — |
| Phase 1: Zod Schemas | 1.1-1.7 | Mixed | `/zod`, `/OCI Generative AI Services`, `/qa-lead` |
| Phase 2: Copy Packages | 2.1-2.5 | 🔵 Sonnet | `/ai-sdk`, `/OCI Generative AI Services` |
| Phase 3: Regression Tests | 3.1 | 🟣 Opus | `/qa-lead`, `/ai-sdk`, `/OCI Generative AI Services` |
| Phase 4: Example | 4.1 | 🔵 Sonnet | `/ai-sdk` |
| Phase 5: Verification | 5.1-5.5 | Mixed | `/qa-lead` |

**Total Tasks:** 17 atomic tasks
**Expected Commits:** ~20+ small, focused commits
**Safety Checkpoints:** 5 phase tags for easy rollback (`git reset --hard phase-N-complete`)
**Context Safety:** Each task is self-contained, can be resumed in fresh session

---

## Quick Reference: When to Use Skills

### Use `/ai-sdk` when:
- Type errors with `LanguageModelV3*` types
- Understanding `doGenerate` or `doStream` requirements
- Provider registration patterns
- Export conventions for AI SDK packages

### Use `/OCI Generative AI Services` when:
- OCID format questions
- Region availability for models
- OCI SDK type structures (`GenerativeAiInferenceClient`)
- Model family API formats (COHERE vs GENERIC)
- Authentication provider setup

### Use `/zod` when:
- Writing new Zod schemas or modifying existing ones
- Implementing `.refine()` for cross-field validation
- Choosing between `parse()` vs `safeParse()`
- Type inference patterns (`z.infer<>`, `z.input<>`, `z.output<>`)
- Custom error messages and error handling
- Transformations with `.transform()`

### Use `/qa-lead` when:
- Designing test strategy for features or packages
- Writing regression tests (use REG-XXX naming)
- Deciding unit vs integration test boundaries
- Setting up mocks that match real SDK structure
- Test isolation (beforeEach/afterEach patterns)
- Coverage gap analysis when tests fail
