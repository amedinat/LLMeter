import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapMixedBread } from './mixedbread.js';

function makeMxbaiClient(response: Record<string, unknown>) {
  return {
    embeddings: {
      create: vi.fn().mockResolvedValue(response),
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapMixedBread', () => {
  it('tracks usage from total_tokens in embedding response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mxbai = makeMxbaiClient({
      model: 'mxbai-embed-large-v1',
      usage: { total_tokens: 512, prompt_tokens: 512 },
    });

    const wrapped = wrapMixedBread(mxbai, tracker, 'user_abc');
    await wrapped.embeddings.create({
      model: 'mxbai-embed-large-v1',
      input: ['MixedBread mxbai-embed-large-v1: MTEB #1 at launch!'],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'mxbai-embed-large-v1',
      inputTokens: 512,
      outputTokens: 0,
      customerId: 'user_abc',
    });
  });

  it('falls back to prompt_tokens when total_tokens is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mxbai = makeMxbaiClient({
      model: 'mxbai-embed-2d-large-v1',
      usage: { prompt_tokens: 256 },
    });

    const wrapped = wrapMixedBread(mxbai, tracker, 'user_xyz');
    await wrapped.embeddings.create({
      model: 'mxbai-embed-2d-large-v1',
      input: ['Matryoshka 2D embeddings — flexible dims 64 to 1024'],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ inputTokens: 256, outputTokens: 0 })
    );
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mxbai = makeMxbaiClient({
      model: 'mxbai-colbert-large-v1',
      usage: { total_tokens: 100 },
    });

    const wrapped = wrapMixedBread(mxbai, tracker);
    await wrapped.embeddings.create(
      {
        model: 'mxbai-colbert-large-v1',
        input: ['ColBERT late interaction retrieval test'],
      },
      { llmeter_customer_id: 'customer_xyz' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer_xyz' })
    );
  });

  it('strips llmeter_customer_id from options before forwarding', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const mxbai = makeMxbaiClient({
      model: 'mxbai-embed-large-v1',
      usage: { total_tokens: 10 },
    });

    const wrapped = wrapMixedBread(mxbai, tracker);
    await wrapped.embeddings.create(
      { model: 'mxbai-embed-large-v1', input: ['test'] },
      { llmeter_customer_id: 'u1', encoding_format: 'float' }
    );

    const callArgs = mxbai.embeddings.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('encoding_format', 'float');
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mxbai = makeMxbaiClient({
      model: 'mxbai-embed-large-v1',
      usage: { total_tokens: 30 },
    });

    const wrapped = wrapMixedBread(mxbai, tracker);
    await wrapped.embeddings.create({
      model: 'mxbai-embed-large-v1',
      input: ['test'],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mxbai = makeMxbaiClient({ model: 'mxbai-embed-large-v1' });

    const wrapped = wrapMixedBread(mxbai, tracker);
    await wrapped.embeddings.create({
      model: 'mxbai-embed-large-v1',
      input: ['test'],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('returns the embedding result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'mxbai-embed-large-v1',
      usage: { total_tokens: 200 },
      data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
    };
    const mxbai = makeMxbaiClient(expectedResult);

    const wrapped = wrapMixedBread(mxbai, tracker);
    const result = await wrapped.embeddings.create({
      model: 'mxbai-embed-large-v1',
      input: ['MixedBread MTEB #1 embedding model'],
    });

    expect(result).toEqual(expectedResult);
  });
});
