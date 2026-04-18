import type { ProviderType } from '@/types';
import type { ProviderAdapter } from './types';
import { openaiAdapter } from './openai-adapter';
import { anthropicAdapter } from './anthropic-adapter';
// google-adapter exists but is disabled — Google AI doesn't have a public usage API yet
import { deepseekAdapter } from './deepseek-adapter';
import { openrouterAdapter } from './openrouter-adapter';
import { mistralAdapter } from './mistral-adapter';
import { azureAdapter } from './azure-adapter';

/**
 * Provider adapter registry.
 * Adapters are registered here and looked up by provider type.
 * Note: Google AI is excluded — no public usage/billing API available.
 */
const adapters = new Map<ProviderType, ProviderAdapter>();

// Register built-in adapters
adapters.set('openai', openaiAdapter);
adapters.set('anthropic', anthropicAdapter);
adapters.set('deepseek', deepseekAdapter);
adapters.set('openrouter', openrouterAdapter);
adapters.set('mistral', mistralAdapter);
adapters.set('azure', azureAdapter);

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
