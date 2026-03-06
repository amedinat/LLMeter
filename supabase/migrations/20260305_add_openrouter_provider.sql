-- Add 'openrouter' to the provider check constraint
-- This allows users to add OpenRouter as an LLM provider
ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_provider_check;
ALTER TABLE providers ADD CONSTRAINT providers_provider_check CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek', 'openrouter'));
