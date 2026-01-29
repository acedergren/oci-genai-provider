# Deployment Strategy for OpenCode OCI GenAI Demos

## Summary

| Demo | Status | Deployment Target | Reason |
|------|--------|-------------------|--------|
| chatbot-demo (SvelteKit) | Working | Docker (app01) | OCI SDK requires Node.js |
| nextjs-chatbot | Working | Docker (app01) | OCI SDK requires Node.js |
| rag-demo | Working | Docker (app01) | OCI SDK requires Node.js |
| cli-tool | Working | Not deployed | CLI tool, not a web service |
| stt-demo | Untested | Docker (app01) | Needs audio input workflow |
| rag-reranking-demo | Non-functional | N/A | OCI reranking models retired |

## Deployment Constraints

### Why Docker (Not Cloudflare Workers/Pages)

The OCI GenAI provider uses the official Oracle Cloud SDK (`oci-generativeaiinference`) which requires:
- Full Node.js runtime (not edge runtime)
- File system access for OCI config (`~/.oci/config`)
- Native modules and crypto operations

Cloudflare Workers edge runtime lacks these capabilities, making Docker the only viable option.

## Architecture: Cloudflare Tunnel + Docker

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  CF Access  │  │    DNS      │  │   Tunnel Routing        │ │
│  │   (Auth)    │  │             │  │                         │ │
│  └──────┬──────┘  └──────┬──────┘  │ chat.example.com →      │ │
│         │                │         │   chatbot-sveltekit:3000│ │
│         │                │         │ chat-next.example.com → │ │
│         │                │         │   chatbot-nextjs:3000   │ │
│         └────────────────┴─────────┴───────────┬─────────────┘ │
└────────────────────────────────────────────────┼───────────────┘
                                                 │
                          Encrypted Tunnel (outbound only)
                                                 │
┌────────────────────────────────────────────────┼───────────────┐
│                   app01 (Docker Host)          ▼               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    cloudflared                           │  │
│  │            (Tunnel daemon - no ports exposed)            │  │
│  └────┬────────────────────┬───────────────────────────────┘  │
│       │                    │                                   │
│  ┌────▼────────┐     ┌─────▼───────┐                          │
│  │  SvelteKit  │     │   Next.js   │                          │
│  │    :3000    │     │    :3000    │                          │
│  └─────────────┘     └─────────────┘                          │
│       │                    │                                   │
│  ┌────┴────────────────────┴───────────────────────────────┐  │
│  │         Shared Volume: /opt/secrets/oci                  │  │
│  │    (OCI API Key + Config - mounted read-only)            │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- No inbound ports exposed (zero attack surface)
- TLS handled by Cloudflare (no cert management)
- Built-in DDoS protection
- Easy Cloudflare Access integration for authentication

## Cloudflare Tunnel Setup

### 1. Create Tunnel in Zero Trust Dashboard

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com)
2. Navigate to **Networks → Tunnels**
3. Click **Create a tunnel**
4. Name it (e.g., `oci-genai-demos`)
5. Copy the tunnel token

### 2. Configure Public Hostnames

In the tunnel configuration, add public hostnames:

| Public Hostname | Service | Path |
|-----------------|---------|------|
| `chat.example.com` | `http://chatbot-sveltekit:3000` | (empty) |
| `chat-next.example.com` | `http://chatbot-nextjs:3000` | (empty) |

### 3. Add Cloudflare Access (Authentication)

1. Go to **Access → Applications**
2. Click **Add an application** → Self-hosted
3. Configure:
   - **Application name:** OCI GenAI Chat
   - **Session duration:** 24 hours
   - **Application domain:** `chat.example.com`
4. Add policy:
   - **Policy name:** Allow Team
   - **Action:** Allow
   - **Include:** Emails ending in `@yourcompany.com`
5. Repeat for each hostname

## Docker Compose Configuration

