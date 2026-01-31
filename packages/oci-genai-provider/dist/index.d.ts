import { ProviderV3, LanguageModelV3, EmbeddingModelV3, ImageModelV3, TranscriptionModelV3, SpeechModelV3, RerankingModelV3, LanguageModelV3CallOptions, LanguageModelV3GenerateResult, LanguageModelV3StreamResult, EmbeddingModelV3CallOptions, EmbeddingModelV3Result, TranscriptionModelV3CallOptions, SharedV3Warning, JSONObject, RerankingModelV3CallOptions, SpeechModelV3CallOptions, SharedV2Headers, AISDKError } from '@ai-sdk/provider';

interface RequestOptions {
    timeoutMs?: number;
    retry?: {
        enabled?: boolean;
        maxRetries?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
    };
}
type OCIServingType = 'ON_DEMAND' | 'DEDICATED';
interface OCIServingMode {
    type: OCIServingType;
    modelId?: string;
    endpointId?: string;
}
type OCIAuthMethod = 'config_file' | 'instance_principal' | 'resource_principal';
interface OCIConfig {
    region?: string;
    profile?: string;
    auth?: OCIAuthMethod;
    configPath?: string;
    compartmentId?: string;
    endpoint?: string;
    servingMode?: OCIServingMode;
    requestOptions?: RequestOptions;
}
type OCIGenAIRegion$1 = 'us-chicago-1' | 'eu-frankfurt-1' | 'ap-osaka-1' | 'uk-london-1' | 'us-ashburn-1' | 'ap-mumbai-1' | 'us-sanjose-1' | 'ap-singapore-1' | 'ap-seoul-1' | 'sa-saopaulo-1' | 'ap-sydney-1' | 'ap-tokyo-1' | 'ca-toronto-1';
interface ModelMetadata {
    id: string;
    name: string;
    family: 'grok' | 'llama' | 'cohere' | 'gemini' | 'openai';
    capabilities: {
        streaming: boolean;
        tools: boolean;
        vision: boolean;
        reasoning?: boolean;
    };
    contextWindow: number;
    speed: 'very-fast' | 'fast' | 'medium' | 'slow';
    regions?: OCIGenAIRegion$1[];
    dedicatedOnly?: boolean;
    codingRecommended?: boolean;
    codingNote?: string;
}
type OCILanguageModelSettings = OCIConfig;
interface OCIEmbeddingSettings extends OCIConfig {
    dimensions?: 384 | 1024;
    truncate?: 'START' | 'END' | 'NONE';
    inputType?: 'SEARCH_QUERY' | 'SEARCH_DOCUMENT' | 'CLASSIFICATION' | 'CLUSTERING' | 'IMAGE';
}
interface OCISpeechSettings extends OCIConfig {
    voice?: string;
    speed?: number;
    format?: 'mp3' | 'wav' | 'pcm';
}
interface OCITranscriptionSettings extends OCIConfig {
    language?: string;
    model?: 'ORACLE' | 'WHISPER_MEDIUM' | 'WHISPER_LARGE_V2';
    vocabulary?: string[];
    transcriptionBucket?: string;
}
interface OCIRerankingSettings extends OCIConfig {
    topN?: number;
    returnDocuments?: boolean;
}

