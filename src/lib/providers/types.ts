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
  novita: {
    type: 'novita',
    name: 'Novita AI',
    description: 'Llama 3.1/3.3, DeepSeek R1/V3, Qwen 2.5, Mistral — cheap open-source inference',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://novita.ai/settings/key-management',
    color: '#7C3AED',
  },
  hyperbolic: {
    type: 'hyperbolic',
    name: 'Hyperbolic',
    description: 'Llama 4, DeepSeek R1/V3, Qwen 2.5, Mistral — low-latency open-source inference',
    keyPrefix: '',
    keyPlaceholder: 'eyJhbGc...',
    helpUrl: 'https://app.hyperbolic.xyz/settings',
    color: '#0EA5E9',
  },
  sambanova: {
    type: 'sambanova',
    name: 'SambaNova Cloud',
    description: 'Llama 3.1/3.3/4, DeepSeek R1/V3, Qwen 2.5 — ultra-fast inference on custom hardware',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    helpUrl: 'https://cloud.sambanova.ai/apis',
    color: '#FF6B35',
  },
  lambdalabs: {
    type: 'lambdalabs',
    name: 'Lambda Labs',
    description: 'Llama 3.1/3.3, Hermes 3, Qwen 2.5, Liquid LFM — on-demand GPU cloud inference',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://cloud.lambdalabs.com/api-keys',
    color: '#7B2D8B',
  },
  lepton: {
    type: 'lepton',
    name: 'Lepton AI',
    description: 'Llama 3.1/3, Mistral 7B, Mixtral 8x7B, Qwen 2.5 — low-latency inference API',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://dashboard.lepton.ai/',
    color: '#6366F1',
  },
  inferencenet: {
    type: 'inferencenet',
    name: 'Inference.net',
    description: 'Llama 3.3 70B, DeepSeek R1/V3, Qwen 2.5, Mistral — NVIDIA H100-powered inference',
    keyPrefix: '',
    keyPlaceholder: 'inf-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://app.inference.net/keys',
    color: '#10B981',
  },
  nvidia: {
    type: 'nvidia',
    name: 'NVIDIA NIM',
    description: 'Llama 3.3 70B, Nemotron, Mistral, DeepSeek R1 — NVIDIA-hosted inference APIs',
    keyPrefix: 'nvapi-',
    keyPlaceholder: 'nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://build.nvidia.com',
    color: '#76B900',
  },
  cloudflare: {
    type: 'cloudflare',
    name: 'Cloudflare Workers AI',
    description: 'Llama 3.3 70B, Llama 3.2, Mistral 7B, Gemma — edge inference with global network',
    keyPrefix: '',
    keyPlaceholder: 'accountId::apiToken',
    helpUrl: 'https://dash.cloudflare.com/profile/api-tokens',
    color: '#F38020',
  },
  nebius: {
    type: 'nebius',
    name: 'Nebius AI',
    description: 'Llama 3.3 70B, DeepSeek R1/V3, Qwen 2.5 72B, Mistral Nemo — European-first cloud inference',
    keyPrefix: '',
    keyPlaceholder: 'eyJhbGci...',
    helpUrl: 'https://studio.nebius.ai',
    color: '#5B4CF5',
  },
  replicate: {
    type: 'replicate',
    name: 'Replicate',
    description: 'Llama 3.3 70B, DeepSeek R1, Mixtral, Gemma 2, Qwen 2.5 — deploy and run any open-source model',
    keyPrefix: 'r8_',
    keyPlaceholder: 'r8_...',
    helpUrl: 'https://replicate.com/account/api-tokens',
    color: '#000000',
  },
  featherless: {
    type: 'featherless',
    name: 'Featherless.ai',
    description: 'Llama 3.3 70B, DeepSeek R1, Qwen 2.5, Phi-4 — 3,000+ open-source models, serverless, no GPU setup',
    keyPrefix: '',
    keyPlaceholder: 'your-featherless-api-key',
    helpUrl: 'https://featherless.ai/account',
    color: '#7C3AED',
  },
  huggingface: {
    type: 'huggingface',
    name: 'HuggingFace',
    description: 'Llama 3.3 70B, Mistral 7B, Qwen 2.5, DeepSeek R1, Gemma 2 — serverless inference on 100,000+ open-source models',
    keyPrefix: 'hf_',
    keyPlaceholder: 'hf_...',
    helpUrl: 'https://huggingface.co/settings/tokens',
    color: '#FF9D00',
  },
  yi: {
    type: 'yi',
    name: '01.AI',
    description: 'Yi-Lightning, Yi-Large, Yi-Medium, Yi-Spark — 01.AI Yi models, OpenAI-compatible, ultra-low cost',
    keyPrefix: '',
    keyPlaceholder: 'your-01ai-api-key',
    helpUrl: 'https://platform.lingyiwanwu.com/apikeys',
    color: '#1A73E8',
  },
  zhipu: {
    type: 'zhipu',
    name: 'Zhipu AI',
    description: 'GLM-4-Plus, GLM-4, GLM-4-Long, GLM-4-Flash, GLM-4-Air — ChatGLM models, OpenAI-compatible, Chinese AI',
    keyPrefix: '',
    keyPlaceholder: 'your-zhipu-api-key',
    helpUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    color: '#4E6EF2',
  },
  upstage: {
    type: 'upstage',
    name: 'Upstage',
    description: 'Solar Pro, Solar Mini — Korean AI company, top-ranked open LLMs on OpenLLM leaderboard',
    keyPrefix: 'up_',
    keyPlaceholder: 'up_...',
    helpUrl: 'https://console.upstage.ai/api-keys',
    color: '#FF6B2B',
  },
  moonshot: {
    type: 'moonshot',
    name: 'Moonshot AI',
    description: 'moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k — Kimi models, OpenAI-compatible, long-context Chinese AI',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.moonshot.cn/user/api-keys',
    color: '#1A73E8',
  },
  writer: {
    type: 'writer',
    name: 'Writer',
    description: 'Palmyra X 004, Palmyra Med 70B, Palmyra Fin 70B — enterprise AI, domain-specialized models, OpenAI-compatible',
    keyPrefix: '',
    keyPlaceholder: 'your-writer-api-key',
    helpUrl: 'https://app.writer.com/aistudio/organization/apps',
    color: '#6C47FF',
  },
  qwen: {
    type: 'qwen',
    name: 'Alibaba Cloud (Qwen)',
    description: 'Qwen-Max, Qwen-Plus, Qwen-Turbo, Qwen3 — Alibaba Cloud DashScope, OpenAI-compatible, multilingual AI',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://bailian.console.aliyun.com/apiKey',
    color: '#FF6A00',
  },
  minimax: {
    type: 'minimax',
    name: 'MiniMax',
    description: 'MiniMax-Text-01, abab6.5s-chat, abab5.5s-chat — OpenAI-compatible, 1M context window Chinese AI',
    keyPrefix: '',
    keyPlaceholder: 'your-minimax-api-key',
    helpUrl: 'https://platform.minimaxi.chat/user-center/basic-information/interface-key',
    color: '#0066FF',
  },
  doubao: {
    type: 'doubao',
    name: 'ByteDance (Doubao)',
    description: 'Doubao-Pro-32k, Doubao-Lite-32k, Doubao-1.5-Pro — OpenAI-compatible, ultra-low cost, TikTok parent company AI',
    keyPrefix: '',
    keyPlaceholder: 'your-volcengine-ark-api-key',
    helpUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    color: '#E02B2B',
  },
  hunyuan: {
    type: 'hunyuan',
    name: 'Tencent Hunyuan',
    description: 'Hunyuan-Pro, Hunyuan-Turbo, Hunyuan-Standard — OpenAI-compatible, Tencent Cloud AI with 256K context',
    keyPrefix: '',
    keyPlaceholder: 'your-hunyuan-api-key',
    helpUrl: 'https://console.cloud.tencent.com/hunyuan/api-key',
    color: '#00A3FF',
  },
  baichuan: {
    type: 'baichuan',
    name: 'Baichuan AI',
    description: 'Baichuan4, Baichuan4-Turbo, Baichuan4-Air — OpenAI-compatible, Chinese LLMs with strong bilingual performance',
    keyPrefix: '',
    keyPlaceholder: 'your-baichuan-api-key',
    helpUrl: 'https://platform.baichuan-ai.com/console/apikey',
    color: '#5B8FF9',
  },
  siliconflow: {
    type: 'siliconflow',
    name: 'SiliconFlow',
    description: 'SiliconCloud — DeepSeek-V3, Qwen2.5, Llama 3.3 and 300+ open-source models at ultra-low cost',
    keyPrefix: '',
    keyPlaceholder: 'your-siliconflow-api-key',
    helpUrl: 'https://cloud.siliconflow.cn/account/ak',
    color: '#00B4D8',
  },
  stepfun: {
    type: 'stepfun',
    name: 'Stepfun',
    description: 'step-2 reasoning, step-1-32k, step-1-flash — Chinese AI with OpenAI-compatible API',
    keyPrefix: '',
    keyPlaceholder: 'your-stepfun-api-key',
    helpUrl: 'https://platform.stepfun.com/apikeys',
    color: '#FF6F61',
  },
  baidu: {
    type: 'baidu',
    name: 'Baidu AI Cloud (ERNIE)',
    description: 'ERNIE-4.0, ERNIE-3.5, ERNIE-Speed, ERNIE-Lite — Baidu Qianfan, OpenAI-compatible, Chinese AI',
    keyPrefix: '',
    keyPlaceholder: 'your-baidu-qianfan-api-key',
    helpUrl: 'https://console.bce.baidu.com/qianfan/apikey/list',
    color: '#2932E1',
  },
  kluster: {
    type: 'kluster',
    name: 'Kluster AI',
    description: 'Llama 3.3/4, DeepSeek R1/V3, Qwen 2.5/3 — European GPU cloud, OpenAI-compatible',
    keyPrefix: '',
    keyPlaceholder: 'your-kluster-api-key',
    helpUrl: 'https://platform.kluster.ai/account/api-keys',
    color: '#7C3AED',
  },
  friendli: {
    type: 'friendli',
    name: 'Friendli AI',
    description: 'Llama 3.3/3.1, DeepSeek R1/V3, Qwen 2.5, Mixtral — Korean serverless inference, OpenAI-compatible',
    keyPrefix: '',
    keyPlaceholder: 'your-friendli-personal-access-token',
    helpUrl: 'https://suite.friendli.ai/user/personal-access-tokens',
    color: '#6366F1',
  },
  llamaapi: {
    type: 'llamaapi',
    name: 'Llama API',
    description: 'Llama 4 Scout/Maverick, Llama 3.3 70B, Llama 3.1 405B/70B/8B, Llama 3.2 Vision — Meta\'s official inference API, OpenAI-compatible',
    keyPrefix: '',
    keyPlaceholder: 'your-llama-api-key',
    helpUrl: 'https://llama.developer.meta.com/docs/overview',
    color: '#0866FF',
  },
  reka: {
    type: 'reka',
    name: 'Reka AI',
    description: 'reka-core, reka-flash, reka-edge — multimodal text+vision models from Reka AI, OpenAI-compatible',
    keyPrefix: '',
    keyPlaceholder: 'your-reka-api-key',
    helpUrl: 'https://platform.reka.ai/settings/api-keys',
    color: '#7C3AED',
  },
  maritaca: {
    type: 'maritaca',
    name: 'Maritaca AI',
    description: 'Sabiá-3, Sabiá-3 Small — Portuguese-optimized LLMs from Maritaca AI (Brazil)',
    keyPrefix: '',
    keyPlaceholder: 'your-maritaca-api-key',
    helpUrl: 'https://plataforma.maritaca.ai/',
    color: '#009C3B',
  },
  scaleway: {
    type: 'scaleway',
    name: 'Scaleway',
    description: 'Llama 3.3 70B, Mistral Nemo, DeepSeek R1 — open-source LLMs hosted on French GDPR-native infrastructure',
    keyPrefix: 'scw',
    keyPlaceholder: 'scw-your-iam-secret-key',
    helpUrl: 'https://console.scaleway.com/iam/api-keys',
    color: '#4F0599',
  },
  nscale: {
    type: 'nscale',
    name: 'Nscale',
    description: 'Llama 3.3 70B, DeepSeek R1, Mistral 7B — open-source LLMs on UK AI infrastructure with competitive European pricing',
    keyPrefix: '',
    keyPlaceholder: 'your-nscale-api-key',
    helpUrl: 'https://console.nscale.com/settings',
    color: '#1E3A5F',
  },
};
