import type { ProviderType } from '@/types';

/**
 * Adapter interface for provider usage APIs.
 * Each provider (OpenAI, Anthropic, etc.) implements this interface.
 */
export interface ProviderAdapter {
  readonly type: ProviderType;

  /**
   * Validates the API key by making a test request.
   * Returns true if valid, throws with error message if not.
   */
  validateKey(apiKey: string): Promise<boolean>;

  /**
   * Fetches usage data for a date range.
   */
  fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]>;
}

export interface NormalizedUsageRecord {
  date: string; // YYYY-MM-DD
  model: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
  rawData?: Record<string, unknown>;
}

export interface ProviderMeta {
  type: ProviderType;
  name: string;
  description: string;
  keyPrefix: string;
  keyPlaceholder: string;
  helpUrl: string;
  color: string;
}

/**
 * Registry of supported providers with their metadata.
 */
export const PROVIDER_META: Record<ProviderType, ProviderMeta> = {
  openai: {
    type: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini, o1, DALL-E, Whisper',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    color: '#10A37F',
  },
  anthropic: {
    type: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Opus, Sonnet, Haiku',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-admin-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    color: '#D4A574',
  },
  google: {
    type: 'google',
    name: 'Google AI',
    description: 'Gemini 2.0 Flash, Gemini 2.0 Pro, Gemini 1.5',
    keyPrefix: 'AI',
    keyPlaceholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    color: '#4285F4',
  },
  deepseek: {
    type: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek V3, DeepSeek R1, Coder',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.deepseek.com/api_keys',
    color: '#0066FF',
  },
  openrouter: {
    type: 'openrouter',
    name: 'OpenRouter',
    description: '500+ models: Claude, GPT, Gemini, Llama, Mistral & more',
    keyPrefix: 'sk-or-',
    keyPlaceholder: 'sk-or-v1-...',
    helpUrl: 'https://openrouter.ai/settings/keys',
    color: '#6366F1',
  },
};
