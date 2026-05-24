'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Check, Copy, Package } from 'lucide-react';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.llmeter.org';

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="rounded-md bg-muted p-4 text-sm overflow-auto">
        <code data-language={language}>{code}</code>
      </pre>
    </div>
  );
}

const curlExample = `curl -X POST ${APP_BASE_URL}/api/ingest \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '[
    {
      "model": "gpt-4o",
      "input_tokens": 1500,
      "output_tokens": 300,
      "customer_id": "cust_abc123",
      "timestamp": "2026-03-28T10:00:00Z"
    }
  ]'`;

const nodeExample = `const response = await fetch("${APP_BASE_URL}/api/ingest", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify([
    {
      model: "gpt-4o",
      input_tokens: 1500,
      output_tokens: 300,
      customer_id: "cust_abc123",
      timestamp: new Date().toISOString(),
    },
  ]),
});

const data = await response.json();
console.log(data);`;

const pythonExample = `import requests

response = requests.post(
    "${APP_BASE_URL}/api/ingest",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
    },
    json=[
        {
            "model": "gpt-4o",
            "input_tokens": 1500,
            "output_tokens": 300,
            "customer_id": "cust_abc123",
            "timestamp": "2026-03-28T10:00:00Z",
        }
    ],
)

print(response.json())`;

const sdkInstallExample = `npm install llmeter
# or
pnpm add llmeter
# or
yarn add llmeter`;

const sdkQuickstartExample = `import LLMeter from 'llmeter';

const llmeter = new LLMeter({ apiKey: 'lm_your_api_key' });
// or set LLMETER_API_KEY env var — no code change needed

// Track a single LLM call
llmeter.track({
  model: 'gpt-4o',
  inputTokens: 120,
  outputTokens: 340,
  customerId: 'user_abc123',
});

// Events are auto-batched and flushed every 5 s (configurable).
// Call shutdown() before your process exits to flush remaining events:
process.on('beforeExit', () => llmeter.shutdown());`;

const sdkOpenAIExample = `import OpenAI from 'openai';
import LLMeter, { wrapOpenAI } from 'llmeter';

const openai = new OpenAI();
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedOpenAI = wrapOpenAI(openai, llmeter);

// Pass llmeter_customer_id in the options object — it is stripped before calling OpenAI
const completion = await trackedOpenAI.chat.completions.create(
  { model: 'gpt-4o', messages: [{ role: 'user', content: 'Hello!' }] },
  { llmeter_customer_id: 'user_abc123' }
);`;

const sdkAnthropicExample = `import Anthropic from '@anthropic-ai/sdk';
import LLMeter, { wrapAnthropic } from 'llmeter';

const anthropic = new Anthropic();
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAnthropic = wrapAnthropic(anthropic, llmeter);

const message = await trackedAnthropic.messages.create(
  {
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' }
);`;

const sdkGoogleExample = `import { GoogleGenerativeAI } from '@google/generative-ai';
import LLMeter, { wrapGoogleAI } from 'llmeter';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedGenAI = wrapGoogleAI(genAI, llmeter);

// Pass llmeter_customer_id as the second arg to generateContent — stripped before forwarding
const model = trackedGenAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
const result = await model.generateContent(
  'Explain quantum computing in one paragraph',
  { llmeter_customer_id: 'user_abc123' }
);`;

const sdkBedrockExample = `import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import LLMeter, { wrapBedrock } from 'llmeter';

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedBedrock = wrapBedrock(bedrock, llmeter);

// All ConverseCommand calls are tracked automatically
const response = await trackedBedrock.send(
  new ConverseCommand({
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    messages: [{ role: 'user', content: [{ text: 'Hello!' }] }],
  }),
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Bedrock
)`;

const sdkAzureExample = `import { AzureOpenAI } from 'openai';
import LLMeter, { wrapAzureOpenAI } from 'llmeter';

const azure = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: '2024-02-01',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAzure = wrapAzureOpenAI(azure, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedAzure.chat.completions.create(
  {
    model: 'gpt-4o', // your Azure deployment name
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Azure
);`;

const sdkCohereExample = `import { CohereClient } from 'cohere-ai';
import LLMeter, { wrapCohere } from 'llmeter';

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCohere = wrapCohere(cohere, llmeter);

// All cohere.chat() calls are tracked automatically
const response = await trackedCohere.chat(
  {
    model: 'command-r-plus',
    message: 'Hello!',
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Cohere
);`;

const sdkGroqExample = `import Groq from 'groq-sdk';
import LLMeter, { wrapGroq } from 'llmeter';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedGroq = wrapGroq(groq, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedGroq.chat.completions.create(
  {
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Groq
);`;

const sdkTogetherExample = `import OpenAI from 'openai';
import LLMeter, { wrapTogether } from 'llmeter';

// Together AI is OpenAI-compatible — use the openai package with their base URL
const together = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedTogether = wrapTogether(together, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedTogether.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Together AI
);`;

const sdkFireworksExample = `import OpenAI from 'openai';
import LLMeter, { wrapFireworks } from 'llmeter';

// Fireworks AI is OpenAI-compatible — use the openai package with their base URL
const fireworks = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: 'https://api.fireworks.ai/inference/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedFireworks = wrapFireworks(fireworks, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedFireworks.chat.completions.create(
  {
    model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Fireworks AI
);`;

const sdkPerplexityExample = `import OpenAI from 'openai';
import LLMeter, { wrapPerplexity } from 'llmeter';

// Perplexity AI is OpenAI-compatible — use the openai package with their base URL
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedPerplexity = wrapPerplexity(perplexity, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedPerplexity.chat.completions.create(
  {
    model: 'sonar-pro',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Perplexity AI
);`;

const sdkCerebrasExample = `import OpenAI from 'openai';
import LLMeter, { wrapCerebras } from 'llmeter';

// Cerebras is OpenAI-compatible — use the openai package with their base URL
const cerebras = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY,
  baseURL: 'https://api.cerebras.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCerebras = wrapCerebras(cerebras, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedCerebras.chat.completions.create(
  {
    model: 'llama-3.3-70b',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Cerebras
);`;

const sdkAI21Example = `import OpenAI from 'openai';
import LLMeter, { wrapAI21 } from 'llmeter';

// AI21 Labs is OpenAI-compatible — use the openai package with their base URL
const ai21 = new OpenAI({
  apiKey: process.env.AI21_API_KEY,
  baseURL: 'https://api.ai21.com/studio/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAI21 = wrapAI21(ai21, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedAI21.chat.completions.create(
  {
    model: 'jamba-1.5-large',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to AI21 Labs
);`;

const sdkXaiExample = `import OpenAI from 'openai';
import LLMeter, { wrapXai } from 'llmeter';

// xAI (Grok) is OpenAI-compatible — use the openai package with their base URL
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedXai = wrapXai(xai, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedXai.chat.completions.create(
  {
    model: 'grok-3',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to xAI
);`;

const sdkMistralExample = `import OpenAI from 'openai';
import LLMeter, { wrapMistral } from 'llmeter';

// Mistral is OpenAI-compatible — use the openai package with their base URL
const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: 'https://api.mistral.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedMistral = wrapMistral(mistral, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedMistral.chat.completions.create(
  {
    model: 'mistral-large-latest',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Mistral
);`;

const sdkDeepSeekExample = `import OpenAI from 'openai';
import LLMeter, { wrapDeepSeek } from 'llmeter';

// DeepSeek is OpenAI-compatible — use the openai package with their base URL
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedDeepSeek = wrapDeepSeek(deepseek, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedDeepSeek.chat.completions.create(
  {
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to DeepSeek
);`;

const sdkOpenRouterExample = `import OpenAI from 'openai';
import LLMeter, { wrapOpenRouter } from 'llmeter';

// OpenRouter is OpenAI-compatible — access 500+ models via a single API key
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedOpenRouter = wrapOpenRouter(openrouter, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedOpenRouter.chat.completions.create(
  {
    model: 'anthropic/claude-3-5-sonnet',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to OpenRouter
);`;

const sdkNovitaExample = `import OpenAI from 'openai';
import LLMeter, { wrapNovita } from 'llmeter';

// Novita AI is OpenAI-compatible — use the openai package with their base URL
const novita = new OpenAI({
  apiKey: process.env.NOVITA_API_KEY,
  baseURL: 'https://api.novita.ai/v3/openai',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNovita = wrapNovita(novita, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedNovita.chat.completions.create(
  {
    model: 'meta-llama/llama-3.3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Novita AI
);`;

const sdkHyperbolicExample = `import OpenAI from 'openai';
import LLMeter, { wrapHyperbolic } from 'llmeter';

// Hyperbolic is OpenAI-compatible — use the openai package with their base URL
const hyperbolic = new OpenAI({
  apiKey: process.env.HYPERBOLIC_API_KEY,
  baseURL: 'https://api.hyperbolic.xyz/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedHyperbolic = wrapHyperbolic(hyperbolic, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedHyperbolic.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Hyperbolic
);`;

const sdkDeepInfraExample = `import OpenAI from 'openai';
import LLMeter, { wrapDeepInfra } from 'llmeter';

// DeepInfra is OpenAI-compatible — use the openai package with their base URL
const deepinfra = new OpenAI({
  apiKey: process.env.DEEPINFRA_API_KEY,
  baseURL: 'https://api.deepinfra.com/v1/openai',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedDeepInfra = wrapDeepInfra(deepinfra, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedDeepInfra.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to DeepInfra
);`;

const sdkLambdaLabsExample = `import OpenAI from 'openai';
import LLMeter, { wrapLambdaLabs } from 'llmeter';

// Lambda Labs is OpenAI-compatible — use the openai package with their base URL
const lambdalabs = new OpenAI({
  apiKey: process.env.LAMBDA_API_KEY,
  baseURL: 'https://api.lambdalabs.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedLambdaLabs = wrapLambdaLabs(lambdalabs, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedLambdaLabs.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct-FP8',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Lambda Labs
);`;

const sdkSambanovaExample = `import OpenAI from 'openai';
import LLMeter, { wrapSambaNova } from 'llmeter';

// SambaNova Cloud is OpenAI-compatible — use the openai package with their base URL
const sambanova = new OpenAI({
  apiKey: process.env.SAMBANOVA_API_KEY,
  baseURL: 'https://api.sambanova.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedSambaNova = wrapSambaNova(sambanova, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedSambaNova.chat.completions.create(
  {
    model: 'Meta-Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to SambaNova
);`;

const sdkLeptonExample = `import OpenAI from 'openai';
import LLMeter, { wrapLepton } from 'llmeter';

// Lepton AI is OpenAI-compatible — use the openai package with their base URL
const lepton = new OpenAI({
  apiKey: process.env.LEPTON_API_KEY,
  baseURL: 'https://llm.lepton.ai/api/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedLepton = wrapLepton(lepton, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedLepton.chat.completions.create(
  {
    model: 'llama3-1-70b',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Lepton AI
);`;

const sdkInferenceNetExample = `import OpenAI from 'openai';
import LLMeter, { wrapInferenceNet } from 'llmeter';

// Inference.net is OpenAI-compatible — use the openai package with their base URL
const inferencenet = new OpenAI({
  apiKey: process.env.INFERENCENET_API_KEY,
  baseURL: 'https://api.inference.net/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedInferenceNet = wrapInferenceNet(inferencenet, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedInferenceNet.chat.completions.create(
  {
    model: 'meta-llama/llama-3.3-70b-instruct/fp-8',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Inference.net
);`;

const sdkNvidiaExample = `import OpenAI from 'openai';
import LLMeter, { wrapNvidia } from 'llmeter';

// NVIDIA NIM is OpenAI-compatible — use the openai package with NVIDIA's base URL
const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY, // nvapi-...
  baseURL: 'https://integrate.api.nvidia.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNvidia = wrapNvidia(nvidia, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedNvidia.chat.completions.create(
  {
    model: 'meta/llama-3.3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to NVIDIA NIM
);`;

