'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Check, Copy } from 'lucide-react';

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

const curlExample = `curl -X POST https://your-app.vercel.app/api/ingest \\
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

const nodeExample = `const response = await fetch("https://your-app.vercel.app/api/ingest", {
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
    "https://your-app.vercel.app/api/ingest",
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

export default function DocsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ingestion API Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Send usage data to LLMeter from any application or pipeline.
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
