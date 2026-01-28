# Backend Requirements: Chat Demo

## Context

Building a **simple, stateless OCI GenAI chatbot demo** for OpenCode. Users can select from available AI models and stream chat responses in real-time. No persistence, no user accounts—just a clean UI showcasing OCI GenAI capabilities.

---

## Screens/Components

### Main Chat Screen

**Purpose**: Single-screen chat interface where users can:
- Select an AI model from a dropdown
- Type and send messages
- See responses stream in real-time

**Data I need to display**:

1. **Available Models List** (shown in dropdown selector)
   - Model name/display label (e.g., "Cohere Command R+")
   - Model identifier for sending with requests (e.g., "cohere.command-r-plus")
   - Optional: Brief description or capability hints

2. **Chat Messages** (in conversation)
   - The text content of each message
   - Who sent it (user or assistant)
   - Display in correct order (oldest to newest)
   - Indicator when assistant is responding (streaming state)

3. **Empty State**
   - When no messages exist, show prompt to start conversation

**Actions**:
- **Send message** → User types and hits Enter → Message appears in chat → Request sent to backend → Response streams in and displays
- **Select model** → User picks from dropdown → Selected for all subsequent messages in this chat session
- **Continue conversation** → Each new user message includes full conversation history (or at least context for the model)

**States to handle**:
- **Initial**: Empty chat, model pre-selected or needs selection
- **Composing**: User typing message, send button ready
- **Sending**: User message sent, waiting for response (disable input)
- **Streaming**: Response coming in, update UI as text arrives
- **Ready**: Response complete, input enabled again
- **Error**: Something failed (network, invalid model, API error) — show error message, keep input enabled for retry

**Business rules affecting UI**:
- Only one message can be "in flight" at a time (no queuing)
- Model selection affects all subsequent messages in this session
- No message editing or deletion (simple demo)
- Clear send button state: disabled if textarea is empty or already sending

---

## Data Format Expectations

### Sending a Message to Backend

**What I need to send** (abstraction of the request, not prescribing structure):
- The user's message text
- The selected model identifier
- Previous messages in the conversation (for context)

**Uncertainty**: Should I always send the full conversation history, or just the latest message? Some models handle context differently.

### Receiving Responses from Backend

**What I expect back**:
- A stream of response text that arrives incrementally (Server-Sent Events or similar)
- Clear signal when the response is complete
- If something goes wrong, a descriptive error message

**Questions**:
- Will the response always be plain text, or could it include other content types?
- Should responses include metadata (like token count, model info)?
- If the connection drops mid-stream, should I show what arrived or discard it?

---

## Dynamic Model List

**Current state**: Models are hardcoded in the UI (4 OCI models).

**What I need instead**:
- An endpoint or initial data that gives me the list of available models
- For each model:
  - Display name (what users see in dropdown)
  - Model identifier (what to send in requests)
  - Optional: description or capability notes

**Questions**:
- Should this list be fetched on page load, or baked into initial page data?
- Can models change without redeploying? (Should frontend check periodically?)
- Are all models always available, or could some be disabled/rate-limited?

---

## Error Handling

**States I need to handle**:
- **Invalid model**: User selected a model that's no longer available
- **API error**: OCI GenAI service returns an error
- **Network error**: Connection lost while streaming
- **Rate limit**: Backend says "too many requests"
- **Invalid input**: Something wrong with the message format

**What I need from backend**:
- Clear error messages (what went wrong, not just "error")
- Error codes or types so I can handle different failures differently
- Should I retry automatically or ask the user to retry?

---

## Uncertainties

- [ ] **Full history vs. latest message** — Should I send all previous messages or can the backend manage context?
- [ ] **Message format** — What's the exact structure of a message object when I send it? (Currently using `{ messages: Array, model: string }`)
- [ ] **Model availability** — Can models disappear mid-session? Should I validate the selected model before sending?
- [ ] **Streaming format** — What format should the streamed response use? (SSE, WebSocket, JSON lines?)
- [ ] **Response completion** — How do I know when the response is finished? (Explicit signal or just "stream ended"?)
- [ ] **Error codes** — Are there specific error types/codes I should look for?
- [ ] **Token limits** — Should I know message length limits or token budgets?

---

## Questions for Backend

1. **Model Management** — Should available models come from a `/models` endpoint, or should I get them as part of initial page state?

2. **Conversation Context** — For multi-turn conversations, should I always send the full history, or can the backend infer context from the stream?

3. **Message Structure** — What's the canonical format for a message when I send it to the chat endpoint? Should I assume:
   ```
   {
     messages: [{role: 'user'|'assistant', content: string}, ...],
     model: string
   }
   ```
   Or something different?

4. **Streaming Behavior** — If the connection drops mid-response, should I:
   - Show what arrived so far?
   - Discard and ask user to retry?
   - Something else?

5. **Error Strategy** — Should I implement exponential backoff for retries, or does the backend handle that?

6. **Simple Demo Scope** — Are there any features you'd like me to NOT implement to keep this demo simple? (E.g., conversation saving, message editing, etc.)

---

## Discussion Log

*Waiting for backend feedback on the questions above.*

---

## Notes

This is intentionally a simple, stateless demo. The focus is on showing OCI GenAI capabilities with a clean chat UI. Backend can optimize for demo purposes rather than production resilience—we just want it to work reliably during demos.

Push back if any of these requirements don't align with how the backend is structured or if there's a simpler approach.
