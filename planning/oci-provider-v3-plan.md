# OCI Provider V3 Improvement Plan

Goal: Align OCI GenAI provider with AI SDK v3 spec, improve OCI-specific support, error handling, and telemetry across language, embedding, reranking, speech, and transcription models.

## Task 1: Confirm OCI provider scope + serving modes

Prompt:

- Review `OCIConfig`, `OCILanguageModel`, and registry for on-demand vs dedicated endpoint support and endpoint override behavior.

Success criteria:

- Document current support matrix for serving modes and endpoint override.
- Identify precise code locations for adding dedicated endpoint support.

## Task 2: Map V3 call options to OCI request parameters

Prompt:

- Compare `LanguageModelV3CallOptions` with current request building in `OCILanguageModel`.

Success criteria:

- Explicit mapping list for `maxOutputTokens`, `temperature`, `topP`, `topK`, `presencePenalty`, `frequencyPenalty`, `stopSequences`, `responseFormat`, `toolChoice`, `tools`.
- Mark unsupported options with rationale.

## Task 3: OCI error surface inventory

Prompt:

- Inspect OCI error shapes and current `handleOCIError` implementation.

Success criteria:

- Define mapping rules to AI SDK error types, including `APICallError` and `InvalidResponseDataError`.
- Identify available error fields: status code, response headers, response body, request id.

## Task 4: Streaming error behavior alignment

Prompt:

- Review streaming parser and stream loop in `OCILanguageModel` for error and raw chunk handling.

Success criteria:

- Decide when to emit `{ type: 'error', error }` and `{ type: 'raw', rawValue }` parts.
- Keep try/catch for non-stream errors.

## Task 5: Telemetry fields plan

Prompt:

- Extract required telemetry fields from AI SDK telemetry docs.

Success criteria:

- Identify fields to populate in `request`, `response.headers`, `response.body`, and `providerMetadata`.
- Ensure `usage` is returned in finish parts for span attributes.

## Task 6: ProviderOptions design

Prompt:

- Propose `providerOptions.oci` for per-call overrides.

Success criteria:

- Typed shape agreed for serving mode overrides and request options.

## Task 7: Test impact analysis

Prompt:

- Identify tests that need updates or new coverage.

Success criteria:

- List concrete tests and new assertions for error mapping, stream error parts, and telemetry metadata.

## Task 8: Implementation sequence

Prompt:

- Define edit order to minimize breakage.

Success criteria:

- Step-by-step implementation sequence with dependencies.

## Task 9: Verification commands

Prompt:

- Define minimal test commands for the change set.

Success criteria:

- Agreed list of commands to run post-implementation.
