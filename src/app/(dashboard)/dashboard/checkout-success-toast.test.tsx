// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { CheckoutSuccessToast } from './checkout-success-toast';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({ replace: mockReplace }),
}));

import { useSearchParams } from 'next/navigation';

describe('CheckoutSuccessToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up window.location for URL manipulation
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/dashboard?checkout=success' },
      writable: true,
    });
  });

  it('fires success toast when checkout=success param is present', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'checkout' ? 'success' : null),
    } as ReturnType<typeof useSearchParams>);

    render(<CheckoutSuccessToast />);

    expect(toast.success).toHaveBeenCalledWith(
      'Subscription activated!',
      expect.objectContaining({ description: expect.stringContaining('plan') })
    );
  });

  it('clears checkout param from URL after showing toast', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'checkout' ? 'success' : null),
    } as ReturnType<typeof useSearchParams>);

    render(<CheckoutSuccessToast />);

    expect(mockReplace).toHaveBeenCalled();
    const calledWith = mockReplace.mock.calls[0][0] as string;
    expect(calledWith).not.toContain('checkout=success');
  });

  it('does not fire toast when checkout param is absent', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: () => null,
    } as unknown as ReturnType<typeof useSearchParams>);

    render(<CheckoutSuccessToast />);

    expect(toast.success).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not fire toast when checkout param has unexpected value', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'checkout' ? 'failed' : null),
    } as ReturnType<typeof useSearchParams>);

    render(<CheckoutSuccessToast />);

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('renders nothing visible (null return)', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: () => null,
    } as unknown as ReturnType<typeof useSearchParams>);

    const { container } = render(<CheckoutSuccessToast />);
    expect(container.firstChild).toBeNull();
  });
});
