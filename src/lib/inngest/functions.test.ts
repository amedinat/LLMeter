import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pollUsage, checkAlerts } from './functions';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdapter } from '@/lib/providers/registry';
import { decryptFromDB } from '@/lib/crypto';
import { sendAlertEmail } from '@/lib/email/send-alert';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));
vi.mock('@/lib/providers/registry', () => ({
  getAdapter: vi.fn(),
}));
vi.mock('@/lib/crypto', () => ({
  decryptFromDB: vi.fn(),
}));
vi.mock('@/lib/email/send-alert', () => ({
  sendAlertEmail: vi.fn(),
}));

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const mockStep = {
  run: vi.fn(async (name, fn) => fn()),
};

describe('Inngest Functions', () => {
  let mockSupabase: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // specific responses store
    let nextResponse: any = { data: [], error: null };
    const setNextResponse = (res: any) => { nextResponse = res; };

    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: (resolve: any) => resolve(nextResponse),
    };

    mockSupabase = {
      from: vi.fn(() => mockQueryBuilder),
      _setNextResponse: setNextResponse,
    };

    (createAdminClient as any).mockReturnValue(mockSupabase);
    (decryptFromDB as any).mockReturnValue('sk-decrypted');
  });

  describe('pollUsage', () => {
    it('skips if no active providers', async () => {
      mockSupabase._setNextResponse({ data: [], error: null });

      // @ts-ignore
      const handler = pollUsage.fn;
      const result = await handler({ step: mockStep, logger: mockLogger });

      expect(result.polled).toBe(0);
      expect(mockLogger.info).toHaveBeenCalledWith('No active providers to poll');
    });

    it('polls usage for active providers', async () => {
      const mockProvider = { id: 'p1', provider: 'openai', user_id: 'u1' };
      
      // We need to queue responses because multiple queries happen.
      // But my simple mock only has one "nextResponse". 
      // I'll make `then` shift from a queue if array, or return single.
      
      const responses = [
        { data: [mockProvider], error: null }, // fetch active providers
        { error: null }, // upsert usage
        { error: null }, // update provider
      ];
      
      let responseIndex = 0;
      mockQueryBuilder.then = (resolve: any) => {
        const res = responses[responseIndex] || { data: [], error: null };
        responseIndex++;
        resolve(res);
      };

      const mockAdapter = {
        fetchUsage: vi.fn().mockResolvedValue([
          { date: '2024-01-01', model: 'gpt-4', inputTokens: 10, outputTokens: 20, costUsd: 0.05 }
        ]),
      };
      (getAdapter as any).mockReturnValue(mockAdapter);

      // @ts-ignore
      const handler = pollUsage.fn;
      const result = await handler({ step: mockStep, logger: mockLogger });

      expect(result.succeeded).toBe(1);
      expect(mockAdapter.fetchUsage).toHaveBeenCalled();
    });

    it('handles adapter errors gracefully', async () => {
       const responses = [
        { data: [{ id: 'p1', provider: 'openai' }], error: null }, // fetch
        { error: null }, // update error status
      ];
      let responseIndex = 0;
      mockQueryBuilder.then = (resolve: any) => {
        const res = responses[responseIndex] || { data: [], error: null };
        responseIndex++;
        resolve(res);
      };

      const mockAdapter = {
        fetchUsage: vi.fn().mockRejectedValue(new Error('API Error')),
      };
      (getAdapter as any).mockReturnValue(mockAdapter);

      // @ts-ignore
      const handler = pollUsage.fn;
      const result = await handler({ step: mockStep, logger: mockLogger });

      expect(result.failed).toBe(1);
    });
  });

  describe('checkAlerts', () => {
    it('triggers alert if spend exceeds threshold', async () => {
       const responses = [
        { data: [{ id: 'a1', user_id: 'u1', config: { threshold: 10, period: 'daily' }, enabled: true }], error: null }, // alerts
        { data: [{ cost_usd: 15 }], error: null }, // usage sum
        { data: [], error: null }, // top contributors
        { error: null }, // insert event
        { error: null }, // update alert
      ];
      let responseIndex = 0;
      mockQueryBuilder.then = (resolve: any) => {
        const res = responses[responseIndex] || { data: [], error: null };
        responseIndex++;
        resolve(res);
      };

      (sendAlertEmail as any).mockResolvedValue(true);

      // @ts-ignore
      const handler = checkAlerts.fn;
      const result = await handler({ step: mockStep, logger: mockLogger });

      expect(result.triggered).toBe(1);
      expect(sendAlertEmail).toHaveBeenCalled();
    });

    it('does not trigger if spend is below threshold', async () => {
       const responses = [
        { data: [{ id: 'a1', user_id: 'u1', config: { threshold: 100, period: 'daily' }, enabled: true }], error: null }, // alerts
        { data: [{ cost_usd: 15 }], error: null }, // usage sum
      ];
      let responseIndex = 0;
      mockQueryBuilder.then = (resolve: any) => {
        const res = responses[responseIndex] || { data: [], error: null };
        responseIndex++;
        resolve(res);
      };

      // @ts-ignore
      const handler = checkAlerts.fn;
      const result = await handler({ step: mockStep, logger: mockLogger });

      expect(result.triggered).toBe(0);
      expect(sendAlertEmail).not.toHaveBeenCalled();
    });
  });
});
