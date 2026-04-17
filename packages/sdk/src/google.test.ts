import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapGoogleAI } from './google.js';

// Minimal GoogleGenerativeAI-shaped client
function makeGoogleClient(modelName: string, usageMetadata?: Record<string, number>) {
  const fakeResponse = {
    response: {
      usageMetadata,
    },
  };

  const fakeModel = {
    generateContent: vi.fn().mockResolvedValue(fakeResponse),
  };

  return {
    client: {
      getGenerativeModel: vi.fn().mockReturnValue(fakeModel),
    },
    fakeModel,
    modelName,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapGoogleAI', () => {
  it('tracks usage from a generateContent call', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const { client } = makeGoogleClient('gemini-1.5-pro', {
      promptTokenCount: 200,
      candidatesTokenCount: 450,
    });

    const wrapped = wrapGoogleAI(client, tracker);
    const model = wrapped.getGenerativeModel({ model: 'gemini-1.5-pro' });
    await model.generateContent('Hello, Gemini!');

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'gemini-1.5-pro',
      inputTokens: 200,
      outputTokens: 450,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const { client } = makeGoogleClient('gemini-2.0-flash', {
      promptTokenCount: 80,
      candidatesTokenCount: 120,
    });

    const wrapped = wrapGoogleAI(client, tracker, 'default_user');
    const model = wrapped.getGenerativeModel({ model: 'gemini-2.0-flash' });
    await model.generateContent('Summarize this', { llmeter_customer_id: 'org_xyz' });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'org_xyz' })
    );
  });

  it('falls back to defaultCustomerId when no llmeter_customer_id in options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const { client } = makeGoogleClient('gemini-1.5-flash', {
      promptTokenCount: 50,
      candidatesTokenCount: 70,
    });

    const wrapped = wrapGoogleAI(client, tracker, 'team_default');
    const model = wrapped.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('Hello');

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'team_default' })
    );
  });

  it('does not forward llmeter_customer_id to the real SDK generateContent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const { client, fakeModel } = makeGoogleClient('gemini-1.5-pro', {
      promptTokenCount: 10,
      candidatesTokenCount: 20,
    });

    const wrapped = wrapGoogleAI(client, tracker);
    const model = wrapped.getGenerativeModel({ model: 'gemini-1.5-pro' });
    await model.generateContent('Hello', { llmeter_customer_id: 'u1' });

    // The real generateContent should only receive the request content, not llmeter options
    expect(fakeModel.generateContent).toHaveBeenCalledWith('Hello');
    expect(fakeModel.generateContent).toHaveBeenCalledTimes(1);
  });

  it('skips tracking when response has no usageMetadata', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const { client } = makeGoogleClient('gemini-1.5-pro'); // no usageMetadata

    const wrapped = wrapGoogleAI(client, tracker);
    const model = wrapped.getGenerativeModel({ model: 'gemini-1.5-pro' });
    await model.generateContent('Hello');

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('handles partial usageMetadata gracefully (missing promptTokenCount)', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const { client } = makeGoogleClient('gemini-1.5-pro', {
      // Only candidatesTokenCount present — promptTokenCount missing
      candidatesTokenCount: 100,
    });

    const wrapped = wrapGoogleAI(client, tracker);
    const model = wrapped.getGenerativeModel({ model: 'gemini-1.5-pro' });
    await model.generateContent('Hello');

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ inputTokens: 0, outputTokens: 100 })
    );
  });

  it('proxies getGenerativeModel config to the real SDK', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const { client } = makeGoogleClient('gemini-1.5-pro', {
      promptTokenCount: 10,
      candidatesTokenCount: 10,
    });

    const wrapped = wrapGoogleAI(client, tracker);
    wrapped.getGenerativeModel({ model: 'gemini-1.5-pro', generationConfig: { maxOutputTokens: 512 } });

    expect(client.getGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-1.5-pro', generationConfig: { maxOutputTokens: 512 } }),
      undefined
    );
  });
});
