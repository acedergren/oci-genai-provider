import { createOCI } from './packages/oci-genai-provider/dist/index.mjs';

const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});

// Try Gemini
console.log('Testing Gemini 2.5 Flash...');
try {
  const model = provider.languageModel('google.gemini-2.5-flash');
  const result = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Say hi' }] }],
  });
  console.log('✅ Gemini works:', result.content[0].text);
} catch (error) {
  console.error('❌ Gemini error:', error.message);
}

// Try Cohere
console.log('\nTesting Cohere Command A...');
try {
  const model = provider.languageModel('cohere.command-a-03-2025');
  const result = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Say hi' }] }],
  });
  console.log('✅ Cohere works:', result.content[0].text);
} catch (error) {
  console.error('❌ Cohere error:', error.message);
}
