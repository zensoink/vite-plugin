import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildConfigMock, buildDataMock, fillMissing, isPlainObject } from '../src/mock.js';
import { CFG, PKG, freshImport, makeCwd } from './helpers.js';

describe('isPlainObject', () => {
  it.each([
    [{}, true],
    [{ a: 1 }, true],
    [[], false],
    [null, false],
    ['x', false],
    [42, false]
  ])('%j -> %s', (v, expected) => {
    expect(isPlainObject(v)).toBe(expected);
  });
});

describe('fillMissing', () => {
  it('fills missing paths, keeps existing, arrays win wholesale', () => {
    const target = { a: 1, nested: { keep: true }, arr: [1] };
    const out = fillMissing(target, { a: 9, b: 2, nested: { keep: false, add: 1 }, arr: [1, 2, 3] });
    expect(out).toEqual({ a: 1, b: 2, nested: { keep: true, add: 1 }, arr: [1] });
  });
});

describe('buildConfigMock', () => {
  it('prefers default, falls back per type', () => {
    expect(
      buildConfigMock({
        a: { type: 'string', default: 'x' },
        b: { type: 'string', enum: ['p', 'q'] },
        c: { type: 'string' },
        d: { type: 'number', minimum: 3 },
        e: { type: 'number' },
        f: { type: 'boolean' },
        g: { type: 'array' },
        h: { type: 'array', items: { type: 'object', properties: { u: { type: 'string', default: 'v' }, w: { type: 'string', enum: ['z'] } } } }
      })
    ).toEqual({ a: 'x', b: 'p', c: '', d: 3, e: 0, f: false, g: [], h: [{ u: 'v', w: 'z' }] });
  });

  it('returns {} for missing input', () => {
    expect(buildConfigMock(undefined)).toEqual({});
  });
});

describe('buildDataMock', () => {
  it('creates one stub per source id', () => {
    expect(buildDataMock([{ id: 'events', type: 'ics', config: { a: 1 } }, { noId: true }])).toEqual({
      events: { type: 'ics', config: { a: 1 } }
    });
  });
});

describe('resolveMockData (fs layers)', () => {
  it('layers inline > plugin.json > zenso.json > derived, stamps live clock', async () => {
    const restore = makeCwd({
      'package.json': PKG,
      'zenso.config.json': CFG,
      'mock/zenso.json': JSON.stringify({ user: { locale: 'pl-PL' } }),
      'mock/plugin.json': JSON.stringify({ config: { title: 'File' } })
    });
    try {
      const { resolveMockData } = await freshImport<typeof import('../src/mock.js')>('../src/mock.js');
      const before = Math.floor(Date.now() / 1000);
      const ctx = resolveMockData({ config: { title: 'Inline' } });
      expect(ctx.config.title).toBe('Inline'); // inline wins over file
      expect(ctx.plugin.id).toBe('zenso/my-plugin'); // derived
      expect(ctx.zenso.user.locale).toBe('pl-PL'); // from zenso.json
      expect(ctx.data.events).toEqual({ type: 'ics', config: {} }); // derived stub
      expect(ctx.zenso.system.timestamp_utc).toBeGreaterThanOrEqual(before);
    } finally {
      restore();
    }
  });

  it('folds top-level user/device/system keys into zenso scope', async () => {
    const restore = makeCwd({ 'package.json': PKG, 'zenso.config.json': CFG });
    try {
      const { resolveMockData } = await freshImport<typeof import('../src/mock.js')>('../src/mock.js');
      const ctx = resolveMockData({ user: { locale: 'de-DE' } });
      expect(ctx.zenso.user.locale).toBe('de-DE');
      expect(ctx.user).toBeUndefined();
    } finally {
      restore();
    }
  });
});

describe('syncMockSparse', () => {
  it('fills derived, preserves overrides, strips zenso scope', async () => {
    const restore = makeCwd({
      'package.json': PKG,
      'zenso.config.json': CFG,
      'mock/plugin.json': JSON.stringify({ config: { title: 'Mine' }, zenso: { user: {} }, custom: { k: 1 } })
    });
    try {
      const { syncMockSparse } = await freshImport<typeof import('../src/mock.js')>('../src/mock.js');
      syncMockSparse();
      const written = JSON.parse(fs.readFileSync('mock/plugin.json', 'utf-8'));
      expect(written.config.title).toBe('Mine');
      expect(written.plugin.id).toBe('zenso/my-plugin');
      expect(written.custom).toEqual({ k: 1 });
      expect(written.zenso).toBeUndefined();
    } finally {
      restore();
    }
  });
});
