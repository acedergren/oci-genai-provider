# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing alex@running-days.com. Please do not create public GitHub issues for security vulnerabilities.

We will respond to security reports within 48 hours and will keep you informed throughout the resolution process.

## Security Scanning

This repository uses multiple security scanning tools to detect potential vulnerabilities:

- **GitGuardian**: Scans for exposed secrets in commits
- **GitLeaks**: Local secret scanning (configured via `.gitleaks.toml`)
- **Aikido Security**: Code-level security analysis
- **CodeRabbit**: Automated code review with security focus

## Test Fixtures and False Positives

### RSA Private Keys in Tests

Some test files contain **minimal RSA private keys** that are flagged by security scanners:

**Files:**
- `test/property/message-conversion.property.ts`
- `test/spec/ai-sdk-v3/language-model-v3.spec.ts`
- `test/session-store.test.ts`

**Security Review Decision:**
- ✅ **Approved as safe test fixtures** (reviewed 2026-01-26)
- These are 512-bit RSA keys (deliberately weak for fast test execution)
- Clearly marked with `// aikido-ignore-next-line: test-fixture` comments
- Used exclusively for mocking OCI authentication in unit tests
- **NOT connected to any real infrastructure or credentials**

**Rationale:**
1. Testing OCI SDK integration requires valid RSA key *format* (not real keys)
2. Generating keys at runtime would slow down test execution significantly
3. These keys have no security value (too weak for production use)
4. Clear code comments document their purpose

**Allowlist Configuration:**
See `.gitleaks.toml` for explicit allowlist rules that suppress false positive alerts while maintaining security scanning for real credentials.

## Environment Variables

The following environment variables may contain sensitive information and should **NEVER** be committed:

- `OCI_CONFIG_FILE` - Path to OCI configuration file
- `OCI_IDCS_DOMAIN` - IDCS OAuth domain
- `OCI_IDCS_CLIENT_ID` - IDCS OAuth client ID
- `OCI_IDCS_CLIENT_SECRET` - IDCS OAuth client secret
- `OCI_IDCS_TENANCY` - OCI tenancy OCID

**Protection:**
- `.env` files are in `.gitignore`
- OAuth session files have `0o600` permissions (owner read/write only)
- No environment variables are logged or exposed in test output

## Authentication Security

### OCI Authentication Cascade

The provider supports multiple authentication methods with automatic fallback:

1. **Config File** (`~/.oci/config`) - Recommended for local development
2. **Instance Principal** - For workloads running on OCI compute instances
3. **Resource Principal** - For OCI Functions and other managed services

**Security Best Practices:**
- Config files should have `0o600` permissions
- API keys should be rotated regularly (every 90 days recommended)
- Use Instance/Resource Principal for production workloads (no static keys)

### OAuth Sessions

OAuth session files are stored securely:
- Location: `~/.config/opencode/oci-genai-sessions/`
- Permissions: `0o600` (owner read/write only)
- Contains temporary access tokens (expire after configured TTL)
- Refresh tokens are encrypted at rest

## Dependency Security

- Dependabot enabled for automated dependency updates
- Security patches are applied promptly (within 48 hours for high/critical)
- Dependencies are audited regularly using `npm audit`

## Code Security

### Input Validation

- All OCI API responses validated with Zod schemas
- User input sanitized before passing to OCI SDK
- Path traversal protection on file operations

### Error Handling

- Sensitive information never exposed in error messages
- Stack traces sanitized in production
- Structured logging with configurable log levels

## Secure Coding Practices

When contributing, please follow these security guidelines:

1. **Never commit secrets** - Use environment variables or secure vaults
2. **Validate all inputs** - Use Zod schemas for runtime validation
3. **Sanitize file paths** - Prevent path traversal attacks
4. **Use type safety** - Avoid `any` types; use discriminated unions
5. **Handle errors gracefully** - Don't expose sensitive details
6. **Set secure file permissions** - Use `0o600` for sensitive files

## Security Updates

Security-related changes are documented in `CHANGELOG.md` with the `[SECURITY]` prefix.

## Contact

For security concerns, contact: alex@running-days.com

Last Updated: 2026-01-26
