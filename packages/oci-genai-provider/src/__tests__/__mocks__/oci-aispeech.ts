export class AIServiceSpeechClient {
  region: unknown;
  regionId?: string;
  endpoint?: string;

  constructor(_params: { authenticationDetailsProvider: unknown }) {}

  synthesizeSpeech(_request: unknown): Promise<unknown> {
    return Promise.resolve({});
  }

  createTranscriptionJob(_request: unknown): Promise<unknown> {
    return Promise.resolve({});
  }

  getTranscriptionJob(_request: unknown): Promise<unknown> {
    return Promise.resolve({});
  }

  createRealtimeSessionToken(_request: unknown): Promise<unknown> {
    return Promise.resolve({ realtimeSessionToken: { token: 'mock-token' } });
  }

  listTranscriptionTasks(_request: unknown): Promise<unknown> {
    return Promise.resolve({ transcriptionTaskCollection: { items: [] } });
  }

  getTranscriptionTask(_request: unknown): Promise<unknown> {
    return Promise.resolve({});
  }
}

export const models = {
  TtsOracleSpeechSettings: {
    OutputFormat: {
      Pcm: 'PCM',
      Ogg: 'OGG',
      Mp3: 'MP3',
    },
  },
  TranscriptionModelDetails: {
    LanguageCode: {
      EnUs: 'en-US',
      EsEs: 'es-ES',
      PtBr: 'pt-BR',
      EnGb: 'en-GB',
      EnAu: 'en-AU',
      EnIn: 'en-IN',
      HiIn: 'hi-IN',
      FrFr: 'fr-FR',
      DeDe: 'de-DE',
      ItIt: 'it-IT',
      En: 'en',
      Es: 'es',
      Fr: 'fr',
      De: 'de',
      It: 'it',
      Auto: 'auto',
    },
  },
  TranscriptionJob: {
    LifecycleState: {
      Succeeded: 'SUCCEEDED',
      Failed: 'FAILED',
    },
  },
};
