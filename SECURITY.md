# Security Policy

## Reporting Security Vulnerabilities

**Do not open public GitHub issues for security vulnerabilities.**

If you discover a security vulnerability in this project, please report it responsibly by:

1. **Email**: Send details to the project maintainers (you can find contact info in the README or CONTRIBUTING.md)
2. **GitHub Security Advisory**: Use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)

Please include:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if you have one)

## Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix & disclosure**: Depends on severity, typically within 30 days

## Security Best Practices for Users

### API Key Security

**Never commit API keys or credentials to version control:**

```bash
# ❌ Bad
export OCI_API_KEY="ocid1.tenancy.oc1....." # In .env tracked by git

# ✅ Good
export OCI_API_KEY="ocid1.tenancy.oc1....." # In .env.local (git-ignored)
```

### Environment Variables

- Store `OCI_API_KEY` and `OCI_COMPARTMENT_ID` in `.env.local` or CI/CD secrets
- Never log or expose API keys in error messages
- Rotate API keys periodically
- Use minimal-privilege API keys when possible

### Authenticated Endpoints

- All OCI API calls use HTTPS with TLS 1.2+
- Custom endpoints must use HTTPS
- Never send credentials in URL parameters

### Dependency Management

- Keep dependencies updated: `pnpm update`
- Review security advisories: `npm audit`
- Run security checks before deploying
- Use `npm ci` (not `npm install`) in production

## Vulnerability Management

### Scanning

This project uses:
- **Semgrep**: Static analysis for security patterns
- **npm audit**: Dependency vulnerability scanning
- **Pre-commit hooks**: Secret detection (via `gitleaks`)

### Reporting Vulnerabilities to Maintainers

If you discover a vulnerability in a dependency:

1. Check if it's already reported to upstream maintainers
2. Report to this project if it affects our code
3. Include version information and impact assessment

## Security Features

### Secure Defaults

- **No API keys in code**: Configuration via environment variables
- **HTTPS only**: All endpoints require HTTPS
- **Bearer token auth**: Standard OAuth 2.0 pattern
- **Header validation**: OCI-specific headers prevent header injection

### Input Validation

- Configuration types validated at runtime
- Region names restricted to enum (no injection possible)
- Model IDs validated against known list
- Custom endpoints validated as HTTPS URLs

### Secrets Management

- Credentials never logged in debug output
- API keys excluded from source maps
- Environment variables used for all secrets
- `.env` and `*.pem` files git-ignored

## Compliance

- **MIT License**: Permissive open-source license
- **Code of Conduct**: Community guidelines enforced
- **Contribution Guidelines**: Standards for code quality and security

## Security Updates

Follow this repository for:
- **Security patches**: Emergency updates for vulnerabilities
- **Dependency updates**: Regular maintenance
- **Best practice guides**: Security recommendations

## Questions?

If you have questions about security practices, please:

1. Check the [DEVELOPMENT.md](./DEVELOPMENT.md) for setup guidance
2. Review [CONTRIBUTING.md](./CONTRIBUTING.md) for code standards
3. Open a discussion in GitHub Discussions (not as a security report)

---

**Last Updated**: January 2025

**Maintainers**: Anders Cedergren (@acedergren)
