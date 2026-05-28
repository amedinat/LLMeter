import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapGLHF } from './glhf.js';

function makeGLHFClient(response: Record<string, unknown>) {
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

describe('wrapGLHF', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const glhf = makeGLHFClient({
      model: 'hf:meta-llama/Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapGLHF(glhf, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'hf:meta-llama/Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello from GLHF!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'hf:meta-llama/Llama-3.3-70B-Instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const glhf = makeGLHFClient({
      model: 'hf:deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapGLHF(glhf, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'hf:deepseek-ai/DeepSeek-R1',
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

    const glhf = makeGLHFClient({
      model: 'hf:mistralai/Mistral-7B-Instruct-v0.3',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapGLHF(glhf, tracker);
    await wrapped.chat.completions.create(
      { model: 'hf:mistralai/Mistral-7B-Instruct-v0.3', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = glhf.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const glhf = makeGLHFClient({
      model: 'hf:Qwen/Qwen2.5-72B-Instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapGLHF(glhf, tracker);
    await wrapped.chat.completions.create({
      model: 'hf:Qwen/Qwen2.5-72B-Instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const glhf = makeGLHFClient({ model: 'hf:google/gemma-2-9b-it' });

    const wrapped = wrapGLHF(glhf, tracker);
    await wrapped.chat.completions.create({
      model: 'hf:google/gemma-2-9b-it',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const glhf = makeGLHFClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (glhf as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapGLHF(glhf as typeof glhf & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'hf:meta-llama/Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from GLHF!' } }],
    };
    const glhf = makeGLHFClient(expectedResult);

    const wrapped = wrapGLHF(glhf, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'hf:meta-llama/Llama-3.1-8B-Instruct',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
