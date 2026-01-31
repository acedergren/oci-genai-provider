# OpenCode OCI GenAI Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable OpenCode to use OCI Generative AI as a provider with auto-discovery from `~/.oci/config`.

**Architecture:** Hybrid with Layered Configuration (Version E). Core provider exports config utilities via subpath (`@acedergren/oci-genai-provider/config`). OpenCode integration and setup CLI both import these utilities. Single package for core functionality, clear API boundaries.

**Tech Stack:** TypeScript, OCI SDK, Vercel AI SDK ProviderV3, INI parser, prompts/chalk/ora for CLI

---

## Architecture Decision

After evaluating 5 architectural approaches against success criteria (Simplicity, User Experience, Flexibility, Security, Extensibility), **Architecture E: Hybrid with Layered Configuration** was selected as the winner with a score of 4.8/5.0.

Key benefits:

- Single package for core functionality with subpath exports
- Config utilities reusable by CLI and future OAuth module
- Tree-shaking support (don't import config if you don't need it)
- Clear API boundaries between AI functionality and config discovery

---

## Phase 1: Config Utilities Module

### Task 1.1: Create Config Types

**Files:**

- Create: `packages/oci-genai-provider/src/config/types.ts`

**Step 1: Write the type definitions**

```typescript
/**
 * Parsed profile from ~/.oci/config
 */
export interface OCIProfile {
  /** Profile name (e.g., "DEFAULT", "FRANKFURT") */
  name: string;
  /** Region (e.g., "eu-frankfurt-1") */
  region: string;
  /** User OCID */
  user: string;
  /** Tenancy OCID */
  tenancy: string;
  /** Key fingerprint */
  fingerprint: string;
  /** Path to private key file (expanded) */
  keyFile: string;
  /** Whether key file exists and is readable */
  keyFileValid: boolean;
}

/**
 * Result of parsing ~/.oci/config
 */
export interface OCIConfigResult {
  /** Whether config file was found */
  found: boolean;
  /** Path to config file */
  path: string;
  /** Parsed profiles */
  profiles: OCIProfile[];
  /** Error message if parsing failed */
  error?: string;
}

/**
 * Discovered compartment from OCI API
 */
export interface OCICompartment {
  /** Compartment OCID */
  id: string;
  /** Compartment name */
  name: string;
  /** Compartment description */
  description?: string;
  /** Lifecycle state */
  lifecycleState: string;
}

/**
 * Result of credential validation
 */
export interface ValidationResult {
  /** Whether credentials are valid */
  valid: boolean;
  /** User display name if valid */
  userName?: string;
  /** User email if valid */
  userEmail?: string;
  /** Error message if invalid */
  error?: string;
}
```

**Step 2: Commit**

```bash
git add packages/oci-genai-provider/src/config/types.ts
git commit -m "feat(config): add OCI config types for auto-discovery"
```

---

### Task 1.2: Implement OCI Config Parser

**Files:**

- Create: `packages/oci-genai-provider/src/config/oci-config.ts`
- Test: `packages/oci-genai-provider/src/config/__tests__/oci-config.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { parseOCIConfig, expandPath, hasOCIConfig } from '../oci-config';

vi.mock('node:fs');
vi.mock('node:os');

describe('parseOCIConfig', () => {
  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue('/home/testuser');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse a valid OCI config file', () => {
    const configContent = `
[DEFAULT]
user=ocid1.user.oc1..aaaadefault
fingerprint=aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..aaaatenancy
region=us-ashburn-1

[FRANKFURT]
user=ocid1.user.oc1..aaaafrankfurt
fingerprint=11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00
key_file=~/.oci/frankfurt_key.pem
tenancy=ocid1.tenancy.oc1..aaaatenancy
region=eu-frankfurt-1
`;

    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (p === '/home/testuser/.oci/config') return true;
      if (p === '/home/testuser/.oci/oci_api_key.pem') return true;
      if (p === '/home/testuser/.oci/frankfurt_key.pem') return true;
      return false;
    });
    vi.mocked(fs.readFileSync).mockReturnValue(configContent);
    vi.mocked(fs.statSync).mockReturnValue({ size: configContent.length } as fs.Stats);

    const result = parseOCIConfig();

    expect(result.found).toBe(true);
    expect(result.profiles).toHaveLength(2);
    expect(result.profiles[0].name).toBe('DEFAULT');
    expect(result.profiles[0].region).toBe('us-ashburn-1');
    expect(result.profiles[1].name).toBe('FRANKFURT');
    expect(result.profiles[1].region).toBe('eu-frankfurt-1');
    expect(result.profiles[1].keyFileValid).toBe(true);
  });

  it('should return found=false when config file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = parseOCIConfig();

    expect(result.found).toBe(false);
    expect(result.profiles).toHaveLength(0);
  });

  it('should handle missing key files gracefully', () => {
    const configContent = `
