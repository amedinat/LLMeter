// Packs dist/ into llmeter-live-cost-<version>.zip for the Chrome Web Store.
// Uses the system `zip` binary (present on macOS/Linux; on Windows use
// `Compress-Archive -Path dist\* -DestinationPath llmeter-live-cost.zip`).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'manifest.json'))) {
  console.error('dist/manifest.json not found — run `npm run build` first');
  process.exit(1);
}
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const out = join(root, `llmeter-live-cost-${version}.zip`);
rmSync(out, { force: true });
execFileSync('zip', ['-r', '-q', '-X', out, '.', '-x', '*.map'], { cwd: dist, stdio: 'inherit' });
console.log(`${out} (${(statSync(out).size / 1024).toFixed(1)} KB)`);
