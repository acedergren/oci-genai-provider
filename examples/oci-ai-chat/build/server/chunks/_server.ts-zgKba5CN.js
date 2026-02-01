import { j as json } from './index-CoD1IJuy.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';
import { execFileSync } from 'child_process';

const MODEL_METADATA = {
  // Google Gemini
  "google.gemini-2.5-pro": { name: "Gemini 2.5 Pro", description: "Most capable Gemini model" },
  "google.gemini-2.5-flash": { name: "Gemini 2.5 Flash", description: "Fast and efficient Gemini" },
  "google.gemini-2.5-flash-lite": { name: "Gemini 2.5 Flash-Lite", description: "Lightweight for cost efficiency" },
  // Meta Llama 4
  "meta.llama-4-maverick": { name: "Llama 4 Maverick", description: "Flagship Llama 4 MoE model" },
  "meta.llama-4-scout": { name: "Llama 4 Scout", description: "Efficient Llama 4 MoE" },
  // Meta Llama 3.x
  "meta.llama-3.3-70b-instruct": { name: "Llama 3.3 70B", description: "Fast, capable general-purpose" },
  "meta.llama-3.2-90b-vision-instruct": { name: "Llama 3.2 90B Vision", description: "Multimodal with vision" },
  "meta.llama-3.2-11b-vision-instruct": { name: "Llama 3.2 11B Vision", description: "Lightweight multimodal" },
  "meta.llama-3.1-405b-instruct": { name: "Llama 3.1 405B", description: "Most capable Llama 3" },
  "meta.llama-3.1-70b-instruct": { name: "Llama 3.1 70B", description: "Balanced performance" },
  // Cohere
  "cohere.command-a-03-2025": { name: "Command A", description: "Latest Cohere with tool use" },
  "cohere.command-a-reasoning": { name: "Command A Reasoning", description: "Complex reasoning tasks" },
  "cohere.command-a-vision": { name: "Command A Vision", description: "Multimodal Command" },
  "cohere.command-r-plus-08-2024": { name: "Command R+ (08-2024)", description: "Advanced RAG" },
  "cohere.command-r-plus": { name: "Command R+", description: "Enterprise RAG" },
  "cohere.command-r-08-2024": { name: "Command R (08-2024)", description: "Fast and efficient" },
  "cohere.command-r": { name: "Command R", description: "Scalable enterprise" },
  // xAI Grok
  "xai.grok-4": { name: "Grok 4", description: "Flagship Grok model" },
  "xai.grok-4-fast": { name: "Grok 4 Fast", description: "Optimized for speed" },
  "xai.grok-4.1-fast": { name: "Grok 4.1 Fast", description: "Updated fast Grok" },
  "xai.grok-3": { name: "Grok 3", description: "Capable reasoning" },
  "xai.grok-3-mini": { name: "Grok 3 Mini", description: "Efficient smaller Grok" },
  "xai.grok-3-fast": { name: "Grok 3 Fast", description: "Fast Grok 3" },
  "xai.grok-3-mini-fast": { name: "Grok 3 Mini Fast", description: "Fastest small Grok" },
  "xai.grok-code-fast-1": { name: "Grok Code Fast", description: "Optimized for code" }
};
const GET = async () => {
  const region = private_env.OCI_REGION || process.env.OCI_REGION || "us-chicago-1";
  const compartmentId = private_env.OCI_COMPARTMENT_ID || process.env.OCI_COMPARTMENT_ID;
  try {
    const models = fetchOCIModels(compartmentId, region);
    return json({ models, region });
  } catch (error) {
    console.error("Failed to fetch OCI models:", error);
    return json({ models: getFallbackModels(), region, fallback: true });
  }
};
function fetchOCIModels(compartmentId, region) {
  try {
    const args = ["generative-ai", "model", "list", "--region", region, "--all"];
    if (compartmentId) {
      args.push("--compartment-id", compartmentId);
    }
    const output = execFileSync("oci", args, { encoding: "utf-8", timeout: 3e4 });
    const result = JSON.parse(output);
    if (!result.data?.items) {
      return getFallbackModels();
    }
    return result.data.items.filter(
      (model) => model.capabilities?.includes("CHAT") || model.capabilities?.includes("TEXT_GENERATION")
    ).map((model) => {
      const metadata = MODEL_METADATA[model.id] || {
        name: model["display-name"] || model.id,
        description: "OCI GenAI model"
      };
      return {
        id: model.id,
        name: metadata.name,
        description: metadata.description,
        capabilities: model.capabilities || []
      };
    });
  } catch {
    return getFallbackModels();
  }
}
function getFallbackModels() {
  return [
    { id: "meta.llama-3.3-70b-instruct", name: "Llama 3.3 70B", description: "Fast, capable general-purpose", capabilities: ["CHAT"] },
    { id: "meta.llama-3.1-405b-instruct", name: "Llama 3.1 405B", description: "Most capable Llama 3", capabilities: ["CHAT"] },
    { id: "cohere.command-a-03-2025", name: "Command A", description: "Latest Cohere with tool use", capabilities: ["CHAT"] },
    { id: "cohere.command-r-plus-08-2024", name: "Command R+ (08-2024)", description: "Advanced RAG", capabilities: ["CHAT"] },
    { id: "cohere.command-r-08-2024", name: "Command R (08-2024)", description: "Fast and efficient", capabilities: ["CHAT"] }
  ];
}

export { GET };
//# sourceMappingURL=_server.ts-zgKba5CN.js.map
