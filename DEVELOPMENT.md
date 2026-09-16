# Development

## Scripts

| Script | Command | Meaning |
| ------ | ------- | ------- |
| `typecheck` | `tsc --noEmit` | Typecheck `src` + `test` |
| `test` | `vitest run` | Unit tests (single run) |
| `build` | `tsc -p tsconfig.build.json` | Emit `dist/` (ships to npm) |

Requires Node 22+.

## Release

```bash
npm version patch|minor|major  # bumps package.json + creates tag
git push origin main --tags
```

Pushing tag `vX.Y.Z` (must equal `package.json` version — the workflow
asserts this) runs typecheck + tests + build and publishes to npm with
provenance. Publishing is tokenless via npm Trusted Publishing (OIDC):
the repo + `release.yml` workflow must be registered as a trusted
publisher on the npm package page.

> Bootstrap for a brand-new package name: the npm page doesn't exist yet,
> so no trusted publisher can be registered. Create a classic publish token,
> add it as repo secret `NPM_TOKEN`, push the tag — the workflow publishes
> without provenance via the token step. Then register OIDC and delete the
> secret; subsequent releases publish tokenless with provenance.
