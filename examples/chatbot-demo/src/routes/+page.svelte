<script lang="ts">
  import { browser } from '$app/environment';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import type { UIMessage } from 'ai';
  import ChatContainer from '$lib/components/ChatContainer.svelte';
  import ChatInput from '$lib/components/ChatInput.svelte';
  import Select from '$lib/components/Select.svelte';

  const models = [
    { value: 'meta.llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    { value: 'cohere.command-plus-latest', label: 'Cohere Command R+ Latest' },
    { value: 'cohere.command-a-03-2025', label: 'Cohere Command A' },
    { value: 'google.gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ];

  let selectedModel = $state('meta.llama-3.3-70b-instruct');
  let inputValue = $state('');
  let chat = $state<Chat | null>(null);

  // Initialize chat only on client side
  $effect(() => {
    if (browser && !chat) {
      chat = new Chat({
        transport: new DefaultChatTransport({
          api: '/api/chat',
        }),
      });
    }
  });

  // Computed properties for reactive access
  const messages = $derived<UIMessage[]>(chat?.messages ?? []);
  const isLoading = $derived(chat?.status === 'streaming' || chat?.status === 'submitted');

  // Submit handler that includes the current model
  async function onSubmit() {
    if (!chat) return;
    const text = inputValue.trim();
    if (!text) return;

    inputValue = '';
    await chat.sendMessage({ text }, {
      body: {
        model: selectedModel,
      },
    });
  }
</script>

<svelte:head>
  <title>OCI GenAI Chat Demo</title>
  <meta name="description" content="Chat with Oracle Cloud Infrastructure Generative AI models" />
</svelte:head>

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
    <ChatContainer {messages} {isLoading} />
  </main>

  <!-- Input Area -->
  <footer class="p-4 max-w-4xl mx-auto w-full">
    <ChatInput
      bind:value={inputValue}
      {onSubmit}
      disabled={isLoading}
    />
  </footer>
</div>
