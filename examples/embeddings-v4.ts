import { embedMany } from 'ai';
import { createOCI } from '@acedergren/oci-genai-provider';

const oci = createOCI({
  region: 'us-chicago-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});

const result = await embedMany({
  model: oci.embeddingModel('cohere.embed-v4.0', {
    inputType: 'SEARCH_DOCUMENT',
    dimensions: 1536,
    embeddingTypes: ['float'],
  }),
  values: ['OCI Generative AI', 'Cohere Embed 4', 'Multimodal embeddings on Oracle Cloud'],
});

console.log(result.embeddings.length);
