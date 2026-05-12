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

interface CatalogEntry {
  provider: string;
  model_id: string;
  display_name: string;
  input_price_per_1m_tokens: number;
  output_price_per_1m_tokens: number;
  capability_tier: string;
  last_verified_at: string;
}

// Parse the existing MODEL_CATALOG entries so we can preserve `last_verified_at`
// for models whose pricing/metadata didn't change. Without this the script
// rewrites every `last_verified_at` on every run, producing a noisy diff even
// when nothing actually changed.
function parseExisting(content: string): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>();
  const re = /\{\s*provider:\s*'([^']*)',\s*model_id:\s*'([^']*)',\s*display_name:\s*'((?:[^'\\]|\\.)*)',\s*input_price_per_1m_tokens:\s*([\d.]+),\s*output_price_per_1m_tokens:\s*([\d.]+),\s*capability_tier:\s*'([^']*)',\s*last_verified_at:\s*'([^']*)',?\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    map.set(m[2], {
      provider: m[1],
      model_id: m[2],
      display_name: m[3].replace(/\\'/g, "'"),
      input_price_per_1m_tokens: Number(m[4]),
      output_price_per_1m_tokens: Number(m[5]),
      capability_tier: m[6],
      last_verified_at: m[7],
    });
  }
  return map;
}

function sameExceptVerifiedAt(a: CatalogEntry, b: CatalogEntry): boolean {
  return a.provider === b.provider
    && a.display_name === b.display_name
    && a.input_price_per_1m_tokens === b.input_price_per_1m_tokens
    && a.output_price_per_1m_tokens === b.output_price_per_1m_tokens
    && a.capability_tier === b.capability_tier;
}

async function main() {
  try {
    const orModels = await fetchOpenRouterPricing();
    console.log(`Processing ${orModels.length} models...`);

    const timestamp = new Date().toISOString();

    // We only care about major providers for now to keep the catalog lean
    const targets = ['anthropic/', 'openai/', 'deepseek/', 'google/'];

    interface ORModel {
      id: string;
      name: string;
      pricing: { prompt: string; completion: string };
    }

    const existingContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
    const startMarker = 'const MODEL_CATALOG: ModelPricing[] = [';
    const endMarker = '];';

    const startIndex = existingContent.indexOf(startMarker);
    const endIndex = existingContent.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Could not find MODEL_CATALOG array in model-pricing.ts");
    }

    const existingByModelId = parseExisting(existingContent.substring(startIndex, endIndex));

    // Stable order (by full OpenRouter id) so reordering on the API side
    // doesn't show up as a diff.
    const filteredModels = orModels
      .filter((m: ORModel) => targets.some(t => m.id.startsWith(t)))
      .sort((a: ORModel, b: ORModel) => a.id.localeCompare(b.id));

    let changed = 0;
    const catalogEntries: CatalogEntry[] = filteredModels.map((m: ORModel) => {
      const inputPrice = parseFloat(m.pricing.prompt) * 1000000;
      const outputPrice = parseFloat(m.pricing.completion) * 1000000;
      const modelId = m.id.split('/')[1];
      const fresh: CatalogEntry = {
        provider: determineProvider(m.id),
        model_id: modelId,
        display_name: m.name,
        input_price_per_1m_tokens: Number(inputPrice.toFixed(4)),
        output_price_per_1m_tokens: Number(outputPrice.toFixed(4)),
        capability_tier: determineTier(m.id, inputPrice),
        last_verified_at: timestamp,
      };
      const prev = existingByModelId.get(modelId);
      if (prev && sameExceptVerifiedAt(prev, fresh)) {
        fresh.last_verified_at = prev.last_verified_at; // unchanged → keep old stamp
      } else {
        changed++;
      }
      return fresh;
    });

    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const newArrayContent = catalogEntries.map((entry) => {
      return `  {
    provider: '${entry.provider}',
    model_id: '${entry.model_id}',
    display_name: '${esc(entry.display_name)}',
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
    console.log(`Successfully updated ${catalogEntries.length} models in ${OUTPUT_FILE} (${changed} new/changed, ${catalogEntries.length - changed} unchanged)`);

  } catch (error) {
    console.error('Error refreshing pricing:', error);
    process.exit(1);
  }
}

main();
