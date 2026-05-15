import fs from 'fs';
import path from 'path';

/**
 * Script to refresh LLMeter model pricing from OpenRouter's public API.
 *
 * Design:
 * - Only OR_PROVIDERS (anthropic, openai, deepseek, google) are refreshed.
 * - All other providers (groq, together, fireworks, cohere, perplexity, xai,
 *   cerebras, ai21) are preserved verbatim — their entries are never touched.
 * - OR-managed entries NOT returned by OpenRouter on a given run are KEPT
 *   (e.g., deprecated models still in use by customers).
 * - Entries with the same model_id but different providers are treated as
 *   distinct (composite key: provider + model_id).
 * - `last_verified_at` is preserved for unchanged entries to keep diffs clean.
 *
 * Usage: pnpm dlx tsx scripts/refresh-pricing.ts
 */

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/model-pricing.ts');

// Map: OpenRouter id prefix -> LLMeter ProviderType
const OR_PREFIX_TO_PROVIDER: Record<string, string> = {
  'anthropic': 'anthropic',
  'openai':    'openai',
  'deepseek':  'deepseek',
  'google':    'google',
};

// Set of providers whose pricing is managed by this script via OpenRouter.
const OR_PROVIDERS = new Set(Object.values(OR_PREFIX_TO_PROVIDER));

