import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { vi } from 'vitest';

/** Fresh ESM import so cwd-bound constants re-evaluate after chdir. */
export async function freshImport<T>(modulePath: string): Promise<T> {
  vi.resetModules();
  return import(modulePath) as Promise<T>;
}

/**
 * Creates a temp dir with the given files, chdirs into it.
 * @returns Restore function (chdir back + remove dir).
 */
export function makeCwd(files: Record<string, string>): () => void {
  const prev = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenso-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  process.chdir(dir);
  return () => {
    process.chdir(prev);
    fs.rmSync(dir, { recursive: true, force: true });
  };
}

export const PKG = JSON.stringify({
  name: 'my-plugin',
  version: '1.2.3',
  description: 'd',
  license: 'MIT',
  author: { name: 'zenso.ink' }
});

export const CFG = JSON.stringify({
  id: 'zenso/my-plugin',
  thumbnail: 'assets/logo.png',
  schema_version: 1,
  core_min: '0.0.0',
  capabilities: ['script'],
  config_schema: {
    type: 'object',
    properties: { title: { type: 'string', default: 'Hello' } }
  },
  data_sources: [{ id: 'events', type: 'ics', config: {} }]
});
