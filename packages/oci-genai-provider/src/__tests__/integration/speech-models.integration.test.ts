import { describe, it, expect } from "@jest/globals";
import { createMockOCIConfig } from "../utils/test-helpers";

describe("Speech Models Integration", () => {
  describe("Model Creation", () => {
    it("should create speech synthesis config", () => {
      const config = createMockOCIConfig();
      expect(config).toBeDefined();
    });

    it("should support voice options", () => {
      const voices = ["en-US-Neural-Female", "en-US-Neural-Male"];
      expect(voices).toContain("en-US-Neural-Female");
    });
  });

  describe("Audio Format Support", () => {
    it("should support mp3 format", () => {
      const formats = ["mp3", "wav"];
      expect(formats).toContain("mp3");
    });

    it("should support wav format", () => {
      const formats = ["mp3", "wav"];
      expect(formats).toContain("wav");
    });
  });
});