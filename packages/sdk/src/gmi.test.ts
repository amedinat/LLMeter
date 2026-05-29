import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapGMI } from './gmi.js';

function makeGMIClient(response: Record<string, unknown>) {
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

describe('wrapGMI', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const gmi = makeGMIClient({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapGMI(gmi, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello from GMI Cloud!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const gmi = makeGMIClient({
      model: 'deepseek-ai/DeepSeek-R1-0528',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapGMI(gmi, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'deepseek-ai/DeepSeek-R1-0528',
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

    const gmi = makeGMIClient({
      model: 'moonshotai/Kimi-K2-Instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapGMI(gmi, tracker);
    await wrapped.chat.completions.create(
      { model: 'moonshotai/Kimi-K2-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = gmi.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const gmi = makeGMIClient({
      model: 'minimax/MiniMax-M2.1',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapGMI(gmi, tracker);
    await wrapped.chat.completions.create({
      model: 'minimax/MiniMax-M2.1',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const gmi = makeGMIClient({ model: 'deepseek-ai/DeepSeek-V3-0324' });

    const wrapped = wrapGMI(gmi, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3-0324',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const gmi = makeGMIClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (gmi as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapGMI(gmi as typeof gmi & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'Qwen/Qwen3-VL-235B-A22B',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from GMI Cloud!' } }],
    };
    const gmi = makeGMIClient(expectedResult);

    const wrapped = wrapGMI(gmi, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'Qwen/Qwen3-VL-235B-A22B',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
