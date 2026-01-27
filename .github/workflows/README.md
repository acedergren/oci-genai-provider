# GitHub Actions Workflows

## Publish to GitHub Packages

Automatically publishes packages to GitHub Package Registry when a version tag is pushed.

### How It Works

1. Trigger: Push a version tag (e.g., `v0.1.0`)
2. Workflow runs tests, builds packages, validates metadata
3. Publishes to GitHub Package Registry using `GITHUB_TOKEN`
4. Creates a GitHub Release with auto-generated notes

### Setup (Already Configured)

No additional setup needed! The workflow uses the built-in `GITHUB_TOKEN` which has `packages:write` permission.

### Triggering a Release

```bash
# Update version in package.json files (both packages)
# Then commit and tag:
git add .
git commit -m "chore: bump version to 0.1.0"
git tag v0.1.0
git push origin main --tags
```

### Installing Published Packages

Users need to configure npm/pnpm to use GitHub Package Registry for @acedergren scope:

```bash
# Create .npmrc in your project
echo "@acedergren:registry=https://npm.pkg.github.com" >> .npmrc

# Authenticate (one-time setup)
npm login --scope=@acedergren --registry=https://npm.pkg.github.com

# Then install
npm install @acedergren/oci-genai-provider
```

### Permissions

The workflow uses:

- `contents: read` - to checkout code
- `packages: write` - to publish to GitHub Packages

### Troubleshooting

**Error: 403 Forbidden**

- Ensure the repository has GitHub Packages enabled
- Check that the workflow has `packages: write` permission

**Error: Package name mismatch**

- Package names must match the GitHub owner (`@acedergren`)
