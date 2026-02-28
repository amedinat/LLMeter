import fs from 'fs';
import path from 'path';

/**
 * Script to refresh LLMeter model pricing from OpenRouter's public API.
 * 
 * Usage: npx ts-node scripts/refresh-pricing.ts
 */

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/model-pricing.ts');

async function fetchOpenRouterPricing() {
  console.log(`Fetching latest pricing from ${OPENROUTER_MODELS_URL}...`);
  const response = await fetch(OPENROUTER_MODELS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch from OpenRouter: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data;
}

function determineProvider(id: string): string {
  if (id.startsWith('anthropic/')) return 'anthropic';
  if (id.startsWith('openai/')) return 'openai';
  if (id.startsWith('deepseek/')) return 'deepseek';
  if (id.startsWith('google/')) return 'google';
  return 'openrouter';
}

function determineTier(id: string, inputPrice: number): string {
  if (inputPrice >= 10) return 'premium';
  if (inputPrice >= 1) return 'standard';
  return 'budget';
}

async function main() {
  try {
    const orModels = await fetchOpenRouterPricing();
    console.log(`Processing ${orModels.length} models...`);

    const timestamp = new Date().toISOString();
    
    // We only care about major providers for now to keep the catalog lean
    const targets = ['anthropic/', 'openai/', 'deepseek/', 'google/'];
    
    const filteredModels = orModels.filter((m: any) => targets.some(t => m.id.startsWith(t)));
    
    const catalogEntries = filteredModels.map((m: any) => {
      const inputPrice = parseFloat(m.pricing.prompt) * 1000000;
      const outputPrice = parseFloat(m.pricing.completion) * 1000000;
      
      return {
        provider: determineProvider(m.id),
        model_id: m.id.split('/')[1],
        display_name: m.name,
        input_price_per_1m_tokens: Number(inputPrice.toFixed(4)),
        output_price_per_1m_tokens: Number(outputPrice.toFixed(4)),
        capability_tier: determineTier(m.id, inputPrice),
        last_verified_at: timestamp
      };
    });

    const existingContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
    const startMarker = 'const MODEL_CATALOG: ModelPricing[] = [';
    const endMarker = '];';
    
    const startIndex = existingContent.indexOf(startMarker);
    const endIndex = existingContent.indexOf(endMarker, startIndex);
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Could not find MODEL_CATALOG array in model-pricing.ts");
    }

    const newArrayContent = catalogEntries.map((entry: any) => {
      return `  {
    provider: '${entry.provider}',
    model_id: '${entry.model_id}',
    display_name: '${entry.display_name}',
    input_price_per_1m_tokens: ${entry.input_price_per_1m_tokens},
    output_price_per_1m_tokens: ${entry.output_price_per_1m_tokens},
    capability_tier: '${entry.capability_tier}',
    last_verified_at: '${entry.last_verified_at}',
  },`;
    }).join('\n');

    const updatedContent = 
      existingContent.substring(0, startIndex + startMarker.length) + 
      '\n' + newArrayContent + '\n' +
      existingContent.substring(endIndex);

    fs.writeFileSync(OUTPUT_FILE, updatedContent);
    console.log(`Successfully updated ${catalogEntries.length} models in ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error refreshing pricing:', error);
    process.exit(1);
  }
}

main();
