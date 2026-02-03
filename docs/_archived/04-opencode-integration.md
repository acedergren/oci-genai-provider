# Tutorial: OpenCode Integration

Integrate OCI GenAI with OpenCode for development workflows.

## Step 1: Install Provider

\`\`\`bash
npm install -g @acedergren/oci-genai-provider
\`\`\`

## Step 2: Configure OpenCode

Create `~/.opencode/config.json`:

\`\`\`json
{
"providers": {
"oci-genai": {
"type": "custom",
"package": "@acedergren/oci-genai-provider",
"region": "eu-frankfurt-1"
}
},
"models": {
"oci-llama": {
"provider": "oci-genai",
"model": "meta.llama-3.3-70b-instruct"
}
}
}
\`\`\`

## Step 3: Use OpenCode

\`\`\`bash
opencode --model oci-llama

> Write a TypeScript function
> \`\`\`

## Next Steps

- [Tutorial 5: GitHub Bot](05-github-bot.md)
- [OpenCode Integration Guide](../guides/opencode-integration/)