type RealtimeAudioEncoding = 'audio/raw;rate=16000' | 'audio/raw;rate=8000' | 'audio/raw;rate=8000;codec=mulaw' | 'audio/raw;rate=8000;codec=alaw';
type PartialResultStability = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
type RealtimeModelDomain = 'GENERIC' | 'MEDICAL';
type RealtimePunctuation = 'NONE' | 'SPOKEN' | 'AUTO';
type RealtimeModelType = 'ORACLE' | 'WHISPER';
interface OCIRealtimeSettings extends OCIConfig {
    encoding?: RealtimeAudioEncoding;
    language?: string;
    model?: RealtimeModelType;
    modelDomain?: RealtimeModelDomain;
    partialResults?: boolean;
    partialResultStability?: PartialResultStability;
    partialSilenceThresholdMs?: number;
    finalSilenceThresholdMs?: number;
    ackEnabled?: boolean;
    punctuation?: RealtimePunctuation;
    customizations?: Array<{
        customizationId: string;
        weight?: number;
    }>;
    ignoreInvalidCustomizations?: boolean;
    connectionTimeoutMs?: number;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
}
interface TranscriptionToken {
    token: string;
    startTimeMs: number;
    endTimeMs: number;
    confidence: number;
    type?: string;
}
interface RealtimeTranscriptionResult {
    text: string;
    isFinal: boolean;
    confidence: number;
    startTimeMs: number;
    endTimeMs: number;
    trailingSilenceMs: number;
    tokens: TranscriptionToken[];
    sessionId?: string;
    sequenceNumber?: number;
}
interface RealtimeTranscriptionEvents {
    partial: (result: RealtimeTranscriptionResult) => void;
    final: (result: RealtimeTranscriptionResult) => void;
    result: (result: RealtimeTranscriptionResult) => void;
    connected: (sessionId: string) => void;
    disconnected: (reason?: string) => void;
    error: (error: Error) => void;
    audioAck: (details: AudioAckDetails) => void;
    reconnecting: (attempt: number, maxAttempts: number) => void;
}
interface AudioAckDetails {
    frameCount: number;
    timestamp: number;
}
type RealtimeConnectionState = 'disconnected' | 'connecting' | 'authenticating' | 'connected' | 'reconnecting' | 'error' | 'closed';
interface RealtimeSessionInfo {
    sessionId: string;
    compartmentId: string;
    state: RealtimeConnectionState;
    connectedAt?: Date;
    audioDurationMs: number;
    resultCount: number;
}
interface RealtimeMessageBase {
    event: string;
    sessionId?: string;
}
interface RealtimeConnectMessage extends RealtimeMessageBase {
    event: 'CONNECT';
    sessionId: string;
}
interface RealtimeResultMessage extends RealtimeMessageBase {
    event: 'RESULT';
    transcriptions: Array<{
        transcription: string;
        isFinal: boolean;
        startTimeInMs: number;
        endTimeInMs: number;
        confidence: number;
        trailingSilence: number;
        tokens: Array<{
            token: string;
            startTimeInMs: number;
            endTimeInMs: number;
            confidence: number;
            type?: string;
        }>;
    }>;
}
interface RealtimeAckMessage extends RealtimeMessageBase {
    event: 'ACKAUDIO';
    audioDetails: {
        frameCount: number;
    };
}
interface RealtimeErrorMessage extends RealtimeMessageBase {
    event: 'ERROR';
    code: string;
    message: string;
}
type RealtimeServerMessage = RealtimeConnectMessage | RealtimeResultMessage | RealtimeAckMessage | RealtimeErrorMessage;
type RealtimeErrorCode = 'CONNECTION_FAILED' | 'AUTHENTICATION_FAILED' | 'CONNECTION_LOST' | 'RECONNECTION_FAILED' | 'INVALID_AUDIO' | 'SESSION_EXPIRED' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
declare class RealtimeError extends Error {
    readonly code: RealtimeErrorCode;
    readonly cause?: Error | undefined;
    constructor(message: string, code: RealtimeErrorCode, cause?: Error | undefined);
}

declare class OCIRealtimeTranscription implements AsyncIterable<RealtimeTranscriptionResult> {
    private client;
    private settings;
    private listeners;
    private resultQueue;
    private resultResolvers;
    private iteratorDone;
    private resultSequence;
    private audioDurationMs;
    private resultCount;
    private connectedAt;
    constructor(config: OCIConfig, settings?: OCIRealtimeSettings);
    get state(): RealtimeConnectionState;
    get isConnected(): boolean;
    get sessionInfo(): RealtimeSessionInfo;
    on<K extends keyof RealtimeTranscriptionEvents>(event: K, callback: RealtimeTranscriptionEvents[K]): this;
    off<K extends keyof RealtimeTranscriptionEvents>(event: K, callback: RealtimeTranscriptionEvents[K]): this;
    connect(settings?: Partial<OCIRealtimeSettings>): Promise<void>;
    sendAudio(audio: Uint8Array | ArrayBuffer, durationMs?: number): void;
    requestFinalResult(): Promise<void>;
    close(waitForFinal?: boolean): Promise<void>;
    transcribe(audioSource: AsyncIterable<Uint8Array | ArrayBuffer>, settings?: Partial<OCIRealtimeSettings>): AsyncGenerator<RealtimeTranscriptionResult>;
    [Symbol.asyncIterator](): AsyncIterator<RealtimeTranscriptionResult>;
    private nextResult;
    private enqueueResult;
    private markIteratorDone;
    private consumeAudioSource;
    private setupClientHandlers;
    private handleResultMessage;
    private emit;
}

