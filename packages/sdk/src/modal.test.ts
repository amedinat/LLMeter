import { describe, it, expect, vi } from 'vitest';
import { wrapModal } from './modal.js';

function makeMockClient(response: Record<string, unknown>) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(response),
      },
    },
  };
}

function makeTracker() {
  return { track: vi.fn() };
}

describe('wrapModal', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapModal(client, tracker as never);

    await tracked.chat.completions.create({ model: 'meta-llama/Llama-3.3-70B-Instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapModal(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'meta-llama/Llama-3.1-8B-Instruct', messages: [] },
      { llmeter_customer_id: 'gpu_customer_789' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'gpu_customer_789' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'mistralai/Mistral-7B-Instruct-v0.3' });
    const tracker = makeTracker();
    const tracked = wrapModal(client, tracker as never);

    await tracked.chat.completions.create({ model: 'mistralai/Mistral-7B-Instruct-v0.3', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapModal(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'deepseek-ai/DeepSeek-R1', messages: [] },
      { llmeter_customer_id: 'serverless_user_123', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id not set', async () => {
    const client = makeMockClient({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapModal(client, tracker as never, 'modal_app');

    await tracked.chat.completions.create({ model: 'Qwen/Qwen2.5-72B-Instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'modal_app' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'deepseek-ai/DeepSeek-V3' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapModal(client, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'meta-llama/Llama-3.1-405B-Instruct',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });
    const tracker = makeTracker();
    const tracked = wrapModal(client, tracker as never);

    const params = {
      model: 'meta-llama/Llama-3.1-405B-Instruct',
      messages: [{ role: 'user', content: 'Explain serverless GPU cold starts.' }],
      temperature: 0.7,
    };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
