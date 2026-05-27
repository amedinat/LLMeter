import type { ProviderAdapter, NormalizedUsageRecord } from './types';

export const sensenovaAdapter: ProviderAdapter = {
  type: 'sensenova',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('SenseNova API key is missing. Get your API key from platform.sensenova.cn.');
    }

    const res = await fetch('https://api.sensenova.cn/compatible-mode/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) return true;

    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid SenseNova API key. Get your key from platform.sensenova.cn.');
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `SenseNova returned ${res.status}`);
  },

  async fetchUsage(_apiKey: string, _startDate: Date, _endDate: Date): Promise<NormalizedUsageRecord[]> {
    return [];
  },
};