declare class OCIGenAIProvider implements ProviderV3 {
    private readonly config;
    readonly specificationVersion: "v3";
    constructor(config?: OCIConfig);
    languageModel(modelId: string, settings?: OCILanguageModelSettings): LanguageModelV3;
    chat(modelId: string, settings?: OCILanguageModelSettings): LanguageModelV3;
    embeddingModel(modelId: string, settings?: OCIEmbeddingSettings): EmbeddingModelV3;
    imageModel(modelId: string): ImageModelV3;
    transcriptionModel(modelId: string, settings?: OCITranscriptionSettings): TranscriptionModelV3;
    speechModel(modelId: string, settings?: OCISpeechSettings): SpeechModelV3;
    rerankingModel(modelId: string, settings?: OCIRerankingSettings): RerankingModelV3;
    realtimeTranscription(settings?: OCIRealtimeSettings): OCIRealtimeTranscription;
}

declare class OCILanguageModel implements LanguageModelV3 {
    readonly modelId: string;
    private readonly config;
    readonly specificationVersion = "v3";
    readonly provider = "oci-genai";
    readonly defaultObjectGenerationMode = "tool";
    readonly supportedUrls: Record<string, RegExp[]>;
    private _client?;
    constructor(modelId: string, config: OCIConfig);
    private getClient;
    private getRequestOptions;
    private getApiFormat;
    private executeWithResilience;
    doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>;
    doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult>;
}

type OCIGenAIRegion = 'us-chicago-1' | 'eu-frankfurt-1' | 'ap-osaka-1' | 'uk-london-1' | 'us-ashburn-1' | 'ap-mumbai-1' | 'us-sanjose-1' | 'ap-singapore-1' | 'ap-seoul-1' | 'sa-saopaulo-1' | 'ap-sydney-1' | 'ap-tokyo-1' | 'ca-toronto-1';
declare function isValidModelId(modelId: string): boolean;
declare function getModelMetadata(modelId: string): ModelMetadata | undefined;
declare function getAllModels(): ModelMetadata[];
declare function getModelsByFamily(family: ModelMetadata['family']): ModelMetadata[];
declare function getModelsByRegion(region: OCIGenAIRegion, includeDedicatedOnly?: boolean): ModelMetadata[];
declare function getCodingRecommendedModels(region: OCIGenAIRegion): ModelMetadata[];
declare function isCodingSuitable(modelId: string): boolean;
declare function supportsReasoning(modelId: string): boolean;

declare class OCIEmbeddingModel implements EmbeddingModelV3 {
    readonly modelId: string;
    private config;
    readonly specificationVersion = "v3";
    readonly provider = "oci-genai";
    readonly maxEmbeddingsPerCall = 96;
    readonly supportsParallelCalls = true;
    private _client?;
    constructor(modelId: string, config: OCIEmbeddingSettings);
    private getClient;
    private getRequestOptions;
    private executeWithResilience;
    doEmbed(options: EmbeddingModelV3CallOptions): Promise<EmbeddingModelV3Result>;
}

interface EmbeddingModelMetadata {
    id: string;
    name: string;
    family: 'cohere';
    dimensions: 384 | 1024;
    maxTextsPerBatch: number;
    maxTokensPerText: number;
}
declare function isValidEmbeddingModelId(modelId: string): boolean;
declare function getEmbeddingModelMetadata(modelId: string): EmbeddingModelMetadata | undefined;
declare function getAllEmbeddingModels(): EmbeddingModelMetadata[];

