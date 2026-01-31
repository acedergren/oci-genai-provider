# Tutorial: GitHub Bot

Build an AI-powered GitHub bot for code review.

## Step 1: GitHub Action Workflow

Create `.github/workflows/ai-review.yml`:

\`\`\`yaml
name: AI Code Review
on: [pull_request]

jobs:
review:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v3

      - name: Setup OCI
        run: |
          mkdir -p ~/.oci
          echo "\${{ secrets.OCI_CONFIG }}" > ~/.oci/config

      - name: Review Code
        run: |
          npm install @acedergren/oci-genai-provider ai
          node review.js
        env:
          OCI_REGION: eu-frankfurt-1

\`\`\`

## Step 2: Review Script

Create `review.js`:

\`\`\`javascript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';
import { execFileSync } from 'child_process';

const oci = createOCI({ region: 'eu-frankfurt-1' });

const diff = execFileSync('git', ['diff', 'HEAD~1'],
{ encoding: 'utf-8' }
);

const { text } = await generateText({
model: oci('xai.grok-4'),
prompt: \`Review this code:\n\${diff}\`
});

console.log(text);
\`\`\`

## Next Steps

- [Tutorial 6: Production Deployment](06-production-deployment.md)
- [CI/CD Integration](../use-cases/cicd-integration/)
