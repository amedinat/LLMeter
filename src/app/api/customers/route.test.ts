import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetCustomersSummary = vi.fn();

vi.mock('@/features/customers/server/queries', () => ({
  getCustomersSummary: (...args: unknown[]) => mockGetCustomersSummary(...args),
}));

// --- Helpers ---

function makeRequest(params?: Record<string, string>): Request {
  const url = new URL('http://localhost/api/customers');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new Request(url.toString(), { method: 'GET' });
}

let GET: (req: Request) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetCustomersSummary.mockResolvedValue([]);
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/customers', () => {
  it('returns customer list with 200', async () => {
    const mockCustomers = [
      { customer_id: 'cust-1', display_name: 'Acme', total_cost: 12.50, total_input_tokens: 1000, total_output_tokens: 500, request_count: 10, last_active: '2026-04-01T00:00:00Z' },
      { customer_id: 'cust-2', display_name: null, total_cost: 5.25, total_input_tokens: 500, total_output_tokens: 200, request_count: 5, last_active: '2026-04-02T00:00:00Z' },
    ];
    mockGetCustomersSummary.mockResolvedValue(mockCustomers);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.customers).toHaveLength(2);
    expect(data.customers[0].customer_id).toBe('cust-1');
  });

  it('passes start and end params to query', async () => {
    await GET(makeRequest({ start: '2026-03-01', end: '2026-03-31' }));
    expect(mockGetCustomersSummary).toHaveBeenCalledWith('2026-03-01', '2026-03-31');
  });

  it('passes undefined when params are missing', async () => {
    await GET(makeRequest());
    expect(mockGetCustomersSummary).toHaveBeenCalledWith(undefined, undefined);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetCustomersSummary.mockRejectedValue(new Error('User not authenticated'));

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCustomersSummary.mockRejectedValue(new Error('DB connection lost'));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Internal server error');
  });

  it('returns empty array when no customers', async () => {
    mockGetCustomersSummary.mockResolvedValue([]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.customers).toEqual([]);
  });
});
