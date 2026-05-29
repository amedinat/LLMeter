import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapSkyWork } from './skywork.js';

function makeSkyWorkClient(response: Record<string, unknown>) {
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

describe('wrapSkyWork', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const skywork = makeSkyWorkClient({
      model: 'tiangong-2',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapSkyWork(skywork, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'tiangong-2',
      messages: [{ role: 'user', content: 'Hello from SkyWork!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'tiangong-2',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const skywork = makeSkyWorkClient({
      model: 'skywork-o1-preview',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapSkyWork(skywork, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'skywork-o1-preview',
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

    const skywork = makeSkyWorkClient({
      model: 'skywork-7b-chat',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapSkyWork(skywork, tracker);
    await wrapped.chat.completions.create(
      { model: 'skywork-7b-chat', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = skywork.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const skywork = makeSkyWorkClient({
      model: 'skywork-moe-20b',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapSkyWork(skywork, tracker);
    await wrapped.chat.completions.create({
      model: 'skywork-moe-20b',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const skywork = makeSkyWorkClient({ model: 'skywork-math-plus' });

    const wrapped = wrapSkyWork(skywork, tracker);
    await wrapped.chat.completions.create({
      model: 'skywork-math-plus',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const skywork = makeSkyWorkClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (skywork as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapSkyWork(skywork as typeof skywork & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'tiangong-2-lite',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from SkyWork!' } }],
    };
    const skywork = makeSkyWorkClient(expectedResult);

    const wrapped = wrapSkyWork(skywork, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'tiangong-2-lite',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
