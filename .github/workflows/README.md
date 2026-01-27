# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Overview

| Workflow        | Trigger                 | Purpose                 | Time     | Runner                  |
| --------------- | ----------------------- | ----------------------- | -------- | ----------------------- |
| **CI**          | PR, push to main        | Quality gates           | ~2-3 min | Self-hosted + container |
| **Deploy Demo** | Manual, path changes    | Cloudflare Pages deploy | ~2-3 min | Self-hosted             |
| **Publish**     | Version tags (`v*.*.*`) | GitHub Packages         | ~3-5 min | Self-hosted + container |

## Workflows

### CI (`ci.yml`)

Runs on every pull request and push to main branch. Provides fast feedback on code quality.

**Jobs:**

- **Lint & Type Check** (parallel) - Format validation, ESLint, TypeScript type checking
- **Test** (parallel) - Unit tests with coverage reporting to Codecov
- **Build** (sequential) - Package builds and validation (runs only if quality checks pass)

**Features:**

- Runs in Node.js 22 containers on self-hosted runners
- Parallel execution of lint and test jobs saves ~30-40% time
- Concurrency control: cancels in-progress runs when new commits are pushed
- Optional Codecov integration for coverage tracking
- Uses pnpm for fast, reliable dependency management

**Required Secrets:**

- `CODECOV_TOKEN` (optional) - For coverage reports to codecov.io

**Estimated time:** 2-3 minutes

**Branch Protection:**
Configure these required status checks in repository settings:

- `Lint & Type Check`
- `Test`
- `Build`

---

### Deploy Demo (`deploy-cf-pages.yml`)

Deploys the SvelteKit chatbot demo to Cloudflare Pages.

**Triggers:**

1. **Manual** (primary) - Via workflow_dispatch from GitHub Actions UI
2. **Automatic** - On push to main when files change in:
   - `examples/chatbot-demo/**`
   - `packages/oci-genai-provider/**`

**Features:**

- Runs on self-hosted runner (no containers, native execution)
- Workspace cleanup for safe self-hosted runner usage
- pnpm store caching for faster subsequent builds
- Builds provider package before demo (monorepo dependency)
- Uses Cloudflare wrangler-action for deployment
- Generates deployment summary with URL and documentation link

**Required GitHub Secrets:**

- `CLOUDFLARE_API_TOKEN` - From AC-Vault in OCI Vault
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID from dashboard

**Required Cloudflare Pages Environment Variables:**
Set in Cloudflare Pages dashboard (Settings → Environment variables):

- `OCI_COMPARTMENT_ID` - OCI compartment OCID
- `OCI_REGION` - OCI region (e.g., `eu-frankfurt-1`)
- `OCI_CONFIG_CONTENT` - Base64 encoded OCI config file
- `OCI_KEY_CONTENT` - Base64 encoded OCI API key

**Generate base64 secrets:**

```bash
# On macOS/Linux
base64 < ~/.oci/config | tr -d '\n' > oci_config_b64.txt
base64 < ~/.oci/oci_api_key.pem | tr -d '\n' > oci_key_b64.txt
```

**Security:**

- Demo is protected by Cloudflare Access (Zero Trust)
- Only authenticated users can access the demo
- Prevents unauthorized OCI GenAI usage and billing

**Estimated time:** 2-3 minutes

---

### Publish (`publish.yml`)

Publishes packages to GitHub Package Registry when version tags are pushed.

**Trigger:** Tags matching `v*.*.*` (e.g., `v0.1.0`, `v1.2.3`)

**Features:**

- Runs in Node.js 22 container on self-hosted runner
- Builds all packages
- Publishes to GitHub Packages npm registry
- Scoped to `@acedergren` organization
- Creates GitHub Release automatically

**Required Secrets:**

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `GITHUB_PAT` - Personal access token with `write:packages` scope

**Usage:**

```bash
# Update version in package.json files
pnpm version patch  # or minor, major

# Create and push tag
git tag v0.1.1
git push origin v0.1.1
```

