import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapNaver } from './naver.js';

function makeNaverClient(response: Record<string, unknown>) {
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

describe('wrapNaver', () => {
  it('tracks usage from completion response (OpenAI-compat usage field)', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const naver = makeNaverClient({
      model: 'HCX-003',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapNaver(naver, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'HCX-003',
      messages: [{ role: 'user', content: '안녕하세요!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'HCX-003',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('tracks usage from CLOVA Studio native result field (inputLength/outputLength)', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const naver = makeNaverClient({
      result: {
        message: { role: 'assistant', content: '서울입니다.' },
        inputLength: 12,
        outputLength: 8,
      },
    });

    const wrapped = wrapNaver(naver, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'HCX-DASH-001',
      messages: [{ role: 'user', content: '수도가 어디야?' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'HCX-DASH-001',
      inputTokens: 12,
      outputTokens: 8,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const naver = makeNaverClient({
      model: 'HCX-DASH-002',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapNaver(naver, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'HCX-DASH-002', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to NAVER', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const naver = makeNaverClient({
      model: 'HCX-DASH-003',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapNaver(naver, tracker);
    await wrapped.chat.completions.create(
      { model: 'HCX-DASH-003', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (naver.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const naver = makeNaverClient({
      model: 'HCX-DASH-003',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapNaver(naver, tracker);
    await wrapped.chat.completions.create({
      model: 'HCX-DASH-003',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when both usage and result are absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const naver = makeNaverClient({ model: 'HCX-003' });
    const wrapped = wrapNaver(naver, tracker);
    await wrapped.chat.completions.create({
      model: 'HCX-003',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const naver = makeNaverClient({
      model: 'HCX-DASH-001',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapNaver(naver, tracker);
    await wrapped.chat.completions.create(
      { model: 'HCX-DASH-001', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (naver.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const naver = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapNaver(naver, tracker);
    await (wrapped as typeof naver).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
