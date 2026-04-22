// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { PricingCheckout } from './pricing-checkout';

const { mockGetSession, mockGetPaddleInstance, mockPaddleOpen, mockFetch } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockPaddleOpen: vi.fn(),
  mockGetPaddleInstance: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession: mockGetSession },
  }),
}));

vi.mock('@/lib/payments-client', () => ({
  getPaddleInstance: mockGetPaddleInstance,
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mockFetch,
}));

const originalLocation = window.location;

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { href: '', origin: 'https://example.com' },
  });
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
});

const defaultProps = {
  planId: 'pro',
  cta: 'Start Free Trial',
  ctaVariant: 'default' as const,
};

describe('PricingCheckout', () => {
  it('renders the CTA label', () => {
    render(<PricingCheckout {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Start Free Trial' })).toBeTruthy();
  });

  it('redirects unauthenticated users to /login?plan=<planId>', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<PricingCheckout {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(window.location.href).toBe('/login?plan=pro');
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockGetPaddleInstance).not.toHaveBeenCalled();
  });

  it('opens Paddle overlay with customData.user_id from /api/checkout when authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user_42', email: 'u@example.com' } } },
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        priceId: 'pri_pro_123',
        customerEmail: 'u@example.com',
        customData: { user_id: 'user_42' },
      }),
    } as unknown as Response);
    const paddle = { Checkout: { open: mockPaddleOpen } };
    mockGetPaddleInstance.mockResolvedValue(paddle);

    render(<PricingCheckout {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockPaddleOpen).toHaveBeenCalledWith({
        items: [{ priceId: 'pri_pro_123', quantity: 1 }],
        customer: { email: 'u@example.com' },
        customData: { user_id: 'user_42' },
        settings: {
          successUrl: 'https://example.com/dashboard?checkout=success',
        },
      });
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/checkout', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    }));
  });

  it('redirects to /login when /api/checkout fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user_42', email: 'u@example.com' } } },
    });
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    } as unknown as Response);

    render(<PricingCheckout {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    });
    expect(mockPaddleOpen).not.toHaveBeenCalled();
  });

  it('auto-triggers checkout when autoTrigger=true and user is authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user_42', email: 'u@example.com' } } },
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        priceId: 'pri_pro_123',
        customerEmail: 'u@example.com',
        customData: { user_id: 'user_42' },
      }),
    } as unknown as Response);
    const paddle = { Checkout: { open: mockPaddleOpen } };
    mockGetPaddleInstance.mockResolvedValue(paddle);

    render(<PricingCheckout {...defaultProps} autoTrigger={true} />);

    await waitFor(() => {
      expect(mockPaddleOpen).toHaveBeenCalled();
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/checkout', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    }));
  });

  it('does not auto-trigger when autoTrigger is false', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user_42', email: 'u@example.com' } } },
    });
    render(<PricingCheckout {...defaultProps} autoTrigger={false} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPaddleOpen).not.toHaveBeenCalled();
  });

  it('shows Loading... while processing', async () => {
    mockGetSession.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 50)),
    );

    render(<PricingCheckout {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    const btn = screen.getByRole('button');
    expect(btn.textContent).toBe('Loading...');
    expect((btn as HTMLButtonElement).disabled).toBe(true);

    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toBe('Start Free Trial');
    });
  });
});
