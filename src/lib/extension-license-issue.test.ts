import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PaddleTransactionEventBody } from './extension-license';
import { hashLicenseKey, isValidLicenseKeyFormat } from './extension-license';

// --- Mocks ---

const mockEncrypt = vi.fn();
vi.mock('@/lib/crypto', () => ({
  encrypt: (...args: unknown[]) => mockEncrypt(...args),
}));

const mockSendEmail = vi.fn();
vi.mock('@/lib/email/send-extension-license', () => ({
  sendExtensionLicenseEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

const mockTrack = vi.fn();
vi.mock('@/lib/saas-pulse', () => ({
  pulseTrack: (...args: unknown[]) => mockTrack(...args),
}));

// Paddle SDK is never constructed in tests: lookupEmail is always injected.
vi.mock('@paddle/paddle-node-sdk', () => ({
  Paddle: vi.fn(),
  Environment: { sandbox: 'sandbox', production: 'production' },
}));

let existingLookup: { data: unknown; error: { message: string } | null };
const insertSpy = vi.fn();
let insertResult: { error: { code?: string; message: string } | null };

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(existingLookup));
      chain.insert = vi.fn().mockImplementation((row: unknown) => {
        insertSpy(row);
        return Promise.resolve(insertResult);
      });
      return chain;
    },
  }),
}));

// --- Helpers ---

const body: PaddleTransactionEventBody = {
  event_type: 'transaction.completed',
  data: {
    id: 'txn_1',
    customer_id: 'ctm_1',
    custom_data: { email: 'fallback@example.com' },
    items: [{ price: { id: 'pri_ext_ltd' } }],
  },
};

describe('issueExtensionLicense', () => {
  let issueExtensionLicense: typeof import('./extension-license-issue').issueExtensionLicense;

  beforeEach(async () => {
    vi.clearAllMocks();
    existingLookup = { data: null, error: null };
    insertResult = { error: null };
    mockEncrypt.mockReturnValue({ encrypted: 'x', iv: 'y', tag: 'z', salt: 'w' });
    mockSendEmail.mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    issueExtensionLicense = (await import('./extension-license-issue')).issueExtensionLicense;
  });

  it('happy path: stores hash + encrypted key, prefers the Paddle customer email, emails it', async () => {
    const lookupEmail = vi.fn().mockResolvedValue('Paddle@Example.com');
    const result = await issueExtensionLicense(body, { lookupEmail });

    expect(result).toMatchObject({ issued: true, emailed: true });
    expect(result.last4).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);

    const row = insertSpy.mock.calls[0]![0];
    expect(row.email).toBe('paddle@example.com');
    expect(row.paddle_transaction_id).toBe('txn_1');
    expect(row.paddle_customer_id).toBe('ctm_1');
    expect(row.key_encrypted).toEqual({ encrypted: 'x', iv: 'y', tag: 'z', salt: 'w' });
    expect(row.key_hash).toMatch(/^[0-9a-f]{64}$/);

    const sentKey = mockSendEmail.mock.calls[0]![0].licenseKey as string;
    expect(isValidLicenseKeyFormat(sentKey)).toBe(true);
    expect(hashLicenseKey(sentKey)).toBe(row.key_hash);
    expect(sentKey.endsWith(result.last4!)).toBe(true);
    expect(mockSendEmail.mock.calls[0]![0].email).toBe('paddle@example.com');
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('falls back to custom_data.email when Paddle has no email', async () => {
    const lookupEmail = vi.fn().mockResolvedValue(null);
    await issueExtensionLicense(body, { lookupEmail });
    expect(insertSpy.mock.calls[0]![0].email).toBe('fallback@example.com');
    expect(mockSendEmail.mock.calls[0]![0].email).toBe('fallback@example.com');
  });

  it('dedupes on an existing transaction without inserting or emailing', async () => {
    existingLookup = { data: { id: 'lic_1', key_last4: 'ZZZZ' }, error: null };
    const result = await issueExtensionLicense(body, { lookupEmail: vi.fn() });
    expect(result).toEqual({ issued: false, duplicate: true, emailed: false, last4: 'ZZZZ' });
    expect(insertSpy).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('treats a unique violation (23505) as a duplicate', async () => {
    insertResult = { error: { code: '23505', message: 'duplicate key' } };
    const result = await issueExtensionLicense(body, { lookupEmail: vi.fn().mockResolvedValue(null) });
    expect(result).toMatchObject({ issued: false, duplicate: true });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('throws when encryption fails so the webhook returns 500 and Paddle retries', async () => {
    mockEncrypt.mockImplementation(() => {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    });
    await expect(
      issueExtensionLicense(body, { lookupEmail: vi.fn().mockResolvedValue(null) }),
    ).rejects.toThrow(/encryption failed/);
    expect(insertSpy).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('throws on other insert errors', async () => {
    insertResult = { error: { message: 'relation does not exist' } };
    await expect(
      issueExtensionLicense(body, { lookupEmail: vi.fn().mockResolvedValue(null) }),
    ).rejects.toThrow(/insert failed/);
  });

  it('when the email fails: still succeeds (key is recoverable) and raises an alert', async () => {
    mockSendEmail.mockResolvedValue(false);
    const result = await issueExtensionLicense(body, { lookupEmail: vi.fn().mockResolvedValue('a@b.co') });

    expect(result).toMatchObject({ issued: true, emailed: false });
    expect(mockTrack).toHaveBeenCalledWith('extension_license_email_failed', {
      user_ref: 'ctm_1',
      metadata: { transaction_id: 'txn_1', last4: result.last4, has_email: true },
    });
    const logged = (console.error as ReturnType<typeof vi.fn>).mock.calls.map((c) => c.join(' ')).join('\n');
    expect(logged).toContain('txn_1');
    expect(logged).toContain(result.last4!);
    // Never leak the full key.
    const sentKey = mockSendEmail.mock.calls[0]![0].licenseKey as string;
    expect(logged).not.toContain(sentKey);
  });

  it('alerts when no buyer email can be found at all', async () => {
    const noEmailBody: PaddleTransactionEventBody = {
      ...body,
      data: { ...body.data, custom_data: null },
    };
    const result = await issueExtensionLicense(noEmailBody, { lookupEmail: vi.fn().mockResolvedValue(null) });
    expect(result).toMatchObject({ issued: true, emailed: false });
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith(
      'extension_license_email_failed',
      expect.objectContaining({ metadata: expect.objectContaining({ has_email: false }) }),
    );
  });
});
