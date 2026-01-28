<script context="module">
  import { render, fireEvent } from '@testing-library/svelte';
  import { describe, it, expect, vi } from 'vitest';
  import ChatInput from './ChatInput.svelte';

  describe('ChatInput Component', () => {
    it('renders textarea input', () => {
      const { getByLabelText } = render(ChatInput, {
        props: {
          value: '',
          onSubmit: () => {},
        }
      });

      const textarea = getByLabelText('Chat message input');
      expect(textarea).toBeTruthy();
    });

    it('binds textarea value', async () => {
      const { getByLabelText } = render(ChatInput, {
        props: {
          value: 'Hello',
          onSubmit: () => {},
        }
      });

      const textarea = getByLabelText('Chat message input');
      expect(textarea.value).toBe('Hello');
    });

    it('calls onSubmit when form is submitted', async () => {
      const onSubmit = vi.fn();
      const { getByRole } = render(ChatInput, {
        props: {
          value: 'Test message',
          onSubmit,
        }
      });

      const form = getByRole('form', { hidden: true });
      await fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalled();
    });

    it('disables send button when input is empty', () => {
      const { getByLabelText } = render(ChatInput, {
        props: {
          value: '',
          onSubmit: () => {},
        }
      });

      const sendButton = getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when input has text', () => {
      const { getByLabelText } = render(ChatInput, {
        props: {
          value: 'Some text',
          onSubmit: () => {},
        }
      });

      const sendButton = getByLabelText('Send message');
      expect(sendButton).not.toBeDisabled();
    });

    it('disables send button when disabled prop is true', () => {
      const { getByLabelText } = render(ChatInput, {
        props: {
          value: 'Some text',
          onSubmit: () => {},
          disabled: true,
        }
      });

      const sendButton = getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    it('disables textarea when disabled prop is true', () => {
      const { getByLabelText } = render(ChatInput, {
        props: {
          value: '',
          onSubmit: () => {},
          disabled: true,
        }
      });

      const textarea = getByLabelText('Chat message input');
      expect(textarea).toBeDisabled();
    });

    it('submits on Enter key (without Shift)', async () => {
      const onSubmit = vi.fn();
      const { getByLabelText } = render(ChatInput, {
        props: {
          value: 'Test',
          onSubmit,
        }
      });

      const textarea = getByLabelText('Chat message input');
      await fireEvent.keydown(textarea, { key: 'Enter', shiftKey: false });

      expect(onSubmit).toHaveBeenCalled();
    });

    it('does not submit on Shift+Enter', async () => {
      const onSubmit = vi.fn();
      const { getByLabelText } = render(ChatInput, {
        props: {
          value: 'Test',
          onSubmit,
        }
      });

      const textarea = getByLabelText('Chat message input');
      await fireEvent.keydown(textarea, { key: 'Enter', shiftKey: true });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
</script>
