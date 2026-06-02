import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapPinecone } from './pinecone.js';

function makePineconeClient(response: Record<string, unknown>) {
  return {
    inference: {
      embed: vi.fn().mockResolvedValue(response),
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapPinecone', () => {
  it('tracks usage from embedding response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const pc = makePineconeClient({
      model: 'llama-text-embed-v2',
      usage: { total_tokens: 300 },
    });

    const wrapped = wrapPinecone(pc, tracker, 'user_abc');
    await wrapped.inference.embed(
      'llama-text-embed-v2',
      [{ text: 'Hello from Pinecone Inference!' }],
      { inputType: 'passage' }
    );

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'llama-text-embed-v2',
      inputTokens: 300,
      outputTokens: 0,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const pc = makePineconeClient({
      model: 'multilingual-e5-large',
      usage: { total_tokens: 50 },
    });

    const wrapped = wrapPinecone(pc, tracker, 'default');
    await wrapped.inference.embed(
      'multilingual-e5-large',
      [{ text: 'Bonjour' }],
      {},
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Pinecone', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const pc = makePineconeClient({
      model: 'pinecone-sparse-english-v0',
      usage: { total_tokens: 20 },
    });

    const wrapped = wrapPinecone(pc, tracker);
    await wrapped.inference.embed(
      'pinecone-sparse-english-v0',
      [{ text: 'sparse test' }],
      {},
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const passedOptions = (pc.inference.embed as ReturnType<typeof vi.fn>).mock.calls[0][3] as Record<string, unknown>;
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const pc = makePineconeClient({
      model: 'llama-text-embed-v2',
      usage: { total_tokens: 100 },
    });

    const wrapped = wrapPinecone(pc, tracker);
    await wrapped.inference.embed('llama-text-embed-v2', [{ text: 'default test' }]);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const pc = makePineconeClient({ model: 'llama-text-embed-v2' });

    const wrapped = wrapPinecone(pc, tracker);
    await wrapped.inference.embed('llama-text-embed-v2', [{ text: 'no usage' }]);

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('output tokens are always 0 for embeddings', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const pc = makePineconeClient({
      model: 'pinecone-rerank-v0',
      usage: { total_tokens: 250 },
    });

    const wrapped = wrapPinecone(pc, tracker);
    await wrapped.inference.embed('pinecone-rerank-v0', [{ text: 'rerank test' }]);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ outputTokens: 0 })
    );
  });

  it('passes through non-inference properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const pc = {
      inference: {
        embed: vi.fn().mockResolvedValue({ model: 'llama-text-embed-v2', usage: { total_tokens: 10 } }),
      },
      index: (name: string) => ({ upsert: vi.fn(), query: vi.fn(), name }),
    };

    const wrapped = wrapPinecone(pc, tracker);
    expect(typeof wrapped.index).toBe('function');
  });
});
