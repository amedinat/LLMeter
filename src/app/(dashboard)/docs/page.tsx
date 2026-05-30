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

const sdkOCIExample = `import OpenAI from 'openai';
import LLMeter, { wrapOCI } from 'llmeter';

// OCI Generative AI is OpenAI-compatible — use the openai package with the OCI base URL
const oci = new OpenAI({
  apiKey: process.env.OCI_AUTH_TOKEN,
  baseURL: 'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat/openai',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedOCI = wrapOCI(oci, llmeter);

// All calls are automatically tracked — Oracle Cloud, the 4th enterprise hyperscaler
const completion = await trackedOCI.chat.completions.create(
  {
    model: 'meta.llama-3.3-70b-instruct',
    messages: [{ role: 'user', content: 'Hello from Oracle Cloud!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to OCI
);`;

const sdkParasailExample = `import OpenAI from 'openai';
import LLMeter, { wrapParasail } from 'llmeter';

// Parasail is OpenAI-compatible — use your Parasail API key as the Bearer token
const parasail = new OpenAI({
  apiKey: process.env.PARASAIL_API_KEY,
  baseURL: 'https://api.parasail.io/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedParasail = wrapParasail(parasail, llmeter);

// All calls are automatically tracked — 30× cheaper, no quotas, Day 0 frontier models
const completion = await trackedParasail.chat.completions.create(
  {
    model: 'deepseek-ai/DeepSeek-V3-0324', // or 'meta-llama/Meta-Llama-3.3-70B-Instruct', etc.
    messages: [{ role: 'user', content: 'Hello from Parasail!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Parasail
);`;

const sdkOpenPipeExample = `import OpenAI from 'openai';
import LLMeter, { wrapOpenPipe } from 'llmeter';

// OpenPipe is OpenAI-compatible — use your OpenPipe API key (opk_...) as the Bearer token
const openpipe = new OpenAI({
  apiKey: process.env.OPENPIPE_API_KEY,
  baseURL: 'https://api.openpipe.ai/api/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedOpenPipe = wrapOpenPipe(openpipe, llmeter);

// All calls are automatically tracked — fine-tuned models, 100% symmetric pricing
const completion = await trackedOpenPipe.chat.completions.create(
  {
    model: 'openpipe/meta-llama/Meta-Llama-3.3-70B-Instruct', // or any fine-tuned model
    messages: [{ role: 'user', content: 'Hello from OpenPipe!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to OpenPipe
);`;

const sdkInceptionExample = `import OpenAI from 'openai';
import LLMeter, { wrapInception } from 'llmeter';

// Inception AI is OpenAI-compatible — use your Inception API key as the Bearer token
const inception = new OpenAI({
  apiKey: process.env.INCEPTION_API_KEY,
  baseURL: 'https://api.inceptionlabs.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedInception = wrapInception(inception, llmeter);

// All calls are automatically tracked — diffusion LLMs, 100% symmetric coding model pricing
const completion = await trackedInception.chat.completions.create(
  {
    model: 'mercury-coder-small-20b', // or 'mercury-mini', 'mercury-large', etc.
    messages: [{ role: 'user', content: 'Hello from Inception AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Inception AI
);`;

const sdkLiquidExample = `import OpenAI from 'openai';
import LLMeter, { wrapLiquid } from 'llmeter';

// Liquid AI is OpenAI-compatible — use your Liquid API key as the Bearer token
const liquid = new OpenAI({
  apiKey: process.env.LIQUID_API_KEY,
  baseURL: 'https://api.liquid.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedLiquid = wrapLiquid(liquid, llmeter);

// All calls are automatically tracked — liquid neural network LFMs, all symmetric pricing
const completion = await trackedLiquid.chat.completions.create(
  {
    model: 'lfm-40b', // or 'lfm-7b', 'lfm-3b', 'lfm-40b-moe', etc.
    messages: [{ role: 'user', content: 'Hello from Liquid AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Liquid AI
);`;

const sdkZyphraExample = `import OpenAI from 'openai';
import LLMeter, { wrapZyphra } from 'llmeter';

// Zyphra is OpenAI-compatible — use your Zyphra API key as the Bearer token
const zyphra = new OpenAI({
  apiKey: process.env.ZYPHRA_API_KEY,
  baseURL: 'https://api.zyphra.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedZyphra = wrapZyphra(zyphra, llmeter);

// All calls are automatically tracked — Mamba SSM models, 100% symmetric pricing
const completion = await trackedZyphra.chat.completions.create(
  {
    model: 'zamba2-7b-instruct', // or 'zamba2-2.7b', 'zamba2-1.2b', 'zamba2-mini', etc.
    messages: [{ role: 'user', content: 'Hello from Zyphra!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Zyphra
);`;

const sdkCentMLExample = `import OpenAI from 'openai';
import LLMeter, { wrapCentML } from 'llmeter';

// CentML is OpenAI-compatible — use your CentML API key as the Bearer token
const centml = new OpenAI({
  apiKey: process.env.CENTML_API_KEY,
  baseURL: 'https://api.centml.com/openai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCentML = wrapCentML(centml, llmeter);

// All calls are automatically tracked — Canadian GPU efficiency inference
const completion = await trackedCentML.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'deepseek-ai/DeepSeek-R1', 'mistralai/Mistral-7B-Instruct-v0.3', etc.
    messages: [{ role: 'user', content: 'Hello from CentML!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to CentML
);`;

const sdkInferlessExample = `import OpenAI from 'openai';
import LLMeter, { wrapInferless } from 'llmeter';

// Inferless is OpenAI-compatible — use your Inferless API key as the Bearer token
// YC W23-backed serverless GPU inference: deploy any HuggingFace model in under 60 seconds
const inferless = new OpenAI({
  apiKey: process.env.INFERLESS_API_KEY,
  baseURL: 'https://api.inferless.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedInferless = wrapInferless(inferless, llmeter);

// All calls are automatically tracked — serverless GPU inference
const completion = await trackedInferless.chat.completions.create(
  {
    model: 'mistralai/Mistral-7B-Instruct-v0.3', // or 'meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from Inferless!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Inferless
);`;

const sdkVeniceExample = `import OpenAI from 'openai';
import LLMeter, { wrapVenice } from 'llmeter';

// Venice AI is OpenAI-compatible — use your Venice AI API key as the Bearer token
// Privacy-first: no conversation logging, no model training on your data
const venice = new OpenAI({
  apiKey: process.env.VENICE_AI_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedVenice = wrapVenice(venice, llmeter);

// All calls are automatically tracked — privacy-first inference
const completion = await trackedVenice.chat.completions.create(
  {
    model: 'llama-3.3-70b', // or 'deepseek-r1', 'qwen-2.5-72b', 'mistral-7b-instruct', etc.
    messages: [{ role: 'user', content: 'Hello from Venice AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Venice AI
);`;

const sdkArceeExample = `import OpenAI from 'openai';
import LLMeter, { wrapArcee } from 'llmeter';

// Arcee AI is OpenAI-compatible — use your Arcee API key as the Bearer token
const arcee = new OpenAI({
  apiKey: process.env.ARCEE_API_KEY,
  baseURL: 'https://api.arcee.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedArcee = wrapArcee(arcee, llmeter);

// All calls are automatically tracked — SuperMerging™ model merging inference
const completion = await trackedArcee.chat.completions.create(
  {
    model: 'arcee-maestro', // or 'arcee-nova', 'arcee-agent', 'arcee-lite', 'arcee-blitz', etc.
    messages: [{ role: 'user', content: 'Hello from Arcee AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Arcee
);`;

const sdkCodestralExample = `import OpenAI from 'openai';
import LLMeter, { wrapCodestral } from 'llmeter';

// Mistral AI Codestral — dedicated code generation endpoint (separate from Mistral chat)
// Devstral Small: #1 open-source on SWE-bench | Codestral Mamba: $0.25/1M symmetric
const codestral = new OpenAI({
  apiKey: process.env.CODESTRAL_API_KEY, // your Mistral API key
  baseURL: 'https://codestral.mistral.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCodestral = wrapCodestral(codestral, llmeter);

// All calls are automatically tracked — track code AI spend separately from chat AI
const completion = await trackedCodestral.chat.completions.create(
  {
    model: 'devstral-small-2505', // or 'codestral-2501', 'codestral-mamba-latest', 'open-codestral-mamba', etc.
    messages: [{ role: 'user', content: 'Write a binary search in Python' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Codestral
);`;

const sdkFluidStackExample = `import OpenAI from 'openai';
import LLMeter, { wrapFluidStack } from 'llmeter';

// Fluidstack is OpenAI-compatible — GPU aggregation cloud (H100/H200/A100), 15+ global data centers
// Trained Mistral AI, Stability AI, and xAI — now serving the models they helped create
// Mistral 7B at $0.09/1M (symmetric) — competitive pricing from the infrastructure company
const fs = new OpenAI({
  apiKey: process.env.FLUIDSTACK_API_KEY,
  baseURL: 'https://api.fluidstack.io/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedFS = wrapFluidStack(fs, llmeter);

// All calls are automatically tracked — serverless inference from the GPU aggregator
const completion = await trackedFS.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct', // or 'deepseek-ai/DeepSeek-R1', 'mistralai/Mistral-7B-Instruct-v0.3', etc.
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Fluidstack
);`;

const sdkNaverExample = `import OpenAI from 'openai';
import LLMeter, { wrapNaver } from 'llmeter';

// NAVER HyperCLOVA X — Korea's largest internet company (KRX: 035420)
// HyperCLOVA (2021): world's first non-English LLM at 82B params
// HCX-DASH-003 at $0.08/$0.24 per 1M — 97% cheaper than GPT-4o input
// Credentials: apiKeyId::serviceKey (from console.ncloud.com > CLOVA Studio)
const naver = new OpenAI({
  apiKey: process.env.NAVER_SERVICE_KEY,
  baseURL: 'https://clovastudio.stream.naver.com/openai/v1',
  defaultHeaders: {
    'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_API_KEY_ID,
    'X-NCP-APIGW-API-KEY': process.env.NAVER_SERVICE_KEY,
  },
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNaver = wrapNaver(naver, llmeter);

// All calls are automatically tracked — NAVER CLOVA Studio inference
const completion = await trackedNaver.chat.completions.create(
  {
    model: 'HCX-003', // or 'HCX-DASH-001', 'HCX-DASH-002', 'HCX-DASH-003', etc.
    messages: [{ role: 'user', content: 'Korea의 수도가 어디야?' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to NAVER
);`;

const sdkAI360Example = `import OpenAI from 'openai';
import LLMeter, { wrapAI360 } from 'llmeter';

// 360 AI is OpenAI-compatible — China's largest cybersecurity company (601360.SZ)
// 4.5B endpoint protection clients worldwide, founded 2005 by Zhou Hongyi
// 360GPT-Lite at $0.08/$0.24 per 1M — 97% cheaper than GPT-4o input
const ai360 = new OpenAI({
  apiKey: process.env.AI360_API_KEY,
  baseURL: 'https://ai.360.cn/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAI360 = wrapAI360(ai360, llmeter);

// All calls are automatically tracked — 360 Security Technology inference
const completion = await trackedAI360.chat.completions.create(
  {
    model: '360gpt2-pro', // or '360gpt-turbo', '360gpt-lite', '360gpt-130b', etc.
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to 360 AI
);`;

