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
