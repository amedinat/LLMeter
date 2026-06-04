import { describe, it, expect, vi } from 'vitest';
import { wrapNexusFlow } from './nexusflow.js';

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

describe('wrapNexusFlow', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'gorilla-openfunctions-v2',
      usage: { prompt_tokens: 120, completion_tokens: 60 },
    });
    const tracker = makeTracker();
    const tracked = wrapNexusFlow(client, tracker as never);

    await tracked.chat.completions.create({ model: 'gorilla-openfunctions-v2', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'gorilla-openfunctions-v2',
      inputTokens: 120,
      outputTokens: 60,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'nexus-raven-v2-13b',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapNexusFlow(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'nexus-raven-v2-13b', messages: [] },
      { llmeter_customer_id: 'agent_orchestrator_xyz' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'agent_orchestrator_xyz' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'llama-3.1-8b-instruct' });
    const tracker = makeTracker();
    const tracked = wrapNexusFlow(client, tracker as never);

    await tracked.chat.completions.create({ model: 'llama-3.1-8b-instruct', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({
      model: 'deepseek-r1',
      usage: { prompt_tokens: 50, completion_tokens: 25 },
    });
    const tracker = makeTracker();
    const tracked = wrapNexusFlow(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'deepseek-r1', messages: [] },
      { llmeter_customer_id: 'user_1', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id not set', async () => {
    const client = makeMockClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapNexusFlow(client, tracker as never, 'my_agent_pipeline');

    await tracked.chat.completions.create({ model: 'llama-3.3-70b-instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'my_agent_pipeline' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'qwen-2.5-72b-instruct' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapNexusFlow(client, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'nexus-raven-v2-7b',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });
    const tracker = makeTracker();
    const tracked = wrapNexusFlow(client, tracker as never);

    const params = {
      model: 'nexus-raven-v2-7b',
      messages: [{ role: 'user', content: 'Call the payment API.' }],
      tools: [{ type: 'function', function: { name: 'charge_card', parameters: {} } }],
    };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
