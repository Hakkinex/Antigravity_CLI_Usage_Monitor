/**
 * Google Cloud Code API client
 */
import type { TokenManager } from './token-manager.js';
/**
 * Raw API response types (based on extension code patterns)
 */
export interface LoadCodeAssistResponse {
    codeAssistEnabled?: boolean;
    planInfo?: {
        monthlyPromptCredits?: number;
        planType?: string;
    };
    availablePromptCredits?: number;
    cloudaicompanionProject?: string | {
        id?: string;
    };
    currentTier?: {
        id?: string;
        name?: string;
        description?: string;
    };
    paidTier?: {
        id?: string;
    };
    allowedTiers?: Array<{
        id?: string;
        isDefault?: boolean;
    }>;
}
/**
 * Model info in the response - keyed by model ID
 */
export interface ModelInfo {
    displayName?: string;
    model?: string;
    label?: string;
    quotaInfo?: {
        remainingFraction?: number;
        resetTime?: string;
        isExhausted?: boolean;
    };
    maxTokens?: number;
    recommended?: boolean;
    supportsImages?: boolean;
    supportsThinking?: boolean;
    modelProvider?: string;
}
/**
 * The actual response structure - models is an object, not an array
 */
export interface FetchAvailableModelsResponse {
    models?: Record<string, ModelInfo>;
    defaultAgentModelId?: string;
}
/**
 * Cloud Code API client
 */
export declare class CloudCodeClient {
    private tokenManager;
    private projectId?;
    constructor(tokenManager: TokenManager);
    /**
     * Make an authenticated API request
     */
    private request;
    /**
     * Load code assist status and plan info
     * Also extracts project ID for subsequent calls
     */
    loadCodeAssist(): Promise<LoadCodeAssistResponse>;
    /**
     * Extract project ID from loadCodeAssist response
     */
    private extractProjectId;
    /**
     * Resolve project ID with onboarding retry if needed
     * This is the recommended way to get projectId reliably
     */
    resolveProjectId(maxRetries?: number, retryDelayMs?: number): Promise<string | undefined>;
    /**
     * Fetch available models with quota info
     * Requires project ID from loadCodeAssist
     */
    fetchAvailableModels(): Promise<FetchAvailableModelsResponse>;
    /**
     * Generate content using a specific model (Agent Request Format)
     * Used for wake-up triggers to warm up models
     *
     * Per docs/trigger.md, must use the agent request format with:
     * - project: Cloud Code project ID
     * - requestId: unique ID
     * - model: model ID
     * - userAgent: "antigravity"
     * - requestType: "agent"
     * - request: contains contents, session_id, systemInstruction, generationConfig
     *
     * @param modelId Model ID to use
     * @param prompt User prompt to send
     * @param maxOutputTokens Maximum tokens to generate (0 = no limit)
     * @returns Generated text and optional token usage
     */
    generateContent(modelId: string, prompt: string, maxOutputTokens?: number): Promise<{
        text: string;
        tokensUsed?: {
            prompt: number;
            completion: number;
            total: number;
        };
    }>;
}
