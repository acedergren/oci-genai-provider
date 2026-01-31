# OCI Generative AI Model Catalog

Complete reference for all models available through Oracle Cloud Infrastructure Generative AI service.

**Last Updated:** 2026-01-26
**Service Version:** OCI GenAI (January 2026)

---

## Quick Reference

| Model Family       | Best For                     | Context Window | Streaming | Tools | Vision |
| ------------------ | ---------------------------- | -------------- | --------- | ----- | ------ |
| **xAI Grok**       | Reasoning, analysis          | Large          | ✅        | ✅    | ❌     |
| **Meta Llama**     | General purpose, fine-tuning | Large          | ✅        | ✅    | ✅\*   |
| **Cohere Command** | RAG, enterprise              | Large          | ✅        | ✅    | ✅\*   |
| **Google Gemini**  | Fast inference, multimodal   | Very Large     | ✅        | ✅    | ✅     |
| **OpenAI gpt-oss** | Agentic tasks, reasoning     | Large          | ✅        | ✅    | ❌     |

_\*Vision capability available in specific variants_

---

## Model Families

### xAI Grok Models

**Overview:** Latest Grok models available via OCI GenAI (verified with OCI CLI in us-chicago-1/us-ashburn-1).

```typescript
const model = oci('xai.grok-4');
```

| Model ID                          | Notes                          |
| --------------------------------- | ------------------------------ |
| `xai.grok-4`                      | Base Grok 4 model              |
| `xai.grok-4-fast-reasoning`       | Faster reasoning variant       |
| `xai.grok-4-fast-non-reasoning`   | Faster non-reasoning variant   |
| `xai.grok-4-1-fast-reasoning`     | 4.1 fast reasoning variant     |
| `xai.grok-4-1-fast-non-reasoning` | 4.1 fast non-reasoning variant |
| `xai.grok-code-fast-1`            | Code-optimized fast model      |
| `xai.grok-3`                      | Grok 3 base                    |
| `xai.grok-3-fast`                 | Grok 3 fast                    |
| `xai.grok-3-mini`                 | Grok 3 mini                    |
| `xai.grok-3-mini-fast`            | Grok 3 mini fast               |

**Capabilities:**

- **Type:** Chat completion
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes (except mini models may be limited)
- **Vision:** ❌ No
- **Fine-tuning:** ❌ No

### Meta Llama Models

**Overview:** Open-source models from Meta with broad capabilities and fine-tuning support.

#### llama-3.3-70b-instruct ⭐

```typescript
const model = oci('meta.llama-3.3-70b-instruct');
```

**Capabilities:**

- **Type:** Chat completion
- **Context Window:** ~128K tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ❌ No
- **Fine-tuning:** ✅ Yes (dedicated clusters required)

**Best For:**

- Custom model fine-tuning
- Domain-specific applications
- Production workloads requiring customization
- Cost-effective general purpose tasks

**Pricing:** On-demand + Dedicated clusters for fine-tuning

**Note:** Only Llama model currently supporting fine-tuning on OCI.

---

#### llama-3.2-90b-vision

```typescript
const model = oci('meta.llama-3.2-90b-vision-instruct');
```

**Capabilities:**

- **Type:** Multimodal (text + vision)
- **Context Window:** Large
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ✅ Yes (images)
- **Fine-tuning:** ❌ No

**Best For:**

- Image analysis and description
- Visual question answering
- Document understanding with images
- Multimodal RAG applications

**Pricing:** On-demand only

---

#### llama-3.2-11b-vision

```typescript
const model = oci('meta.llama-3.2-11b-vision-instruct');
```

**Capabilities:**

- **Type:** Multimodal (text + vision, lightweight)
- **Context Window:** Large
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ✅ Yes (images)
- **Fine-tuning:** ❌ No

**Best For:**

- Cost-effective vision tasks
- High-volume image processing
- Edge deployment scenarios

**Pricing:** On-demand only (lower cost)

---

#### llama-3.1-405b

```typescript
const model = oci('meta.llama-3.1-405b-instruct');
```

**Capabilities:**

- **Type:** Chat completion (largest context)
- **Context Window:** ~128K tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ❌ No
- **Fine-tuning:** ❌ No

**Best For:**

- Long document processing
- Complex multi-turn conversations
- Large context requirements
- Research and analysis

**Pricing:** On-demand only

---

#### llama-3-70b-instruct

```typescript
const model = oci('meta.llama-3-70b-instruct');
```

**Capabilities:**

- **Type:** Chat completion (production stable)
- **Context Window:** ~8K tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ❌ No
- **Fine-tuning:** ❌ No

