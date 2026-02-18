import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module directly (avoids Resend constructor issues)
const mockSend = vi.fn();
vi.mock('./client', () => ({
  getResendClient: vi.fn(),
  EMAIL_FROM: 'LLMeter <test@llmeter.dev>',
}));

// Mock Supabase admin client
const mockGetUserById = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  }),
}));

// Mock @react-email/components render
vi.mock('@react-email/components', async () => {
  const actual = await vi.importActual<typeof import('@react-email/components')>(
    '@react-email/components'
  );
  return {
    ...actual,
    render: vi.fn().mockResolvedValue('<html>mocked</html>'),
  };
});

import { getResendClient } from './client';
import { sendAlertEmail } from './send-alert';

const mockedGetClient = vi.mocked(getResendClient);

describe('sendAlertEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.llmeter.dev');

    // Default: Resend is configured and returns a client with send
    mockedGetClient.mockReturnValue({
      emails: { send: mockSend },
    } as unknown as ReturnType<typeof getResendClient> & object);
  });

  it('sends email when Resend is configured and user has email', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { email: 'john@example.com' } },
      error: null,
    });
    mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const result = await sendAlertEmail({
      userId: 'user-1',
      alertType: 'monthly',
      currentSpend: 120.5,
      threshold: 100,
      topContributors: [
        { model: 'gpt-4o', provider: 'openai', cost: 80.25 },
        { model: 'claude-sonnet-4', provider: 'anthropic', cost: 40.25 },
      ],
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        subject: expect.stringContaining('Mensual'),
      })
    );
  });

  it('returns false when user has no email', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { email: null } },
      error: null,
    });

    const result = await sendAlertEmail({
      userId: 'user-no-email',
      alertType: 'daily',
      currentSpend: 55,
      threshold: 50,
    });

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns false when Resend API fails', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { email: 'john@example.com' } },
      error: null,
    });
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'rate limited' },
    });

    const result = await sendAlertEmail({
      userId: 'user-1',
      alertType: 'monthly',
      currentSpend: 200,
      threshold: 150,
    });

    expect(result).toBe(false);
  });

  it('returns false when Resend is not configured', async () => {
    mockedGetClient.mockReturnValue(null);

    const result = await sendAlertEmail({
      userId: 'user-1',
      alertType: 'daily',
      currentSpend: 60,
      threshold: 50,
    });

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('includes daily label in subject for daily alerts', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { email: 'john@example.com' } },
      error: null,
    });
    mockSend.mockResolvedValue({ data: { id: 'email-2' }, error: null });

    await sendAlertEmail({
      userId: 'user-1',
      alertType: 'daily',
      currentSpend: 75,
      threshold: 50,
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Diario'),
      })
    );
  });
});
