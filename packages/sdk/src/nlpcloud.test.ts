import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapNlpCloud } from './nlpcloud.js';

function makeNlpCloudClient(response: Record<string, unknown>) {
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

describe('wrapNlpCloud', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nlpcloud = makeNlpCloudClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });

    const wrapped = wrapNlpCloud(nlpcloud, tracker, 'user_fr');
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Expliquez la RGPD simplement.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'llama-3.3-70b-instruct',
      inputTokens: 300,
      outputTokens: 150,
      customerId: 'user_fr',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nlpcloud = makeNlpCloudClient({
      model: 'mistral-7b-instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapNlpCloud(nlpcloud, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'mistral-7b-instruct',
        messages: [{ role: 'user', content: 'test' }],
      },
      { llmeter_customer_id: 'client_eu' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'client_eu' })
    );
  });

  it('strips llmeter_customer_id from options before forwarding', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const nlpcloud = makeNlpCloudClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapNlpCloud(nlpcloud, tracker);
    await wrapped.chat.completions.create(
      { model: 'llama-3.3-70b-instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = nlpcloud.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nlpcloud = makeNlpCloudClient({
      model: 'mixtral-8x7b-instruct',
      usage: { prompt_tokens: 50, completion_tokens: 25 },
    });

    const wrapped = wrapNlpCloud(nlpcloud, tracker);
    await wrapped.chat.completions.create({
      model: 'mixtral-8x7b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nlpcloud = makeNlpCloudClient({ model: 'llama-3.3-70b-instruct' });

    const wrapped = wrapNlpCloud(nlpcloud, tracker);
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const nlpcloud = makeNlpCloudClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (nlpcloud as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapNlpCloud(nlpcloud as typeof nlpcloud & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 300 },
      choices: [{ message: { content: 'La RGPD (Règlement Général sur la Protection des Données) est la loi européenne sur la protection des données personnelles.' } }],
    };
    const nlpcloud = makeNlpCloudClient(expectedResult);

    const wrapped = wrapNlpCloud(nlpcloud, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Qu\'est-ce que la RGPD ?' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
