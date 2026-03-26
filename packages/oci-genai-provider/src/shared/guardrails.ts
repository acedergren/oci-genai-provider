import type { JSONObject } from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import type { OCIProviderOptions, OCIGuardrailsMetadata, OCIConfig } from '../types';

const DEFAULT_CONTENT_MODERATION_CATEGORIES = ['OVERALL', 'BLOCKLIST'];
const DEFAULT_PII_TYPES = ['PERSON', 'EMAIL', 'TELEPHONE_NUMBER'];
const DEFAULT_PROMPT_INJECTION_THRESHOLD = 0.5;

function hasInputGuardrails(
  guardrails: OCIProviderOptions['guardrails']
): guardrails is NonNullable<OCIProviderOptions['guardrails']> {
  return Boolean(
    guardrails?.input &&
    (guardrails.input.promptInjection || guardrails.input.contentModeration || guardrails.input.pii)
  );
}

export async function applyInputGuardrails(
  client: GenerativeAiInferenceClient,
  compartmentId: string,
  inputText: string,
  guardrails: OCIProviderOptions['guardrails']
): Promise<OCIGuardrailsMetadata | undefined> {
  if (!inputText.trim() || !hasInputGuardrails(guardrails)) {
    return undefined;
  }

  const input = guardrails.input!;
  const response = await client.applyGuardrails({
    applyGuardrailsDetails: {
      compartmentId,
      input: {
        type: 'TEXT',
        content: inputText,
        languageCode: input.languageCode,
      },
      guardrailConfigs: {
        ...(input.contentModeration
          ? {
              contentModerationConfig: {
                categories:
                  input.contentModeration.categories ?? DEFAULT_CONTENT_MODERATION_CATEGORIES,
              },
            }
          : {}),
        ...(input.promptInjection ? { promptInjectionConfig: {} } : {}),
        ...(input.pii
          ? {
              personallyIdentifiableInformationConfig: {
                types: input.pii.types ?? DEFAULT_PII_TYPES,
              },
            }
          : {}),
      },
    },
  });

  const results = response.applyGuardrailsResult.results;
  const metadata: OCIGuardrailsMetadata = {
    blocked: false,
    input: {
      contentModeration: results.contentModeration?.categories?.map((category: any) => ({
        category: category.name ?? 'UNKNOWN',
        score: category.score ?? 0,
      })),
      promptInjectionScore: results.promptInjection?.score,
      pii: results.personallyIdentifiableInformation?.map((entry: any) => ({
        text: entry.text,
        label: entry.label,
        score: entry.score,
        offset: entry.offset,
        length: entry.length,
      })),
    },
  };

  if (input.failOnDetection && shouldBlockGuardrails(metadata, input.promptInjectionThreshold)) {
    metadata.blocked = true;
    throw new Error('OCI AI Guardrails blocked the request input before inference.');
  }

  return metadata;
}

export function getInputGuardrailText(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join('\n\n');
}

export function toJSONGuardrailsMetadata(metadata: OCIGuardrailsMetadata): JSONObject {
  return JSON.parse(JSON.stringify(metadata)) as JSONObject;
}

function shouldBlockGuardrails(
  metadata: OCIGuardrailsMetadata,
  promptInjectionThreshold = DEFAULT_PROMPT_INJECTION_THRESHOLD
): boolean {
  const hasUnsafeModeration =
    metadata.input.contentModeration?.some((category) => category.score >= 0.5) ?? false;
  const hasPII = (metadata.input.pii?.length ?? 0) > 0;
  const hasPromptInjection = (metadata.input.promptInjectionScore ?? 0) >= promptInjectionThreshold;

  return hasUnsafeModeration || hasPII || hasPromptInjection;
}

export function getEffectiveGuardrailsWarning(
  config: OCIConfig,
  guardrails: OCIProviderOptions['guardrails']
): string | undefined {
  if (config.auth === 'api_key' && guardrails?.input) {
    return 'OCI AI Guardrails preflight is not available on the api_key transport path in this provider yet.';
  }

  return undefined;
}
