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
