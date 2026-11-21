# Skeuo Video

**Just videos. Like the old days.**

Skeuo Video is an open-source video library that looks and behaves like the web
did in 2008–2010: a dense homepage, a search box, channels, subscriptions,
numbered pages, and a watch page with comments and related videos.

It is the first application in the [Skeuo](https://github.com/subs-cantcode/skeuo)
project.

Skeuo Video is not a modern streaming app with retro colours. It is an
independent reimplementation of the era's *browsing model* — categories,
creators that you follow, chronological feeds, and pages that end. There is no
recommendation engine, no infinite scroll, no autoplaying feed, no advertising,
and no engagement ranking.

**Status: Milestone 1 (frontend).** Everything you can click works, but the
social data lives in `localStorage` and there is no server yet. Accounts,
database-backed storage, and real uploads are Milestones 2–3; see
[docs/architecture.md](docs/architecture.md).

## What works today

- **Homepage** — "Videos Being Watched Now", featured videos, a paginated
  "Recently Uploaded" grid, Most Popular by category, subscription updates.
- **Search** (`/results`) — title, description, channel, category, and tag
  matching with relevance / newest / oldest / most-viewed sorting, a category
  filter, and numbered pagination. Every refinement is in the URL.
- **Watch page** — HTML5 playback, title, byline, likes/dislikes, share panel,
  `(more info)` description with category and tags, add-to-playlist, comments
  (post, delete your own, mark spam, sort), queue-aware playlist playback with
  autoplay-next **off** by default, and related videos chosen by
  channel/category/tag.
- **Channels** — themed channel header, avatar, bio, stats, subscribe toggle,
  and Videos / Playlists / Subscribers / About tabs.
- **Channels index**, **Subscriptions** — strictly chronological feed grouped by
  day, **Browse**, **Category**, **Playlists**, **Upload**, **Sign in**, and
  **Not found** pages.

All navigation, pagination, and controls are functional. Sample videos are
openly licensed stand-in clips, and every thumbnail is generated SVG.

## Quick start

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle in dist/
npm test         # unit and component tests
npm run typecheck
```

No environment variables are required for Milestone 1. See
[.env.example](.env.example) for the variables later milestones will use.

## Architecture at a glance

| Layer | Choice | Why |
|-------|--------|-----|
| UI | React 18 + TypeScript | Component reuse without a component library |
| Routing | React Router 6 | URL-driven state; every page is linkable |
| Build | Vite | Fast dev server, small output, no config sprawl |
| Styling | Hand-written CSS (`src/styles/retro.css`) | The visual target is 2008-era CSS, not a utility framework |
| State | React context + localStorage | Enough for a single-user frontend; replaced by API calls later |
| Tests | Vitest + Testing Library | Behaviour-level tests for search, pagination, and routing |

Full design rationale, data flow, and the roadmap to a real backend are in
[docs/architecture.md](docs/architecture.md).

## Documentation

- [docs/historical-research.md](docs/historical-research.md) — what was observed
  in archived 2008–2010 pages, and what was inferred or decided.
- [docs/feature-analysis.md](docs/feature-analysis.md) — component-by-component
  comparison, including deliberate omissions.
- [docs/design-reference.md](docs/design-reference.md) — color tokens,
  typography, layout grid, components, and accessibility rules.
- [docs/architecture.md](docs/architecture.md) — code map, state model,
  trade-offs, and milestone plan.
- [THIRD_PARTY.md](THIRD_PARTY.md) — dependencies, sample media, and licensing.

## Deliberately absent

Shorts-style vertical feeds, livestreaming, AI assistants or summaries,
AI/engagement-driven recommendations, advertising or sponsorship, monetization,
premium tiers, infinite scrolling, autoplaying recommendation feeds, and
watch-time analytics.

## Contributing

Bug reports, accessibility fixes, and historical corrections are welcome. Read
[CONTRIBUTING.md](../../CONTRIBUTING.md) before opening a pull request.
