# Credentials & Secrets

All sensitive credentials and their locations for the OpenCode OCI GenAI project.

## Storage Locations

All sensitive environment variables must be stored in `.env` (git-ignored):

```bash
# Example .env file
GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxx
OCI_DEVOPS_USERNAME=username
OCI_DEVOPS_TOKEN=token
OCI_COMPARTMENT_ID=ocid1.compartment.oc1...
OCI_CONFIG_PROFILE=FRANKFURT
OCI_CONFIG_FILE=/Users/acedergr/.oci/config
OCI_REGION=eu-frankfurt-1
```

## GitHub Authentication

### GitHub Personal Access Token (PAT)

**Location**: `.env` file (variable: `GITHUB_PAT`)

**Scopes**:
- `gist` — Gist access
- `read:org` — Read organization data
- `repo` — Full repository access
- `workflow` — GitHub Actions workflow access

**Usage**:
- Publishing to GitHub npm registry (`@acedergren` scope)
- GitHub API access for CI/CD operations

**User**: `acedergren`

## OCI Authentication

### OCI API Key

**Location**: `~/.oci/oci_api_key.pem`

**Fingerprint**: `94:99:26:62:b4:e1:05:dd:39:fb:94:00:63:e6:2c:dc`

**Configuration**: Registered in OCI Config file at `~/.oci/config`

**Auth Method**: API key (OCI_CLI_AUTH: api_key)

### OCI DevOps Credentials

**Usage**: OCI DevOps Git repository access

**Storage**:
- Username: `.env` → `OCI_DEVOPS_USERNAME`
- Token: `.env` → `OCI_DEVOPS_TOKEN`

### OCI Compartment ID

**Location**: `.env` → `OCI_COMPARTMENT_ID`

**Value**: `ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq`

**Purpose**: Default compartment for OCI resource access

## OCI Vault Secrets

**Vault Name**: `AC-Vault`

**Purpose**: Store sensitive credentials that should NOT be in `.env`:
- API keys for third-party services
- Database passwords
- Service tokens
- Production secrets

**Access**: OCI SDK automatically retrieves from vault using API key authentication

## Tenancy Information

**Tenancy OCID**: `ocid1.tenancy.oc1..aaaaaaaasb6hzdlysstqiacelk35wlgpjuottvsfkm6k7aa4ujrylb4shmra`

**User OCID**: `ocid1.user.oc1..aaaaaaaaow3f3fklz7nv7h4z7y7qvxenjrmo4qbe5z5ne7s2id4yhlyhsnpq`

**Compartment OCID**: `ocid1.compartment.oc1..aaaaaaaarekfofhmfup6d33agbnicuop2waas3ssdwdc7qjgencirdgvl3iq`

## Related Files

- [OCI Configuration](.oci-setup.md) — Environment variables and regional setup
- [Security Practices](./security.md) — Best practices for handling credentials
