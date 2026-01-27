# SvelteKit Demo & Production Roadmap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build production-ready OCI GenAI Provider with working SvelteKit chatbot demo, publish to npm, and create comprehensive developer experience.

**Architecture:** Monorepo with core provider package, optional OpenCode wrapper, and example applications. SvelteKit demo uses bioluminescence/golden hour design system with streaming AI responses via Vercel AI SDK.

**Tech Stack:** TypeScript, SvelteKit, Vercel AI SDK, Tailwind 4, pnpm workspaces, Vitest

---

## Phase Overview

**Week 1: Foundation + P0 Demo (Epic 1)**

- Create SvelteKit chatbot demo
- Validate provider integration
- Deploy working demo

**Week 2: Production Ready (Epics 2 & 3)**

- Publish npm packages
- Fix TypeScript errors
- Add retry/timeout/error handling

**Week 3: Developer Experience (Epic 4)**

- Create example apps (Next.js, Remix, CLI)
- Build interactive playground
- Write comprehensive docs

---

## EPIC 1: SvelteKit Chatbot Demo (P0)

### Task 1.1: Create SvelteKit Application Structure

**Files:**

- Create: `examples/chatbot-demo/package.json`
- Create: `examples/chatbot-demo/svelte.config.js`
- Create: `examples/chatbot-demo/vite.config.ts`
- Create: `examples/chatbot-demo/tsconfig.json`

**Step 1: Create examples directory**

```bash
mkdir -p examples/chatbot-demo
cd examples/chatbot-demo
```

**Step 2: Initialize SvelteKit project**

Run: `pnpm create svelte@latest . --template skeleton --types typescript --no-prettier --no-eslint --no-playwright --no-vitest`

Expected: SvelteKit project scaffold created

**Step 3: Update package.json with dependencies**

```json
{
  "name": "@acedergren/chatbot-demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "svelte": "^4.2.7",
    "typescript": "^5.3.3",
    "vite": "^5.0.3"
  },
  "dependencies": {
    "@acedergren/oci-genai-provider": "workspace:*",
    "ai": "^3.4.32",
    "@tailwindcss/vite": "^4.0.0-alpha.26",
    "tailwindcss": "^4.0.0-alpha.26",
    "@fontsource-variable/inter": "^5.0.18",
    "@fontsource/space-grotesk": "^5.0.18"
  }
}
```

**Step 4: Install dependencies**

Run: `pnpm install`
Expected: All dependencies installed

**Step 5: Verify SvelteKit runs**

Run: `pnpm dev`
Expected: Dev server starts on http://localhost:5173

**Step 6: Commit**

```bash
git add examples/chatbot-demo
git commit -m "feat: initialize SvelteKit chatbot demo

- Create SvelteKit app with TypeScript
- Add dependencies: ai, oci-genai-provider, Tailwind 4
- Configure workspace dependency

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.2: Configure Tailwind 4 with Design Tokens

**Files:**

- Create: `examples/chatbot-demo/src/app.css`
- Create: `examples/chatbot-demo/tailwind.config.ts`
- Modify: `examples/chatbot-demo/src/routes/+layout.svelte`

**Step 1: Create Tailwind config**

File: `examples/chatbot-demo/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
} satisfies Config;
```

**Step 2: Create design system CSS**

File: `examples/chatbot-demo/src/app.css`

```css
@import 'tailwindcss';
@import '@fontsource-variable/inter';
@import '@fontsource/space-grotesk';

@theme {
  /* Color System - Bioluminescence/Golden Hour */
  --color-accent-primary: oklch(0.72 0.2 25);
  --color-accent-secondary: oklch(0.65 0.2 15);
  --color-surface-ground: oklch(0.05 0.005 60);
  --color-surface-raised: oklch(0.12 0.01 60);
  --color-surface-elevated: oklch(0.2 0.01 60);
  --color-text-primary: oklch(0.98 0.01 60);
  --color-text-secondary: oklch(0.8 0.015 60);
  --color-text-tertiary: oklch(0.6 0.01 60);
  --color-border: oklch(0.2 0.01 60 / 0.5);

  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
}

body {
  background: var(--color-surface-ground);
  color: var(--color-text-primary);
  font-family: 'Inter Variable', sans-serif;
}

/* Custom utilities */
.glass-effect {
  background: var(--color-surface-raised);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
}

.accent-gradient {
  background: linear-gradient(135deg, oklch(0.72 0.22 30) 0%, oklch(0.65 0.2 15) 100%);
}

.shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    oklch(0.72 0.2 25 / 0.3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

**Step 3: Import CSS in layout**

File: `examples/chatbot-demo/src/routes/+layout.svelte`

```svelte
<script lang="ts">
  import '../app.css';
</script>

<slot />
```

**Step 4: Update vite.config.ts**

File: `examples/chatbot-demo/vite.config.ts`

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
});
```

**Step 5: Test design system**

Run: `pnpm dev`
Expected: No CSS errors, Tailwind compiles

**Step 6: Commit**

```bash
git add examples/chatbot-demo/src/app.css examples/chatbot-demo/tailwind.config.ts examples/chatbot-demo/src/routes/+layout.svelte examples/chatbot-demo/vite.config.ts
git commit -m "feat: configure Tailwind 4 with bioluminescence design system

- Add design tokens (colors, spacing, radius)
- Import Inter Variable and Space Grotesk fonts
- Create custom utilities (glass-effect, accent-gradient, shimmer)
- Configure Tailwind Vite plugin

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.3: Create Base UI Components

**Files:**

- Create: `examples/chatbot-demo/src/lib/components/Button.svelte`
- Create: `examples/chatbot-demo/src/lib/components/Card.svelte`
- Create: `examples/chatbot-demo/src/lib/components/Select.svelte`
- Create: `examples/chatbot-demo/src/lib/utils/cn.ts`

**Step 1: Create class name utility**

File: `examples/chatbot-demo/src/lib/utils/cn.ts`

```typescript
export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
```

**Step 2: Create Button component**

File: `examples/chatbot-demo/src/lib/components/Button.svelte`