**Best For:**

- Production-stable deployments
- General-purpose applications
- Well-tested workloads

**Pricing:** On-demand only

---

### Cohere Command Models

**Overview:** Enterprise-focused models optimized for RAG and business applications.

#### command-a-reasoning

```typescript
const model = oci('cohere.command-a-reasoning');
```

**Capabilities:**

- **Type:** Chat completion (reasoning optimized)
- **Context Window:** ~128K tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ❌ No
- **Fine-tuning:** ❌ No

**Best For:**

- Complex reasoning tasks
- Multi-step problem solving
- Analytical workflows
- Business intelligence

**Pricing:** On-demand only

---

#### command-a-vision

```typescript
const model = oci('cohere.command-a-vision');
```

**Capabilities:**

- **Type:** Multimodal (text + vision)
- **Context Window:** Large
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ✅ Yes (images)
- **Fine-tuning:** ❌ No

**Best For:**

- Enterprise document processing
- Visual data analysis
- Multimodal RAG
- Customer support with images

**Pricing:** On-demand only

---

#### command-a

```typescript
const model = oci('cohere.command-a-03-2025');
```

**Capabilities:**

- **Type:** Chat completion (general purpose)
- **Context Window:** ~128K tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ❌ No
- **Fine-tuning:** ❌ No

**Best For:**

- General enterprise applications
- Customer service chatbots
- Content generation
- RAG applications

**Pricing:** On-demand only

---

#### command-r-08-2024

```typescript
const model = oci('cohere.command-r-08-2024');
```

**Capabilities:**

- **Type:** Chat completion (R series)
- **Context Window:** ~128K tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ❌ No
- **Fine-tuning:** ❌ No

**Best For:**

- RAG-optimized workloads
- Information retrieval
- Document Q&A
- Knowledge base applications

**Pricing:** On-demand only

---

#### command-r-plus-08-2024

```typescript
const model = oci('cohere.command-r-plus-08-2024');
```

**Capabilities:**

- **Type:** Chat completion (extended R series)
- **Context Window:** ~128K tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ❌ No
- **Fine-tuning:** ❌ No

**Best For:**

- Advanced RAG applications
- Complex information synthesis
- Multi-document reasoning
- Enterprise search

**Pricing:** On-demand only

---

### Google Gemini Models

**Overview:** Multimodal models with fast inference and large context windows.

#### gemini-2.5-pro

```typescript
const model = oci('google.gemini-2.5-pro');
```

**Capabilities:**

- **Type:** Multimodal (text + vision + audio)
- **Context Window:** ~2M tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ✅ Yes (images, video)
- **Fine-tuning:** ❌ No

**Best For:**

- Extremely long documents
- Multi-document analysis
- Complex multimodal tasks
- Research applications

**Pricing:** On-demand only

**Note:** Largest context window available (2M tokens).

---

#### gemini-2.5-flash

```typescript
const model = oci('google.gemini-2.5-flash');
```

**Capabilities:**

- **Type:** Multimodal (fast inference)
- **Context Window:** ~1M tokens
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ✅ Yes (images)
- **Fine-tuning:** ❌ No

**Best For:**

- High-throughput applications
- Real-time inference
- Production workloads with latency requirements
- Cost-effective multimodal

**Pricing:** On-demand only (optimized cost)

---

#### gemini-2.5-flash-lite

```typescript
const model = oci('google.gemini-2.5-flash-lite');
```

**Capabilities:**

- **Type:** Multimodal (lightweight)
- **Context Window:** Large
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes
- **Vision:** ✅ Yes (images)
- **Fine-tuning:** ❌ No

**Best For:**

- Very high-throughput applications
- Cost-sensitive multimodal tasks
- Edge deployments
- Simple vision tasks

**Pricing:** On-demand only (lowest cost)

---

### OpenAI gpt-oss Models

**Overview:** Reasoning and agentic task optimized models.

```typescript
const model = oci('openai.gpt-oss-120b');
```

**Capabilities:**

- **Type:** Chat completion (reasoning optimized)
- **Context Window:** Large
- **Streaming:** ✅ Yes
- **Tool Calling:** ✅ Yes (advanced)
- **Vision:** ❌ No
- **Fine-tuning:** ❌ No

**Best For:**

- Agentic workflows
- Multi-step reasoning
- Complex tool orchestration
- Autonomous systems

**Pricing:** On-demand only

---

## Deployment Modes

### On-Demand Serving

