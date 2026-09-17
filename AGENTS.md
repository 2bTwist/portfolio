# eddyb.dev Repository Contract

This repository contains Edmond's public portfolio and writing site. Preserve its
editor-inspired presentation without compromising ordinary web navigation,
accessibility, searchability, or performance.

## Authority

1. Current source, tests, `package.json`, and CI define implemented behavior.
2. `README.md` defines the public site and content model.
3. `budgets.json` is the performance-budget source of truth.
4. Current tracked decisions and conventions apply within their stated scope.
5. Plans, research, handoffs, generated reports, and job-search outputs are not
   current task state.

## Product and implementation invariants

- Pages remain ordinary searchable routes beneath the editor chrome.
- Content remains data and MDX driven.
- Preserve server-rendered, accessible content when enhancing the editor shell.
- Keep the repository's all-rights-reserved license and do not introduce copy that
  suggests the source is reusable.
- Search before removing routes, content, components, tooling, or dependencies.
- Do not treat generated performance output or browser traces as durable policy.

## Performance

Do not let a performance loop edit `budgets.json`. A failing budget is evidence to
investigate, not permission to move the threshold. Use the repository's own harness
and record any browser leg that could not be driven.

## Verification

Run the smallest relevant check while working, then the applicable repository gates:

```sh
pnpm lint
pnpm test
pnpm build
pnpm size
pnpm e2e
```

UI changes also require compact and desktop review, keyboard navigation, and light
and dark appearance checks where both are supported.

## Preference state contract

- Browser-local preferences are convenience state, not account, content, or analytics data.
  `ide.palette` stores a palette index and `ide-split-ratio` stores the editor split ratio.
  Open tabs and the right split pane are in-memory and reset on reload.
- Palette values are accepted only when they are integer indexes of the current palette list.
  Split ratios must be finite positive numbers and are clamped to the declared minimum and maximum.
  Missing or invalid values fall back to defaults.
- Browser storage, clearing, retention, and recovery are host-owned. This repository has no
  storage-key versioning, migration, backup, or deletion workflow. Removing either key resets the
  related preference; do not treat a saved preference as an application guarantee.
- The edge `whoami` route is dynamic, `no-store`, and returns request-derived fields only. It does
  not create repository-managed durable state. Verify preference behavior in a browser when the
  client-store code changes; automated tests alone do not prove storage-host behavior.
