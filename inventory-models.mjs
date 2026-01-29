import { createOCI } from './packages/oci-genai-provider/dist/index.mjs';
import { getAllModels } from './packages/oci-genai-provider/dist/index.mjs';

const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});

const allModels = getAllModels();
console.log(`\n📊 Testing ${allModels.length} models in registry...\n`);

const results = {
  working: [],
  failing: [],
};

for (const metadata of allModels) {
  const modelId = metadata.id;
  const family = metadata.family;
  process.stdout.write(`Testing ${family.padEnd(8)} | ${modelId.padEnd(45)} ... `);

  try {
    const model = provider.languageModel(modelId);
    const result = await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }],
    });
    const text = result.content[0].text.substring(0, 30).replace(/\n/g, ' ');
    console.log(`✅ ${text}`);
    results.working.push({ id: modelId, family, response: text });
  } catch (error) {
    console.log(`❌ ${error.message}`);
    results.failing.push({ id: modelId, family, error: error.message });
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n✅ Working models (${results.working.length}):`);
results.working.forEach(m => console.log(`  - ${m.family.padEnd(8)}: ${m.id}`));

console.log(`\n❌ Failing models (${results.failing.length}):`);
const errorGroups = {};
results.failing.forEach(m => {
  if (!errorGroups[m.error]) errorGroups[m.error] = [];
  errorGroups[m.error].push(m);
});

Object.entries(errorGroups).forEach(([error, models]) => {
  console.log(`\n  Error: "${error}"`);
  models.forEach(m => console.log(`    - ${m.family.padEnd(8)}: ${m.id}`));
});

console.log('\n' + '='.repeat(80));
console.log('\n📋 Summary by family:');
const byFamily = {};
[...results.working, ...results.failing].forEach(m => {
  if (!byFamily[m.family]) byFamily[m.family] = { working: 0, failing: 0 };
  if (results.working.includes(m)) byFamily[m.family].working++;
  else byFamily[m.family].failing++;
});

Object.entries(byFamily).forEach(([family, counts]) => {
  const status = counts.failing === 0 ? '✅' : counts.working === 0 ? '❌' : '⚠️';
  console.log(`  ${status} ${family.padEnd(8)}: ${counts.working} working, ${counts.failing} failing`);
});
