import { createOCI } from './packages/oci-genai-provider/dist/index.mjs';

const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: 'eu-frankfurt-1',
});

console.log('Testing unclear AI SDK features with OCI GenAI...\n');

// Test 1: Seed parameter for deterministic generation
console.log('═'.repeat(80));
console.log('TEST 1: Seed Parameter (Deterministic Generation)');
console.log('═'.repeat(80));

const modelId = 'meta.llama-3.3-70b-instruct';
const model = provider.languageModel(modelId);

try {
  console.log('\n📌 Running same prompt with seed=42 twice...\n');

  const result1 = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Pick a random number between 1 and 100' }] }],
    seed: 42,
    temperature: 0.7,
  });

  const result2 = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Pick a random number between 1 and 100' }] }],
    seed: 42,
    temperature: 0.7,
  });

  console.log('Response 1:', result1.content[0].text);
  console.log('Response 2:', result2.content[0].text);

  if (result1.content[0].text === result2.content[0].text) {
    console.log('\n✅ Seed parameter works: Identical responses with same seed');
  } else {
    console.log('\n⚠️  Seed parameter: Responses differ (determinism not guaranteed by OCI)');
  }

  console.log('\n📌 Running with different seeds...\n');

  const result3 = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Pick a random number between 1 and 100' }] }],
    seed: 123,
    temperature: 0.7,
  });

  console.log('Response with seed=123:', result3.content[0].text);
  console.log('\n✅ Seed parameter is accepted by OCI API');

} catch (error) {
  console.error('❌ Seed parameter test failed:', error.message);
}

// Test 2: Response Format (JSON mode) - Cohere only
console.log('\n' + '═'.repeat(80));
console.log('TEST 2: Response Format / JSON Mode (Cohere models only)');
console.log('═'.repeat(80));

const cohereModel = provider.languageModel('cohere.command-a-03-2025');

try {
  console.log('\n📌 Testing JSON mode with Cohere model...\n');

  // Note: This will likely fail as AI SDK doesn't pass responseFormat to our provider yet
  const result = await cohereModel.doGenerate({
    prompt: [{
      role: 'user',
      content: [{
        type: 'text',
        text: 'Return a JSON object with these fields: name (string), age (number), city (string). Use example data.'
      }]
    }],
    responseFormat: {
      type: 'json',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          city: { type: 'string' }
        },
        required: ['name', 'age', 'city']
      }
    }
  });

  console.log('Response:', result.content[0].text);

  try {
    const parsed = JSON.parse(result.content[0].text);
    console.log('\n✅ Response is valid JSON:', parsed);
  } catch {
    console.log('\n⚠️  Response is not valid JSON (responseFormat may not be supported)');
  }

} catch (error) {
  console.log('❌ JSON mode test failed:', error.message);
  console.log('\n💡 This is expected - AI SDK may not pass responseFormat to provider yet');
}

// Test 3: Abort Signal (request cancellation)
console.log('\n' + '═'.repeat(80));
console.log('TEST 3: Abort Signal (Request Cancellation)');
console.log('═'.repeat(80));

try {
  console.log('\n📌 Testing request cancellation with AbortController...\n');

  const controller = new AbortController();

  // Cancel after 100ms
  setTimeout(() => {
    console.log('⏱️  Aborting request after 100ms...');
    controller.abort();
  }, 100);

  const result = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Write a very long essay about the history of computing' }] }],
    abortSignal: controller.signal,
  });

  console.log('❌ Request completed (should have been aborted)');

} catch (error) {
  if (error.name === 'AbortError' || error.message.includes('abort')) {
    console.log('✅ Abort signal works: Request was cancelled');
  } else {
    console.log('⚠️  Request failed but not due to abort:', error.message);
  }
}

// Test 4: Custom HTTP Headers
console.log('\n' + '═'.repeat(80));
console.log('TEST 4: Custom HTTP Headers');
console.log('═'.repeat(80));

try {
  console.log('\n📌 Testing custom HTTP headers...\n');

  const result = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Say hi' }] }],
    headers: {
      'X-Custom-Header': 'test-value',
      'X-Request-ID': 'test-123',
    }
  });

  console.log('Response:', result.content[0].text.substring(0, 50));
  console.log('\n✅ Custom headers parameter is accepted (headers may or may not be sent)');

} catch (error) {
  console.log('❌ Custom headers test failed:', error.message);
}

// Summary
console.log('\n' + '═'.repeat(80));
console.log('SUMMARY: Unclear Feature Support');
console.log('═'.repeat(80));
console.log(`
✅ SUPPORTED by OCI:
   - seed: integer parameter for deterministic generation (best effort)
   - responseFormat: Cohere models support JSON mode (CohereResponseFormat)

⚠️  PARTIALLY TESTED:
   - abortSignal: Needs OCI SDK support for request cancellation
   - headers: Custom HTTP headers (depends on OCI SDK implementation)

💡 NOTES:
   - Seed provides best-effort determinism (not guaranteed)
   - JSON mode is Cohere-specific (not available for Llama/Gemini)
   - AbortSignal and headers depend on OCI SDK's HTTP client capabilities
`);
