import { describe, it, expect } from 'vitest';
import { connectProviderSchema, updateProviderSchema } from './provider';

describe('connectProviderSchema', () => {
  it('accepts valid openai provider', () => {
    const result = connectProviderSchema.safeParse({
      provider: 'openai',
      apiKey: 'sk-1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid anthropic provider with display name', () => {
    const result = connectProviderSchema.safeParse({
      provider: 'anthropic',
      apiKey: 'sk-ant-1234567890',
      displayName: 'My Anthropic Key',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown provider type', () => {
    const result = connectProviderSchema.safeParse({
      provider: 'mistral',
      apiKey: 'sk-1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('rejects API key shorter than 10 chars', () => {
    const result = connectProviderSchema.safeParse({
      provider: 'openai',
      apiKey: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('too short');
    }
  });

  it('rejects API key longer than 500 chars', () => {
    const result = connectProviderSchema.safeParse({
      provider: 'openai',
      apiKey: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from API key', () => {
    const result = connectProviderSchema.safeParse({
      provider: 'openai',
      apiKey: '  sk-1234567890  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apiKey).toBe('sk-1234567890');
    }
  });

  it('rejects missing provider', () => {
    const result = connectProviderSchema.safeParse({
      apiKey: 'sk-1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing apiKey', () => {
    const result = connectProviderSchema.safeParse({
      provider: 'openai',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid provider types', () => {
    for (const provider of ['openai', 'anthropic', 'deepseek', 'openrouter']) {
      const result = connectProviderSchema.safeParse({
        provider,
        apiKey: 'sk-valid-key-123',
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateProviderSchema', () => {
  it('accepts valid update with displayName', () => {
    const result = updateProviderSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      displayName: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid update with new apiKey', () => {
    const result = updateProviderSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      apiKey: 'sk-new-key-12345',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for id', () => {
    const result = updateProviderSchema.safeParse({
      id: 'not-a-uuid',
      displayName: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects update with short apiKey', () => {
    const result = updateProviderSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      apiKey: 'short',
    });
    expect(result.success).toBe(false);
  });
});
