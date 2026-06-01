import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Modular AI adapter — MAX Serving Cloud inference.
 * Modular Inc. — San José, CA. Founded 2022 by Chris Lattner, Tim Davis,
 * and Guido van Rossum (Python creator joins as advisor/investor).
 *
 * Chris Lattner biography — the compiler engineer who built modern computing:
 *   - **LLVM** (2000): Low Level Virtual Machine. Apple adopted it for Xcode in
 *     2005; now the foundation compiler infrastructure for Apple, Google, Meta,
 *     Microsoft, Intel, ARM, NVIDIA, AMD. Every major tech company ships
 *     production code compiled with LLVM.
 *   - **Clang** (2007): C/C++/Objective-C frontend for LLVM. Replaced GCC as
 *     Apple's standard compiler. Faster builds, better error messages, AST-level
 *     tooling that enabled modern IDEs and linters.
 *   - **Swift** (2010–2014): Apple's systems programming language. 1M+ developers
 *     worldwide. Powers every iOS, iPadOS, macOS, watchOS, tvOS app.
 *   - **MLIR** (2019): Machine Learning Intermediate Representation. Now the
 *     compilation backbone of TensorFlow/XLA, TorchDynamo, IREE (used by Google),
 *     and ONNX. Standardized the way ML frameworks lower to hardware.
 *   - Apple Director of Developer Tools (2010–2017), Tesla Autopilot VP
 *     (2017–2018), Google Brain / TensorFlow (2018–2020) before founding Modular.
 *
 * Modular MAX — custom inference engine, not a vLLM wrapper:
 *   MAX uses graph-level compilation (MLIR) to generate hardware-specific
 *   kernels at deploy time rather than shipping hand-tuned CUDA code. Benchmarks
 *   show 2–3x throughput vs vLLM on identical hardware for Llama-class models.
 *   MAX Serving is the serving layer: batching, KV-cache management, speculative
 *   decoding, and function calling — all under OpenAI-compatible REST endpoints.
 *
 * Mojo programming language (2023): Python superset with C++ performance.
 *   Matmul benchmarks: 68,000x faster than pure Python. Enables writing custom
 *   inference kernels in a Python-like language without dropping to C++.
 *
 * MAX Serving Cloud: shared endpoints (per-token) and dedicated endpoints
 *   (per-minute). Publicly accessible at api.modular.com/v1.
 *   Auth: Bearer token API key from console.modular.com.
 *   Billing API: None public — fetchUsage returns [].
 *   Use wrapModular() SDK wrapper for per-call cost tracking.
 *
 * $130M Series B (2024) — SV Angel, GV (Google Ventures), and others.
 * First custom-MLIR-compiler AI inference cloud on LLMeter.
 *
 * API docs: https://docs.modular.com/max/api/serve/
 */
export const modularAdapter: ProviderAdapter = {
  type: 'modular',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Modular API key is missing. Get your key from console.modular.com.'
      );

    const res = await fetch('https://api.modular.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Modular API key. Get your key from console.modular.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Modular API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Modular does not provide a public usage/billing API.
    // Use wrapModular() SDK wrapper for per-call cost tracking.
    return [];
  },
};
