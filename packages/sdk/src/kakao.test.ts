import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapKakao } from './kakao.js';

function makeKakaoClient(response: Record<string, unknown>) {
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

describe('wrapKakao', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const kakao = makeKakaoClient({
      model: 'kogpt-2.0-30b-chat',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapKakao(kakao, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'kogpt-2.0-30b-chat',
      messages: [{ role: 'user', content: '안녕하세요! 한국어로 AI를 설명해 주세요.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'kogpt-2.0-30b-chat',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const kakao = makeKakaoClient({
      model: 'kogpt-1.0-6b-chat',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapKakao(kakao, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'kogpt-1.0-6b-chat',
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

    const kakao = makeKakaoClient({
      model: 'kogpt-2.0-30b-chat',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapKakao(kakao, tracker);
    await wrapped.chat.completions.create(
      { model: 'kogpt-2.0-30b-chat', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = kakao.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const kakao = makeKakaoClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapKakao(kakao, tracker);
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const kakao = makeKakaoClient({ model: 'kogpt-2.0-30b-chat' });

    const wrapped = wrapKakao(kakao, tracker);
    await wrapped.chat.completions.create({
      model: 'kogpt-2.0-30b-chat',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const kakao = makeKakaoClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (kakao as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapKakao(kakao as typeof kakao & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'kogpt-2.0-30b-chat',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: '안녕하세요! 저는 카카오의 KoGPT 인공지능 모델입니다. 한국어를 위한 최초의 오픈소스 대형 언어 모델 중 하나입니다.' } }],
    };
    const kakao = makeKakaoClient(expectedResult);

    const wrapped = wrapKakao(kakao, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'kogpt-2.0-30b-chat',
      messages: [{ role: 'user', content: '자기 소개를 해 주세요.' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