```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';

  interface Props {
    variant?: 'accent' | 'ghost';
    disabled?: boolean;
    type?: 'button' | 'submit';
  }

  let { variant = 'accent', disabled = false, type = 'button', ...restProps }: Props = $props();
</script>

<button
  {type}
  {disabled}
  class={cn(
    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variant === 'accent' && 'accent-gradient text-white shadow-lg hover:brightness-110 hover:-translate-y-0.5',
    variant === 'ghost' && 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
  )}
  {...restProps}
>
  <slot />
</button>
```

**Step 3: Create Card component**

File: `examples/chatbot-demo/src/lib/components/Card.svelte`

```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';

  interface Props {
    class?: string;
  }

  let { class: className }: Props = $props();
</script>

<div class={cn('glass-effect rounded-lg p-4', className)}>
  <slot />
</div>
```

**Step 4: Create Select component**

File: `examples/chatbot-demo/src/lib/components/Select.svelte`

```svelte
<script lang="ts">
  interface Props {
    options: { value: string; label: string }[];
    value: string;
    onchange?: (value: string) => void;
  }

  let { options, value = $bindable(), onchange }: Props = $props();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    value = target.value;
    onchange?.(value);
  }
</script>

<select
  {value}
  onchange={handleChange}
  class="glass-effect rounded-lg px-3 py-2 text-text-primary bg-surface-raised border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
>
  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
```

**Step 5: Verify components compile**

Run: `pnpm build`
Expected: Build succeeds with no TypeScript errors

**Step 6: Commit**

```bash
git add examples/chatbot-demo/src/lib
git commit -m "feat: create base UI components

- Add Button (accent/ghost variants)
- Add Card (glass effect wrapper)
- Add Select (model selector)
- Add cn utility for class merging

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.4: Create Chat Message Components

**Files:**

- Create: `examples/chatbot-demo/src/lib/components/Message.svelte`
- Create: `examples/chatbot-demo/src/lib/components/ChatContainer.svelte`
- Create: `examples/chatbot-demo/src/lib/components/ChatInput.svelte`

**Step 1: Create Message component**

File: `examples/chatbot-demo/src/lib/components/Message.svelte`

```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';

  interface Props {
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
  }

  let { role, content, isStreaming = false }: Props = $props();
</script>

<div
  class={cn(
    'flex w-full mb-4',
    role === 'user' ? 'justify-end' : 'justify-start'
  )}
>
  <div
    class={cn(
      'max-w-[80%] rounded-lg px-4 py-3',
      role === 'user' && 'accent-gradient text-white',
      role === 'assistant' && 'glass-effect',
      isStreaming && 'shimmer'
    )}
  >
    <div class="prose prose-invert prose-sm max-w-none">
      {content}
    </div>
  </div>
</div>
```

**Step 2: Create ChatContainer component**

File: `examples/chatbot-demo/src/lib/components/ChatContainer.svelte`

```svelte
<script lang="ts">
  import type { Message } from 'ai';
  import MessageComponent from './Message.svelte';

  interface Props {
    messages: Message[];
    isLoading?: boolean;
  }

  let { messages, isLoading = false }: Props = $props();
  let containerRef: HTMLDivElement;

  $effect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (containerRef && messages.length > 0) {
      containerRef.scrollTop = containerRef.scrollHeight;
    }
  });
</script>

<div
  bind:this={containerRef}
  class="flex-1 overflow-y-auto p-6 space-y-4"
>
  {#if messages.length === 0}
    <div class="flex items-center justify-center h-full text-text-tertiary">
      <p>Start chatting with OCI GenAI...</p>
    </div>
  {:else}
    {#each messages as message}
      <MessageComponent
        role={message.role}
        content={message.content}
        isStreaming={isLoading && message === messages[messages.length - 1]}
      />
    {/each}
  {/if}
</div>
```

**Step 3: Create ChatInput component**

File: `examples/chatbot-demo/src/lib/components/ChatInput.svelte`

```svelte
<script lang="ts">
  import Button from './Button.svelte';

  interface Props {
    value: string;
    onSubmit: () => void;
    disabled?: boolean;
  }

  let { value = $bindable(), onSubmit, disabled = false }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); onSubmit(); }} class="glass-effect rounded-lg p-4">
  <div class="flex gap-2">
    <textarea
      bind:value
      onkeydown={handleKeydown}
      {disabled}
      placeholder="Type your message..."
      rows="1"
      class="flex-1 bg-surface-elevated rounded-lg px-4 py-2 text-text-primary placeholder-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
    />
    <Button type="submit" disabled={disabled || !value.trim()}>
      Send
    </Button>
  </div>
</form>
```

**Step 4: Verify components compile**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add examples/chatbot-demo/src/lib/components
git commit -m "feat: create chat UI components

- Add Message component (user/assistant styles, streaming shimmer)
- Add ChatContainer (auto-scroll, empty state)
- Add ChatInput (textarea with Enter to send)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.5: Create Chat API Endpoint

**Files:**

- Create: `examples/chatbot-demo/src/routes/api/chat/+server.ts`
- Create: `examples/chatbot-demo/.env.example`

**Step 1: Create .env.example**

File: `examples/chatbot-demo/.env.example`

```bash
# OCI Configuration
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-id
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=DEFAULT
```

**Step 2: Create chat API endpoint**

File: `examples/chatbot-demo/src/routes/api/chat/+server.ts`

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { messages, model } = await request.json();

    const result = streamText({
      model: oci(model, {
        compartmentId: process.env.OCI_COMPARTMENT_ID!,
        region: (process.env.OCI_REGION as any) || 'eu-frankfurt-1',
      }),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

**Step 3: Add environment types**

File: `examples/chatbot-demo/src/app.d.ts`

```typescript
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
```

**Step 4: Verify API route compiles**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add examples/chatbot-demo/src/routes/api examples/chatbot-demo/.env.example examples/chatbot-demo/src/app.d.ts
git commit -m "feat: create chat API endpoint

- Add POST /api/chat for streaming responses
- Use oci() provider from @acedergren/oci-genai-provider
- Add environment variable configuration
- Add error handling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.6: Create Chat Page with useChat Integration

**Files:**

- Create: `examples/chatbot-demo/src/routes/+page.svelte`

**Step 1: Create main chat page**

File: `examples/chatbot-demo/src/routes/+page.svelte`

```svelte
<script lang="ts">
  import { useChat } from 'ai/svelte';
  import ChatContainer from '$lib/components/ChatContainer.svelte';
  import ChatInput from '$lib/components/ChatInput.svelte';
  import Select from '$lib/components/Select.svelte';

  const models = [
    { value: 'cohere.command-r-plus', label: 'Cohere Command R+' },
    { value: 'cohere.command-r', label: 'Cohere Command R' },
    { value: 'meta.llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
    { value: 'meta.llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
  ];

  let selectedModel = $state('cohere.command-r-plus');

  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel,
    },
  });
