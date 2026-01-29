import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import common from 'oci-common';

// Create a basic auth provider
const provider = new common.ConfigFileAuthenticationDetailsProvider();

const client = new GenerativeAiInferenceClient({
  authenticationDetailsProvider: provider,
});

client.region = common.Region.fromRegionId('eu-frankfurt-1');

console.log('🔍 Checking OCI SDK methods for listing models...\n');

// Check what methods are available on the client
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
  .filter(name => !name.startsWith('_') && typeof client[name] === 'function')
  .sort();

console.log('Available methods:');
methods.forEach(method => console.log(`  - ${method}`));

// Check if there's a list models method
const listMethods = methods.filter(m => m.toLowerCase().includes('list') || m.toLowerCase().includes('model'));
console.log('\nModel-related methods:');
listMethods.forEach(method => console.log(`  - ${method}`));
