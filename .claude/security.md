# Security Practices

Security best practices for handling credentials, secrets, and access control.

## Credential Management

### Never Commit Secrets

⚠️ **Golden Rule**: Never commit the following to git:

- `.env` files
- `*.pem` files (API keys)
- `private.key` files
- Configuration files with credentials
- API tokens or passwords
- Database connection strings

### Verify `.gitignore`

Ensure these patterns are in `.gitignore`:

```
# Environment variables
.env
.env.local
.env.*.local

# OCI API keys
*.pem

# IDE/Editor secrets
.vscode/settings.json
.idea/

# OS-specific
.DS_Store
Thumbs.db

# Dependency caches
node_modules/
```

### Use Environment Variables

Always use environment variables for runtime configuration:

```bash
# ✅ Correct - Use environment variable
const apiKey = process.env.OCI_API_KEY

# ❌ Wrong - Hardcoded secret
const apiKey = 'ocid1.tenancy.oc1...'
```

## Token Management

### GitHub Personal Access Token (PAT)

**Scope Minimization**:
- Only grant necessary scopes: `gist`, `read:org`, `repo`, `workflow`
- Do NOT grant `admin`, `delete_repo`, or `write:org_hooks`

**Rotation**:
- Rotate PAT every 6 months
- After rotation, update in `.env` and GitHub Secrets

**Location**:
- Development: `.env` file (git-ignored)
- CI/CD: GitHub Secrets (never in workflow files)

### OCI API Key

**Fingerprint**: Keep fingerprint in `~/.oci/config` for reference

**File Permissions**:
```bash
# Ensure private key is readable only by owner
chmod 600 ~/.oci/oci_api_key.pem
```

**Rotation**:
- Rotate annually
- Generate new key in OCI Console
- Update fingerprint and config file

**Backup**:
- Keep offline backup (encrypted)
- Do NOT backup to cloud services without encryption

## OCI Vault for Production

### When to Use OCI Vault

Store in OCI Vault instead of `.env`:
- API keys for third-party services
- Database passwords
- Production secrets
- Credentials for long-lived services

### Accessing Vault Secrets

OCI SDK automatically retrieves from Vault using API key authentication:

```typescript
// SDK handles vault retrieval automatically
const secret = await getSecret('my-secret-name')
```

### Vault Best Practices

- Use descriptive secret names
- Enable audit logging
- Set expiration on rotating credentials
- Restrict access using OCI IAM policies

## Access Control

### Principle of Least Privilege

Grant only minimum required permissions:

- **GitHub**: Limit PAT scopes
- **OCI**: Use compartment-level permissions
- **Services**: Use service accounts with specific roles

### OCI IAM Policies

Example policy for GenAI access:

```
Allow group genai-users to use generative-ai-inference in compartment id <compartment-ocid>
```

### GitHub Repository Access

- Keep repository private during development
- Add collaborators with minimal required access
- Use GitHub Teams for group permissions
- Require PR reviews before merge

## CI/CD Security

### Secrets in Workflows

✅ **Correct**:
```yaml
- name: Build
  env:
    OCI_COMPARTMENT_ID: ${{ secrets.OCI_COMPARTMENT_ID }}
```

❌ **Wrong**:
```yaml
- name: Build
  run: echo "OCI_COMPARTMENT_ID=ocid1.compartment..." # Exposes in logs
```

### Workflow Permissions

- Grant minimal required permissions
- Use `permissions:` block to restrict access
- Disable write access for pull requests from forks

Example:
```yaml
permissions:
  contents: read
  id-token: write
```

## Dependency Security

### Regular Updates

- Update dependencies monthly
- Use `pnpm audit` to check for vulnerabilities
- Review security advisories before updating

### Supply Chain Security

- Use npm registry authentication (GitHub Packages)
- Verify package integrity
- Lock dependency versions in `pnpm-lock.yaml`
- Review new dependencies before adding

## Development Machine Security

### API Key Protection

- Store API keys only in `~/.oci/config` (not in project)
- Set appropriate file permissions: `chmod 600`
- Never copy private key to other machines unless necessary
- Use SSH agent or hardware tokens for key management

### Local `.env` File

- Keep `.env` in project root (git-ignored)
- Never share `.env` via email or chat
- Use 1Password, LastPass, or similar for team secret sharing
- Rotate tokens if `.env` is accidentally shared

### Editor/IDE Configuration

- Use `.env` loading only for local development
- Don't store credentials in editor settings
- Use IDE's built-in secret management (VS Code Settings Sync with encryption)

## Incident Response

### If a Token is Exposed

1. **Immediately revoke** the token in its service (GitHub, OCI, etc.)
2. **Generate a new token** with same scopes
3. **Update** `.env` and GitHub Secrets
4. **Check logs** for unauthorized access
5. **Document** in private incident log (not git)

### If `.env` File is Committed

1. **Do NOT delete** the commit locally (use `git revert` instead)
2. **Rotate all tokens** in that `.env`
3. **Update** `.env` file and `.gitignore`
4. **Force push** (if private repo) or use `git filter-branch` (advanced)
5. **Alert team** immediately

## Security Scanning

### Pre-Commit Checks

Semgrep runs automatically before commits:
- Detects hardcoded credentials
- Finds common security vulnerabilities
- Checks for OWASP top 10 issues

### GitHub Secret Scanning

GitHub automatically scans:
- Pushed credentials
- API keys
- Private keys

Alerts appear in Security tab if secrets are detected.

## Compliance Checklist

Before deploying to production:

- [ ] All secrets stored in OCI Vault or GitHub Secrets
- [ ] No `.env` files or `*.pem` files in git history
- [ ] API keys rotated within last 6 months
- [ ] Least privilege access configured (IAM)
- [ ] Audit logging enabled (OCI)
- [ ] Pre-commit hooks passing (no secrets in code)
- [ ] GitHub Secrets configured for CI/CD
- [ ] Team members trained on credential handling
- [ ] Incident response plan documented

## Related Files

- [Credentials & Secrets](./credentials.md) — Credential locations and usage
- [CI/CD & Deployment](./ci-cd.md) — Handling credentials in workflows
- [OCI Configuration](./oci-setup.md) — OCI authentication setup
