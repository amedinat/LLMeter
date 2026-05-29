import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapTextSynth } from './textsynth.js';

function makeTextSynthClient(response: Record<string, unknown>) {
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

describe('wrapTextSynth', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const textsynth = makeTextSynthClient({
      model: 'llama3_70B',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapTextSynth(textsynth, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'llama3_70B',
      messages: [{ role: 'user', content: 'Hello from TextSynth!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'llama3_70B',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const textsynth = makeTextSynthClient({
      model: 'deepseek_r1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapTextSynth(textsynth, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'deepseek_r1',
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

    const textsynth = makeTextSynthClient({
      model: 'mistral_7B_instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapTextSynth(textsynth, tracker);
    await wrapped.chat.completions.create(
      { model: 'mistral_7B_instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = textsynth.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const textsynth = makeTextSynthClient({
      model: 'qwen2_72B',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapTextSynth(textsynth, tracker);
    await wrapped.chat.completions.create({
      model: 'qwen2_72B',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const textsynth = makeTextSynthClient({ model: 'gemma2_9B_instruct' });

    const wrapped = wrapTextSynth(textsynth, tracker);
    await wrapped.chat.completions.create({
      model: 'gemma2_9B_instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const textsynth = makeTextSynthClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (textsynth as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapTextSynth(textsynth as typeof textsynth & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'mixtral_47B_instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from TextSynth!' } }],
    };
    const textsynth = makeTextSynthClient(expectedResult);

    const wrapped = wrapTextSynth(textsynth, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'mixtral_47B_instruct',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
