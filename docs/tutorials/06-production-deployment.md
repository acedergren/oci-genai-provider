# Tutorial: Production Deployment

Deploy OCI GenAI provider to production with best practices.

## Step 1: Environment Configuration

\`\`\`bash

# Production environment variables

export OCI_REGION=eu-frankfurt-1
export OCI_CONFIG_PROFILE=PRODUCTION
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1...
\`\`\`

## Step 2: Use Dedicated Clusters

\`\`\`typescript
const oci = createOCI({
region: 'eu-frankfurt-1',
auth: 'instance_principal', // For OCI Compute
servingMode: 'DEDICATED',
endpointId: process.env.OCI_ENDPOINT_ID
});
\`\`\`

## Step 3: Error Handling

\`\`\`typescript
async function robustGenerate(prompt: string) {
let retries = 3;
while (retries > 0) {
try {
return await generateText({
model: oci('meta.llama-3.3-70b-instruct'),
prompt
});
} catch (error: any) {
if (error.statusCode === 429) {
await sleep(2 \*_ (3 - retries) _ 1000);
retries--;
} else {
throw error;
}
}
}
}
\`\`\`

## Step 4: Monitoring

\`\`\`typescript
import { Logger } from 'winston';

const logger = new Logger();

const { text, usage } = await generateText({
model: oci('cohere.command-r-plus'),
prompt
});

logger.info('Generation complete', {
tokens: usage.totalTokens,
duration: performance.now()
});
\`\`\`

## Production Checklist

- [ ] Use dedicated AI clusters
- [ ] Implement retry logic
- [ ] Set up monitoring/logging
- [ ] Use instance/resource principals
- [ ] Configure rate limiting
- [ ] Set appropriate timeouts
- [ ] Enable audit logging
- [ ] Document runbooks

## Next Steps

- [Deployment Guide](../guides/deployment/)
- [Monitoring Guide](../guides/monitoring/)
