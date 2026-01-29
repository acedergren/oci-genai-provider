import { createOCI } from './packages/oci-genai-provider/dist/index.mjs';

const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});

console.log('Testing Cohere models with new format...\n');

const cohereModels = [
  'cohere.command-plus-latest',
  'cohere.command-a-03-2025',
];

for (const modelId of cohereModels) {
  console.log(`Testing ${modelId}...`);
  try {
    const model = provider.languageModel(modelId);
    const result = await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Say hello in 5 words' }] }],
    });
    const text = result.content[0].text;
    console.log(`✅ ${modelId}: ${text}\n`);
  } catch (error) {
    console.error(`❌ ${modelId}: ${error.message}\n`);
  }
}
