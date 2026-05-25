import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapGitHub } from './github.js';

function makeGitHubClient(response: Record<string, unknown>) {
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

describe('wrapGitHub', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const github = makeGitHubClient({
      model: 'gpt-4o',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapGitHub(github, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'gpt-4o',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const github = makeGitHubClient({
      model: 'Meta-Llama-3.1-70B-Instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapGitHub(github, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'Meta-Llama-3.1-70B-Instruct', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to GitHub Models', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const github = makeGitHubClient({
      model: 'gpt-4o-mini',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapGitHub(github, tracker);
    await wrapped.chat.completions.create(
      { model: 'gpt-4o-mini', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (github.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const github = makeGitHubClient({
      model: 'Phi-4',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapGitHub(github, tracker);
    await wrapped.chat.completions.create({
      model: 'Phi-4',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const github = makeGitHubClient({ model: 'gpt-4o' });
    const wrapped = wrapGitHub(github, tracker);
    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const github = makeGitHubClient({
      model: 'Mistral-Nemo',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapGitHub(github, tracker);
    await wrapped.chat.completions.create(
      { model: 'Mistral-Nemo', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (github.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const github = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapGitHub(github, tracker);
    await (wrapped as typeof github).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
