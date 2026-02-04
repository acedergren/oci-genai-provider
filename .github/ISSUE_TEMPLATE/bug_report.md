---
name: Bug Report
about: Report a bug or issue
title: '[BUG] '
labels: bug
assignees: ''
---

## Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened instead.

## Environment

- **Node.js version**: [e.g., 20.0.0]
- **OS**: [e.g., macOS 14.0, Windows 11, Ubuntu 22.04]
- **Package version**: [e.g., 0.1.0]
- **Package**: [@acedergren/oci-openai-compatible, @acedergren/oci-genai-provider, etc.]

## Error Output

```
Paste any error messages or stack traces here
```

## Code Example

```typescript
// Include minimal code to reproduce the issue
const client = createOCIOpenAI({
  region: 'us-ashburn-1',
  apiKey: process.env.OCI_API_KEY,
});

// Code that triggers the bug
```

## Additional Context

- [ ] I've checked existing issues
- [ ] I can reproduce the issue consistently
- [ ] I've searched the documentation
- [ ] This is not a security issue (if security-related, see SECURITY.md)

Add any other context about the problem here. Screenshots, logs, or configuration details are helpful.
