import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapNomic } from './nomic.js';

function makeNomicClient(response: Record<string, unknown>) {
  return {
    embeddings: {
      create: vi.fn().mockResolvedValue(response),
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapNomic', () => {
  it('tracks usage from embedding response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nomic = makeNomicClient({
      model: 'nomic-embed-text-v1.5',
      usage: { prompt_tokens: 500 },
    });

    const wrapped = wrapNomic(nomic, tracker, 'user_abc');
    await wrapped.embeddings.create({
      model: 'nomic-embed-text-v1.5',
      input: ['Hello from Nomic AI — fully open-source MTEB embeddings!'],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'nomic-embed-text-v1.5',
      inputTokens: 500,
      outputTokens: 0,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nomic = makeNomicClient({
      model: 'nomic-embed-vision-v1.5',
      usage: { prompt_tokens: 100 },
    });

    const wrapped = wrapNomic(nomic, tracker);
    await wrapped.embeddings.create(
      {
        model: 'nomic-embed-vision-v1.5',
        input: ['multimodal embedding test'],
      },
      { llmeter_customer_id: 'customer_xyz' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer_xyz' })
    );
  });

  it('strips llmeter_customer_id from options before forwarding', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const nomic = makeNomicClient({
      model: 'nomic-embed-text-v1',
      usage: { prompt_tokens: 10 },
    });

    const wrapped = wrapNomic(nomic, tracker);
    await wrapped.embeddings.create(
      { model: 'nomic-embed-text-v1', input: ['test'] },
      { llmeter_customer_id: 'u1', task_type: 'search_document' }
    );

    const callArgs = nomic.embeddings.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('task_type', 'search_document');
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nomic = makeNomicClient({
      model: 'nomic-embed-text-v1.5',
      usage: { prompt_tokens: 30 },
    });

    const wrapped = wrapNomic(nomic, tracker);
    await wrapped.embeddings.create({
      model: 'nomic-embed-text-v1.5',
      input: ['test'],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nomic = makeNomicClient({ model: 'nomic-embed-text-v1.5' });

    const wrapped = wrapNomic(nomic, tracker);
    await wrapped.embeddings.create({
      model: 'nomic-embed-text-v1.5',
      input: ['test'],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const nomic = makeNomicClient({ model: 'test', usage: { prompt_tokens: 1 } });
    (nomic as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapNomic(nomic as typeof nomic & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the embedding result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'nomic-embed-text-v1.5',
      usage: { prompt_tokens: 200 },
      embeddings: [[0.1, 0.2, 0.3]],
    };
    const nomic = makeNomicClient(expectedResult);

    const wrapped = wrapNomic(nomic, tracker);
    const result = await wrapped.embeddings.create({
      model: 'nomic-embed-text-v1.5',
      input: ['Hello from Nomic — open-source MTEB embeddings!'],
    });

    expect(result).toEqual(expectedResult);
  });
});
