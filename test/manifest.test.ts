import { describe, expect, it } from 'vitest';
import { CFG, PKG, freshImport, makeCwd } from './helpers.js';

describe('hasScriptCapability', () => {
  it.each([
    ['["script"]', true],
    ['["liquid"]', false],
    ['[]', false]
  ])('capabilities %s -> %s', async (caps, expected) => {
    const restore = makeCwd({
      'package.json': PKG,
      'zenso.config.json': JSON.stringify({ capabilities: JSON.parse(caps) })
    });
    try {
      const { hasScriptCapability } = await freshImport<typeof import('../src/manifest.js')>(
        '../src/manifest.js'
      );
      expect(hasScriptCapability()).toBe(expected);
    } finally {
      restore();
    }
  });

  it('returns false when config is missing', async () => {
    const restore = makeCwd({ 'package.json': PKG });
    try {
      const { hasScriptCapability } = await freshImport<typeof import('../src/manifest.js')>(
        '../src/manifest.js'
      );
      expect(hasScriptCapability()).toBe(false);
    } finally {
      restore();
    }
  });
});

describe('buildManifestJson', () => {
  it('merges allowlisted keys from config + package.json', async () => {
    const restore = makeCwd({ 'package.json': PKG, 'zenso.config.json': CFG });
    try {
      const { buildManifestJson } = await freshImport<typeof import('../src/manifest.js')>(
        '../src/manifest.js'
      );
      expect(buildManifestJson()).toMatchObject({
        $schema: 'https://schemas.zenso.ink/v1/plugin-manifest.schema.json',
        id: 'zenso/my-plugin',
        name: 'my-plugin',
        version: '1.2.3',
        capabilities: ['script']
      });
    } finally {
      restore();
    }
  });

  it('fails fast on empty name / non-semver version', async () => {
    for (const pkg of [{ name: '', version: '1.2.3' }, { name: 'x', version: 'nope' }]) {
      const restore = makeCwd({
        'package.json': JSON.stringify({ ...JSON.parse(PKG), ...pkg }),
        'zenso.config.json': CFG
      });
      try {
        const { buildManifestJson } = await freshImport<typeof import('../src/manifest.js')>(
          '../src/manifest.js'
        );
        expect(() => buildManifestJson()).toThrow(/package\.json/);
      } finally {
        restore();
      }
    }
  });
});
