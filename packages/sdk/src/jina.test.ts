import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapJina } from './jina.js';

function makeJinaClient(response: Record<string, unknown>) {
  return {
    embeddings: {
      create: vi.fn().mockResolvedValue(response),
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapJina', () => {
  it('tracks usage from total_tokens in embedding response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const jina = makeJinaClient({
      model: 'jina-embeddings-v3',
      usage: { total_tokens: 500, prompt_tokens: 500 },
    });

    const wrapped = wrapJina(jina, tracker, 'user_abc');
    await wrapped.embeddings.create({
      model: 'jina-embeddings-v3',
      input: ['Hello from Jina AI — multimodal MTEB-top-10 embeddings!'],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'jina-embeddings-v3',
      inputTokens: 500,
      outputTokens: 0,
      customerId: 'user_abc',
    });
  });

  it('falls back to prompt_tokens when total_tokens is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const jina = makeJinaClient({
      model: 'jina-clip-v2',
      usage: { prompt_tokens: 200 },
    });

    const wrapped = wrapJina(jina, tracker, 'user_xyz');
    await wrapped.embeddings.create({
      model: 'jina-clip-v2',
      input: ['multimodal test'],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ inputTokens: 200, outputTokens: 0 })
    );
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const jina = makeJinaClient({
      model: 'jina-embeddings-v2-base-de',
      usage: { total_tokens: 100 },
    });

    const wrapped = wrapJina(jina, tracker);
    await wrapped.embeddings.create(
      {
        model: 'jina-embeddings-v2-base-de',
        input: ['Deutsche Einbettungen testen'],
      },
      { llmeter_customer_id: 'customer_xyz' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer_xyz' })
    );
  });

  it('strips llmeter_customer_id from options before forwarding', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const jina = makeJinaClient({
      model: 'jina-embeddings-v3',
      usage: { total_tokens: 10 },
    });

    const wrapped = wrapJina(jina, tracker);
    await wrapped.embeddings.create(
      { model: 'jina-embeddings-v3', input: ['test'] },
      { llmeter_customer_id: 'u1', encoding_type: 'float' }
    );

    const callArgs = jina.embeddings.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('encoding_type', 'float');
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const jina = makeJinaClient({
      model: 'jina-embeddings-v3',
      usage: { total_tokens: 30 },
    });

    const wrapped = wrapJina(jina, tracker);
    await wrapped.embeddings.create({
      model: 'jina-embeddings-v3',
      input: ['test'],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const jina = makeJinaClient({ model: 'jina-embeddings-v3' });

    const wrapped = wrapJina(jina, tracker);
    await wrapped.embeddings.create({
      model: 'jina-embeddings-v3',
      input: ['test'],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('returns the embedding result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'jina-clip-v2',
      usage: { total_tokens: 200 },
      data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
    };
    const jina = makeJinaClient(expectedResult);

    const wrapped = wrapJina(jina, tracker);
    const result = await wrapped.embeddings.create({
      model: 'jina-clip-v2',
      input: ['Hello from Jina AI — multimodal embeddings!'],
    });

    expect(result).toEqual(expectedResult);
  });
});
