import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: 'eu-frankfurt-1',
});

const result = await streamText({
  model: provider.languageModel('meta.llama-3.3-70b-instruct'),
  messages: [{ role: 'user', content: 'Hi' }],
});

console.log('StreamText result methods:');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(result)).sort());
console.log('\nStreamText result own properties:');
console.log(Object.keys(result).sort());