The `docker-compose.yml` in the repo is pre-configured for Cloudflare Tunnel:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - internal
    restart: unless-stopped

  chatbot-sveltekit:
    build:
      context: .
      dockerfile: examples/chatbot-demo/Dockerfile
    environment:
      - OCI_COMPARTMENT_ID=${OCI_COMPARTMENT_ID}
      - OCI_REGION=${OCI_REGION:-eu-frankfurt-1}
      - OCI_CONFIG_PROFILE=${OCI_CONFIG_PROFILE:-FRANKFURT}
    volumes:
      - ${OCI_CONFIG_PATH:-/opt/secrets/oci}:/home/sveltekit/.oci:ro
    networks:
      - internal

  chatbot-nextjs:
    build:
      context: .
      dockerfile: examples/nextjs-chatbot/Dockerfile
    environment:
      - OCI_COMPARTMENT_ID=${OCI_COMPARTMENT_ID}
      - OCI_REGION=${OCI_REGION:-eu-frankfurt-1}
      - OCI_CONFIG_PROFILE=${OCI_CONFIG_PROFILE:-FRANKFURT}
    volumes:
      - ${OCI_CONFIG_PATH:-/opt/secrets/oci}:/home/nextjs/.oci:ro
    networks:
      - internal

networks:
  internal:
    name: oci-genai-internal
```

## Environment File (.env)

```bash
# OCI Configuration (Required)
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxxxx
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=FRANKFURT

# Path to OCI credentials on the Docker host
OCI_CONFIG_PATH=/opt/secrets/oci

# Cloudflare Tunnel Token (from Zero Trust dashboard)
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoixxxxxxxxxx...
```

## OCI Credentials Setup

### On app01

```bash
# Create secrets directory
sudo mkdir -p /opt/secrets/oci
sudo chmod 700 /opt/secrets/oci

# Copy OCI config
sudo cp ~/.oci/config /opt/secrets/oci/config
sudo cp ~/.oci/oci_api_key.pem /opt/secrets/oci/oci_api_key.pem

# Update key_file path in config for container use
sudo sed -i 's|key_file=.*|key_file=/home/sveltekit/.oci/oci_api_key.pem|g' /opt/secrets/oci/config

sudo chmod 600 /opt/secrets/oci/*
```

### OCI Config Example

```ini
# /opt/secrets/oci/config
[FRANKFURT]
user=ocid1.user.oc1..xxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..xxx
region=eu-frankfurt-1
key_file=/home/sveltekit/.oci/oci_api_key.pem
```

## Deployment Steps

### 1. Clone and Configure

```bash
# Clone repository
git clone https://github.com/acedergren/opencode-oci-genai.git /opt/opencode-oci-genai
cd /opt/opencode-oci-genai

# Create .env file
cp .env.example .env
nano .env  # Add your values
```

### 2. Setup OCI Credentials

```bash
sudo mkdir -p /opt/secrets/oci
sudo cp ~/.oci/config /opt/secrets/oci/
sudo cp ~/.oci/oci_api_key.pem /opt/secrets/oci/
sudo chmod 600 /opt/secrets/oci/*
```

### 3. Build and Deploy

```bash
# Build containers
docker compose build

# Start services
docker compose up -d

# Verify
docker compose logs -f
```

### 4. Configure Cloudflare Tunnel Routes

In Zero Trust dashboard, add public hostnames pointing to:
- `chatbot-sveltekit:3000`
- `chatbot-nextjs:3000`

## Monitoring & Operations

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f chatbot-sveltekit

# Check status
docker compose ps

# Restart a service
docker compose restart chatbot-sveltekit

# Update and redeploy
git pull
docker compose build --no-cache
docker compose up -d

# Check tunnel status
docker compose logs cloudflared
```

## Troubleshooting

### Tunnel Not Connecting

```bash
# Check cloudflared logs
docker compose logs cloudflared

# Verify token
echo $CLOUDFLARE_TUNNEL_TOKEN | head -c 20
```

### OCI Authentication Errors

```bash
# Test OCI config inside container
docker compose exec chatbot-sveltekit cat /home/sveltekit/.oci/config

# Verify key file exists
docker compose exec chatbot-sveltekit ls -la /home/sveltekit/.oci/
```

### Service Not Reachable

```bash
# Check service is running
docker compose ps

# Test internal connectivity
docker compose exec cloudflared wget -O- http://chatbot-sveltekit:3000
```

## Demo Status Summary

| Demo | Local | Docker Ready | Notes |
|------|-------|--------------|-------|
| chatbot-demo | ✅ | ✅ Dockerfile | SvelteKit, streaming works |
| nextjs-chatbot | ✅ | ✅ Dockerfile | Next.js 15, streaming works |
| rag-demo | ✅ | Needs Dockerfile | Embeddings work |
| cli-tool | ✅ | N/A | CLI only |
| stt-demo | ⚠️ | Needs Dockerfile | No sample audio |
| rag-reranking-demo | ❌ | N/A | Models retired |

---
*Last updated: 2026-01-29*
