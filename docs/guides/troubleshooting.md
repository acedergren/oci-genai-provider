# Troubleshooting Guide

This guide covers common issues and solutions when using the OCI GenAI Provider.

## Authentication Errors

### "NotAuthenticated" or "401 Unauthorized"

**Symptoms:**

- Error message contains "NotAuthenticated" or status 401
- Requests fail immediately without reaching the model

**Causes & Solutions:**

1. **Missing or invalid OCI configuration**

   ```bash
   # Verify your OCI config exists
   cat ~/.oci/config

   # Check the profile you're using
   export OCI_CONFIG_PROFILE=DEFAULT
   ```

2. **Expired or invalid API key**
   - Check your API key fingerprint matches what's in OCI Console
   - Regenerate the API key if expired
   - Ensure the private key file path in config is correct

3. **Wrong compartment permissions**

   ```bash
   # Verify compartment ID
   oci iam compartment get --compartment-id $OCI_COMPARTMENT_ID
   ```

4. **Instance principal not configured** (for OCI compute instances)
   - Ensure your instance has a dynamic group membership
   - Verify IAM policies allow GenAI access

### "AuthenticationError: Invalid credentials"

**Solution:** Check that your OCI config file has the correct format:

```ini
[DEFAULT]
user=ocid1.user.oc1..aaaa...
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..aaaa...
region=eu-frankfurt-1
key_file=~/.oci/oci_api_key.pem
```

---

## Model Errors

### "ModelNotFoundError" or "Model not available"

**Symptoms:**

- Error indicates model ID is not found
- Request returns 404

**Solutions:**

1. **Verify model ID spelling**

   ```typescript
   // Correct model IDs
   'cohere.command-r-plus';
   'cohere.command-r-08-2024';
   'meta.llama-3.1-70b-instruct';
   'meta.llama-3.1-405b-instruct';
   ```

2. **Check regional availability**
   - Not all models are available in all regions
   - Command R+ is widely available
   - Llama models may have regional restrictions

3. **Verify GenAI service is enabled**
   ```bash
   # List available models in your region
   oci generative-ai model list --compartment-id $OCI_COMPARTMENT_ID
   ```

### "Model capacity exceeded" or throttling

**Solutions:**

- The provider has built-in retry logic (3 retries with exponential backoff)
- For persistent issues, contact OCI support to increase quotas
- Consider using a different model as fallback

---

## Network Errors

### "ECONNRESET" or "socket hang up"

**Symptoms:**

- Intermittent connection failures
- Works sometimes, fails others

**Solutions:**

1. **Built-in retry handles most cases**
   - The provider automatically retries on network errors
   - Default: 3 retries with exponential backoff

2. **Increase timeout for slow networks**

   ```typescript
   const model = oci('cohere.command-r-plus', {
     compartmentId: process.env.OCI_COMPARTMENT_ID!,
     region: 'eu-frankfurt-1',
     requestOptions: {
       timeoutMs: 60000, // 60 seconds
     },
   });
   ```

3. **Check firewall/proxy settings**
   - Ensure outbound HTTPS to `*.oraclecloud.com` is allowed
   - Check corporate proxy configuration

### "TimeoutError: Operation timed out"

**Solutions:**

1. **Increase timeout**

   ```typescript
   requestOptions: {
     timeoutMs: 120000, // 2 minutes for long generations
   }
   ```

2. **Use streaming for long responses**
   - Streaming has separate timeout per chunk
   - Better for long-form content generation

---

## Rate Limiting

### "RateLimitError" or 429 status

**Symptoms:**

- Error with status code 429
- "Too many requests" message

**Solutions:**

1. **Automatic retry**
   - Provider automatically retries 429 errors
   - Respects `Retry-After` header when present

2. **Reduce request frequency**

   ```typescript
   // Add delay between requests
   await new Promise((r) => setTimeout(r, 1000));
   ```

3. **Request quota increase**
   - Contact OCI support for higher limits
   - Consider dedicated capacity for production

---

## Streaming Issues

### Stream stops mid-response

**Possible causes:**

1. **Network interruption**
   - Check network stability
   - Provider will throw error, can be caught and retried

2. **Model finish reason**

   ```typescript
   const result = await streamText({ model, prompt });
   for await (const chunk of result.textStream) {
     console.log(chunk);
   }
   // Check why it stopped
   const finalResult = await result;
   console.log('Finish reason:', finalResult.finishReason);
   ```

3. **Token limit reached**
   - Model hit max output tokens
   - Adjust `maxTokens` parameter if needed

### No streaming output (hangs)

**Solutions:**

1. **Verify async iteration**

   ```typescript
   // Correct: use for await
   for await (const chunk of result.textStream) {
     process.stdout.write(chunk);
   }

   // Wrong: missing await
   for (const chunk of result.textStream) {
   } // Won't work
   ```

2. **Check response is being consumed**
   - In web apps, ensure response is being read by client
   - In Node.js, ensure stdout isn't buffered

---

## Environment Issues

### "OCI_COMPARTMENT_ID is required"

**Solution:** Set the environment variable:

```bash
# Find your compartment ID
oci iam compartment list --all

# Set the variable
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaa...
```

### Wrong region

**Symptoms:**

- "Service not available in region"
- Unexpected latency

**Solution:**

```bash
# Available regions with GenAI
# - us-chicago-1
# - eu-frankfurt-1
# - uk-london-1
# - ap-melbourne-1

export OCI_REGION=eu-frankfurt-1
```

---

## TypeScript Issues

### Type errors with AI SDK

**Problem:** Type mismatch between provider and AI SDK versions

**Solution:** Ensure compatible versions:

```json
{
  "dependencies": {
    "@acedergren/oci-genai-provider": "^0.1.0",
    "ai": "^4.0.0 || ^5.0.0"
  }
}
```

### "Cannot find module" errors

**Solutions:**

1. **Check package installation**

   ```bash
   pnpm install @acedergren/oci-genai-provider
   ```

2. **Configure npm for GitHub Packages**

   ```bash
   # Add to .npmrc
   @acedergren:registry=https://npm.pkg.github.com
   ```

3. **Authenticate to GitHub Packages**
   ```bash
   npm login --registry=https://npm.pkg.github.com
   # Use GitHub PAT with read:packages scope
   ```

---

## Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Enable all debug output
DEBUG=oci-genai:* pnpm dev

# Enable specific modules
DEBUG=oci-genai:auth pnpm dev
DEBUG=oci-genai:streaming pnpm dev
```

---

## Getting Help

If you're still stuck:

1. **Check existing issues**: [GitHub Issues](https://github.com/acedergren/oci-genai-provider/issues)
2. **Open a new issue** with:
   - Error message and stack trace
   - Node.js version (`node -v`)
   - Package versions (`pnpm list`)
   - Minimal reproduction code
3. **OCI Support**: For OCI-specific issues (quotas, access), contact Oracle support
