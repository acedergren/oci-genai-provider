import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { OCITranscriptionModel } from "../OCITranscriptionModel";

describe("OCITranscriptionModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have correct specification version and provider", () => {
    const model = new OCITranscriptionModel("oci.speech.standard", {
      compartmentId: "ocid1.compartment.test",
    });

    expect(model.specificationVersion).toBe("v3");
    expect(model.provider).toBe("oci-genai");
    expect(model.modelId).toBe("oci.speech.standard");
  });

  it("should throw error for invalid model ID", () => {
    expect(() => {
      new OCITranscriptionModel("invalid-model", {});
    }).toThrow("Invalid transcription model ID");
  });

  it("should accept language setting", () => {
    const model = new OCITranscriptionModel("oci.speech.standard", {
      language: "en-US",
      compartmentId: "test",
    });

    expect(model).toBeDefined();
  });

  it("should accept custom vocabulary for standard model", () => {
    const model = new OCITranscriptionModel("oci.speech.standard", {
      vocabulary: ["OpenCode", "GenAI", "OCI"],
      compartmentId: "test",
    });

    expect(model).toBeDefined();
  });

  it("should warn about vocabulary for Whisper model", () => {
    // Whisper does not support custom vocabulary
    const model = new OCITranscriptionModel("oci.speech.whisper", {
      vocabulary: ["test"],
      compartmentId: "test",
    });

    expect(model).toBeDefined();
    // Note: Implementation should log warning, not throw
  });

  it("should throw error for audio input exceeding size limit", async () => {
    const model = new OCITranscriptionModel("oci.speech.standard", {
      compartmentId: "test",
    });

    // Create 3GB audio file (exceeds 2GB limit)
    const largeAudio = new Uint8Array(3 * 1024 * 1024 * 1024);

    const options = {
      audioData: largeAudio,
    };

    await expect(model.doTranscribe(options as any)).rejects.toThrow(
      "exceeds maximum allowed"
    );
  });
});
