import type {
  LanguageModelV3FunctionTool,
  LanguageModelV3ToolChoice,
  LanguageModelV3ToolCall,
} from '@ai-sdk/provider';
import type { OCIApiFormat } from '../../shared/oci-sdk-types';

/**
 * OCI GENERIC format tool definition (FunctionDefinition)
 */
export interface OCIFunctionDefinition {
  type: 'FUNCTION';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * OCI COHERE format tool definition (CohereTool)
 */
export interface OCICohereTool {
  name: string;
  description: string;
  parameterDefinitions?: Record<string, OCICohereParameterDefinition>;
}

interface OCICohereParameterDefinition {
  type: string;
  description?: string;
  /** OCI Cohere uses isRequired in parameterDefinitions. */
  isRequired?: boolean;
}

interface JSONSchemaProperty {
  type?: string | string[];
  description?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  items?: JSONSchemaProperty | JSONSchemaProperty[];
  enum?: unknown[];
  anyOf?: JSONSchemaProperty[];
  oneOf?: JSONSchemaProperty[];
}

/**
 * OCI tool choice types
 */
interface OCIToolChoiceAuto {
  type: 'AUTO';
}

interface OCIToolChoiceRequired {
  type: 'REQUIRED';
}

interface OCIToolChoiceNone {
  type: 'NONE';
}

interface OCIToolChoiceFunction {
  type: 'FUNCTION';
  function: { name: string };
}

export type OCIToolChoice =
  | OCIToolChoiceAuto
  | OCIToolChoiceRequired
  | OCIToolChoiceNone
  | OCIToolChoiceFunction;

/**
 * OCI GENERIC format tool call (from response)
 */
export interface OCIFunctionCall {
  id: string;
  type: 'FUNCTION';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * OCI COHERE format tool call (from response)
 */
export interface OCICohereToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

export type OCIToolDefinition = OCIFunctionDefinition | OCICohereTool;
export type OCIToolCall = OCIFunctionCall | OCICohereToolCall;

/**
 * Converts AI SDK v3 function tools to OCI format.
 * AI SDK v3 uses `inputSchema` for the JSON schema, which maps to OCI's `parameters`.
 */
export function convertToOCITools(
  tools: LanguageModelV3FunctionTool[],
  apiFormat: OCIApiFormat
): OCIToolDefinition[] {
  if (apiFormat === 'COHERE' || apiFormat === 'COHEREV2') {
    return tools.map((tool) => convertToCohereToolFormat(tool));
  }
  return tools.map((tool) => convertToGenericToolFormat(tool));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchema);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const sanitized = { ...schema };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  delete sanitized.$schema;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  delete sanitized['$ref'];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  for (const [key, value] of Object.entries(sanitized)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    sanitized[key] = sanitizeSchema(value);
  }

  return sanitized;
}

function convertToGenericToolFormat(tool: LanguageModelV3FunctionTool): OCIFunctionDefinition {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parameters = sanitizeSchema(tool.inputSchema as Record<string, unknown>) || {};

  // Ensure the schema has a type 'object'
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!parameters.type) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    parameters.type = 'object';
  }

  return {
    type: 'FUNCTION',
    name: tool.name,
    description: tool.description ?? '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    parameters,
  };
}

function convertToCohereToolFormat(tool: LanguageModelV3FunctionTool): OCICohereTool {
  const schema = tool.inputSchema as JSONSchemaProperty;

  const parameterDefinitions: Record<string, OCICohereParameterDefinition> = {};

  if (schema?.properties) {
    const required = schema.required ?? [];
    for (const [key, value] of Object.entries(schema.properties)) {
      parameterDefinitions[key] = {
        type: jsonSchemaToCohereType(value),
        description: buildCohereParameterDescription(value),
        isRequired: required.includes(key),
      };
    }
  }

  return {
    name: tool.name,
    description: tool.description ?? '',
    parameterDefinitions:
      Object.keys(parameterDefinitions).length > 0 ? parameterDefinitions : undefined,
  };
}

function resolveSchemaVariant(schema: JSONSchemaProperty): JSONSchemaProperty {
  const variant = schema.anyOf ?? schema.oneOf;
  if (!variant || variant.length === 0) {
    return schema;
  }

  const preferred = variant.find((entry) => {
    const type = entry.type;
    if (Array.isArray(type)) {
      return type.some((value) => value !== 'null');
    }
    return type !== 'null';
  });

  return preferred ?? variant[0] ?? schema;
}

