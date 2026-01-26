# IAM Policies for OCI GenAI Provider

Complete guide to configuring Oracle Cloud Infrastructure Identity and Access Management (IAM) policies for the OCI GenAI provider.

## Overview

IAM policies control access to OCI resources. The OCI GenAI provider requires specific permissions to:
- Call Generative AI inference APIs
- Access models (on-demand and dedicated)
- Read compartment metadata
- Optionally access Vault secrets and databases

**Without proper IAM policies, you will receive `403 NotAuthorizedOrNotFound` errors.**

---

## Quick Start

### Minimum Required Policies

For basic chat/completion functionality in compartment `AC`:

```hcl
Allow group <YOUR_GROUP_NAME> to use generative-ai-family in compartment AC
Allow group <YOUR_GROUP_NAME> to read compartments in compartment AC
```

**Replace `<YOUR_GROUP_NAME>`** with your OCI group (e.g., `Developers`, `GenAI-Users`).

**This enables:**
- ✅ Chat and completion API calls
- ✅ Streaming responses
- ✅ On-demand model access
- ✅ Playground testing

### Apply the Policies

**OCI Console:**
1. Navigate to **Identity → Policies**
2. Select compartment (AC or root)
3. Click **Create Policy**
4. Name: `GenAI-Inference-Access`
5. Paste the policy statements above
6. Click **Create**

**OCI CLI:**
```bash
oci iam policy create \
  --compartment-id <compartment_ocid> \
  --name GenAI-Inference-Access \
  --description "Allow GenAI inference operations" \
  --statements '[
    "Allow group <YOUR_GROUP> to use generative-ai-family in compartment AC",
    "Allow group <YOUR_GROUP> to read compartments in compartment AC"
  ]'
```

**Wait 1-2 minutes for policy propagation**, then test your application.

---

## Complete Policy Reference

For detailed policy configurations, troubleshooting, and advanced scenarios, see:

**[Required Policies Documentation →](required-policies.md)**

This comprehensive guide includes:
- Complete policy breakdown with explanations
- Optional policies (Vault, RAG, OAuth)
- Policy granularity options (dev vs. prod)
- Dynamic groups for service-to-service auth
- Terraform and CLI examples
- Verification steps
- Troubleshooting common errors
- Security best practices

---

## Understanding OCI IAM

### Policy Components

**Policy Statement Format:**
```
Allow <subject> to <verb> <resource-type> in <location> where <conditions>
```

**Example Breakdown:**
```hcl
Allow group Developers to use generative-ai-chat in compartment AC
      └─────┬────────┘    └┬─┘ └───────────┬──────────┘    └────┬────┘
       Subject (who)    Verb (what action)  Resource       Location
```

**Components:**
- **Subject**: Who gets access (`group`, `user`, `dynamic-group`, `any-user`)
- **Verb**: What they can do (`manage`, `use`, `read`, `inspect`)
- **Resource**: What they access (`generative-ai-family`, `generative-ai-chat`)
- **Location**: Where they access it (`compartment`, `tenancy`)
- **Conditions** (optional): Additional restrictions (`where`, `request.*`)

### Permission Verbs

| Verb | Permissions | Use Case |
|------|-------------|----------|
| `manage` | Full control (create, update, delete, use, read) | Administrators |
| `use` | Work with existing resources, invoke APIs | Developers |
| `read` | View configurations and metadata | Auditors |
| `inspect` | List and basic info only | Monitoring |

**For GenAI inference, you need:** `use`

### Resource Types

| Resource Type | What It Covers |
|---------------|----------------|
| `generative-ai-family` | All GenAI resources (recommended) |
| `generative-ai-chat` | Chat/conversational models only |
| `generative-ai-text-generation` | Text generation only |
| `generative-ai-text-embedding` | Embeddings only |
| `generative-ai-endpoint` | Custom/dedicated endpoints |
| `generative-ai-model` | Fine-tuned models |

**Recommendation:** Use `generative-ai-family` for simplicity unless you need fine-grained control.

---

## Common Policy Scenarios

### Scenario 1: Development Environment

**Use case:** Developers need access to test models in a dev compartment.

```hcl
# Broad access for development
Allow group Developers to use generative-ai-family in compartment GenAI-Dev
Allow group Developers to read compartments in compartment GenAI-Dev

# Optional: Allow model management for testing
Allow group Developers to manage generative-ai-endpoint in compartment GenAI-Dev
```

### Scenario 2: Production Application

**Use case:** Production service account with least-privilege access.

```hcl
# Minimal access for production inference
Allow group GenAI-Production-Users to use generative-ai-chat in compartment GenAI-Prod
Allow group GenAI-Production-Users to read compartments in compartment GenAI-Prod
```

### Scenario 3: CI/CD Pipeline

**Use case:** GitHub Actions or Jenkins needs to test GenAI functionality.

```hcl
# CI/CD user or group
Allow group CI-CD-Users to use generative-ai-family in compartment GenAI-Test
Allow group CI-CD-Users to read compartments in compartment GenAI-Test
```

