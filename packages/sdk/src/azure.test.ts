import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapAzureOpenAI } from './azure.js';

function makeAzureClient(response: Record<string, unknown>) {
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

describe('wrapAzureOpenAI', () => {
  it('tracks usage from a chat completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeAzureClient({
      model: 'gpt-4o',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { role: 'assistant', content: 'Hello!' } }],
    });

    const wrapped = wrapAzureOpenAI(client, tracker, 'user_azure');
    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'gpt-4o',
      inputTokens: 200,
      outputTokens: 400,
      customerId: 'user_azure',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeAzureClient({
      model: 'gpt-35-turbo',
      usage: { prompt_tokens: 50, completion_tokens: 100 },
    });

    const wrapped = wrapAzureOpenAI(client, tracker, 'default_user');
    await wrapped.chat.completions.create(
      { model: 'gpt-35-turbo', messages: [] },
      { llmeter_customer_id: 'tenant_xyz' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'tenant_xyz' })
    );
  });

  it('strips llmeter_customer_id before forwarding to Azure', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const client = makeAzureClient({
      model: 'gpt-4o',
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    });

    const wrapped = wrapAzureOpenAI(client, tracker);
    await wrapped.chat.completions.create(
      { model: 'gpt-4o', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const [, passedOptions] = client.chat.completions.create.mock.calls[0] as [
      unknown,
      Record<string, unknown> | undefined,
    ];
    expect(passedOptions).not.toHaveProperty('llmeter_customer_id');
    expect(passedOptions).toHaveProperty('stream', false);
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeAzureClient({
      model: 'gpt-4o',
      // no usage field
    });

    const wrapped = wrapAzureOpenAI(client, tracker);
    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('falls back to defaultCustomerId when no options provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeAzureClient({
      model: 'gpt-4o-mini',
      usage: { prompt_tokens: 5, completion_tokens: 15 },
    });

    const wrapped = wrapAzureOpenAI(client, tracker, 'fallback_customer');
    await wrapped.chat.completions.create({ model: 'gpt-4o-mini', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'fallback_customer' })
    );
  });

  it('passes params to Azure unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const client = makeAzureClient({
      model: 'gpt-4o',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const params = {
      model: 'gpt-4o',
      messages: [{ role: 'user' as const, content: 'Hi' }],
      temperature: 0.7,
    };

    const wrapped = wrapAzureOpenAI(client, tracker);
    await wrapped.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });

  it('proxies non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const client = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({ model: 'gpt-4o', usage: { prompt_tokens: 1, completion_tokens: 1 } }),
          list: vi.fn(),
        },
      },
    };

    const wrapped = wrapAzureOpenAI(client, tracker);
    expect(wrapped.chat.completions.list).toBe(client.chat.completions.list);
  });
});
