/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertTriggeredBanner } from './alert-triggered-banner';

// Mock next/navigation
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const DISMISS_KEY = 'llmeter_alert_banner_dismissed_at';

function makeEvent(overrides: Partial<{ id: number; message: string; sent_at: string; data: Record<string, unknown> }> = {}) {
  return {
    id: 1,
    message: 'Budget alert triggered: $52.30 exceeded $50.00 threshold',
    sent_at: new Date().toISOString(),
    data: { alertType: 'budget_limit' },
    ...overrides,
  };
}

describe('AlertTriggeredBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing when events array is empty', () => {
    const { container } = render(<AlertTriggeredBanner events={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders banner with single alert event', () => {
    render(<AlertTriggeredBanner events={[makeEvent()]} />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('1 alert triggered')).toBeDefined();
    expect(screen.getByText(/Budget alert triggered/)).toBeDefined();
  });

  it('renders banner with multiple alert events and shows count', () => {
    const events = [
      makeEvent({ id: 1, message: 'First alert' }),
      makeEvent({ id: 2, message: 'Second alert' }),
      makeEvent({ id: 3, message: 'Third alert' }),
    ];
    render(<AlertTriggeredBanner events={events} />);
    expect(screen.getByText('3 alerts triggered')).toBeDefined();
    // Shows the latest (first) event message
    expect(screen.getByText('First alert')).toBeDefined();
  });

  it('has a link to the alerts page', () => {
    render(<AlertTriggeredBanner events={[makeEvent()]} />);
    const link = screen.getByText(/View alerts/);
    expect(link.closest('a')?.getAttribute('href')).toBe('/alerts');
  });

  it('dismisses banner when X button is clicked', () => {
    render(<AlertTriggeredBanner events={[makeEvent()]} />);
    expect(screen.getByRole('alert')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Dismiss alert banner'));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(localStorage.getItem(DISMISS_KEY)).toBeTruthy();
  });

  it('stays hidden when previously dismissed for the same event', () => {
    const event = makeEvent();
    localStorage.setItem(DISMISS_KEY, event.sent_at);

    const { container } = render(<AlertTriggeredBanner events={[event]} />);
    expect(container.innerHTML).toBe('');
  });

  it('reappears when a newer event arrives after dismissal', () => {
    const oldTime = new Date(Date.now() - 60_000).toISOString();
    localStorage.setItem(DISMISS_KEY, oldTime);

    const newerEvent = makeEvent({ sent_at: new Date().toISOString() });
    render(<AlertTriggeredBanner events={[newerEvent]} />);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('shows time label for recent events', () => {
    render(<AlertTriggeredBanner events={[makeEvent()]} />);
    expect(screen.getByText(/less than an hour ago/)).toBeDefined();
  });

  it('shows hours ago for older events', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString();
    render(<AlertTriggeredBanner events={[makeEvent({ sent_at: threeHoursAgo })]} />);
    expect(screen.getByText(/3h ago/)).toBeDefined();
  });
});