**GitHub Actions Configuration:**
```yaml
- name: Setup OCI Config
  run: |
    mkdir -p ~/.oci
    echo "${{ secrets.OCI_CONFIG }}" > ~/.oci/config
    echo "${{ secrets.OCI_API_KEY }}" > ~/.oci/oci_api_key.pem
    chmod 600 ~/.oci/oci_api_key.pem

- name: Test GenAI
  run: npm test
  env:
    OCI_COMPARTMENT_ID: ${{ secrets.OCI_COMPARTMENT_ID }}
```

### Scenario 4: Compute Instance (Instance Principal)

**Use case:** Application running on OCI Compute instance without stored credentials.

**Step 1: Create Dynamic Group**
```hcl
# Match instances in compartment
ALL {instance.compartment.id = 'ocid1.compartment.oc1..<compartment_id>'}

# OR match specific instance
ALL {instance.id = 'ocid1.instance.oc1..<instance_id>'}
```

**Step 2: Create Policy for Dynamic Group**
```hcl
Allow dynamic-group GenAI-Compute-DG to use generative-ai-family in compartment GenAI-Prod
Allow dynamic-group GenAI-Compute-DG to read compartments in compartment GenAI-Prod
```

**Application Code:**
```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

// Automatically uses instance principal
const oci = createOCI({
  auth: 'instance_principal',
  region: 'us-ashburn-1'
});
```

### Scenario 5: OCI Functions (Resource Principal)

**Use case:** Serverless function calling GenAI API.

```hcl
# Allow functions in specific compartment
Allow any-user to use generative-ai-family in compartment GenAI-Prod where ALL {
  request.principal.type='resource',
  request.principal.compartment.id='ocid1.compartment.oc1..<function_compartment>'
}
```

**Function Code:**
```typescript
import fdk from '@fnproject/fdk';
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

fdk.handle(async (input: any) => {
  const oci = createOCI({ auth: 'resource_principal' });

  const { text } = await generateText({
    model: oci('cohere.command-r-plus'),
    prompt: input.prompt
  });

  return { response: text };
});
```

---

## Compartment Strategy

### Single Compartment (Simple)

```
Tenancy (root)
  └─ GenAI-Compartment
       ├─ Generative AI resources
       ├─ Policies
       └─ Users/Groups
```

**Policy:**
```hcl
Allow group GenAI-Users to use generative-ai-family in compartment GenAI-Compartment
```

### Multi-Compartment (Recommended for Production)

```
Tenancy (root)
  ├─ GenAI-Development
  │    ├─ Dev models and endpoints
  │    └─ Broad developer access
  ├─ GenAI-Testing
  │    ├─ Test models
  │    └─ CI/CD access
  └─ GenAI-Production
       ├─ Production models
       └─ Strict, minimal access
```

**Policies:**
```hcl
# Development - broader access
Allow group Developers to use generative-ai-family in compartment GenAI-Development

# Testing - CI/CD access
Allow group CI-CD to use generative-ai-family in compartment GenAI-Testing

# Production - minimal access
Allow dynamic-group Production-Services to use generative-ai-chat in compartment GenAI-Production
```

---

## Policy Propagation

### How Long Does It Take?

- **Typical:** 1-2 minutes
- **Maximum:** Up to 5 minutes
- **Cross-region:** May take longer

### Verify Policy Application

**Check policy exists:**
```bash
oci iam policy list --compartment-id <compartment_ocid>
```

**View specific policy:**
```bash
oci iam policy get --policy-id <policy_ocid>
```

**Verify group membership:**
```bash
# List users in group
oci iam group list-users --group-id <group_ocid>

# List groups for a user
oci iam user list-groups --user-id <user_ocid>
```

---

## Common Errors

### 403 NotAuthorizedOrNotFound

**Error Message:**
```
Authorization failed or requested resource not found
```

**Cause:** Missing or incorrect IAM policies.

**Solutions:**
1. Verify policies exist: `oci iam policy list --compartment-id <id>`
2. Check group membership: `oci iam group list-users --group-id <id>`
3. Wait 1-2 minutes for policy propagation
4. Verify compartment OCID is correct
5. Check policy verbs (need `use`, not just `read`)

### 401 NotAuthenticated

**Error Message:**
```
The required information to complete authentication was not provided
```

**Cause:** Authentication configuration issue (not IAM policy).

**Solutions:**
1. Check OCI config file exists: `ls ~/.oci/config`
2. Verify API key fingerprint matches OCI Console
3. Ensure private key file exists and has correct permissions (600)
4. Test authentication: `oci iam region list`

See [Authentication Guide](../authentication/) for auth troubleshooting.

### Service Not Enabled

**Error Message:**
```
The service generative-ai is not enabled for this tenancy
```

**Cause:** GenAI service not subscribed in your tenancy/region.

**Solutions:**
1. Navigate to: OCI Console → Analytics & AI → Generative AI
2. Click "Enable Service" if prompted
3. Verify your region supports GenAI
4. Contact OCI administrator to enable the service

---

## Security Best Practices

### 1. Apply Least Privilege

```hcl
# ❌ Too broad - avoid
Allow group Everyone to manage all-resources in tenancy

# ✅ Specific and appropriate
Allow group GenAI-Developers to use generative-ai-chat in compartment GenAI-Dev
```

