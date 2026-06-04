import { describe, it, expect, vi } from 'vitest';
import { wrapHeroku } from './heroku.js';

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

describe('wrapHeroku', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapHeroku(client, tracker as never);

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
      model: 'claude-3-5-sonnet-20241022',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapHeroku(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'claude-3-5-sonnet-20241022', messages: [] },
      { llmeter_customer_id: 'heroku_app_123' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'heroku_app_123' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'meta-llama/Llama-3.1-8B-Instruct' });
    const tracker = makeTracker();
    const tracked = wrapHeroku(client, tracker as never);

    await tracked.chat.completions.create({ model: 'meta-llama/Llama-3.1-8B-Instruct', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({
      model: 'cohere/command-r-plus',
      usage: { prompt_tokens: 50, completion_tokens: 200 },
    });
    const tracker = makeTracker();
    const tracked = wrapHeroku(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'cohere/command-r-plus', messages: [] },
      { llmeter_customer_id: 'user_1', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id not set', async () => {
    const client = makeMockClient({
      model: 'claude-3-haiku-20240307',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapHeroku(client, tracker as never, 'salesforce_app');

    await tracked.chat.completions.create({ model: 'claude-3-haiku-20240307', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'salesforce_app' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'cohere/command-r' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapHeroku(client, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'meta-llama/Llama-3.1-70B-Instruct',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });
    const tracker = makeTracker();
    const tracked = wrapHeroku(client, tracker as never);

    const params = {
      model: 'meta-llama/Llama-3.1-70B-Instruct',
      messages: [{ role: 'user', content: 'Build me a Heroku app with AI.' }],
      temperature: 0.7,
    };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
