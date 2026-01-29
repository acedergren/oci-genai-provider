import common from 'oci-common';

console.log('🔍 Checking OCI GenerativeAI SDK packages...\n');

// Try importing GenerativeAI client (for model management)
try {
  const genai = await import('oci-generativeai');
  console.log('✅ Found oci-generativeai package\n');
  
  const provider = new common.ConfigFileAuthenticationDetailsProvider();
  const client = new genai.GenerativeAiClient({
    authenticationDetailsProvider: provider,
  });
  
  client.region = common.Region.fromRegionId('eu-frankfurt-1');
  
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
    .filter(name => !name.startsWith('_') && typeof client[name] === 'function')
    .sort();
  
  console.log(`Found ${methods.length} methods on GenerativeAiClient:\n`);
  methods.forEach(method => console.log(`  - ${method}`));
  
  const listMethods = methods.filter(m => m.toLowerCase().includes('list') || m.toLowerCase().includes('model'));
  console.log(`\n📋 Model-related methods (${listMethods.length}):`);
  listMethods.forEach(method => console.log(`  - ${method}`));
  
} catch (error) {
  console.log('❌ oci-generativeai package not found');
  console.log(`   Error: ${error.message}\n`);
  console.log('💡 The OCI SDK likely doesn\'t provide a dynamic model list API.');
  console.log('   Models are typically discovered through documentation or API testing.');
}
