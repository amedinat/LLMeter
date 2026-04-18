import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Azure OpenAI Service adapter.
 *
 * Credentials format: `{endpoint}::{apiKey}`
 *   e.g. `https://my-resource.openai.azure.com/::abc123xyz`
 *
 * Validates the connection by listing deployments via the Azure OpenAI Management API.
 * Usage data is not available via API key auth — Azure Cost Management requires Azure AD
 * (service principal) auth, which is out of scope for this adapter.
 *
 * For per-call cost tracking, use the `wrapAzureOpenAI()` SDK wrapper which pushes usage
 * to the LLMeter ingest API at inference time.
 *
 * API docs: https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
 */
export const azureAdapter: ProviderAdapter = {
  type: 'azure',

  async validateKey(credentials: string): Promise<boolean> {
    const { endpoint, apiKey } = parseAzureCredentials(credentials);

    // Validate by listing deployments — lightweight, reads zero tokens
    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments?api-version=2024-02-01`;
    const res = await fetch(url, {
      headers: { 'api-key': apiKey },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          body?.error?.message ??
            'Invalid Azure OpenAI API key or insufficient permissions.'
        );
      }
      if (res.status === 404) {
        throw new Error(
          'Azure OpenAI endpoint not found. Check your resource name and region.'
        );
      }
      throw new Error(
        body?.error?.message ?? `Azure OpenAI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _credentials: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Azure Cost Management requires Azure AD (service principal) authentication,
    // which is not available via the API key stored in this adapter.
    //
    // Recommendation: use wrapAzureOpenAI() from the llmeter SDK to push per-call
    // usage at inference time, which enables accurate per-model, per-customer tracking.
    return [];
  },
};

/**
 * Parse the combined credentials string `endpoint::apiKey`.
 * Throws a descriptive error if the format is wrong.
 */
export function parseAzureCredentials(credentials: string): {
  endpoint: string;
  apiKey: string;
} {
  const sep = '::';
  const idx = credentials.indexOf(sep);

  if (idx === -1) {
    throw new Error(
      'Azure credentials must be in the format: https://your-resource.openai.azure.com/::your-api-key'
    );
  }

  const endpoint = credentials.slice(0, idx).trim();
  const apiKey = credentials.slice(idx + sep.length).trim();

  if (!endpoint.startsWith('https://')) {
    throw new Error('Azure endpoint must start with https://');
  }
  if (!apiKey) {
    throw new Error('Azure API key is missing after ::');
  }

  return { endpoint, apiKey };
}

/**
 * Estimate cost for Azure OpenAI models using centralized pricing.
 * Azure pricing mirrors OpenAI list prices (no discount for API key access).
 */
export function estimateAzureCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Strip Azure deployment name prefixes if present (e.g. "gpt-4o-deployment" → "gpt-4o")
  const normalizedModel = normalizeAzureModelName(model);
  const pricing = getModelPricing(normalizedModel);

  if (pricing) {
    return (
      (inputTokens / 1_000_000) * pricing.input_price_per_1m_tokens +
      (outputTokens / 1_000_000) * pricing.output_price_per_1m_tokens
    );
  }

  // Fall back to OpenAI default rates (Azure mirrors OpenAI pricing)
  const [defaultInput, defaultOutput] = getDefaultRates('openai');
  return (
    (inputTokens / 1_000_000) * defaultInput +
    (outputTokens / 1_000_000) * defaultOutput
  );
}

/**
 * Normalize Azure deployment names to canonical OpenAI model IDs.
 * Azure users often name deployments after the model (e.g. "gpt-4o", "gpt-35-turbo").
 * This maps common Azure naming conventions to OpenAI model IDs.
 */
function normalizeAzureModelName(model: string): string {
  const m = model.toLowerCase();

  // Common Azure naming: gpt-35-turbo → gpt-3.5-turbo
  if (m.includes('gpt-35')) return model.replace(/gpt-35/i, 'gpt-3.5');

  return model;
}
