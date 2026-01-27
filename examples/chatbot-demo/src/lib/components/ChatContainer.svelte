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