[DEFAULT]
user=ocid1.user.oc1..aaaa
fingerprint=aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99
key_file=~/.oci/missing_key.pem
tenancy=ocid1.tenancy.oc1..aaaa
region=us-ashburn-1
`;

    vi.mocked(fs.existsSync).mockImplementation((p) => {
      if (p === '/home/testuser/.oci/config') return true;
      return false; // key file doesn't exist
    });
    vi.mocked(fs.readFileSync).mockReturnValue(configContent);
    vi.mocked(fs.statSync).mockReturnValue({ size: configContent.length } as fs.Stats);

    const result = parseOCIConfig();

    expect(result.found).toBe(true);
    expect(result.profiles[0].keyFileValid).toBe(false);
  });
});

describe('expandPath', () => {
  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue('/home/testuser');
  });

  it('should expand ~ to home directory', () => {
    expect(expandPath('~/.oci/key.pem')).toBe('/home/testuser/.oci/key.pem');
  });

  it('should leave absolute paths unchanged', () => {
    expect(expandPath('/absolute/path/key.pem')).toBe('/absolute/path/key.pem');
  });
});

describe('hasOCIConfig', () => {
  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue('/home/testuser');
  });

  it('should return true when config exists and has content', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats);

    expect(hasOCIConfig()).toBe(true);
  });

  it('should return false when config does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(hasOCIConfig()).toBe(false);
  });

  it('should return false when config is empty', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 0 } as fs.Stats);

    expect(hasOCIConfig()).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @acedergren/oci-genai-provider test src/config/__tests__/oci-config.test.ts
```

Expected: FAIL with "Cannot find module '../oci-config'"

**Step 3: Write minimal implementation**

```typescript
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { OCIProfile, OCIConfigResult } from './types';

/**
 * Default OCI config file location
 */
const DEFAULT_CONFIG_PATH = '~/.oci/config';

/**
 * Expand ~ to home directory in paths
 */
export function expandPath(filePath: string): string {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Get the OCI config file path
 */
export function getConfigPath(): string {
  return expandPath(process.env.OCI_CONFIG_FILE || DEFAULT_CONFIG_PATH);
}

/**
 * Check if OCI config file exists and has content
 */
export function hasOCIConfig(): boolean {
  const configPath = getConfigPath();
  try {
    return fs.existsSync(configPath) && fs.statSync(configPath).size > 0;
  } catch {
    return false;
  }
}

/**
 * Parse INI-style OCI config file
 */
function parseINI(content: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let currentSection = '';

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
      continue;
    }

    // Section header [SECTION_NAME]
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      result[currentSection] = {};
      continue;
    }

    // Key=value pair
    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (kvMatch && currentSection) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      result[currentSection][key] = value;
    }
  }

  return result;
}

/**
 * Parse ~/.oci/config and return all profiles
 *
 * @param configPath - Optional custom config path
 * @returns Parsed config result with profiles
 */
export function parseOCIConfig(configPath?: string): OCIConfigResult {
  const resolvedPath = configPath ? expandPath(configPath) : getConfigPath();

  if (!fs.existsSync(resolvedPath)) {
    return {
      found: false,
      path: resolvedPath,
      profiles: [],
      error: `Config file not found at ${resolvedPath}`,
    };
  }

  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = parseINI(content);

    const profiles: OCIProfile[] = Object.entries(parsed).map(([name, values]) => {
      const keyFile = expandPath(values.key_file || '');
      const keyFileValid = keyFile ? fs.existsSync(keyFile) : false;

      return {
        name,
        region: values.region || '',
        user: values.user || '',
        tenancy: values.tenancy || '',
        fingerprint: values.fingerprint || '',
        keyFile,
        keyFileValid,
      };
    });

    return {
      found: true,
      path: resolvedPath,
      profiles,
    };
  } catch (error) {
    return {
      found: false,
      path: resolvedPath,
      profiles: [],
      error: `Failed to parse config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get a specific profile by name
 *
 * @param profileName - Profile name (default: 'DEFAULT')
 * @returns Profile or undefined if not found
 */
