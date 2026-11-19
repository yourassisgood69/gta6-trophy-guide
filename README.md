# gta6-trophy-guide

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun rank](https://make.fun/badge/gta6-trophy-guide-01/yourassisgood69/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun reward](https://make.fun/badge/gta6-trophy-guide-01/yourassisgood69/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline, fan-made GTA 6 trophy guide and tracker for PlayStation 5: all 55 official trophies with their names, descriptions and grades, a cited guide for each one in our own words, a roadmap to the platinum, and the missables flagged. Progress is saved in your browser (localStorage), with filters by grade and kind, a spoiler setting that hides story trophies until earned, and export/import of your progress.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network needed. The app is plain static files under `app/` (`index.html`, `style.css`, `app.js`, `data/trophies.json`).

## Round 2

Round 2 rebuilds the guide from the audit review, keeping round 1's data and structure:

- **U1 — story guides rewritten:** the ~12 story trophies whose guides were near-identical boilerplate (Just Like Paradise, Paradise Lost, T\*\*s Ass Drug Money, Vice City, Baby!, Top Of The World, Ma, You Gotta Know When to Get Off, Trust, Break the Bank, Family Matters, DWNFALL, Hi-Jacked, Snow Storm) now each have a distinct 2–4 sentence guide with chapter context, what unlocks around them, and when to save — names, descriptions and grades unchanged.
- **U2 — unconfirmed methods flagged:** In The Beginning…, Bad Luck, I Guess, The Truth Is Out There and Ten Pin now carry a visible "Method unconfirmed" badge on the card and in the detail panel. The "check back for an update" wording is gone: this is a static offline bundle with no update mechanism, so the guides say so plainly.
- **U3 — keyboard access:** trophy cards are focusable and open with Enter/Space, and ticking a trophy updates only that card in place, so focus stays put instead of dropping to the page body.
- Also fixed: a bad `#grade-<x>` deep link now explains that no trophies match, the detail panel returns focus to the card that opened it (Escape closes it), the progress bar is a real `progressbar` with a live region, and checkboxes are 24px (WCAG 2.2 AA minimum).

## What is inside

- `app/` — the guide itself. `app/data/trophies.json` holds all 55 trophies (official name, description, grade, hidden flag, kind, missable flag, target counts), the 3-step roadmap, tips and sources.
- `screenshots/` — 4 screenshots of the app: the checklist, a trophy guide open, the roadmap, and the missable filter.
- `main.ts` — copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny local static server for development.

## Roadmap at a glance

1. **Story (60–80 h)** — finish the 5 chapters, do optional missions as they appear, scan vehicles and study animals as you go.
2. **100% checklist (~100 h)** — any 100 optional missions, 200 of 277 vehicles, 100 of 255 animals, 300 stunts, 15 of 18 meditations, 15 of 18 card sets, all 8 bank jobs, all 39 gang operations, all 15 Target Decks.
3. **Cleanup (~10 h)** — Strangers &amp; Freaks strands and miscellaneous trophies. About 200 hours total, difficulty 4/10.

**The one possibly missable trophy:** Positive Mental Attitude — meditate in Chapter 1 (after *Down to Earth*, follow Lucia to the balcony and accept).

## Sources

Guides are written in our own words from PowerPyx's GTA 6 trophy guide and roadmap, Push Square's trophy guide, planetgta6's trophy list, Exophase and PSNProfiles (official names, descriptions and grades), and GTABase. Each trophy's guide names its sources in the app.

Fan-made guide, not affiliated with Rockstar Games. No Rockstar logo or official artwork is used.

---
Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty ($250 in USDC). See the bounty at https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=bounty
