import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendAlertEmail } from './send-alert';
import { getResendClient } from './client';
import { createAdminClient } from '@/lib/supabase/admin';

// Mock dependencies
vi.mock('./client', () => ({
  getResendClient: vi.fn(),
  EMAIL_FROM: 'test@example.com',
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

// Mock react-email/components render
vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html>Mock Email</html>'),
  Body: vi.fn(),
  Container: vi.fn(),
  Head: vi.fn(),
  Heading: vi.fn(),
  Hr: vi.fn(),
  Html: vi.fn(),
  Preview: vi.fn(),
  Section: vi.fn(),
  Text: vi.fn(),
}));

describe('sendAlertEmail', () => {
  const mockResend = {
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null }),
    },
  };

  const mockSupabase = {
    auth: {
      admin: {
        getUserById: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getResendClient as any).mockReturnValue(mockResend);
    (createAdminClient as any).mockReturnValue(mockSupabase);
  });

  it('skips sending if Resend client is not available', async () => {
    (getResendClient as any).mockReturnValue(null);
    const result = await sendAlertEmail({
      userId: 'user_123',
      alertType: 'daily',
      currentSpend: 100,
      threshold: 50,
    });
    expect(result).toBe(false);
    expect(mockResend.emails.send).not.toHaveBeenCalled();
  });

  it('skips sending if user email is not found', async () => {
    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await sendAlertEmail({
      userId: 'user_123',
      alertType: 'daily',
      currentSpend: 100,
      threshold: 50,
    });

    expect(result).toBe(false);
    expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith('user_123');
    expect(mockResend.emails.send).not.toHaveBeenCalled();
  });

  it('sends email successfully when user and client are valid', async () => {
    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'john@example.com' } },
      error: null,
    });

    const result = await sendAlertEmail({
      userId: 'user_123',
      alertType: 'daily',
      currentSpend: 100,
      threshold: 50,
      topContributors: [
        { model: 'gpt-4', provider: 'openai', cost: 80 },
        { model: 'claude-3', provider: 'anthropic', cost: 20 },
      ],
    });

    expect(result).toBe(true);
    expect(mockResend.emails.send).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'john@example.com',
      subject: '⚠️ Alerta LLMeter: Gasto Diario excedió $50.00',
      html: '<html>Mock Email</html>',
    });
  });

  it('returns false if Resend send fails', async () => {
    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'john@example.com' } },
      error: null,
    });

    mockResend.emails.send.mockResolvedValue({
      data: null,
      error: { message: 'API Error' },
    });

    const result = await sendAlertEmail({
      userId: 'user_123',
      alertType: 'monthly',
      currentSpend: 1000,
      threshold: 500,
    });

    expect(result).toBe(false);
  });
});
