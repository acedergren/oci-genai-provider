# CI/CD Integration Use Case

Integrating OCI GenAI into CI/CD pipelines for automated code review, testing, and documentation.

## Overview

Automate development workflows using OCI GenAI in GitHub Actions, GitLab CI, and other CI/CD platforms.

**Best Models for CI/CD:**
- **xai.grok-4-maverick** - Code review and analysis
- **meta.llama-3.3-70b-instruct** - Cost-effective automation
- **cohere.command-r-plus** - Documentation generation

## Use Cases

### 1. Automated Code Review
### 2. Test Generation
### 3. Documentation Updates
### 4. Commit Message Generation
### 5. PR Summarization
### 6. Security Scanning

## Example: GitHub Actions Code Review

\`\`\`yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup OCI Config
        run: |
          mkdir -p ~/.oci
          echo "\${{ secrets.OCI_CONFIG }}" > ~/.oci/config
          echo "\${{ secrets.OCI_API_KEY }}" > ~/.oci/oci_api_key.pem
          chmod 600 ~/.oci/oci_api_key.pem

      - name: Install Dependencies
        run: npm install @acedergren/oci-genai-provider ai

      - name: Run AI Review
        run: node review.js
        env:
          OCI_COMPARTMENT_ID: \${{ secrets.OCI_COMPARTMENT_ID }}
          OCI_REGION: eu-frankfurt-1
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

## Example: Review Script

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';
import { execFileSync } from 'child_process';

const oci = createOCI({ region: 'eu-frankfurt-1' });

async function reviewPR() {
  // Get diff
  const diff = execFileSync('git', ['diff', 'origin/main...HEAD'], 
    { encoding: 'utf-8' }
  );

  const { text } = await generateText({
    model: oci('xai.grok-4-maverick'),
    prompt: \`Review this code change and provide:
1. Potential bugs or issues
2. Security concerns
3. Performance considerations
4. Code quality improvements

Diff:
\${diff}\`,
  });

  console.log('## AI Code Review\n');
  console.log(text);
}

reviewPR();
\`\`\`

## Best Practices

### Authentication
- Use GitHub Secrets for OCI credentials
- Never commit credentials to repository
- Use instance principals on OCI Compute runners
- Rotate secrets regularly

### Rate Limiting
- Implement retry logic
- Use caching for repeated analysis
- Consider dedicated clusters for high-frequency CI/CD

### Security
- Scan for secrets before sending to AI
- Validate AI outputs before taking action
- Log all AI interactions for audit
- Use private repositories for sensitive code

### Webhook Integration
- Process events asynchronously
- Implement queue for high-volume repos
- Set appropriate timeouts
- Handle partial failures gracefully

**Sources:** Project Archive Requirements (Section 8.3), GitHub Actions Documentation
**Last Updated:** 2026-01-26
