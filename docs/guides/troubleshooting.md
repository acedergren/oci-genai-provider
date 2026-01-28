# Troubleshooting

Solutions for common issues with the OCI GenAI Provider.

## Authentication Errors

### "NotAuthenticated" or 401

**Symptoms:**
- Requests fail immediately
- Error contains "NotAuthenticated" or status 401

**Solutions:**

1. **Verify your OCI config exists and is formatted correctly:**
   ```bash
   cat ~/.oci/config
   ```

   Should look like:
   ```ini
   [DEFAULT]
   user=ocid1.user.oc1..aaaa...
   fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
   tenancy=ocid1.tenancy.oc1..aaaa...
   region=eu-frankfurt-1
   key_file=~/.oci/oci_api_key.pem
   ```

2. **Check your API key:**
   - Verify the fingerprint matches what's in OCI Console
   - Ensure the key file exists: `ls -la ~/.oci/oci_api_key.pem`
   - Check file permissions: `chmod 600 ~/.oci/oci_api_key.pem`

3. **Verify profile being used:**
   ```bash
   export OCI_CONFIG_PROFILE=DEFAULT
   ```

4. **Test with OCI CLI:**
   ```bash
   oci iam region list
   ```

   If this fails, the issue is with your OCI configuration, not the provider.

### "NotAuthorizedOrNotFound" or 403

**Symptoms:**
- Error with status 403
- "User does not have permission" message

**Solutions:**

Check your IAM policies. Your user needs:

```
Allow group <your-group> to use generative-ai-family in compartment <your-compartment>
```

See [IAM Policies Guide](./iam-policies/README.md) for complete policy requirements.

---

## Model Errors

### Model Not Found

**Symptoms:**
- Error indicates model ID not found
- Request returns 404

**Solutions:**

1. **Verify model ID spelling (case-sensitive):**
   ```typescript
   // Correct
   'cohere.command-r-plus'
   'meta.llama-3.3-70b-instruct'

   // Wrong
   'cohere.Command-R-Plus'
   'meta.llama-3.3'
   ```

2. **Check regional availability:**
   Not all models are available in all regions. Command R+ is widely available; some Llama models have restrictions.

3. **List available models:**
   ```bash
   oci generative-ai model list --compartment-id $OCI_COMPARTMENT_ID
   ```

### Model Capacity Exceeded

**Solutions:**
- The provider automatically retries (3 attempts with exponential backoff)
- For persistent issues, contact OCI support to increase quotas
- Consider using a different model as fallback

---

## Network Errors

### Connection Reset or Socket Hang Up

**Symptoms:**
- Intermittent connection failures
- "ECONNRESET" or "socket hang up" errors

**Solutions:**

1. **Built-in retry handles most cases** — The provider automatically retries network errors.

2. **Increase timeout for slow networks:**
   ```typescript
   const model = oci('cohere.command-r-plus', {
     compartmentId: process.env.OCI_COMPARTMENT_ID!,
     requestOptions: {
       timeoutMs: 60000, // 60 seconds
     },
   });
   ```

3. **Check firewall/proxy:**
   - Ensure outbound HTTPS to `*.oraclecloud.com` is allowed
   - Verify corporate proxy configuration

### Timeout Errors

**Solutions:**

1. **Increase timeout:**
   ```typescript
   requestOptions: {
     timeoutMs: 120000, // 2 minutes for long generations
   }
   ```

2. **Use streaming for long responses:**
   Streaming has separate timeout per chunk, making it better for long-form content.

---

## Rate Limiting

### 429 Too Many Requests

**Symptoms:**
- Error with status code 429
- "Too many requests" message

**Solutions:**

1. **Automatic retry** — The provider retries 429 errors and respects `Retry-After` headers.

2. **Reduce request frequency:**
   ```typescript
   await new Promise(r => setTimeout(r, 1000));
   ```

3. **Request quota increase** — Contact OCI support for higher limits.

---

## Streaming Issues

### Stream Stops Mid-Response

**Causes and solutions:**

1. **Network interruption** — Check stability; provider will throw error that can be caught.

2. **Token limit reached:**
   ```typescript
   const result = await streamText({ model, prompt });
   for await (const chunk of result.textStream) {
     console.log(chunk);
   }
   const final = await result;
   console.log('Finish reason:', final.finishReason);
   ```

3. **Adjust max tokens if needed.**

### Stream Hangs

**Solutions:**

1. **Verify async iteration:**
   ```typescript
   // Correct
   for await (const chunk of result.textStream) {
     process.stdout.write(chunk);
   }

   // Wrong - missing await
   for (const chunk of result.textStream) { }
   ```

2. **Ensure response is consumed:**
   - In web apps, verify client is reading the response
   - In Node.js, check stdout isn't buffered

---

## Environment Issues

### "OCI_COMPARTMENT_ID is required"

**Solution:**
```bash
# Find your compartment ID
oci iam compartment list --all

# Set the variable
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaa...
```

### Wrong Region

**Symptoms:**
- "Service not available in region"
- Unexpected latency

**Solution:**
```bash
# Regions with GenAI service
export OCI_REGION=us-ashburn-1   # US
export OCI_REGION=eu-frankfurt-1 # EU
export OCI_REGION=uk-london-1    # UK
```

---

## TypeScript Issues

### Type Errors with AI SDK

**Problem:** Version mismatch between provider and AI SDK

**Solution:**
```json
{
  "dependencies": {
    "@acedergren/oci-genai-provider": "^0.1.0",
    "ai": "^4.0.0 || ^5.0.0"
  }
}
```

### "Cannot find module"

**Solutions:**

1. **Check installation:**
   ```bash
   pnpm install @acedergren/oci-genai-provider
   ```

2. **Configure npm for GitHub Packages (if using):**
   ```bash
   # .npmrc
   @acedergren:registry=https://npm.pkg.github.com
   ```

---

## Debug Mode

Enable debug logging:

```bash
DEBUG=oci-genai:* node your-script.js
```

For specific modules:
```bash
DEBUG=oci-genai:auth node your-script.js
DEBUG=oci-genai:streaming node your-script.js
```

---

## Still Stuck?

1. **Check existing issues:** [GitHub Issues](https://github.com/acedergren/oci-genai-provider/issues)

2. **Open a new issue** with:
   - Error message and stack trace
   - Node.js version (`node -v`)
   - Package versions (`pnpm list`)
   - Minimal reproduction code

3. **OCI-specific issues:** Contact Oracle support for quota, access, or service problems.
