# Contributing to Skeuo

Thanks for helping. Skeuo is a small, deliberate project: apps that recreate the
feel of older software without borrowing proprietary material from anyone.

The first application is [Skeuo Video](apps/video/README.md), an open-source
video library inspired by the browsing experience of YouTube around 2008–2010.

## Ground rules

1. **No proprietary material.** Do not contribute source code, screenshots,
   logos, icons, fonts, video files, or scraped data from YouTube or any other
   platform. Interface references must be described in words or rebuilt as
   original CSS/SVG.
2. **No dark patterns.** No infinite feeds, autoplaying recommendations, ranking
   by watch time, notification bait, or sponsored placements.
3. **No fake completeness.** If something is simulated, label it in the UI and
   in the docs. Do not describe client-only behavior as a working backend.
4. **Small dependencies.** Justify any new runtime dependency in the pull
   request. The current app stack is React, React Router, and Vite only.

## Repository structure

Skeuo is a monorepo. Each app lives under `apps/`. Today there is one app:

- `apps/video/` — Skeuo Video, the video library.

Top-level files are for the whole project: this README, license, contributor
docs, issue templates, and CI. Do not put app-specific source at the repository
root.

## Getting set up

From the repository root:

```bash
npm install
npm run dev        # starts apps/video at http://localhost:5173
```

To work on Skeuo Video directly:

```bash
cd apps/video
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run typecheck
npm test
npm run build
```

All three must pass. CI may not exist yet, so run them locally.

## What a good change looks like

- **Bug fix:** a failing reproduction described in the PR, the fix, and the test
  or manual check that covers it.
- **Feature:** scoped to one page or component, with the empty, loading, and
  error states handled, keyboard support, and no regressions at 360px, 768px,
  and 970px widths.
- **Design correction:** cite the historical evidence (a dated Internet Archive
  capture, a documented behavior) in `apps/video/docs/historical-research.md`,
  and label it Observed, Inferred, or Decided.
- **Repo-only change:** README, templates, CI, and governance updates should be
  limited to what the change needs.

## Code conventions

- TypeScript strict mode; no `any` unless unavoidable and commented.
- One component per file, one page per file, pure logic in `lib` so it can be
  unit tested without a DOM.
- CSS lives in the app's stylesheet and uses that file's tokens. Do not
  introduce a second styling system.
- User-visible text should be plain, specific, and free of marketing language.
- Keep app code in `apps/video`. Do not drift app source back to the repository
  root.

## Accessibility

- Every interactive element is reachable by keyboard and shows a visible focus
  ring.
- Images that are decorative use `alt=""`. The link or control around them
  carries the accessible name.
- Form errors are associated with their field and announced.
- Color contrast should meet WCAG AA for body text.
- Do not rely on color alone to convey state.

## Reporting security issues

See [SECURITY.md](../SECURITY.md). Once a backend exists, report vulnerabilities
privately rather than in a public issue.

## License of contributions

By contributing you agree that your work is released under the MIT license of
this repository.
