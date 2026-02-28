import type { ProviderType } from '@/types';

/**
 * Centralized model pricing catalog for LLMeter.
 * All provider adapters import pricing from here instead of hardcoding.
 *
 * Prices are per 1M tokens in USD.
 * Anthropic models include cache_read and cache_creation rates.
 *
 * This catalog can be auto-updated from OpenRouter's public API
 * via the refresh-pricing endpoint or CLI script.
 */

export type CapabilityTier = 'budget' | 'standard' | 'premium';

export interface ModelPricing {
  provider: ProviderType;
  model_id: string;
  display_name: string;
  input_price_per_1m_tokens: number;
  output_price_per_1m_tokens: number;
  cache_read_price_per_1m_tokens?: number;
  cache_creation_price_per_1m_tokens?: number;
  capability_tier: CapabilityTier;
  last_verified_at: string; // ISO 8601 timestamp
}

/**
 * Master pricing catalog. Keyed by canonical model_id.
 * When looking up pricing, adapters normalize model names to match these keys.
 */
const MODEL_CATALOG: ModelPricing[] = [
  {
    provider: 'google',
    model_id: 'gemini-3.1-flash-image-preview',
    display_name: 'Google: Nano Banana 2 (Gemini 3.1 Flash Image Preview)',
    input_price_per_1m_tokens: 0.25,
    output_price_per_1m_tokens: 1.5,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-3.1-pro-preview-customtools',
    display_name: 'Google: Gemini 3.1 Pro Preview Custom Tools',
    input_price_per_1m_tokens: 2,
    output_price_per_1m_tokens: 12,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.3-codex',
    display_name: 'OpenAI: GPT-5.3-Codex',
    input_price_per_1m_tokens: 1.75,
    output_price_per_1m_tokens: 14,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-3.1-pro-preview',
    display_name: 'Google: Gemini 3.1 Pro Preview',
    input_price_per_1m_tokens: 2,
    output_price_per_1m_tokens: 12,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4.6',
    display_name: 'Anthropic: Claude Sonnet 4.6',
    input_price_per_1m_tokens: 3,
    output_price_per_1m_tokens: 15,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-opus-4.6',
    display_name: 'Anthropic: Claude Opus 4.6',
    input_price_per_1m_tokens: 5,
    output_price_per_1m_tokens: 25,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-audio',
    display_name: 'OpenAI: GPT Audio',
    input_price_per_1m_tokens: 2.5,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-audio-mini',
    display_name: 'OpenAI: GPT Audio Mini',
    input_price_per_1m_tokens: 0.6,
    output_price_per_1m_tokens: 2.4,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.2-codex',
    display_name: 'OpenAI: GPT-5.2-Codex',
    input_price_per_1m_tokens: 1.75,
    output_price_per_1m_tokens: 14,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-3-flash-preview',
    display_name: 'Google: Gemini 3 Flash Preview',
    input_price_per_1m_tokens: 0.5,
    output_price_per_1m_tokens: 3,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.2-chat',
    display_name: 'OpenAI: GPT-5.2 Chat',
    input_price_per_1m_tokens: 1.75,
    output_price_per_1m_tokens: 14,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.2-pro',
    display_name: 'OpenAI: GPT-5.2 Pro',
    input_price_per_1m_tokens: 21,
    output_price_per_1m_tokens: 168,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.2',
    display_name: 'OpenAI: GPT-5.2',
    input_price_per_1m_tokens: 1.75,
    output_price_per_1m_tokens: 14,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.1-codex-max',
    display_name: 'OpenAI: GPT-5.1-Codex-Max',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-v3.2-speciale',
    display_name: 'DeepSeek: DeepSeek V3.2 Speciale',
    input_price_per_1m_tokens: 0.4,
    output_price_per_1m_tokens: 1.2,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-v3.2',
    display_name: 'DeepSeek: DeepSeek V3.2',
    input_price_per_1m_tokens: 0.25,
    output_price_per_1m_tokens: 0.4,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-opus-4.5',
    display_name: 'Anthropic: Claude Opus 4.5',
    input_price_per_1m_tokens: 5,
    output_price_per_1m_tokens: 25,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-3-pro-image-preview',
    display_name: 'Google: Nano Banana Pro (Gemini 3 Pro Image Preview)',
    input_price_per_1m_tokens: 2,
    output_price_per_1m_tokens: 12,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-3-pro-preview',
    display_name: 'Google: Gemini 3 Pro Preview',
    input_price_per_1m_tokens: 2,
    output_price_per_1m_tokens: 12,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.1',
    display_name: 'OpenAI: GPT-5.1',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.1-chat',
    display_name: 'OpenAI: GPT-5.1 Chat',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.1-codex',
    display_name: 'OpenAI: GPT-5.1-Codex',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5.1-codex-mini',
    display_name: 'OpenAI: GPT-5.1-Codex-Mini',
    input_price_per_1m_tokens: 0.25,
    output_price_per_1m_tokens: 2,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-oss-safeguard-20b',
    display_name: 'OpenAI: gpt-oss-safeguard-20b',
    input_price_per_1m_tokens: 0.075,
    output_price_per_1m_tokens: 0.3,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5-image-mini',
    display_name: 'OpenAI: GPT-5 Image Mini',
    input_price_per_1m_tokens: 2.5,
    output_price_per_1m_tokens: 2,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-haiku-4.5',
    display_name: 'Anthropic: Claude Haiku 4.5',
    input_price_per_1m_tokens: 1,
    output_price_per_1m_tokens: 5,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5-image',
    display_name: 'OpenAI: GPT-5 Image',
    input_price_per_1m_tokens: 10,
    output_price_per_1m_tokens: 10,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o3-deep-research',
    display_name: 'OpenAI: o3 Deep Research',
    input_price_per_1m_tokens: 10,
    output_price_per_1m_tokens: 40,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o4-mini-deep-research',
    display_name: 'OpenAI: o4 Mini Deep Research',
    input_price_per_1m_tokens: 2,
    output_price_per_1m_tokens: 8,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.5-flash-image',
    display_name: 'Google: Nano Banana (Gemini 2.5 Flash Image)',
    input_price_per_1m_tokens: 0.3,
    output_price_per_1m_tokens: 2.5,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5-pro',
    display_name: 'OpenAI: GPT-5 Pro',
    input_price_per_1m_tokens: 15,
    output_price_per_1m_tokens: 120,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4.5',
    display_name: 'Anthropic: Claude Sonnet 4.5',
    input_price_per_1m_tokens: 3,
    output_price_per_1m_tokens: 15,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-v3.2-exp',
    display_name: 'DeepSeek: DeepSeek V3.2 Exp',
    input_price_per_1m_tokens: 0.27,
    output_price_per_1m_tokens: 0.41,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.5-flash-lite-preview-09-2025',
    display_name: 'Google: Gemini 2.5 Flash Lite Preview 09-2025',
    input_price_per_1m_tokens: 0.1,
    output_price_per_1m_tokens: 0.4,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5-codex',
    display_name: 'OpenAI: GPT-5 Codex',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-v3.1-terminus:exacto',
    display_name: 'DeepSeek: DeepSeek V3.1 Terminus (exacto)',
    input_price_per_1m_tokens: 0.21,
    output_price_per_1m_tokens: 0.79,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-v3.1-terminus',
    display_name: 'DeepSeek: DeepSeek V3.1 Terminus',
    input_price_per_1m_tokens: 0.21,
    output_price_per_1m_tokens: 0.79,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-chat-v3.1',
    display_name: 'DeepSeek: DeepSeek V3.1',
    input_price_per_1m_tokens: 0.15,
    output_price_per_1m_tokens: 0.75,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-audio-preview',
    display_name: 'OpenAI: GPT-4o Audio',
    input_price_per_1m_tokens: 2.5,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5-chat',
    display_name: 'OpenAI: GPT-5 Chat',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5',
    display_name: 'OpenAI: GPT-5',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5-mini',
    display_name: 'OpenAI: GPT-5 Mini',
    input_price_per_1m_tokens: 0.25,
    output_price_per_1m_tokens: 2,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-5-nano',
    display_name: 'OpenAI: GPT-5 Nano',
    input_price_per_1m_tokens: 0.05,
    output_price_per_1m_tokens: 0.4,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-oss-120b:free',
    display_name: 'OpenAI: gpt-oss-120b (free)',
    input_price_per_1m_tokens: 0,
    output_price_per_1m_tokens: 0,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-oss-120b',
    display_name: 'OpenAI: gpt-oss-120b',
    input_price_per_1m_tokens: 0.039,
    output_price_per_1m_tokens: 0.19,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-oss-120b:exacto',
    display_name: 'OpenAI: gpt-oss-120b (exacto)',
    input_price_per_1m_tokens: 0.039,
    output_price_per_1m_tokens: 0.19,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-oss-20b:free',
    display_name: 'OpenAI: gpt-oss-20b (free)',
    input_price_per_1m_tokens: 0,
    output_price_per_1m_tokens: 0,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-oss-20b',
    display_name: 'OpenAI: gpt-oss-20b',
    input_price_per_1m_tokens: 0.03,
    output_price_per_1m_tokens: 0.14,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-opus-4.1',
    display_name: 'Anthropic: Claude Opus 4.1',
    input_price_per_1m_tokens: 15,
    output_price_per_1m_tokens: 75,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.5-flash-lite',
    display_name: 'Google: Gemini 2.5 Flash Lite',
    input_price_per_1m_tokens: 0.1,
    output_price_per_1m_tokens: 0.4,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3n-e2b-it:free',
    display_name: 'Google: Gemma 3n 2B (free)',
    input_price_per_1m_tokens: 0,
    output_price_per_1m_tokens: 0,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.5-flash',
    display_name: 'Google: Gemini 2.5 Flash',
    input_price_per_1m_tokens: 0.3,
    output_price_per_1m_tokens: 2.5,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.5-pro',
    display_name: 'Google: Gemini 2.5 Pro',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o3-pro',
    display_name: 'OpenAI: o3 Pro',
    input_price_per_1m_tokens: 20,
    output_price_per_1m_tokens: 80,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.5-pro-preview',
    display_name: 'Google: Gemini 2.5 Pro Preview 06-05',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-r1-0528',
    display_name: 'DeepSeek: R1 0528',
    input_price_per_1m_tokens: 0.45,
    output_price_per_1m_tokens: 2.15,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-opus-4',
    display_name: 'Anthropic: Claude Opus 4',
    input_price_per_1m_tokens: 15,
    output_price_per_1m_tokens: 75,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4',
    display_name: 'Anthropic: Claude Sonnet 4',
    input_price_per_1m_tokens: 3,
    output_price_per_1m_tokens: 15,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3n-e4b-it:free',
    display_name: 'Google: Gemma 3n 4B (free)',
    input_price_per_1m_tokens: 0,
    output_price_per_1m_tokens: 0,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3n-e4b-it',
    display_name: 'Google: Gemma 3n 4B',
    input_price_per_1m_tokens: 0.02,
    output_price_per_1m_tokens: 0.04,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.5-pro-preview-05-06',
    display_name: 'Google: Gemini 2.5 Pro Preview 05-06',
    input_price_per_1m_tokens: 1.25,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o4-mini-high',
    display_name: 'OpenAI: o4 Mini High',
    input_price_per_1m_tokens: 1.1,
    output_price_per_1m_tokens: 4.4,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o3',
    display_name: 'OpenAI: o3',
    input_price_per_1m_tokens: 2,
    output_price_per_1m_tokens: 8,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o4-mini',
    display_name: 'OpenAI: o4 Mini',
    input_price_per_1m_tokens: 1.1,
    output_price_per_1m_tokens: 4.4,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4.1',
    display_name: 'OpenAI: GPT-4.1',
    input_price_per_1m_tokens: 2,
    output_price_per_1m_tokens: 8,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4.1-mini',
    display_name: 'OpenAI: GPT-4.1 Mini',
    input_price_per_1m_tokens: 0.4,
    output_price_per_1m_tokens: 1.6,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4.1-nano',
    display_name: 'OpenAI: GPT-4.1 Nano',
    input_price_per_1m_tokens: 0.1,
    output_price_per_1m_tokens: 0.4,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-chat-v3-0324',
    display_name: 'DeepSeek: DeepSeek V3 0324',
    input_price_per_1m_tokens: 0.2,
    output_price_per_1m_tokens: 0.77,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o1-pro',
    display_name: 'OpenAI: o1-pro',
    input_price_per_1m_tokens: 150,
    output_price_per_1m_tokens: 600,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3-4b-it:free',
    display_name: 'Google: Gemma 3 4B (free)',
    input_price_per_1m_tokens: 0,
    output_price_per_1m_tokens: 0,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3-4b-it',
    display_name: 'Google: Gemma 3 4B',
    input_price_per_1m_tokens: 0.04,
    output_price_per_1m_tokens: 0.08,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3-12b-it:free',
    display_name: 'Google: Gemma 3 12B (free)',
    input_price_per_1m_tokens: 0,
    output_price_per_1m_tokens: 0,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3-12b-it',
    display_name: 'Google: Gemma 3 12B',
    input_price_per_1m_tokens: 0.04,
    output_price_per_1m_tokens: 0.13,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-mini-search-preview',
    display_name: 'OpenAI: GPT-4o-mini Search Preview',
    input_price_per_1m_tokens: 0.15,
    output_price_per_1m_tokens: 0.6,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-search-preview',
    display_name: 'OpenAI: GPT-4o Search Preview',
    input_price_per_1m_tokens: 2.5,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3-27b-it:free',
    display_name: 'Google: Gemma 3 27B (free)',
    input_price_per_1m_tokens: 0,
    output_price_per_1m_tokens: 0,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-3-27b-it',
    display_name: 'Google: Gemma 3 27B',
    input_price_per_1m_tokens: 0.04,
    output_price_per_1m_tokens: 0.15,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.0-flash-lite-001',
    display_name: 'Google: Gemini 2.0 Flash Lite',
    input_price_per_1m_tokens: 0.075,
    output_price_per_1m_tokens: 0.3,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-3.7-sonnet',
    display_name: 'Anthropic: Claude 3.7 Sonnet',
    input_price_per_1m_tokens: 3,
    output_price_per_1m_tokens: 15,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-3.7-sonnet:thinking',
    display_name: 'Anthropic: Claude 3.7 Sonnet (thinking)',
    input_price_per_1m_tokens: 3,
    output_price_per_1m_tokens: 15,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o3-mini-high',
    display_name: 'OpenAI: o3 Mini High',
    input_price_per_1m_tokens: 1.1,
    output_price_per_1m_tokens: 4.4,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemini-2.0-flash-001',
    display_name: 'Google: Gemini 2.0 Flash',
    input_price_per_1m_tokens: 0.1,
    output_price_per_1m_tokens: 0.4,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o3-mini',
    display_name: 'OpenAI: o3 Mini',
    input_price_per_1m_tokens: 1.1,
    output_price_per_1m_tokens: 4.4,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-r1-distill-qwen-32b',
    display_name: 'DeepSeek: R1 Distill Qwen 32B',
    input_price_per_1m_tokens: 0.29,
    output_price_per_1m_tokens: 0.29,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-r1-distill-llama-70b',
    display_name: 'DeepSeek: R1 Distill Llama 70B',
    input_price_per_1m_tokens: 0.7,
    output_price_per_1m_tokens: 0.8,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-r1',
    display_name: 'DeepSeek: R1',
    input_price_per_1m_tokens: 0.7,
    output_price_per_1m_tokens: 2.5,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'deepseek',
    model_id: 'deepseek-chat',
    display_name: 'DeepSeek: DeepSeek V3',
    input_price_per_1m_tokens: 0.32,
    output_price_per_1m_tokens: 0.89,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'o1',
    display_name: 'OpenAI: o1',
    input_price_per_1m_tokens: 15,
    output_price_per_1m_tokens: 60,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-2024-11-20',
    display_name: 'OpenAI: GPT-4o (2024-11-20)',
    input_price_per_1m_tokens: 2.5,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-3.5-haiku',
    display_name: 'Anthropic: Claude 3.5 Haiku',
    input_price_per_1m_tokens: 0.8,
    output_price_per_1m_tokens: 4,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-3.5-sonnet',
    display_name: 'Anthropic: Claude 3.5 Sonnet',
    input_price_per_1m_tokens: 6,
    output_price_per_1m_tokens: 30,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-2024-08-06',
    display_name: 'OpenAI: GPT-4o (2024-08-06)',
    input_price_per_1m_tokens: 2.5,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-mini-2024-07-18',
    display_name: 'OpenAI: GPT-4o-mini (2024-07-18)',
    input_price_per_1m_tokens: 0.15,
    output_price_per_1m_tokens: 0.6,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-mini',
    display_name: 'OpenAI: GPT-4o-mini',
    input_price_per_1m_tokens: 0.15,
    output_price_per_1m_tokens: 0.6,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-2-27b-it',
    display_name: 'Google: Gemma 2 27B',
    input_price_per_1m_tokens: 0.65,
    output_price_per_1m_tokens: 0.65,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'google',
    model_id: 'gemma-2-9b-it',
    display_name: 'Google: Gemma 2 9B',
    input_price_per_1m_tokens: 0.03,
    output_price_per_1m_tokens: 0.09,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-2024-05-13',
    display_name: 'OpenAI: GPT-4o (2024-05-13)',
    input_price_per_1m_tokens: 5,
    output_price_per_1m_tokens: 15,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o',
    display_name: 'OpenAI: GPT-4o',
    input_price_per_1m_tokens: 2.5,
    output_price_per_1m_tokens: 10,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o:extended',
    display_name: 'OpenAI: GPT-4o (extended)',
    input_price_per_1m_tokens: 6,
    output_price_per_1m_tokens: 18,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4-turbo',
    display_name: 'OpenAI: GPT-4 Turbo',
    input_price_per_1m_tokens: 10,
    output_price_per_1m_tokens: 30,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'anthropic',
    model_id: 'claude-3-haiku',
    display_name: 'Anthropic: Claude 3 Haiku',
    input_price_per_1m_tokens: 0.25,
    output_price_per_1m_tokens: 1.25,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-3.5-turbo-0613',
    display_name: 'OpenAI: GPT-3.5 Turbo (older v0613)',
    input_price_per_1m_tokens: 1,
    output_price_per_1m_tokens: 2,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4-turbo-preview',
    display_name: 'OpenAI: GPT-4 Turbo Preview',
    input_price_per_1m_tokens: 10,
    output_price_per_1m_tokens: 30,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4-1106-preview',
    display_name: 'OpenAI: GPT-4 Turbo (older v1106)',
    input_price_per_1m_tokens: 10,
    output_price_per_1m_tokens: 30,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-3.5-turbo-instruct',
    display_name: 'OpenAI: GPT-3.5 Turbo Instruct',
    input_price_per_1m_tokens: 1.5,
    output_price_per_1m_tokens: 2,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-3.5-turbo-16k',
    display_name: 'OpenAI: GPT-3.5 Turbo 16k',
    input_price_per_1m_tokens: 3,
    output_price_per_1m_tokens: 4,
    capability_tier: 'standard',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4-0314',
    display_name: 'OpenAI: GPT-4 (older v0314)',
    input_price_per_1m_tokens: 30,
    output_price_per_1m_tokens: 60,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-4',
    display_name: 'OpenAI: GPT-4',
    input_price_per_1m_tokens: 30,
    output_price_per_1m_tokens: 60,
    capability_tier: 'premium',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
  {
    provider: 'openai',
    model_id: 'gpt-3.5-turbo',
    display_name: 'OpenAI: GPT-3.5 Turbo',
    input_price_per_1m_tokens: 0.5,
    output_price_per_1m_tokens: 1.5,
    capability_tier: 'budget',
    last_verified_at: '2026-02-28T18:46:43.333Z',
  },
];

// ── Mutable runtime catalog (initialized from static data) ───

let catalog: ModelPricing[] = [...MODEL_CATALOG];

// ── Indexes (rebuilt on catalog update) ──────────────────────

let byModelId = new Map<string, ModelPricing>();
let byProvider = new Map<ProviderType, ModelPricing[]>();
let byTier = new Map<CapabilityTier, ModelPricing[]>();

function rebuildIndexes(): void {
  byModelId = new Map();
  byProvider = new Map();
  byTier = new Map();

  for (const entry of catalog) {
    byModelId.set(entry.model_id, entry);

    const providerList = byProvider.get(entry.provider) ?? [];
    providerList.push(entry);
    byProvider.set(entry.provider, providerList);

    const tierList = byTier.get(entry.capability_tier) ?? [];
    tierList.push(entry);
    byTier.set(entry.capability_tier, tierList);
  }
}

// Build indexes on module load
rebuildIndexes();

// ── Helper functions ─────────────────────────────────────────

/**
 * Look up pricing for a model by exact or fuzzy match.
 * Tries exact match first, then substring match (e.g. "claude-3-opus-20240229" matches "claude-3-opus").
 * Returns undefined if not found.
 */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  const normalized = modelId.toLowerCase();

  // Exact match
  const exact = byModelId.get(normalized);
  if (exact) return exact;

  // Substring match — find the longest catalog key that appears in the model string
  let bestMatch: ModelPricing | undefined;
  let bestLength = 0;

  for (const [key, entry] of byModelId) {
    if (normalized.includes(key) && key.length > bestLength) {
      bestMatch = entry;
      bestLength = key.length;
    }
  }

  return bestMatch;
}