const sdkCloudflareExample = `import OpenAI from 'openai';
import LLMeter, { wrapCloudflare } from 'llmeter';

// Cloudflare Workers AI is OpenAI-compatible — use the openai package with your account URL
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID; // from dash.cloudflare.com
const cloudflare = new OpenAI({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  baseURL: \`https://api.cloudflare.com/client/v4/accounts/\${accountId}/ai/v1\`,
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCF = wrapCloudflare(cloudflare, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedCF.chat.completions.create(
  {
    model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Cloudflare
);`;

const sdkFeatherlessExample = `import OpenAI from 'openai';
import LLMeter, { wrapFeatherless } from 'llmeter';

// Featherless.ai is OpenAI-compatible — use the openai package with Featherless' base URL
const featherless = new OpenAI({
  apiKey: process.env.FEATHERLESS_API_KEY,
  baseURL: 'https://api.featherless.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedFeatherless = wrapFeatherless(featherless, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedFeatherless.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Featherless
);`;

const sdkZhipuExample = `import OpenAI from 'openai';
import LLMeter, { wrapZhipu } from 'llmeter';

// Zhipu AI GLM models are OpenAI-compatible — use the openai package with Zhipu's base URL
const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedZhipu = wrapZhipu(zhipu, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedZhipu.chat.completions.create(
  {
    model: 'glm-4-plus',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Zhipu AI
);`;

const sdkYiExample = `import OpenAI from 'openai';
import LLMeter, { wrapYi } from 'llmeter';

// 01.AI Yi models are OpenAI-compatible — use the openai package with 01.AI's base URL
const yi = new OpenAI({
  apiKey: process.env.YI_API_KEY,
  baseURL: 'https://api.lingyiwanwu.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedYi = wrapYi(yi, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedYi.chat.completions.create(
  {
    model: 'yi-lightning',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to 01.AI
);`;

const sdkMoonshotExample = `import OpenAI from 'openai';
import LLMeter, { wrapMoonshot } from 'llmeter';

// Moonshot AI (Kimi) models are OpenAI-compatible — use the openai package with Moonshot's base URL
const moonshot = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.cn/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedMoonshot = wrapMoonshot(moonshot, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedMoonshot.chat.completions.create(
  {
    model: 'moonshot-v1-8k',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Moonshot
);`;

const sdkWriterExample = `import OpenAI from 'openai';
import LLMeter, { wrapWriter } from 'llmeter';

// Writer models are OpenAI-compatible — use the openai package with Writer's base URL
const writer = new OpenAI({
  apiKey: process.env.WRITER_API_KEY,
  baseURL: 'https://api.writer.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedWriter = wrapWriter(writer, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedWriter.chat.completions.create(
  {
    model: 'palmyra-x-004',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Writer
);`;

const sdkQwenExample = `import OpenAI from 'openai';
import LLMeter, { wrapQwen } from 'llmeter';

// Qwen models are OpenAI-compatible — use the openai package with DashScope's base URL
const qwen = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedQwen = wrapQwen(qwen, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedQwen.chat.completions.create(
  {
    model: 'qwen-max',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Qwen
);`;

const sdkDoubaoExample = `import OpenAI from 'openai';
import LLMeter, { wrapDoubao } from 'llmeter';

// Doubao models (ByteDance/Volcengine) are OpenAI-compatible — use the openai package with the Ark base URL
const doubao = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedDoubao = wrapDoubao(doubao, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedDoubao.chat.completions.create(
  {
    model: 'doubao-pro-32k',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Doubao
);`;

const sdkHunyuanExample = `import OpenAI from 'openai';
import LLMeter, { wrapHunyuan } from 'llmeter';

// Tencent Hunyuan models are OpenAI-compatible — use the openai package with the Hunyuan base URL
const hunyuan = new OpenAI({
  apiKey: process.env.HUNYUAN_API_KEY,
  baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedHunyuan = wrapHunyuan(hunyuan, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedHunyuan.chat.completions.create(
  {
    model: 'hunyuan-pro',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Hunyuan
);`;

const sdkBaichuanExample = `import OpenAI from 'openai';
import LLMeter, { wrapBaichuan } from 'llmeter';

// Baichuan AI models are OpenAI-compatible — use the openai package with the Baichuan base URL
const baichuan = new OpenAI({
  apiKey: process.env.BAICHUAN_API_KEY,
  baseURL: 'https://api.baichuan-ai.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedBaichuan = wrapBaichuan(baichuan, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedBaichuan.chat.completions.create(
  {
    model: 'Baichuan4-Turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Baichuan
);`;

const sdkSiliconFlowExample = `import OpenAI from 'openai';
import LLMeter, { wrapSiliconFlow } from 'llmeter';

// SiliconFlow is OpenAI-compatible — use the openai package with the SiliconFlow base URL
const siliconflow = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedSiliconFlow = wrapSiliconFlow(siliconflow, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedSiliconFlow.chat.completions.create(
  {
    model: 'deepseek-ai/DeepSeek-V3',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to SiliconFlow
);`;

const sdkKlusterExample = `import OpenAI from 'openai';
import LLMeter, { wrapKluster } from 'llmeter';

// Kluster AI is OpenAI-compatible — use the openai package with the Kluster base URL
const kluster = new OpenAI({
  apiKey: process.env.KLUSTER_API_KEY,
  baseURL: 'https://api.kluster.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedKluster = wrapKluster(kluster, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedKluster.chat.completions.create(
  {
    model: 'klusterai/Meta-Llama-3.3-70B-Instruct-Turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Kluster
);`;

const sdkFriendliExample = `import OpenAI from 'openai';
import LLMeter, { wrapFriendli } from 'llmeter';

// Friendli AI is OpenAI-compatible — use the openai package with the Friendli base URL
const friendli = new OpenAI({
  apiKey: process.env.FRIENDLI_TOKEN,
  baseURL: 'https://inference.friendli.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedFriendli = wrapFriendli(friendli, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedFriendli.chat.completions.create(
  {
    model: 'meta-llama-3.3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Friendli
);`;

const sdkRekaExample = `import OpenAI from 'openai';
import LLMeter, { wrapReka } from 'llmeter';

// Reka AI is OpenAI-compatible — use the openai package with the Reka API base URL
const reka = new OpenAI({
  apiKey: process.env.REKA_API_KEY,
  baseURL: 'https://api.reka.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedReka = wrapReka(reka, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedReka.chat.completions.create(
  {
    model: 'reka-flash-3',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Reka AI
);`;

const sdkScalewayExample = `import OpenAI from 'openai';
import LLMeter, { wrapScaleway } from 'llmeter';

// Scaleway Generative APIs are OpenAI-compatible — use the openai package with the Scaleway base URL
const scaleway = new OpenAI({
  apiKey: process.env.SCALEWAY_API_KEY,
  baseURL: 'https://api.scaleway.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedScaleway = wrapScaleway(scaleway, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedScaleway.chat.completions.create(
  {
    model: 'llama-3.3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Scaleway
);`;

const sdkNscaleExample = `import OpenAI from 'openai';
import LLMeter, { wrapNscale } from 'llmeter';

// Nscale inference API is OpenAI-compatible — use the openai package with the Nscale base URL
const nscale = new OpenAI({
  apiKey: process.env.NSCALE_API_KEY,
  baseURL: 'https://inference.nscale.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNscale = wrapNscale(nscale, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedNscale.chat.completions.create(
  {
    model: 'llama-3.3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Nscale
);`;

const sdkAIMLAPIExample = `import OpenAI from 'openai';
import LLMeter, { wrapAIMLAPI } from 'llmeter';

// AI/ML API is OpenAI-compatible — use the openai package with the AI/ML API base URL
const aimlapi = new OpenAI({
  apiKey: process.env.AIMLAPI_API_KEY,
  baseURL: 'https://api.aimlapi.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAIMLAPI = wrapAIMLAPI(aimlapi, llmeter);

// All calls are automatically tracked — 200+ models, one API key
const completion = await trackedAIMLAPI.chat.completions.create(
  {
    model: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to AI/ML API
);`;

const sdkAlephAlphaExample = `import OpenAI from 'openai';
import LLMeter, { wrapAlephAlpha } from 'llmeter';

// Aleph Alpha is OpenAI-compatible — use the openai package with the Aleph Alpha base URL
const alephalpha = new OpenAI({
  apiKey: process.env.ALEPH_ALPHA_API_KEY,
  baseURL: 'https://api.aleph-alpha.com/openai',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAlephAlpha = wrapAlephAlpha(alephalpha, llmeter);

// All calls are automatically tracked — European sovereign AI, zero US cloud dependency
const completion = await trackedAlephAlpha.chat.completions.create(
  {
    model: 'pharia-1-llm-7b-cc',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Aleph Alpha
);`;

const sdkSarvamExample = `import OpenAI from 'openai';
import LLMeter, { wrapSarvam } from 'llmeter';

// Sarvam AI is OpenAI-compatible — use the openai package with the Sarvam AI base URL
const sarvam = new OpenAI({
  apiKey: process.env.SARVAM_API_KEY,
  baseURL: 'https://api.sarvam.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedSarvam = wrapSarvam(sarvam, llmeter);

// All calls are automatically tracked — 10 Indic languages, India-native inference
const completion = await trackedSarvam.chat.completions.create(
  {
    model: 'sarvam-m',
    messages: [{ role: 'user', content: 'नमस्ते!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Sarvam AI
);`;

const sdkChutesExample = `import OpenAI from 'openai';
import LLMeter, { wrapChutes } from 'llmeter';

// Chutes AI is OpenAI-compatible — use the openai package with the Chutes AI base URL
const chutes = new OpenAI({
  apiKey: process.env.CHUTES_API_KEY,
  baseURL: 'https://llm.chutes.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedChutes = wrapChutes(chutes, llmeter);

// All calls are automatically tracked — permissionless community inference
const completion = await trackedChutes.chat.completions.create(
  {
    model: 'chutesai/Meta-Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Chutes AI
);`;

const sdkDigitalOceanExample = `import OpenAI from 'openai';
import LLMeter, { wrapDigitalOcean } from 'llmeter';

// DigitalOcean AI Inference is OpenAI-compatible — use the openai package with the DigitalOcean base URL
const digitalocean = new OpenAI({
  apiKey: process.env.DIGITALOCEAN_API_KEY,
  baseURL: 'https://inference.do-ai.run/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedDigitalOcean = wrapDigitalOcean(digitalocean, llmeter);

// All calls are automatically tracked — developer-friendly cloud with 32 global data centers
const completion = await trackedDigitalOcean.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to DigitalOcean
);`;

const sdkOVHcloudExample = `import OpenAI from 'openai';
import LLMeter, { wrapOVHcloud } from 'llmeter';

// OVHcloud AI Endpoints is OpenAI-compatible — use the openai package with the OVHcloud base URL
const ovhcloud = new OpenAI({
  apiKey: process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN,
  baseURL: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedOVHcloud = wrapOVHcloud(ovhcloud, llmeter);

// All calls are automatically tracked — Europe's largest cloud, GDPR-native French data centers
const completion = await trackedOVHcloud.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    messages: [{ role: 'user', content: 'Bonjour depuis l\'Europe!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to OVHcloud
);`;