export function getProfile(profileName = 'DEFAULT'): OCIProfile | undefined {
  const result = parseOCIConfig();
  if (!result.found) return undefined;
  return result.profiles.find((p) => p.name === profileName);
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @acedergren/oci-genai-provider test src/config/__tests__/oci-config.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/config/oci-config.ts packages/oci-genai-provider/src/config/__tests__/oci-config.test.ts
git commit -m "feat(config): implement OCI config parser with ~/.oci/config support"
```

---

### Task 1.3: Implement Credential Validation

**Files:**

- Create: `packages/oci-genai-provider/src/config/validation.ts`
- Test: `packages/oci-genai-provider/src/config/__tests__/validation.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { validateCredentials } from '../validation';

// Mock OCI SDK
vi.mock('oci-identity', () => ({
  IdentityClient: vi.fn().mockImplementation(() => ({
    getUser: vi.fn().mockResolvedValue({
      user: {
        name: 'test-user',
        email: 'test@example.com',
      },
    }),
  })),
}));

vi.mock('oci-common', () => ({
  ConfigFileAuthenticationDetailsProvider: vi.fn(),
}));

describe('validateCredentials', () => {
  it('should return valid=true for working credentials', async () => {
    const result = await validateCredentials('DEFAULT');

    expect(result.valid).toBe(true);
    expect(result.userName).toBe('test-user');
    expect(result.userEmail).toBe('test@example.com');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @acedergren/oci-genai-provider test src/config/__tests__/validation.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
import * as common from 'oci-common';
import * as identity from 'oci-identity';
import type { ValidationResult } from './types';

/**
 * Validate OCI credentials by making a test API call
 *
 * @param profileName - Profile name from ~/.oci/config
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Validation result
 */
export async function validateCredentials(
  profileName = 'DEFAULT',
  timeoutMs = 10000
): Promise<ValidationResult> {
  try {
    const authProvider = new common.ConfigFileAuthenticationDetailsProvider(
      undefined, // Use default config path
      profileName
    );

    const identityClient = new identity.IdentityClient({
      authenticationDetailsProvider: authProvider,
    });

    // Set timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Get the user ID from the auth provider
      const userId = await authProvider.getUser();

      // Fetch user details to validate credentials work
      const response = await identityClient.getUser({ userId });

      clearTimeout(timeout);

      return {
        valid: true,
        userName: response.user.name,
        userEmail: response.user.email,
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Provide helpful error messages
    if (message.includes('NotAuthenticated')) {
      return {
        valid: false,
        error: 'Authentication failed. Check your API key and fingerprint.',
      };
    }
    if (message.includes('timeout') || message.includes('abort')) {
      return {
        valid: false,
        error: 'Connection timeout. Check network and OCI endpoint accessibility.',
      };
    }
    if (message.includes('key_file')) {
      return {
        valid: false,
        error: 'Private key file not found or not readable.',
      };
    }

    return {
      valid: false,
      error: `Validation failed: ${message}`,
    };
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @acedergren/oci-genai-provider test src/config/__tests__/validation.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/config/validation.ts packages/oci-genai-provider/src/config/__tests__/validation.test.ts
git commit -m "feat(config): add credential validation via OCI API"
```

---

### Task 1.4: Implement Compartment Discovery

**Files:**

- Create: `packages/oci-genai-provider/src/config/discovery.ts`
- Test: `packages/oci-genai-provider/src/config/__tests__/discovery.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { discoverCompartments } from '../discovery';

vi.mock('oci-identity', () => ({
  IdentityClient: vi.fn().mockImplementation(() => ({
    listCompartments: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'ocid1.compartment.oc1..aaa',
          name: 'root',
          description: 'Root compartment',
          lifecycleState: 'ACTIVE',
        },
        {
          id: 'ocid1.compartment.oc1..bbb',
          name: 'dev',
          description: 'Development',
          lifecycleState: 'ACTIVE',
        },
      ],
    }),
  })),
}));

vi.mock('oci-common', () => ({
  ConfigFileAuthenticationDetailsProvider: vi.fn().mockImplementation(() => ({
    getTenantId: vi.fn().mockResolvedValue('ocid1.tenancy.oc1..tenancy'),
  })),
}));

describe('discoverCompartments', () => {
  it('should discover compartments from OCI API', async () => {
    const result = await discoverCompartments('DEFAULT');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('root');
    expect(result[1].name).toBe('dev');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @acedergren/oci-genai-provider test src/config/__tests__/discovery.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
import * as common from 'oci-common';
import * as identity from 'oci-identity';
import type { OCICompartment } from './types';

/**
 * Discover compartments from OCI API
 *
 * @param profileName - Profile name from ~/.oci/config
 * @param includeRoot - Include root compartment (tenancy)
 * @returns Array of compartments
 */
export async function discoverCompartments(
  profileName = 'DEFAULT',
  includeRoot = true
): Promise<OCICompartment[]> {
  const authProvider = new common.ConfigFileAuthenticationDetailsProvider(undefined, profileName);

  const identityClient = new identity.IdentityClient({
    authenticationDetailsProvider: authProvider,
  });

  // Get tenancy ID (root compartment)
  const tenancyId = await authProvider.getTenantId();

  const compartments: OCICompartment[] = [];

  // Optionally include root compartment
  if (includeRoot) {
    const tenancy = await identityClient.getTenancy({ tenancyId });
    compartments.push({
      id: tenancyId,
      name: tenancy.tenancy.name || 'root',
      description: 'Root compartment (tenancy)',
      lifecycleState: 'ACTIVE',
    });
  }

  // List all compartments
  const response = await identityClient.listCompartments({
    compartmentId: tenancyId,
    compartmentIdInSubtree: true,
    lifecycleState: 'ACTIVE',
  });

  for (const compartment of response.items) {
    compartments.push({
      id: compartment.id,
      name: compartment.name,
      description: compartment.description,
      lifecycleState: compartment.lifecycleState,
    });
  }

  return compartments;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @acedergren/oci-genai-provider test src/config/__tests__/discovery.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/config/discovery.ts packages/oci-genai-provider/src/config/__tests__/discovery.test.ts
git commit -m "feat(config): add compartment discovery via OCI API"
```

---

### Task 1.5: Create Fallback Module

**Files:**

- Create: `packages/oci-genai-provider/src/config/fallback.ts`

**Step 1: Write the implementation**

```typescript
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { OCIProfile } from './types';

/**
 * OCI regions for selection
 */
export const OCI_REGIONS = [
  { id: 'eu-frankfurt-1', name: 'Germany Central (Frankfurt)' },
  { id: 'eu-stockholm-1', name: 'Sweden Central (Stockholm)' },
  { id: 'us-ashburn-1', name: 'US East (Ashburn)' },
  { id: 'us-phoenix-1', name: 'US West (Phoenix)' },
  { id: 'uk-london-1', name: 'UK South (London)' },
  { id: 'ap-tokyo-1', name: 'Japan East (Tokyo)' },
  { id: 'ap-mumbai-1', name: 'India West (Mumbai)' },
  { id: 'ap-sydney-1', name: 'Australia East (Sydney)' },
  { id: 'ca-toronto-1', name: 'Canada Southeast (Toronto)' },
  { id: 'sa-saopaulo-1', name: 'Brazil East (São Paulo)' },
] as const;

export type OCIRegionId = (typeof OCI_REGIONS)[number]['id'];

/**
 * Information needed for manual OCI setup
 */
export interface ManualSetupInfo {
  user: string;
  fingerprint: string;
  keyFilePath: string;
  tenancy: string;
  region: OCIRegionId;
  profileName: string;
}

/**
 * Create ~/.oci directory if it doesn't exist
 */
export function ensureOCIDirectory(): string {
  const ociDir = path.join(os.homedir(), '.oci');
  if (!fs.existsSync(ociDir)) {
    fs.mkdirSync(ociDir, { recursive: true, mode: 0o700 });
  }
  return ociDir;
}

/**
 * Generate OCI config file content from manual setup info
 */
export function generateConfigContent(info: ManualSetupInfo): string {
  return `[${info.profileName}]
user=${info.user}
fingerprint=${info.fingerprint}
key_file=${info.keyFilePath}
tenancy=${info.tenancy}
region=${info.region}
`;
}

/**
 * Write OCI config file
 *
 * @param info - Manual setup information
 * @param append - Append to existing config (default: false)
 */
export function writeOCIConfig(info: ManualSetupInfo, append = false): void {
  const ociDir = ensureOCIDirectory();
  const configPath = path.join(ociDir, 'config');

  const content = generateConfigContent(info);

  if (append && fs.existsSync(configPath)) {
    fs.appendFileSync(configPath, '\n' + content);
  } else {
    fs.writeFileSync(configPath, content, { mode: 0o600 });
  }
}

/**
 * Create a profile from environment variables
 *
 * Required env vars:
 * - OCI_USER_OCID
 * - OCI_FINGERPRINT
 * - OCI_KEY_FILE
 * - OCI_TENANCY_OCID
 * - OCI_REGION
 *
 * @returns Profile or undefined if env vars not set
 */
export function profileFromEnvironment(): OCIProfile | undefined {
  const user = process.env.OCI_USER_OCID;
  const fingerprint = process.env.OCI_FINGERPRINT;
  const keyFile = process.env.OCI_KEY_FILE;
  const tenancy = process.env.OCI_TENANCY_OCID;
  const region = process.env.OCI_REGION;

  if (!user || !fingerprint || !keyFile || !tenancy || !region) {
    return undefined;
  }

  const expandedKeyFile = keyFile.startsWith('~')
    ? path.join(os.homedir(), keyFile.slice(1))
    : keyFile;

  return {
    name: 'ENV',
    user,
    fingerprint,
    keyFile: expandedKeyFile,
    keyFileValid: fs.existsSync(expandedKeyFile),
    tenancy,
    region,
  };
}

/**
 * Get setup instructions for users without OCI CLI
 */
export function getSetupInstructions(): string {
  return `
To use OCI GenAI, you need OCI credentials configured.

Option 1: Install OCI CLI (Recommended)
  1. Install: https://docs.oracle.com/iaas/Content/API/SDKDocs/cliinstall.htm
  2. Run: oci setup config
  3. Re-run this setup tool

Option 2: Manual Configuration
  1. Create an API key in OCI Console
  2. Download the private key
  3. Note your User OCID, Tenancy OCID, and Fingerprint
  4. Create ~/.oci/config with these values

Option 3: Environment Variables
  Set these in your shell:
    export OCI_USER_OCID=ocid1.user.oc1..aaaa...
    export OCI_FINGERPRINT=aa:bb:cc:...
    export OCI_KEY_FILE=~/.oci/oci_api_key.pem
    export OCI_TENANCY_OCID=ocid1.tenancy.oc1..aaaa...
    export OCI_REGION=eu-frankfurt-1
    export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaa...
`;
}
```

**Step 2: Commit**

```bash
git add packages/oci-genai-provider/src/config/fallback.ts
git commit -m "feat(config): add fallback module for users without OCI CLI"
```

---

### Task 1.6: Create Config Module Index with Subpath Export

**Files:**

- Create: `packages/oci-genai-provider/src/config/index.ts`
- Modify: `packages/oci-genai-provider/package.json`
- Modify: `packages/oci-genai-provider/tsup.config.ts`

**Step 1: Create config module index**

```typescript
// packages/oci-genai-provider/src/config/index.ts

// Types
export type { OCIProfile, OCIConfigResult, OCICompartment, ValidationResult } from './types';

// OCI Config parsing
export { parseOCIConfig, hasOCIConfig, getConfigPath, getProfile, expandPath } from './oci-config';

// Credential validation
export { validateCredentials } from './validation';

// Compartment discovery
export { discoverCompartments } from './discovery';

// Fallback utilities
export {
  OCI_REGIONS,
  type OCIRegionId,
  type ManualSetupInfo,
  ensureOCIDirectory,
  generateConfigContent,
  writeOCIConfig,
  profileFromEnvironment,
  getSetupInstructions,
} from './fallback';
```

**Step 2: Update package.json exports**

Add to `packages/oci-genai-provider/package.json`:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./config": {
      "types": "./dist/config/index.d.ts",
      "import": "./dist/config/index.js",
      "require": "./dist/config/index.cjs"
    }
  }
}
```

**Step 3: Update tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'config/index': 'src/config/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
```

**Step 4: Build and verify**

```bash
pnpm --filter @acedergren/oci-genai-provider build
```

Expected: dist/index.js and dist/config/index.js created

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/config/index.ts packages/oci-genai-provider/package.json packages/oci-genai-provider/tsup.config.ts
git commit -m "feat(config): expose config utilities via subpath export"
```

---

## Phase 2: OpenCode Integration Package

### Task 2.1: Implement OpenCode Factory Function

**Files:**

- Modify: `packages/opencode-integration/src/index.ts`

**Step 1: Write the implementation**

```typescript
/**
 * OpenCode Integration for OCI Generative AI Provider
 *
 * This package provides an OpenCode-compatible factory function
 * that creates an OCI GenAI provider instance.
 *
 * Usage in opencode.json:
 * {
 *   "provider": {
 *     "oci-genai": {
 *       "npm": "@acedergren/opencode-oci-genai",
 *       "options": {
 *         "compartmentId": "{env:OCI_COMPARTMENT_ID}",
 *         "configProfile": "FRANKFURT"
 *       }
 *     }
 *   }
 * }
 */

import { createOCI, type OCIConfig } from '@acedergren/oci-genai-provider';
import type { ProviderV3 } from '@ai-sdk/provider';

/**
 * OpenCode configuration options
 *
 * These are passed from opencode.json "options" field
 */
export interface OpenCodeOCIOptions {
  /**
   * Compartment OCID for OCI GenAI API calls
   * Can use {env:OCI_COMPARTMENT_ID} in opencode.json
   */
  compartmentId: string;

  /**
   * Profile name from ~/.oci/config
   * Default: 'DEFAULT' or OCI_CONFIG_PROFILE env var
   */
  configProfile?: string;

  /**
   * Override region from profile
   * Usually not needed - region comes from ~/.oci/config profile
   */
  region?: string;
}

/**
 * Default export: Factory function for OpenCode
 *
 * OpenCode calls this function with options from opencode.json
 * to create a provider instance.
 *
 * @param options - Configuration from opencode.json
 * @returns ProviderV3 instance
 */
export default function createOpenCodeOCIProvider(options: OpenCodeOCIOptions): ProviderV3 {
  // Build config, preferring explicit options over environment variables
  const config: OCIConfig = {
    // Compartment ID is required
    compartmentId: options.compartmentId || process.env.OCI_COMPARTMENT_ID,

    // Profile name (region, credentials come from ~/.oci/config)
    profile: options.configProfile || process.env.OCI_CONFIG_PROFILE || 'DEFAULT',

    // Region override (usually not needed, comes from profile)
    region: options.region || process.env.OCI_REGION,

    // Always use config_file auth for OpenCode (OAuth in future phase)
    auth: 'config_file',
  };

  // Validate required configuration
  if (!config.compartmentId) {
    throw new Error(
      `OCI compartmentId is required.

Set it in opencode.json:
  "options": { "compartmentId": "ocid1.compartment.oc1..." }

Or via environment variable:
  export OCI_COMPARTMENT_ID=ocid1.compartment.oc1...`
    );
  }

  return createOCI(config);
}

// Re-export core provider for direct usage
export {
  createOCI,
  oci,
  getAllModels,
  getModelMetadata,
  getModelsByFamily,
  isValidModelId,
  type OCIConfig,
  type ModelMetadata,
} from '@acedergren/oci-genai-provider';

// Re-export config utilities for setup tools
export {
  parseOCIConfig,
  hasOCIConfig,
  getProfile,
  validateCredentials,
  discoverCompartments,
  OCI_REGIONS,
  getSetupInstructions,
} from '@acedergren/oci-genai-provider/config';
```

**Step 2: Update package.json dependencies**

Ensure `packages/opencode-integration/package.json` has:

```json
{
  "dependencies": {
    "@acedergren/oci-genai-provider": "workspace:*"
  },
  "peerDependencies": {
    "@ai-sdk/provider": ">=1.0.0"
  }
}
```

**Step 3: Build and verify**

```bash
pnpm --filter @acedergren/opencode-oci-genai build
```

**Step 4: Commit**

```bash
git add packages/opencode-integration/src/index.ts packages/opencode-integration/package.json
git commit -m "feat(opencode): implement factory function with auto-discovery support"
```

---

### Task 2.2: Create Configuration Templates

**Files:**

- Create: `packages/opencode-integration/templates/opencode.json.minimal`
- Create: `packages/opencode-integration/templates/opencode.json.full`
- Create: `packages/opencode-integration/templates/.env.example`

**Step 1: Create minimal template**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "name": "OCI GenAI",
      "options": {
        "compartmentId": "{env:OCI_COMPARTMENT_ID}",
        "configProfile": "{env:OCI_CONFIG_PROFILE}"
      },
      "models": {
        "xai.grok-4": {
          "name": "Grok 4 Maverick",
          "limit": { "context": 131072, "output": 8192 }
        },
        "meta.llama-3.3-70b-instruct": {
          "name": "Llama 3.3 70B",
          "limit": { "context": 131072, "output": 8192 }
        }
      }
    }
  }
}
```

**Step 2: Create full template**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "name": "OCI GenAI",
      "options": {
        "compartmentId": "{env:OCI_COMPARTMENT_ID}",
        "configProfile": "{env:OCI_CONFIG_PROFILE}"
      },
      "models": {
        "xai.grok-4": {
          "name": "Grok 4 Maverick",
          "limit": { "context": 131072, "output": 8192 }
        },
        "xai.grok-4-fast-reasoning": {
          "name": "Grok 4 Scout",
          "limit": { "context": 131072, "output": 8192 }
        },
        "xai.grok-3": {
          "name": "Grok 3",
          "limit": { "context": 131072, "output": 8192 }
        },
        "meta.llama-3.3-70b-instruct": {
          "name": "Llama 3.3 70B",
          "limit": { "context": 131072, "output": 8192 }
        },
        "meta.llama-3.2-vision-90b-instruct": {
          "name": "Llama 3.2 Vision 90B",
          "attachment": true,
          "limit": { "context": 131072, "output": 8192 }
        },
        "meta.llama-3.1-405b-instruct": {
          "name": "Llama 3.1 405B",
          "limit": { "context": 131072, "output": 8192 }
        },
        "cohere.command-plus-latest": {
          "name": "Command R+ Latest",
          "limit": { "context": 131072, "output": 4096 }
        },
        "cohere.command-latest": {
          "name": "Command R Latest",
          "limit": { "context": 131072, "output": 4096 }
        },
        "cohere.command-a-vision": {
          "name": "Command A Vision",
          "attachment": true,
          "limit": { "context": 131072, "output": 4096 }
        },
        "google.gemini-2.5-pro": {
          "name": "Gemini 2.5 Pro",
          "attachment": true,
          "limit": { "context": 1048576, "output": 8192 }
        },
        "google.gemini-2.5-flash": {
          "name": "Gemini 2.5 Flash",
          "attachment": true,
          "limit": { "context": 1048576, "output": 8192 }
        }
      }
    }
  }
}
```

**Step 3: Create .env.example**

```bash
# OCI Configuration for OpenCode
# Copy to .env and fill in your values

# Required: Your compartment OCID
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaaaaa...

# Optional: Profile name from ~/.oci/config (default: DEFAULT)
OCI_CONFIG_PROFILE=FRANKFURT

# Optional: Override region (usually not needed, comes from profile)
# OCI_REGION=eu-frankfurt-1
```

**Step 4: Commit**

```bash
git add packages/opencode-integration/templates/
git commit -m "feat(opencode): add configuration templates"
```

---

### Task 2.3: Write Setup Documentation

**Files:**

- Modify: `packages/opencode-integration/README.md`

**Step 1: Write comprehensive README** (see full content in docs/guides/opencode-integration/)

**Step 2: Commit**

```bash
git add packages/opencode-integration/README.md
git commit -m "docs(opencode): comprehensive setup documentation"
```

---

## Phase 3: Setup CLI Tool (Automated Installation)

### Task 3.1: Create Setup CLI Package Structure

**Files:**

- Create: `packages/opencode-oci-setup/package.json`
- Create: `packages/opencode-oci-setup/tsconfig.json`
- Create: `packages/opencode-oci-setup/tsup.config.ts`

**Step 1: Create package.json**

```json
{
  "name": "@acedergren/opencode-oci-setup",
  "version": "0.1.0",
  "description": "Setup wizard for OCI GenAI provider in OpenCode",
  "bin": {
    "opencode-oci-setup": "./dist/cli.js"
  },
  "main": "./dist/cli.js",
  "type": "module",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@acedergren/oci-genai-provider": "workspace:*",
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "open": "^10.0.0",
    "ora": "^8.0.0",
    "prompts": "^2.4.2"
  },
  "devDependencies": {
    "@types/prompts": "^2.4.9",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/acedergren/oci-genai-provider.git",
    "directory": "packages/opencode-oci-setup"
  },
  "author": "Alexander Cedergren <alexander.cedergren@oracle.com>",
  "license": "MIT"
}
```

**Step 2: Create tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
```

**Step 3: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 4: Commit**

```bash
git add packages/opencode-oci-setup/
git commit -m "feat(setup): initialize CLI package structure"
```

---

### Task 3.2: Implement CLI Main Entry Point

**Files:**

- Create: `packages/opencode-oci-setup/src/cli.ts`

**Step 1: Write the CLI implementation**

```typescript
import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import open from 'open';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  parseOCIConfig,
  hasOCIConfig,
  validateCredentials,
  discoverCompartments,
  getAllModels,
  getSetupInstructions,
} from '@acedergren/oci-genai-provider/config';

const VERSION = '0.1.0';

program
  .name('opencode-oci-setup')
  .description('Setup wizard for OCI GenAI provider in OpenCode')
  .version(VERSION)
  .option('-p, --profile <name>', 'OCI profile name')
  .option('-c, --compartment <ocid>', 'Compartment OCID')
  .option('-y, --yes', 'Skip confirmations')
  .option('-q, --quiet', 'Minimal output')
  .action(main);

program.parse();

async function main(options: {
  profile?: string;
  compartment?: string;
  yes?: boolean;
  quiet?: boolean;
}) {
  const log = options.quiet ? () => {} : console.log;

  log(chalk.bold.blue('\n🔧 OpenCode OCI GenAI Setup\n'));

  // Step 1: Check for OCI config
  if (!hasOCIConfig()) {
    log(chalk.yellow('⚠️  OCI configuration not found at ~/.oci/config\n'));

    const { setupMethod } = await prompts({
      type: 'select',
      name: 'setupMethod',
      message: 'How would you like to configure OCI credentials?',
      choices: [
        {
          title: 'Install OCI CLI (recommended)',
          value: 'oci-cli',
          description: 'Opens setup guide in browser',
        },
        {
          title: 'Use environment variables',
          value: 'env',
          description: 'Configure via shell environment',
        },
        {
          title: 'Exit',
          value: 'exit',
        },
      ],
    });

    if (setupMethod === 'oci-cli') {
      log('\n📖 Opening OCI CLI setup guide...\n');
      const url = 'https://docs.oracle.com/iaas/Content/API/SDKDocs/cliinstall.htm';
      try {
        await open(url);
      } catch {
        log(`Please visit: ${chalk.cyan(url)}`);
      }
      log('After completing OCI CLI setup, re-run: npx @acedergren/opencode-oci-setup\n');
      process.exit(0);
    } else if (setupMethod === 'env') {
      log(getSetupInstructions());
      process.exit(0);
    } else {
      process.exit(0);
    }
  }

  // Step 2: Parse OCI config and list profiles
  const configResult = parseOCIConfig();
  log(chalk.green(`✓ Found OCI config with ${configResult.profiles.length} profile(s)\n`));

  // Step 3: Select profile
  let selectedProfile = options.profile;
  if (!selectedProfile) {
    const { profile } = await prompts({
      type: 'select',
      name: 'profile',
      message: 'Select OCI profile:',
      choices: configResult.profiles.map((p) => ({
        title: `${p.name} (${p.region})`,
        value: p.name,
        description: p.keyFileValid ? '✓ Key file found' : '✗ Key file missing',
      })),
    });
    selectedProfile = profile;
  }

  if (!selectedProfile) {
    log(chalk.red('No profile selected. Exiting.'));
    process.exit(1);
  }

  const profile = configResult.profiles.find((p) => p.name === selectedProfile);
  if (!profile) {
    log(chalk.red(`Profile "${selectedProfile}" not found.`));
    process.exit(1);
  }

  log(`\nUsing profile: ${chalk.cyan(profile.name)} (${profile.region})`);

  // Step 4: Validate credentials
  const validateSpinner = ora('Validating OCI credentials...').start();
  const validation = await validateCredentials(selectedProfile);

  if (validation.valid) {
    validateSpinner.succeed(`Credentials valid (${validation.userName})`);
  } else {
    validateSpinner.fail(`Validation failed: ${validation.error}`);
    if (!options.yes) {
      const { continueAnyway } = await prompts({
        type: 'confirm',
        name: 'continueAnyway',
        message: 'Continue anyway?',
        initial: false,
      });
      if (!continueAnyway) process.exit(1);
    }
  }

  // Step 5: Discover compartments
  let selectedCompartment = options.compartment;
  if (!selectedCompartment) {
    const compartmentSpinner = ora('Discovering compartments...').start();
    try {
      const compartments = await discoverCompartments(selectedProfile);
      compartmentSpinner.succeed(`Found ${compartments.length} compartment(s)`);

      const { compartment } = await prompts({
        type: 'select',
        name: 'compartment',
        message: 'Select compartment:',
        choices: [
          ...compartments.map((c) => ({
            title: c.name,
            value: c.id,
            description: c.description || c.id,
          })),
          {
            title: 'Enter manually',
            value: 'manual',
          },
        ],
      });

      if (compartment === 'manual') {
        const { manualId } = await prompts({
          type: 'text',
          name: 'manualId',
          message: 'Enter compartment OCID:',
          validate: (v) => v.startsWith('ocid1.compartment.') || 'Invalid OCID format',
        });
        selectedCompartment = manualId;
      } else {
        selectedCompartment = compartment;
      }
    } catch (error) {
      compartmentSpinner.fail('Could not discover compartments');
      const { manualId } = await prompts({
        type: 'text',
        name: 'manualId',
        message: 'Enter compartment OCID:',
        validate: (v) => v.startsWith('ocid1.compartment.') || 'Invalid OCID format',
      });
      selectedCompartment = manualId;
    }
  }

  if (!selectedCompartment) {
    log(chalk.red('No compartment selected. Exiting.'));
    process.exit(1);
  }

  // Step 6: Select models
  const allModels = getAllModels();
  const { selectedModels } = await prompts({
    type: 'multiselect',
    name: 'selectedModels',
    message: 'Select models to enable (space to select):',
    choices: [
      { title: 'xai.grok-4 (Fast, 131K)', value: 'xai.grok-4', selected: true },
      {
        title: 'meta.llama-3.3-70b-instruct (131K)',
        value: 'meta.llama-3.3-70b-instruct',
        selected: true,
      },
      {
        title: 'cohere.command-plus-latest (131K)',
        value: 'cohere.command-plus-latest',
        selected: false,
      },
      {
        title: 'google.gemini-2.5-flash (Vision, 1M)',
        value: 'google.gemini-2.5-flash',
        selected: false,
      },
      { title: 'All models', value: 'all', selected: false },
    ],
    min: 1,
  });

  const modelsToEnable = selectedModels.includes('all')
    ? allModels.map((m) => m.id)
    : selectedModels;

  // Step 7: Install package (using execFileSync for security)
  const opencodeDir = path.join(os.homedir(), '.config/opencode');
  const installSpinner = ora('Installing @acedergren/opencode-oci-genai...').start();

  try {
    if (!fs.existsSync(opencodeDir)) {
      fs.mkdirSync(opencodeDir, { recursive: true });
    }

    const packageJsonPath = path.join(opencodeDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      fs.writeFileSync(packageJsonPath, JSON.stringify({ dependencies: {} }, null, 2));
    }

    // Use execFileSync for security (no shell injection)
    execFileSync('npm', ['install', '@acedergren/opencode-oci-genai'], {
      cwd: opencodeDir,
      stdio: 'pipe',
    });

    installSpinner.succeed('Package installed');
  } catch (error) {
    installSpinner.fail('Installation failed');
    log(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }

  // Step 8: Generate opencode.json
  const configSpinner = ora('Generating opencode.json...').start();

  const modelConfig: Record<string, unknown> = {};
  for (const modelId of modelsToEnable) {
    const meta = allModels.find((m) => m.id === modelId);
    if (meta) {
      modelConfig[modelId] = {
        name: meta.name,
        attachment: meta.capabilities.vision,
        limit: {
          context: meta.contextWindow,
          output: 8192,
        },
      };
    }
  }

  const openCodeConfig = {
    $schema: 'https://opencode.ai/config.json',
    provider: {
      'oci-genai': {
        npm: '@acedergren/opencode-oci-genai',
        name: 'OCI GenAI',
        options: {
          compartmentId: selectedCompartment,
          configProfile: selectedProfile,
        },
        models: modelConfig,
      },
    },
  };

  const configPath = path.join(opencodeDir, 'opencode.json');
  fs.writeFileSync(configPath, JSON.stringify(openCodeConfig, null, 2));
  configSpinner.succeed(`Configuration saved to ${configPath}`);

  // Step 9: Show success message
  log(chalk.bold.green('\n✓ Setup complete!\n'));
  log('Next steps:');
  log(`  1. Start OpenCode: ${chalk.cyan('opencode')}`);
  log(`  2. Select model: ${chalk.cyan('/models')}`);
  log('  3. Start chatting!\n');

  log('Enabled models:');
  for (const modelId of modelsToEnable) {
    log(`  ${chalk.green('✓')} ${modelId}`);
  }
  log('');
}
```

**Step 2: Build and test**

```bash
pnpm --filter @acedergren/opencode-oci-setup build
```

**Step 3: Commit**

```bash
git add packages/opencode-oci-setup/src/cli.ts
git commit -m "feat(setup): implement interactive CLI wizard with auto-discovery"
```

---

## Verification Plan

### Phase 1 Verification

```bash
# 1. Build all packages
pnpm build

# 2. Test config utilities
pnpm --filter @acedergren/oci-genai-provider test src/config/

# 3. Verify subpath export works
node -e "import('@acedergren/oci-genai-provider/config').then(m => console.log(Object.keys(m)))"
```

### Phase 2 Verification

```bash
# 1. Install locally
cd ~/.config/opencode
npm install /path/to/oci-genai-provider/packages/opencode-integration

# 2. Create test config
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1...
export OCI_CONFIG_PROFILE=FRANKFURT

# 3. Test factory function
node -e "
import factory from '@acedergren/opencode-oci-genai';
const provider = factory({ compartmentId: process.env.OCI_COMPARTMENT_ID });
console.log('Provider created:', provider.specificationVersion);
"

# 4. Start OpenCode and test
opencode
```

### Phase 3 Verification

```bash
# 1. Build CLI
pnpm --filter @acedergren/opencode-oci-setup build

# 2. Run setup wizard
npx @acedergren/opencode-oci-setup

# 3. Verify generated config
cat ~/.config/opencode/opencode.json

# 4. Test with OpenCode
opencode
```

---

## Success Criteria Checklist

### Phase 1 (Config Utilities)

- [ ] `parseOCIConfig()` correctly parses `~/.oci/config`
- [ ] `validateCredentials()` tests API connectivity
- [ ] `discoverCompartments()` lists available compartments
- [ ] Subpath export `@acedergren/oci-genai-provider/config` works
- [ ] All tests pass

### Phase 2 (OpenCode Integration)

- [ ] Factory function creates valid ProviderV3
- [ ] OpenCode loads provider without errors
- [ ] Can select OCI models from OpenCode UI
- [ ] Chat completions work with streaming
- [ ] Documentation allows manual setup in <10 minutes

### Phase 3 (Setup CLI)

- [ ] `npx @acedergren/opencode-oci-setup` runs without errors
- [ ] Auto-discovers profiles from `~/.oci/config`
- [ ] Validates credentials via OCI API
- [ ] Discovers compartments automatically
- [ ] Generates valid `opencode.json`
- [ ] Fallback works for users without OCI CLI
- [ ] Setup time reduced to <2 minutes

---

## File Summary

### New Files

- `packages/oci-genai-provider/src/config/types.ts`
- `packages/oci-genai-provider/src/config/oci-config.ts`
- `packages/oci-genai-provider/src/config/validation.ts`
- `packages/oci-genai-provider/src/config/discovery.ts`
- `packages/oci-genai-provider/src/config/fallback.ts`
- `packages/oci-genai-provider/src/config/index.ts`
- `packages/oci-genai-provider/src/config/__tests__/*.test.ts`
- `packages/opencode-integration/templates/*`
- `packages/opencode-oci-setup/` (entire new package)

### Modified Files

- `packages/oci-genai-provider/package.json` (add exports)
- `packages/oci-genai-provider/tsup.config.ts` (add entry)
- `packages/opencode-integration/src/index.ts` (factory function)
- `packages/opencode-integration/README.md` (documentation)