**Infrastructure:** Shared multi-tenant compute
**Pricing:** Pay-per-token
**Availability:** Instant access
**Throttling:** Dynamic (shared capacity)

**Use Cases:**

- Experimentation and development
- Variable workloads
- Cost-sensitive applications
- Most production workloads

**Configuration:**

```typescript
const { text } = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Hello',
  providerOptions: {
    servingMode: {
      servingType: 'ON_DEMAND',
      modelId: 'cohere.command-r-plus',
    },
  },
});
```

---

### Dedicated AI Clusters

**Infrastructure:** Isolated single-tenant compute
**Pricing:** Per unit-hour (reserved capacity)
**Availability:** Requires cluster provisioning
**Throttling:** None (guaranteed capacity)

**Use Cases:**

- Fine-tuned custom models
- Production workloads requiring guaranteed capacity
- Compliance/security requirements for isolation
- Hosting imported models

**Required For:**

- Fine-tuning custom models
- Persistent custom model hosting
- High-throughput production workloads

**Configuration:**

```typescript
const { text } = await generateText({
  model: oci('meta.llama-3.3-70b-instruct'),
  prompt: 'Hello',
  providerOptions: {
    servingMode: {
      servingType: 'DEDICATED',
      modelId: 'meta.llama-3.3-70b-instruct',
      endpointId: 'ocid1.generativeaiendpoint.oc1..<endpoint_id>',
    },
  },
});
```

**Important:** All on-demand text generation/summarization API models retired as of 2026. Use Chat API instead.

---

## Regional Availability

### Available Regions (11 total)

| Region                   | Location  | Code             |
| ------------------------ | --------- | ---------------- |
| **US Midwest**           | Chicago   | `us-chicago-1`   |
| **US East**              | Ashburn   | `us-ashburn-1`   |
| **US West**              | Phoenix   | `us-phoenix-1`   |
| **UK South**             | London    | `uk-london-1`    |
| **Germany Central**      | Frankfurt | `eu-frankfurt-1` |
| **EU Sovereign Central** | Frankfurt | `eu-frankfurt-2` |
| **UAE East**             | Dubai     | `me-dubai-1`     |
| **Saudi Arabia Central** | Riyadh    | `me-jeddah-1`    |
| **Japan Central**        | Osaka     | `ap-osaka-1`     |
| **India South**          | Hyderabad | `ap-hyderabad-1` |
| **Brazil East**          | Sao Paulo | `sa-saopaulo-1`  |

**Note:** Not all models available in all regions. Check OCI Console for region-specific availability.

**Set Region:**

```typescript
const oci = createOCI({
  region: 'us-ashburn-1', // Specify explicitly
});
```

---

## Feature Support Matrix

| Feature                   | xAI Grok | Meta Llama | Cohere | Gemini | OpenAI |
| ------------------------- | -------- | ---------- | ------ | ------ | ------ |
| **Streaming**             | ✅       | ✅         | ✅     | ✅     | ✅     |
| **Tool Calling**          | ✅       | ✅         | ✅     | ✅     | ✅     |
| **Vision**                | ❌       | ✅\*       | ✅\*   | ✅     | ❌     |
| **Fine-tuning**           | ❌       | ✅\*\*     | ❌     | ❌     | ❌     |
| **Large Context (>100K)** | ✅       | ✅         | ✅     | ✅     | ✅     |
| **Multimodal**            | ❌       | ✅\*       | ✅\*   | ✅     | ❌     |

_\*Vision available in specific variants
\*\*Fine-tuning only available for llama-3.3-70b-instruct_

---

## Model Selection Guide

### By Use Case

**Code Generation & Analysis:**

- **Best:** `xai.grok-4` - Superior reasoning
- **Alternative:** `meta.llama-3.3-70b-instruct` - Cost-effective
- **Lightweight:** `xai.grok-3-mini` - High throughput

**RAG & Information Retrieval:**

- **Best:** `cohere.command-r-plus-08-2024` - RAG-optimized
- **Alternative:** `cohere.command-r-08-2024` - Standard RAG
- **Multimodal:** `cohere.command-a-vision` - Images + text

**Long Document Processing:**

- **Best:** `google.gemini-2.5-pro` - 2M token context
- **Alternative:** `google.gemini-2.5-flash` - 1M tokens, faster
- **Lightweight:** `meta.llama-3.1-405b-instruct` - 128K tokens

**Vision & Multimodal:**

- **Best:** `google.gemini-2.5-pro` - Comprehensive multimodal
- **Alternative:** `meta.llama-3.2-90b-vision-instruct` - Strong vision
- **Lightweight:** `meta.llama-3.2-11b-vision-instruct` - Cost-effective