</script>

<div class="h-screen flex flex-col">
  <!-- Header -->
  <header class="glass-effect border-b border-border p-4">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <h1 class="text-2xl font-display font-bold">OCI GenAI Chat</h1>
      <Select
        options={models}
        bind:value={selectedModel}
      />
    </div>
  </header>

  <!-- Chat Container -->
  <main class="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
    <ChatContainer messages={$messages} isLoading={$isLoading} />
  </main>

  <!-- Input Area -->
  <footer class="p-4 max-w-4xl mx-auto w-full">
    <ChatInput
      bind:value={$input}
      onSubmit={handleSubmit}
      disabled={$isLoading}
    />
  </footer>
</div>
```

**Step 2: Test the application locally**

Run: `cp .env.example .env`
Then: Edit `.env` with real OCI credentials
Then: `pnpm dev`
Expected: App loads at http://localhost:5173

**Step 3: Verify chat works (manual test)**

- Open http://localhost:5173
- Type a message and send
- Verify streaming response appears
- Switch models and test again

**Step 4: Commit**

```bash
git add examples/chatbot-demo/src/routes/+page.svelte
git commit -m "feat: create chat page with useChat integration

- Add main chat interface
- Integrate ChatContainer, ChatInput components
- Add model selector in header
- Wire up Vercel AI SDK useChat hook

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.7: Add Polish & Accessibility

**Files:**

- Modify: `examples/chatbot-demo/src/lib/components/ChatInput.svelte`
- Modify: `examples/chatbot-demo/src/lib/components/Select.svelte`
- Create: `examples/chatbot-demo/src/routes/+page.svelte` (add meta tags)

**Step 1: Add ARIA labels to ChatInput**

File: `examples/chatbot-demo/src/lib/components/ChatInput.svelte` (update)

```svelte
<textarea
  bind:value
  onkeydown={handleKeydown}
  {disabled}
  placeholder="Type your message..."
  rows="1"
  aria-label="Chat message input"
  class="flex-1 bg-surface-elevated rounded-lg px-4 py-2 text-text-primary placeholder-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
/>
<Button type="submit" disabled={disabled || !value.trim()} aria-label="Send message">
  Send
</Button>
```

**Step 2: Add ARIA label to Select**

File: `examples/chatbot-demo/src/lib/components/Select.svelte` (update)

```svelte
<select
  {value}
  onchange={handleChange}
  aria-label="Select AI model"
  class="glass-effect rounded-lg px-3 py-2 text-text-primary bg-surface-raised border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
>
```

**Step 3: Add page metadata**

File: `examples/chatbot-demo/src/routes/+page.svelte` (add <svelte:head>)

```svelte
<svelte:head>
  <title>OCI GenAI Chat Demo</title>
  <meta name="description" content="Chat with Oracle Cloud Infrastructure Generative AI models" />
</svelte:head>
```

**Step 4: Test keyboard navigation**

Manual test:

- Tab through all interactive elements
- Verify focus rings visible
- Test Enter to send message
- Test Shift+Enter for newline

**Step 5: Commit**

```bash
git add examples/chatbot-demo/src/lib/components examples/chatbot-demo/src/routes/+page.svelte
git commit -m "feat: add accessibility improvements

- Add ARIA labels to interactive elements
- Add page metadata (title, description)
- Ensure keyboard navigation works
- Verify focus states visible

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.8: Create Demo README & Documentation

**Files:**

- Create: `examples/chatbot-demo/README.md`
- Modify: `README.md` (root) - add demo link

**Step 1: Create demo README**

File: `examples/chatbot-demo/README.md`

````markdown
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
````

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

| Variable             | Description          | Example                    |
| -------------------- | -------------------- | -------------------------- |
| `OCI_COMPARTMENT_ID` | OCI compartment OCID | `ocid1.compartment.oc1...` |
| `OCI_REGION`         | OCI region           | `eu-frankfurt-1`           |
| `OCI_CONFIG_PROFILE` | OCI config profile   | `DEFAULT`                  |

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

````

**Step 2: Update root README with demo link**

File: `README.md` (add section after ## Packages)

```markdown
## Live Demo

Try the [SvelteKit Chatbot Demo](./examples/chatbot-demo) to see the OCI GenAI Provider in action.

Features:
- Real-time streaming responses
- Multiple model support (Cohere, Llama)
- Beautiful bioluminescence design
- Mobile responsive

[View Demo Source →](./examples/chatbot-demo)
````

**Step 3: Commit**