interface TranscriptionOutput {
    text: string;
    segments: Array<{
        text: string;
        startSecond: number;
        endSecond: number;
    }>;
    language: string | undefined;
    durationInSeconds: number | undefined;
    warnings: SharedV3Warning[];
    request?: {
        body?: string;
    };
    response: {
        timestamp: Date;
        modelId: string;
        headers?: Record<string, string>;
    };
    providerMetadata?: Record<string, JSONObject>;
}
declare class OCITranscriptionModel implements TranscriptionModelV3 {
    readonly modelId: string;
    private config;
    readonly specificationVersion = "v3";
    readonly provider = "oci-genai";
    private _client?;
    constructor(modelId: string, config: OCITranscriptionSettings);
    private getClient;
    doGenerate(options: TranscriptionModelV3CallOptions): Promise<TranscriptionOutput>;
    doTranscribe(options: TranscriptionModelV3CallOptions): Promise<TranscriptionOutput>;
    private mapLanguageCode;
    private pollForCompletion;
}

interface TranscriptionModelMetadata {
    id: string;
    name: string;
    family: 'oci-speech';
    modelType: 'ORACLE' | 'WHISPER_MEDIUM' | 'WHISPER_LARGE_V2';
    maxLanguages: number;
    supportsCustomVocabulary: boolean;
    supportedFormats: string[];
    maxFileSizeMB: number;
}
declare const ORACLE_LANGUAGES: readonly ["en-US", "es-ES", "pt-BR", "en-GB", "en-AU", "en-IN", "hi-IN", "fr-FR", "de-DE", "it-IT"];
declare const WHISPER_LANGUAGES: readonly ["en", "es", "pt", "fr", "de", "it", "ja", "ko", "zh", "nl", "pl", "ru", "tr", "hi", "ar"];
type OracleLanguage = (typeof ORACLE_LANGUAGES)[number];
type WhisperLanguage = (typeof WHISPER_LANGUAGES)[number];
declare function isValidTranscriptionModelId(modelId: string): boolean;
declare function getTranscriptionModelMetadata(modelId: string): TranscriptionModelMetadata | undefined;
declare function getAllTranscriptionModels(): TranscriptionModelMetadata[];
declare function getSupportedLanguages(): readonly string[];
type SupportedLanguage = OracleLanguage | WhisperLanguage;

declare class OCIRerankingModel implements RerankingModelV3 {
    readonly modelId: string;
    private config;
    readonly specificationVersion = "v3";
    readonly provider = "oci-genai";
    private _client?;
    constructor(modelId: string, config: OCIRerankingSettings);
    private getClient;
    private getRequestOptions;
    private executeWithResilience;
    doRerank(options: RerankingModelV3CallOptions): Promise<{
        ranking: Array<{
            index: number;
            relevanceScore: number;
        }>;
        providerMetadata?: Record<string, JSONObject>;
        warnings?: SharedV3Warning[];
        response?: {
            id?: string;
            timestamp?: Date;
            modelId?: string;
            headers?: Record<string, string>;
            body?: unknown;
        };
    }>;
}

interface RerankingModelMetadata {
    id: string;
    name: string;
    family: 'cohere';
    maxDocuments: number;
    maxQueryLength: number;
    supportsMultilingual: boolean;
}
declare function isValidRerankingModelId(modelId: string): boolean;
declare function getRerankingModelMetadata(modelId: string): RerankingModelMetadata | undefined;
declare function getAllRerankingModels(): RerankingModelMetadata[];

declare class OCISpeechModel implements SpeechModelV3 {
    readonly modelId: string;
    readonly specificationVersion = "v3";
    readonly provider = "oci-genai";
    private readonly voice;
    private readonly _config;
    private _client?;
    constructor(modelId: string, config: OCISpeechSettings);
    private getClient;
    getVoice(): string;
    doGenerate(options: SpeechModelV3CallOptions): Promise<{
        audio: string | Uint8Array;
        warnings: SharedV3Warning[];
        request?: {
            body?: unknown;
        };
        response: {
            timestamp: Date;
            modelId: string;
            headers?: SharedV2Headers;
            body?: unknown;
        };
        providerMetadata?: Record<string, JSONObject>;
    }>;
    private mapOutputFormat;
    private streamToUint8Array;
    private webStreamToUint8Array;
    private nodeStreamToUint8Array;
}

