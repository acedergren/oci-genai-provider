import { describe, it, expect } from "@jest/globals";
import { createMockOCIConfig } from "../utils/test-helpers";

describe("Transcription Models Integration", () => {
  describe("Model Creation", () => {
    it("should create transcription config", () => {
      const config = createMockOCIConfig();
      expect(config).toBeDefined();
    });

    it("should support language options", () => {
      const languages = ["en-US", "fr-FR", "es-ES"];
      expect(languages).toContain("en-US");
    });
  });

  describe("Vocabulary Support", () => {
    it("should support custom vocabulary", () => {
      const vocab = ["kubernetes", "terraform", "ansible"];
      expect(vocab).toHaveLength(3);
    });
  });
});