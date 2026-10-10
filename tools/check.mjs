import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const target = path.join(dir, item.name);
    return item.isDirectory() ? files(target) : /\.(js|cjs|mjs)$/.test(item.name) ? [target] : [];
  });
}
for (const file of files('src')) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(1);
}
console.log('Syntax OK: desktop, preload and renderer.');
