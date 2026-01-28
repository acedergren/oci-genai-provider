# Backend Requirements: Next.js Chatbot

## Context

A **minimal Next.js chatbot** that mirrors the SvelteKit demo but using React hooks and Next.js App Router. Focus is on simplicity and demonstrating OpenCode integration with a modern React stack. Stateless, no persistence, no user accounts.

---

## Screens/Components

### Main Chat Page (`app/page.tsx`)

**Purpose**: Single-screen chat interface using React hooks for state management

**Data I need to display**:

1. **Available Models List** (dropdown selector)
   - Model name/display label
   - Model identifier for requests
   - Optional: Brief description or capability notes

2. **Chat Messages** (conversation history)
   - Message text content
   - Sender (user or assistant)
   - Display order (chronological)
   - Loading indicator during response streaming

3. **Empty State**
   - Prompt message when conversation is empty

**Actions**:
- **Send message** → User types → Submit form → Message added to chat → Request sent → Response streams in → Display
- **Select model** → Choose from dropdown → Model used for all subsequent messages
- **Continue conversation** → Each message includes conversation history

**States to handle**:
- **Initial**: Empty chat, ready for first message
- **Composing**: User typing, form ready to submit
- **Submitting**: Message sent, waiting for response (disable input)
- **Streaming**: Response arriving in real-time, update UI
- **Error**: API error or network issue — show error, enable retry
- **Ready**: Response complete, input enabled

**Business rules affecting UI**:
- Only one message in-flight at a time
- Model selection applies to all messages in session
- No message editing or deletion
- Form validation: disable submit if empty

---

## Data Format

### Sending to Backend

**What I need to send**:
- User message text
- Selected model identifier
- Conversation history (for context)

**Uncertainty**: Should I send full history or can backend infer context from the stream?

### Receiving from Backend

**What I expect**:
- Streaming response text (incremental updates)
- Clear completion signal
- Error messages if something fails

**Questions**:
- Will the stream always be plain text?
- Should I expect metadata (token counts, model info)?
- How do I know when the stream is complete?

---

## Dynamic Model List

**Current state**: Models are hardcoded in the UI

**Need**: 
- List of available models at page load
- For each model: display name, model ID, optional description

**Questions**:
- Should this come from an API endpoint or initial page data?
- Can models change without redeploying?
- Are all models always available?

---

## Error Handling

**Scenarios to handle**:
- Invalid or unavailable model
- API/OCI service errors
- Network disconnection during streaming
- Rate limiting
- Malformed input

**Need from backend**:
- Clear error messages (not just "error")
- Error types/codes for different failure modes
- Should I retry automatically or ask user?

---

## Uncertainties

- [ ] **Message format** — Exact structure when sending? (Currently `{ messages: Array, model: string }`)
- [ ] **Full history requirement** — Do I need to send all previous messages, or just latest?
- [ ] **Model validation** — Should I validate the selected model before sending?
- [ ] **Streaming completion** — How do I know the response finished?
- [ ] **Error codes** — What specific error types should I look for?
- [ ] **Token limits** — Are there message length or token budget limits?

---

## Questions for Backend

1. **Model Endpoint** — Should I fetch available models from `/api/models` or get them as initial page data?

2. **Message Structure** — What's the expected format for messages in the request body?

3. **Context Management** — For multi-turn chats, should I always send the full conversation history?

4. **Streaming Format** — Is the response a standard text stream, Server-Sent Events, or something else?

5. **Default Model** — Currently defaults to `cohere.command-r-plus`. Is this the right default, or should backend specify?

6. **Error Strategy** — Should the frontend implement retry logic, or does the backend handle that?

---

## Discussion Log

*Awaiting backend feedback.*

---

## Notes

This is intentionally minimal to show how the same API works across different frameworks (SvelteKit vs. Next.js). Keep the implementation simple—same chat pattern, different tech stack.
