# OCI GenAI SvelteKit Chatbot Demo

A beautiful, minimal chatbot demo showcasing the OCI GenAI Provider with Vercel AI SDK.

## Features

- 🎨 Bioluminescence/Golden Hour design aesthetic
- ⚡ Real-time streaming responses
- 🔄 Model switching (Cohere, Llama)
- 📱 Mobile responsive
- ♿ Accessible (WCAG AA)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- OCI account with GenAI access

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your OCI credentials
# OCI_COMPARTMENT_ID=ocid1.compartment.oc1...
# OCI_REGION=eu-frankfurt-1
# OCI_CONFIG_PROFILE=DEFAULT
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build

```bash
pnpm build
pnpm preview
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OCI_COMPARTMENT_ID` | OCI compartment OCID | `ocid1.compartment.oc1...` |
| `OCI_REGION` | OCI region | `eu-frankfurt-1` |
| `OCI_CONFIG_PROFILE` | OCI config profile | `DEFAULT` |

## Architecture

```
┌─────────────────────────────────────┐
│  Header (model selector)            │
├─────────────────────────────────────┤
│                                     │
│  Chat Messages (scrollable)         │
│    - User message (right, accent)   │
│    - AI message (left, neutral)     │
│                                     │
├─────────────────────────────────────┤
│  Input + Send Button                │
└─────────────────────────────────────┘
```

## Tech Stack

- **Framework**: SvelteKit
- **AI SDK**: Vercel AI SDK
- **Provider**: @acedergren/oci-genai-provider
- **Styling**: Tailwind CSS 4
- **Fonts**: Inter Variable, Space Grotesk

## License

MIT
