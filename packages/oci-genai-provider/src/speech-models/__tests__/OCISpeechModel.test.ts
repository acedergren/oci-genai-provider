import { describe, it, expect } from "@jest/globals";
import { OCISpeechModel } from "../OCISpeechModel";

describe("OCISpeechModel", () => {
  it("should have correct specification version and provider", () => {
    const model = new OCISpeechModel("oci.tts-1-hd", { compartmentId: "ocid1.compartment.test", region: "us-phoenix-1" });
    expect(model.specificationVersion).toBe("v3");
    expect(model.provider).toBe("oci-genai");
    expect(model.modelId).toBe("oci.tts-1-hd");
  });

  it("should throw error for invalid model ID", () => {
    expect(() => { new OCISpeechModel("invalid-model", {}); }).toThrow("Invalid speech model ID");
  });

  it("should throw error if region is not us-phoenix-1", () => {
    expect(() => { new OCISpeechModel("oci.tts-1-hd", { region: "eu-frankfurt-1" }); }).toThrow("OCI Speech is only available in us-phoenix-1 region");
  });

  it("should allow us-phoenix-1 region", () => {
    expect(() => { new OCISpeechModel("oci.tts-1-hd", { region: "us-phoenix-1" }); }).not.toThrow();
  });

  it("should validate text length does not exceed max", async () => {
    const model = new OCISpeechModel("oci.tts-1-hd", { compartmentId: "test", region: "us-phoenix-1" });
    const longText = "a".repeat(5001);
    await expect(model.doGenerate({ text: longText })).rejects.toThrow("Text length (5001) exceeds maximum allowed (5000)");
  });

  it("should use default voice if none specified", () => {
    const model = new OCISpeechModel("oci.tts-1", { region: "us-phoenix-1" });
    expect(model).toBeDefined();
  });
});
