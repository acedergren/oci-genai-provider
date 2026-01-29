import type { ModelMetadata } from '../types';

export const MODEL_CATALOG: ModelMetadata[] = [
  // Grok models
  {
    id: 'xai.grok-4-maverick',
    name: 'Grok 4 Maverick',
    family: 'grok',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'very-fast',
  },
  {
    id: 'xai.grok-4-scout',
    name: 'Grok 4 Scout',
    family: 'grok',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'very-fast',
  },
  {
    id: 'xai.grok-3',
    name: 'Grok 3',
    family: 'grok',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  {
    id: 'xai.grok-3-mini',
    name: 'Grok 3 Mini',
    family: 'grok',
    capabilities: { streaming: true, tools: false, vision: false },
    contextWindow: 131072,
    speed: 'very-fast',
  },
  // Llama models
  {
    id: 'meta.llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    family: 'llama',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  {
    id: 'meta.llama-3.2-vision-90b-instruct',
    name: 'Llama 3.2 Vision 90B',
    family: 'llama',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 131072,
    speed: 'medium',
  },
  {
    id: 'meta.llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    family: 'llama',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'slow',
  },
  {
    id: 'meta.llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    family: 'llama',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  // Cohere models - latest aliases (recommended)
  {
    id: 'cohere.command-plus-latest',
    name: 'Command R+ Latest',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  {
    id: 'cohere.command-latest',
    name: 'Command R Latest',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  // Cohere models - versioned
  {
    id: 'cohere.command-r-plus-08-2024',
    name: 'Command R+ (Aug 2024)',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  {
    id: 'cohere.command-r-08-2024',
    name: 'Command R (Aug 2024)',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  {
    id: 'cohere.command-a-03-2025',
    name: 'Command A (Mar 2025)',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  // Cohere models - legacy (retired from on-demand, kept for dedicated clusters)
  {
    id: 'cohere.command-r-plus',
    name: 'Command R+ (Legacy)',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  {
    id: 'cohere.command-r',
    name: 'Command R (Legacy)',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  {
    id: 'cohere.command-a',
    name: 'Command A',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  {
    id: 'cohere.command-a-reasoning',
    name: 'Command A Reasoning',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'medium',
  },
  {
    id: 'cohere.command-a-vision',
    name: 'Command A Vision',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 131072,
    speed: 'medium',
  },
  // Gemini models
  {
    id: 'google.gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    family: 'gemini',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 1048576,
    speed: 'medium',
  },
  {
    id: 'google.gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    family: 'gemini',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 1048576,
    speed: 'fast',
  },
  {
    id: 'google.gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    family: 'gemini',
    capabilities: { streaming: true, tools: false, vision: true },
    contextWindow: 1048576,
    speed: 'very-fast',
  },
];

export function isValidModelId(modelId: string): boolean {
  return MODEL_CATALOG.some((m) => m.id === modelId);
}

export function getModelMetadata(modelId: string): ModelMetadata | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}

export function getAllModels(): ModelMetadata[] {
  return MODEL_CATALOG;
}

export function getModelsByFamily(family: ModelMetadata['family']): ModelMetadata[] {
  return MODEL_CATALOG.filter((m) => m.family === family);
}
