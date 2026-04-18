import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapBedrock } from './bedrock.js';

function makeBedrockClient(response: Record<string, unknown>) {
  return {
    send: vi.fn().mockResolvedValue(response),
  };
}

function makeConverseCommand(modelId: string) {
  return {
    input: {
      modelId,
      messages: [{ role: 'user', content: [{ text: 'Hello' }] }],
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapBedrock', () => {
  it('tracks usage from a ConverseCommand response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bedrock = makeBedrockClient({
      output: { message: { role: 'assistant', content: [{ text: 'Hi!' }] } },
      usage: { inputTokens: 150, outputTokens: 300, totalTokens: 450 },
    });

    const wrapped = wrapBedrock(bedrock, tracker, 'user_abc');
    await wrapped.send(makeConverseCommand('anthropic.claude-3-5-sonnet-20241022-v2:0'));

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      inputTokens: 150,
      outputTokens: 300,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from send options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bedrock = makeBedrockClient({
      usage: { inputTokens: 80, outputTokens: 40, totalTokens: 120 },
    });

    const wrapped = wrapBedrock(bedrock, tracker, 'default_user');
    await wrapped.send(
      makeConverseCommand('meta.llama3-70b-instruct-v1:0'),
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options forwarded to Bedrock', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const bedrock = makeBedrockClient({
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });

    const wrapped = wrapBedrock(bedrock, tracker);
    await wrapped.send(
      makeConverseCommand('amazon.titan-text-express-v1'),
      { llmeter_customer_id: 'u1', abortSignal: undefined }
    );

    const [, passedOptions] = bedrock.send.mock.calls[0] as [
      unknown,
      Record<string, unknown> | undefined,
    ];
    expect(passedOptions).not.toHaveProperty('llmeter_customer_id');
  });

  it('skips tracking when usage is absent (non-Converse command)', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bedrock = makeBedrockClient({ Body: new Uint8Array() });

    const wrapped = wrapBedrock(bedrock, tracker);
    // InvokeModelCommand doesn't have input.modelId at the top level in the response
    await wrapped.send({ input: { modelId: 'amazon.titan-text-express-v1', body: '{}' } });

    // No usage in response → should NOT track
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('falls back to defaultCustomerId when no options provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bedrock = makeBedrockClient({
      usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
    });

    const wrapped = wrapBedrock(bedrock, tracker, 'default_customer');
    await wrapped.send(makeConverseCommand('anthropic.claude-3-haiku-20240307-v1:0'));

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default_customer' })
    );
  });

  it('passes the original command to Bedrock unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const bedrock = makeBedrockClient({
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });

    const command = makeConverseCommand('mistral.mistral-large-2402-v1:0');
    const wrapped = wrapBedrock(bedrock, tracker);
    await wrapped.send(command);

    expect(bedrock.send).toHaveBeenCalledWith(command, undefined);
  });

  it('handles missing outputTokens gracefully', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const bedrock = makeBedrockClient({
      usage: { inputTokens: 100 }, // outputTokens missing
    });

    const wrapped = wrapBedrock(bedrock, tracker);
    await wrapped.send(makeConverseCommand('amazon.nova-pro-v1:0'));

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ inputTokens: 100, outputTokens: 0 })
    );
  });
});
