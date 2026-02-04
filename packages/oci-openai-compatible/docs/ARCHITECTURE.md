# Architecture: OCI OpenAI-Compatible Wrapper

## Overview

This package wraps the OpenAI Node.js SDK to work with OCI's OpenAI-compatible endpoints, providing a familiar interface for teams migrating from OpenAI.

## Design Principles

1. **Minimal dependencies** - Only OpenAI SDK + OCI auth, no OCI SDK overhead
2. **Drop-in compatibility** - Swap imports, minimal code changes
3. **Type safety** - Full TypeScript support
4. **Simple auth** - API key focus (vs complex OCI auth)

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│   User Application Code                │
│   (Using OpenAI SDK patterns)          │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   @acedergren/oci-openai-compatible    │
│                                         │
│   ┌───────────────────────────────┐   │
│   │  createOCIOpenAI() Factory    │   │
│   └──────────┬────────────────────┘   │
│              │                         │
│              ▼                         │
│   ┌───────────────────────────────┐   │
│   │  Endpoint Resolver            │   │
│   │  - Region → URL mapping       │   │
│   │  - Custom endpoint support    │   │
│   └──────────┬────────────────────┘   │
│              │                         │
│              ▼                         │
│   ┌───────────────────────────────┐   │
│   │  Auth Adapter                 │   │
│   │  - Bearer token header        │   │
│   │  - Compartment ID header      │   │
│   └──────────┬────────────────────┘   │
│              │                         │
│              ▼                         │
│   ┌───────────────────────────────┐   │
│   │  OpenAI SDK Client            │   │
│   │  - Configured baseURL         │   │
│   │  - Custom headers             │   │
│   └──────────┬────────────────────┘   │
└──────────────┼─────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   OCI Generative AI Service             │
│   OpenAI-Compatible Endpoints           │
│   /20231130/actions/v1/chat/completions │
└─────────────────────────────────────────┘
```

## Components

### 1. Client Factory (`client.ts`)

**Purpose:** Create OpenAI client instances configured for OCI

**Responsibilities:**

- Construct base URL from region or custom endpoint
- Create authentication headers
- Initialize OpenAI SDK client with OCI config

**Why OpenAI SDK directly?**

- OCI's endpoints implement OpenAI API spec
- No need to reimplement request/response handling
- Automatic streaming support
- Type definitions from OpenAI SDK

### 2. Endpoint Resolver (`endpoint.ts`)

**Purpose:** Map OCI regions to OpenAI-compatible endpoint URLs

**Implementation:**

```
REGION → https://inference.generativeai.{region}.oci.oraclecloud.com/20231130/actions/v1
```

**Supported regions:** 6 (Ashburn, Chicago, Phoenix, Frankfurt, Hyderabad, Osaka)

### 3. Auth Adapter (`auth.ts`)

**Purpose:** Create OCI-specific HTTP headers for authentication

**Headers:**

- `Authorization: Bearer {apiKey}` - Standard OpenAI pattern
- `x-oci-compartment-id: {ocid}` - OCI-specific header

**Compartment ID resolution:**

1. Check `config.compartmentId`
2. Fallback to `process.env.OCI_COMPARTMENT_ID`
3. Throw error if neither available

### 4. Type Definitions (`types.ts`)

**Purpose:** TypeScript interfaces for configuration and models

**Key types:**

- `OCIOpenAIConfig` - Client configuration
- `OCIRegion` - Supported regions
- `OCIModelId` - Available model IDs
- `OCIAuthMethod` - Authentication methods

## Request Flow

```
1. User calls client.chat.completions.create(...)
   ↓
2. OpenAI SDK formats request as OpenAI API spec
   ↓
3. Request sent to OCI endpoint with custom headers:
   - Authorization: Bearer {apiKey}
   - x-oci-compartment-id: {ocid}
   ↓
4. OCI processes as OpenAI ChatCompletion request
   ↓
5. Response returned in OpenAI format
   ↓
6. OpenAI SDK parses response
   ↓
7. User receives typed response object
```

## Differences from Native Provider

| Aspect          | OpenAI-Compatible     | Native Provider                                 |
| --------------- | --------------------- | ----------------------------------------------- |
| **SDK**         | OpenAI SDK            | OCI SDK                                         |
| **Bundle size** | ~100 KB               | ~3 MB                                           |
| **Auth**        | API key only          | Instance principal, resource principal, API key |
| **Regions**     | 6 regions             | All OCI regions                                 |
| **API surface** | Chat completions only | Language models, embeddings, speech, etc.       |
| **Streaming**   | Via OpenAI SDK        | Custom SSE parser                               |
| **Error types** | OpenAI errors         | OCI-specific errors                             |

## Trade-offs

**Advantages:**

- ✅ Familiar OpenAI SDK patterns
- ✅ Minimal bundle size
- ✅ Simple authentication
- ✅ Easy migration from OpenAI

**Limitations:**

- ❌ Limited to 6 regions
- ❌ No instance/resource principal auth
- ❌ Chat completions only (no embeddings via OpenAI API)
- ❌ Less sophisticated error handling

## Extension Points

**Adding new regions:**

1. Update `OCIRegion` type in `types.ts`
2. Add endpoint to `REGION_ENDPOINTS` map
3. Update documentation

**Adding new models:**

1. Update `OCIModelId` type in `types.ts`
2. Update README model list
3. Test with actual OCI endpoint

**Supporting embeddings (if OCI adds endpoint):**

1. OpenAI SDK already supports `client.embeddings.create()`
2. No code changes needed if OCI implements `/embeddings` endpoint
3. Update docs to reflect new capability

## Testing Strategy

**Unit tests:**

- Type validation
- Endpoint resolution
- Auth header generation
- Config merging

**Integration tests:**

- Client creation
- Region support
- Custom endpoint handling

**Manual testing:**

- Real API calls (requires OCI credentials)
- Streaming responses
- Error scenarios

## Security Considerations

**API Key Handling:**

- Never log API keys
- Support environment variables
- Allow runtime config override

**Compartment ID:**

- Required for OCI authorization
- Sent as header (not in URL)
- Validated by OCI service

**HTTPS Only:**

- All endpoints use HTTPS
- No HTTP fallback
- Custom endpoints must be HTTPS
