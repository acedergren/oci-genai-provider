# IAM Policy Requirements for OCI GenAI Provider

## Executive Summary

The oci-genai-provider requires specific OCI IAM policies to function. Current API call failures are due to **missing IAM permissions on compartment AC**, not code issues. This document provides ready-to-use policy statements.

---

## Required IAM Policies

### Minimum Required (For Basic Inference)

**Compartment:** AC (`ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq`)

```hcl
Allow group <YOUR_GROUP_NAME> to use generative-ai-family in compartment AC
Allow group <YOUR_GROUP_NAME> to read compartments in compartment AC
```

**What this enables:**

- Call GenAI inference APIs (chat, stream)
- Use on-demand models (Grok, Llama, Gemini, Cohere)
- Access playground for testing
- Read compartment metadata

**Permission Level:** `use` (can work with existing resources, cannot create/delete)

---

## Detailed Policy Breakdown

### 1. Core GenAI Access

```hcl
Allow group <YOUR_GROUP_NAME> to use generative-ai-family in compartment AC
```

**Resource Type:** `generative-ai-family` (aggregate covering all GenAI resources)

**Individual resources included:**

- `generative-ai-chat` - Chat/conversational models
- `generative-ai-text-generation` - Text generation
- `generative-ai-text-embedding` - Embeddings
- `generative-ai-endpoint` - Hosted endpoints
- `generative-ai-model` - Custom models

**Why needed:** Provider makes API calls to:

- `GenerativeAiInferenceClient.chat()` - Main inference operation
- `GenerativeAiInferenceClient.chatStream()` - Streaming responses

**Operations enabled:**

- ✅ Inference (chat, completion, streaming)
- ✅ Model discovery and listing
- ✅ Playground access
- ❌ Creating endpoints (requires `manage`)
- ❌ Fine-tuning models (requires `manage`)

---

### 2. Compartment Inspection

```hcl
Allow group <YOUR_GROUP_NAME> to read compartments in compartment AC
```

**Why needed:** GenAI API calls require validating that the compartment exists and is accessible

**Operations enabled:**

- Verify compartment OCID is valid
- Read compartment metadata
- List child compartments (if any)

---

### 3. Optional: OAuth Secret Access (If Using IDCS Auth)

**Only required if:** Using OAuth browser flow instead of API key authentication

```hcl
Allow group <YOUR_GROUP_NAME> to read secret-family in compartment <VAULT_COMPARTMENT>
Allow group <YOUR_GROUP_NAME> to use vaults in compartment <VAULT_COMPARTMENT>
```

**What this enables:**

- Retrieve OAuth client secret from OCI Vault
- Required for `packages/opencode-oci-genai-auth` plugin
- API: `SecretsClient.getSecretBundle({ secretId })`

**Note:** Not needed for standard API key or instance principal auth

---

### 4. Optional: RAG Database Access (If Using ADB RAG Mode)

**Only required if:** Using `OCI_RAG_MODE=db` with Oracle Autonomous Database

```hcl
Allow group <YOUR_GROUP_NAME> to read autonomous-databases in compartment <ADB_COMPARTMENT>
Allow group <YOUR_GROUP_NAME> to use autonomous-databases in compartment <ADB_COMPARTMENT>
```

**What this enables:**

- Connect to Oracle ADB 23ai/26ai
- Execute `DBMS_HYBRID_VECTOR` searches
- Read database connection strings
- Download wallet files

**Alternative:** Database credentials can be managed via Vault secrets instead

---

## Policy Granularity Options

### Option 1: Broadest Access (Recommended for Development)

```hcl
Allow group GenAI-Developers to use generative-ai-family in compartment AC
```

**Pros:** Simple, covers all GenAI operations
**Cons:** More permissive than needed for production

### Option 2: Minimal/Specific Access (Recommended for Production)