interface SpeechModelMetadata {
    id: string;
    name: string;
    family: 'oci-speech';
    modelName: string;
    supportedFormats: ('mp3' | 'ogg' | 'pcm')[];
    maxTextLength: number;
    defaultVoice?: string;
    supportedLanguages: string[];
}
declare function isValidSpeechModelId(modelId: string): boolean;
declare function getSpeechModelMetadata(modelId: string): SpeechModelMetadata | undefined;
declare function getAllSpeechModels(): SpeechModelMetadata[];
interface VoiceMetadata {
    id: string;
    name: string;
    language: string;
    model: 'TTS_2_NATURAL' | 'TTS_1_STANDARD';
}
declare function getAllVoices(): VoiceMetadata[];

interface OCIGenAIErrorOptions {
    cause?: Error;
}
declare class OCIGenAIError extends Error {
    readonly name: string;
    readonly cause?: Error;
    readonly retryable: boolean;
    readonly statusCode?: number;
    constructor(message: string, statusCodeOrOptions?: number | OCIGenAIErrorOptions, retryable?: boolean);
}
interface NetworkErrorOptions extends OCIGenAIErrorOptions {
    code?: string;
}
declare class NetworkError extends OCIGenAIError {
    readonly name: string;
    readonly retryable = true;
    readonly code?: string;
    constructor(message: string, options?: NetworkErrorOptions);
}
interface RateLimitErrorOptions extends OCIGenAIErrorOptions {
    retryAfterMs?: number;
}
declare class RateLimitError extends OCIGenAIError {
    readonly name: string;
    readonly retryable = true;
    readonly retryAfterMs?: number;
    constructor(message: string, options?: RateLimitErrorOptions);
}
interface AuthenticationErrorOptions extends OCIGenAIErrorOptions {
    authType?: 'api_key' | 'instance_principal' | 'resource_principal' | 'session_token';
}
declare class AuthenticationError extends OCIGenAIError {
    readonly name: string;
    readonly retryable = false;
    readonly authType?: string;
    constructor(message: string, options?: AuthenticationErrorOptions);
}
declare class ModelNotFoundError extends OCIGenAIError {
    readonly name: string;
    readonly retryable = false;
    readonly modelId: string;
    constructor(modelId: string, options?: OCIGenAIErrorOptions);
}
declare function isRetryableStatusCode(statusCode: number): boolean;
declare function handleOCIError(error: unknown): AISDKError;

interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    isRetryable?: (error: unknown) => boolean;
}
declare function isRetryableError(error: unknown): boolean;
declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;

declare class TimeoutError extends Error {
    readonly name = "TimeoutError";
    readonly timeoutMs: number;
    readonly operation?: string;
    constructor(timeoutMs: number, operation?: string);
}
declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation?: string): Promise<T>;

interface RealtimeClientEvents {
    stateChange: (state: RealtimeConnectionState) => void;
    authenticated: (sessionId: string) => void;
    message: (message: RealtimeServerMessage) => void;
    error: (error: Error) => void;
    closed: (code: number, reason: string) => void;
}
declare class OCIRealtimeClient {
    private readonly config;
    private ws;
    private speechClient;
    private sessionToken;
    private sessionId;
    private listeners;
    private _state;
    private reconnectAttempts;
    private reconnectTimer;
    constructor(config: OCIConfig);
    get state(): RealtimeConnectionState;
    get currentSessionId(): string | null;
    get isConnected(): boolean;
    on<K extends keyof RealtimeClientEvents>(event: K, callback: RealtimeClientEvents[K]): void;
    off<K extends keyof RealtimeClientEvents>(event: K, callback: RealtimeClientEvents[K]): void;
    connect(settings?: OCIRealtimeSettings): Promise<void>;
    sendAudio(audio: Uint8Array | ArrayBuffer): void;
    requestFinalResult(): Promise<void>;
    close(code?: number, reason?: string): Promise<void>;
    private createSpeechClient;
    private createSessionToken;
    private setupWebSocketHandlers;
    private waitForOpen;
    private waitForAuthentication;
    private sendAuthMessage;
    private handleMessage;
    private handleConnectMessage;
    private handleErrorMessage;
    private handleClose;
    private attemptReconnect;
    private clearReconnectTimer;
    private setState;
    private emit;
}

