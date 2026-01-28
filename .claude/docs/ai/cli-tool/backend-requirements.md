# Backend Requirements: CLI Tool

> 📌 **See Also**: [Common Backend Questions](../BACKEND_QUESTIONS.md) — Shared questions across all demos to avoid duplication

## Context

A **command-line chat interface** for direct, programmatic access to OCI GenAI models. Users can interact in three modes:
1. **Interactive REPL** — Conversation mode, line-by-line input
2. **One-shot** — Single prompt, return response, exit
3. **Piped input** — Read from stdin for automation/scripting

Stateless, no persistence, designed for developers and automation.

---

## Interface Modes

### Mode 1: Interactive REPL

**Purpose**: Conversational chat in the terminal with multi-turn history

**Data I need to handle**:
- User input from terminal (stdin)
- Model responses (streamed or full text)
- Conversation history (in-memory for this session)
- Exit signal (Ctrl+C or "exit" command)

**Actions**:
- **User types message** → Send to model → Stream response → Display → Prompt for next input
- **Type "exit"** → Terminate session gracefully
- **Ctrl+C** → Stop current response or exit

**States**:
- **Ready**: Waiting for user input
- **Processing**: Model is generating response
- **Streaming**: Response arriving in real-time
- **Error**: Show error, prompt for retry or exit

---

### Mode 2: One-Shot Query

**Purpose**: Execute a single prompt and exit (for scripting/automation)

**Data I need**:
- Command-line argument as prompt
- Model response
- Exit status (success/failure)

**Actions**:
- **Execute command with prompt** → Send to model → Display response → Exit
- **Streaming mode** → Display as response arrives, or **non-streaming** → Wait for full response

**States**:
- **Executing**: Sending prompt to model
- **Streaming**: Response arriving
- **Complete**: Response done, exit

---

### Mode 3: Piped Input

**Purpose**: Read prompts from stdin for pipeline usage

**Data I need**:
- Input from stdin (could be single prompt or multiple lines)
- Model response to stdout
- Exit status for scripting

**Actions**:
- **Detect TTY vs pipe** → Adjust behavior (interactive vs. batch)
- **Read all input** → Send to model → Return response → Exit

**States**:
- Same as one-shot, but input comes from pipe

---

## Data Handling

### Configuration

**Environment variables I need access to**:
- `OCI_COMPARTMENT_ID` — Required, for GenAI service access
- `OCI_REGION` — Optional, defaults to `eu-frankfurt-1`
- `OCI_MODEL_ID` — Optional, defaults to `cohere.command-r-plus`

**Questions for backend**:
- Are all models available in all regions?
- Should there be a list of valid models the CLI can reference?
- Can region/model be overridden via CLI flags in addition to env vars?

### Model Interaction

**What I need to send**:
- User prompt/message
- Model identifier (from env var or flag)
- Optional: streaming preference (stream vs. full response)
- Optional: conversation history (for REPL mode)

**What I expect back**:
- Response text (either streamed or complete)
- Clear completion signal
- Error messages if something fails

---

## Streaming vs. Non-Streaming

**Current capability**: `--no-stream` flag available

**States to handle**:
- **Streaming enabled** → Display response as it arrives
- **Streaming disabled** → Wait for full response, display when ready
- **Mixed mode** → Interactive REPL uses streaming, one-shot can choose

**Questions**:
- Are there performance differences between modes?
- Should streaming be the default?
- Are there models that don't support streaming?

---

## Error Handling

**Scenarios**:
- Missing environment variables
- Invalid model identifier
- Invalid region
- API/service errors
- Network timeouts
- Malformed responses

**Need from backend**:
- Clear error messages for different failure types
- Exit codes for scripting (0 for success, non-zero for failure)
- Should errors be JSON or human-readable text?

---

## Conversation History (REPL Mode)

**Current behavior**: Messages stored in memory during session

**Questions**:
- Should I send full conversation history with each prompt, or can backend track session?
- Should conversation be cleared with model selection?
- Are there limits on conversation length/depth?

---

## Uncertainties

- [ ] **Model list** — Is there a canonical list of available models?
- [ ] **Region availability** — Do all models work in all regions?
- [ ] **Streaming support** — Do all models support streaming?
- [ ] **Message format** — What structure should messages have for REPL vs. one-shot?
- [ ] **History depth** — Are there limits on conversation length in REPL mode?
- [ ] **Error format** — Should errors be JSON, plain text, or structured output?
- [ ] **Exit codes** — What exit codes should I use for different failure scenarios?
- [ ] **CLI flags** — Should region/model be overridable via `--region`, `--model` flags?

---

## Questions for Backend

1. **Model Discoverability** — Is there an endpoint or data source for available models, or should I maintain a hardcoded list?

2. **Streaming Default** — Should streaming be enabled by default, or require explicit opt-in?

3. **REPL History** — For interactive mode, should I send the full conversation history with each message, or can the backend maintain session state?

4. **Error Handling** — Should the CLI expect specific error codes or messages from the API to handle different failure scenarios?

5. **Region & Model Override** — Should these be overridable via CLI flags (e.g., `cli-tool --model llama-3.1-70b --region us-ashburn-1`)?

6. **Exit Behavior** — Should the REPL automatically exit on error, or prompt the user?

7. **Message Format** — What's the expected message structure for API calls? (Currently assuming single prompt string)

---

## Discussion Log

*Awaiting backend feedback.*

---

## Notes

This CLI is designed for developers and automation. Prioritize clarity in error messages and sensible defaults. The three modes (REPL, one-shot, piped) should all work seamlessly with the same underlying API.
