// GTA 6 trophy guide entry: hands the static app in app/ plus the 3-4
// screenshots in screenshots/ to the grader. It copies both folders into
// the output directory and writes dossier.json there with the vendored
// make.fun library (vendor/makefun-frontend.ts, left untouched). Run it
// outside the grader with MAKEFUN_OUTPUT_DIR set, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program is deterministic: same input files, same output bytes.
// Round 2 note: the dossier must stay byte-identical across the two runs,
// so this program writes nothing but the copied app/ and screenshots/ plus
// the dossier itself — no timestamps, no run-dependent data.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyClean(source, target) {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyClean(join(repoRoot, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyClean(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`dossier written to ${join(outputDir, 'dossier.json')} (${Buffer.byteLength(dossier, 'utf8')} bytes)`);
