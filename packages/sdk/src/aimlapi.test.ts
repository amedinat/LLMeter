import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapAIMLAPI } from './aimlapi.js';

function makeAIMLAPIClient(response: Record<string, unknown>) {
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

describe('wrapAIMLAPI', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const aimlapi = makeAIMLAPIClient({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapAIMLAPI(aimlapi, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const aimlapi = makeAIMLAPIClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapAIMLAPI(aimlapi, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'deepseek-ai/DeepSeek-R1', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to AI/ML API', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const aimlapi = makeAIMLAPIClient({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapAIMLAPI(aimlapi, tracker);
    await wrapped.chat.completions.create(
      { model: 'mistralai/Mistral-7B-Instruct-v0.2', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (aimlapi.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const aimlapi = makeAIMLAPIClient({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapAIMLAPI(aimlapi, tracker);
    await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const aimlapi = makeAIMLAPIClient({ model: 'deepseek-ai/DeepSeek-R1' });
    const wrapped = wrapAIMLAPI(aimlapi, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-R1',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const aimlapi = makeAIMLAPIClient({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapAIMLAPI(aimlapi, tracker);
    await wrapped.chat.completions.create(
      { model: 'mistralai/Mistral-7B-Instruct-v0.2', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (aimlapi.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const aimlapi = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapAIMLAPI(aimlapi, tracker);
    await (wrapped as typeof aimlapi).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
