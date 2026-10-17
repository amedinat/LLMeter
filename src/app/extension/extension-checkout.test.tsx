// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { mockGetPaddleInstance, mockPaddleOpen } = vi.hoisted(() => ({
  mockGetPaddleInstance: vi.fn(),
  mockPaddleOpen: vi.fn(),
}));

vi.mock('@/lib/payments-client', () => ({
  getPaddleInstance: mockGetPaddleInstance,
}));

async function loadWithPrice(priceId: string | undefined) {
  vi.resetModules();
  if (priceId) process.env.NEXT_PUBLIC_PADDLE_EXT_LTD_PRICE_ID = priceId;
  else delete process.env.NEXT_PUBLIC_PADDLE_EXT_LTD_PRICE_ID;
  const mod = await import('./extension-checkout');
  return mod.ExtensionCheckout;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockGetPaddleInstance.mockResolvedValue({ Checkout: { open: mockPaddleOpen } });
});

afterEach(() => {
  cleanup();
});

describe('ExtensionCheckout', () => {
  it('opens Paddle directly with the public price id and passes the email as custom_data', async () => {
    const ExtensionCheckout = await loadWithPrice('pri_ext_ltd');
    render(<ExtensionCheckout price="$29" />);

    fireEvent.change(screen.getByLabelText('Email for the license key'), {
      target: { value: '  Buyer@Example.com ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Get Pro — $29' }));

    await waitFor(() => expect(mockPaddleOpen).toHaveBeenCalledTimes(1));
    const args = mockPaddleOpen.mock.calls[0]![0];
    expect(args.items).toEqual([{ priceId: 'pri_ext_ltd', quantity: 1 }]);
    expect(args.customer).toEqual({ email: 'buyer@example.com' });
    expect(args.customData).toEqual({ email: 'buyer@example.com', product: 'extension-ltd' });
    expect(args.settings.successUrl).toMatch(/\/extension\?checkout=success$/);
  });

  it('works without an email (Paddle collects it in the overlay)', async () => {
    const ExtensionCheckout = await loadWithPrice('pri_ext_ltd');
    render(<ExtensionCheckout />);
    fireEvent.click(screen.getByRole('button', { name: 'Get Pro — $29' }));
    await waitFor(() => expect(mockPaddleOpen).toHaveBeenCalledTimes(1));
    expect(mockPaddleOpen.mock.calls[0]![0].customer).toBeUndefined();
  });

  it('rejects a malformed email before opening checkout', async () => {
    const ExtensionCheckout = await loadWithPrice('pri_ext_ltd');
    render(<ExtensionCheckout />);
    fireEvent.change(screen.getByLabelText('Email for the license key'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get Pro — $29' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(mockPaddleOpen).not.toHaveBeenCalled();
  });

  it('is disabled when the price id is not configured', async () => {
    const ExtensionCheckout = await loadWithPrice(undefined);
    render(<ExtensionCheckout />);
    const btn = screen.getByRole('button', { name: 'Get Pro — $29' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText('Pro licenses open soon.')).toBeTruthy();
  });
});
