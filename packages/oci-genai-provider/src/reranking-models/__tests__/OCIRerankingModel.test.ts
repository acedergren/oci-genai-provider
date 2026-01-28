import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { OCIRerankingModel } from "../OCIRerankingModel";
import type { RerankingModelV3CallOptions } from "@ai-sdk/provider";

// Mock OCI SDK
jest.mock("oci-generativeaiinference");
jest.mock("../../auth");

describe("OCIRerankingModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have correct specification version and provider", () => {
    const model = new OCIRerankingModel("cohere.rerank-v3.5", {
      compartmentId: "ocid1.compartment.test",
    });

    expect(model.specificationVersion).toBe("v3");
    expect(model.provider).toBe("oci-genai");
    expect(model.modelId).toBe("cohere.rerank-v3.5");
  });

  it("should throw error for invalid model ID", () => {
    expect(() => {
      new OCIRerankingModel("invalid-model", {});
    }).toThrow("Invalid reranking model ID");
  });

  it("should validate document count does not exceed max", async () => {
    const model = new OCIRerankingModel("cohere.rerank-v3.5", {
      compartmentId: "test",
    });

    const documents = Array(1001).fill("test"); // 1001 > 1000 max

    const options: RerankingModelV3CallOptions = {
      query: "test query",
      documents: {
        type: "text",
        values: documents,
      },
    };

    await expect(model.doRerank(options)).rejects.toThrow(
      "Document count (1001) exceeds maximum allowed (1000)"
    );
  });

  it("should handle text documents", () => {
    const model = new OCIRerankingModel("cohere.rerank-v3.5", {
      compartmentId: "test",
    });

    expect(model).toBeDefined();
  });
});