**Registry:**

- URL: `https://npm.pkg.github.com/@acedergren`
- Authentication: Uses `GITHUB_PAT` from environment

**Estimated time:** 3-5 min

---

## Self-Hosted Runner Configuration

All workflows use self-hosted runners for zero GitHub Actions minutes cost.

**Runner Setup:**

- Two private runners available
- Node.js 22 installed natively
- Docker available for container jobs
- pnpm configured globally

**Container Jobs (CI, Publish):**

- Use `node:22-bookworm` image
- Run as root for git configuration
- Consistent environment across runs

**Native Jobs (Deploy Demo):**

- Run directly on runner
- Faster startup (no container overhead)
- Workspace cleanup for safety

---

## Cost Analysis

### GitHub Actions Minutes

- **All workflows use self-hosted runners** ✅
- **Zero GitHub Actions minutes consumed** ✅
- Runs on your infrastructure at no cost to GitHub quota

### Cloudflare Pages

- Free tier: Unlimited requests, 500 builds/month
- Expected usage: ~10-20 deployments/month ✅
- Well within free tier limits

### OCI Generative AI

- Usage-based billing (per token)
- Protected by Cloudflare Access
- Monitor via OCI Console → Cost Management

---

## Troubleshooting

### CI Workflow

**Problem:** Jobs timeout after 5 minutes

- **Solution:** Increase `timeout-minutes` in job configuration

**Problem:** pnpm install fails

- **Solution:** Delete `pnpm-lock.yaml` and run `pnpm install` locally to regenerate

**Problem:** Type check fails

- **Solution:** Run `pnpm type-check` locally to see full error output

### Deploy Demo Workflow

**Problem:** Cloudflare deployment fails with authentication error

- **Solution:** Verify `CLOUDFLARE_API_TOKEN` secret is set correctly
- Get new token from Cloudflare dashboard → API Tokens

**Problem:** Demo loads but can't connect to OCI GenAI

- **Solution:** Verify Cloudflare Pages environment variables are set:
  - `OCI_COMPARTMENT_ID`
  - `OCI_CONFIG_CONTENT` (base64 encoded)
  - `OCI_KEY_CONTENT` (base64 encoded)

**Problem:** Can't access demo (Cloudflare Access blocks)

- **Solution:** Configure Cloudflare Zero Trust Access policy
- See [Cloudflare Access Setup](../../examples/chatbot-demo/DEPLOYMENT.md#cloudflare-access-setup)

**Problem:** Workspace cleanup fails on self-hosted runner

- **Solution:** Runner needs sudo permissions for cleanup
- Alternatively, remove cleanup step (not recommended)

### Publish Workflow

**Problem:** GitHub Packages publish fails with 403

- **Solution:** Verify `GITHUB_PAT` has `write:packages` scope
- Regenerate token if needed: GitHub Settings → Developer settings → Personal access tokens

**Problem:** Package not found after publishing

- **Solution:** Check registry URL: `https://npm.pkg.github.com/@acedergren`
- Verify package name is scoped: `@acedergren/package-name`

---

## Security Considerations

### Secrets Management

- Never commit secrets to repository
- Use GitHub Secrets for sensitive tokens
- Use Cloudflare Pages encrypted environment variables for OCI credentials
- Rotate secrets regularly (quarterly recommended)

### Workflow Security

- All workflows use pinned action versions (`@v4`, not `@latest`)
- Container jobs run as root only when necessary
- No untrusted user input in workflow commands (injection-safe)
- Workspace cleanup prevents state leakage on self-hosted runners

### Demo Access Control

- Cloudflare Access required (Zero Trust authentication)
- Only authorized users can access demo
- Prevents unauthorized OCI billing
- Session timeout: 24 hours (configurable)

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)
- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/policies/access)
- [pnpm Documentation](https://pnpm.io)
- [Self-hosted Runners Guide](https://docs.github.com/en/actions/hosting-your-own-runners)
