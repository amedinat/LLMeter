import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Tenstorrent adapter (tenstorrent.com — RISC-V AI accelerator cloud).
 * Tenstorrent Inc. — Santa Clara, CA + Toronto, ON. Founded 2016.
 * CEO: Jim Keller (legendary CPU architect — AMD K7/K8/Zen, Apple A4/A5,
 * Intel, Tesla FSD chip). First RISC-V AI accelerator on LLMeter.
 * Wormhole (n150, n300) and Blackhole accelerators use RISC-V Tensix cores.
 * Funding: $693M Series D (2024) — Hyundai, Samsung, BHP, Bezos Expeditions,
 * AFW, Fidelity. Total ~$700M+. Closed the "Big 5 AI chip" story on LLMeter:
 * NVIDIA (Day 1) → AMD/Lamini (Day 122) → Intel Gaudi (Day 123) →
 * Groq LPU → Cerebras WSE → Tenstorrent RISC-V (Day 131).
 * API endpoint: https://api.tenstorrent.ai/v1
 * Auth: Bearer token API key from cloud.tenstorrent.com.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapTenstorrent() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://tenstorrent.com/cloud
 */
export const tenstorrentAdapter: ProviderAdapter = {
  type: 'tenstorrent',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Tenstorrent API key is missing. Get your key from cloud.tenstorrent.com.'
      );

    const res = await fetch('https://api.tenstorrent.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Tenstorrent API key. Get your key from cloud.tenstorrent.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Tenstorrent API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Tenstorrent does not provide a public usage/billing API.
    // Use wrapTenstorrent() SDK wrapper for per-call cost tracking.
    return [];
  },
};
