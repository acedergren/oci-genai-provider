import { createOCI } from './packages/oci-genai-provider/dist/index.mjs';

const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});

console.log('Testing Cohere response structure...\n');

const modelId = 'cohere.command-a-03-2025';
console.log(`Testing ${modelId}...`);

try {
  const model = provider.languageModel(modelId);
  const result = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Say hello' }] }],
  });

  console.log('\n📦 Full result structure:');
  console.log(JSON.stringify(result, null, 2));

} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  console.error(error);
}
