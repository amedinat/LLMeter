import type { ProviderAdapter, NormalizedUsageRecord } from './types';

export const glhfAdapter: ProviderAdapter = {
  type: 'glhf',
  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new Error('GLHF API key is missing. Get your key from glhf.chat/settings.');
    }
    const res = await fetch('https://glhf.chat/api/openai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error('Invalid GLHF API key. Get your key from glhf.chat/settings.');
      }
      throw new Error(body?.error?.message ?? body?.message ?? `GLHF API returned ${res.status}`);
    }
    return true;
  },
  async fetchUsage(_apiKey, _startDate, _endDate): Promise<NormalizedUsageRecord[]> {
    return [];
  },
};
