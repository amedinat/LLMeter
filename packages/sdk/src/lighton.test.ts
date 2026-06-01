import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapLightOn } from './lighton.js';

function makeLightOnClient(response: Record<string, unknown>) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(response),
      },
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapLightOn', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const lighton = makeLightOnClient({
      model: 'alfred-40b-1123',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapLightOn(lighton, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'alfred-40b-1123',
      messages: [{ role: 'user', content: 'Bonjour depuis LightOn Alfred!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'alfred-40b-1123',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const lighton = makeLightOnClient({
      model: 'alfred-40b-0923',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapLightOn(lighton, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'alfred-40b-0923',
        messages: [{ role: 'user', content: 'test' }],
      },
      { llmeter_customer_id: 'customer_xyz' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer_xyz' })
    );
  });

  it('strips llmeter_customer_id from options before forwarding', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const lighton = makeLightOnClient({
      model: 'alfred-7b-0824',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapLightOn(lighton, tracker);
    await wrapped.chat.completions.create(
      { model: 'alfred-7b-0824', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = lighton.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toEqual({ stream: false });
  });

  it('uses defaultCustomerId when no llmeter_customer_id in options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const lighton = makeLightOnClient({
      model: 'alfred-40b-1123',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });

    const wrapped = wrapLightOn(lighton, tracker, 'default_user');
    await wrapped.chat.completions.create({ model: 'alfred-40b-1123', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default_user' })
    );
  });

  it('does not track when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const lighton = makeLightOnClient({ model: 'alfred-40b-1123' });

    const wrapped = wrapLightOn(lighton, tracker);
    await wrapped.chat.completions.create({ model: 'alfred-40b-1123', messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('forwards original call arguments to underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const lighton = makeLightOnClient({
      model: 'alfred-40b-1123',
      usage: { prompt_tokens: 50, completion_tokens: 25 },
    });

    const wrapped = wrapLightOn(lighton, tracker);
    const params = {
      model: 'alfred-40b-1123',
      messages: [{ role: 'user' as const, content: 'Hello from LightOn!' }],
      temperature: 0.7,
    };
    await wrapped.chat.completions.create(params);

    expect(lighton.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });

  it('uses anonymous as default customerId when none provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const lighton = makeLightOnClient({
      model: 'alfred-40b-0923',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });

    const wrapped = wrapLightOn(lighton, tracker);
    await wrapped.chat.completions.create({ model: 'alfred-40b-0923', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });
});