const sdkVultrExample = `import OpenAI from 'openai';
import LLMeter, { wrapVultr } from 'llmeter';

// Vultr Cloud Inference is OpenAI-compatible — use the openai package with the Vultr base URL
const vultr = new OpenAI({
  apiKey: process.env.VULTR_API_KEY,
  baseURL: 'https://api.vultrinference.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedVultr = wrapVultr(vultr, llmeter);

// All calls are automatically tracked — 33 global DCs, symmetric pricing
const completion = await trackedVultr.chat.completions.create(
  {
    model: 'llama-3.3-70b-instruct-fp8',
    messages: [{ role: 'user', content: 'Hello from Vultr Cloud Inference!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Vultr
);`;

const sdkAI71Example = `import OpenAI from 'openai';
import LLMeter, { wrapAI71 } from 'llmeter';

// AI71 is OpenAI-compatible — use the openai package with the AI71 base URL
const ai71 = new OpenAI({
  apiKey: process.env.AI71_API_KEY,
  baseURL: 'https://api.ai71.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAI71 = wrapAI71(ai71, llmeter);

// All calls are automatically tracked — UAE sovereign AI, Falcon models, symmetric pricing
const completion = await trackedAI71.chat.completions.create(
  {
    model: 'tiiuae/falcon3-10b-instruct',
    messages: [{ role: 'user', content: 'Hello from the UAE!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to AI71
);`;

const sdkGcoreExample = `import OpenAI from 'openai';
import LLMeter, { wrapGcore } from 'llmeter';

// Gcore is OpenAI-compatible — use the openai package with the Gcore inference base URL
const gcore = new OpenAI({
  apiKey: process.env.GCORE_API_KEY,
  baseURL: 'https://inference.gcore.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedGcore = wrapGcore(gcore, llmeter);

// All calls are automatically tracked — European CDN, 165+ PoPs, EU data residency
const completion = await trackedGcore.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello from the edge!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Gcore
);`;

const sdkDatabricksExample = `import OpenAI from 'openai';
import LLMeter, { wrapDatabricks } from 'llmeter';

// Databricks Foundation Model APIs are OpenAI-compatible — use the openai package
const databricks = new OpenAI({
  apiKey: process.env.DATABRICKS_TOKEN,
  baseURL: 'https://api.databricks.com/serving-endpoints',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedDatabricks = wrapDatabricks(databricks, llmeter);

// All calls are automatically tracked — DBRX and Llama from the data lakehouse
const completion = await trackedDatabricks.chat.completions.create(
  {
    model: 'databricks-dbrx-instruct',
    messages: [{ role: 'user', content: 'Hello from the data lakehouse!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Databricks
);`;

const sdkBasetenExample = `import OpenAI from 'openai';
import LLMeter, { wrapBaseten } from 'llmeter';

// Baseten is OpenAI-compatible — use the openai package with the Baseten base URL
const baseten = new OpenAI({
  apiKey: process.env.BASETEN_API_KEY,
  baseURL: 'https://api.baseten.co/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedBaseten = wrapBaseten(baseten, llmeter);

// All calls are automatically tracked — public models and your own fine-tuned models
const completion = await trackedBaseten.chat.completions.create(
  {
    model: 'llama-3-3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello from Baseten!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Baseten
);`;

const sdkSnowflakeExample = `import OpenAI from 'openai';
import LLMeter, { wrapSnowflake } from 'llmeter';

// Snowflake Cortex uses an OpenAI-compatible REST API.
// Auth: JWT or Personal Access Token (PAT) from your Snowflake account settings.
const cortex = new OpenAI({
  apiKey: process.env.SNOWFLAKE_TOKEN,      // JWT or PAT
  baseURL: \`https://\${process.env.SNOWFLAKE_ACCOUNT}.snowflakecomputing.com/api/v2/cortex/inference:complete\`,
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCortex = wrapSnowflake(cortex, llmeter);

// All calls are automatically tracked — Snowflake Arctic, Llama, and Mistral models
const completion = await trackedCortex.chat.completions.create(
  {
    model: 'llama3.3-70b',
    messages: [{ role: 'user', content: 'Hello from Snowflake Cortex!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Snowflake
);`;

const sdkWatsonXExample = `import OpenAI from 'openai';
import LLMeter, { wrapWatsonX } from 'llmeter';

// IBM WatsonX uses IAM token auth — exchange your API key for an access token first:
// POST https://iam.cloud.ibm.com/identity/token
//   grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=YOUR_IBM_API_KEY
const watsonx = new OpenAI({
  apiKey: process.env.IBM_IAM_TOKEN,      // short-lived IAM access token
  baseURL: 'https://us-south.ml.cloud.ibm.com/ml/v4/openai/v1',
  defaultHeaders: {
    'IBM-Watson-AI-ProjectId': process.env.WATSONX_PROJECT_ID,
  },
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedWatsonX = wrapWatsonX(watsonx, llmeter);

// All calls are automatically tracked — IBM Granite, Llama, and Mistral models
const completion = await trackedWatsonX.chat.completions.create(
  {
    model: 'ibm/granite-3-2-8b-instruct',
    messages: [{ role: 'user', content: 'Hello from IBM WatsonX!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to WatsonX
);`;

const sdkPredibaseExample = `import OpenAI from 'openai';
import LLMeter, { wrapPredibase } from 'llmeter';

// Predibase is OpenAI-compatible — use the openai package with the Predibase base URL
const predibase = new OpenAI({
  apiKey: process.env.PREDIBASE_API_KEY,
  baseURL: 'https://serving.app.predibase.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedPredibase = wrapPredibase(predibase, llmeter);

// All calls are automatically tracked — fine-tuned LLM inference at scale
const completion = await trackedPredibase.chat.completions.create(
  {
    model: 'meta-llama/Llama-3-3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello from Predibase!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Predibase
);`;

const sdkVertexAIExample = `import OpenAI from 'openai';
import LLMeter, { wrapVertexAI } from 'llmeter';

// Google Vertex AI is OpenAI-compatible — use the openai package with the Vertex AI endpoint
const vertexai = new OpenAI({
  apiKey: process.env.VERTEX_AI_ACCESS_TOKEN, // gcloud auth print-access-token
  baseURL: \`https://\${process.env.VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/\${process.env.VERTEX_AI_PROJECT_ID}/locations/\${process.env.VERTEX_AI_LOCATION}/endpoints/openapi\`,
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedVertexAI = wrapVertexAI(vertexai, llmeter);

// All calls are automatically tracked — Google Cloud enterprise AI with SOC2/HIPAA/FedRAMP
const completion = await trackedVertexAI.chat.completions.create(
  {
    model: 'google/gemini-2.5-flash',
    messages: [{ role: 'user', content: 'Hello from Vertex AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Vertex AI
);`;

const sdkRunPodExample = `import OpenAI from 'openai';
import LLMeter, { wrapRunPod } from 'llmeter';

// RunPod Serverless is OpenAI-compatible — use the openai package with your endpoint URL
const runpod = new OpenAI({
  apiKey: process.env.RUNPOD_API_KEY,
  baseURL: \`https://api.runpod.ai/v2/\${process.env.RUNPOD_ENDPOINT_ID}/openai/v1\`,
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedRunPod = wrapRunPod(runpod, llmeter);

// All calls are automatically tracked — GPU cloud inference at scale
const completion = await trackedRunPod.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello from RunPod!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to RunPod
);`;

const sdkNeetsExample = `import OpenAI from 'openai';
import LLMeter, { wrapNeets } from 'llmeter';

// Neets.ai is OpenAI-compatible — use the openai package with the Neets.ai base URL
const neets = new OpenAI({
  apiKey: process.env.NEETS_API_KEY,
  baseURL: 'https://api.neets.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNeets = wrapNeets(neets, llmeter);

// All calls are automatically tracked — 100% symmetric pricing across all models
const completion = await trackedNeets.chat.completions.create(
  {
    model: 'llama-3-3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello from Neets.ai!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Neets.ai
);`;

const sdkSparkExample = `import OpenAI from 'openai';
import LLMeter, { wrapSpark } from 'llmeter';

// iFlyTek Spark is OpenAI-compatible — use the openai package with the Spark base URL
const spark = new OpenAI({
  apiKey: process.env.SPARK_API_KEY,
  baseURL: 'https://spark-api-open.xf-yun.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedSpark = wrapSpark(spark, llmeter);

// All calls are automatically tracked — 100% symmetric pricing across all 8 models
const completion = await trackedSpark.chat.completions.create(
  {
    model: 'spark-lite',
    messages: [{ role: 'user', content: 'Hello from iFlyTek Spark!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Spark
);`;

const sdkGradientExample = `import OpenAI from 'openai';
import LLMeter, { wrapGradient } from 'llmeter';

// Gradient AI is OpenAI-compatible — use the openai package with the Gradient AI base URL
const gradient = new OpenAI({
  apiKey: process.env.GRADIENT_API_KEY,
  baseURL: 'https://api.gradient.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedGradient = wrapGradient(gradient, llmeter);

// All calls are automatically tracked — fine-tune and serve your own models
const completion = await trackedGradient.chat.completions.create(
  {
    model: 'llama3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello from Gradient AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Gradient AI
);`;

const sdkCrusoeExample = `import OpenAI from 'openai';
import LLMeter, { wrapCrusoe } from 'llmeter';

// Crusoe is OpenAI-compatible — use the openai package with the Crusoe inference base URL
const crusoe = new OpenAI({
  apiKey: process.env.CRUSOE_API_KEY,
  baseURL: 'https://api.crusoe.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCrusoe = wrapCrusoe(crusoe, llmeter);

// All calls are automatically tracked — sustainable AI on stranded natural gas
const completion = await trackedCrusoe.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello from sustainable AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Crusoe
);`;

const sdkTelnyxExample = `import OpenAI from 'openai';
import LLMeter, { wrapTelnyx } from 'llmeter';

// Telnyx AI is OpenAI-compatible — use the openai package with the Telnyx AI base URL
const telnyx = new OpenAI({
  apiKey: process.env.TELNYX_API_KEY,
  baseURL: 'https://api.telnyx.com/v2/ai',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedTelnyx = wrapTelnyx(telnyx, llmeter);

// All calls are automatically tracked — carrier-grade reliability, competitive pricing
const completion = await trackedTelnyx.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello from Telnyx AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Telnyx
);`;

const sdkKrutrimExample = `import OpenAI from 'openai';
import LLMeter, { wrapKrutrim } from 'llmeter';

// Krutrim is OpenAI-compatible — use the openai package with the Krutrim base URL
const krutrim = new OpenAI({
  apiKey: process.env.KRUTRIM_API_KEY,
  baseURL: 'https://cloud.olakrutrim.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedKrutrim = wrapKrutrim(krutrim, llmeter);

// All calls are automatically tracked — India's first AI unicorn, bilingual Hindi/English
const completion = await trackedKrutrim.chat.completions.create(
  {
    model: 'krutrim-2',
    messages: [{ role: 'user', content: 'Hello in Hindi and English!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Krutrim
);`;

const sdkMaritacaExample = `import OpenAI from 'openai';
import LLMeter, { wrapMaritaca } from 'llmeter';

// Maritaca AI is OpenAI-compatible — use the openai package with the Maritaca base URL
const maritaca = new OpenAI({
  apiKey: process.env.MARITACA_API_KEY,
  baseURL: 'https://chat.maritaca.ai/api',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedMaritaca = wrapMaritaca(maritaca, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedMaritaca.chat.completions.create(
  {
    model: 'sabia-3',
    messages: [{ role: 'user', content: 'Olá!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Maritaca AI
);`;

const sdkLlamaAPIExample = `import OpenAI from 'openai';
import LLMeter, { wrapLlamaAPI } from 'llmeter';

// Llama API is OpenAI-compatible — use the openai package with the Llama API base URL
const llama = new OpenAI({
  apiKey: process.env.LLAMA_API_KEY,
  baseURL: 'https://api.llama.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedLlama = wrapLlamaAPI(llama, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedLlama.chat.completions.create(
  {
    model: 'Llama-4-Scout-17B-16E-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Llama API
);`;

