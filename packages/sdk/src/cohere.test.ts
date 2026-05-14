import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapCohere } from './cohere.js';

function makeCohereClient(response: Record<string, unknown>) {
  return {
    chat: vi.fn().mockResolvedValue(response),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapCohere', () => {
  it('tracks usage from billed_units in response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cohere = makeCohereClient({
      model: 'command-r-plus',
      usage: {
        billed_units: { input_tokens: 300, output_tokens: 150 },
      },
    });

    const wrapped = wrapCohere(cohere, tracker, 'user_abc');
    await wrapped.chat({ model: 'command-r-plus', message: 'Hello!' });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'command-r-plus',
      inputTokens: 300,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('tracks usage from tokens field as fallback', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cohere = makeCohereClient({
      model: 'command-r',
      usage: {
        tokens: { input_tokens: 100, output_tokens: 50 },
      },
    });

    const wrapped = wrapCohere(cohere, tracker);
    await wrapped.chat({ model: 'command-r', message: 'Test' });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ inputTokens: 100, outputTokens: 50 })
    );
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cohere = makeCohereClient({
      model: 'command-r-plus',
      usage: { billed_units: { input_tokens: 200, output_tokens: 80 } },
    });

    const wrapped = wrapCohere(cohere, tracker, 'default');
    await wrapped.chat(
      { model: 'command-r-plus', message: 'Hello' },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Cohere', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const cohere = makeCohereClient({
      model: 'command-r-plus',
      usage: { billed_units: { input_tokens: 50, output_tokens: 20 } },
    });

    const wrapped = wrapCohere(cohere, tracker);
    await wrapped.chat(
      { model: 'command-r-plus', message: 'Hello' },
      { llmeter_customer_id: 'u1', requestOptions: { timeout: 5000 } }
    );

    const [, passedOptions] = (cohere.chat as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect((passedOptions as { requestOptions?: unknown }).requestOptions).toBeDefined();
  });

  it('falls back to model from params when response model is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cohere = makeCohereClient({
      usage: { billed_units: { input_tokens: 10, output_tokens: 5 } },
    });

    const wrapped = wrapCohere(cohere, tracker);
    await wrapped.chat({ model: 'command', message: 'Hi' });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'command' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cohere = makeCohereClient({ model: 'command-r-plus' });
    const wrapped = wrapCohere(cohere, tracker);
    await wrapped.chat({ model: 'command-r-plus', message: 'Hello' });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('skips tracking when token counts are both zero', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cohere = makeCohereClient({
      model: 'command-r',
      usage: { billed_units: { input_tokens: 0, output_tokens: 0 } },
    });

    const wrapped = wrapCohere(cohere, tracker);
    await wrapped.chat({ model: 'command-r', message: 'Hello' });

    expect(trackSpy).not.toHaveBeenCalled();
  });
});
