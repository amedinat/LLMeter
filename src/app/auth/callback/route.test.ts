import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    },
  }),
}));

vi.mock('@/lib/security', () => ({
  safeRedirect: vi.fn((url: string | null) => url || '/dashboard'),
}));

import { GET } from './route';

function createRequest(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers });
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges code for session and redirects to dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const request = createRequest(
      'https://llmeter-dun.vercel.app/auth/callback?code=test-code&next=/dashboard',
      { 'x-forwarded-host': 'llmeter-dun.vercel.app' }
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://llmeter-dun.vercel.app/dashboard');
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code');
  });

  it('handles token_hash + type flow (magic link OTP)', async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const request = createRequest(
      'https://llmeter-dun.vercel.app/auth/callback?token_hash=abc123&type=magiclink&next=/dashboard',
      { 'x-forwarded-host': 'llmeter-dun.vercel.app' }
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://llmeter-dun.vercel.app/dashboard');
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: 'abc123',
      type: 'magiclink',
    });
  });

  it('redirects to login with error when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: 'Invalid code' },
    });

    const request = createRequest(
      'https://llmeter-dun.vercel.app/auth/callback?code=bad-code',
      { 'x-forwarded-host': 'llmeter-dun.vercel.app' }
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login?error=');
  });

  it('redirects to login when no code or token_hash provided', async () => {
    const request = createRequest(
      'https://llmeter-dun.vercel.app/auth/callback',
      { 'x-forwarded-host': 'llmeter-dun.vercel.app' }
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login?error=');
  });

  it('uses origin when no x-forwarded-host in dev', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const request = createRequest(
      'http://localhost:3000/auth/callback?code=test-code&next=/dashboard'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');

    process.env.NODE_ENV = originalEnv;
  });

  it('propagates error_description from URL params', async () => {
    const request = createRequest(
      'https://llmeter-dun.vercel.app/auth/callback?error_description=Email+link+is+invalid',
      { 'x-forwarded-host': 'llmeter-dun.vercel.app' }
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('Email%20link%20is%20invalid');
  });
});