const sdkSenseNovaExample = `import OpenAI from 'openai';
import LLMeter, { wrapSenseNova } from 'llmeter';

// SenseNova is OpenAI-compatible — SenseTime's LLM platform (China's largest AI company at IPO)
// SenseChat-5 at $2.00/$6.00 per 1M — ImageNet 2015 winner, 100M+ users
const sensenova = new OpenAI({
  apiKey: process.env.SENSENOVA_API_KEY,
  baseURL: 'https://api.sensenova.cn/compatible-mode/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedSenseNova = wrapSenseNova(sensenova, llmeter);

// All calls are automatically tracked — China's largest AI company inference
const completion = await trackedSenseNova.chat.completions.create(
  {
    model: 'SenseChat-5', // or 'SenseChat-5-Turbo', 'SenseChat-Lite-V4', 'SenseReasoner-Pro', etc.
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to SenseNova
);`;

const sdkClarifaiExample = `import OpenAI from 'openai';
import LLMeter, { wrapClarifai } from 'llmeter';

// Clarifai is OpenAI-compatible — enterprise AI platform (2.5B predictions/month, SOC2/HIPAA)
// Llama 3.3 70B at $0.45/$0.67 per 1M — founded by ImageNet 2013 winner Matthew Zeiler
const clarifai = new OpenAI({
  apiKey: process.env.CLARIFAI_PAT,
  baseURL: 'https://api.clarifai.com/v2/ext/openai/v1',
  defaultHeaders: { Authorization: \`Key \${process.env.CLARIFAI_PAT}\` },
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedClarifai = wrapClarifai(clarifai, llmeter);

// All calls are automatically tracked — enterprise-grade inference with SOC2 compliance
const completion = await trackedClarifai.chat.completions.create(
  {
    model: 'meta-llama/Llama-3_3-70B-Instruct', // or 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2_5-72B-Instruct', etc.
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Clarifai
);`;

const sdkPremExample = `import OpenAI from 'openai';
import LLMeter, { wrapPrem } from 'llmeter';

// Prem AI is OpenAI-compatible — European privacy-first inference (Paris-based, GDPR-native)
// Llama 3.3 70B at $0.48/$0.72 per 1M — privacy-preserving inference with no data retention
const prem = new OpenAI({
  apiKey: process.env.PREM_API_KEY,
  baseURL: 'https://api.premai.io/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedPrem = wrapPrem(prem, llmeter);

// All calls are automatically tracked — privacy-first European inference
const completion = await trackedPrem.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct', // or 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct', etc.
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Prem AI
);`;

const sdkCoreWeaveExample = `import OpenAI from 'openai';
import LLMeter, { wrapCoreWeave } from 'llmeter';

// CoreWeave is OpenAI-compatible — enterprise GPU cloud (H100/A100 clusters, $35B IPO)
// Llama 3.3 70B at $0.48/1M symmetric — enterprise SLAs, runs workloads for OpenAI/Meta/Microsoft
const cw = new OpenAI({
  apiKey: process.env.COREWEAVE_API_KEY,
  baseURL: 'https://inference.coreweave.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCW = wrapCoreWeave(cw, llmeter);

// All calls are automatically tracked — enterprise-grade inference with guaranteed SLAs
const completion = await trackedCW.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct', // or 'deepseek-ai/DeepSeek-R1', 'mistralai/Mixtral-8x7B-Instruct-v0.1', etc.
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to CoreWeave
);`;

const sdkMonsterAPIExample = `import OpenAI from 'openai';
import LLMeter, { wrapMonsterAPI } from 'llmeter';

// Monster API is OpenAI-compatible — Indian GPU marketplace, OpenAI SDK with Monster base URL
// Mistral 7B at $0.04/1M symmetric — 98% cheaper than GPT-4o input
const monster = new OpenAI({
  apiKey: process.env.MONSTER_API_KEY,
  baseURL: 'https://api.monsterapi.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedMonster = wrapMonsterAPI(monster, llmeter);

// All calls are automatically tracked — competitive GPU marketplace pricing
const completion = await trackedMonster.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'mistralai/Mistral-7B-Instruct-v0.3', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Monster API
);`;

const sdkAkashExample = `import OpenAI from 'openai';
import LLMeter, { wrapAkash } from 'llmeter';

// Akash Chat API is OpenAI-compatible — use your Akash API key as the Bearer token
const akash = new OpenAI({
  apiKey: process.env.AKASH_API_KEY,
  baseURL: 'https://chatapi.akash.network/api/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAkash = wrapAkash(akash, llmeter);

// All calls are automatically tracked — decentralized Cosmos blockchain compute
const completion = await trackedAkash.chat.completions.create(
  {
    model: 'Meta-Llama-3.3-70B-Instruct', // or 'Meta-Llama-3.1-8B-Instruct', 'DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from Akash Network!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Akash
);`;

const sdkCorcelExample = `import OpenAI from 'openai';
import LLMeter, { wrapCorcel } from 'llmeter';

// Corcel is OpenAI-compatible — use your Corcel API key as the Bearer token
const corcel = new OpenAI({
  apiKey: process.env.CORCEL_API_KEY,
  baseURL: 'https://api.corcel.io/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedCorcel = wrapCorcel(corcel, llmeter);

// All calls are automatically tracked — Bittensor-powered decentralized AI, symmetric pricing
const completion = await trackedCorcel.chat.completions.create(
  {
    model: 'corcel/llama-3-3-70b', // or 'corcel/mistral-7b', 'corcel/deepseek-r1', etc.
    messages: [{ role: 'user', content: 'Hello from Corcel!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Corcel
);`;

const sdkGitHubModelsExample = `import OpenAI from 'openai';
import LLMeter, { wrapGitHub } from 'llmeter';

// GitHub Models is OpenAI-compatible — use your GitHub PAT as the API key
const github = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN, // GitHub Personal Access Token (classic or fine-grained)
  baseURL: 'https://models.inference.ai.azure.com',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedGitHub = wrapGitHub(github, llmeter);

// All calls are automatically tracked — 100M+ GitHub developers, 30+ models
const completion = await trackedGitHub.chat.completions.create(
  {
    model: 'gpt-4o', // or 'Meta-Llama-3.1-8B-Instruct', 'Phi-4', 'Mistral-Nemo', etc.
    messages: [{ role: 'user', content: 'Hello from GitHub Models!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to GitHub Models
);`;

const sdkGigaChatExample = `import OpenAI from 'openai';
import LLMeter, { wrapGigaChat } from 'llmeter';

// Step 1: Exchange your Authorization Key for a JWT access token
// POST https://ngw.devices.sberbank.ru:9443/api/v2/oauth
// Headers: Authorization: Basic <your-auth-key>, RqUID: <uuid4>
// Body: scope=GIGACHAT_API_PERS
// Returns: { access_token: "eyJ...", expires_at: 1234567890 }

// Step 2: Use the JWT token with the OpenAI-compatible GigaChat endpoint
const gigachat = new OpenAI({
  apiKey: process.env.GIGACHAT_ACCESS_TOKEN, // JWT from OAuth step above
  baseURL: 'https://gigachat.devices.sberbank.ru/api/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedGigaChat = wrapGigaChat(gigachat, llmeter);

// All calls are automatically tracked — Russia's sovereign AI, 100M+ users
const completion = await trackedGigaChat.chat.completions.create(
  {
    model: 'GigaChat-Max',
    messages: [{ role: 'user', content: 'Привет! Как дела?' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to GigaChat
);`;

const sdkIoNetExample = `# Use the openai npm package with the io.net base URL
import OpenAI from 'openai';
import LLMeter, { wrapIoNet } from 'llmeter';

// io.net is OpenAI-compatible — use the openai package with the io.net base URL
const ionet = new OpenAI({
  apiKey: process.env.IONET_API_KEY,
  baseURL: 'https://api.io.net/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedIoNet = wrapIoNet(ionet, llmeter);

// All calls are automatically tracked — decentralized GPU cloud from 100+ countries
const completion = await trackedIoNet.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: 'Hello from io.net!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to io.net
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

const sdkMetaExample = `import OpenAI from 'openai';
import LLMeter, { wrapMeta } from 'llmeter';

