import { describe, it, expect, vi } from 'vitest';
import { wrapPredictionGuard } from './predictionguard.js';

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

describe('wrapPredictionGuard', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'llama-3.1-8b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapPredictionGuard(client, tracker as never);

    await tracked.chat.completions.create({ model: 'llama-3.1-8b-instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'llama-3.1-8b-instruct',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'Hermes-2-Pro-Llama-3-8B',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapPredictionGuard(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'Hermes-2-Pro-Llama-3-8B', messages: [] },
      { llmeter_customer_id: 'healthcare_workflow_456' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'healthcare_workflow_456' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'Neural-Chat-7B' });
    const tracker = makeTracker();
    const tracked = wrapPredictionGuard(client, tracker as never);

    await tracked.chat.completions.create({ model: 'Neural-Chat-7B', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({
      model: 'llama-3.1-70b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapPredictionGuard(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'llama-3.1-70b-instruct', messages: [] },
      { llmeter_customer_id: 'hipaa_user_789', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id not set', async () => {
    const client = makeMockClient({
      model: 'deepseek-coder-6.7b-instruct',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapPredictionGuard(client, tracker as never, 'clinical_app');

    await tracked.chat.completions.create({ model: 'deepseek-coder-6.7b-instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'clinical_app' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'Hermes-2-Pro-Mistral-7B' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapPredictionGuard(client, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'Llama-3.2-11B-Vision-Instruct',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });
    const tracker = makeTracker();
    const tracked = wrapPredictionGuard(client, tracker as never);

    const params = {
      model: 'Llama-3.2-11B-Vision-Instruct',
      messages: [{ role: 'user', content: 'Analyze this medical image.' }],
      temperature: 0.2,
    };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
