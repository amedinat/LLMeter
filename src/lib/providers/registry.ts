import type { ProviderType } from '@/types';
import type { ProviderAdapter } from './types';

/**
 * Provider adapter registry.
 * Adapters are registered here and looked up by provider type.
 */
const adapters = new Map<ProviderType, ProviderAdapter>();

export function registerAdapter(adapter: ProviderAdapter) {
  adapters.set(adapter.type, adapter);
}

export function getAdapter(type: ProviderType): ProviderAdapter {
  const adapter = adapters.get(type);
  if (!adapter) {
    throw new Error(`No adapter registered for provider: ${type}`);
  }
  return adapter;
}

export function getRegisteredProviders(): ProviderType[] {
  return Array.from(adapters.keys());
}