// Meta Llama API — Meta's official inference endpoint for Llama models (1B+ downloads)
// Llama 4 Scout/Maverick (MoE), Llama 3.3 70B, Llama 3.1 405B, Llama 3.2 vision
// Llama 3.3 70B at $0.28/1M — 85% cheaper than GPT-4o input
const meta = new OpenAI({
  apiKey: process.env.META_API_KEY,
  baseURL: 'https://api.llama.com/compat/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedMeta = wrapMeta(meta, llmeter);

// All calls are automatically tracked — Meta's official Llama inference
const completion = await trackedMeta.chat.completions.create(
  {
    model: 'Llama-4-Scout-17B-16E-Instruct-FP8', // or 'Llama-3.3-70B-Instruct', 'Llama-3.1-405B-Instruct-FP8', etc.
    messages: [{ role: 'user', content: 'Hello from Meta Llama!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Meta Llama API
);`;

const sdkNousResearchExample = `import OpenAI from 'openai';
import LLMeter, { wrapNousResearch } from 'llmeter';

// Nous Research (Nous Forge) — the open-source fine-tuning lab that created the Hermes series
// 100M+ Hugging Face downloads; Hermes-3 sets the standard for instruction following at scale
// Hermes-2-Pro Mistral-7B at $0.07/1M — 97% cheaper than GPT-4o input
const nous = new OpenAI({
  apiKey: process.env.NOUS_API_KEY,
  baseURL: 'https://api.nousresearch.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNous = wrapNousResearch(nous, llmeter);

// All calls are automatically tracked — Hermes fine-tuned inference
const completion = await trackedNous.chat.completions.create(
  {
    model: 'NousResearch/Hermes-3-Llama-3.1-70B', // or 'NousResearch/Hermes-2-Pro-Mistral-7B', 'NousResearch/Hermes-3-Llama-3.1-405B', etc.
    messages: [{ role: 'user', content: 'Hello from Nous Forge!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Nous Research
);`;

const sdkSakuraExample = `import OpenAI from 'openai';
import LLMeter, { wrapSakura } from 'llmeter';

// Sakura Internet — Japan's largest independent cloud (TSE Prime: 3778, founded 1996)
// H100 GPU AI inference platform with Japanese data sovereignty
// Llama 3.3 70B at $0.45/1M — first Japanese sovereign cloud on LLMeter
const sakura = new OpenAI({
  apiKey: process.env.SAKURA_API_KEY,
  baseURL: 'https://api.sakura.io/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedSakura = wrapSakura(sakura, llmeter);

// All calls are automatically tracked — Japanese H100 GPU inference
const completion = await trackedSakura.chat.completions.create(
  {
    model: 'meta-llama/Llama-3.3-70B-Instruct', // or 'mistralai/Mistral-7B-Instruct-v0.3', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'こんにちは from Sakura Internet!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Sakura Internet
);`;

const sdkTextSynthExample = `import OpenAI from 'openai';
import LLMeter, { wrapTextSynth } from 'llmeter';

// TextSynth — privacy-first LLM inference by Fabrice Bellard (creator of FFmpeg, QEMU, TCC)
// One-man operation based in France; no training on user data; logs deleted regularly
// Mistral 7B at $0.04/1M — 98% cheaper than GPT-4o input
const textsynth = new OpenAI({
  apiKey: process.env.TEXTSYNTH_API_KEY,
  baseURL: 'https://api.textsynth.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedTextSynth = wrapTextSynth(textsynth, llmeter);

// All calls are automatically tracked — privacy-first French inference
const completion = await trackedTextSynth.chat.completions.create(
  {
    model: 'mistral_7B_instruct', // or 'llama3_70B', 'mixtral_47B_instruct', 'qwen2_72B', etc.
    messages: [{ role: 'user', content: 'Hello from TextSynth!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to TextSynth
);`;

const sdkHeuristExample = `import OpenAI from 'openai';
import LLMeter, { wrapHeurist } from 'llmeter';

// Heurist AI — decentralized inference on Ethereum ZK (L2 zero-knowledge proofs)
// 4th blockchain network on LLMeter (Corcel/Bittensor + io.net/Solana + Akash/Cosmos + Heurist/ETH ZK)
// Idle GPU resources rewarded via smart contracts. Mistral 7B at $0.04/1M — 98% cheaper than GPT-4o
const heurist = new OpenAI({
  apiKey: process.env.HEURIST_API_KEY,
  baseURL: 'https://llm-gateway.heurist.xyz/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedHeurist = wrapHeurist(heurist, llmeter);

// All calls are automatically tracked — decentralized Ethereum ZK inference
const completion = await trackedHeurist.chat.completions.create(
  {
    model: 'meta-llama/llama-3.3-70b-instruct', // or 'mistralai/mistral-7b-instruct-v0.3', 'deepseek-ai/deepseek-r1', etc.
    messages: [{ role: 'user', content: 'Hello from Heurist!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Heurist
);`;

const sdkNetmindExample = `import OpenAI from 'openai';
import LLMeter, { wrapNetmind } from 'llmeter';

// NetMind AI — community GPU marketplace (250,000+ contributor nodes, NMT token rewards)
// Founded 2022, UK-based; community GPU supply drives prices down
// Llama 3.1 8B at $0.04/1M — 98% cheaper than GPT-4o input
const netmind = new OpenAI({
  apiKey: process.env.NETMIND_API_KEY,
  baseURL: 'https://api.netmind.ai/inference-api/openai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNetmind = wrapNetmind(netmind, llmeter);

// All calls are automatically tracked — community GPU inference
const completion = await trackedNetmind.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'meta-llama/Meta-Llama-3.1-8B-Instruct', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from NetMind!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to NetMind
);`;

const sdkHyperstackExample = `import OpenAI from 'openai';
import LLMeter, { wrapHyperstack } from 'llmeter';

// Hyperstack — UK/Netherlands GPU cloud, certified NVIDIA Cloud Partner
// H100, H200, and A100 clusters; sustainable data centres on Dutch renewable energy
// Mixtral 8x7B at $0.28/1M symmetric — MoE at GPU cloud pricing
const hyperstack = new OpenAI({
  apiKey: process.env.HYPERSTACK_API_KEY,
  baseURL: 'https://infra.hyperstack.cloud/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedHyperstack = wrapHyperstack(hyperstack, llmeter);

// All calls are automatically tracked — NVIDIA-certified H100/H200 inference
const completion = await trackedHyperstack.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'meta-llama/Meta-Llama-3.1-8B-Instruct', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from Hyperstack!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Hyperstack
);`;

const sdkGMIExample = `import OpenAI from 'openai';
import LLMeter, { wrapGMI } from 'llmeter';

// GMI Cloud — $82M Series A GPU cloud (San Jose, founded 2022 by Alex Yeh)
// Pivoted from Bitcoin compute to AI GPU infrastructure; H100/H200 clusters
// Kimi K2 Agentic, MiniMax M2.1, Qwen3-VL 235B, GLM-4.7, DeepSeek R1, Llama 3.3 70B
const gmi = new OpenAI({
  apiKey: process.env.GMI_API_KEY,
  baseURL: 'https://api.gmi-serving.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedGMI = wrapGMI(gmi, llmeter);

// All calls are automatically tracked — frontier models via H100 GPU clusters
const completion = await trackedGMI.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'deepseek-ai/DeepSeek-R1-0528', 'moonshotai/Kimi-K2-Instruct', etc.
    messages: [{ role: 'user', content: 'Hello from GMI Cloud!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to GMI Cloud
);`;

const sdkInternLMExample = `import OpenAI from 'openai';
import LLMeter, { wrapInternLM } from 'llmeter';

// InternLM — Shanghai AI Lab (上海人工智能实验室), founded 2020
// Backed by Alibaba, Tencent, ByteDance, and Sequoia China
// Top-ranked on C-Eval, CMMLU, HumanEval; InternVL2 is a top open-source vision-language model
const internlm = new OpenAI({
  apiKey: process.env.INTERNLM_API_KEY,
  baseURL: 'https://internlm-chat.intern-ai.org.cn/puyu/api/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedInternLM = wrapInternLM(internlm, llmeter);

// All calls are automatically tracked — ultra-budget Chinese AI with vision support
const completion = await trackedInternLM.chat.completions.create(
  {
    model: 'internlm3-8b-instruct', // or 'internlm2-5-20b-chat', 'internvl2-26b', etc.
    messages: [{ role: 'user', content: 'Hello from InternLM!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to InternLM
);`;

const sdkTargonExample = `import OpenAI from 'openai';
import LLMeter, { wrapTargon } from 'llmeter';

// Targon (Nineteen.ai) — Bittensor subnet 19 decentralized inference
// 6th blockchain AI network on LLMeter (Corcel/Bittensor + io.net/Solana + Akash/Cosmos + Heurist/ETH ZK + NEAR + Targon)
// Community GPU validators earn TAO rewards by serving inference
// Llama 3.1 8B at $0.04/1M — 98% cheaper than GPT-4o
const targon = new OpenAI({
  apiKey: process.env.TARGON_API_KEY,
  baseURL: 'https://api.targon.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedTargon = wrapTargon(targon, llmeter);

// All calls are automatically tracked — Bittensor subnet 19 inference
const completion = await trackedTargon.chat.completions.create(
  {
    model: 'targon/llama-3-3-70b', // or 'targon/llama-3-1-8b', 'targon/deepseek-r1', etc.
    messages: [{ role: 'user', content: 'Hello from Targon!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Targon
);`;

const sdkRhymesExample = `import OpenAI from 'openai';
import LLMeter, { wrapRhymes } from 'llmeter';

// Rhymes AI (rhymes.ai) — Italian-founded AI startup (2023), former Meta AI Research
// Aria: 25.3B MoE, 128K context, native video+image+text understanding
// First native video-understanding LLM provider on LLMeter
// Aria Mini at $0.10/1M input — 96% cheaper than GPT-4o
const rhymes = new OpenAI({
  apiKey: process.env.RHYMES_API_KEY,
  baseURL: 'https://api.rhymes.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedRhymes = wrapRhymes(rhymes, llmeter);

// All calls are automatically tracked — native multimodal understanding
const completion = await trackedRhymes.chat.completions.create(
  {
    model: 'aria', // or 'aria-text', 'aria-mini' (budget), 'aria-v1', 'aria-v1-text'
    messages: [{ role: 'user', content: 'Describe this video.' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Rhymes AI
);`;

const sdkMancerExample = `import OpenAI from 'openai';
import LLMeter, { wrapMancer } from 'llmeter';

// Mancer (mancer.tech) — privacy-first uncensored LLM inference hosted in Europe
// No conversation logging, no data retention, no content filtering
// WizardLM 2 8x22B MoE at $0.90/1M symmetric — Llama 3 8B at $0.08/1M (95% cheaper than GPT-4o)
const mancer = new OpenAI({
  apiKey: process.env.MANCER_API_KEY,
  baseURL: 'https://neuro.mancer.tech/oai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedMancer = wrapMancer(mancer, llmeter);

// All calls are automatically tracked — zero-log uncensored inference
const completion = await trackedMancer.chat.completions.create(
  {
    model: 'mancer/mn-midnight-rose-103b', // or 'mancer/wizardlm-2-8x22b', 'mancer/llama-3-8b-instruct', etc.
    messages: [{ role: 'user', content: 'Hello from Mancer!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Mancer
);`;

const sdkPrimeIntellectExample = `import OpenAI from 'openai';
import LLMeter, { wrapPrimeIntellect } from 'llmeter';

// Prime Intellect (primeintellect.ai) — San Francisco AI startup (2023)
// PRIME protocol: trained INTELLECT-1 across 112 GPU contributors in 40+ countries
// 7th decentralized AI compute network on LLMeter
// Llama 3.1 8B at $0.05/1M — 98% cheaper than GPT-4o
const prime = new OpenAI({
  apiKey: process.env.PRIME_INTELLECT_API_KEY,
  baseURL: 'https://api.primeintellect.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedPrime = wrapPrimeIntellect(prime, llmeter);

// All calls are automatically tracked — decentralized compute inference
const completion = await trackedPrime.chat.completions.create(
  {
    model: 'INTELLECT-1', // or 'meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from Prime Intellect!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Prime Intellect
);`;

const sdkMiMoExample = `import OpenAI from 'openai';
import LLMeter, { wrapMiMo } from 'llmeter';

// Xiaomi MiMo — world's 3rd largest smartphone maker (HKEX: 1810, $46B+ revenue)
// MiMo-V2.5-Pro: 1M context, deep thinking, tool calling, web search
// MiMo-V2-Flash: $0.01/1M input — 99.6% cheaper than GPT-4o input
const mimo = new OpenAI({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: 'https://api.xiaomimimo.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedMiMo = wrapMiMo(mimo, llmeter);

// All calls are automatically tracked — Xiaomi AI inference
const completion = await trackedMiMo.chat.completions.create(
  {
    model: 'mimo-v2.5-pro', // or 'mimo-v2.5', 'mimo-v2-flash', 'mimo-v2-omni', etc.
    messages: [{ role: 'user', content: 'Hello from MiMo!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Xiaomi MiMo
);`;

const sdkLaminiExample = `import OpenAI from 'openai';
import LLMeter, { wrapLamini } from 'llmeter';

// Lamini AI — AMD-powered LLM fine-tuning and inference platform
// Founded 2022 by Sharon Zhou (Stanford AI PhD, formerly NVIDIA) and Greg Diamos (co-created Volta)
// AMD Instinct MI300X GPUs — only AMD-powered inference provider on LLMeter
// Mistral 7B at $0.10/1M symmetric — 96% cheaper than GPT-4o input
const lamini = new OpenAI({
  apiKey: process.env.LAMINI_API_KEY,
  baseURL: 'https://api.lamini.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedLamini = wrapLamini(lamini, llmeter);

// All calls are automatically tracked — AMD-powered fine-tuning + inference
const completion = await trackedLamini.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'mistralai/Mistral-7B-Instruct-v0.3', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from Lamini!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Lamini
);`;

const sdkIntelExample = `import OpenAI from 'openai';
import LLMeter, { wrapIntel } from 'llmeter';

// Intel Developer Cloud — Gaudi AI accelerators (Gaudi 3 launched April 2024)
// Intel Corporation (NASDAQ: INTC), Santa Clara CA, founded 1968 by Gordon Moore and Robert Noyce
// Gaudi 3: 4× AI compute vs Gaudi 2 — competes with NVIDIA A100/H100 and AMD Instinct MI300X
// 3rd of the Big 3 AI chip companies tracked in LLMeter (NVIDIA → AMD/Lamini → Intel)
// Mistral 7B at $0.05/1M — 98% cheaper than GPT-4o input
const intel = new OpenAI({
  apiKey: process.env.INTEL_API_KEY,
  baseURL: 'https://api.us.gaudi.cloud.intel.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedIntel = wrapIntel(intel, llmeter);

// All calls are automatically tracked — Intel Gaudi AI inference
const completion = await trackedIntel.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'mistralai/Mistral-7B-Instruct-v0.3', 'microsoft/phi-4', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from Intel Gaudi!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Intel
);`;

const sdkEXAONEExample = `import OpenAI from 'openai';
import LLMeter, { wrapEXAONE } from 'llmeter';

// LG AI Research (EXAONE) — LG Corporation ($66B revenue, South Korea's 4th largest conglomerate)
// EXAONE 3.5: #1 on Korean benchmarks, competitive with Llama 3.3 70B at only 7.8B params
// EXAONE Deep: reasoning model competitive with o1-level on MATH-500
// 3rd Korean AI provider on LLMeter. Apache 2.0 open source.
// EXAONE 3.5 2.4B at $0.04/1M — 98% cheaper than GPT-4o input
const exaone = new OpenAI({
  apiKey: process.env.EXAONE_API_KEY,
  baseURL: 'https://api.exaone.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedExaone = wrapEXAONE(exaone, llmeter);

// All calls are automatically tracked — LG Corporation AI inference
const completion = await trackedExaone.chat.completions.create(
  {
    model: 'exaone-3.5-7.8b-instruct', // or 'exaone-deep-7.8b', 'exaone-3.5-2.4b-instruct', etc.
    messages: [{ role: 'user', content: 'Hello from EXAONE!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to EXAONE
);`;

const sdkNearAIExample = `import OpenAI from 'openai';
import LLMeter, { wrapNearAI } from 'llmeter';

// NEAR AI — NEAR Protocol's AI inference network (PoS sharding for scalable, low-cost compute)
// 5th blockchain AI network on LLMeter (Corcel/Bittensor + io.net/Solana + Akash/Cosmos + Heurist/ETH ZK + NEAR)
// Llama 3.1 8B at $0.04/1M — 98% cheaper than GPT-4o
const nearai = new OpenAI({
  apiKey: process.env.NEARAI_API_KEY,
  baseURL: 'https://api.near.ai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedNearAI = wrapNearAI(nearai, llmeter);

// All calls are automatically tracked — NEAR Protocol blockchain AI inference
const completion = await trackedNearAI.chat.completions.create(
  {
    model: 'nearai/llama-3-3-70b', // or 'nearai/llama-3-1-8b', 'nearai/deepseek-r1', etc.
    messages: [{ role: 'user', content: 'Hello from NEAR AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to NEAR AI
);`;

const sdkGLHFExample = `import OpenAI from 'openai';
import LLMeter, { wrapGLHF } from 'llmeter';

// GLHF Chat — community GPU inference for 50+ open-source models (glhf.chat)
// Llama 3.3 70B, DeepSeek R1, Qwen 2.5 72B, Mistral 7B, Gemma 3 and more
// Mistral 7B at $0.04/1M — 99% cheaper than GPT-4o input
const glhf = new OpenAI({
  apiKey: process.env.GLHF_API_KEY,
  baseURL: 'https://glhf.chat/api/openai/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedGLHF = wrapGLHF(glhf, llmeter);

// All calls are automatically tracked — community GPU inference
const completion = await trackedGLHF.chat.completions.create(
  {
    model: 'hf:meta-llama/Llama-3.3-70B-Instruct', // or 'hf:mistralai/Mistral-7B-Instruct-v0.3', 'hf:deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from GLHF!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to GLHF Chat
);`;

const sdkAnyscaleExample = `import OpenAI from 'openai';
import LLMeter, { wrapAnyscale } from 'llmeter';

// Anyscale Endpoints — creators of Ray (100M+ downloads), the distributed computing framework
// powering ML workloads at OpenAI, Uber, Amazon, and Netflix. A16Z-backed ($100M+ raised).
// Llama 3.3 70B at $0.35/1M — 86% cheaper than GPT-4o input
const anyscale = new OpenAI({
  apiKey: process.env.ANYSCALE_API_KEY,
  baseURL: 'https://api.endpoints.anyscale.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAnyscale = wrapAnyscale(anyscale, llmeter);

// All calls are automatically tracked — Ray-powered open-source inference
const completion = await trackedAnyscale.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'mistralai/Mistral-7B-Instruct-v0.1', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from Anyscale!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Anyscale
);`;

const sdkIonosExample = `import OpenAI from 'openai';
import LLMeter, { wrapIONOS } from 'llmeter';

// IONOS AI Model Hub — Germany's largest web host (8.5M+ customers, United Internet Group €6.4B)
// Frankfurt data centers: GDPR-native, zero US cloud dependency, 6/8 models symmetric pricing
// Mistral 7B at $0.04/1M = cheapest EU AI inference
const ionos = new OpenAI({
  apiKey: process.env.IONOS_API_KEY,
  baseURL: 'https://openai.inference.de-txl.ionos.com/v1',
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedIonos = wrapIONOS(ionos, llmeter);

// All calls are automatically tracked — EU sovereign inference
const completion = await trackedIonos.chat.completions.create(
  {
    model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', // or 'mistralai/Mistral-7B-Instruct-v0.3', 'deepseek-ai/DeepSeek-R1', etc.
    messages: [{ role: 'user', content: 'Hello from IONOS AI!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to IONOS
);`;

const sdkFalExample = `import OpenAI from 'openai';
import LLMeter, { wrapFal } from 'llmeter';

// fal.ai is OpenAI-compatible — a16z-backed serverless GPU inference ($54M Series B, founded 2022)
// Known for ultra-fast image generation (Flux, SDXL) and open-source LLM inference
// Use "Key" not "Bearer" for fal.ai authentication
const fal = new OpenAI({
  apiKey: process.env.FAL_API_KEY,
  baseURL: 'https://fal.run/v1',
  defaultHeaders: { 'Authorization': \`Key \${process.env.FAL_API_KEY}\` },
});
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedFal = wrapFal(fal, llmeter);

// All calls are automatically tracked — serverless GPU inference
const completion = await trackedFal.chat.completions.create(
  {
    model: 'fal-ai/meta-llama-3.3-70b-instruct', // or 'fal-ai/deepseek-r1', 'fal-ai/qwen2.5-72b-instruct', etc.
    messages: [{ role: 'user', content: 'Hello from fal.ai!' }],
  },
  { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to fal.ai
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
                <TabsTrigger value="ionet">io.net</TabsTrigger>
                <TabsTrigger value="oci">Oracle OCI</TabsTrigger>
                <TabsTrigger value="gigachat">GigaChat</TabsTrigger>
                <TabsTrigger value="github">GitHub Models</TabsTrigger>
                <TabsTrigger value="parasail">Parasail</TabsTrigger>
                <TabsTrigger value="openpipe">OpenPipe</TabsTrigger>
                <TabsTrigger value="corcel">Corcel</TabsTrigger>
                <TabsTrigger value="inception">Inception AI</TabsTrigger>
                <TabsTrigger value="liquid">Liquid AI</TabsTrigger>
                <TabsTrigger value="zyphra">Zyphra</TabsTrigger>
                <TabsTrigger value="akash">Akash</TabsTrigger>
                <TabsTrigger value="arcee">Arcee AI</TabsTrigger>
                <TabsTrigger value="centml">CentML</TabsTrigger>
                <TabsTrigger value="venice">Venice AI</TabsTrigger>
                <TabsTrigger value="inferless">Inferless</TabsTrigger>
                <TabsTrigger value="codestral">Codestral</TabsTrigger>
                <TabsTrigger value="fluidstack">Fluidstack</TabsTrigger>
                <TabsTrigger value="monsterapi">Monster API</TabsTrigger>
                <TabsTrigger value="coreweave">CoreWeave</TabsTrigger>
                <TabsTrigger value="prem">Prem AI</TabsTrigger>
                <TabsTrigger value="clarifai">Clarifai</TabsTrigger>
                <TabsTrigger value="sensenova">SenseNova</TabsTrigger>
                <TabsTrigger value="ai360">360 AI</TabsTrigger>
                <TabsTrigger value="naver">NAVER</TabsTrigger>
                <TabsTrigger value="fal">fal.ai</TabsTrigger>
                <TabsTrigger value="ionos">IONOS AI</TabsTrigger>
                <TabsTrigger value="anyscale">Anyscale</TabsTrigger>
                <TabsTrigger value="nousresearch">Nous Research</TabsTrigger>
                <TabsTrigger value="meta">Meta Llama API</TabsTrigger>
                <TabsTrigger value="glhf">GLHF Chat</TabsTrigger>
                <TabsTrigger value="sakura">Sakura Internet</TabsTrigger>
                <TabsTrigger value="textsynth">TextSynth</TabsTrigger>
                <TabsTrigger value="heurist">Heurist AI</TabsTrigger>
                <TabsTrigger value="nearai">NEAR AI</TabsTrigger>
                <TabsTrigger value="netmind">NetMind AI</TabsTrigger>
                <TabsTrigger value="hyperstack">Hyperstack</TabsTrigger>
                <TabsTrigger value="gmi">GMI Cloud</TabsTrigger>
                <TabsTrigger value="internlm">InternLM</TabsTrigger>
                <TabsTrigger value="targon">Targon</TabsTrigger>
                <TabsTrigger value="mancer">Mancer</TabsTrigger>
                <TabsTrigger value="rhymes">Rhymes AI</TabsTrigger>
                <TabsTrigger value="primeintellect">Prime Intellect</TabsTrigger>
                <TabsTrigger value="exaone">EXAONE</TabsTrigger>
                <TabsTrigger value="mimo">Xiaomi MiMo</TabsTrigger>
                <TabsTrigger value="lamini">Lamini AI</TabsTrigger>
                <TabsTrigger value="intel">Intel Developer Cloud</TabsTrigger>
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
              <TabsContent value="ionet" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  io.net is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the io.net base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Community-owned decentralized GPU cloud aggregating idle compute from 100+ countries, validated via Solana blockchain. 8 models including Llama 3.3 70B ($0.30/$0.30), DeepSeek R1 ($0.55/$2.19), Qwen 2.5 72B ($0.35/$0.35), Mistral 7B ($0.05/$0.05 — 98% cheaper than GPT-4o input).
                </p>
                <CodeBlock language="typescript" code={sdkIoNetExample} />
              </TabsContent>
              <TabsContent value="oci" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  OCI Generative AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the OCI base URL. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Oracle Cloud — the 4th enterprise hyperscaler (95% of Fortune 500 are Oracle customers). SOC2/HIPAA/FedRAMP/ISO 27001 certified. 8 models: Cohere Command R+ ($2.50/$10.00 per 1M — enterprise RAG flagship), Cohere Command R ($0.30/$0.60), Llama 3.3 70B ($0.72/$0.90), Llama 3.1 405B ($3.00/$3.70), Llama 3.1 70B ($0.60/$0.80), Llama 3.1 8B ($0.10/$0.12), Mistral Large 2 ($3.20/$3.20 — symmetric), Mistral 7B ($0.12/$0.12 — symmetric budget).
                </p>
                <CodeBlock language="typescript" code={sdkOCIExample} />
              </TabsContent>
              <TabsContent value="github" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  GitHub Models is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the GitHub Models base URL and your GitHub Personal Access Token. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Microsoft &amp; GitHub AI inference for 100M+ developers — GPT-4o, Llama 3.1, Phi-4, Mistral Nemo, and 30+ models. Free tier: 150 req/day for GPT-4o, 2000/day for Llama models. Production pricing via Azure AI Foundry. 8 models: GPT-4o ($2.50/$10.00 per 1M), GPT-4o mini ($0.15/$0.60), Meta-Llama-3.1-8B ($0.10/$0.10 — symmetric, cheapest), Meta-Llama-3.1-70B ($0.80/$0.80 — symmetric), Meta-Llama-3.1-405B ($5.32/$16.00), Phi-3.5-mini ($0.12/$0.47), Phi-4 ($0.12/$0.47), Mistral Nemo ($0.13/$0.13 — symmetric).
                </p>
                <CodeBlock language="typescript" code={sdkGitHubModelsExample} />
              </TabsContent>
              <TabsContent value="parasail" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Parasail is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Parasail base URL and your Parasail API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Global distributed AI inference network — up to 30× cheaper than legacy cloud, 500B+ tokens/day, 15+ countries, no quotas or lock-ins. 8 models: Gemma 4 27B ($0.13/$0.40 per 1M — cheapest), DeepSeek V4 Flash ($0.14/$0.28), Qwen3 30B A3B ($0.15/$0.60), Llama 4 Maverick 17B ($0.20/$0.65), Llama 3.3 70B ($0.22/$0.40), DeepSeek R1 ($0.55/$2.19 — reasoning), Kimi K2 ($0.75/$3.50 — agentic), GLM-4 32B ($1.40/$4.40 — enterprise).
                </p>
                <CodeBlock language="typescript" code={sdkParasailExample} />
              </TabsContent>
              <TabsContent value="openpipe" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  OpenPipe is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the OpenPipe base URL and your OpenPipe API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Fine-tuned model serving platform — train Llama/Mistral/Phi on your data, serve via OpenAI-compatible API. 100% symmetric pricing across all 8 models. 8 models: Llama-3.2-1B fine-tune ($0.12/$0.12 per 1M — cheapest), Llama-3.2-3B ($0.18/$0.18), Phi-3.5-mini ($0.24/$0.24), Mistral-7B ($0.36/$0.36), Llama-3.1-8B ($0.36/$0.36), Llama-3.3-70B ($0.72/$0.72 — flagship), Llama-3.1-70B ($0.72/$0.72), Llama-3.1-405B ($3.60/$3.60 — enterprise).
                </p>
                <CodeBlock language="typescript" code={sdkOpenPipeExample} />
              </TabsContent>
              <TabsContent value="corcel" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Corcel is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Corcel base URL and your Corcel API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Bittensor subnet 18 decentralized AI inference — 2nd blockchain AI network on LLMeter (after io.net/Solana). 8 models: Mistral 7B ($0.02/$0.02 per 1M — cheapest tracked on LLMeter), Llama 3.1 8B ($0.03/$0.03 — ~99% cheaper than GPT-4o), Mixtral 8x7B MoE ($0.10/$0.10), Llama 3.1 70B ($0.12/$0.12), Qwen 2.5 72B ($0.14/$0.14), Llama 3.3 70B ($0.15/$0.15 — flagship), DeepSeek V3 ($0.20/$0.80), DeepSeek R1 ($0.40/$1.60 — reasoning).
                </p>
                <CodeBlock language="typescript" code={sdkCorcelExample} />
              </TabsContent>
              <TabsContent value="inception" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Inception AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Inception AI base URL and your Inception API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. First diffusion-based LLM provider on LLMeter — Mercury models use non-transformer architecture for ultra-fast inference. 8 models: Mercury Mini ($0.04/$0.04 per 1M — cheapest, ultra-fast), Mercury Coder Small ($0.07/$0.07 — coding budget), Mercury 7B ($0.09/$0.09 — general budget), Mercury Coder Small 20B ($0.12/$0.12 — coding standard), Mercury 20B ($0.20/$0.80 — general standard), Mercury Coder Medium ($0.25/$0.25 — coding flagship), Mercury Coder Large ($0.50/$0.50 — premium coding), Mercury Large ($0.60/$2.40 — premium general). 100% symmetric pricing on all coding models.
                </p>
                <CodeBlock language="typescript" code={sdkInceptionExample} />
              </TabsContent>
              <TabsContent value="liquid" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Liquid AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Liquid AI base URL and your Liquid API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Liquid Foundation Models (LFMs) — MIT spin-off using liquid neural networks (non-transformer architecture). LFM-40B rivals models 6× larger. 8 models: LFM-3B ($0.10/$0.10 per 1M — budget, 96% cheaper input than GPT-4o, symmetric), LFM-7B ($0.25/$0.25 — standard symmetric), LFM-13B ($0.35/$0.35 — midrange symmetric), LFM-40B MoE ($0.40/$0.40 — MoE flagship symmetric), LFM-40B ($0.60/$0.60 — flagship symmetric), LFM-3B Instruct ($0.10/$0.10), LFM-7B Instruct ($0.25/$0.25), LFM-40B Instruct ($0.60/$0.60). 100% symmetric pricing — all models input = output.
                </p>
                <CodeBlock language="typescript" code={sdkLiquidExample} />
              </TabsContent>
              <TabsContent value="zyphra" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Zyphra is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Zyphra base URL and your Zyphra API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Zyphra builds Zamba models using Mamba SSM (State Space Model) hybrid architecture — the third non-transformer architecture on LLMeter after Inception AI (diffusion) and Liquid AI (LNN). 6× faster inference than same-sized Transformers, 3× lower memory footprint. 8 models: Zamba2-1.2B ($0.04/$0.04 per 1M — ultra-budget symmetric), Zamba2-2.7B ($0.07/$0.07 — budget symmetric), Zamba2 Mini ($0.07/$0.07 — compact symmetric), Zamba-7B v0.1 ($0.20/$0.20 — gen 1 symmetric), Zamba2-7B ($0.18/$0.18 — flagship symmetric), Zamba2-7B Instruct ($0.18/$0.18 — instruction-tuned symmetric), Zamba2-7B Chat ($0.18/$0.18 — chat-optimized symmetric), Zamba2-7B Long ($0.22/$0.22 — extended context symmetric). 100% symmetric pricing — all models input = output.
                </p>
                <CodeBlock language="typescript" code={sdkZyphraExample} />
              </TabsContent>
              <TabsContent value="akash" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Akash Network is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Akash Chat API base URL and your Akash API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Akash Network is a decentralized GPU marketplace on the Cosmos blockchain — peer-to-peer compute from data centers and independent providers worldwide. Third blockchain network on LLMeter (Cosmos) after io.net (Solana) and Corcel (Bittensor). Marketplace dynamics drive prices down: Llama 3.1 8B at $0.04/1M, Llama 3.2 3B at $0.02/1M — ultra-cheap. 8 models: Llama 3.3 70B ($0.25/$0.25 per 1M — symmetric flagship), Llama 3.1 8B ($0.04/$0.04 — ultra-budget symmetric), Llama 3.1 405B FP8 ($1.80/$1.80 — enterprise symmetric), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek V3 ($0.28/$1.10), Qwen 2.5 72B ($0.35/$0.35 — symmetric), Mistral 7B ($0.06/$0.06 — budget symmetric), Llama 3.2 3B ($0.02/$0.02 — cheapest). 6 of 8 models symmetric pricing.
                </p>
                <CodeBlock language="typescript" code={sdkAkashExample} />
              </TabsContent>
              <TabsContent value="arcee" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Arcee AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Arcee AI base URL and your Arcee API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Arcee AI is a San Francisco AI startup (2023) pioneering model merging with MergeKit (6,000+ GitHub stars). SuperMerging™ combines the best of multiple fine-tuned models — Arcee models outperform models 10x their size. 8 models: arcee-maestro ($1.50/$4.50 per 1M — flagship reasoning SuperMerged MoE), arcee-nova ($0.80/$2.40 — balanced general), arcee-agent ($1.00/$3.00 — agentic function calling), arcee-lite ($0.20/$0.60 — efficient 7B class), arcee-blitz ($0.14/$0.42 — fast budget), arcee-scribe ($0.25/$0.75 — writing specialized), arcee-spark ($0.09/$0.09 — ultra-budget symmetric), arcee-cli ($0.07/$0.07 — coding budget symmetric).
                </p>
                <CodeBlock language="typescript" code={sdkArceeExample} />
              </TabsContent>
              <TabsContent value="centml" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  CentML is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the CentML base URL and your CentML API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. CentML is a Canadian GPU efficiency pioneer — proprietary kernel optimization delivers 2-4x cost efficiency vs standard NVIDIA cloud. 8 models: meta-llama/Meta-Llama-3.3-70B-Instruct ($0.30/$0.30 per 1M — symmetric flagship), meta-llama/Meta-Llama-3.1-70B-Instruct ($0.25/$0.25 — symmetric), meta-llama/Meta-Llama-3.1-8B-Instruct ($0.05/$0.05 — symmetric budget), meta-llama/Meta-Llama-3.1-405B-Instruct ($1.40/$1.40 — symmetric enterprise), deepseek-ai/DeepSeek-R1 ($0.50/$2.00 — reasoning), deepseek-ai/DeepSeek-V3 ($0.25/$1.00), mistralai/Mistral-7B-Instruct-v0.3 ($0.06/$0.06 — symmetric cheapest), Qwen/Qwen2.5-72B-Instruct ($0.30/$0.30 — symmetric).
                </p>
                <CodeBlock language="typescript" code={sdkCentMLExample} />
              </TabsContent>
              <TabsContent value="inferless" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Inferless is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Inferless base URL and your Inferless API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. YC W23-backed serverless GPU inference — deploy any HuggingFace model in under 60 seconds. Mistral 7B at $0.10/1M tokens (symmetric) — 96% cheaper than GPT-4o input. 8 models: meta-llama/Llama-3.3-70B-Instruct ($0.45/$0.45 per 1M — symmetric flagship), meta-llama/Llama-3.1-8B-Instruct ($0.08/$0.08 — budget), meta-llama/Llama-3.1-70B-Instruct ($0.40/$0.40 — symmetric), deepseek-ai/DeepSeek-R1 ($0.55/$2.19 — reasoning), mistralai/Mistral-7B-Instruct-v0.3 ($0.10/$0.10 — symmetric cheapest), Qwen/Qwen2.5-72B-Instruct ($0.35/$0.35 — symmetric), microsoft/Phi-3-medium-128k-instruct ($0.20/$0.20 — symmetric), mistralai/Mixtral-8x7B-Instruct-v0.1 ($0.25/$0.25 — symmetric).
                </p>
                <CodeBlock language="typescript" code={sdkInferlessExample} />
              </TabsContent>
              <TabsContent value="venice" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Venice AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Venice AI base URL and your Venice AI API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Venice AI is privacy-first inference — no conversation logging, no model training on your data. Founded by Erik Voorhees (ShapeShift). 8 models: llama-3.3-70b ($0.28/$0.28 per 1M — symmetric flagship), llama-3.1-70b ($0.25/$0.25 — symmetric), llama-3.1-8b ($0.06/$0.06 — budget), deepseek-r1 ($0.55/$2.19 — reasoning), deepseek-v3 ($0.28/$1.10), qwen-2.5-72b ($0.28/$0.28 — symmetric), mistral-7b-instruct ($0.06/$0.06 — budget), llama-3.2-3b ($0.02/$0.02 — ultra-budget).
                </p>
                <CodeBlock language="typescript" code={sdkVeniceExample} />
              </TabsContent>
              <TabsContent value="codestral" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Mistral AI Codestral is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Codestral base URL and your Mistral API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Codestral is Mistral AI&apos;s dedicated code generation endpoint — track code AI spend separately from chat AI spend. Includes Devstral Small (agentic coding, #1 on SWE-bench open-source), Codestral 22B (256K context, 80+ languages), and Codestral Mamba 7B ($0.25/1M symmetric — 90% cheaper than GitHub Copilot API). 6 models: devstral-small-2505 ($0.40/$0.80 per 1M — agentic flagship), codestral-2501 ($0.30/$0.90 — Jan 2025), codestral-2405 ($0.30/$0.90 — original), open-codestral-mamba ($0.25/$0.25 — Apache 2.0), codestral-mamba-latest ($0.25/$0.25 — Mamba SSM), codestral-mamba-2407 ($0.25/$0.25 — Jul 2024 pinned).
                </p>
                <CodeBlock language="typescript" code={sdkCodestralExample} />
              </TabsContent>
              <TabsContent value="monsterapi" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Monster API is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Monster API base URL and your Monster API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Monster API is an Indian GPU marketplace connecting idle GPU capacity worldwide — competitive per-token pricing across Llama, Mistral, Gemma, Phi, and Qwen models. 8 models: Meta-Llama-3.3-70B-Instruct ($0.35/$0.35 per 1M — symmetric), Meta-Llama-3.1-70B-Instruct ($0.30/$0.30), Meta-Llama-3.1-8B-Instruct ($0.06/$0.06 — budget symmetric), DeepSeek-R1 ($0.55/$2.19 — asymmetric), Mistral-7B-Instruct-v0.3 ($0.04/$0.04 — cheapest, 98% less than GPT-4o), Gemma-2-9B-it ($0.07/$0.07 — symmetric), Phi-3.5-mini-instruct ($0.05/$0.05), Qwen2.5-72B-Instruct ($0.35/$0.35 — symmetric). 6 of 8 models use symmetric (input = output) pricing.
                </p>
                <CodeBlock language="typescript" code={sdkMonsterAPIExample} />
              </TabsContent>
              <TabsContent value="fluidstack" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Fluidstack is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Fluidstack base URL and your Fluidstack API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Fluidstack is a GPU aggregation cloud (H100/H200/A100) from 15+ global data centers — they powered the training runs for Mistral AI, Stability AI, and xAI, and now offer serverless LLM inference. 8 models: Llama-3.3-70B-Instruct ($0.59/$0.79 per 1M — flagship), Meta-Llama-3.1-70B-Instruct ($0.55/$0.75 — stable 70B), Meta-Llama-3.1-8B-Instruct ($0.10/$0.12 — budget), Meta-Llama-3.1-405B-Instruct ($2.50/$3.00 — enterprise), DeepSeek-R1 ($0.55/$2.19 — reasoning), DeepSeek-V3 ($0.28/$1.10 — fast frontier), Mistral-7B-Instruct-v0.3 ($0.09/$0.09 — cheapest symmetric), Qwen2.5-72B-Instruct ($0.40/$0.40 — symmetric midrange). fluidstack.io
                </p>
                <CodeBlock language="typescript" code={sdkFluidStackExample} />
              </TabsContent>
              <TabsContent value="coreweave" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  CoreWeave is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the CoreWeave inference base URL and your CoreWeave API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. CoreWeave is the largest NVIDIA GPU cloud company — IPO&apos;d March 2025 at $35B+ valuation, runs production inference for OpenAI, Meta, and Microsoft on H100/A100 clusters with enterprise SLAs. 8 models: Llama-3.3-70B-Instruct ($0.48/$0.48 per 1M — symmetric flagship), Llama-3.1-70B-Instruct ($0.45/$0.45 — symmetric standard), Llama-3.1-8B-Instruct ($0.08/$0.08 — budget symmetric), Llama-3.1-405B-Instruct ($2.50/$2.50 — enterprise symmetric), DeepSeek-R1 ($0.55/$2.19 — reasoning), Mistral-7B-Instruct-v0.3 ($0.09/$0.09 — budget symmetric), Mixtral-8x7B-Instruct-v0.1 ($0.30/$0.30 — symmetric MoE), Qwen2.5-72B-Instruct ($0.40/$0.40 — symmetric). 6 of 8 models use symmetric (input = output) pricing.
                </p>
                <CodeBlock language="typescript" code={sdkCoreWeaveExample} />
              </TabsContent>
              <TabsContent value="prem" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Prem AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Prem AI base URL and your Prem AI API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Prem AI is a European privacy-first inference platform — Paris-based, GDPR-native, no data retention, sovereign AI for enterprises with strict compliance requirements. 8 models: Llama-3.3-70B-Instruct ($0.48/$0.72 per 1M — flagship), Llama-3.1-70B-Instruct ($0.40/$0.60 — standard), Llama-3.1-8B-Instruct ($0.08/$0.12 — budget), Llama-3.1-405B-Instruct ($2.50/$3.50 — premium), DeepSeek-R1 ($0.55/$2.19 — reasoning), Mistral-7B-Instruct-v0.3 ($0.07/$0.09 — cheapest on Prem AI), Qwen2.5-72B-Instruct ($0.40/$0.55 — multilingual), Llama-3.2-3B-Instruct ($0.05/$0.05 — ultra-budget symmetric).
                </p>
                <CodeBlock language="typescript" code={sdkPremExample} />
              </TabsContent>
              <TabsContent value="gigachat" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  GigaChat is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the GigaChat base URL and your JWT access token. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Russia&apos;s sovereign AI by Sberbank — 100M+ users, 30+ languages, 100% symmetric pricing. 8 models: GigaChat Lite ($0.10/$0.10 per 1M — budget symmetric), GigaChat Lite Long ($0.10/$0.10), GigaChat ($0.15/$0.15 — standard), GigaChat Pro ($0.50/$0.50 — professional), GigaChat Pro Long ($0.50/$0.50), GigaChat Max ($1.50/$1.50 — flagship), GigaChat Max Long ($1.50/$1.50), GigaChat 2 Max ($2.00/$2.00 — gen 2 flagship).
                </p>
                <CodeBlock language="typescript" code={sdkGigaChatExample} />
              </TabsContent>
              <TabsContent value="clarifai" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Clarifai is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the Clarifai base URL and your Personal Access Token (PAT). Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Clarifai is an enterprise AI platform founded in 2013 by Matthew Zeiler (ImageNet 2013 winner) — processes 2.5 billion AI predictions/month for 1,000+ enterprise customers with SOC2, HIPAA, and FedRAMP-ready compliance. 8 models: Llama-3.3-70B-Instruct ($0.45/$0.67 per 1M — flagship), Llama-3.1-8B-Instruct ($0.10/$0.15 — budget), Llama-3.1-405B-Instruct ($2.80/$4.00 — enterprise), Mistral-7B-Instruct ($0.07/$0.10 — cheapest on Clarifai), DeepSeek-R1 ($0.55/$2.19 — reasoning), DeepSeek-V3 ($0.28/$1.10), Qwen2.5-72B-Instruct ($0.35/$0.50 — multilingual), Mixtral-8x7B-Instruct ($0.24/$0.24 — symmetric MoE).
                </p>
                <CodeBlock language="typescript" code={sdkClarifaiExample} />
              </TabsContent>
              <TabsContent value="sensenova" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  SenseNova is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the SenseNova base URL and your API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. SenseTime SenseNova is China&apos;s largest AI company by valuation at HKEX IPO (#0020) — won ImageNet 2015 Object Detection challenge (natural pairing with Clarifai/ImageNet 2013), serving 100M+ users. 8 models: SenseChat-5 ($2.00/$6.00 per 1M — flagship), SenseChat-5 Turbo ($0.80/$2.40 — fast flagship), SenseChat-5 Lite ($0.30/$0.90 — budget), SenseChat-Lite V4 ($0.10/$0.30 — ultra-budget, 96% cheaper than GPT-4o input), SenseReasoner-Pro ($0.80/$2.40 — reasoning), SenseCode-V2 ($0.20/$0.60 — code generation), SenseChat-5 32K ($1.00/$3.00 — long context), SenseChat-5 Vision ($1.50/$4.50 — multimodal).
                </p>
                <CodeBlock language="typescript" code={sdkSenseNovaExample} />
              </TabsContent>
              <TabsContent value="naver" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  NAVER HyperCLOVA X uses a dual-header authentication scheme — set both{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">X-NCP-APIGW-API-KEY-ID</code>{' '}
                  and{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">X-NCP-APIGW-API-KEY</code>{' '}
                  from the NAVER Cloud Platform console. Use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the CLOVA Studio OpenAI-compatible base URL. NAVER Corporation (KRX: 035420) is Korea&apos;s largest internet company — HyperCLOVA (2021) was the world&apos;s first non-English large language model at 82B parameters, and HyperCLOVA X is Korea&apos;s flagship bilingual Korean-English LLM. 6 models: HyperCLOVA X ($2.00/$6.00 per 1M — flagship 82B+ bilingual), HyperCLOVA X Turbo ($0.80/$2.40 — speed-optimized), HyperCLOVA X Mini ($0.40/$1.20 — balanced), HyperCLOVA X DASH ($0.12/$0.36 — fast efficient), HyperCLOVA X DASH 2 ($0.10/$0.30 — updated fast), HyperCLOVA X DASH 3 ($0.08/$0.24 — latest, 97% cheaper than GPT-4o input). Credentials format: apiKeyId::serviceKey.
                </p>
                <CodeBlock language="typescript" code={sdkNaverExample} />
              </TabsContent>
              <TabsContent value="ai360" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  360 AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with the 360 AI base URL and your API key. Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. 360 Security Technology (三六零) is China&apos;s largest cybersecurity company — listed on Shenzhen Stock Exchange (601360.SZ), founded 2005 by Zhou Hongyi, with 4.5 billion endpoint protection clients worldwide. 8 models: 360GPT2-Pro ($0.50/$1.50 per 1M — flagship), 360GPT2-Pro 128K ($1.00/$3.00 — long context), 360GPT-Turbo ($0.15/$0.45 — standard), 360GPT-Turbo Responsibility ($0.40/$1.20 — enterprise), 360GPT-Pro ($0.30/$0.90 — standard), 360GPT-S2-V9 ($0.12/$0.36 — budget), 360GPT-Lite ($0.08/$0.24 — 97% cheaper than GPT-4o input), 360GPT-130B ($1.50/$4.50 — premium large model).
                </p>
                <CodeBlock language="typescript" code={sdkAI360Example} />
              </TabsContent>
              <TabsContent value="fal" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  fal.ai is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://fal.run/v1&apos; and set{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">defaultHeaders: {'{'} &apos;Authorization&apos;: `Key {'${'}apiKey{'}'}`  {'}'}</code>.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. fal.ai is a16z-backed serverless GPU inference (raised $54M Series B, founded 2022) — known for ultra-fast image generation (Flux, SDXL) and open-source LLM inference. 8 models: Meta Llama 3.3 70B Instruct ($0.90/$0.90 per 1M — flagship symmetric), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek R1 Distill Llama 70B ($0.45/$0.45 — distilled reasoning), Qwen 2.5 72B Instruct ($0.40/$0.40), Google Gemma 2 27B IT ($0.27/$0.27), Google Gemma 2 9B IT ($0.08/$0.08), Microsoft Phi-4 ($0.20/$0.20), Meta Llama 3.1 8B Instruct ($0.05/$0.05 — 99% cheaper than GPT-4o). Get your key at fal.ai/dashboard/keys.
                </p>
                <CodeBlock language="typescript" code={sdkFalExample} />
              </TabsContent>
              <TabsContent value="ionos" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  IONOS AI Model Hub is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://openai.inference.de-txl.ionos.com/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. IONOS SE is Germany&apos;s largest web hosting provider (8.5M+ customers, owned by United Internet AG with €6.4B revenue, founded 1988). Frankfurt data centers: GDPR-native EU inference with zero US cloud dependency. 8 models: Meta Llama 3.3 70B Instruct ($0.25/$0.25 — flagship symmetric), Llama 3.1 70B Instruct ($0.22/$0.22 — symmetric), Llama 3.1 8B Instruct ($0.05/$0.05 — budget symmetric), Llama 3.1 405B Instruct ($1.50/$1.50 — enterprise symmetric), Mistral 7B Instruct ($0.04/$0.04 — cheapest EU AI), Mixtral 8x7B Instruct ($0.12/$0.12 — symmetric MoE), DeepSeek R1 ($0.55/$2.19 — reasoning), Microsoft Phi-4 ($0.15/$0.45 — compact). 6 of 8 symmetric pricing. Get your key at cloud.ionos.com/ai-model-hub.
                </p>
                <CodeBlock language="typescript" code={sdkIonosExample} />
              </TabsContent>
              <TabsContent value="anyscale" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Anyscale Endpoints is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.endpoints.anyscale.com/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Anyscale is the creator of Ray (100M+ downloads), the distributed computing framework that powers ML workloads at OpenAI, Uber, Amazon, and Netflix. A16Z-backed ($100M+ raised). 8 models: Meta Llama 3.3 70B Instruct ($0.35/$0.55 — flagship), Llama 3.1 70B Instruct ($0.30/$0.50), Llama 3.1 8B Instruct ($0.08/$0.08 — budget symmetric), Llama 3.1 405B Instruct FP8 ($2.50/$3.00 — enterprise), Mistral 7B Instruct ($0.07/$0.07 — budget symmetric), Mixtral 8x7B Instruct ($0.24/$0.24 — symmetric MoE), DeepSeek R1 ($0.55/$2.19 — reasoning), Qwen 2.5 72B Instruct ($0.35/$0.35 — symmetric). 4 of 8 symmetric pricing. Llama 3.3 70B at $0.35/1M — 86% cheaper than GPT-4o input. Get your key at app.endpoints.anyscale.com.
                </p>
                <CodeBlock language="typescript" code={sdkAnyscaleExample} />
              </TabsContent>
              <TabsContent value="meta" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Meta Llama API is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.llama.com/compat/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call — Llama 4 Scout, Maverick, Llama 3.3 70B, Llama 3.1 405B, vision models — is tracked automatically.
                </p>
                <CodeBlock language="typescript" code={sdkMetaExample} />
              </TabsContent>
              <TabsContent value="nousresearch" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Nous Research (Nous Forge) is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.nousresearch.com/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Nous Research is the open-source fine-tuning lab that built the Hermes series — 100M+ downloads on Hugging Face. Founded by Teknium and team; pioneered function calling alignment and tool-use fine-tuning on Llama, Mistral, and Yi base models. 8 models: Hermes-3 Llama 3.1 405B ($2.80/$4.00 — flagship enterprise), Hermes-3 Llama 3.1 70B ($0.40/$0.60 — standard), Hermes-3 Llama 3.1 8B ($0.08/$0.12 — budget), Hermes-3 Llama 3.2 3B ($0.05/$0.05 — ultra-budget symmetric), Hermes-2-Pro Llama-3 8B ($0.06/$0.09 — compact), Hermes-2-Theta Llama-3 70B ($0.35/$0.55 — previous gen), Hermes-2-Pro Mistral-7B ($0.07/$0.07 — symmetric cheapest, 97% cheaper than GPT-4o), Nous Hermes 2 Yi-34B ($0.12/$0.18 — Yi-based midrange). Get your key at api.nousresearch.com.
                </p>
                <CodeBlock language="typescript" code={sdkNousResearchExample} />
              </TabsContent>
              <TabsContent value="glhf" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  GLHF Chat is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://glhf.chat/api/openai/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. GLHF Chat is a community GPU inference platform hosting 50+ open-source models: Llama, DeepSeek R1, Qwen 2.5, Mistral, Gemma and more. Models are prefixed with &apos;hf:&apos; (e.g. &apos;hf:meta-llama/Llama-3.3-70B-Instruct&apos;). 8 tracked models: Llama 3.3 70B ($0.27/$0.27 symmetric), Llama 3.1 70B ($0.18/$0.18), Llama 3.1 8B ($0.05/$0.05), Mistral 7B ($0.04/$0.04 — ultra-budget, 99% cheaper than GPT-4o), Mixtral 8x7B ($0.12/$0.12), DeepSeek R1 70B ($0.38/$1.52 — reasoning), Qwen 2.5 72B ($0.22/$0.22), Gemma 3 27B ($0.10/$0.10). Get your key at glhf.chat/users/settings/api.
                </p>
                <CodeBlock language="typescript" code={sdkGLHFExample} />
              </TabsContent>
              <TabsContent value="sakura" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Sakura Internet is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.sakura.io/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Sakura Internet (さくらインターネット) is Japan&apos;s largest independent cloud provider, listed on TSE Prime (3778) since 1996. Launched H100 GPU AI inference in 2025 to serve Japanese enterprises with data sovereignty. 8 models: Llama 3.3 70B ($0.45/$0.65), Llama 3.1 70B ($0.35/$0.55), Llama 3.1 8B ($0.10/$0.10 — budget symmetric), Mistral 7B ($0.07/$0.07 — budget symmetric), Mixtral 8x7B ($0.25/$0.25 — symmetric MoE), DeepSeek R1 ($0.55/$2.19 — reasoning), Qwen 2.5 72B ($0.40/$0.40 — symmetric), Gemma 2 9B ($0.09/$0.09 — budget symmetric). Japan&apos;s first sovereign cloud provider on LLMeter. Get your key at api.sakura.io.
                </p>
                <CodeBlock language="typescript" code={sdkSakuraExample} />
              </TabsContent>
              <TabsContent value="textsynth" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  TextSynth is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.textsynth.com/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. TextSynth is a privacy-first LLM inference service created by Fabrice Bellard — legendary programmer who invented FFmpeg (runs on every phone on Earth), QEMU, TCC (Tiny C Compiler), and JSLinux (first Linux running in a browser). One-man operation based in France; no training on user data; logs deleted regularly. 8 models: Mistral 7B ($0.04/$0.04 — cheapest, 98% cheaper than GPT-4o), Llama 3 8B ($0.06/$0.06), Gemma 2 9B ($0.07/$0.07), Code Llama 34B ($0.15/$0.15 — coding), Llama 3 70B ($0.25/$0.25 — flagship symmetric), Qwen 2 72B ($0.25/$0.25 — multilingual), Mixtral 8x7B ($0.35/$0.35 — symmetric MoE), DeepSeek R1 ($0.55/$2.19 — reasoning). Get your key at textsynth.com/settings.html.
                </p>
                <CodeBlock language="typescript" code={sdkTextSynthExample} />
              </TabsContent>
              <TabsContent value="heurist" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Heurist AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://llm-gateway.heurist.xyz/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Heurist AI is a decentralized LLM inference network built on Ethereum ZK (L2 zero-knowledge proofs). Idle GPU resources are rewarded via smart contracts — the 4th blockchain network on LLMeter after Corcel (Bittensor), io.net (Solana), and Akash (Cosmos). 8 models: Llama 3.3 70B ($0.22/$0.22 — symmetric flagship), Llama 3.1 70B ($0.18/$0.18 — symmetric), Llama 3.1 8B ($0.05/$0.05 — budget symmetric), Mistral 7B ($0.04/$0.04 — cheapest, 98% cheaper than GPT-4o), DeepSeek R1 ($0.50/$2.00 — reasoning), DeepSeek V3 ($0.22/$0.88 — frontier), Qwen 2.5 72B ($0.22/$0.22 — symmetric multilingual), Phi-3 Mini 128K ($0.04/$0.04 — ultra-compact symmetric). Get your key at dev.heurist.ai.
                </p>
                <CodeBlock language="typescript" code={sdkHeuristExample} />
              </TabsContent>
              <TabsContent value="nearai" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  NEAR AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.near.ai/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. NEAR AI is NEAR Protocol&apos;s AI inference network — a Proof-of-Stake sharding blockchain optimized for scalable, low-cost compute. The 5th blockchain AI network on LLMeter after Corcel (Bittensor), io.net (Solana), Akash (Cosmos), and Heurist (Ethereum ZK L2). 8 models: Llama 3.3 70B ($0.25/$0.25 — symmetric flagship), Llama 3.1 70B ($0.20/$0.20), Llama 3.1 8B ($0.04/$0.04 — budget, 98% cheaper than GPT-4o), Llama 3.1 405B ($1.60/$1.60 — enterprise), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek V3 ($0.28/$1.10), Mistral 7B ($0.06/$0.06), Qwen 2.5 72B ($0.30/$0.30 — multilingual). Get your key at nearai.app.
                </p>
                <CodeBlock language="typescript" code={sdkNearAIExample} />
              </TabsContent>
              <TabsContent value="hyperstack" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Hyperstack is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://infra.hyperstack.cloud/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Hyperstack is a UK/Netherlands GPU cloud and certified NVIDIA Cloud Partner — H100, H200, and A100 clusters for AI inference and training. Founded 2022, based in London; sustainable data centres powered by Dutch renewable energy. 8 models: Llama 3.3 70B ($0.40/$0.60 — flagship), Llama 3.1 70B ($0.35/$0.55), Llama 3.1 8B ($0.08/$0.08 — symmetric budget), Llama 3.1 405B ($1.80/$1.80 — enterprise), DeepSeek R1 ($0.55/$2.19 — reasoning), Mistral 7B ($0.08/$0.08 — symmetric cheapest), Qwen 2.5 72B ($0.38/$0.38 — symmetric multilingual), Mixtral 8x7B ($0.28/$0.28 — symmetric MoE). Get your key at hyperstack.cloud.
                </p>
                <CodeBlock language="typescript" code={sdkHyperstackExample} />
              </TabsContent>
              <TabsContent value="gmi" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  GMI Cloud is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.gmi-serving.com/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. GMI Cloud raised $82M Series A in October 2024 (led by Headline Asia) — founded 2022 by Alex Yeh in San Jose; pivoted from Bitcoin compute to AI GPU infrastructure. H100/H200 clusters with per-token serverless inference. 8 models: Llama 3.3 70B ($0.25/$0.75 — flagship, 90% cheaper than GPT-4o), DeepSeek R1 ($0.50/$2.18 — reasoning), DeepSeek V3 ($0.28/$0.88 — fast frontier), Kimi K2 ($0.80/$1.20 — agentic), MiniMax M2.1 ($0.30/$1.20 — efficient), Qwen3-VL 235B ($0.30/$1.40 — multimodal), GLM-4.7 ($0.40/$2.00 — ZhipuAI Chinese flagship), DeepSeek V3.2 ($0.28/$0.40 — ultra-fast). Get your key at console.gmicloud.ai.
                </p>
                <CodeBlock language="typescript" code={sdkGMIExample} />
              </TabsContent>
              <TabsContent value="internlm" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  InternLM is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://internlm-chat.intern-ai.org.cn/puyu/api/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. InternLM is developed by Shanghai AI Laboratory (上海人工智能实验室) — a major Chinese research institution founded 2020, backed by Alibaba, Tencent, ByteDance, and Sequoia China. Top-ranked on C-Eval, CMMLU, and HumanEval benchmarks; InternVL2 is among the best open-source vision-language models globally. 8 models: InternLM3 8B ($0.10/$0.10 — budget, 96% cheaper than GPT-4o), InternLM2.5 7B ($0.08/$0.08 — ultra-budget), InternLM2.5 20B ($0.35/$0.35 — standard), InternLM2 Math 20B ($0.25/$0.25 — math-specialized), InternLM2 34B ($0.80/$0.80 — premium), InternVL2 8B ($0.12/$0.12 — vision budget), InternVL2 26B ($0.45/$0.45 — vision standard), InternVL2 76B ($1.20/$1.20 — vision premium). Get your key at internlm.intern-ai.org.cn/api/tokens.
                </p>
                <CodeBlock language="typescript" code={sdkInternLMExample} />
              </TabsContent>
              <TabsContent value="targon" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Targon is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.targon.com/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Targon is built by Nineteen.ai on Bittensor subnet 19 — the 6th blockchain AI network on LLMeter (after Corcel/Bittensor, io.net/Solana, Akash/Cosmos, Heurist/ETH ZK L2, NEAR Protocol). Community GPU validators earn TAO rewards by serving inference. 8 models: Llama 3.3 70B ($0.20/$0.20 — symmetric flagship, 90% cheaper than GPT-4o), Llama 3.1 70B ($0.18/$0.18 — symmetric), Llama 3.1 8B ($0.04/$0.04 — budget, 98% cheaper than GPT-4o), Llama 3.1 405B ($1.50/$1.50 — enterprise), DeepSeek R1 ($0.50/$2.00 — reasoning), DeepSeek V3 ($0.20/$0.80 — frontier), Mistral 7B ($0.05/$0.05 — symmetric budget), Qwen 2.5 72B ($0.22/$0.22 — symmetric multilingual). Get your key at targon.com.
                </p>
                <CodeBlock language="typescript" code={sdkTargonExample} />
              </TabsContent>
              <TabsContent value="netmind" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  NetMind AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.netmind.ai/inference-api/openai/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. NetMind is a community GPU marketplace where contributors share idle capacity and earn NMT token rewards — founded 2022, based in the UK, 250,000+ nodes globally. Community GPU supply drives prices down. 8 models: Llama 3.3 70B ($0.20/$0.20 — symmetric flagship), Llama 3.1 70B ($0.18/$0.18 — symmetric), Llama 3.1 8B ($0.04/$0.04 — budget, 98% cheaper than GPT-4o), Llama 3.1 405B ($1.40/$1.40 — enterprise), DeepSeek R1 ($0.55/$2.19 — reasoning), DeepSeek V3 ($0.22/$0.88 — frontier), Mistral 7B ($0.05/$0.05 — symmetric budget), Qwen 2.5 72B ($0.28/$0.28 — symmetric multilingual). Get your key at netmind.ai.
                </p>
                <CodeBlock language="typescript" code={sdkNetmindExample} />
              </TabsContent>
              <TabsContent value="mancer" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Mancer is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://neuro.mancer.tech/oai/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Mancer is privacy-first uncensored LLM inference hosted in Europe — no conversation logging, no data retention, no content filtering. 8th privacy-first provider on LLMeter (after Venice, TextSynth, Prem, Infermatic, and others). 8 models: WizardLM 2 8x22B MoE ($0.90/$0.90 — symmetric flagship MoE), Midnight Rose 103B ($0.90/$0.90 — symmetric flagship), WizardLM 2 70B ($0.50/$0.50 — symmetric), Llama 3.1 70B Instruct ($0.45/$0.45 — symmetric), WizardCoder 33B v1.1 ($0.25/$0.25 — coding), Noromaid 20B ($0.20/$0.20 — symmetric), MythoMax L2 13B ($0.12/$0.12 — budget), Llama 3 8B Instruct ($0.08/$0.08 — 95% cheaper than GPT-4o). Get your key at mancer.tech.
                </p>
                <CodeBlock language="typescript" code={sdkMancerExample} />
              </TabsContent>
              <TabsContent value="rhymes" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Rhymes AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.rhymes.ai/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Italian-founded AI startup (2023) by Enrico Fini, Hatem Haddad, and Ivan Laptev — former Meta AI Research. First native video-understanding LLM provider on LLMeter. Aria: 25.3B MoE, 128K context, native multimodal understanding across text, images, and video. 5 models: Aria ($0.80/$2.00 — multimodal flagship), Aria Text ($0.40/$1.00 — text-only), Aria Mini ($0.10/$0.20 — budget, 96% cheaper than GPT-4o), Aria v1.0 ($0.60/$1.50 — original stable), Aria v1.0 Text ($0.25/$0.60 — v1 budget). Get your key at rhymes.ai.
                </p>
                <CodeBlock language="typescript" code={sdkRhymesExample} />
              </TabsContent>
              <TabsContent value="primeintellect" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Prime Intellect is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.primeintellect.ai/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. San Francisco AI startup (2023) that pioneered decentralized model training via PRIME protocol — INTELLECT-1 (10B params) was the first LLM trained end-to-end across 112 GPU contributors in 40+ countries. 7th decentralized AI compute network on LLMeter ($15.5M raised). 8 models: INTELLECT-1 ($0.30/$0.30 — flagship symmetric), Llama 3.3 70B ($0.25/$0.25 — symmetric), Llama 3.1 70B ($0.22/$0.22 — symmetric), Llama 3.1 8B ($0.05/$0.05 — budget, 98% cheaper than GPT-4o), Llama 3.1 405B ($1.50/$1.50 — enterprise symmetric), DeepSeek R1 ($0.50/$2.00 — reasoning), DeepSeek V3 ($0.20/$0.80), Qwen 2.5 72B ($0.25/$0.25 — multilingual symmetric). Get your key at primeintellect.ai.
                </p>
                <CodeBlock language="typescript" code={sdkPrimeIntellectExample} />
              </TabsContent>
              <TabsContent value="exaone" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  EXAONE is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.exaone.ai/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. LG AI Research (founded 2021 by LG Corporation, KRX: 003550 — South Korea&apos;s 4th largest conglomerate with $66B+ annual revenue). EXAONE 3.5 (December 2024): bilingual Korean-English, #1 on Korean language benchmarks, competitive with Llama 3.3 70B at only 7.8B params. EXAONE Deep: reasoning model competitive with o1-level on MATH-500 and AIME 2024. Apache 2.0 open source. 3rd Korean AI provider on LLMeter. 8 models: EXAONE 3.5 7.8B ($0.08/$0.20), EXAONE 3.5 2.4B ($0.04/$0.10 — 98% cheaper than GPT-4o input), EXAONE 3.0 7.8B ($0.06/$0.15), EXAONE 3.0 2.4B ($0.03/$0.08), EXAONE Deep 7.8B ($0.30/$1.20 — reasoning), EXAONE Deep 2.4B ($0.10/$0.40), EXAONE 3.5 7.8B 32K ($0.10/$0.25), EXAONE 3.5 7.8B Base ($0.05/$0.12). Get your key at api.exaone.ai.
                </p>
                <CodeBlock language="typescript" code={sdkEXAONEExample} />
              </TabsContent>
              <TabsContent value="mimo" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Xiaomi MiMo is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.xiaomimimo.com/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Xiaomi (小米科技, HKEX: 1810) — world&apos;s 3rd largest smartphone maker. Founded 2010 by Lei Jun; $46B+ revenue; 600M+ MIUI users; smartphones, Smart TVs, IoT devices, and electric vehicles (SU7, 2024). MiMo-V2.5-Pro: 1M token context, deep thinking mode, tool calling, web search ($0.435/$0.87/1M). MiMo-V2.5: multimodal text+image+video, 1M context ($0.14/$0.28/1M — 94% cheaper than GPT-4o input). MiMo-V2-Flash: $0.01/$0.30/1M — 99.6% cheaper than GPT-4o input. Get your key at platform.xiaomimimo.com.
                </p>
                <CodeBlock language="typescript" code={sdkMiMoExample} />
              </TabsContent>
              <TabsContent value="lamini" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Lamini AI is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.lamini.ai/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Lamini (lamini.ai) — LLM fine-tuning and inference platform. Founded 2022 by Sharon Zhou (Stanford AI PhD, formerly NVIDIA researcher) and Greg Diamos (co-created NVIDIA Volta architecture, formerly Baidu/NVIDIA/Snowflake). San Francisco. AMD partnership: AMD Instinct MI300X GPUs — the only AMD-powered inference provider on LLMeter. Full fine-tuning → serving loop: train on private data, deploy on the same OpenAI-compatible endpoint. 8 models: Llama 3.3 70B ($0.30/$0.50), Llama 3.1 70B ($0.28/$0.48), Llama 3.1 8B ($0.08/$0.12 — 97% cheaper than GPT-4o), Llama 3.1 405B ($2.50/$3.00 — enterprise), Mistral 7B ($0.10/$0.10 symmetric — 96% cheaper than GPT-4o), Mixtral 8x7B ($0.30/$0.30 symmetric MoE), DeepSeek R1 ($0.55/$2.19 — reasoning), Qwen 2.5 72B ($0.35/$0.35 symmetric). Get your key at app.lamini.ai.
                </p>
                <CodeBlock language="typescript" code={sdkLaminiExample} />
              </TabsContent>
              <TabsContent value="intel" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Intel Developer Cloud is OpenAI-compatible — use the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">openai</code>{' '}
                  package with baseURL: &apos;https://api.us.gaudi.cloud.intel.com/v1&apos;.
                  Wrap it once and every{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">chat.completions.create()</code>{' '}
                  call is tracked automatically. Intel Tiber AI Cloud with Gaudi AI accelerators — Intel Corporation (NASDAQ: INTC), Santa Clara CA, founded 1968 by Gordon Moore and Robert Noyce. 113,000 employees, $54B+ revenue. Gaudi 3 (launched April 2024): 4× AI compute vs Gaudi 2, competes directly with NVIDIA A100/H100 and AMD Instinct MI300X. 3rd of the Big 3 AI chip companies tracked in LLMeter (NVIDIA → AMD/Lamini → Intel). 8 models: Llama 3.3 70B ($0.35/$0.40), Llama 3.1 70B ($0.30/$0.35), Llama 3.1 8B ($0.07/$0.07 symmetric — 98% cheaper than GPT-4o), Llama 3.1 405B ($1.80/$1.80 symmetric — enterprise), Mistral 7B ($0.05/$0.05 symmetric — 98% cheaper than GPT-4o), DeepSeek R1 ($0.55/$2.19 — reasoning), Qwen 2.5 72B ($0.32/$0.32 symmetric), Phi-4 ($0.12/$0.12 symmetric). 5 of 8 models symmetric pricing. Get your key at console.cloud.intel.com.
                </p>
                <CodeBlock language="typescript" code={sdkIntelExample} />
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
