<script lang="ts">
  import { useChat } from '@ai-sdk/svelte';
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
  });

  // Wrap handleSubmit to include current model in request body
  function onSubmit() {
    handleSubmit(undefined, {
      body: {
        model: selectedModel,
      },
    });
  }
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
      onSubmit={onSubmit}
      disabled={$isLoading}
    />
  </footer>
</div>
