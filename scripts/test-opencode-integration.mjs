import createOpenCodeOCIProvider from '../packages/opencode-integration/dist/index.mjs';
import { generateText } from 'ai';

async function main() {
  console.log('Testing OpenCode OCI GenAI Integration...');

  const compartmentId = process.env.OCI_COMPARTMENT_ID;
  const configProfile = process.env.OCI_CONFIG_PROFILE;

  if (!compartmentId) {
    console.error('Error: OCI_COMPARTMENT_ID not set');
    process.exit(1);
  }

  console.log(`Compartment: ${compartmentId}`);
  console.log(`Profile: ${configProfile || 'DEFAULT'}`);

  try {
    // Initialize provider using the factory function expected by OpenCode
    const provider = createOpenCodeOCIProvider({
      compartmentId,
      configProfile,
    });

    // Test with a simple model
    const modelId = 'meta.llama-3.3-70b-instruct'; // Or cohere.command-r-plus
    console.log(`Creating model: ${modelId}`);
    
    const model = provider.languageModel(modelId);

    console.log('Generating text...');
    const result = await generateText({
      model,
      prompt: 'What is 2 + 2? Answer in one word.',
    });

    console.log(`Response: "${result.text}"`);

    if (result.text.includes('4') || result.text.toLowerCase().includes('four')) {
      console.log('SUCCESS: Integration works!');
    } else {
      console.error('FAILURE: Unexpected response');
      process.exit(1);
    }

  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

main();
