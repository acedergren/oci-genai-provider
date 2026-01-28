import { describe, it, expect, jest, beforeEach } from '@jest/globals';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock oci-aispeech - needs to be at top level
const mockCreateTranscriptionJob = jest.fn<any>();
const mockGetTranscriptionJob = jest.fn<any>();
const mockListTranscriptionTasks = jest.fn<any>();
const mockGetTranscriptionTask = jest.fn<any>();

jest.mock('oci-aispeech', () => ({
  AIServiceSpeechClient: jest.fn().mockImplementation(() => ({
    region: null,
    endpoint: null,
    createTranscriptionJob: mockCreateTranscriptionJob,
    getTranscriptionJob: mockGetTranscriptionJob,
    listTranscriptionTasks: mockListTranscriptionTasks,
    getTranscriptionTask: mockGetTranscriptionTask,
  })),
  models: {
    TranscriptionModelDetails: {
      LanguageCode: {
        EnUs: 'en-US',
        EsEs: 'es-ES',
        En: 'en',
        Auto: 'auto',
      },
    },
    TranscriptionJob: {
      LifecycleState: {
        Succeeded: 'SUCCEEDED',
        Failed: 'FAILED',
        InProgress: 'IN_PROGRESS',
      },
    },
  },
}));

// Mock oci-common
jest.mock('oci-common', () => ({
  ConfigFileAuthenticationDetailsProvider: jest.fn().mockImplementation(() => ({})),
  InstancePrincipalsAuthenticationDetailsProviderBuilder: jest.fn().mockImplementation(() => ({
    // @ts-expect-error - Mock implementation for testing
    build: jest.fn().mockResolvedValue({}),
  })),
  ResourcePrincipalAuthenticationDetailsProvider: {
    builder: jest.fn().mockReturnValue({}),
  },
  Region: {
    fromRegionId: jest.fn().mockReturnValue({ regionId: 'eu-frankfurt-1' }),
  },
}));

// Mock Object Storage functions
const mockUploadAudioToObjectStorage = jest.fn<any>();
const mockDeleteFromObjectStorage = jest.fn<any>();
const mockGenerateAudioObjectName = jest.fn<any>();

jest.mock('../../shared/storage/object-storage', () => ({
  uploadAudioToObjectStorage: mockUploadAudioToObjectStorage,
  deleteFromObjectStorage: mockDeleteFromObjectStorage,
  generateAudioObjectName: mockGenerateAudioObjectName,
}));

// Import after mocks
import { OCITranscriptionModel } from '../OCITranscriptionModel';

describe('OCITranscriptionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockGenerateAudioObjectName.mockReturnValue('test-audio.wav');
    mockUploadAudioToObjectStorage.mockResolvedValue({
      namespaceName: 'test-namespace',
      bucketName: 'test-bucket',
      objectName: 'test-audio.wav',
    });
    mockDeleteFromObjectStorage.mockResolvedValue(undefined);
    mockCreateTranscriptionJob.mockResolvedValue({
      transcriptionJob: { id: 'test-job-id' },
    });
    mockGetTranscriptionJob.mockResolvedValue({
      transcriptionJob: {
        lifecycleState: 'SUCCEEDED',
        lifecycleDetails: null,
      },
    });
    mockListTranscriptionTasks.mockResolvedValue({
      transcriptionTaskCollection: {
        items: [{ id: 'test-task-id' }],
      },
    });
    mockGetTranscriptionTask.mockResolvedValue({
      transcriptionTask: {
        id: 'test-task-id',
      },
    });
  });

  it('should have correct specification version and provider', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      compartmentId: 'ocid1.compartment.test',
    });

    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('oci.speech.standard');
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCITranscriptionModel('invalid-model', {});
    }).toThrow('Invalid transcription model ID');
  });

  it('should accept language setting', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      language: 'en-US',
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
  });

  it('should accept custom vocabulary for standard model', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      vocabulary: ['OpenCode', 'GenAI', 'OCI'],
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
  });

  it('should warn about vocabulary for Whisper model', () => {
    // Whisper does not support custom vocabulary
    const model = new OCITranscriptionModel('oci.speech.whisper', {
      vocabulary: ['test'],
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
    // Note: Implementation should log warning, not throw
  });

  describe('audio validation', () => {
    it('should throw error when audio exceeds 2GB limit', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      // Create a small array but mock the byteLength to simulate 3GB
      const largeAudio = new Uint8Array(1);
      Object.defineProperty(largeAudio, 'byteLength', {
        value: 3 * 1024 * 1024 * 1024,
      });
      await expect(
        model.doGenerate({ audio: largeAudio, mediaType: 'audio/wav' })
      ).rejects.toThrow('Audio file size');
    });

    it('should accept audio under 2GB limit', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({
        audio: new Uint8Array(1000),
        mediaType: 'audio/wav',
      });
      expect(result.text).toBeDefined();
    });
  });

  describe('response structure', () => {
    it('should return all required TranscriptionOutput properties', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({ audio: new Uint8Array(100), mediaType: 'audio/wav' });

      expect(result.text).toBeDefined();
      expect(result.segments).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.response).toBeDefined();
      expect(result.response.timestamp).toBeInstanceOf(Date);
      expect(result.response.modelId).toBe('oci.speech.standard');
      expect('language' in result).toBe(true);
      expect('durationInSeconds' in result).toBe(true);
    });

    it('should include providerMetadata with jobId', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({ audio: new Uint8Array(100), mediaType: 'audio/wav' });

      expect(result.providerMetadata).toBeDefined();
      expect(result.providerMetadata?.oci).toBeDefined();
    });
  });

  describe('warnings', () => {
    it('should add warning when using vocabulary with Whisper model', async () => {
      const model = new OCITranscriptionModel('oci.speech.whisper', {
        compartmentId: 'test',
        vocabulary: ['custom', 'terms'],
      });
      const result = await model.doGenerate({ audio: new Uint8Array(100), mediaType: 'audio/wav' });
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('other');
    });

    it('should have empty warnings when vocabulary not used', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({ audio: new Uint8Array(100), mediaType: 'audio/wav' });
      expect(result.warnings).toEqual([]);
    });
  });

  describe('language handling', () => {
    it('should return configured language', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
        language: 'es-ES',
      });
      const result = await model.doGenerate({ audio: new Uint8Array(100), mediaType: 'audio/wav' });
      expect(result.language).toBe('es-ES');
    });

    it('should return undefined when language not configured', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({ audio: new Uint8Array(100), mediaType: 'audio/wav' });
      expect(result.language).toBeUndefined();
    });
  });

  describe('Object Storage integration', () => {
    it('should use custom bucket when configured', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
        transcriptionBucket: 'my-custom-bucket',
      });

      await model.doGenerate({ audio: new Uint8Array(100), mediaType: 'audio/wav' });

      expect(mockUploadAudioToObjectStorage).toHaveBeenCalledWith(
        expect.anything(),
        'my-custom-bucket',
        expect.any(String),
        expect.any(Uint8Array)
      );
    });

    it('should cleanup uploaded file after transcription', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });

      await model.doGenerate({ audio: new Uint8Array(100), mediaType: 'audio/wav' });

      expect(mockDeleteFromObjectStorage).toHaveBeenCalled();
    });
  });
});
