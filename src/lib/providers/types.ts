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
  mistral: {
    type: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral Large, Mistral Small, Codestral, Pixtral',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://console.mistral.ai/api-keys',
    color: '#FF7000',
  },
  azure: {
    type: 'azure',
    name: 'Azure OpenAI',
    description: 'GPT-4o, GPT-4, o1 via Azure OpenAI Service',
    keyPrefix: 'https://',
    keyPlaceholder: 'https://my-resource.openai.azure.com/::my-azure-api-key',
    helpUrl: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI',
    color: '#0078D4',
  },
  xai: {
    type: 'xai',
    name: 'xAI (Grok)',
    description: 'Grok 3, Grok 3 Fast, Grok 3 Mini',
    keyPrefix: 'xai-',
    keyPlaceholder: 'xai-...',
    helpUrl: 'https://console.x.ai/settings/api-keys',
    color: '#1DA1F2',
  },
  cohere: {
    type: 'cohere',
    name: 'Cohere',
    description: 'Command R+, Command R, Embed, Rerank',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://dashboard.cohere.com/api-keys',
    color: '#39594D',
  },
  groq: {
    type: 'groq',
    name: 'Groq',
    description: 'Llama 4, Llama 3.3 70B, Gemma 2, Mixtral — ultra-fast inference',
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_...',
    helpUrl: 'https://console.groq.com/keys',
    color: '#F55036',
  },
  together: {
    type: 'together',
    name: 'Together AI',
    description: 'Llama 4, DeepSeek R1/V3, Qwen 2.5, Mixtral — open-source models',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://api.together.ai/settings/api-keys',
    color: '#0F6FFF',
  },
  fireworks: {
    type: 'fireworks',
    name: 'Fireworks AI',
    description: 'Llama 4, DeepSeek R1/V3, Qwen 2.5, Mixtral — fast open-source inference',
    keyPrefix: 'fw_',
    keyPlaceholder: 'fw_...',
    helpUrl: 'https://fireworks.ai/settings/users/api-keys',
    color: '#FF6B35',
  },
  perplexity: {
    type: 'perplexity',
    name: 'Perplexity AI',
    description: 'Sonar, Sonar Pro, Sonar Reasoning — search-augmented models',
    keyPrefix: 'pplx-',
    keyPlaceholder: 'pplx-...',
    helpUrl: 'https://www.perplexity.ai/settings/api',
    color: '#20B2AA',
  },
  cerebras: {
    type: 'cerebras',
    name: 'Cerebras',
    description: 'Llama 3.1/3.3, Qwen 3, DeepSeek R1 — ultra-fast inference on Cerebras hardware',
    keyPrefix: 'csk-',
    keyPlaceholder: 'csk-...',
    helpUrl: 'https://cloud.cerebras.ai/platform',
    color: '#F15A24',
  },
  ai21: {
    type: 'ai21',
    name: 'AI21 Labs',
    description: 'Jamba 1.5/1.6 Mini and Large — long-context SSM-Transformer hybrid models',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://studio.ai21.com/account/api-key',
    color: '#6C47FF',
  },
  deepinfra: {
    type: 'deepinfra',
    name: 'DeepInfra',
    description: 'Llama 4, DeepSeek R1/V3, Qwen, Phi-4, Mixtral — low-cost open-source inference',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://deepinfra.com/dash/api_keys',
    color: '#6B21A8',
  },
};