const sdkBaiduExample = `import OpenAI from 'openai';
import LLMeter, { wrapBaidu } from 'llmeter';

// Baidu Qianfan V2 is OpenAI-compatible — use the openai package with the Qianfan base URL
const baidu = new OpenAI({
  apiKey: process.env.BAIDU_API_KEY,
  baseURL: 'https://qianfan.baidubce.com/v2',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedBaidu = wrapBaidu(baidu, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedBaidu.chat.completions.create(
  {
    model: 'ernie-4.0-8k',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Baidu
);`;

const sdkStepfunExample = `import OpenAI from 'openai';
import LLMeter, { wrapStepfun } from 'llmeter';

// Stepfun is OpenAI-compatible — use the openai package with the Stepfun base URL
const stepfun = new OpenAI({
  apiKey: process.env.STEPFUN_API_KEY,
  baseURL: 'https://api.stepfun.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedStepfun = wrapStepfun(stepfun, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedStepfun.chat.completions.create(
  {
    model: 'step-2',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Stepfun
);`;

const sdkMiniMaxExample = `import OpenAI from 'openai';
import LLMeter, { wrapMiniMax } from 'llmeter';

// MiniMax models are OpenAI-compatible — use the openai package with MiniMax's international base URL
const minimax = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimaxi.chat/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedMiniMax = wrapMiniMax(minimax, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedMiniMax.chat.completions.create(
  {
    model: 'MiniMax-Text-01',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to MiniMax
);`;

const sdkUpstageExample = `import OpenAI from 'openai';
import LLMeter, { wrapUpstage } from 'llmeter';

// Upstage Solar models are OpenAI-compatible — use the openai package with Upstage's base URL
const upstage = new OpenAI({
  apiKey: process.env.UPSTAGE_API_KEY,
  baseURL: 'https://api.upstage.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedUpstage = wrapUpstage(upstage, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedUpstage.chat.completions.create(
  {
    model: 'solar-pro',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Upstage
);`;

const sdkHuggingFaceExample = `import OpenAI from 'openai';
import LLMeter, { wrapHuggingFace } from 'llmeter';

// HuggingFace Serverless Inference is OpenAI-compatible — use the openai package with HF's router URL
const hf = new OpenAI({
  apiKey: process.env.HF_API_TOKEN,  // hf_...
  baseURL: 'https://router.huggingface.co/hf-inference/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedHF = wrapHuggingFace(hf, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedHF.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to HuggingFace
);`;

const sdkReplicateExample = `import OpenAI from 'openai';
import LLMeter, { wrapReplicate } from 'llmeter';

// Replicate's OpenAI-compatible endpoint — use the openai package with Replicate's base URL
const replicate = new OpenAI({
  apiKey: process.env.REPLICATE_API_TOKEN, // r8_...
  baseURL: 'https://openai.replicate.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedReplicate = wrapReplicate(replicate, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedReplicate.chat.completions.create(
  {
    model: 'meta/llama-3.3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Replicate
);`;

const sdkNebiusExample = `import OpenAI from 'openai';
import LLMeter, { wrapNebius } from 'llmeter';

// Nebius AI is OpenAI-compatible — use the openai package with Nebius' base URL
const nebius = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY, // eyJhbGci...
  baseURL: 'https://api.studio.nebius.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNebius = wrapNebius(nebius, llmeter);

// All chat.completions.create calls are tracked automatically
const completion = await trackedNebius.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Nebius AI
);`;

const sdkManualExample = `// After getting a response from any LLM API
llmeter.track({
  model: 'mistral-large-latest',
  inputTokens: response.usage.prompt_tokens,
  outputTokens: response.usage.completion_tokens,
  customerId: req.user.id,
  timestamp: new Date().toISOString(), // optional, defaults to now
});`;

const grafanaPrometheusConfig = `scrape_configs:
  - job_name: 'llmeter'
    scheme: https
    metrics_path: /api/v1/metrics
    authorization:
      credentials: YOUR_API_KEY
    static_configs:
      - targets: ['llmeter.org']`;

const grafanaPromqlExamples = `# Total spend by model (all time)
llmeter_cost_usd_total

# Total spend by provider
sum by (provider) (llmeter_cost_usd_total)

# Top 5 most expensive models
topk(5, llmeter_cost_usd_total)

# Total requests across all models
sum(llmeter_requests_total)

# Input vs output token ratio
sum(llmeter_output_tokens_total) / sum(llmeter_input_tokens_total)`;

const grafanaDateRangeExample = `# Scrape metrics for a specific month
GET /api/v1/metrics?from=2026-04-01&to=2026-04-30
Authorization: Bearer YOUR_API_KEY`;

