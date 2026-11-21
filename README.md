# Skeuo

**The internet, like it used to feel.**

![Skeuo Video — just videos. Like the old days.](apps/video/public/branding/skeuo_video_wordmark.png)

Skeuo is an independent open-source project that recreates the simplicity and
nostalgic experience of older applications. The goal is not retro decoration for
its own sake. The goal is to recover the parts of older software that felt
quiet, direct, and respectful of attention.

The project is organized as a small monorepo. Each app lives under `apps/`.
Today there is one app:

- [Skeuo Video](apps/video/) — a video library inspired by YouTube between 2008
  and 2010.

## Skeuo philosophy

- Dense, information-first pages, not hero imagery or empty branding space.
- Gray chrome, white content, thin borders, and classic blue links.
- Compact thumbnails, numbered pagination, and pages that end.
- No engagement machinery whose only purpose is to lengthen sessions.
- No recommendation feeds, no infinite scroll, no autoplaying suggestions, no
  watch-time ranking.
- No ads, sponsorship, monetization, or premium tiers.
- Original branding and assets only. No logos, screenshots, trademarks, or
  proprietary code from other platforms.

This is a design and product stance, not a claim about any other company's
history. Where we describe older behavior, we label it Observed, Inferred, or
Decided in the app's docs.

## Skeuo Video

**Just videos. Like the old days.**

Skeuo Video is the first Skeuo application. It is a frontend-only prototype in
Milestone 1. Every page, link, form, vote, comment, playlist, and simulated
upload works in the browser. Social data lives in local browser storage, and
there is no server yet.

### What works today

- **Homepage** — a "Videos Being Watched Now" strip, featured videos, a
  paginated "Recently Uploaded" grid, most popular by category, and subscription
  updates.
- **Search** — title, description, channel, category, and tag matching with
  relevance, newest, oldest, and most-viewed sorting, plus a category filter and
  numbered pagination. Every refinement is in the URL.
- **Watch page** — HTML5 playback, title, byline, subscribe, likes/dislikes,
  share panel, description with category and tags, add-to-playlist, comments
  with sort, mark-as-spam, and delete, and related videos chosen by
  channel/category/tags.
- **Channels** — themed header, avatar, bio, stats, subscribe toggle, and
  Videos / Playlists / Subscribers / About tabs.
- **Channels index**, **Subscriptions** feed, **Browse** and **Category** pages,
  **Playlists**, **Upload**, **Sign in**, and **Not found** pages.
- **Local profile** — a name and handle stored in the browser, which unlocks
  subscriptions, votes, comments, playlists, and uploads. It is **not**
  authentication: no password, no server, no security claim.

All navigation, pagination, and controls are functional. Sample videos are
openly licensed stand-in clips, and every thumbnail is generated SVG.

### Deliberately absent

Shorts-style vertical feeds, livestreaming, AI assistants or summaries,
AI/engagement recommendations, advertising or sponsorship, monetization,
premium tiers, infinite scrolling, autoplaying recommendation feeds, and
watch-time analytics.

### Status

Milestone 1 is complete as a browsing experience. Milestone 2 and later will add
real accounts, storage, and a backend. See [apps/video/docs/architecture.md](apps/video/docs/architecture.md).

## Quick start

Requirements: Node.js 24+ and npm.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle in apps/video/dist/
npm test         # unit and component tests
npm run typecheck
```

The `npm run dev` command above starts the video app. You can also run it
directly:

```bash
cd apps/video
npm install
npm run dev
```

No environment variables are required for Milestone 1. See
[apps/video/.env.example](apps/video/.env.example) for the variables later
milestones will use.

## Documentation

- [apps/video/docs/historical-research.md](apps/video/docs/historical-research.md)
  — what was observed in archived 2008–2010 pages, and what was inferred or
  decided.
- [apps/video/docs/feature-analysis.md](apps/video/docs/feature-analysis.md)
  — component-by-component comparison, including deliberate omissions.
- [apps/video/docs/design-reference.md](apps/video/docs/design-reference.md)
  — color tokens, typography, layout grid, components, and accessibility rules.
- [apps/video/docs/architecture.md](apps/video/docs/architecture.md) — code map,
  state model, trade-offs, and the milestone plan.
- [apps/video/THIRD_PARTY.md](apps/video/THIRD_PARTY.md) — dependencies, sample
  media, and licensing.

## Project roadmap

- **Milestone 1 — frontend prototype.** Done. Browsing, search, channels,
  playlists, comments, votes, and local uploads work in the browser.
- **Milestone 2 — accounts and data.** Not started. A real backend with
  session-based accounts and persistent storage.
- **Milestone 3 — uploads and playback.** Not started. Real file intake,
  transcoding, and poster selection.
- **Milestone 4 — deployment readiness.** Not started. Moderation, rate limits,
  and hardening.

Future Skeuo apps such as Skeuo Music and Skeuo Chat are contemplated but not
implemented.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version:

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run typecheck
npm test
npm run build
```

## License

[MIT](LICENSE). Skeuo is an independent open-source project and is not
affiliated with, endorsed by, or sponsored by YouTube or Google.