async function fetchOpenRouterPricing(): Promise<ORModel[]> {
  console.log(`Fetching latest pricing from ${OPENROUTER_MODELS_URL}...`);
  const response = await fetch(OPENROUTER_MODELS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch from OpenRouter: ${response.statusText}`);
  }
  const data = await response.json() as { data: ORModel[] };
  return data.data;
}

function determineTier(inputPrice: number): string {
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

interface ORModel {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
}

/**
 * Parse all catalog entries from the MODEL_CATALOG section of the source file.
 * Uses a block-level parser to handle entries reliably, including any with
 * optional fields (cache_read_price_per_1m_tokens etc.).
 * Returns a list (not Map) to preserve duplicates across different providers.
 */
function parseExistingEntries(catalogSection: string): CatalogEntry[] {
  const entries: CatalogEntry[] = [];

  // Match each { ... } object block (entries don't contain nested braces)
  const blockRe = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;

  while ((m = blockRe.exec(catalogSection)) !== null) {
    const block = m[1];
    const provider    = block.match(/provider:\s*'([^']+)'/)?.[1];
    const modelId     = block.match(/model_id:\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'");
    const displayName = block.match(/display_name:\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'");
    const inputPrice  = block.match(/input_price_per_1m_tokens:\s*([\d.]+)/)?.[1];
    const outputPrice = block.match(/output_price_per_1m_tokens:\s*([\d.]+)/)?.[1];
    const tier        = block.match(/capability_tier:\s*'([^']+)'/)?.[1];
    const verifiedAt  = block.match(/last_verified_at:\s*'([^']+)'/)?.[1];

    if (provider && modelId && displayName && inputPrice && outputPrice && tier && verifiedAt) {
      entries.push({
        provider,
        model_id: modelId,
        display_name: displayName,
        input_price_per_1m_tokens: Number(inputPrice),
        output_price_per_1m_tokens: Number(outputPrice),
        capability_tier: tier,
        last_verified_at: verifiedAt,
      });
    }
  }

  return entries;
}

function pricingUnchanged(a: CatalogEntry, b: CatalogEntry): boolean {
  return (
    a.display_name === b.display_name &&
    a.input_price_per_1m_tokens === b.input_price_per_1m_tokens &&
    a.output_price_per_1m_tokens === b.output_price_per_1m_tokens &&
    a.capability_tier === b.capability_tier
  );
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function serializeEntry(e: CatalogEntry): string {
  return `  {
    provider: '${esc(e.provider)}',
    model_id: '${esc(e.model_id)}',
    display_name: '${esc(e.display_name)}',
    input_price_per_1m_tokens: ${e.input_price_per_1m_tokens},
    output_price_per_1m_tokens: ${e.output_price_per_1m_tokens},
    capability_tier: '${e.capability_tier}',
    last_verified_at: '${e.last_verified_at}',
  },`;
}

async function main() {
  try {
    const orModels = await fetchOpenRouterPricing();
    console.log(`Received ${orModels.length} models from OpenRouter.`);

    const timestamp = new Date().toISOString();

    const existingContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
    const startMarker = 'const MODEL_CATALOG: ModelPricing[] = [';
    const endMarker = '\n];';

    const startIndex = existingContent.indexOf(startMarker);
    const endIndex = existingContent.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Could not find MODEL_CATALOG array in model-pricing.ts');
    }

    const catalogSection = existingContent.substring(
      startIndex + startMarker.length,
      endIndex
    );

    const existingEntries = parseExistingEntries(catalogSection);
    console.log(`Parsed ${existingEntries.length} existing entries.`);

    // Composite key: provider + model_id (handles same model_id across providers)
    const compositeKey = (provider: string, modelId: string) => `${provider}:::${modelId}`;

    const orManagedMap = new Map<string, CatalogEntry>();
    const preserved: CatalogEntry[] = [];

    for (const entry of existingEntries) {
      if (OR_PROVIDERS.has(entry.provider)) {
        orManagedMap.set(compositeKey(entry.provider, entry.model_id), entry);
      } else {
        preserved.push(entry);
      }
    }

    console.log(
      `Existing: ${orManagedMap.size} OR-managed, ${preserved.length} preserved.`
    );

    // Build updated entries from OpenRouter for target providers.
    const orUpdated = new Map<string, CatalogEntry>();
    let changed = 0;
    let skipped = 0;

    for (const model of orModels) {
      const prefix = model.id.split('/')[0];
      const provider = OR_PREFIX_TO_PROVIDER[prefix];
      if (!provider) continue;

      const modelId = model.id.split('/').slice(1).join('/');
      const inputPrice  = Number((parseFloat(model.pricing.prompt)     * 1_000_000).toFixed(4));
      const outputPrice = Number((parseFloat(model.pricing.completion) * 1_000_000).toFixed(4));

      // Skip entries where both prices are 0 (OR has no pricing data)
      if (inputPrice === 0 && outputPrice === 0) {
        skipped++;
        continue;
      }

      const fresh: CatalogEntry = {
        provider,
        model_id: modelId,
        display_name: model.name,
        input_price_per_1m_tokens: inputPrice,
        output_price_per_1m_tokens: outputPrice,
        capability_tier: determineTier(inputPrice),
        last_verified_at: timestamp,
      };

      const ck = compositeKey(provider, modelId);
      const prev = orManagedMap.get(ck);
      if (prev && pricingUnchanged(prev, fresh)) {
        fresh.last_verified_at = prev.last_verified_at;
      } else {
        changed++;
      }

      orUpdated.set(ck, fresh);
    }

    // Retain OR-managed entries not returned by OpenRouter this run
    // (deprecated models that may still be referenced by existing users).
    const orFallback: CatalogEntry[] = [];
    for (const [ck, entry] of orManagedMap) {
      if (!orUpdated.has(ck)) {
        orFallback.push(entry);
      }
    }

    console.log(
      `OR update: ${orUpdated.size} from OpenRouter ` +
      `(${changed} changed, ${orUpdated.size - changed} unchanged, ${skipped} zero-price skipped), ` +
      `${orFallback.length} OR entries retained (absent from OR response).`
    );

    // Sort OR entries: provider order then model_id for stable diffs.
    const providerOrder = ['anthropic', 'openai', 'deepseek', 'google'];
    const sortedOr = [...orUpdated.values()].sort((a, b) => {
      const pa = providerOrder.indexOf(a.provider);
      const pb = providerOrder.indexOf(b.provider);
      if (pa !== pb) return pa - pb;
      return a.model_id.localeCompare(b.model_id);
    });

    // Final catalog: OR entries first, then OR fallbacks, then preserved non-OR.
    const allEntries = [...sortedOr, ...orFallback, ...preserved];

    const newArrayContent = allEntries.map(serializeEntry).join('\n');

    const updatedContent =
      existingContent.substring(0, startIndex + startMarker.length) +
      '\n' + newArrayContent + '\n' +
      existingContent.substring(endIndex);

    fs.writeFileSync(OUTPUT_FILE, updatedContent);

    console.log(
      `Done. Wrote ${allEntries.length} entries ` +
      `(${sortedOr.length} OR-updated + ${orFallback.length} OR-fallback + ${preserved.length} preserved).`
    );
  } catch (error) {
    console.error('Error refreshing pricing:', error);
    process.exit(1);
  }
}

main();
