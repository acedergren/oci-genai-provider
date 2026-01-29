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

## Docker Deployment Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           Cloudflare (Optional)         │
                    │  ┌─────────────┐  ┌─────────────────┐  │
                    │  │  CF Access  │  │  DNS/Proxy      │  │
                    │  │   (Auth)    │  │                 │  │
                    │  └──────┬──────┘  └────────┬────────┘  │
                    └─────────┼──────────────────┼───────────┘
                              │                  │
                              ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         app01 (Docker Host)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Traefik Proxy                         │   │
│  │  (TLS termination, routing, Let's Encrypt)              │   │
│  └────┬────────────┬────────────┬────────────┬─────────────┘   │
│       │            │            │            │                  │
│  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐            │
│  │ SvelteKit│  │  Next.js │  │ RAG Demo│  │STT Demo│            │
│  │  :5173   │  │  :3000   │  │  :3001  │  │  :3002 │            │
│  └──────────┘  └──────────┘  └─────────┘  └────────┘            │
│       │            │            │            │                  │
│  ┌────┴────────────┴────────────┴────────────┴─────────────┐   │
│  │            Shared Volume: /secrets/oci                   │   │
│  │  (OCI API Key + Config - mounted read-only)              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "letsencrypt:/letsencrypt"
    networks:
      - web

  chatbot-sveltekit:
    build:
      context: .
      dockerfile: examples/chatbot-demo/Dockerfile
    environment:
      - OCI_COMPARTMENT_ID=${OCI_COMPARTMENT_ID}
      - OCI_REGION=${OCI_REGION:-eu-frankfurt-1}
      - OCI_CONFIG_FILE=/secrets/oci/config
      - OCI_KEY_FILE=/secrets/oci/key.pem
    volumes:
      - oci-secrets:/secrets/oci:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.chatbot-svelte.rule=Host(`chat.example.com`)"
      - "traefik.http.routers.chatbot-svelte.entrypoints=websecure"
      - "traefik.http.routers.chatbot-svelte.tls.certresolver=letsencrypt"
      - "traefik.http.services.chatbot-svelte.loadbalancer.server.port=5173"
    networks:
      - web
    restart: unless-stopped

  chatbot-nextjs:
    build:
      context: .
      dockerfile: examples/nextjs-chatbot/Dockerfile
    environment:
      - OCI_COMPARTMENT_ID=${OCI_COMPARTMENT_ID}
      - OCI_REGION=${OCI_REGION:-eu-frankfurt-1}
      - OCI_CONFIG_FILE=/secrets/oci/config
      - OCI_KEY_FILE=/secrets/oci/key.pem
    volumes:
      - oci-secrets:/secrets/oci:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.chatbot-next.rule=Host(`chat-next.example.com`)"
      - "traefik.http.routers.chatbot-next.entrypoints=websecure"
      - "traefik.http.routers.chatbot-next.tls.certresolver=letsencrypt"
      - "traefik.http.services.chatbot-next.loadbalancer.server.port=3000"
    networks:
      - web
    restart: unless-stopped

  rag-demo:
    build:
      context: .
      dockerfile: examples/rag-demo/Dockerfile
    environment:
      - OCI_COMPARTMENT_ID=${OCI_COMPARTMENT_ID}
      - OCI_REGION=${OCI_REGION:-eu-frankfurt-1}
      - OCI_CONFIG_FILE=/secrets/oci/config
      - OCI_KEY_FILE=/secrets/oci/key.pem
    volumes:
      - oci-secrets:/secrets/oci:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rag.rule=Host(`rag.example.com`)"
      - "traefik.http.routers.rag.entrypoints=websecure"
      - "traefik.http.routers.rag.tls.certresolver=letsencrypt"
      - "traefik.http.services.rag.loadbalancer.server.port=3001"
    networks:
      - web
    restart: unless-stopped

networks:
  web:
    external: true

volumes:
  letsencrypt:
  oci-secrets:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /opt/secrets/oci
```

## Environment File (.env)

```bash
# .env (on app01)
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxx
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=FRANKFURT
ACME_EMAIL=admin@example.com
```

## Dockerfile Templates

### SvelteKit Chatbot

```dockerfile
# examples/chatbot-demo/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/oci-genai-provider ./packages/oci-genai-provider
COPY examples/chatbot-demo ./examples/chatbot-demo

RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build --filter @acedergren/oci-genai-provider
RUN pnpm build --filter @acedergren/chatbot-demo

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/examples/chatbot-demo/build ./build
COPY --from=builder /app/examples/chatbot-demo/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 5173
CMD ["node", "build"]
```

### Next.js Chatbot

```dockerfile
# examples/nextjs-chatbot/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/oci-genai-provider ./packages/oci-genai-provider
COPY examples/nextjs-chatbot ./examples/nextjs-chatbot

RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build --filter @acedergren/oci-genai-provider
RUN pnpm build --filter nextjs-chatbot-demo

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/examples/nextjs-chatbot/.next/standalone ./
COPY --from=builder /app/examples/nextjs-chatbot/.next/static ./.next/static
COPY --from=builder /app/examples/nextjs-chatbot/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

## Authentication Options

### Option 1: Cloudflare Access (Recommended)

Configure Cloudflare Access for each hostname:
1. Add Access Application for `chat.example.com`
2. Set policy to allow specific users/groups
3. Cloudflare handles authentication before requests reach Docker

**Pros:** Zero-trust, no code changes, centralized auth
**Cons:** Requires Cloudflare tunnel or exposed port

### Option 2: Traefik BasicAuth Middleware

```yaml
# Add to docker-compose.yml labels
- "traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$xxx"
- "traefik.http.routers.chatbot-svelte.middlewares=auth"
```

**Pros:** Simple, works locally
**Cons:** Less secure, no SSO

### Option 3: OAuth2 Proxy

Add oauth2-proxy container for Google/GitHub SSO:

```yaml
oauth2-proxy:
  image: quay.io/oauth2-proxy/oauth2-proxy:latest
  environment:
    - OAUTH2_PROXY_PROVIDER=google
    - OAUTH2_PROXY_CLIENT_ID=${OAUTH_CLIENT_ID}
    - OAUTH2_PROXY_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
    - OAUTH2_PROXY_COOKIE_SECRET=${COOKIE_SECRET}
```

**Pros:** Real SSO, flexible
**Cons:** More complex setup

## Secrets Management

### OCI Credentials Setup on app01

```bash
# Create secrets directory
sudo mkdir -p /opt/secrets/oci
sudo chmod 700 /opt/secrets/oci

# Copy OCI config (modify paths inside config)
sudo cp ~/.oci/config /opt/secrets/oci/config
sudo cp ~/.oci/oci_api_key.pem /opt/secrets/oci/key.pem

# Edit config to use container paths
sudo sed -i 's|~/.oci/|/secrets/oci/|g' /opt/secrets/oci/config
sudo chmod 600 /opt/secrets/oci/*
```

### OCI Config for Docker

```ini
# /opt/secrets/oci/config
[DEFAULT]
user=ocid1.user.oc1..xxx
fingerprint=xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..xxx
region=eu-frankfurt-1
key_file=/secrets/oci/key.pem
```

## Deployment Steps

### 1. Initial Setup on app01

```bash
# Clone repository
git clone https://github.com/acedergren/opencode-oci-genai.git /opt/opencode-oci-genai
cd /opt/opencode-oci-genai

# Create Docker network
docker network create web

# Setup secrets
sudo mkdir -p /opt/secrets/oci
# Copy and configure OCI credentials as shown above

# Create .env file
cp .env.example .env
# Edit .env with your values

# Start services
docker compose up -d
```

### 2. DNS Configuration

Point these domains to app01's IP:
- `chat.example.com` -> SvelteKit chatbot
- `chat-next.example.com` -> Next.js chatbot
- `rag.example.com` -> RAG demo

### 3. Cloudflare Access Setup (if using)

1. Add app01 to Cloudflare tunnel OR allow port 443 inbound
2. Create Access Application for each hostname
3. Configure authentication policy (email domain, IdP, etc.)

## Monitoring & Logs

```bash
# View logs
docker compose logs -f chatbot-sveltekit

# Check container status
docker compose ps

# Restart a service
docker compose restart chatbot-sveltekit

# Update after code changes
git pull
docker compose build --no-cache chatbot-sveltekit
docker compose up -d chatbot-sveltekit
```

## Demo Status Summary

| Demo | Local | Docker Ready | Notes |
|------|-------|--------------|-------|
| chatbot-demo | ✅ | Needs Dockerfile | SvelteKit, streaming works |
| nextjs-chatbot | ✅ | Needs Dockerfile | Next.js 15, streaming works |
| rag-demo | ✅ | Needs Dockerfile | Embeddings work |
| cli-tool | ✅ | N/A | CLI only |
| stt-demo | ⚠️ | Needs Dockerfile | No sample audio |
| rag-reranking-demo | ❌ | N/A | Models retired |

## Next Steps

1. Create Dockerfiles for each demo
2. Test Docker builds locally
3. Configure DNS and Cloudflare Access
4. Deploy to app01
5. Add monitoring/alerting

---
*Last updated: 2026-01-29*