```hcl
Allow group GenAI-Production-Users to use generative-ai-chat in compartment AC
Allow group GenAI-Production-Users to use generative-ai-text-generation in compartment AC
```

**Pros:** Least-privilege principle, limits attack surface
**Cons:** Must update if using new resource types

### Option 3: Read-Only Access (For Auditing/Monitoring)

```hcl
Allow group GenAI-Auditors to read generative-ai-family in compartment AC
Allow group GenAI-Auditors to inspect generative-ai-family in compartment AC
```

**Pros:** Can view usage and configurations without making changes
**Cons:** Cannot invoke models or run inference

---

## Applying Policies

### Method 1: OCI Console (Web UI)

1. Navigate to **Identity → Policies**
2. Select compartment: **AC** (or root tenancy for cross-compartment)
3. Click **Create Policy**
4. Name: `GenAI-Inference-Access`
5. Description: `Allow GenAI inference operations in compartment AC`
6. Policy Builder → **Show manual editor**
7. Paste policy statements
8. Click **Create**

### Method 2: OCI CLI

```bash
# Create policy in compartment AC
oci iam policy create \
  --compartment-id ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq \
  --name GenAI-Inference-Access \
  --description "Allow GenAI inference operations" \
  --statements '[
    "Allow group <YOUR_GROUP> to use generative-ai-family in compartment AC",
    "Allow group <YOUR_GROUP> to read compartments in compartment AC"
  ]'
```

### Method 3: Terraform

```hcl
resource "oci_identity_policy" "genai_inference_access" {
  compartment_id = "ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq"
  name           = "GenAI-Inference-Access"
  description    = "Allow GenAI inference operations in compartment AC"

  statements = [
    "Allow group <YOUR_GROUP> to use generative-ai-family in compartment AC",
    "Allow group <YOUR_GROUP> to read compartments in compartment AC"
  ]
}
```

---

## Dynamic Groups (For Service-to-Service Auth)

**Use case:** OCI Functions or Compute instances calling GenAI without storing credentials

### Step 1: Create Dynamic Group

```hcl
# Match all instances in compartment AC
ALL {instance.compartment.id = 'ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq'}
```

### Step 2: Create Policy for Dynamic Group

```hcl
Allow dynamic-group GenAI-Service-Instances to use generative-ai-family in compartment AC
```

**Provider configuration for instance principal:**

```typescript
const provider = createOCIGenAI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  // No configProfile - will auto-detect instance principal
});
```

---

## Verification Steps

### 1. Verify Policy Application (OCI CLI)

```bash
# List all policies in compartment AC
oci iam policy list --compartment-id ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq

# Get specific policy details
oci iam policy get --policy-id <POLICY_OCID>
```

### 2. Test with Provider

```bash
# Set environment
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq"
export OCI_CONFIG_PROFILE="ASHBURN"

# Run live test
cd /Users/acedergr/Projects/oci-genai-provider
node test-live-api.mjs
```

**Expected output:**

```
✅ API call successful
💬 Generated Response: [model response]
✨ SUCCESS! Full stack verification complete.
```

### 3. Test with OpenCode CLI

```bash
# After policies are applied and OpenCode is restarted
opencode --model oci-genai/meta.llama-3.3-70b-instruct
```

**Expected behavior:** Model loads and responds to prompts

---

## Troubleshooting

### Issue: "Authorization failed" or "NotAuthorized"

**Cause:** Missing or incorrect IAM policies

**Solutions:**

1. Verify group membership: `oci iam group list-users --group-id <GROUP_OCID>`
2. Check policy exists: `oci iam policy list --compartment-id <COMPARTMENT_OCID>`
3. Wait 1-2 minutes for policy propagation
4. Ensure compartment OCID matches exactly

### Issue: "Service not enabled"

**Cause:** GenAI service not subscribed in tenancy

**Solutions:**

1. OCI Console → Analytics & AI → Generative AI
2. Click "Enable Service" if prompted
3. Contact OCI administrator to enable GenAI in your region

