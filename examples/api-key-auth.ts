import { generateText } from 'ai';
import { createOCI } from '@acedergren/oci-genai-provider';

const oci = createOCI({
  auth: 'api_key',
  apiKey: process.env.OCI_GENAI_API_KEY,
  region: 'us-chicago-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});

const result = await generateText({
  model: oci.languageModel('openai.gpt-oss-120b'),
  prompt: 'Summarize why OCI Generative AI API keys are useful for app integrations.',
  providerOptions: {
    oci: {
      guardrails: {
        input: {
          promptInjection: true,
          contentModeration: {
            categories: ['OVERALL', 'BLOCKLIST'],
          },
        },
      },
    },
  },
});

console.log(result.text);