export default function DocsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developer Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Send LLM usage data to LLMeter via the npm SDK or the raw HTTP Ingestion API.
        </p>
      </div>

      {/* SDK Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle>JavaScript / TypeScript SDK</CardTitle>
            <Badge variant="secondary">Recommended</Badge>
          </div>
          <CardDescription>
            The <code className="rounded bg-muted px-1.5 py-0.5">llmeter</code> npm package
            is the fastest way to integrate. It auto-batches events, retries on errors, and
            provides drop-in wrappers for OpenAI, Anthropic, Google AI, AWS Bedrock, Azure OpenAI, Cohere, Groq, Together AI, Fireworks AI, Perplexity AI, Cerebras, AI21 Labs, xAI (Grok), Mistral AI, DeepSeek, OpenRouter, DeepInfra, Novita AI, and Hyperbolic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Install */}
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Install</p>
            <CodeBlock language="bash" code={sdkInstallExample} />
          </div>

          {/* Quick start */}
          <div className="space-y-2">
            <p className="text-sm font-medium">2. Track events</p>
            <Tabs defaultValue="quickstart">
              <TabsList>
                <TabsTrigger value="quickstart">Quick start</TabsTrigger>
                <TabsTrigger value="openai">OpenAI wrapper</TabsTrigger>
                <TabsTrigger value="anthropic">Anthropic wrapper</TabsTrigger>
                <TabsTrigger value="google">Google AI wrapper</TabsTrigger>
                <TabsTrigger value="bedrock">AWS Bedrock</TabsTrigger>
                <TabsTrigger value="azure">Azure OpenAI</TabsTrigger>
                <TabsTrigger value="cohere">Cohere</TabsTrigger>
                <TabsTrigger value="groq">Groq</TabsTrigger>
                <TabsTrigger value="together">Together AI</TabsTrigger>
                <TabsTrigger value="fireworks">Fireworks AI</TabsTrigger>
                <TabsTrigger value="perplexity">Perplexity AI</TabsTrigger>
                <TabsTrigger value="cerebras">Cerebras</TabsTrigger>
                <TabsTrigger value="ai21">AI21 Labs</TabsTrigger>
                <TabsTrigger value="xai">xAI (Grok)</TabsTrigger>
                <TabsTrigger value="mistral">Mistral AI</TabsTrigger>
                <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
                <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
                <TabsTrigger value="deepinfra">DeepInfra</TabsTrigger>
                <TabsTrigger value="novita">Novita AI</TabsTrigger>
                <TabsTrigger value="hyperbolic">Hyperbolic</TabsTrigger>
                <TabsTrigger value="sambanova">SambaNova</TabsTrigger>
                <TabsTrigger value="lambdalabs">Lambda Labs</TabsTrigger>
                <TabsTrigger value="lepton">Lepton AI</TabsTrigger>
                <TabsTrigger value="inferencenet">Inference.net</TabsTrigger>
                <TabsTrigger value="nvidia">NVIDIA NIM</TabsTrigger>
                <TabsTrigger value="cloudflare">Cloudflare Workers AI</TabsTrigger>
                <TabsTrigger value="nebius">Nebius AI</TabsTrigger>
                <TabsTrigger value="replicate">Replicate</TabsTrigger>
                <TabsTrigger value="featherless">Featherless.ai</TabsTrigger>
                <TabsTrigger value="huggingface">HuggingFace</TabsTrigger>
                <TabsTrigger value="yi">01.AI Yi</TabsTrigger>
                <TabsTrigger value="zhipu">Zhipu AI</TabsTrigger>
                <TabsTrigger value="upstage">Upstage</TabsTrigger>
                <TabsTrigger value="moonshot">Moonshot AI</TabsTrigger>
                <TabsTrigger value="writer">Writer</TabsTrigger>
                <TabsTrigger value="qwen">Qwen (DashScope)</TabsTrigger>
                <TabsTrigger value="minimax">MiniMax</TabsTrigger>
                <TabsTrigger value="doubao">Doubao</TabsTrigger>
                <TabsTrigger value="hunyuan">Tencent Hunyuan</TabsTrigger>
                <TabsTrigger value="baichuan">Baichuan AI</TabsTrigger>
                <TabsTrigger value="siliconflow">SiliconFlow</TabsTrigger>
                <TabsTrigger value="stepfun">Stepfun</TabsTrigger>
                <TabsTrigger value="baidu">Baidu ERNIE</TabsTrigger>
                <TabsTrigger value="kluster">Kluster AI</TabsTrigger>
                <TabsTrigger value="friendli">Friendli AI</TabsTrigger>
                <TabsTrigger value="llamaapi">Llama API</TabsTrigger>
                <TabsTrigger value="reka">Reka AI</TabsTrigger>
                <TabsTrigger value="maritaca">Maritaca AI</TabsTrigger>
                <TabsTrigger value="scaleway">Scaleway</TabsTrigger>
                <TabsTrigger value="nscale">Nscale</TabsTrigger>
                <TabsTrigger value="aimlapi">AI/ML API</TabsTrigger>
                <TabsTrigger value="alephalpha">Aleph Alpha</TabsTrigger>
                <TabsTrigger value="sarvam">Sarvam AI</TabsTrigger>
                <TabsTrigger value="chutes">Chutes AI</TabsTrigger>
                <TabsTrigger value="krutrim">Krutrim</TabsTrigger>
                <TabsTrigger value="digitalocean">DigitalOcean</TabsTrigger>
                <TabsTrigger value="ovhcloud">OVHcloud AI</TabsTrigger>
                <TabsTrigger value="telnyx">Telnyx AI</TabsTrigger>
                <TabsTrigger value="vultr">Vultr</TabsTrigger>
                <TabsTrigger value="ai71">AI71 (Falcon)</TabsTrigger>
                <TabsTrigger value="gcore">Gcore</TabsTrigger>
                <TabsTrigger value="crusoe">Crusoe</TabsTrigger>
                <TabsTrigger value="databricks">Databricks</TabsTrigger>
                <TabsTrigger value="gradient">Gradient AI</TabsTrigger>
                <TabsTrigger value="baseten">Baseten</TabsTrigger>
                <TabsTrigger value="watsonx">IBM WatsonX</TabsTrigger>
                <TabsTrigger value="snowflake">Snowflake Cortex</TabsTrigger>
                <TabsTrigger value="neets">Neets.ai</TabsTrigger>
                <TabsTrigger value="runpod">RunPod</TabsTrigger>
                <TabsTrigger value="predibase">Predibase</TabsTrigger>
                <TabsTrigger value="vertexai">Google Vertex AI</TabsTrigger>
                <TabsTrigger value="spark">iFlyTek Spark</TabsTrigger>
                <TabsTrigger value="manual">Any provider</TabsTrigger>
              </TabsList>
              <TabsContent value="quickstart" className="mt-4">
                <CodeBlock language="typescript" code={sdkQuickstartExample} />
              </TabsContent>
              <TabsContent value="openai" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Wrap the OpenAI client once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically.
                </p>
                <CodeBlock language="typescript" code={sdkOpenAIExample} />
              </TabsContent>
              <TabsContent value="anthropic" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Wrap the Anthropic client once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">messages.create</code>{' '}
                  call is tracked automatically.
                </p>
                <CodeBlock language="typescript" code={sdkAnthropicExample} />
              </TabsContent>
              <TabsContent value="google" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Wrap the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">GoogleGenerativeAI</code>{' '}
                  client once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">model.generateContent</code>{' '}
                  call is tracked automatically.
                </p>
                <CodeBlock language="typescript" code={sdkGoogleExample} />
              </TabsContent>
              <TabsContent value="bedrock" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Wrap the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">BedrockRuntimeClient</code>{' '}
                  once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">ConverseCommand</code>{' '}
                  call is tracked automatically. Works with Claude on Bedrock, Amazon Nova,
                  Meta Llama, Mistral, and all other Converse-compatible models.
                </p>
                <CodeBlock language="typescript" code={sdkBedrockExample} />
              </TabsContent>
              <TabsContent value="azure" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Wrap the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">AzureOpenAI</code>{' '}
                  client once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Works with the <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  configured for Azure or the <code className="rounded bg-muted px-1.5 py-0.5">@azure/openai</code> package.
                </p>
                <CodeBlock language="typescript" code={sdkAzureExample} />
              </TabsContent>
              <TabsContent value="cohere" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Wrap the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">CohereClient</code>{' '}
                  once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">cohere.chat()</code>{' '}
                  call is tracked automatically. Works with <code className="rounded bg-muted px-1.5 py-0.5">cohere-ai</code> v7+.
                </p>
                <CodeBlock language="typescript" code={sdkCohereExample} />
              </TabsContent>
              <TabsContent value="groq" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Wrap the Groq client once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Works with the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">groq-sdk</code> package.
                </p>
                <CodeBlock language="typescript" code={sdkGroqExample} />
              </TabsContent>
              <TabsContent value="together" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Together AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Together&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 4, DeepSeek R1/V3, Qwen 2.5, and 100+ open-source models.
                </p>
                <CodeBlock language="typescript" code={sdkTogetherExample} />
              </TabsContent>
              <TabsContent value="fireworks" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Fireworks AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Fireworks&apos; base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 4, DeepSeek R1/V3, Qwen 2.5, Mixtral, and 200+ open-source models.
                </p>
                <CodeBlock language="typescript" code={sdkFireworksExample} />
              </TabsContent>
              <TabsContent value="perplexity" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Perplexity AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Perplexity&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Sonar, Sonar Pro, Sonar Reasoning, and R1-1776.
                </p>
                <CodeBlock language="typescript" code={sdkPerplexityExample} />
              </TabsContent>
              <TabsContent value="cerebras" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Cerebras is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Cerebras&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.1 8B/70B, Llama 3.3 70B, Qwen 3 32B, and DeepSeek R1 Distill.
                </p>
                <CodeBlock language="typescript" code={sdkCerebrasExample} />
              </TabsContent>
              <TabsContent value="ai21" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  AI21 Labs is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with AI21&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Jamba 1.5 Mini/Large and Jamba 1.6 Mini/Large.
                </p>
                <CodeBlock language="typescript" code={sdkAI21Example} />
              </TabsContent>
              <TabsContent value="xai" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  xAI (Grok) is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with xAI&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Grok 3, Grok 3 Fast, Grok 3 Mini, and Grok 2 Vision.
                </p>
                <CodeBlock language="typescript" code={sdkXaiExample} />
              </TabsContent>
              <TabsContent value="mistral" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Mistral AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Mistral&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Mistral Large, Mistral Small, Codestral, Pixtral, Ministral, Mistral Medium 3, Magistral Small, and Magistral Medium.
                </p>
                <CodeBlock language="typescript" code={sdkMistralExample} />
              </TabsContent>
              <TabsContent value="deepseek" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  DeepSeek is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with DeepSeek&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports DeepSeek-Chat (V3) and DeepSeek-Reasoner (R1).
                </p>
                <CodeBlock language="typescript" code={sdkDeepSeekExample} />
              </TabsContent>
              <TabsContent value="openrouter" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  OpenRouter is OpenAI-compatible and gives access to 500+ models (Claude, GPT-4o,
                  Gemini, Llama, Mistral, and more) via a single API key. Use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with OpenRouter&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically.
                </p>
                <CodeBlock language="typescript" code={sdkOpenRouterExample} />
              </TabsContent>
              <TabsContent value="deepinfra" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  DeepInfra is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with DeepInfra&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 4, DeepSeek R1/V3, Qwen, Phi-4, Mixtral, and more.
                </p>
                <CodeBlock language="typescript" code={sdkDeepInfraExample} />
              </TabsContent>
              <TabsContent value="novita" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Novita AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Novita&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.1/3.3, DeepSeek R1/V3, Qwen 2.5, Mistral, Gemma 2, and more.
                </p>
                <CodeBlock language="typescript" code={sdkNovitaExample} />
              </TabsContent>
              <TabsContent value="hyperbolic" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Hyperbolic is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Hyperbolic&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 4, DeepSeek R1/V3, Qwen 2.5, Mistral, and more.
                </p>
                <CodeBlock language="typescript" code={sdkHyperbolicExample} />
              </TabsContent>
              <TabsContent value="sambanova" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  SambaNova Cloud is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with SambaNova&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.1/3.3 (including 405B), DeepSeek R1/V3, Qwen 2.5, and more.
                </p>
                <CodeBlock language="typescript" code={sdkSambanovaExample} />
              </TabsContent>
              <TabsContent value="lambdalabs" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Lambda Labs is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Lambda Labs&apos; base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.1/3.3, Hermes 3, Qwen 2.5 Coder, Liquid LFM, and more.
                </p>
                <CodeBlock language="typescript" code={sdkLambdaLabsExample} />
              </TabsContent>
              <TabsContent value="lepton" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Lepton AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Lepton AI&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.1/3, Mistral 7B, Mixtral 8x7B, Qwen 2.5, and more.
                </p>
                <CodeBlock language="typescript" code={sdkLeptonExample} />
              </TabsContent>
              <TabsContent value="inferencenet" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Inference.net is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Inference.net&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.3 70B, DeepSeek R1/V3, Qwen 2.5 72B, Mistral 7B, Phi 4, and more — all on NVIDIA H100 GPUs.
                </p>
                <CodeBlock language="typescript" code={sdkInferenceNetExample} />
              </TabsContent>
              <TabsContent value="nvidia" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  NVIDIA NIM is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with NVIDIA&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.3 70B, Llama 3.1 405B/70B/8B, Nemotron 4 340B, DeepSeek R1, Mistral 7B, and more.
                </p>
                <CodeBlock language="typescript" code={sdkNvidiaExample} />
              </TabsContent>
              <TabsContent value="cloudflare" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Cloudflare Workers AI exposes an OpenAI-compatible endpoint — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with your account&apos;s Workers AI base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.3 70B, Llama 3.2 11B Vision, Mistral 7B, Gemma, Phi-2, Qwen 1.5, and more — all running on Cloudflare&apos;s global edge network.
                </p>
                <CodeBlock language="typescript" code={sdkCloudflareExample} />
              </TabsContent>
              <TabsContent value="nebius" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Nebius AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Nebius&apos; base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.3 70B, Llama 3.1 70B/8B, DeepSeek R1/V3, Qwen 2.5 72B/7B, Mistral Nemo, Phi-3 Mini, and Gemma 2 9B — European-first cloud infrastructure.
                </p>
                <CodeBlock language="typescript" code={sdkNebiusExample} />
              </TabsContent>
              <TabsContent value="replicate" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Replicate exposes an OpenAI-compatible endpoint — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Replicate&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Supports Llama 3.3 70B, Llama 3.1 405B/70B/8B, DeepSeek R1/V3, Mixtral 8x7B, Gemma 2 9B, Qwen 2.5 72B, and more.
                </p>
                <CodeBlock language="typescript" code={sdkReplicateExample} />
              </TabsContent>
              <TabsContent value="featherless" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Featherless.ai is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Featherless&apos; base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Access 3,000+ open-source models including Llama 3.3 70B, DeepSeek R1/V3, Qwen 2.5 72B, Phi-4, Gemma 2, Mixtral, and more — no GPU setup required.
                </p>
                <CodeBlock language="typescript" code={sdkFeatherlessExample} />
              </TabsContent>
              <TabsContent value="huggingface" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  HuggingFace Serverless Inference is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with HuggingFace&apos;s router URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Access 100,000+ open-source models including Llama 3.3 70B, Mistral 7B, Qwen 2.5, DeepSeek R1, Gemma 2, Phi-4, and more.
                </p>
                <CodeBlock language="typescript" code={sdkHuggingFaceExample} />
              </TabsContent>
              <TabsContent value="yi" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  01.AI Yi models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with 01.AI&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Yi-Lightning ($0.14/1M tokens), Yi-Large, Yi-Large-Turbo, Yi-Medium, Yi-Spark, Yi-Large-Preview, Yi-Medium-200K, and Yi-Vision-01.
                </p>
                <CodeBlock language="typescript" code={sdkYiExample} />
              </TabsContent>
              <TabsContent value="zhipu" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Zhipu AI GLM models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Zhipu&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes GLM-4-Plus ($7/1M tokens), GLM-4, GLM-4-Long (128K context), GLM-4-Flash (near-free), GLM-4-Air, GLM-4-AirX, GLM-4V-Plus, GLM-4V, and GLM-Zero-Preview (reasoning).
                </p>
                <CodeBlock language="typescript" code={sdkZhipuExample} />
              </TabsContent>
              <TabsContent value="upstage" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Upstage Solar models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Upstage&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Solar Pro ($2/1M tokens), Solar Mini ($0.15/1M), Solar Mini Japanese, Solar 1 Mini Chat, Solar translation models (KO↔EN), and Solar DocVision.
                </p>
                <CodeBlock language="typescript" code={sdkUpstageExample} />
              </TabsContent>
              <TabsContent value="moonshot" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Moonshot AI (Kimi) models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Moonshot&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes moonshot-v1-8k ($1.67/1M), moonshot-v1-32k ($3.33/1M), moonshot-v1-128k ($8.33/1M), vision variants, and Kimi k1.5 reasoning models.
                </p>
                <CodeBlock language="typescript" code={sdkMoonshotExample} />
              </TabsContent>
              <TabsContent value="writer" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Writer models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with Writer&apos;s base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Palmyra X 004 ($0.80/$3.00 per 1M tokens), Palmyra X 004 Turbo ($0.50/$2.00), Palmyra X 005 ($1.50/$6.00), domain-specialized Palmyra Med 70B and Palmyra Fin 70B for healthcare and finance, and Palmyra Vision for multimodal tasks.
                </p>
                <CodeBlock language="typescript" code={sdkWriterExample} />
              </TabsContent>
              <TabsContent value="qwen" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Qwen (DashScope) models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with DashScope&apos;s international base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes qwen-max ($0.40/$1.20 per 1M), qwen-plus ($0.07/$0.21), qwen-turbo ($0.05/$0.10), qwen-long ($0.05/$0.13), vision variants qwen-vl-max and qwen-vl-plus, Qwen2.5-72B-Instruct ($0.33/$0.46), and Qwen3-235B-A22B MoE ($0.60/$2.40).
                </p>
                <CodeBlock language="typescript" code={sdkQwenExample} />
              </TabsContent>
              <TabsContent value="minimax" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  MiniMax models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with MiniMax&apos;s international base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes MiniMax-Text-01 ($0.20/$1.10 per 1M tokens, 1M context window), MiniMax-01 ($0.20/$1.10), abab6.5s-chat ($0.12/$0.25), abab6.5g-chat, abab6.5t-chat (Turbo), abab6.5-chat ($0.15/$0.30), abab5.5-chat ($0.08/$0.20), and abab5.5s-chat ($0.04/$0.10, ultra-fast).
                </p>
                <CodeBlock language="typescript" code={sdkMiniMaxExample} />
              </TabsContent>
              <TabsContent value="doubao" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  ByteDance Doubao models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Volcengine Ark base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Doubao-Pro-32k ($0.17/$0.17 per 1M tokens), Doubao-Lite-32k ($0.04/$0.08, ultra-cheap), Doubao-Lite-128k ($0.11/$0.14), Doubao-Pro-4k ($0.11/$0.28), Doubao-Pro-128k ($0.69/$1.25), Doubao-1.5-Pro-32k ($0.11/$0.28), and Doubao-Vision-Pro-32k ($0.28/$0.28, multimodal).
                </p>
                <CodeBlock language="typescript" code={sdkDoubaoExample} />
              </TabsContent>
              <TabsContent value="hunyuan" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Tencent Hunyuan models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Hunyuan base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Hunyuan-Pro ($0.70/$2.00 per 1M tokens), Hunyuan-Pro-256k ($1.50/$5.00, 256K context), Hunyuan-Standard ($0.15/$0.15), Hunyuan-Standard-256k ($0.50/$0.50), Hunyuan-Lite (free tier), Hunyuan-Turbo ($1.00/$3.00), Hunyuan-Turbo-Latest ($1.00/$3.00), and Hunyuan-Vision (free tier, multimodal).
                </p>
                <CodeBlock language="typescript" code={sdkHunyuanExample} />
              </TabsContent>
              <TabsContent value="baichuan" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Baichuan AI models are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Baichuan base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Baichuan4 ($14.00/$14.00 per 1M tokens), Baichuan4-Turbo ($7.00/$7.00), Baichuan4-Air ($0.14/$0.14 — budget tier), Baichuan3-Turbo ($3.31/$3.31), Baichuan3-Turbo-128k ($8.28/$8.28, 128K context), Baichuan2-Turbo ($3.31/$3.31), Baichuan2-Turbo-192k ($8.28/$8.28, 192K context), and Baichuan2-53B ($4.14/$4.14).
                </p>
                <CodeBlock language="typescript" code={sdkBaichuanExample} />
              </TabsContent>
              <TabsContent value="siliconflow" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  SiliconFlow (SiliconCloud) is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the SiliconFlow base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes DeepSeek-V3 ($0.14/$0.28 per 1M tokens), DeepSeek-R1 ($0.55/$2.19), Qwen2.5-72B-Instruct ($0.14/$0.14), Qwen2.5-7B-Instruct ($0.035/$0.035), Llama 3.3 70B ($0.14/$0.14), Llama 3.1 8B ($0.042/$0.042), Mistral 7B ($0.035/$0.035), Gemma 2 9B ($0.070/$0.070), Phi-3.5 Mini ($0.042/$0.042), and InternLM2.5 7B ($0.014/$0.014 — ultra-budget).
                </p>
                <CodeBlock language="typescript" code={sdkSiliconFlowExample} />
              </TabsContent>
              <TabsContent value="stepfun" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Stepfun is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Stepfun base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes step-2 ($5.52/$5.52 per 1M tokens — flagship reasoning), step-1-32k ($1.66/$1.66), step-1-128k ($5.52/$5.52), step-1-256k ($9.65/$9.65 — ultra-long 256k context), step-1v-32k ($1.66/$1.66 — vision), step-1-8k ($0.69/$0.69), step-1-flash ($0.14/$0.14 — ultra-fast), and step-2-mini ($0.96/$0.96 — compact reasoning).
                </p>
                <CodeBlock language="typescript" code={sdkStepfunExample} />
              </TabsContent>
              <TabsContent value="baidu" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Baidu Qianfan V2 is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Qianfan base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes ERNIE-4.0-8K ($16.67/$16.67 per 1M tokens — flagship), ERNIE-4.0-Turbo-8K ($5.56/$5.56), ERNIE-3.5-8K ($1.67/$1.67), ERNIE-3.5-128K ($2.78/$2.78 — long context), ERNIE-Lite-8K ($0.42/$0.83), ERNIE-Speed-8K ($0.14/$0.14 — cheapest), ERNIE-Speed-128K ($0.14/$0.14), and ERNIE-Tiny-8K ($0.14/$0.14).
                </p>
                <CodeBlock language="typescript" code={sdkBaiduExample} />
              </TabsContent>
              <TabsContent value="kluster" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Kluster AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Kluster base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Llama 3.3 70B Turbo ($0.20/$0.30 per 1M tokens — fast flagship), Llama 3.1 405B Turbo ($0.80/$1.20 — ultra-capable), Llama 3.1 8B Turbo ($0.05/$0.07 — cheapest), Llama 4 Scout 17B ($0.10/$0.10), Llama 4 Maverick 17B ($0.30/$0.30), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek V3 ($0.28/$1.10), Qwen 2.5 72B Turbo ($0.16/$0.16), Qwen3 235B MoE ($0.40/$1.60 — largest), and Mistral 7B ($0.05/$0.05 — ultra-cheap).
                </p>
                <CodeBlock language="typescript" code={sdkKlusterExample} />
              </TabsContent>
              <TabsContent value="friendli" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Friendli AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Friendli serverless base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Llama 3.3 70B ($0.40/$0.40 per 1M tokens — flagship), Llama 3.1 405B FP8 ($1.60/$1.60 — ultra-capable), Llama 3.1 70B ($0.30/$0.30), Llama 3.1 8B ($0.10/$0.10 — cheapest), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek V3 ($0.28/$1.10), Qwen 2.5 72B ($0.50/$0.50), and Mixtral 8x7B MoE ($0.20/$0.20).
                </p>
                <CodeBlock language="typescript" code={sdkFriendliExample} />
              </TabsContent>
              <TabsContent value="llamaapi" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Llama API (Meta) is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Llama API base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Llama 4 Scout 17B ($0.11/$0.34 per 1M tokens — cheapest Llama 4), Llama 4 Maverick 17B ($0.19/$0.49), Llama 3.3 70B ($0.20/$0.20 — reliable flagship), Llama 3.1 405B ($3.00/$3.00 — ultra-capable), Llama 3.1 70B ($0.90/$0.90), Llama 3.1 8B ($0.18/$0.18 — cheapest), Llama 3.2 11B Vision ($0.35/$0.35), and Llama 3.2 90B Vision ($2.00/$2.00).
                </p>
                <CodeBlock language="typescript" code={sdkLlamaAPIExample} />
              </TabsContent>
              <TabsContent value="reka" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Reka AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Reka AI base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes reka-core ($10.00/$25.00 per 1M — flagship multimodal), reka-flash-3 ($0.80/$2.00 — fast general-purpose), reka-flash-3-5 ($0.80/$2.00), reka-flash-20240226 ($0.80/$2.00), reka-flash-preview-20241204 ($0.80/$2.00), reka-edge-20240208 ($0.40/$1.00 — cheapest, fastest), and reka-edge-20240104 ($0.40/$1.00).
                </p>
                <CodeBlock language="typescript" code={sdkRekaExample} />
              </TabsContent>
              <TabsContent value="maritaca" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Maritaca AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Maritaca AI base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Sabiá-3 ($1.00/$4.00 per 1M — flagship), Sabiá-3 Small ($0.30/$0.90 — fast), Sabiá-2 Medium ($0.50/$1.50), and Sabiá-2 Small ($0.20/$0.60 — cheapest, 98% cheaper input than GPT-4o). Brazilian Portuguese LLMs specialized for Portuguese-language tasks.
                </p>
                <CodeBlock language="typescript" code={sdkMaritacaExample} />
              </TabsContent>
              <TabsContent value="scaleway" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Scaleway Generative APIs are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Scaleway base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Llama 3.3 70B Instruct ($0.20/$0.20 per 1M — 92% cheaper input than GPT-4o), Llama 3.1 8B Instruct ($0.04/$0.04 — cheapest), Mistral Nemo 12B ($0.10/$0.10), DeepSeek R1 Distill Llama 70B ($0.20/$0.80 — reasoning), DeepSeek R1 Distill Qwen 32B ($0.10/$0.40), Qwen 2.5 Coder 32B ($0.15/$0.15 — code), and Pixtral 12B ($0.10/$0.10 — vision). All inference runs in French GDPR-native data centers.
                </p>
                <CodeBlock language="typescript" code={sdkScalewayExample} />
              </TabsContent>
              <TabsContent value="nscale" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Nscale&apos;s inference API is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Nscale base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Includes Llama 3.3 70B Instruct ($0.23/$0.30 per 1M), Llama 3.1 70B Instruct ($0.23/$0.30), Llama 3.1 8B Instruct ($0.06/$0.10 — budget), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek R1 Distill Llama 70B ($0.20/$0.80), Mistral 7B Instruct ($0.04/$0.04 — cheapest), and Qwen 2.5 72B Instruct ($0.23/$0.30). All inference runs on UK AI infrastructure.
                </p>
                <CodeBlock language="typescript" code={sdkNscaleExample} />
              </TabsContent>
              <TabsContent value="aimlapi" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  AI/ML API is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the AI/ML API base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Access 200+ models with a single API key: Llama 4 Scout 17B ($0.18/$0.59 per 1M), Llama 4 Maverick 17B ($0.20/$0.68), Llama 3.3 70B Instruct ($0.40/$0.40), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek V3 ($0.28/$1.10), Qwen 2.5 72B ($0.35/$0.40), Mistral 7B ($0.10/$0.10 — budget), and Gemma 2 9B ($0.10/$0.10 — budget).
                </p>
                <CodeBlock language="typescript" code={sdkAIMLAPIExample} />
              </TabsContent>
              <TabsContent value="alephalpha" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Aleph Alpha is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Aleph Alpha base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. European sovereign AI (Cologne, Germany) — zero US cloud dependency, GDPR-native infrastructure. 8 models: Pharia-1 LLM 4x4B CC ($3.24/1M — cheapest, MoE), Pharia-1 LLM 7B CC ($5.40/1M), Luminous Base ($6.48/1M), Luminous Base Control ($8.10/1M), Luminous Extended ($8.64/1M), Luminous Extended Control ($10.80/1M), Luminous Supreme ($30.78/1M), Luminous Supreme Control ($45.36/1M). All models use symmetric pricing (input == output).
                </p>
                <CodeBlock language="typescript" code={sdkAlephAlphaExample} />
              </TabsContent>
              <TabsContent value="sarvam" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Sarvam AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Sarvam AI base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. India-native multilingual inference with native support for 10 Indic languages (Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati, Marathi, Punjabi, Odia). 3 models: Sarvam-M ($0.30/$0.60 per 1M — flagship multilingual), Sarvam-1 ($0.20/$0.40 — balanced), Sarvam-2B ($0.10/$0.20 — budget).
                </p>
                <CodeBlock language="typescript" code={sdkSarvamExample} />
              </TabsContent>
              <TabsContent value="chutes" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Chutes AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Chutes AI base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Permissionless community inference network — anyone can deploy and serve models. 8 models: Llama 4 Scout 17B ($0.06/$0.30 per 1M), Llama 4 Maverick 17B ($0.12/$0.48), Llama 3.3 70B ($0.10/$0.30), Llama 3.1 8B ($0.04/$0.04 — cheapest), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek V3 ($0.28/$1.10), Qwen 2.5 72B ($0.10/$0.30), Mistral 7B ($0.04/$0.04 — cheapest).
                </p>
                <CodeBlock language="typescript" code={sdkChutesExample} />
              </TabsContent>
              <TabsContent value="krutrim" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Krutrim is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Krutrim base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. India&apos;s first AI unicorn by Ola founder Bhavish Aggarwal — bilingual Hindi/English. 3 models: Krutrim-Spectre-v2 ($0.60/$1.80 per 1M — flagship), Krutrim-2 ($0.25/$0.75 — general purpose, 98% cheaper input than GPT-4o), Krutrim-2 Instruct ($0.25/$0.75).
                </p>
                <CodeBlock language="typescript" code={sdkKrutrimExample} />
              </TabsContent>
              <TabsContent value="digitalocean" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  DigitalOcean AI Inference is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the DigitalOcean base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Developer-friendly cloud with 32 global data centers. 8 hosted open-source models: Llama 4 Maverick 17B ($0.25/$0.87 per 1M — MoE), Llama 3.3 70B ($0.65/$0.65 — symmetric), DeepSeek V3.2 ($0.50/$1.60), Ministral 3 14B ($0.20/$0.20 — symmetric budget).
                </p>
                <CodeBlock language="typescript" code={sdkDigitalOceanExample} />
              </TabsContent>
              <TabsContent value="ovhcloud" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  OVHcloud AI Endpoints is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the OVHcloud base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Europe&apos;s largest cloud provider with GDPR-native French data centers — zero US cloud dependency. 8 open-source models: Llama 3.3 70B ($0.20/$0.20 per 1M — symmetric), Llama 3.1 70B ($0.20/$0.20), Llama 3.1 8B ($0.05/$0.05 — budget), Mistral 7B ($0.04/$0.04 — cheapest EU), Mixtral 8x7B ($0.11/$0.11), Qwen 2.5 72B ($0.20/$0.20), DeepSeek R1 Distill Llama 70B ($0.20/$0.80 — reasoning), Qwen 2.5 Coder 32B ($0.15/$0.15 — code).
                </p>
                <CodeBlock language="typescript" code={sdkOVHcloudExample} />
              </TabsContent>
              <TabsContent value="vultr" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Vultr Cloud Inference is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Vultr base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Developer-friendly infrastructure cloud with 33 global data centers — competitive symmetric pricing. 8 models: Llama 3.3 70B ($0.56/$0.56 per 1M — symmetric), Llama 3.1 70B ($0.56/$0.56), Llama 3.1 8B ($0.10/$0.10 — budget), Mistral 7B ($0.10/$0.10 — budget), Mixtral 8x7B ($0.24/$0.24 — MoE), Llama 3.2 11B Vision ($0.18/$0.18 — multimodal), Llama 3.2 90B Vision ($1.20/$1.20 — vision premium), Zephyr 7B ($0.10/$0.10).
                </p>
                <CodeBlock language="typescript" code={sdkVultrExample} />
              </TabsContent>
              <TabsContent value="telnyx" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Telnyx AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Telnyx AI base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Carrier-grade global infrastructure from Telnyx — telecom reliability meets LLM inference. 8 models: Llama 3.3 70B ($0.35/$0.35 per 1M — symmetric), Llama 3.1 70B ($0.35/$0.35), Llama 3.1 8B ($0.03/$0.03 — ultra-budget), Llama 3.1 405B ($3.00/$3.00 — flagship), Mistral 7B ($0.06/$0.06 — budget), Mixtral 8x7B ($0.20/$0.20 — MoE), Gemma 2 9B ($0.06/$0.06), Phi-3 Medium ($0.15/$0.15).
                </p>
                <CodeBlock language="typescript" code={sdkTelnyxExample} />
              </TabsContent>
              <TabsContent value="ai71" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  AI71 is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the AI71 base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. UAE sovereign AI from the Technology Innovation Institute — Falcon open-weight models with symmetric pricing. 8 models: Falcon 3 10B ($0.30/$0.30 per 1M — symmetric flagship), Falcon 3 7B ($0.18/$0.18 — symmetric), Falcon 3 3B ($0.09/$0.09 — budget), Falcon 3 1B ($0.06/$0.06 — ultra-budget), Falcon 2 11B ($0.35/$0.35 — symmetric), Falcon H1 7B ($0.20/$0.20 — hybrid), Falcon H1 14B ($0.45/$0.45 — hybrid precision), Falcon H1 34B ($1.00/$1.00 — premium).
                </p>
                <CodeBlock language="typescript" code={sdkAI71Example} />
              </TabsContent>
              <TabsContent value="gcore" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Gcore is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Gcore inference base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. European CDN and cloud provider (Luxembourg HQ, 165+ global PoPs) — EU data residency, low-latency edge inference. 8 models: Llama 3.3 70B ($0.59/$0.79 per 1M — flagship), Llama 3.1 70B ($0.59/$0.79 — stable), Llama 3.1 8B ($0.10/$0.15 — budget), Mistral 7B ($0.07/$0.10 — cheapest), Mixtral 8x7B ($0.24/$0.24 — symmetric MoE), DeepSeek R1 Distill 70B ($0.55/$0.55 — symmetric reasoning), Qwen 2.5 72B ($0.35/$0.40), Llama 3.2 11B Vision ($0.18/$0.25 — multimodal).
                </p>
                <CodeBlock language="typescript" code={sdkGcoreExample} />
              </TabsContent>
              <TabsContent value="crusoe" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Crusoe is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Crusoe inference base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Sustainable AI cloud running on stranded natural gas (H200/H100 GPU clusters) — cuts carbon emissions ~63% vs traditional cloud. 8 models: Llama 3.3 70B ($0.60/$0.80 per 1M — flagship), Llama 3.1 70B ($0.60/$0.80 — stable), Llama 3.1 8B ($0.08/$0.10 — budget), Llama 3.1 405B ($3.50/$4.50 — enterprise), Llama 3.2 11B Vision ($0.18/$0.25 — multimodal), DeepSeek R1 ($0.55/$2.19 — reasoning), Qwen 2.5 72B ($0.35/$0.45), Mistral 7B ($0.07/$0.10 — cheapest).
                </p>
                <CodeBlock language="typescript" code={sdkCrusoeExample} />
              </TabsContent>
              <TabsContent value="databricks" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Databricks Foundation Model APIs are OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Databricks serving endpoint base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Databricks ($43B valuation, 10,000+ enterprise customers) built DBRX — one of the best open-weight MoE models (132B parameters, Apache 2.0). 8 models: DBRX Instruct ($0.75/$0.75 per 1M — symmetric flagship), Llama 3.3 70B ($0.54/$1.62 — latest Llama), Llama 3.1 70B ($0.54/$1.62 — stable), Llama 3.1 8B ($0.20/$0.20 — symmetric budget), Llama 3.1 405B ($5.00/$15.00 — enterprise), Mixtral 8x7B ($0.60/$0.60 — symmetric MoE), Mistral 7B ($0.20/$0.20 — symmetric budget), Llama 2 70B ($0.90/$0.90 — legacy).
                </p>
                <CodeBlock language="typescript" code={sdkDatabricksExample} />
              </TabsContent>
              <TabsContent value="gradient" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Gradient AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Gradient AI base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. The only inference platform that combines serverless inference with built-in LoRA fine-tuning — deploy a custom model in minutes. 8 models: Llama 3.3 70B ($0.40/$0.40 per 1M — symmetric flagship), Llama 3.1 8B ($0.06/$0.06 — budget), Llama 3.1 405B ($2.00/$2.00 — enterprise), Mistral 7B ($0.05/$0.05 — cheapest), CodeLlama 34B ($0.18/$0.18 — code), Nous Hermes 2 DPO ($0.06/$0.06 — community fine-tuned), Llama 2 70B ($0.90/$0.90 — legacy), Llama 3.3 70B Fine-tuned ($0.60/$0.60 — custom endpoint).
                </p>
                <CodeBlock language="typescript" code={sdkGradientExample} />
              </TabsContent>
              <TabsContent value="baseten" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Baseten is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Baseten base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Production ML inference platform (a16z-backed) trusted by Tesla, Box, and Calendly — serve public models and private fine-tuned models on the same OpenAI-compatible endpoint. 8 models: Llama 3.3 70B ($1.10/$1.10 per 1M — symmetric flagship), Llama 3.1 8B ($0.17/$0.17 — symmetric budget), Llama 3.1 405B ($3.50/$3.50 — symmetric enterprise), Mistral 7B ($0.15/$0.15 — cheapest), Mistral Nemo 12B ($0.25/$0.25 — symmetric), Qwen 2.5 72B ($1.10/$1.10 — symmetric), DeepSeek R1 ($0.55/$2.19 — reasoning), Phi-3 Medium 128K ($0.30/$0.30 — long context).
                </p>
                <CodeBlock language="typescript" code={sdkBasetenExample} />
              </TabsContent>
              <TabsContent value="watsonx" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  IBM WatsonX uses the OpenAI-compatible endpoint with IBM Cloud IAM token auth — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the WatsonX base URL and an IAM access token. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Enterprise AI platform from IBM ($60B+ revenue) with IBM&apos;s own Granite models (Apache 2.0, FIPS 140-2 certified). 8 models: Granite 3.2 8B ($0.10/$0.20 per 1M — IBM flagship), Granite 3.2 2B ($0.05/$0.10 — cheapest IBM model, 98% cheaper input than GPT-4o), Granite 13B ($0.40/$1.20), Granite 20B Multilingual ($0.70/$2.10), Llama 3.3 70B ($0.90/$0.90 — symmetric on WatsonX), Llama 3.1 8B ($0.12/$0.12 — symmetric budget), Mistral Large ($3.00/$9.00 — flagship), Mistral 7B v0.2 ($0.15/$0.45 — budget).
                </p>
                <CodeBlock language="typescript" code={sdkWatsonXExample} />
              </TabsContent>
              <TabsContent value="snowflake" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Snowflake Cortex uses an OpenAI-compatible REST API — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Cortex base URL and a JWT or Personal Access Token. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Data cloud from Snowflake ($60B+ valuation, 10,000+ enterprise customers) with Snowflake&apos;s own Arctic model (480B MoE, Apache 2.0) and hosted open-weight models. All 8 models use symmetric pricing (input = output). 8 models: Snowflake Arctic ($10.00/$10.00 per 1M — 480B MoE flagship, Apache 2.0), Llama 3.3 70B ($1.00/$1.00 — symmetric), Llama 3.1 70B ($1.00/$1.00 — symmetric), Llama 3.1 8B ($0.10/$0.10 — budget), Llama 3.1 405B ($9.00/$9.00 — enterprise), Mistral Large ($3.20/$3.20 — symmetric), Mistral 7B ($0.10/$0.10 — budget), Mixtral 8x7B ($0.90/$0.90 — MoE symmetric).
                </p>
                <CodeBlock language="typescript" code={sdkSnowflakeExample} />
              </TabsContent>
              <TabsContent value="neets" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Neets.ai is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Neets.ai base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Serverless LLM inference with 100% symmetric pricing across all 8 models (input = output) — no output token surprise. 8 models: Llama 3.3 70B ($0.12/$0.12 per 1M — symmetric flagship), Llama 3.1 70B ($0.12/$0.12 — symmetric), Llama 3.1 8B ($0.06/$0.06 — budget, 98% cheaper than GPT-4o), Llama 3.1 405B ($2.50/$2.50 — enterprise), Mixtral 8x7B ($0.27/$0.27 — symmetric MoE), Mixtral 8x22B ($0.90/$0.90 — large MoE), Mistral 7B ($0.05/$0.05 — cheapest), Hermes 3 Llama 3.1 8B ($0.06/$0.06 — community).
                </p>
                <CodeBlock language="typescript" code={sdkNeetsExample} />
              </TabsContent>
              <TabsContent value="runpod" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  RunPod Serverless is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with your endpoint base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. GPU cloud inference on H100/A100/L40S clusters — deploy any open-weight model and track per-customer costs. 8 models: Llama 3.3 70B ($0.60/$0.80 per 1M — flagship H100), Llama 3.1 70B ($0.55/$0.70 — stable), Llama 3.1 8B ($0.08/$0.08 — symmetric budget), Llama 3.1 405B ($2.20/$3.00 — enterprise), Mistral 7B ($0.06/$0.06 — symmetric cheapest), DeepSeek R1 ($0.55/$2.19 — reasoning), Qwen 2.5 72B ($0.40/$0.50), Mixtral 8x7B ($0.22/$0.22 — symmetric MoE).
                </p>
                <CodeBlock language="typescript" code={sdkRunPodExample} />
              </TabsContent>
              <TabsContent value="predibase" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Predibase is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Predibase base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. The only inference platform purpose-built for fine-tuned LLMs (LoRA adapters) — serve base and custom fine-tuned models on the same endpoint. 8 models: Llama 3.3 70B ($0.59/$0.79 per 1M), Llama 3.1 8B ($0.20/$0.20 — symmetric budget), Llama 3.1 70B ($0.50/$0.67), Mistral 7B ($0.20/$0.20 — symmetric), Mixtral 8x7B ($0.30/$0.30 — symmetric MoE), DeepSeek R1 ($0.55/$2.19 — reasoning), Phi-3 Medium 128K ($0.25/$0.25 — symmetric), Qwen 2.5 72B ($0.40/$0.40 — symmetric).
                </p>
                <CodeBlock language="typescript" code={sdkPredibaseExample} />
              </TabsContent>
              <TabsContent value="vertexai" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Google Vertex AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code> package
                  with the Vertex AI endpoint. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create</code>{' '}
                  call is tracked automatically. Google Cloud&apos;s enterprise-grade AI platform with SOC2/HIPAA/FedRAMP compliance — completes the Big 3 hyperscaler set (AWS Bedrock + Azure OpenAI + Google Vertex AI). 8 models: Gemini 2.5 Pro ($1.25/$10.00 per 1M), Gemini 2.5 Flash ($0.15/$0.60), Gemini 2.0 Flash ($0.10/$0.40), Gemini 2.0 Flash Lite ($0.075/$0.30), Gemini 1.5 Pro ($1.25/$5.00), Gemini 1.5 Flash ($0.075/$0.30), Gemini 1.5 Flash 8B ($0.0375/$0.15 — cheapest Gemini), Gemini 1.0 Pro ($0.50/$1.50).
                </p>
                <CodeBlock language="typescript" code={sdkVertexAIExample} />
              </TabsContent>
              <TabsContent value="spark" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  iFlyTek Spark is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Spark base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. China&apos;s speech AI giant now in LLMs — all 8 models use symmetric pricing. 8 models: Spark Lite ($0.028/$0.028 per 1M — 98.6% cheaper input than GPT-4o), Spark Lite 128K ($0.14/$0.14), Spark Pro ($0.14/$0.14), Spark Pro 128K ($0.28/$0.28), Spark Max ($0.21/$0.21), Spark Max 32K ($0.42/$0.42), Spark 4.0 Ultra ($0.67/$0.67 — flagship), Spark X1 ($0.90/$0.90 — reasoning).
                </p>
                <CodeBlock language="typescript" code={sdkSparkExample} />
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Call <code className="rounded bg-muted px-1.5 py-0.5">track()</code> manually
                  after any LLM API call — useful for providers without a dedicated wrapper.
                </p>
                <CodeBlock language="typescript" code={sdkManualExample} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Config reference */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Configuration options</p>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-4 text-left font-medium">Option</th>
                    <th className="py-2 pr-4 text-left font-medium">Default</th>
                    <th className="py-2 text-left font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">apiKey</code></td>
                    <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">LLMETER_API_KEY</code></td>
                    <td className="py-2">Your LLMeter API key — falls back to the env var</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">batchSize</code></td>
                    <td className="py-2 pr-4">50</td>
                    <td className="py-2">Flush when the buffer reaches this many events</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">flushInterval</code></td>
                    <td className="py-2 pr-4">5000 ms</td>
                    <td className="py-2">Auto-flush interval in milliseconds (0 to disable)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">maxRetries</code></td>
                    <td className="py-2 pr-4">3</td>
                    <td className="py-2">Retries on 429 / 5xx with exponential back-off</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">baseUrl</code></td>
                    <td className="py-2 pr-4">llmeter.org</td>
                    <td className="py-2">Override for self-hosted deployments</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Grafana / Prometheus Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Grafana Integration</CardTitle>
            <Badge variant="secondary">Team</Badge>
          </div>
          <CardDescription>
            Expose LLM cost and usage as Prometheus metrics and visualize them in Grafana.
            The <code className="rounded bg-muted px-1.5 py-0.5">/api/v1/metrics</code> endpoint
            returns data in the Prometheus text exposition format, compatible with any
            Prometheus-based scraper or monitoring stack.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metrics exposed */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Metric families</p>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-4 text-left font-medium">Metric</th>
                    <th className="py-2 pr-4 text-left font-medium">Type</th>
                    <th className="py-2 text-left font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">llmeter_cost_usd_total</td>
                    <td className="py-2 pr-4">gauge</td>
                    <td className="py-2">Total spend in USD — labels: <code className="rounded bg-muted px-1 py-0.5">provider</code>, <code className="rounded bg-muted px-1 py-0.5">model</code></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">llmeter_requests_total</td>
                    <td className="py-2 pr-4">gauge</td>
                    <td className="py-2">Total API request count — labels: <code className="rounded bg-muted px-1 py-0.5">provider</code>, <code className="rounded bg-muted px-1 py-0.5">model</code></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">llmeter_input_tokens_total</td>
                    <td className="py-2 pr-4">gauge</td>
                    <td className="py-2">Total input tokens consumed — labels: <code className="rounded bg-muted px-1 py-0.5">provider</code>, <code className="rounded bg-muted px-1 py-0.5">model</code></td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">llmeter_output_tokens_total</td>
                    <td className="py-2 pr-4">gauge</td>
                    <td className="py-2">Total output tokens consumed — labels: <code className="rounded bg-muted px-1 py-0.5">provider</code>, <code className="rounded bg-muted px-1 py-0.5">model</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabs: Prometheus config, PromQL, date range */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Setup</p>
            <Tabs defaultValue="prometheus">
              <TabsList>
                <TabsTrigger value="prometheus">Prometheus scrape config</TabsTrigger>
                <TabsTrigger value="promql">PromQL examples</TabsTrigger>
                <TabsTrigger value="daterange">Date range filter</TabsTrigger>
              </TabsList>
              <TabsContent value="prometheus" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add this job to your <code className="rounded bg-muted px-1.5 py-0.5">prometheus.yml</code>.
                  Replace <code className="rounded bg-muted px-1.5 py-0.5">YOUR_API_KEY</code> with a key
                  from <strong>Settings → API Keys</strong>.
                </p>
                <CodeBlock language="yaml" code={grafanaPrometheusConfig} />
                <p className="text-sm text-muted-foreground">
                  Then add LLMeter as a Prometheus data source in Grafana and use the PromQL
                  examples below to build dashboards.
                </p>
              </TabsContent>
              <TabsContent value="promql" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Useful PromQL queries for building Grafana panels.
                </p>
                <CodeBlock language="promql" code={grafanaPromqlExamples} />
              </TabsContent>
              <TabsContent value="daterange" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add <code className="rounded bg-muted px-1.5 py-0.5">from</code> and{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">to</code> query params
                  (YYYY-MM-DD) to restrict the aggregation window. Useful for point-in-time
                  snapshots or monthly billing reports.
                </p>
                <CodeBlock language="http" code={grafanaDateRangeExample} />
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-sm text-muted-foreground">
            The endpoint requires a valid API key with at least <strong>read</strong> scope.
            Metrics are computed over the full history of your usage records by default, or
            filtered by date range when the <code className="rounded bg-muted px-1.5 py-0.5">from</code>/
            <code className="rounded bg-muted px-1.5 py-0.5">to</code> params are provided.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold tracking-tight">HTTP Ingestion API</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Use the raw HTTP API when the SDK is not available (e.g., Python back-ends, shell scripts, or any other runtime).
        </p>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            The Ingestion API lets you push LLM usage records directly into LLMeter.
            This is useful for custom integrations, batch imports, or tracking usage
            from providers not natively supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Prerequisites</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create an API key in <strong>Settings &rarr; API Keys</strong></li>
              <li>Note your API key &mdash; it is only shown once</li>
              <li>Use the key in the <code className="rounded bg-muted px-1.5 py-0.5">Authorization</code> header of your requests</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            All requests must include a Bearer token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            language="http"
            code="Authorization: Bearer YOUR_API_KEY"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            API keys are hashed with SHA-256 before storage. Keep your key safe &mdash;
            it cannot be recovered after creation.
          </p>
        </CardContent>
      </Card>

      {/* Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge>POST</Badge>
            <code className="rounded bg-muted px-2 py-1 text-sm">/api/ingest</code>
          </div>
          <p className="text-sm text-muted-foreground">
            Accepts a JSON array of usage records. Each record represents a single
            LLM API call or aggregated usage for a time window.
          </p>
        </CardContent>
      </Card>

      {/* Request Format */}
      <Card>
        <CardHeader>
          <CardTitle>Request Format</CardTitle>
          <CardDescription>
            Send a JSON array in the request body. Each object must include:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium">Field</th>
                  <th className="py-2 pr-4 text-left font-medium">Type</th>
                  <th className="py-2 pr-4 text-left font-medium">Required</th>
                  <th className="py-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">model</code></td>
                  <td className="py-2 pr-4">string</td>
                  <td className="py-2 pr-4">Yes</td>
                  <td className="py-2">Model identifier (e.g. &quot;gpt-4o&quot;, &quot;claude-sonnet-4-20250514&quot;)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">input_tokens</code></td>
                  <td className="py-2 pr-4">number</td>
                  <td className="py-2 pr-4">Yes</td>
                  <td className="py-2">Number of input/prompt tokens</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">output_tokens</code></td>
                  <td className="py-2 pr-4">number</td>
                  <td className="py-2 pr-4">Yes</td>
                  <td className="py-2">Number of output/completion tokens</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">customer_id</code></td>
                  <td className="py-2 pr-4">string</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2">Optional customer identifier for per-customer tracking</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">timestamp</code></td>
                  <td className="py-2 pr-4">string</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2">ISO 8601 timestamp. Defaults to current time if omitted.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Response Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Response Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium">Status</th>
                  <th className="py-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4"><Badge variant="secondary">200</Badge></td>
                  <td className="py-2">Records ingested successfully</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4"><Badge variant="secondary">400</Badge></td>
                  <td className="py-2">Invalid request body or validation error</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4"><Badge variant="secondary">401</Badge></td>
                  <td className="py-2">Missing or invalid API key</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4"><Badge variant="secondary">429</Badge></td>
                  <td className="py-2">Rate limit exceeded (100 req/min per key). Check <code className="rounded bg-muted px-1.5 py-0.5">Retry-After</code> header.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="secondary">500</Badge></td>
                  <td className="py-2">Internal server error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            Replace <code className="rounded bg-muted px-1.5 py-0.5">YOUR_API_KEY</code> with
            your actual API key from Settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            <TabsContent value="curl" className="mt-4">
              <CodeBlock language="bash" code={curlExample} />
            </TabsContent>
            <TabsContent value="node" className="mt-4">
              <CodeBlock language="javascript" code={nodeExample} />
            </TabsContent>
            <TabsContent value="python" className="mt-4">
              <CodeBlock language="python" code={pythonExample} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-sm text-muted-foreground pb-4">
        Need help? Check the API key setup in <strong>Settings &rarr; API Keys</strong> or
        contact support.
      </p>
    </div>
  );
}
