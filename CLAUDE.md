# OpenCode OCI GenAI Project

This document provides Claude Code with essential project context, credentials locations, and configuration details.

## Project Overview

OpenCode OCI GenAI integration project for enabling OCI Generative AI capabilities within OpenCode.

## Credentials & Secrets

### GitHub Authentication

**GitHub Personal Access Token (PAT)**

- Location: `.env` file (variable: `GITHUB_PAT`)
- Current value stored in: `/Users/acedergr/Projects/oci-genai-provider/.env`
- Scopes: `gist`, `read:org`, `repo`, `workflow`
- GitHub user: `acedergren`
- Used for: GitHub npm registry publishing, GitHub API access

### OCI DevOps Credentials

**DevOps Git Credentials**

- Username: Stored in `.env` as `OCI_DEVOPS_USERNAME`
- Token: Stored in `.env` as `OCI_DEVOPS_TOKEN`
- Used for: OCI DevOps Git repository access

### OCI Vault Secrets

**Vault Location**: `AC-Vault` (to be documented)

- Store sensitive credentials that should not be in `.env`
- Examples: API keys, database passwords, third-party service tokens

## OCI Configuration

### Tenancy Information

**Tenancy OCID**

```
ocid1.tenancy.oc1..aaaaaaaasb6hzdlysstqiacelk35wlgpjuottvsfkm6k7aa4ujrylb4shmra
```

**User OCID**

```
ocid1.user.oc1..aaaaaaaaow3f3fklz7nv7h4z7y7qvxenjrmo4qbe5z5ne7s2id4yhlyhsnpq
```

**Compartment OCID**

```
ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq
```

### Regions

**Available OCI CLI Profiles**:

- `DEFAULT` / `FRANKFURT` - Primary region: `eu-frankfurt-1`
- `STOCKHOLM` - Secondary region: `eu-stockholm-1`
- `ASHBURN` - US region: `us-ashburn-1`

**Current Active Profile**: `FRANKFURT` (eu-frankfurt-1)

**Environment Variables**:

- `OCI_REGION`: `eu-frankfurt-1`
- `OCI_COMPARTMENT_ID`: See compartment OCID above
- `OCI_CONFIG_PROFILE`: `FRANKFURT`
- `OCI_CONFIG_FILE`: `/Users/acedergr/.oci/config`
- `OCI_CLI_AUTH`: `api_key`

### OCI API Key

**Location**: `/Users/acedergr/.oci/oci_api_key.pem`
**Fingerprint**: `94:99:26:62:b4:e1:05:dd:39:fb:94:00:63:e6:2c:dc`

## Development Environment

### Environment Variables

All sensitive environment variables are stored in `.env` file (git-ignored):

- `GITHUB_PAT` - GitHub Personal Access Token
- `OCI_DEVOPS_USERNAME` - OCI DevOps Git username
- `OCI_DEVOPS_TOKEN` - OCI DevOps Git token
- `OCI_COMPARTMENT_ID` - Default OCI compartment
- `OCI_CONFIG_PROFILE` - Active OCI CLI profile
- `OCI_CONFIG_FILE` - Path to OCI config file

### Package Registry

**GitHub Packages (npm)**

- Registry: `https://npm.pkg.github.com/@acedergren`
- Authentication: Uses `GITHUB_PAT` from environment
- Publish scope: `@acedergren`

## Git Configuration

**Local Repository**: Initialized (no remote configured yet)
**Git Ignore**: Ensure `.env`, `*.pem`, and other secrets are excluded

## Pre-Commit Hooks

Pre-commit hooks are configured to run:

1. **Linting** - Code style validation
2. **Type Checking** - TypeScript validation
3. **Format Checking** - Prettier/formatting validation
4. **Security Scanning** - Check for exposed secrets
5. **Tests** - Run unit tests before commit

## CI/CD Pipeline

**GitHub Actions Workflows**:

- **Build & Test**: Run on all pushes and PRs
- **Publish**: Publish to GitHub npm registry on version tags
- **Runners**: GitHub-hosted runners (ubuntu-latest)

### Deployment Strategy

1. **Development**: Push to feature branches
2. **Testing**: PR to main triggers full test suite
3. **Publishing**: Create version tag to trigger npm publish

## OCI Resources Discovery

Use OCI CLI to discover additional OCIDs:

```bash
# List compartments
oci iam compartment list --all

# List available regions
oci iam region-subscription list

# List resources in compartment
oci search resource structured-search --query-text "query all resources"
```

## Additional Notes

### Security Best Practices

1. **Never commit** `.env` file or `*.pem` files
2. **Use OCI Vault** for production secrets
3. **Rotate credentials** regularly
4. **Limit token scopes** to minimum required permissions
5. **Use GitHub Secrets** for CI/CD credentials

### OCI GenAI Integration

- Service: OCI Generative AI
- API Endpoint: Regional (based on active profile)
- Authentication: OCI API key (from `~/.oci/config`)
- SDK: OCI SDK for Node.js/TypeScript

---

**Last Updated**: 2026-01-27
**Maintained By**: Claude Code
