import { describe, expect, it, vi } from 'vitest';
import { CFG, PKG, freshImport, makeCwd } from './helpers.js';

const TEMPLATE = '<html><head></head><body></body></html>';

async function runBuild(files: Record<string, string>) {
  const restore = makeCwd(files);
  try {
    const { zensoBuildPlugin } = await freshImport<typeof import('../src/build.js')>(
      '../src/build.js'
    );
    const ctx = { emitFile: vi.fn(), warn: vi.fn() };
    const plugin = zensoBuildPlugin() as unknown as { generateBundle(this: unknown): void };
    plugin.generateBundle.call(ctx);
    return ctx;
  } finally {
    restore();
  }
}

const BASE = {
  'package.json': PKG,
  'zenso.config.json': CFG,
  'src/index.liquid': TEMPLATE
};

describe('zensoBuildPlugin docs', () => {
  it('emits README.md + LICENSE when present, no warnings', async () => {
    const ctx = await runBuild({ ...BASE, 'README.md': '# docs', LICENSE: 'MIT' });
    const names = ctx.emitFile.mock.calls.map((c) => c[0].fileName);
    expect(names).toEqual(expect.arrayContaining(['manifest.json', 'index.liquid', 'README.md', 'LICENSE']));
    expect(ctx.warn).not.toHaveBeenCalled();
  });

  it('warns and skips when docs are absent', async () => {
    const ctx = await runBuild(BASE);
    expect(ctx.emitFile).toHaveBeenCalledTimes(2);
    expect(ctx.warn).toHaveBeenCalledTimes(2);
    expect(ctx.warn).toHaveBeenCalledWith('[zenso]: README.md not found at project root, skipping');
    expect(ctx.warn).toHaveBeenCalledWith('[zenso]: LICENSE not found at project root, skipping');
  });
});

describe('zensoConfigPlugin outDir', () => {
  it.each([['default', undefined, 'dist'], ['custom', 'custom-dir', 'custom-dir']])(
    '%s -> %s',
    async (_label, input, expected) => {
      const restore = makeCwd({ 'package.json': PKG, 'zenso.config.json': CFG });
      try {
        const { zensoConfigPlugin } = await freshImport<typeof import('../src/build.js')>(
          '../src/build.js'
        );
        const plugin =
          input === undefined
            ? zensoConfigPlugin()
            : zensoConfigPlugin(input as string);
        const config = (
          plugin as unknown as { config(): { build: { outDir: string } } }
        ).config();
        expect(config.build.outDir).toBe(expected);
      } finally {
        restore();
      }
    }
  );
});
