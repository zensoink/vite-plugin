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
