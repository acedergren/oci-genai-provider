# Security Policy

## Reporting Vulnerabilities

**Do not open public issues for security vulnerabilities.**

To report a security issue:

1. **GitHub Security Advisory** (preferred): Use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)

2. **Email**: Contact the maintainers directly (see repository for contact information)

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Initial acknowledgment | Within 48 hours |
| Status update | Within 7 days |
| Fix and disclosure | Typically within 30 days (varies by severity) |

## Security Practices

### For Users

**Protect your credentials:**

```bash
# Store OCI API keys securely
chmod 600 ~/.oci/oci_api_key.pem
chmod 600 ~/.oci/config
chmod 700 ~/.oci

# Use .env.local for secrets (git-ignored)
# Never: .env (may be committed)
```

**Never commit secrets:**
- API keys
- Private key files (`.pem`)
- Compartment IDs with sensitive data
- Access tokens

**Rotate credentials regularly:**
- OCI API keys should be rotated every 90 days
- Revoke unused keys immediately
- Use separate keys for development and production

### For Deployments

**Development:**
```typescript
// Use config file authentication
const oci = createOCI({ profile: 'DEFAULT' });
```

**Production (OCI Compute):**
```typescript
// Use instance principal - no credentials in code
const oci = createOCI({ auth: 'instance_principal' });
```

**Production (OCI Functions):**
```typescript
// Use resource principal - automatic credential management
const oci = createOCI({ auth: 'resource_principal' });
```

## Security Features

This package implements several security measures:

**No credentials in code** — All authentication uses OCI config files or instance/resource principals

**HTTPS only** — All API calls use TLS 1.2+

**Input validation** — Regions and model IDs are validated against known values

**Secure defaults** — Safe configuration out of the box

**No credential logging** — API keys and tokens are never logged

## Dependency Security

We maintain dependency security through:

- **Automated scanning**: npm audit in CI
- **Pre-commit hooks**: gitleaks for secret detection
- **Static analysis**: Semgrep for security patterns
- **Regular updates**: Dependencies updated monthly

Run security checks locally:

```bash
npm audit
```

## Scope

This security policy covers:
- `@acedergren/oci-genai-provider`
- `@acedergren/oci-openai-compatible`
- `@acedergren/opencode-oci-genai`

For OCI service vulnerabilities, contact [Oracle Security](https://www.oracle.com/corporate/security-practices/assurance/vulnerability/reporting.html).

## Questions

For security-related questions that aren't vulnerabilities:
- Check [DEVELOPMENT.md](./DEVELOPMENT.md) for secure setup
- Open a [discussion](https://github.com/acedergren/opencode-oci-genai/discussions) (do not disclose potential vulnerabilities)

---

**Last Updated**: January 2026
