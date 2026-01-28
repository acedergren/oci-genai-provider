# OCI Configuration

Environment variables, regions, and OCI CLI setup for the project.

## Environment Variables

All environment variables should be set in `.env` (not committed to git):

| Variable | Value | Purpose |
|----------|-------|---------|
| `OCI_REGION` | `eu-frankfurt-1` | Default region for OCI services |
| `OCI_COMPARTMENT_ID` | `ocid1.compartment.oc1...` | Default compartment for resources |
| `OCI_CONFIG_PROFILE` | `FRANKFURT` | OCI CLI profile to use |
| `OCI_CONFIG_FILE` | `/Users/acedergr/.oci/config` | Path to OCI configuration file |
| `OCI_CLI_AUTH` | `api_key` | Authentication method |

## OCI CLI Profiles

Three regional profiles are available:

### FRANKFURT (Primary)
- **Region**: `eu-frankfurt-1`
- **Usage**: Default profile for development
- **Config Profile Name**: `FRANKFURT` or `DEFAULT`

### STOCKHOLM (Secondary)
- **Region**: `eu-stockholm-1`
- **Usage**: European secondary region
- **Config Profile Name**: `STOCKHOLM`

### ASHBURN (US)
- **Region**: `us-ashburn-1`
- **Usage**: North American region
- **Config Profile Name**: `ASHBURN`

## Setting Active Profile

### via Environment Variable
```bash
export OCI_CONFIG_PROFILE=FRANKFURT
```

### via OCI CLI Command
```bash
# Verify current profile
oci configure list

# List all profiles
oci configure list --all
```

## Resource Discovery

### List Available Compartments
```bash
oci iam compartment list --all
```

### List Available Regions
```bash
oci iam region-subscription list
```

### Search for Resources
```bash
oci search resource structured-search --query-text "query all resources"
```

### Find a Specific Compartment
```bash
oci iam compartment list --compartment-id <tenancy-ocid> --query "data[] | [?name=='compartment-name']"
```

## Regional Availability

The following OCI GenAI models are available in `eu-frankfurt-1`:

**Cohere Models**:
- `cohere.command-r-plus`
- `cohere.command-r`
- `cohere.embed-multilingual-v3.0`
- `cohere.embed-english-v3.0`
- `cohere.embed-english-light-v3.0`
- `cohere.rerank-v3.5`

**Meta Models**:
- `meta.llama-3.1-70b-instruct`
- `meta.llama-3.1-405b-instruct`

**OCI Speech Models**:
- `oci.speech.standard` (21 languages, custom vocabulary support)
- `oci.speech.whisper` (99+ languages, auto-detection)

## OCI Configuration File

### Location
`~/.oci/config`

### Example Structure
```ini
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaaexampleuserocid1234567890abcd
fingerprint=aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..aaaaaaaaexampletenancyocid123456
region=eu-frankfurt-1

[FRANKFURT]
user=ocid1.user.oc1..aaaaaaaaexampleuserocid1234567890abcd
fingerprint=aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..aaaaaaaaexampletenancyocid123456
region=eu-frankfurt-1

[STOCKHOLM]
user=ocid1.user.oc1..aaaaaaaaexampleuserocid1234567890abcd
fingerprint=aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..aaaaaaaaexampletenancyocid123456
region=eu-stockholm-1

[ASHBURN]
user=ocid1.user.oc1..aaaaaaaaexampleuserocid1234567890abcd
fingerprint=aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..aaaaaaaaexampletenancyocid123456
region=us-ashburn-1
```

## Related Files

- [Credentials & Secrets](./credentials.md) — API keys and credential locations
- [CI/CD & Deployment](./ci-cd.md) — Using OCI configuration in workflows
- [Security Practices](./security.md) — Best practices for OCI authentication