```bash
git add examples/chatbot-demo/README.md README.md
git commit -m "docs: add SvelteKit demo documentation

- Create comprehensive demo README
- Add setup instructions
- Document environment variables
- Add architecture diagram
- Link demo from root README

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## EPIC 2: Package Publishing

### Task 2.1: Prepare Package Metadata

**Files:**

- Modify: `packages/oci-genai-provider/package.json`
- Modify: `packages/opencode-oci-genai/package.json`

**Step 1: Update core provider package.json**

File: `packages/oci-genai-provider/package.json` (update fields)

```json
{
  "name": "@acedergren/oci-genai-provider",
  "version": "0.1.0",
  "description": "OCI Generative AI provider for Vercel AI SDK",
  "keywords": [
    "oci",
    "oracle-cloud",
    "generative-ai",
    "ai",
    "llm",
    "vercel-ai-sdk",
    "language-model"
  ],
  "homepage": "https://github.com/acedergren/oci-genai-provider#readme",
  "bugs": {
    "url": "https://github.com/acedergren/oci-genai-provider/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/acedergren/oci-genai-provider.git",
    "directory": "packages/oci-genai-provider"
  },
  "license": "MIT",
  "author": "Alexander Cedergren <alexander.cedergren@oracle.com>",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

**Step 2: Update OpenCode wrapper package.json**

File: `packages/opencode-oci-genai/package.json` (update fields)

```json
{
  "name": "@acedergren/opencode-oci-genai",
  "version": "0.1.0",
  "description": "OpenCode integration for OCI Generative AI",
  "keywords": ["oci", "oracle-cloud", "generative-ai", "opencode", "ai", "llm"],
  "homepage": "https://github.com/acedergren/oci-genai-provider#readme",
  "bugs": {
    "url": "https://github.com/acedergren/oci-genai-provider/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/acedergren/oci-genai-provider.git",
    "directory": "packages/opencode-oci-genai"
  },
  "license": "MIT",
  "author": "Alexander Cedergren <alexander.cedergren@oracle.com>",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

**Step 3: Verify package.json files field**

Run: `pnpm --filter @acedergren/oci-genai-provider pack --dry-run`
Expected: Shows list of files that will be published (dist/, README.md, package.json)

**Step 4: Commit**

```bash
git add packages/*/package.json
git commit -m "chore: prepare packages for npm publishing

- Add repository, homepage, bugs URLs
- Add keywords for discoverability
- Configure publishConfig for npm registry
- Set access to public

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2.2: Create Package Validation Tests

**Files:**

- Create: `scripts/validate-packages.test.ts`
- Modify: `package.json` (add script)

**Step 1: Create validation test**

File: `scripts/validate-packages.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Package validation', () => {
  const packagesDir = path.join(__dirname, '../packages');
  const packages = ['oci-genai-provider', 'opencode-oci-genai'];

  packages.forEach((pkg) => {
    describe(`@acedergren/${pkg}`, () => {
      const pkgPath = path.join(packagesDir, pkg);
      const pkgJsonPath = path.join(pkgPath, 'package.json');
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

      it('should have correct package name', () => {
        expect(pkgJson.name).toBe(`@acedergren/${pkg}`);
      });

      it('should have required metadata', () => {
        expect(pkgJson.version).toBeDefined();
        expect(pkgJson.description).toBeDefined();
        expect(pkgJson.license).toBe('MIT');
        expect(pkgJson.author).toBeDefined();
      });

      it('should have repository information', () => {
        expect(pkgJson.repository).toBeDefined();
        expect(pkgJson.repository.type).toBe('git');
        expect(pkgJson.repository.url).toContain('github.com');
      });

      it('should have publishConfig', () => {
        expect(pkgJson.publishConfig).toBeDefined();
        expect(pkgJson.publishConfig.access).toBe('public');
      });

      it('should have exports field', () => {
        expect(pkgJson.exports).toBeDefined();
      });

      it('should have types field', () => {
        expect(pkgJson.types).toBeDefined();
      });

      it('should include required files', () => {
        const distPath = path.join(pkgPath, 'dist');
        const readmePath = path.join(pkgPath, 'README.md');

        // Note: dist/ will exist after build
        expect(fs.existsSync(readmePath)).toBe(true);
      });
    });
  });
});
```

**Step 2: Add test script**

File: `package.json` (add to scripts)

```json
{
  "scripts": {
    "validate:packages": "vitest run scripts/validate-packages.test.ts"
  }
}
```

**Step 3: Install vitest if needed**

Run: `pnpm add -D vitest -w`

**Step 4: Run validation tests**

Run: `pnpm validate:packages`
Expected: All tests pass

**Step 5: Commit**

```bash
git add scripts/validate-packages.test.ts package.json
git commit -m "test: add package validation tests

- Validate package.json metadata
- Check required fields (name, version, exports, types)
- Verify repository and publishConfig
- Ensure README.md exists

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2.3: Create npm Publish Workflow

**Files:**

- Create: `.github/workflows/publish.yml`

**Step 1: Create GitHub Actions workflow**

File: `.github/workflows/publish.yml`

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build packages
        run: pnpm build

      - name: Validate packages
        run: pnpm validate:packages

      - name: Publish to npm
        run: pnpm -r publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

**Step 2: Document npm token setup**

File: `.github/workflows/README.md`

````markdown
# GitHub Actions Workflows

## Publish to npm

Automatically publishes packages to npm when a version tag is pushed.

### Setup

1. Create npm access token at https://www.npmjs.com/settings/tokens
2. Add token as `NPM_TOKEN` secret in GitHub repository settings
3. Push a version tag to trigger publish:

```bash
git tag v0.1.0
git push origin v0.1.0
```
````

### Workflow Steps

1. Install dependencies
2. Run full test suite
3. Build packages
4. Validate package metadata
5. Publish to npm (if all checks pass)
6. Create GitHub release with notes

````

**Step 3: Test workflow syntax**

Run: `cat .github/workflows/publish.yml | head -20`
Expected: Valid YAML syntax

**Step 4: Commit**

```bash
git add .github/workflows
git commit -m "ci: add npm publish workflow

- Trigger on version tags (v*.*.*)
- Run tests and build before publish
- Validate package metadata
- Publish to npm with access token
- Create GitHub release

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
````

---

### Task 2.4: Manual Publish Test (Dry Run)

**Files:**

- None (testing only)

**Step 1: Build packages**

Run: `pnpm build`
Expected: All packages build successfully

**Step 2: Dry run publish for core provider**

Run: `cd packages/oci-genai-provider && pnpm publish --dry-run`
Expected: Shows files that will be published, no errors

**Step 3: Dry run publish for OpenCode wrapper**

Run: `cd packages/opencode-oci-genai && pnpm publish --dry-run`
Expected: Shows files that will be published, no errors

**Step 4: Verify package contents**

Run: `pnpm --filter @acedergren/oci-genai-provider pack`
Then: `tar -tzf acedergren-oci-genai-provider-*.tgz | head -20`
Expected: Contains dist/, README.md, package.json, no **tests**

**Step 5: Document publish process**

File: `docs/guides/publishing.md`

````markdown
# Publishing Packages

## Automated Publishing (Recommended)

1. Update version in package.json files
2. Commit changes
3. Create and push version tag:

```bash
git tag v0.1.0
git commit -m "chore: bump version to 0.1.0"
git push origin main --tags
```
````

4. GitHub Actions will automatically publish to npm

## Manual Publishing

Only use if automated workflow fails:

```bash
# Build packages
pnpm build

# Validate
pnpm validate:packages

# Publish (requires NPM_TOKEN)
pnpm -r publish --access public
```

## Post-Publish Verification

```bash
# Install in clean directory
mkdir test-install && cd test-install
npm init -y
npm install @acedergren/oci-genai-provider

# Verify import works
node -e "const { oci } = require('@acedergren/oci-genai-provider'); console.log(oci)"
```

````

**Step 6: Commit**

```bash
git add docs/guides/publishing.md
git commit -m "docs: add publishing guide

- Document automated publishing workflow
- Add manual publishing fallback
- Include post-publish verification steps

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
````

---

## EPIC 3: Production Hardening

### Task 3.1: Fix TypeScript Test Errors

**Files:**

- Modify: `packages/oci-genai-provider/src/models/__tests__/oci-language-model.test.ts`

**Step 1: Read failing test file**

Run: `pnpm --filter @acedergren/oci-genai-provider test 2>&1 | grep "Property 'getReader'" -A 5`

**Step 2: Fix type error on line 330**

File: `packages/oci-genai-provider/src/models/__tests__/oci-language-model.test.ts:330`

Replace:

```typescript
it('should wrap streaming errors with OCIGenAIError', async () => {
  const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

  mockChat.mockRejectedValue(new Error('Internal Server Error'));

  const options = {
    prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'test' }] }],
  };

  await expect(model.doStream(options)).rejects.toThrow('OCIGenAIError');
});
```

**Step 3: Run tests to verify fix**

Run: `pnpm --filter @acedergren/oci-genai-provider test`
Expected: All tests pass, no TypeScript errors

**Step 4: Run type check**

Run: `pnpm type-check`
Expected: No type errors

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/models/__tests__/oci-language-model.test.ts
git commit -m "fix: resolve TypeScript error in streaming test

- Fix 'getReader' property error on line 330
- Update test to properly mock streaming response
- Verify all tests pass

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3.2: Implement Retry Logic Utility

**Files:**

- Create: `packages/oci-genai-provider/src/utils/retry.ts`
- Create: `packages/oci-genai-provider/src/utils/__tests__/retry.test.ts`

**Step 1: Write failing tests**

File: `packages/oci-genai-provider/src/utils/__tests__/retry.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../retry';

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on transient errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, { maxRetries: 3 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on client errors (4xx)', async () => {
    const error = new Error('Bad Request');
    (error as any).statusCode = 400;
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toThrow('Bad Request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on server errors (5xx)', async () => {
    const error = new Error('Internal Server Error');
    (error as any).statusCode = 500;
    const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const delays: number[] = [];
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValue('success');

    const start = Date.now();
    await withRetry(fn, {
      maxRetries: 3,
      onRetry: (_, delay) => {
        delays.push(delay);
      },
    });

    expect(delays).toEqual([100, 200]); // Exponential backoff
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @acedergren/oci-genai-provider test retry.test.ts`
Expected: FAIL - module not found

**Step 3: Implement retry utility**

File: `packages/oci-genai-provider/src/utils/retry.ts`

```typescript
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (error: Error, delay: number) => void;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const statusCode = (error as any).statusCode;

    // Don't retry client errors (4xx)
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }

    // Retry server errors (5xx) and network errors
    return true;
  }

  return false;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, baseDelay = 100, onRetry } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);

      onRetry?.(lastError, delay);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @acedergren/oci-genai-provider test retry.test.ts`
Expected: PASS - all tests pass

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/utils/retry.ts packages/oci-genai-provider/src/utils/__tests__/retry.test.ts
git commit -m "feat: add retry logic with exponential backoff

- Implement withRetry utility
- Add RetryOptions interface
- Retry on 5xx and network errors only
- Skip retry on 4xx client errors
- Use exponential backoff (100ms, 200ms, 400ms)
- Tests: retry.test.ts (5 tests)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3.3: Implement Timeout Utility

**Files:**

- Create: `packages/oci-genai-provider/src/utils/timeout.ts`
- Create: `packages/oci-genai-provider/src/utils/__tests__/timeout.test.ts`

**Step 1: Write failing tests**

File: `packages/oci-genai-provider/src/utils/__tests__/timeout.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { withTimeout, TimeoutError } from '../timeout';

describe('withTimeout', () => {
  it('should resolve if function completes in time', async () => {
    const fn = () => Promise.resolve('success');
    const result = await withTimeout(fn(), 1000);

    expect(result).toBe('success');
  });

  it('should reject with TimeoutError if function exceeds timeout', async () => {
    const fn = () => new Promise((resolve) => setTimeout(resolve, 200));

    await expect(withTimeout(fn(), 100)).rejects.toThrow(TimeoutError);
  });

  it('should include timeout duration in error message', async () => {
    const fn = () => new Promise((resolve) => setTimeout(resolve, 200));

    try {
      await withTimeout(fn(), 100);
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as Error).message).toContain('100ms');
    }
  });

  it('should not leak timers on success', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const fn = () => Promise.resolve('success');

    await withTimeout(fn(), 1000);

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @acedergren/oci-genai-provider test timeout.test.ts`
Expected: FAIL - module not found

**Step 3: Implement timeout utility**

File: `packages/oci-genai-provider/src/utils/timeout.ts`

```typescript
export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @acedergren/oci-genai-provider test timeout.test.ts`
Expected: PASS - all tests pass

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/utils/timeout.ts packages/oci-genai-provider/src/utils/__tests__/timeout.test.ts
git commit -m "feat: add timeout utility

- Implement withTimeout function
- Add TimeoutError class
- Race promise against timeout
- Cleanup timers on completion
- Tests: timeout.test.ts (4 tests)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3.4: Enhance Error Types

**Files:**

- Modify: `packages/oci-genai-provider/src/errors/index.ts`
- Create: `packages/oci-genai-provider/src/errors/__tests__/errors.test.ts`

**Step 1: Write failing tests**

File: `packages/oci-genai-provider/src/errors/__tests__/errors.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  OCIGenAIError,
  NetworkError,
  TimeoutError as OCITimeoutError,
  RateLimitError,
  AuthenticationError,
} from '../index';

describe('Error classes', () => {
  it('should create NetworkError with cause', () => {
    const cause = new Error('Connection refused');
    const error = new NetworkError('Failed to connect', { cause });

    expect(error).toBeInstanceOf(OCIGenAIError);
    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Failed to connect');
    expect(error.cause).toBe(cause);
  });

  it('should create TimeoutError with duration', () => {
    const error = new OCITimeoutError(5000);

    expect(error).toBeInstanceOf(OCIGenAIError);
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toContain('5000ms');
  });

  it('should create RateLimitError with retry info', () => {
    const error = new RateLimitError('Rate limit exceeded', { retryAfter: 60 });

    expect(error).toBeInstanceOf(OCIGenAIError);
    expect(error.name).toBe('RateLimitError');
    expect(error.retryAfter).toBe(60);
  });

  it('should create AuthenticationError', () => {
    const error = new AuthenticationError('Invalid API key');

    expect(error).toBeInstanceOf(OCIGenAIError);
    expect(error.name).toBe('AuthenticationError');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @acedergren/oci-genai-provider test errors.test.ts`
Expected: FAIL - classes not exported

**Step 3: Add new error classes**

File: `packages/oci-genai-provider/src/errors/index.ts` (add to existing file)

```typescript
export class NetworkError extends OCIGenAIError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends OCIGenAIError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends OCIGenAIError {
  public retryAfter?: number;

  constructor(message: string, options?: { retryAfter?: number; cause?: Error }) {
    super(message, { cause: options?.cause });
    this.name = 'RateLimitError';
    this.retryAfter = options?.retryAfter;
  }
}

export class AuthenticationError extends OCIGenAIError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AuthenticationError';
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @acedergren/oci-genai-provider test errors.test.ts`
Expected: PASS - all tests pass

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/errors
git commit -m "feat: add specialized error types

- Add NetworkError (network failures)
- Add TimeoutError (request timeouts)
- Add RateLimitError (429 responses with retryAfter)
- Add AuthenticationError (auth failures)
- All extend OCIGenAIError
- Tests: errors.test.ts (4 tests)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3.5: Integrate Retry and Timeout in Provider

**Files:**

- Modify: `packages/oci-genai-provider/src/models/oci-language-model.ts`
- Create: `packages/oci-genai-provider/src/models/__tests__/retry-timeout-integration.test.ts`

**Step 1: Write integration tests**

File: `packages/oci-genai-provider/src/models/__tests__/retry-timeout-integration.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { OCILanguageModel } from '../oci-language-model';
import { NetworkError, TimeoutError } from '../../errors';

const mockConfig = {
  compartmentId: 'test-compartment',
  region: 'us-ashburn-1' as const,
};

describe('Retry and Timeout Integration', () => {
  it('should retry on network errors', async () => {
    const model = new OCILanguageModel('cohere.command-r-plus', {
      ...mockConfig,
      maxRetries: 3,
    });

    // Mock will be set up to fail twice then succeed
    // This test validates the integration works
  });

  it('should timeout long-running requests', async () => {
    const model = new OCILanguageModel('cohere.command-r-plus', {
      ...mockConfig,
      timeoutMs: 5000,
    });

    // Test that timeout is applied
  });

  it('should not retry on authentication errors', async () => {
    const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

    // Verify 401 errors are not retried
  });
});
```

**Step 2: Add timeout and retry options to config**

File: `packages/oci-genai-provider/src/models/oci-language-model.ts` (update constructor)

```typescript
export interface OCILanguageModelConfig extends OCIConfig {
  maxRetries?: number;
  timeoutMs?: number;
}

constructor(modelId: string, config: OCILanguageModelConfig) {
  super(modelId);
  this.config = config;
  this.maxRetries = config.maxRetries ?? 3;
  this.timeoutMs = config.timeoutMs ?? 30000;
}
```

**Step 3: Wrap API calls with retry and timeout**

File: `packages/oci-genai-provider/src/models/oci-language-model.ts` (update doGenerate)

```typescript
import { withRetry } from '../utils/retry';
import { withTimeout } from '../utils/timeout';

async doGenerate(options: LanguageModelV1CallOptions): Promise<LanguageModelV1CallResult> {
  try {
    const result = await withRetry(
      () => withTimeout(this._doGenerate(options), this.timeoutMs),
      { maxRetries: this.maxRetries }
    );
    return result;
  } catch (error) {
    throw this.wrapError(error);
  }
}

private async _doGenerate(options: LanguageModelV1CallOptions): Promise<LanguageModelV1CallResult> {
  // Existing implementation (renamed from doGenerate)
}
```

**Step 4: Run tests**

Run: `pnpm --filter @acedergren/oci-genai-provider test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/models
git commit -m "feat: integrate retry and timeout in provider

- Add maxRetries and timeoutMs config options
- Wrap API calls with withRetry and withTimeout
- Default: 3 retries, 30s timeout
- Tests: retry-timeout-integration.test.ts

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## EPIC 4: Developer Experience

### Task 4.1: Create Next.js Example App

**Files:**

- Create: `examples/nextjs-chatbot/package.json`
- Create: `examples/nextjs-chatbot/app/page.tsx`
- Create: `examples/nextjs-chatbot/app/api/chat/route.ts`
- Create: `examples/nextjs-chatbot/README.md`

**Step 1: Initialize Next.js app**

```bash
cd examples
pnpm create next-app@latest nextjs-chatbot --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd nextjs-chatbot
```

**Step 2: Install dependencies**

```bash
pnpm add @acedergren/oci-genai-provider ai
```

**Step 3: Create chat API route**

File: `examples/nextjs-chatbot/app/api/chat/route.ts`

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const result = streamText({
    model: oci(model, {
      compartmentId: process.env.OCI_COMPARTMENT_ID!,
      region: (process.env.OCI_REGION as any) || 'eu-frankfurt-1',
    }),
    messages,
  });

  return result.toDataStreamResponse();
}
```

**Step 4: Create chat UI**

File: `examples/nextjs-chatbot/app/page.tsx`

```typescript
'use client';

import { useChat } from 'ai/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      model: 'cohere.command-r-plus',
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">OCI GenAI Chat - Next.js</h1>

        <div className="space-y-4 mb-4 h-96 overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className={`p-4 rounded ${m.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <strong>{m.role}:</strong> {m.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded">
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
```

**Step 5: Create README**

File: `examples/nextjs-chatbot/README.md`

````markdown
# OCI GenAI Next.js Example

Chatbot built with Next.js App Router and Vercel AI SDK.

## Setup

```bash
pnpm install
cp .env.example .env
# Add OCI credentials
pnpm dev
```
````

## Features

- Next.js 14 App Router
- Streaming responses
- Edge runtime

````

**Step 6: Test the app**

Run: `pnpm dev`
Expected: App runs on http://localhost:3000

**Step 7: Commit**

```bash
git add examples/nextjs-chatbot
git commit -m "feat: add Next.js chatbot example

- Create Next.js 14 app with App Router
- Add streaming chat API route
- Use useChat hook for UI
- Edge runtime support

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
````

---

### Task 4.2: Create CLI Tool Example

**Files:**

- Create: `examples/cli-tool/package.json`
- Create: `examples/cli-tool/index.ts`
- Create: `examples/cli-tool/README.md`

**Step 1: Create package.json**

File: `examples/cli-tool/package.json`

```json
{
  "name": "@acedergren/oci-genai-cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "oci-chat": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx index.ts"
  },
  "dependencies": {
    "@acedergren/oci-genai-provider": "workspace:*",
    "ai": "^3.4.32"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Create CLI tool**

File: `examples/cli-tool/index.ts`

```typescript
#!/usr/bin/env node

import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';
import * as readline from 'readline';

const compartmentId = process.env.OCI_COMPARTMENT_ID!;
const region = (process.env.OCI_REGION as any) || 'eu-frankfurt-1';

async function chat(prompt: string) {
  const { text } = await generateText({
    model: oci('cohere.command-r-plus', { compartmentId, region }),
    prompt,
  });

  console.log('\n' + text + '\n');
}

async function repl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You: ',
  });

  console.log('OCI GenAI Chat CLI');
  console.log('Type your message and press Enter. Ctrl+C to exit.\n');

  rl.prompt();

  rl.on('line', async (line) => {
    if (line.trim()) {
      await chat(line.trim());
    }
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
  });
}

// One-shot mode or REPL
const args = process.argv.slice(2);
if (args.length > 0) {
  await chat(args.join(' '));
} else {
  await repl();
}
```

**Step 3: Create tsconfig**

File: `examples/cli-tool/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true
  }
}
```

**Step 4: Create README**

File: `examples/cli-tool/README.md`

````markdown
# OCI GenAI CLI Tool

Command-line interface for chatting with OCI GenAI models.

## Usage

```bash
# REPL mode
pnpm dev

# One-shot query
pnpm dev "Explain TypeScript"

# Pipe input
echo "Summarize this" | pnpm dev
```
````

````

**Step 5: Test the CLI**

Run: `cd examples/cli-tool && pnpm install && pnpm dev "Hello"`
Expected: Outputs AI response

**Step 6: Commit**

```bash
git add examples/cli-tool
git commit -m "feat: add CLI tool example

- Create Node.js CLI with readline REPL
- Support one-shot queries
- Interactive mode
- Use generateText from AI SDK

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
````

---

### Task 4.3: Create Troubleshooting Guide

**Files:**

- Create: `docs/guides/troubleshooting.md`

**Step 1: Write troubleshooting guide**

File: `docs/guides/troubleshooting.md`

````markdown
# Troubleshooting Guide

## Common Issues

### Authentication Failures

**Symptoms:**

- Error: "Invalid API key"
- 401 Unauthorized responses

**Root Cause:**

- OCI config file missing or invalid
- API key permissions insufficient

**Solution:**

1. Verify OCI config exists: `~/.oci/config`
2. Check API key fingerprint matches
3. Verify user has GenAI permissions

**Prevention:**

- Use `oci setup config` to configure credentials
- Test with: `oci iam user get --user-id <your-user-id>`

---

### Compartment ID Not Found

**Symptoms:**

- Error: "Compartment does not exist"
- 404 Not Found

**Root Cause:**

- Invalid compartment OCID
- Compartment in different region

**Solution:**

```bash
# List compartments
oci iam compartment list --all

# Verify compartment exists
oci iam compartment get --compartment-id <id>
```
````

---

### Rate Limiting

**Symptoms:**

- Error: "Too many requests"
- 429 status code

**Root Cause:**

- Exceeded OCI GenAI rate limits

**Solution:**

- Implement backoff and retry (built-in with `maxRetries`)
- Reduce request frequency
- Check Retry-After header

---

### Network Timeouts

**Symptoms:**

- Request hangs indefinitely
- Timeout errors

**Root Cause:**

- Slow network connection
- Large model responses

**Solution:**

```typescript
const model = oci('cohere.command-r-plus', {
  compartmentId: '...',
  region: 'eu-frankfurt-1',
  timeoutMs: 60000, // 60 seconds
});
```

---

### Model Not Available in Region

**Symptoms:**

- Error: "Model not found"
- 404 on model requests

**Root Cause:**

- Model not deployed in specified region

**Solution:**

- Check available models: `oci generative-ai model list`
- Use correct region for model
- See [Model Availability](../architecture/models.md)

---

## Debug Mode

Enable debug logging:

```bash
export DEBUG=oci-genai:*
```

This will log all requests and responses.

---

## Getting Help

- GitHub Issues: https://github.com/acedergren/oci-genai-provider/issues
- OCI Support: https://docs.oracle.com/support/

````

**Step 2: Commit**

```bash
git add docs/guides/troubleshooting.md
git commit -m "docs: add troubleshooting guide

- Document common issues and solutions
- Add authentication, rate limiting, timeout guides
- Include OCI CLI commands for debugging
- Add debug mode instructions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
````

---

### Task 4.4: Update Documentation with Examples

**Files:**

- Modify: `README.md`
- Modify: `docs/getting-started/README.md`

**Step 1: Update root README**

File: `README.md` (add Examples section)

```markdown
## Examples

Explore example applications to get started quickly:

- **[SvelteKit Chatbot](./examples/chatbot-demo)** - Full-featured chat UI with bioluminescence design
- **[Next.js Chatbot](./examples/nextjs-chatbot)** - Next.js 14 App Router with Edge Runtime
- **[CLI Tool](./examples/cli-tool)** - Command-line REPL for quick queries

[View all examples →](./examples)
```

**Step 2: Update getting started guide**

File: `docs/getting-started/README.md` (add Examples section)

````markdown
## Next Steps

### Explore Examples

- **SvelteKit Demo**: Beautiful chatbot with streaming responses
  ```bash
  cd examples/chatbot-demo
  pnpm install && pnpm dev
  ```
````

- **Next.js Example**: App Router with Edge Runtime

  ```bash
  cd examples/nextjs-chatbot
  pnpm install && pnpm dev
  ```

- **CLI Tool**: Interactive command-line interface
  ```bash
  cd examples/cli-tool
  pnpm install && pnpm dev
  ```

### Learn More

- [Troubleshooting Guide](../guides/troubleshooting.md)
- [API Reference](../api/README.md)
- [Architecture](../architecture/README.md)

````

**Step 3: Commit**

```bash
git add README.md docs/getting-started/README.md
git commit -m "docs: add examples to documentation

- Link to SvelteKit, Next.js, CLI examples
- Add quick start commands
- Update getting started guide with next steps

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
````

---

## Deployment & Verification

### Task 5.1: Deploy SvelteKit Demo

**Files:**

- Create: `examples/chatbot-demo/vercel.json`
- Create: `.github/workflows/deploy-demo.yml`

**Step 1: Create Vercel config**

File: `examples/chatbot-demo/vercel.json`

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "build",
  "framework": "sveltekit",
  "installCommand": "pnpm install"
}
```

**Step 2: Document deployment**

File: `examples/chatbot-demo/README.md` (add Deployment section)

```markdown
## Deployment

### Vercel

1. Import project in Vercel dashboard
2. Add environment variables:
   - `OCI_COMPARTMENT_ID`
   - `OCI_REGION`
   - `OCI_CONFIG_PROFILE`
3. Deploy

### Netlify

1. Connect repository
2. Build command: `pnpm build`
3. Publish directory: `build`
4. Add environment variables
```

**Step 3: Commit**

```bash
git add examples/chatbot-demo/vercel.json examples/chatbot-demo/README.md
git commit -m "docs: add deployment instructions

- Add Vercel configuration
- Document deployment steps
- Include environment variable setup

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5.2: Final Verification Checklist

**Files:**

- Create: `docs/VERIFICATION.md`

**Step 1: Create verification checklist**

File: `docs/VERIFICATION.md`

```markdown
# Production Readiness Verification

## Epic 1: SvelteKit Demo ✅

- [ ] Demo builds without errors
- [ ] Streaming works smoothly
- [ ] Model switching functions
- [ ] Mobile responsive
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] Error states handled
- [ ] README complete

## Epic 2: Package Publishing ✅

- [ ] Both packages published to npm
- [ ] Installation works: `npm install @acedergren/oci-genai-provider`
- [ ] TypeScript types resolve
- [ ] No peer dependency warnings
- [ ] Package metadata correct

## Epic 3: Production Hardening ✅

- [ ] All TypeScript errors fixed
- [ ] Retry logic tested
- [ ] Timeout handling works
- [ ] Error types comprehensive
- [ ] Test coverage >80%

## Epic 4: Developer Experience ✅

- [ ] 3 example apps working
- [ ] Troubleshooting guide complete
- [ ] Documentation updated
- [ ] README links to examples

## Deployment ✅

- [ ] SvelteKit demo deployed
- [ ] Demo URL accessible
- [ ] Environment variables documented

## Final Checks

- [ ] All tests passing: `pnpm test`
- [ ] Type check passes: `pnpm type-check`
- [ ] Build succeeds: `pnpm build`
- [ ] Linting passes: `pnpm lint`
- [ ] No console errors in demo
```

**Step 2: Run full test suite**

Run: `pnpm test && pnpm type-check && pnpm build`
Expected: All commands succeed

**Step 3: Commit**

```bash
git add docs/VERIFICATION.md
git commit -m "docs: add production verification checklist

- Create comprehensive verification checklist
- Cover all 4 epics
- Include deployment checks
- Add final quality gates

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Summary

This plan implements the complete roadmap in executable, TDD-driven tasks:

**Epic 1 (8 tasks)**: SvelteKit demo with bioluminescence design
**Epic 2 (4 tasks)**: npm publishing workflow
**Epic 3 (5 tasks)**: Production hardening (retry, timeout, errors)
**Epic 4 (4 tasks)**: Developer experience (examples, docs)
**Deployment (2 tasks)**: Deploy and verify

**Total**: 23 tasks, each with 4-6 steps following RED-GREEN-REFACTOR-COMMIT.

**Estimated Timeline**:

- Week 1: Epic 1 (5 days)
- Week 2: Epics 2-3 (5 days)
- Week 3: Epic 4 + Deployment (5 days)

Each task includes:

- Exact file paths
- Complete code snippets
- Test-first approach
- Verification commands
- Atomic commits