**Fine-tuning:**

- **Only Option:** `meta.llama-3.3-70b-instruct` - Requires dedicated cluster

**Agentic Workflows:**

- **Best:** `openai.gpt-oss-120b` - Agentic optimization
- **Alternative:** `cohere.command-a-reasoning` - Reasoning focus

### By Performance Requirements

**Low Latency:**

- `google.gemini-2.5-flash` - Fastest inference
- `xai.grok-4-fast-reasoning` - Optimized reasoning variant
- `xai.grok-3-mini` - Lightweight

**Cost Optimization:**

- `meta.llama-3-70b-instruct` - Stable, lower cost
- `xai.grok-3-mini` - Lightweight Grok
- `google.gemini-2.5-flash-lite` - Lowest multimodal cost

**Production Stability:**

- `meta.llama-3-70b-instruct` - Well-tested
- `xai.grok-3` - Previous generation stable
- `cohere.command-a-03-2025` - Enterprise-grade

---

## Pricing Considerations

**On-Demand Pricing (per 1K tokens):**

- **Input tokens:** Variable by model
- **Output tokens:** Typically 2-3x input cost
- **No minimum commitment**

**Dedicated Cluster Pricing:**

- **Per unit-hour:** Fixed hourly rate
- **Required for:** Fine-tuning, custom models
- **Benefit:** No per-token costs

**Cost Optimization Tips:**

1. Use smaller models for simple tasks (e.g., `grok-3-mini`)
2. Implement prompt caching for repeated contexts
3. Use dedicated clusters for high-volume (>1M tokens/day)
4. Choose flash/lite variants when appropriate
5. Optimize context window usage

---

## API Capabilities

### Supported Features

✅ **Chat Completions API** - All models
✅ **Streaming (SSE)** - All models
✅ **Tool/Function Calling** - All models (via GenAI Agents)
✅ **Embeddings API** - Separate embedding models (384-dim, 1024-dim)
❌ **Vision API** - Use multimodal chat instead
❌ **Legacy Text Generation API** - Retired 2026

### Model-Specific Limitations

**xAI Grok:**

- No vision capability
- On-demand only (no dedicated clusters yet)

**Meta Llama:**

- Fine-tuning: Only `llama-3.3-70b-instruct`
- Vision: Only `3.2-90b-vision` and `3.2-11b-vision`

**Cohere:**

- Vision: Only `command-a-vision`
- No fine-tuning support

**Google Gemini:**

- Very large context windows may have increased latency
- Video input support varies by model

**OpenAI gpt-oss:**

- No vision capability
- Details TBD (emerging model family)

---

## Migration Guide

### From Legacy Text Generation API

**Old (Deprecated):**

```typescript
// ❌ Retired as of 2026
const response = await client.generateText({
  modelId: 'cohere.command',
  prompt: 'Hello',
});
```

**New (Chat API):**

```typescript
// ✅ Use Chat API
const response = await client.chat({
  servingMode: {
    servingType: 'ON_DEMAND',
    modelId: 'cohere.command-r-plus',
  },
  chatRequest: {
    messages: [{ role: 'USER', content: [{ type: 'TEXT', text: 'Hello' }] }],
  },
});
```

### Model Name Changes

| Old Name         | New Name                                              |
| ---------------- | ----------------------------------------------------- |
| `cohere.command` | `cohere.command-a-03-2025` or `cohere.command-r-plus` |
| `llama-2-*`      | `meta.llama-3-*` or `meta.llama-3.3-*`                |
| `gemini-1.5-*`   | `google.gemini-2.5-*`                                 |

---

## Next Steps

- **[Authentication Guide](../../guides/authentication/)** - Configure OCI access
- **[IAM Policies](../../guides/iam-policies/)** - Required permissions
- **[Streaming Guide](../../guides/streaming/)** - Implement streaming
- **[Tool Calling Guide](../../guides/tool-calling/)** - Function integration
- **[First Chat Tutorial](../../tutorials/01-basic-chat.md)** - Get started

---

**Sources:**

- Project Archive Requirements Specification (2026-01-26)
- [OCI GenAI Documentation](https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm)
- [OCI GenAI Pretrained Models](https://docs.oracle.com/en-us/iaas/Content/generative-ai/pretrained-models.htm)
- [OCI GenAI Dedicated AI Clusters](https://docs.oracle.com/en-us/iaas/Content/generative-ai/dedicated-ai-cluster.htm)

**Last Updated:** 2026-01-26