### Issue: "Model not found"

**Cause:** Model not available in specified region

**Solutions:**

1. Verify model availability: Check OCI GenAI console for model list
2. Use correct region: Models like Grok are in `us-ashburn-1`
3. Check model ID spelling (e.g., `meta.llama-3.3-70b-instruct`)

---

## Security Best Practices

### 1. Least Privilege

```hcl
# ❌ Too broad
Allow group Everyone to manage generative-ai-family in tenancy

# ✅ Appropriate
Allow group GenAI-Developers to use generative-ai-chat in compartment AC
```

### 2. Separate Environments

```hcl
# Development compartment - broader access
Allow group Developers to use generative-ai-family in compartment GenAI-Dev

# Production compartment - stricter access
Allow group GenAI-Production-Service to use generative-ai-chat in compartment GenAI-Prod
```

### 3. Regular Policy Audits

- Review policies quarterly
- Remove unused groups/policies
- Use OCI Audit logs to track GenAI API usage
- Set up monitoring for unexpected access patterns

### 4. Credential Management

- ✅ Use instance principals for compute resources
- ✅ Store OAuth secrets in OCI Vault
- ✅ Rotate API keys regularly (90 days)
- ❌ Never commit credentials to git
- ❌ Don't hardcode compartment IDs in code

---

## Policy Template (Copy-Paste Ready)

```hcl
# Policy Name: GenAI-Inference-Access-AC
# Description: Allow GenAI inference operations in compartment AC
# Compartment: AC (ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq)

# Core GenAI access
Allow group <YOUR_GROUP_NAME> to use generative-ai-family in compartment AC

# Compartment inspection
Allow group <YOUR_GROUP_NAME> to read compartments in compartment AC

# Optional: OAuth secret access (if using IDCS auth)
# Allow group <YOUR_GROUP_NAME> to read secret-family in compartment <VAULT_COMPARTMENT>
# Allow group <YOUR_GROUP_NAME> to use vaults in compartment <VAULT_COMPARTMENT>

# Optional: RAG database access (if using ADB RAG mode)
# Allow group <YOUR_GROUP_NAME> to read autonomous-databases in compartment <ADB_COMPARTMENT>
# Allow group <YOUR_GROUP_NAME> to use autonomous-databases in compartment <ADB_COMPARTMENT>
```

**Replace:**

- `<YOUR_GROUP_NAME>` → Your OCI group name (e.g., `Developers`, `GenAI-Users`)
- `<VAULT_COMPARTMENT>` → Compartment containing your Vault (if using OAuth)
- `<ADB_COMPARTMENT>` → Compartment containing your ADB (if using database RAG)

---

## Related Resources

- [Official OCI GenAI IAM Documentation](https://docs.oracle.com/en-us/iaas/Content/generative-ai/iam-policies.htm)
- [OCI IAM Policy Reference](https://docs.oracle.com/en-us/iaas/Content/Identity/Reference/policyreference.htm)
- [Managing Dynamic Groups](https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/managingdynamicgroups.htm)
- Provider README: `/Users/acedergr/Projects/oci-genai-provider/packages/opencode-oci-genai/README.md`
- Test Results: `/Users/acedergr/Projects/oci-genai-provider/TEST_RESULTS_SUMMARY.md`

---

## Next Steps

1. **Identify your OCI group name:**

   ```bash
   oci iam group list --compartment-id <TENANCY_OCID>
   ```

2. **Apply minimum required policies** (see template above)

3. **Wait 1-2 minutes** for policy propagation

4. **Test with live API script:**

   ```bash
   export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq"
   node test-live-api.mjs
   ```

5. **If successful**, restart OpenCode and test: `opencode --model oci-genai/meta.llama-3.3-70b-instruct`

---

**Document Version:** 1.0
**Last Updated:** January 26, 2026
**Provider Version:** 0.1.0
