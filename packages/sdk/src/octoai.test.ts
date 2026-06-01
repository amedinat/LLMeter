import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapOctoAI } from './octoai.js';

function makeOctoAIClient(response: Record<string, unknown>) {
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

describe('wrapOctoAI', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const octoai = makeOctoAIClient({
      model: 'meta-llama-3.3-70b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapOctoAI(octoai, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Hello from OctoAI!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama-3.3-70b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const octoai = makeOctoAIClient({
      model: 'meta-llama-3.1-70b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapOctoAI(octoai, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'meta-llama-3.1-70b-instruct',
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

    const octoai = makeOctoAIClient({
      model: 'meta-llama-3.1-8b-instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapOctoAI(octoai, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama-3.1-8b-instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = octoai.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const octoai = makeOctoAIClient({
      model: 'meta-llama-3.3-70b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapOctoAI(octoai, tracker);
    await wrapped.chat.completions.create({
      model: 'meta-llama-3.3-70b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const octoai = makeOctoAIClient({ model: 'meta-llama-3.3-70b-instruct' });

    const wrapped = wrapOctoAI(octoai, tracker);
    await wrapped.chat.completions.create({
      model: 'meta-llama-3.3-70b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const octoai = makeOctoAIClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (octoai as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapOctoAI(octoai as typeof octoai & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'meta-llama-3.3-70b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from OctoAI — TVM-compiled inference for Llama 3.3 70B!' } }],
    };
    const octoai = makeOctoAIClient(expectedResult);

    const wrapped = wrapOctoAI(octoai, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'meta-llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Hello from OctoAI!' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
