import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Infercom adapter — EU Sovereign AI Inference on SambaNova RDU.
 * Infercom SCS — Luxembourg HQ, Munich Germany (Equinix MU1 datacenter).
 * Europe's First Sovereign AI Inference Provider (self-described).
 *
 * Founders:
 *   - Cem Tufekci (Founder & Chairman)
 *   - Serik Kaldykulov (Co-Founder)
 *   - Altuğ Eker (Managing Director)
 * Investors: Qualist Investments AG (Swiss VC), Pakua Capital AG (Swiss family office).
 *
 * Technology — SambaNova SN40 RDU (Reconfigurable Dataflow Unit):
 *   Not NVIDIA GPUs. SambaNova's RDU is a dataflow chip — a Reconfigurable
 *   Dataflow Unit — purpose-built for transformer inference. Unlike GPUs that
 *   run general-purpose CUDA kernels, RDUs map attention and FFN layers
 *   directly onto configurable dataflow graphs at the silicon level.
 *   Result: up to 10x faster inference than GPU-based alternatives, 5x more
 *   energy efficient. gpt-oss-120b achieves 713 tok/s output throughput on
 *   a single SN40 node — the fastest 120B-parameter inference in Europe.
 *   Total system draws only ~10 kW avg vs thousands of kW for GPU clusters.
 *
 * Data sovereignty:
 *   All EU Sovereign models run exclusively in German datacenters (Munich,
 *   Equinix MU1). No US CLOUD Act exposure. No PATRIOT Act jurisdiction.
 *   ISO 27001:2022 certified. GDPR and EU AI Act compliance-ready.
 *   Infercom does not store any data for AI inference.
 *
 * Pricing:
 *   Billed in EUR per token (a first on LLMeter). EU Sovereign tier (SambaNova):
 *   gpt-oss-120b €0.22/€0.59, Gemma 3 12B €0.20/€0.35, MiniMax-M2.5
 *   €0.30/€1.20, MiniMax M2.7 Ultraspeed €0.60/€2.40. Global catalog
 *   (Japan-region GPU) at higher EUR rates.
 *   Free tier: €5 credit, no credit card required.
 *
 * API: OpenAI-compatible at https://api.infercom.ai/v1.
 * Auth: Bearer token API key from cloud.infercom.ai.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapInfercom() SDK wrapper for per-call cost tracking.
 *
 * Temperature: 0–1 (not the OpenAI 0–2 scale). Supports top_k.
 */
export const infercomAdapter: ProviderAdapter = {
  type: 'infercom',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Infercom API key is missing. Get your key from cloud.infercom.ai.'
      );

    const res = await fetch('https://api.infercom.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Infercom API key. Get your key from cloud.infercom.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Infercom API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Infercom does not provide a public usage/billing API.
    // Use wrapInfercom() SDK wrapper for per-call cost tracking.
    return [];
  },
};
