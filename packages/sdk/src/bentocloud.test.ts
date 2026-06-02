import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapBentoCloud } from './bentocloud.js';

function makeBentoCloudClient(response: Record<string, unknown>) {
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

describe('wrapBentoCloud', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bentocloud = makeBentoCloudClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapBentoCloud(bentocloud, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Explain transformer attention in one paragraph.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'llama-3.3-70b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bentocloud = makeBentoCloudClient({
      model: 'mistral-7b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapBentoCloud(bentocloud, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'mistral-7b-instruct',
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

    const bentocloud = makeBentoCloudClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapBentoCloud(bentocloud, tracker);
    await wrapped.chat.completions.create(
      { model: 'llama-3.3-70b-instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = bentocloud.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bentocloud = makeBentoCloudClient({
      model: 'qwen-2.5-72b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapBentoCloud(bentocloud, tracker);
    await wrapped.chat.completions.create({
      model: 'qwen-2.5-72b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bentocloud = makeBentoCloudClient({ model: 'llama-3.3-70b-instruct' });

    const wrapped = wrapBentoCloud(bentocloud, tracker);
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const bentocloud = makeBentoCloudClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (bentocloud as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapBentoCloud(bentocloud as typeof bentocloud & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'llama-3.1-405b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'BentoML makes ML model serving simple.' } }],
    };
    const bentocloud = makeBentoCloudClient(expectedResult);

    const wrapped = wrapBentoCloud(bentocloud, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'llama-3.1-405b-instruct',
      messages: [{ role: 'user', content: 'What is BentoML?' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
