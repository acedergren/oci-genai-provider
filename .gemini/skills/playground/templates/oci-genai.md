# OCI GenAI Playground Template

Use this template to create an interactive explorer for OCI Generative AI provider configuration. It helps users understand how different parameters (compartment, region, auth, serving mode, model options) affect the provider initialization and model calls.

## Layout

```
+-------------------+----------------------+
|                   |                      |
|  Controls         |  Live Code Preview   |
|  grouped by:      |  (shows config object|
|  • Auth & Core    |   and model usage)   |
|  • Serving Mode   |                      |
|  • Model Options  |                      |
|  • Advanced       |                      |
|                   +----------------------+
|                   |  Implementation Note |
|                   |  & Prompt Output     |
|                   |  [ Copy Code ]       |
+-------------------+----------------------+
```

## Control types by decision

| Decision | Control | Example |
|---|---|---|
| Auth Method | Dropdown | config_file, instance_principal, resource_principal |
| Serving Mode | Toggle | ON_DEMAND / DEDICATED |
| Model ID | Searchable List | cohere.command-r-plus, meta.llama-3.3-70b-instruct |
| Temperature | Slider | 0.0 to 1.0 (step 0.1) |
| Top P/K | Sliders | 0.0 to 1.0 / 1 to 500 |
| Reasoning | Toggle | Enable reasoning effort (where supported) |
| Reasoning Effort| Dropdown | none, minimal, low, medium, high |

## Preview rendering

Generate a TypeScript snippet showing `createOCI` and `provider.languageModel()` usage:

```javascript
function renderPreview() {
  const codeEl = document.getElementById('code-preview');
  let configStr = `compartmentId: '${state.compartmentId}',\n  region: '${state.region}'`;
  
  if (state.profile !== 'DEFAULT') {
    configStr += `,\n  profile: '${state.profile}'`;
  }
  
  if (state.auth !== 'config_file') {
    configStr += `,\n  auth: '${state.auth}'`;
  }

  codeEl.textContent = `import { createOCI } from '@acedergren/oci-genai-provider';

const oci = createOCI({
  ${configStr}
});

const model = oci.languageModel('${state.modelId}', {
  temperature: ${state.temperature},
  topP: ${state.topP},
  ${state.reasoning ? `reasoningEffort: '${state.reasoningEffort}'` : ''}
});`;
}
```

## Prompt output for OCI GenAI

Frame it as a request to implement or fix the OCI provider setup:

> "Initialize the OCI provider using the '${state.profile}' profile in '${state.region}'. Use the '${state.modelId}' model with a temperature of ${state.temperature}. ${state.servingMode === 'DEDICATED' ? 'Configure it to use a dedicated endpoint: ' + state.endpointId : 'Use on-demand serving mode.'}"

## Presets

Include 3-5 presets:
1. **Production Balanced**: On-demand, temperature 0.7, topP 0.9, standard config.
2. **Dedicated Fast**: Dedicated serving mode, temperature 0.3, high reliability.
3. **Reasoning Expert**: Grok 4 with 'high' reasoning effort enabled.
4. **Minimal Setup**: Just compartment and region, all defaults.

```