### 2. Use Dynamic Groups for Services

```hcl
# ✅ Secure - no credentials in code
Allow dynamic-group App-Servers to use generative-ai-family in compartment Prod

# ❌ Insecure - requires storing API keys
# Manual API key configuration on each server
```

### 3. Separate Environments

```hcl
# Development
Allow group Developers to use generative-ai-family in compartment Dev

# Production
Allow dynamic-group Prod-Services to use generative-ai-chat in compartment Prod
```

### 4. Regular Audits

- Review policies quarterly
- Remove unused groups and policies
- Monitor GenAI API usage via OCI Audit logs
- Set up alerts for unexpected access patterns

**Check audit logs:**
```bash
oci audit event list \
  --compartment-id <compartment_ocid> \
  --start-time <ISO8601_timestamp> \
  --end-time <ISO8601_timestamp>
```

### 5. Conditional Policies

Add conditions for extra security:

```hcl
# Restrict by IP address
Allow group GenAI-Users to use generative-ai-family in compartment Prod where request.networkSource.name = 'CorporateNetwork'

# Restrict by time
Allow group GenAI-Users to use generative-ai-family in compartment Prod where request.time >= '09:00' AND request.time <= '17:00'

# Restrict by MFA
Allow group GenAI-Users to use generative-ai-family in compartment Prod where request.user.mfaTotpVerified = 'true'
```

---

## Testing Policies

### Test with OCI CLI

```bash
# Test basic inference permission
oci generative-ai-inference chat \
  --compartment-id <compartment_ocid> \
  --serving-mode '{"servingType":"ON_DEMAND","modelId":"cohere.command-r-plus"}' \
  --chat-request '{"messages":[{"role":"USER","content":[{"type":"TEXT","text":"Hello"}]}]}'

# Expected: Successful response with generated text
# If error: Check IAM policies
```

### Test with Provider

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

async function testPolicies() {
  const oci = createOCI({
    profile: 'DEFAULT',
    region: 'us-ashburn-1'
  });

  try {
    const { text } = await generateText({
      model: oci('cohere.command-r-plus'),
      prompt: 'Hello, world!',
      providerOptions: {
        compartmentId: process.env.OCI_COMPARTMENT_ID
      }
    });

    console.log('✅ Success! IAM policies are correct.');
    console.log('Response:', text);
  } catch (error: any) {
    if (error.statusCode === 403) {
      console.error('❌ IAM Policy Error: Missing required permissions');
      console.error('See: docs/guides/iam-policies/');
    } else if (error.statusCode === 401) {
      console.error('❌ Authentication Error: Check OCI config');
      console.error('See: docs/guides/authentication/');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testPolicies();
```

---

## Related Documentation

- **[Required Policies (Detailed)](required-policies.md)** - Complete policy reference
- **[Authentication Guide](../authentication/)** - OCI authentication setup
- **[OCI IAM Documentation](https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/overview.htm)** - Official OCI IAM docs
- **[GenAI IAM Policies](https://docs.oracle.com/en-us/iaas/Content/generative-ai/iam-policies.htm)** - OCI GenAI specific policies
- **[Policy Reference](https://docs.oracle.com/en-us/iaas/Content/Identity/Reference/policyreference.htm)** - Complete policy syntax
- **[Dynamic Groups](https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/managingdynamicgroups.htm)** - Dynamic group management

---

## Quick Reference

### Minimum Policies (Copy-Paste)

```hcl
# Basic inference access
Allow group <YOUR_GROUP> to use generative-ai-family in compartment <COMPARTMENT_NAME>
Allow group <YOUR_GROUP> to read compartments in compartment <COMPARTMENT_NAME>
```

### Check Your Group Name

```bash
oci iam group list --compartment-id <tenancy_ocid>
```

### Apply Policy

```bash
oci iam policy create \
  --compartment-id <compartment_ocid> \
  --name GenAI-Inference-Access \
  --description "Allow GenAI inference operations" \
  --statements '[
    "Allow group <YOUR_GROUP> to use generative-ai-family in compartment <COMPARTMENT>",
    "Allow group <YOUR_GROUP> to read compartments in compartment <COMPARTMENT>"
  ]'
```

### Verify and Test

```bash
# 1. Wait 1-2 minutes
sleep 120

# 2. Test OCI CLI
oci generative-ai-inference chat \
  --compartment-id <compartment_ocid> \
  --serving-mode '{"servingType":"ON_DEMAND","modelId":"cohere.command-r-plus"}' \
  --chat-request '{"messages":[{"role":"USER","content":[{"type":"TEXT","text":"Test"}]}]}'

# 3. Expected: JSON response with generated text
```

---

**Sources:**
- [OCI IAM Overview](https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/overview.htm)
- [OCI GenAI IAM Policies](https://docs.oracle.com/en-us/iaas/Content/generative-ai/iam-policies.htm)
- [Policy Reference Guide](https://docs.oracle.com/en-us/iaas/Content/Identity/Reference/policyreference.htm)
- Project Archive IAM Documentation
- OCI Best Practices Documentation

**Last Updated**: 2026-01-26
