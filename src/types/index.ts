// LLMeter Types

export type Plan = 'free' | 'pro' | 'team' | 'enterprise';
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'deepseek';
export type ProviderStatus = 'active' | 'error' | 'disconnected' | 'syncing';
export type AlertType = 'budget_limit' | 'anomaly' | 'daily_threshold';
export type SuggestionStatus = 'pending' | 'applied' | 'dismissed';

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  provider: ProviderType;
  display_name: string | null;
  status: ProviderStatus;
  last_sync_at: string | null;
  created_at: string;
  // api_key_encrypted never exposed to client
}

export interface UsageRecord {
  id: number;
  provider_id: string;
  user_id: string;
  date: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  requests: number;
  cost_usd: number;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  config: {
    threshold: number;
    period: 'daily' | 'monthly';
    providers?: string[];
  };
  enabled: boolean;
  created_at: string;
}

export interface AlertEvent {
  id: number;
  alert_id: string;
  user_id: string;
  message: string;
  data: Record<string, unknown>;
  sent_at: string;
}

export interface OptimizationSuggestion {
  id: string;
  user_id: string;
  model_current: string;
  model_suggested: string;
  monthly_requests: number;
  current_cost_usd: number;
  suggested_cost_usd: number;
  savings_pct: number;
  reasoning: string;
  status: SuggestionStatus;
  created_at: string;
}

// Dashboard aggregated types
export interface SpendSummary {
  total_spend: number;
  previous_period_spend: number;
  change_pct: number;
  by_provider: {
    provider: ProviderType;
    display_name: string;
    spend: number;
    pct: number;
  }[];
  by_model: {
    model: string;
    provider: ProviderType;
    spend: number;
    requests: number;
    pct: number;
  }[];
}

export interface DailySpend {
  date: string;
  total: number;
  by_provider: Record<ProviderType, number>;
}

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  description: string;
  icon: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    helpText: string;
    helpUrl: string;
  }[];
}
