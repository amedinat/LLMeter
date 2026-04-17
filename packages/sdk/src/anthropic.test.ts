import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapAnthropic } from './anthropic.js';

function makeAnthropicClient(response: Record<string, unknown>) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue(response),
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapAnthropic', () => {
  it('tracks usage from a messages.create response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const anthropic = makeAnthropicClient({
      model: 'claude-3-5-sonnet-20241022',
      usage: { input_tokens: 200, output_tokens: 400 },
    });

    const wrapped = wrapAnthropic(anthropic, tracker, 'user_xyz');
    await wrapped.messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [] });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'claude-3-5-sonnet-20241022',
      inputTokens: 200,
      outputTokens: 400,
      customerId: 'user_xyz',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const anthropic = makeAnthropicClient({
      model: 'claude-3-5-haiku-20241022',
      usage: { input_tokens: 50, output_tokens: 30 },
    });

    const wrapped = wrapAnthropic(anthropic, tracker, 'default');
    await wrapped.messages.create(
      { model: 'claude-3-5-haiku-20241022', max_tokens: 512, messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'specific_user' }));
  });

  it('strips llmeter_customer_id from options passed to Anthropic', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const anthropic = makeAnthropicClient({
      model: 'claude-3-5-sonnet-20241022',
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    const wrapped = wrapAnthropic(anthropic, tracker);
    await wrapped.messages.create(
      { model: 'claude-3-5-sonnet-20241022', max_tokens: 100, messages: [] },
      { llmeter_customer_id: 'u1', headers: { 'X-Custom': 'value' } }
    );

    const [, passedOptions] = anthropic.messages.create.mock.calls[0] as [unknown, Record<string, unknown>];
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect((passedOptions.headers as Record<string, string>)['X-Custom']).toBe('value');
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const anthropic = makeAnthropicClient({ model: 'claude-3-5-sonnet-20241022' });
    const wrapped = wrapAnthropic(anthropic, tracker);
    await wrapped.messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1, messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });
});
