import { createOCI } from './packages/oci-genai-provider/dist/index.mjs';
import { getAllModels } from './packages/oci-genai-provider/dist/index.mjs';

const regions = [
  { name: 'Frankfurt', id: 'eu-frankfurt-1' },
  { name: 'Ashburn', id: 'us-ashburn-1' },
  { name: 'Phoenix', id: 'us-phoenix-1' },
];

const testModels = [
  // Grok models (expected in Ashburn)
  { id: 'xai.grok-4-maverick', family: 'grok' },
  { id: 'xai.grok-3', family: 'grok' },
  // Llama models
  { id: 'meta.llama-3.3-70b-instruct', family: 'llama' },
  // Gemini models
  { id: 'google.gemini-2.5-flash', family: 'gemini' },
  // Cohere models
  { id: 'cohere.command-a-03-2025', family: 'cohere' },
  { id: 'cohere.command-plus-latest', family: 'cohere' },
];

const results = {};

for (const region of regions) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📍 Testing region: ${region.name} (${region.id})`);
  console.log('='.repeat(80));

  results[region.id] = { working: [], failing: [] };

  const provider = createOCI({
    compartmentId: process.env.OCI_COMPARTMENT_ID,
    region: region.id,
  });

  for (const modelInfo of testModels) {
    const { id: modelId, family } = modelInfo;
    process.stdout.write(`  ${family.padEnd(8)} | ${modelId.padEnd(35)} ... `);

    try {
      const model = provider.languageModel(modelId);
      const result = await model.doGenerate({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }],
      });
      const text = result.content[0].text.substring(0, 20).replace(/\n/g, ' ');
      console.log(`✅ ${text}`);
      results[region.id].working.push({ id: modelId, family });
    } catch (error) {
      const errorMsg = error.message.substring(0, 60);
      console.log(`❌ ${errorMsg}`);
      results[region.id].failing.push({ id: modelId, family, error: errorMsg });
    }
  }
}

// Summary
console.log(`\n${'='.repeat(80)}`);
console.log('📊 REGIONAL AVAILABILITY SUMMARY');
console.log('='.repeat(80));

for (const region of regions) {
  const regionResults = results[region.id];
  console.log(`\n${region.name} (${region.id}):`);
  console.log(`  ✅ Working: ${regionResults.working.length}`);

  if (regionResults.working.length > 0) {
    regionResults.working.forEach(m => {
      console.log(`     - ${m.family}: ${m.id}`);
    });
  }

  console.log(`  ❌ Failing: ${regionResults.failing.length}`);
}

// Model availability matrix
console.log(`\n${'='.repeat(80)}`);
console.log('🗺️  MODEL AVAILABILITY MATRIX');
console.log('='.repeat(80));

const modelsByFamily = {};
testModels.forEach(m => {
  if (!modelsByFamily[m.family]) modelsByFamily[m.family] = [];
  modelsByFamily[m.family].push(m.id);
});

for (const [family, models] of Object.entries(modelsByFamily)) {
  console.log(`\n${family.toUpperCase()}:`);
  for (const modelId of models) {
    const availability = regions.map(r => {
      const working = results[r.id].working.find(m => m.id === modelId);
      return working ? '✅' : '❌';
    }).join(' ');

    const shortId = modelId.replace(/^[^.]+\./, '');
    console.log(`  ${shortId.padEnd(30)} | ${availability} | ${regions.map(r => r.name.substring(0,3)).join(' ')}`);
  }
}