/**
 * Return all models in the catalog.
 */
export function getAllModels(): readonly ModelPricing[] {
  return catalog;
}

/**
 * Return models for a given provider.
 */
export function getModelsByProvider(provider: ProviderType): readonly ModelPricing[] {
  return byProvider.get(provider) ?? [];
}

/**
 * Return models for a given capability tier.
 */
export function getModelsByTier(tier: CapabilityTier): readonly ModelPricing[] {
  return byTier.get(tier) ?? [];
}

/**
 * Replace the entire catalog with new data and rebuild indexes.
 * Used by the auto-update system.
 */
export function updateCatalog(newEntries: ModelPricing[]): void {
  catalog = [...newEntries];
  rebuildIndexes();
}

/**
 * Merge updates into the catalog. Existing entries are updated by model_id,
 * new entries are appended. Returns the number of entries added or updated.
 */
export function mergeCatalogUpdates(updates: ModelPricing[]): number {
  let changed = 0;

  for (const update of updates) {
    const idx = catalog.findIndex((e) => e.model_id === update.model_id && e.provider === update.provider);
    if (idx >= 0) {
      catalog[idx] = update;
    } else {
      catalog.push(update);
    }
    changed++;
  }

  rebuildIndexes();
  return changed;
}

/**
 * Reset the catalog to the original static data. Useful for testing.
 */
export function resetCatalog(): void {
  catalog = [...MODEL_CATALOG];
  rebuildIndexes();
}

/**
 * Get default pricing rates for a provider (used as fallback when model not in catalog).
 * Returns [inputRate, outputRate] per 1M tokens.
 */
export function getDefaultRates(provider: ProviderType): [number, number] {
  const defaults: Record<ProviderType, [number, number]> = {
    anthropic: [3, 15],
    openai: [2.5, 10],
    deepseek: [0.14, 0.28],
    google: [1.25, 5],
    openrouter: [2.5, 10],
  };
  return defaults[provider];
}
