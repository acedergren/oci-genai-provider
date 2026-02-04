# OCI SDK for TypeScript - API Reference

Complete reference for using the Oracle Cloud Infrastructure TypeScript SDK with Generative AI services.

## Installation

### Core SDK Packages

```bash
# OCI Generative AI Inference (primary for chat/completion)
npm install oci-generativeaiinference

# OCI Generative AI (management operations)
npm install oci-generativeai

# OCI Generative AI Agent (agent operations)
npm install oci-generativeaiagent

# OCI Common (authentication and shared utilities)
npm install oci-common
```

**Sources:**

- [OCI TypeScript SDK Repository](https://github.com/oracle/oci-typescript-sdk)
- [OCI SDK Documentation](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/typescriptsdk.htm)

---

## Authentication

The OCI SDK supports multiple authentication methods through authentication providers.

### Method 1: Config File Authentication (Recommended)

Use `ConfigFileAuthenticationDetailsProvider` to load credentials from `~/.oci/config`.

**TypeScript:**

```typescript
import common = require('oci-common');

// Using default configuration (~/.oci/config, profile: DEFAULT)
const provider: common.ConfigFileAuthenticationDetailsProvider =
  new common.ConfigFileAuthenticationDetailsProvider();

// Using custom configuration path and profile
const configurationFilePath = '~/your_config_location';
const configProfile = 'your_profile_name';
const provider: common.ConfigFileAuthenticationDetailsProvider =
  new common.ConfigFileAuthenticationDetailsProvider(configurationFilePath, configProfile);
```

**JavaScript:**

```javascript
const common = require('oci-common');

// Using default configurations
const provider = new common.ConfigFileAuthenticationDetailsProvider();

// Using personal configuration
const configurationFilePath = '~/your_config_location';
const configProfile = 'your_profile_name';
const provider = new common.ConfigFileAuthenticationDetailsProvider(
  configurationFilePath,
  configProfile
);
```

**Config File Format** (`~/.oci/config`):

```ini
[DEFAULT]
user=ocid1.user.oc1..<unique_id>
fingerprint=<fingerprint>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<unique_id>
region=us-ashburn-1
```

### Method 2: Simple Authentication Provider

Manually provide authentication details programmatically.

```typescript
import common = require('oci-common');

const provider = new common.SimpleAuthenticationDetailsProvider(
  '<tenancy_ocid>',
  '<user_ocid>',
  '<fingerprint>',
  '<private_key_path>',
  null, // passphrase (optional)
  common.Region.US_ASHBURN_1
);
```

### Method 3: Instance Principal Authentication

Use when running on OCI Compute instances.

```typescript
import common = require('oci-common');

// Automatically uses instance metadata
const provider = common.ResourcePrincipalAuthenticationDetailsProvider.builder();
```

**CLI Equivalent:**

```bash
oci generative-ai-inference --auth instance_principal
```

### Method 4: Resource Principal Authentication

Use when running in OCI Functions or other resource principal contexts.

```typescript
import common = require('oci-common');

const provider = common.ResourcePrincipalAuthenticationDetailsProvider.builder();
```

**CLI Equivalent:**

```bash
oci generative-ai-inference --auth resource_principal
```

---

## Custom Configuration Values

You can add custom key-value pairs to your OCI config file and retrieve them programmatically.

**Config File Example:**

```ini
[DEFAULT]
user=ocid1.user.oc1..<unique_id>
fingerprint=<fingerprint>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<unique_id>
customCompartmentId=ocid1.compartment.oc1..<unique_id>
customRegion=us-phoenix-1
```

**Retrieve Custom Values:**

```typescript
import common = require('oci-common');

const configurationFilePath = '~/.oci/config';
const configProfile = 'DEFAULT';
const config = common.ConfigFileReader.parseDefault(configurationFilePath);
const profile = config.accumulator.configurationsByProfile.get(configProfile);

const customCompartmentId = profile.get('customCompartmentId') || '';
const customRegion = profile.get('customRegion') || '';

console.log('Custom Compartment ID:', customCompartmentId);
console.log('Custom Region:', customRegion);
```

---

## GenerativeAiInferenceClient

The primary client for interacting with OCI Generative AI inference endpoints.

### Client Initialization

```typescript
import * as genaiinference from 'oci-generativeaiinference';
import * as common from 'oci-common';

// Initialize authentication provider
const provider = new common.ConfigFileAuthenticationDetailsProvider();

// Create the client
const client = new genaiinference.GenerativeAiInferenceClient({
  authenticationDetailsProvider: provider,
});

// Set the region (optional if specified in config)
client.region = common.Region.US_ASHBURN_1;
```

### Chat Completion Request

**Request Structure:**

```typescript
interface ChatRequest {
  compartmentId: string;
  servingMode: {
    modelId?: string; // For on-demand models
    endpointId?: string; // For dedicated AI clusters
    servingType: 'ON_DEMAND' | 'DEDICATED';
  };
  chatRequest: {
    messages: Array<{
      role: 'USER' | 'ASSISTANT' | 'SYSTEM';
      content: Array<{
        type: 'TEXT';
        text: string;
      }>;
    }>;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
    isStream?: boolean; // Enable streaming
  };
}
```

**Example:**

```typescript
const request: genaiinference.models.ChatRequest = {
  compartmentId: 'ocid1.compartment.oc1..<unique_id>',
  servingMode: {
    modelId: 'cohere.command-r-plus',
    servingType: 'ON_DEMAND',
  },
  chatRequest: {
    messages: [
      {
        role: 'USER',
        content: [
          {
            type: 'TEXT',
            text: 'What is Oracle Cloud Infrastructure?',
          },
        ],
      },
    ],
    maxTokens: 500,
    temperature: 0.7,
    isStream: false,
  },
};

const response = await client.chat(request);
console.log(response.chatResponse.chatResult.text);
```

### Streaming Response

When `isStream: true`, the response is sent as Server-Sent Events (SSE).

**Streaming Request:**

```typescript
const streamRequest: genaiinference.models.ChatRequest = {
  compartmentId: 'ocid1.compartment.oc1..<unique_id>',
  servingMode: {
    modelId: 'cohere.command-r-plus',
    servingType: 'ON_DEMAND',
  },
  chatRequest: {
    messages: [
      {
        role: 'USER',
        content: [{ type: 'TEXT', text: 'Write a story about AI' }],
      },
    ],
    isStream: true,
  },
};

// Response will be an event stream
const response = await client.chat(streamRequest);
```

**SSE Event Format:**

```
event: message
data: {"text": "Once", "finishReason": null}

event: message
data: {"text": " upon", "finishReason": null}

event: message
data: {"text": " a", "finishReason": null}

event: done
data: {"finishReason": "COMPLETE"}
```

See [Streaming Guide](../../guides/streaming/) for implementation details.

---

## Response Structure

### Non-Streaming Response

```typescript
interface ChatResponse {
  chatResponse: {
    chatResult: {
      text: string;
      finishReason: 'COMPLETE' | 'LENGTH' | 'STOP' | 'CONTENT_FILTER';
    };
    modelId: string;
    modelVersion: string;
  };
  opcRequestId: string; // For debugging/support
}
```

### Error Response

```typescript
interface OciError {
  statusCode: number; // HTTP status (401, 403, 429, 500, etc.)
  code: string; // Error code (e.g., "NotAuthenticated")
  message: string; // Human-readable error message
  opcRequestId: string; // Request ID for OCI support
}
```

**Common Status Codes:**

- `401 Unauthorized` - Authentication failed (check API key, config)
- `403 Forbidden` - IAM policy insufficient (see [IAM Policies Guide](../../guides/iam-policies/))
- `404 Not Found` - Model or endpoint not found
- `429 Too Many Requests` - Rate limit exceeded (implement backoff)
- `500 Internal Server Error` - OCI service error (retry)
- `503 Service Unavailable` - Service temporarily unavailable (retry)

---

## Tool Calling (Function Calling)

OCI Generative AI supports tool calling for function integration.

### Tool Definition Format

```typescript
interface ToolDefinition {
  type: 'FUNCTION';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<
        string,
        {
          type: string;
          description: string;
          enum?: string[];
        }
      >;
      required?: string[];
    };
  };
}
```

**Example:**

```typescript
const tools: ToolDefinition[] = [
  {
    type: 'FUNCTION',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g., San Francisco, CA',
          },
          unit: {
            type: 'string',
            description: 'Temperature unit',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  },
];

const request: genaiinference.models.ChatRequest = {
  compartmentId: 'ocid1.compartment.oc1..<unique_id>',
  servingMode: {
    modelId: 'cohere.command-r-plus',
    servingType: 'ON_DEMAND',
  },
  chatRequest: {
    messages: [
      {
        role: 'USER',
        content: [{ type: 'TEXT', text: "What's the weather in Boston?" }],
      },
    ],
    tools: tools,
  },
};
```

### Tool Call Response

When the model wants to call a tool, the response includes a tool call:

```typescript
interface ToolCallResponse {
  chatResponse: {
    chatResult: {
      toolCalls: Array<{
        id: string;
        type: 'FUNCTION';
        function: {
          name: string;
          arguments: string; // JSON string
        };
      }>;
    };
  };
}
```

See [Tool Calling Guide](../../guides/tool-calling/) for complete integration patterns.

---

## Regional Endpoints

OCI Generative AI is available in specific regions. Set the region explicitly:

```typescript
import common = require('oci-common');

// Using region enum
client.region = common.Region.US_ASHBURN_1;
client.region = common.Region.US_CHICAGO_1;
client.region = common.Region.EU_FRANKFURT_1;

// Using region string
client.region = common.Region.fromRegionId('us-ashburn-1');
```

**Available Regions:**
See [OCI GenAI Models Reference](../../reference/oci-genai-models/) for regional availability.

---

## Configuration Options

### Timeouts

```typescript
// Connection timeout (default: 10 seconds)
const client = new genaiinference.GenerativeAiInferenceClient({
  authenticationDetailsProvider: provider,
  clientConfiguration: {
    connectionTimeout: 30000, // 30 seconds
  },
});
```

**CLI Equivalent:**

```bash
oci generative-ai-inference --connection-timeout 30
```

### Retry Configuration

```typescript
// Max retries (default: 7 for most operations)
const client = new genaiinference.GenerativeAiInferenceClient({
  authenticationDetailsProvider: provider,
  clientConfiguration: {
    retryConfiguration: {
      maxAttempts: 5,
    },
  },
});
```

**CLI Equivalent:**

```bash
oci generative-ai-inference --max-retries 5
oci generative-ai-inference --no-retry  # Disable retries
```

### Logging

```bash
# Enable debug logging
export DEBUG=oci-sdk:*

# Or using CLI
oci generative-ai-inference --debug
```

---

## OCI CLI Commands

The OCI CLI provides equivalent functionality for testing and automation.

### List Available Models

```bash
oci generative-ai model list \
  --compartment-id <compartment_ocid>
```

### Chat Completion

```bash
oci generative-ai-inference chat \
  --compartment-id <compartment_ocid> \
  --serving-mode '{"servingType":"ON_DEMAND","modelId":"cohere.command-r-plus"}' \
  --chat-request '{"messages":[{"role":"USER","content":[{"type":"TEXT","text":"Hello"}]}]}'
```

### Streaming Chat

```bash
oci generative-ai-inference chat \
  --compartment-id <compartment_ocid> \
  --serving-mode '{"servingType":"ON_DEMAND","modelId":"cohere.command-r-plus"}' \
  --chat-request '{"messages":[{"role":"USER","content":[{"type":"TEXT","text":"Hello"}]}],"isStream":true}'
```

---

## Complete Example

```typescript
import * as genaiinference from 'oci-generativeaiinference';
import * as common from 'oci-common';

async function chatWithOCI() {
  // Initialize authentication
  const provider = new common.ConfigFileAuthenticationDetailsProvider('~/.oci/config', 'DEFAULT');

  // Create client
  const client = new genaiinference.GenerativeAiInferenceClient({
    authenticationDetailsProvider: provider,
  });

  // Set region
  client.region = common.Region.US_ASHBURN_1;

  // Prepare request
  const request: genaiinference.models.ChatRequest = {
    compartmentId: 'ocid1.compartment.oc1..<unique_id>',
    servingMode: {
      modelId: 'cohere.command-r-plus',
      servingType: 'ON_DEMAND',
    },
    chatRequest: {
      messages: [
        {
          role: 'USER',
          content: [
            {
              type: 'TEXT',
              text: 'Explain quantum computing in simple terms',
            },
          ],
        },
      ],
      maxTokens: 500,
      temperature: 0.7,
    },
  };

  try {
    // Send request
    const response = await client.chat(request);

    // Extract text
    const text = response.chatResponse.chatResult.text;
    console.log('Response:', text);

    // Log metadata
    console.log('Model:', response.chatResponse.modelId);
    console.log('Request ID:', response.opcRequestId);
  } catch (error) {
    if (error.statusCode) {
      console.error('OCI Error:', error.statusCode, error.message);
      console.error('Request ID:', error.opcRequestId);
    } else {
      console.error('Error:', error);
    }
  }
}

chatWithOCI();
```

---

## Next Steps

- **[Authentication Guide](../../guides/authentication/)** - Detailed auth configuration
- **[Streaming Guide](../../guides/streaming/)** - Implement SSE streaming
- **[Tool Calling Guide](../../guides/tool-calling/)** - Function calling integration
- **[Model Catalog](../../reference/oci-genai-models/)** - Available models and capabilities
- **[Error Handling](../../reference/error-codes/)** - Error codes and troubleshooting

---

**Sources:**

- [OCI TypeScript SDK Documentation](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/typescriptsdk.htm)
- [OCI TypeScript SDK GitHub](https://github.com/oracle/oci-typescript-sdk)
- [OCI Generative AI API Reference](https://docs.oracle.com/en-us/iaas/api/#/en/generative-ai-inference/)
- [OCI CLI Documentation](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/)
- Context7 Library Query Results (2026-01-26)

**Last Updated**: 2026-01-26
