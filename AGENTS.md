# Profile README — Geometry Dash × Contribution City

The `jaybondholliete/jaybondholliete` profile README, styled as a Geometry Dash
level with a GitSkins "Contribution City" layout. Everything is Markdown + SVG;
nothing is interactive (GitHub READMEs are static).

## Layout

- `README.md` — page composition (banner, city, panels, stats, snake)
- `conf/theme.json` — shared palette for the generator scripts
- `conf/github-profile-3d-contrib.json` — city skin (GD bitmap blocks + labels)
- `conf/projects.json` — optional: array of repo names to force-feature
- `scripts/` — zero-dep Node 20+ generators (`lib/` helpers + `gen-*.js`)
- `assets/` — generated + static SVGs committed to the repo
- `profile-3d-contrib/` — city SVGs written by the upstream action

## Regenerating

- Nightly via `.github/workflows/` (city, panels, snake)
- Manually: Actions → any of the three workflows → Run workflow
- Locally (real data): `GH_TOKEN=<pat> node scripts/gen-banner.js` etc.
- Locally (offline preview): `cd scripts && npm run gen:mock`
  (reads `scripts/mock-data.json`, no token needed)
- Preview city block textures without pushing:
  `node scripts/debug-patterns.js` → open `pattern-preview.svg` in a browser

## Customizing

- Colors live in `conf/theme.json` (scripts) AND inside
  `conf/github-profile-3d-contrib.json` (the action reads it standalone) —
  update both.
- Block textures are 32-bit hex rows per face; symmetric patterns are safest
  (bit order isn't documented). Iterate with the Actions `workflow_dispatch`
  trigger to preview.
- City legend labels: `l10n` keys in the same JSON.
- Featured repos: create `conf/projects.json` with repo names to pin manually;
  otherwise it uses GitHub pinned items → top-starred fallback.
- Counting private contributions: create a classic PAT (repo + read:user)
  and add it as repo secret `GH_PAT`. All three workflows already use
  `secrets.GH_PAT || secrets.GITHUB_TOKEN` — it takes effect immediately.
  Without it only public contributions show (GitHub profile counts both,
  so the on-site number can look larger).

## Gotchas

- Repo Settings → Actions → General → Workflow permissions must be
  "Read and write" or the regeneration commits will fail.
- The banner/panels fetch profile fields via GraphQL — the default Actions
  `GITHUB_TOKEN` covers public data; add `GH_PAT` for private contribs.
- `snake.svg` colors live in `.github/workflows/snake.yml` query params
  (`color_dots` is exactly 5 values, first = empty cell).
