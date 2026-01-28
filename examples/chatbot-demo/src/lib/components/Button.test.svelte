<script context="module">
  import { render } from '@testing-library/svelte';
  import { describe, it, expect } from 'vitest';
  import Button from './Button.svelte';

  describe('Button Component', () => {
    it('renders with children content', () => {
      const { getByRole } = render(Button, {
        props: {
          children: { __html: 'Click me' }
        }
      });

      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('applies accent variant by default', () => {
      const { getByRole } = render(Button);
      const button = getByRole('button');

      expect(button.className).toContain('accent-gradient');
    });

    it('applies ghost variant when specified', () => {
      const { getByRole } = render(Button, {
        props: { variant: 'ghost' }
      });

      const button = getByRole('button');
      expect(button.className).toContain('text-text-secondary');
    });

    it('disables button when disabled prop is true', () => {
      const { getByRole } = render(Button, {
        props: { disabled: true }
      });

      const button = getByRole('button');
      expect(button).toBeDisabled();
    });

    it('sets correct button type', () => {
      const { getByRole } = render(Button, {
        props: { type: 'submit' }
      });

      const button = getByRole('button');
      expect(button.type).toBe('submit');
    });
  });
</script>
