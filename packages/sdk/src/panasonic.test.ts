import { describe, it, expect, vi } from 'vitest';
import { wrapPanasonic } from './panasonic.js';

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

describe('wrapPanasonic', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'kairos-34b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapPanasonic(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'kairos-34b',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'kairos-34b',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'kairos-34b-instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapPanasonic(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'kairos-34b-instruct', messages: [] },
      { llmeter_customer_id: 'panasonic_user_456' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'panasonic_user_456' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'meta-llama/Llama-3.3-70B-Instruct' });
    const tracker = makeTracker();
    const tracked = wrapPanasonic(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('passes through the original result', async () => {
    const response = {
      model: 'kairos-34b',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
      choices: [{ message: { content: 'Panasonic 2170 cells power every US-built Tesla Model 3.' } }],
    };
    const client = makeMockClient(response);
    const tracker = makeTracker();
    const tracked = wrapPanasonic(client as never, tracker as never);

    const result = await tracked.chat.completions.create({
      model: 'kairos-34b',
      messages: [],
    });

    expect(result).toEqual(response);
  });

  it('uses defaultCustomerId when no llmeter_customer_id provided', async () => {
    const client = makeMockClient({
      model: 'kairos-7b',
      usage: { prompt_tokens: 50, completion_tokens: 25 },
    });
    const tracker = makeTracker();
    const tracked = wrapPanasonic(client as never, tracker as never, 'panasonic_default');

    await tracked.chat.completions.create({ model: 'kairos-7b', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'panasonic_default' })
    );
  });

  it('strips llmeter_customer_id from options before passing to API', async () => {
    const client = makeMockClient({
      model: 'kairos-34b-instruct',
      usage: { prompt_tokens: 60, completion_tokens: 30 },
    });
    const tracker = makeTracker();
    const tracked = wrapPanasonic(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'kairos-34b-instruct', messages: [] },
      { llmeter_customer_id: 'user_789', temperature: 0.7 } as never
    );

    const createCall = (client.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(createCall[1]).not.toHaveProperty('llmeter_customer_id');
    expect(createCall[1]).toHaveProperty('temperature', 0.7);
  });

  it('handles zero token counts', async () => {
    const client = makeMockClient({
      model: 'kairos-7b',
      usage: { prompt_tokens: 0, completion_tokens: 0 },
    });
    const tracker = makeTracker();
    const tracked = wrapPanasonic(client as never, tracker as never);

    await tracked.chat.completions.create({ model: 'kairos-7b', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'kairos-7b',
      inputTokens: 0,
      outputTokens: 0,
      customerId: 'anonymous',
    });
  });
});