function normalizeSchemaType(schema: JSONSchemaProperty): string | undefined {
  const type = schema.type;

  if (Array.isArray(type)) {
    return type.find((value) => value !== 'null') ?? type[0];
  }

  return type;
}

function jsonSchemaToCohereType(rawSchema: JSONSchemaProperty): string {
  const schema = resolveSchemaVariant(rawSchema);
  const normalizedType = normalizeSchemaType(schema);

  switch (normalizedType) {
    case 'string':
      return 'str';
    case 'integer':
      return 'int';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    case 'array': {
      const itemSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
      return itemSchema ? `List[${jsonSchemaToCohereType(itemSchema)}]` : 'List';
    }
    case 'object': {
      const propertyTypes = Object.values(schema.properties ?? {}).map((property) =>
        jsonSchemaToCohereType(property)
      );
      const uniquePropertyTypes = Array.from(new Set(propertyTypes));

      if (uniquePropertyTypes.length === 1) {
        return `Dict[str, ${uniquePropertyTypes[0]}]`;
      }

      return 'Dict';
    }
    case 'null':
      return 'None';
    default:
      return normalizedType ?? inferEnumType(schema.enum) ?? 'str';
  }
}

function inferEnumType(values?: unknown[]): string | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  const firstValue = values[0];

  switch (typeof firstValue) {
    case 'string':
      return 'str';
    case 'boolean':
      return 'bool';
    case 'number':
      return Number.isInteger(firstValue) ? 'int' : 'float';
    default:
      return undefined;
  }
}

function buildCohereParameterDescription(schema: JSONSchemaProperty): string | undefined {
  const parts: string[] = [];

  if (schema.description) {
    parts.push(schema.description);
  }

  if (schema.enum && schema.enum.length > 0) {
    parts.push(`Allowed values: ${schema.enum.map(formatEnumValue).join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' ') : undefined;
}

function formatEnumValue(value: unknown): string {
  return typeof value === 'string' ? `"${value}"` : String(value);
}

/**
 * Converts AI SDK v3 tool choice to OCI format.
 */
export function convertToOCIToolChoice(choice: LanguageModelV3ToolChoice): OCIToolChoice {
  switch (choice.type) {
    case 'auto':
      return { type: 'AUTO' };
    case 'required':
      return { type: 'REQUIRED' };
    case 'none':
      return { type: 'NONE' };
    case 'tool':
      return {
        type: 'FUNCTION',
        function: { name: choice.toolName },
      };
    default:
      return { type: 'AUTO' };
  }
}

/**
 * Converts OCI tool calls from response to AI SDK v3 format.
 */
export function convertFromOCIToolCalls(
  toolCalls: OCIToolCall[],
  apiFormat: OCIApiFormat
): LanguageModelV3ToolCall[] {
  if (apiFormat === 'COHERE' || apiFormat === 'COHEREV2') {
    return toolCalls.map((call, index) =>
      convertFromCohereToolCall(call as OCICohereToolCall, index)
    );
  }
  return toolCalls.map((call) => convertFromGenericToolCall(call as OCIFunctionCall));
}

function convertFromGenericToolCall(call: OCIFunctionCall): LanguageModelV3ToolCall {
  // AI SDK v3 uses 'input' as a stringified JSON, not 'args' as an object
  return {
    type: 'tool-call',
    toolCallId: call.id,
    toolName: call.function.name,
    input: call.function.arguments,
  };
}

function convertFromCohereToolCall(
  call: OCICohereToolCall,
  index: number
): LanguageModelV3ToolCall {
  // Cohere doesn't provide tool call IDs, generate one
  const toolCallId = `tool-call-${Date.now()}-${index}`;

  // AI SDK v3 uses 'input' as a stringified JSON
  return {
    type: 'tool-call',
    toolCallId,
    toolName: call.name,
    input: JSON.stringify(call.parameters ?? {}),
  };
}

/**
 * Check if a model supports tool calling.
 * Currently supported: Llama 3.1+, Grok, Gemini, Cohere Command models, OpenAI (GPT-OSS)
 */
export function supportsToolCalling(modelId: string): boolean {
  const supportedPatterns = [
    /^meta\.llama-3\.[1-9]/, // Llama 3.1+
    /^cohere\.command-(r|a)/, // Cohere Command R/R+ and Command A family
    /^xai\.grok/, // Grok models
    /^google\.gemini/, // Gemini models
    /^openai\./, // OpenAI models (GPT-OSS on OCI GenAI)
  ];

  return supportedPatterns.some((pattern) => pattern.test(modelId));
}
