import { createOCI } from './packages/oci-genai-provider/dist/index.mjs';

const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});

const models = [
  'meta.llama-3.3-70b-instruct',
  'cohere.command-plus-latest',
  'cohere.command-a-03-2025',
  'google.gemini-2.5-flash',
];

for (const modelId of models) {
  console.log(`\nTesting ${modelId}...`);
  try {
    const model = provider.languageModel(modelId);
    const result = await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }],
    });
    const text = result.content[0].text;
    console.log(`✅ ${modelId}: ${text.substring(0, 50)}`);
  } catch (error) {
    console.error(`❌ ${modelId}: ${error.message}`);
  }
}
