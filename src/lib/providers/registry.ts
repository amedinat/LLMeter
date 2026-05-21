import type { ProviderType } from '@/types';
import type { ProviderAdapter } from './types';
import { openaiAdapter } from './openai-adapter';
import { anthropicAdapter } from './anthropic-adapter';
// google-adapter exists but is disabled — Google AI doesn't have a public usage API yet
import { deepseekAdapter } from './deepseek-adapter';
import { openrouterAdapter } from './openrouter-adapter';
import { mistralAdapter } from './mistral-adapter';
import { azureAdapter } from './azure-adapter';
import { xaiAdapter } from './xai-adapter';
import { cohereAdapter } from './cohere-adapter';
import { groqAdapter } from './groq-adapter';
import { togetherAdapter } from './together-adapter';
import { fireworksAdapter } from './fireworks-adapter';
import { perplexityAdapter } from './perplexity-adapter';
import { cerebrasAdapter } from './cerebras-adapter';
import { ai21Adapter } from './ai21-adapter';
import { deepinfraAdapter } from './deepinfra-adapter';
import { novitaAdapter } from './novita-adapter';
import { hyperbolicAdapter } from './hyperbolic-adapter';
import { sambanovaAdapter } from './sambanova-adapter';
import { lambdalabsAdapter } from './lambdalabs-adapter';
import { leptonAdapter } from './lepton-adapter';
import { inferencenetAdapter } from './inferencenet-adapter';
import { nvidiaAdapter } from './nvidia-adapter';
import { cloudflareAdapter } from './cloudflare-adapter';
import { nebiusAdapter } from './nebius-adapter';
import { replicateAdapter } from './replicate-adapter';
import { featherlessAdapter } from './featherless-adapter';
import { huggingfaceAdapter } from './huggingface-adapter';
import { yiAdapter } from './yi-adapter';
import { zhipuAdapter } from './zhipu-adapter';
import { upstageAdapter } from './upstage-adapter';
import { moonshotAdapter } from './moonshot-adapter';
import { writerAdapter } from './writer-adapter';
import { qwenAdapter } from './qwen-adapter';
import { minimaxAdapter } from './minimax-adapter';
import { doubaoAdapter } from './doubao-adapter';
import { hunyuanAdapter } from './hunyuan-adapter';
import { baichuanAdapter } from './baichuan-adapter';
import { siliconflowAdapter } from './siliconflow-adapter';
import { stepfunAdapter } from './stepfun-adapter';
import { baiduAdapter } from './baidu-adapter';
import { klusterAdapter } from './kluster-adapter';
import { friendliAdapter } from './friendli-adapter';
import { llamaapiAdapter } from './llamaapi-adapter';
import { rekaAdapter } from './reka-adapter';
import { maritacaAdapter } from './maritaca-adapter';
import { scalewayAdapter } from './scaleway-adapter';
import { nscaleAdapter } from './nscale-adapter';

/**
 * Provider adapter registry.
 * Adapters are registered here and looked up by provider type.
 * Note: Google AI is excluded — no public usage/billing API available.
 */
const adapters = new Map<ProviderType, ProviderAdapter>();

// Register built-in adapters
adapters.set('openai', openaiAdapter);
adapters.set('anthropic', anthropicAdapter);
adapters.set('deepseek', deepseekAdapter);
adapters.set('openrouter', openrouterAdapter);
adapters.set('mistral', mistralAdapter);
adapters.set('azure', azureAdapter);
adapters.set('xai', xaiAdapter);
adapters.set('cohere', cohereAdapter);
adapters.set('groq', groqAdapter);
adapters.set('together', togetherAdapter);
adapters.set('fireworks', fireworksAdapter);
adapters.set('perplexity', perplexityAdapter);
adapters.set('cerebras', cerebrasAdapter);
adapters.set('ai21', ai21Adapter);
adapters.set('deepinfra', deepinfraAdapter);
adapters.set('novita', novitaAdapter);
adapters.set('hyperbolic', hyperbolicAdapter);
adapters.set('sambanova', sambanovaAdapter);
adapters.set('lambdalabs', lambdalabsAdapter);
adapters.set('lepton', leptonAdapter);
adapters.set('inferencenet', inferencenetAdapter);
adapters.set('nvidia', nvidiaAdapter);
adapters.set('cloudflare', cloudflareAdapter);
adapters.set('nebius', nebiusAdapter);
adapters.set('replicate', replicateAdapter);
adapters.set('featherless', featherlessAdapter);
adapters.set('huggingface', huggingfaceAdapter);
adapters.set('yi', yiAdapter);
adapters.set('zhipu', zhipuAdapter);
adapters.set('upstage', upstageAdapter);
adapters.set('moonshot', moonshotAdapter);
adapters.set('writer', writerAdapter);
adapters.set('qwen', qwenAdapter);
adapters.set('minimax', minimaxAdapter);
adapters.set('doubao', doubaoAdapter);
adapters.set('hunyuan', hunyuanAdapter);
adapters.set('baichuan', baichuanAdapter);
adapters.set('siliconflow', siliconflowAdapter);
adapters.set('stepfun', stepfunAdapter);
adapters.set('baidu', baiduAdapter);
adapters.set('kluster', klusterAdapter);
adapters.set('friendli', friendliAdapter);
adapters.set('llamaapi', llamaapiAdapter);
adapters.set('reka', rekaAdapter);
adapters.set('maritaca', maritacaAdapter);
adapters.set('scaleway', scalewayAdapter);
adapters.set('nscale', nscaleAdapter);

export function registerAdapter(adapter: ProviderAdapter) {
  adapters.set(adapter.type, adapter);
}

export function getAdapter(type: ProviderType): ProviderAdapter {
  const adapter = adapters.get(type);
  if (!adapter) {
    throw new Error(`No adapter registered for provider: ${type}`);
  }
  return adapter;
}

export function getRegisteredProviders(): ProviderType[] {
  return Array.from(adapters.keys());
}
