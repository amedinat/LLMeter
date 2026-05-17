import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapInferenceNet } from './inferencenet.js';

function makeInferenceNetClient(response: Record<string, unknown>) {
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

describe('wrapInferenceNet', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeInferenceNetClient({
      model: 'meta-llama/llama-3.3-70b-instruct/fp-8',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapInferenceNet(client, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct/fp-8',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/llama-3.3-70b-instruct/fp-8',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeInferenceNetClient({
      model: 'meta-llama/llama-3.1-8b-instruct/fp-8',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapInferenceNet(client, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'meta-llama/llama-3.1-8b-instruct/fp-8', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Inference.net', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const client = makeInferenceNetClient({
      model: 'qwen/qwen2.5-72b-instruct/fp-8',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapInferenceNet(client, tracker);
    await wrapped.chat.completions.create(
      { model: 'qwen/qwen2.5-72b-instruct/fp-8', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (client.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeInferenceNetClient({
      model: 'deepseek/deepseek-r1/fp-8',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapInferenceNet(client, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek/deepseek-r1/fp-8',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeInferenceNetClient({ model: 'mistralai/mistral-7b-instruct/fp-8' });
    const wrapped = wrapInferenceNet(client, tracker);
    await wrapped.chat.completions.create({
      model: 'mistralai/mistral-7b-instruct/fp-8',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const client = makeInferenceNetClient({
      model: 'meta-llama/llama-3.1-8b-instruct/fp-8',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapInferenceNet(client, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/llama-3.1-8b-instruct/fp-8', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (client.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const client = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapInferenceNet(client, tracker);
    await (wrapped as typeof client).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
