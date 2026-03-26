declare module 'oci-common' {
  export interface AuthenticationDetailsProvider {
    getKeyId(): Promise<string> | string;
    getPrivateKey(): string;
    getPassphrase(): string | null;
    getAuthType?(): string;
    getDelegationToken?(): string;
    getProvider?(): unknown;
    setProvider?(provider: unknown): void;
  }

  export interface ClientConfiguration {
    [key: string]: unknown;
  }

  export interface AuthParams {
    authenticationDetailsProvider?: AuthenticationDetailsProvider;
  }

  export class ConfigFileAuthenticationDetailsProvider implements AuthenticationDetailsProvider {
    constructor(configPath?: string, profile?: string);
    getKeyId(): Promise<string> | string;
    getPrivateKey(): string;
    getPassphrase(): string | null;
    getTenantId(): string;
    getUser(): string;
  }

  export class InstancePrincipalsAuthenticationDetailsProviderBuilder {
    build(): Promise<AuthenticationDetailsProvider>;
  }

  export const ResourcePrincipalAuthenticationDetailsProvider: {
    builder(): AuthenticationDetailsProvider;
  };

  export const ConfigFileReader: {
    DEFAULT_FILE_PATH: string;
    parseDefault(...args: any[]): Promise<any>;
  };

  export class Region {
    constructor(regionId?: string);
    static fromRegionId(regionId: string): Region;
    regionId?: string;
  }
}

declare module 'oci-generativeaiinference' {
  export class GenerativeAiInferenceClient {
    constructor(params: { authenticationDetailsProvider?: unknown }, clientConfiguration?: unknown);
    region: unknown;
    endpoint?: string;
    chat(request: unknown): Promise<any>;
    embedText(request: unknown): Promise<any>;
    applyGuardrails(request: unknown): Promise<any>;
    generateText(request: unknown): Promise<any>;
    rerankText(request: unknown): Promise<any>;
  }

  export namespace models {
    interface GenericChatRequest {
      [key: string]: any;
    }
    interface CohereChatRequest {
      [key: string]: any;
    }
    interface CohereChatRequestV2 {
      [key: string]: any;
    }
    interface ChatDetails {
      [key: string]: any;
    }
    interface ChatContent {
      [key: string]: any;
    }
    interface Message {
      [key: string]: any;
    }
    interface CohereContentV2 {
      [key: string]: any;
    }
    interface CohereImageUrlV2 {
      [key: string]: any;
    }
    interface CohereImageContentV2 {
      [key: string]: any;
    }
    interface CohereTextContentV2 {
      [key: string]: any;
    }
    interface CohereMessageV2 {
      [key: string]: any;
    }
    interface EmbedTextResult {
      [key: string]: any;
    }
    namespace EmbedTextDetails {
      type Truncate = 'NONE' | 'START' | 'END';
      type InputType =
        | 'SEARCH_DOCUMENT'
        | 'SEARCH_QUERY'
        | 'CLASSIFICATION'
        | 'CLUSTERING'
        | 'IMAGE';
      type EmbeddingTypes = 'float' | 'int8' | 'uint8' | 'binary' | 'ubinary' | 'base64';
    }
  }

  export const models: any;
}

declare module 'oci-aispeech' {
  export class AIServiceSpeechClient {
    constructor(params: { authenticationDetailsProvider?: unknown }, clientConfiguration?: unknown);
    region: unknown;
    regionId?: string;
    endpoint?: string;
    synthesizeSpeech(request: unknown): Promise<any>;
    createTranscriptionJob(request: unknown): Promise<any>;
    getTranscriptionJob(request: unknown): Promise<any>;
    createRealtimeSessionToken(request: unknown): Promise<any>;
    listTranscriptionTasks(request: unknown): Promise<any>;
    getTranscriptionTask(request: unknown): Promise<any>;
    listVoices(request: unknown): Promise<any>;
  }

  export namespace models {
    interface SynthesizeSpeechDetails {
      [key: string]: any;
    }
    interface CreateTranscriptionJobDetails {
      [key: string]: any;
    }
    interface TranscriptionModelDetails {
      [key: string]: any;
    }
    interface TtsOracleSpeechSettings {
      [key: string]: any;
    }
    namespace TranscriptionModelDetails {
      type LanguageCode = string;
      const LanguageCode: {
        EnUs: string;
        EsEs: string;
        PtBr: string;
        EnGb: string;
        EnAu: string;
        EnIn: string;
        HiIn: string;
        FrFr: string;
        DeDe: string;
        ItIt: string;
        En: string;
        Es: string;
        Fr: string;
        De: string;
        It: string;
        Auto: string;
      };
    }
    namespace TtsOracleSpeechSettings {
      const OutputFormat: {
        Pcm: string;
        Ogg: string;
        Mp3: string;
      };
      type OutputFormat = string;
    }
    namespace TranscriptionJob {
      const LifecycleState: {
        Succeeded: string;
        Failed: string;
      };
      type LifecycleState = string;
    }
  }

  export const models: any;
}

declare module 'oci-identity' {
  export class IdentityClient {
    constructor(params: { authenticationDetailsProvider?: unknown }, clientConfiguration?: unknown);
    region: unknown;
    endpoint?: string;
    listCompartments(request: unknown): Promise<any>;
    getUser(request: unknown): Promise<any>;
    getTenancy(request: unknown): Promise<any>;
  }

  export namespace models {
    interface Compartment {
      [key: string]: any;
    }
    namespace Compartment {
      type LifecycleState = string;
    }
  }
}

declare module 'oci-objectstorage' {
  export class ObjectStorageClient {
    constructor(params: { authenticationDetailsProvider?: unknown }, clientConfiguration?: unknown);
    region: unknown;
    endpoint?: string;
    putObject(request: unknown): Promise<any>;
    getObject(request: unknown): Promise<any>;
    deleteObject(request: unknown): Promise<any>;
    getNamespace(request: unknown): Promise<any>;
    headObject?(request: unknown): Promise<any>;
  }
}
