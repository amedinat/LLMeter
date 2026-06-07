import { describe, it, expect, vi } from 'vitest';
import { wrapSony } from './sony.js';

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

describe('wrapSony', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'sony-foundation-70b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapSony(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'sony-foundation-70b',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'sony-foundation-70b',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'sony-creative-70b',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapSony(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'sony-creative-70b', messages: [] },
      { llmeter_customer_id: 'sony_user_456' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'sony_user_456' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'meta-llama/Llama-3.3-70B-Instruct' });
    const tracker = makeTracker();
    const tracked = wrapSony(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('passes through the original result', async () => {
    const response = {
      model: 'sony-foundation-70b',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
      choices: [{ message: { content: 'PlayStation 5 uses a custom AMD Zen 2 CPU and RDNA 2 GPU.' } }],
    };
    const client = makeMockClient(response);
    const tracker = makeTracker();
    const tracked = wrapSony(client as never, tracker as never);

    const result = await tracked.chat.completions.create({
      model: 'sony-foundation-70b',
      messages: [],
    });

    expect(result).toEqual(response);
  });

  it('uses defaultCustomerId when no llmeter_customer_id provided', async () => {
    const client = makeMockClient({
      model: 'sony-foundation-7b',
      usage: { prompt_tokens: 50, completion_tokens: 25 },
    });
    const tracker = makeTracker();
    const tracked = wrapSony(client as never, tracker as never, 'sony_default');

    await tracked.chat.completions.create({ model: 'sony-foundation-7b', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'sony_default' })
    );
  });

  it('strips llmeter_customer_id from options before passing to API', async () => {
    const client = makeMockClient({
      model: 'sony-creative-70b',
      usage: { prompt_tokens: 60, completion_tokens: 30 },
    });
    const tracker = makeTracker();
    const tracked = wrapSony(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'sony-creative-70b', messages: [] },
      { llmeter_customer_id: 'user_789', temperature: 0.7 } as never
    );

    const createCall = (client.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(createCall[1]).not.toHaveProperty('llmeter_customer_id');
    expect(createCall[1]).toHaveProperty('temperature', 0.7);
  });

  it('handles zero token counts', async () => {
    const client = makeMockClient({
      model: 'sony-foundation-7b',
      usage: { prompt_tokens: 0, completion_tokens: 0 },
    });
    const tracker = makeTracker();
    const tracked = wrapSony(client as never, tracker as never);

    await tracked.chat.completions.create({ model: 'sony-foundation-7b', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'sony-foundation-7b',
      inputTokens: 0,
      outputTokens: 0,
      customerId: 'anonymous',
    });
  });
});