declare const WebSocketReadyState: {
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
};
type WebSocketReadyState = (typeof WebSocketReadyState)[keyof typeof WebSocketReadyState];
interface WebSocketAdapterEvents {
    open: () => void;
    message: (data: string | ArrayBuffer) => void;
    close: (code: number, reason: string) => void;
    error: (error: Error) => void;
}
interface WebSocketAdapterOptions {
    connectionTimeoutMs?: number;
    headers?: Record<string, string>;
}
declare class WebSocketAdapter {
    private readonly url;
    private readonly options;
    private ws;
    private listeners;
    private connectionTimeout;
    private _readyState;
    constructor(url: string, options?: WebSocketAdapterOptions);
    get readyState(): WebSocketReadyState;
    get isOpen(): boolean;
    get isConnecting(): boolean;
    get isClosed(): boolean;
    on<K extends keyof WebSocketAdapterEvents>(event: K, callback: WebSocketAdapterEvents[K]): void;
    off<K extends keyof WebSocketAdapterEvents>(event: K, callback: WebSocketAdapterEvents[K]): void;
    send(data: string | ArrayBuffer | Uint8Array): void;
    close(code?: number, reason?: string): void;
    private connect;
    private createWebSocket;
    private emit;
    private clearConnectionTimeout;
}

declare function createOCI(config?: OCIConfig): OCIGenAIProvider;
declare const oci: OCIGenAIProvider;

export { type AudioAckDetails, AuthenticationError, type AuthenticationErrorOptions, type EmbeddingModelMetadata, type ModelMetadata, ModelNotFoundError, NetworkError, type NetworkErrorOptions, type OCIAuthMethod, type OCIConfig, OCIEmbeddingModel, type OCIEmbeddingSettings, OCIGenAIError, type OCIGenAIErrorOptions, OCIGenAIProvider, type OCIGenAIRegion$1 as OCIGenAIRegion, OCILanguageModel, type OCILanguageModelSettings, OCIRealtimeClient, type OCIRealtimeSettings, OCIRealtimeTranscription, OCIRerankingModel, type OCIRerankingSettings, OCISpeechModel, type OCISpeechSettings, OCITranscriptionModel, type OCITranscriptionSettings, type PartialResultStability, RateLimitError, type RateLimitErrorOptions, type RealtimeAudioEncoding, type RealtimeClientEvents, type RealtimeConnectionState, RealtimeError, type RealtimeErrorCode, type RealtimeModelDomain, type RealtimeModelType, type RealtimePunctuation, type RealtimeSessionInfo, type RealtimeTranscriptionEvents, type RealtimeTranscriptionResult, type RequestOptions, type RerankingModelMetadata, type RetryOptions, type SpeechModelMetadata, type SupportedLanguage, TimeoutError, type TranscriptionModelMetadata, type TranscriptionToken, WebSocketAdapter, WebSocketReadyState, createOCI, getAllEmbeddingModels, getAllModels, getAllRerankingModels, getAllSpeechModels, getAllTranscriptionModels, getAllVoices, getCodingRecommendedModels, getEmbeddingModelMetadata, getModelMetadata, getModelsByFamily, getModelsByRegion, getRerankingModelMetadata, getSpeechModelMetadata, getSupportedLanguages, getTranscriptionModelMetadata, handleOCIError, isCodingSuitable, isRetryableError, isRetryableStatusCode, isValidEmbeddingModelId, isValidModelId, isValidRerankingModelId, isValidSpeechModelId, isValidTranscriptionModelId, oci, supportsReasoning, withRetry, withTimeout };
