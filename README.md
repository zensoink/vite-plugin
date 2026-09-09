# @zenso/zenso-vite-plugin

Vite plugin for [Zenso](https://zenso.ink) e-ink plugins: Liquid dev rendering,
`manifest.json` / `index.liquid` build emit, and `plugin.zip` packing — by
convention (`src/*` in, `dist/` out, no path options).

Extracted from
[`zenso-plugin-template`](https://github.com/zensoink/zenso-plugin-template)
so all plugin projects share one build system.

## Install

```bash
npm i -D @zenso/zenso-vite-plugin
```

Requires Node 22+ and `vite` 6 or 7 (peer).

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { zensoPlugin } from '@zenso/zenso-vite-plugin';

export default defineConfig({
  plugins: [zensoPlugin({ zip: true, generateMockData: true })]
});
```

Build defaults (`outDir`, rollup inputs/outputs) come from the plugin's
`config()` hook — your own `build` values in `vite.config.ts` merge over them.

## Options

| Option | Default | Meaning |
| ------ | ------- | ------- |
| `generateMockData` | `true` | Derive config-based mock layers + sync sparse `mock/plugin.json` (dev only). `false` renders files + inline data only. |
| `mock` | — | Inline mock data, highest-precedence layer. Spread imported JSONs: `zensoPlugin({ mock: { ...zensoMock, ...pluginMock } })`. Top-level `user`/`device`/`system` keys fold into the `zenso` scope. |
| `zip` | `true` | Pack `dist/` into `plugin.zip` after build. Object overrides zip-pack options, `false` disables. |

## What it does

- **Dev:** renders `src/index.liquid` with the resolved mock context on `/`,
  injects dev asset refs (`/src/*` + HMR client), watches template / mocks /
  `zenso.config.json` / `package.json` with full reload. Mock layers
  (highest wins): inline `mock:` → `mock/plugin.json` → `mock/zenso.json` →
  derived defaults. `zenso.system.timestamp_utc` is stamped live per render.
- **Build:** emits `dist/index.liquid` (production head assets),
  `dist/manifest.json` (allowlisted merge of `zenso.config.json` +
  `package.json`; fails fast on empty `name` / non-SemVer `version`),
  bundled `dist/assets/*`, then packs `plugin.zip`.
- Only JS entry (`src/main.ts`) is bundled when the `script` capability is set.

The only registered Liquid filter is `asset_url`
(e.g. `{{ 'assets/logo.png' | asset_url }}`).

See the template repo for the full plugin-authoring guide
(conventions, `config_schema`, `data_sources`, deployment).

See `DEVELOPMENT.md` for the release process.

## License

MIT
