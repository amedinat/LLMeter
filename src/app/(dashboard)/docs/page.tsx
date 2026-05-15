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
            provides drop-in wrappers for OpenAI, Anthropic, Google AI, AWS Bedrock, Azure OpenAI, Cohere, Groq, Together AI, Fireworks AI, Perplexity AI, Cerebras, AI21 Labs, and xAI (Grok) SDKs.
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
