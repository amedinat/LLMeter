import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapTensorWave } from './tensorwave.js';

function makeTensorWaveClient(response: Record<string, unknown>) {
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

describe('wrapTensorWave', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const tensorwave = makeTensorWaveClient({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapTensorWave(tensorwave, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello from TensorWave!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const tensorwave = makeTensorWaveClient({
      model: 'meta-llama/Llama-3.1-70B-Instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapTensorWave(tensorwave, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'meta-llama/Llama-3.1-70B-Instruct',
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

    const tensorwave = makeTensorWaveClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapTensorWave(tensorwave, tracker);
    await wrapped.chat.completions.create(
      { model: 'deepseek-ai/DeepSeek-R1', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = tensorwave.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const tensorwave = makeTensorWaveClient({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapTensorWave(tensorwave, tracker);
    await wrapped.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const tensorwave = makeTensorWaveClient({ model: 'meta-llama/Llama-3.3-70B-Instruct' });

    const wrapped = wrapTensorWave(tensorwave, tracker);
    await wrapped.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const tensorwave = makeTensorWaveClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (tensorwave as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapTensorWave(tensorwave as typeof tensorwave & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from AMD MI300X!' } }],
    };
    const tensorwave = makeTensorWaveClient(expectedResult);

    const wrapped = wrapTensorWave(tensorwave, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello from TensorWave!' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
