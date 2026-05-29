import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * InternLM (Shanghai AI Laboratory) adapter.
 * Shanghai AI Lab (上海人工智能实验室) is a major Chinese research institution
 * founded in 2020, backed by Alibaba, Tencent, ByteDance, and Sequoia China.
 * InternLM is their open-source LLM series — InternLM2 and InternLM3 rank
 * highly on C-Eval, CMMLU, and HumanEval benchmarks.
 * InternVL2 is a top-ranked open-source vision-language model globally.
 * Validates API key via GET /v1/models on the InternLM API endpoint.
 * InternLM does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapInternLM) to capture per-call costs instead.
 *
 * API docs: https://internlm.intern-ai.org.cn/api/document
 */
export const internlmAdapter: ProviderAdapter = {
  type: 'internlm',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'InternLM API key is missing. Get your key from internlm.intern-ai.org.cn/api/tokens.'
      );

    const res = await fetch(
      'https://internlm-chat.intern-ai.org.cn/puyu/api/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid InternLM API key. Get your key from internlm.intern-ai.org.cn/api/tokens.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `InternLM API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // InternLM does not provide a public usage/billing API.
    // Use wrapInternLM() SDK wrapper for per-call cost tracking.
    return [];
  },
};
