# Deploying to Cloudflare Pages

## Prerequisites

- Cloudflare account
- Wrangler CLI installed: `npm i -g wrangler`
- OCI credentials configured

## Quick Deploy

### 1. Login to Cloudflare

```bash
wrangler login
```

### 2. Build the project

```bash
cd examples/chatbot-demo
pnpm build
```

### 3. Deploy to Cloudflare Pages

```bash
wrangler pages deploy .svelte-kit/cloudflare
```

### 4. Set Environment Variables

In Cloudflare Dashboard → Pages → Your Project → Settings → Environment variables:

| Variable             | Description                         | Required |
| -------------------- | ----------------------------------- | -------- |
| `OCI_COMPARTMENT_ID` | Your OCI compartment OCID           | Yes      |
| `OCI_REGION`         | OCI region (e.g., `eu-frankfurt-1`) | Yes      |

**For production**, set these as encrypted secrets:

```bash
# Set secrets via CLI
wrangler pages secret put OCI_COMPARTMENT_ID
wrangler pages secret put OCI_CONFIG_CONTENT
wrangler pages secret put OCI_KEY_CONTENT
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy-demo.yml`:

```yaml
name: Deploy Demo to Cloudflare

on:
  push:
    branches: [main]
    paths:
      - 'examples/chatbot-demo/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build demo
        run: pnpm --filter chatbot-demo build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: oci-genai-chatbot
          directory: examples/chatbot-demo/.svelte-kit/cloudflare
```

## Local Development

```bash
# Run with Cloudflare-like environment
pnpm dev

# Preview production build locally
pnpm build && wrangler pages dev .svelte-kit/cloudflare
```

## Troubleshooting

### "nodejs_compat" errors

Ensure `wrangler.toml` has:

```toml
compatibility_flags = ["nodejs_compat"]
```

### OCI SDK compatibility

The OCI SDK requires Node.js APIs. Cloudflare Workers with `nodejs_compat` flag should work, but if issues persist, consider:

- Using OCI REST API directly instead of SDK
- Deploying API routes to a separate Node.js backend

### Environment variables not found

- Check variables are set in Cloudflare Dashboard
- For secrets, use `wrangler pages secret put`
- Verify variable names match exactly (case-sensitive)
