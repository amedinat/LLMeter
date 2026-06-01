import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapInfercom } from './infercom.js';

function makeInfercomClient(response: Record<string, unknown>) {
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

describe('wrapInfercom', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infercom = makeInfercomClient({
      model: 'gpt-oss-120b',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapInfercom(infercom, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'gpt-oss-120b',
      messages: [{ role: 'user', content: 'EU sovereign, tracked by LLMeter.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'gpt-oss-120b',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infercom = makeInfercomClient({
      model: 'gemma-3-12b-it',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapInfercom(infercom, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'gemma-3-12b-it',
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

    const infercom = makeInfercomClient({
      model: 'minimax-m2.5',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapInfercom(infercom, tracker);
    await wrapped.chat.completions.create(
      { model: 'minimax-m2.5', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = infercom.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toEqual({ stream: false });
  });

  it('uses defaultCustomerId when no llmeter_customer_id in options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infercom = makeInfercomClient({
      model: 'minimax-m2.7-ultraspeed',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });

    const wrapped = wrapInfercom(infercom, tracker, 'default_user');
    await wrapped.chat.completions.create({ model: 'minimax-m2.7-ultraspeed', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default_user' })
    );
  });

  it('does not track when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infercom = makeInfercomClient({ model: 'gpt-oss-120b' });

    const wrapped = wrapInfercom(infercom, tracker);
    await wrapped.chat.completions.create({ model: 'gpt-oss-120b', messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('forwards original call arguments to underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const infercom = makeInfercomClient({
      model: 'Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 50, completion_tokens: 25 },
    });

    const wrapped = wrapInfercom(infercom, tracker);
    const params = {
      model: 'Llama-3.3-70B-Instruct',
      messages: [{ role: 'user' as const, content: 'From Munich with sovereignty.' }],
      temperature: 0.7,
    };
    await wrapped.chat.completions.create(params);

    expect(infercom.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });

  it('uses anonymous as default customerId when none provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infercom = makeInfercomClient({
      model: 'DeepSeek-V3.2',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });

    const wrapped = wrapInfercom(infercom, tracker);
    await wrapped.chat.completions.create({ model: 'DeepSeek-V3.2', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });
});
