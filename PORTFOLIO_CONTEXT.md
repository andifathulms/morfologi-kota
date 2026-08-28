# PORTFOLIO_CONTEXT — Bentuk Kota (morfologi-kota)

Raw material for a client-facing portfolio case study. Everything below is verified against the codebase, git history, and test suite as of 2026-08-28 (commit `5c89a8d`).

---

## 1. One-line summary

An interactive atlas that measures and visualises the street layouts of 33 Indonesian neighbourhoods — showing that the same place can be a dense, well-connected city on foot and a nearly disconnected one by car.

## 2. The problem

The standard academic method for measuring city street patterns (Boeing 2019, orientation entropy) is computed on **driving networks**. Indonesian urban form is largely invisible to it: a kampung is threaded with *gang* — pedestrian alleys that never appear in a car network — while a gated perumahan is drivable but has one or two entrances and dead-ends everywhere. Measured by car alone, both look wrong.

This project computes **both networks — driving and walking — for the same place** and puts them side by side. The gap between the two is the finding. It is simultaneously a genuine measurement of Indonesian cities and a critique of applying car-centric metrics to cities that don't work that way.

**Audience:** urbanists, planners, OSM contributors, and general readers curious about Indonesian cities (Indonesian-first UI, English secondary). It is a personal analytical/portfolio project, not a client deliverable. A deliberate ethical constraint shapes it: kampung-versus-perumahan carries class overtones in Indonesia, so **the app describes and never scores** — no ranking, no walkability grade, no liveability index anywhere.

## 3. My role

Solo project — sole author of everything in the repository (93 commits, one committer):

- **The maths, from scratch.** No graph, charting, or mapping library is used anywhere. Graph construction, bearing computation, binned orientation entropy, the φ orientation-order indicator, circuity sampling, degree statistics, and footway-coverage measurement are all hand-written pure TypeScript in `lib/morphology/` (~2,000 lines), implemented directly from the Boeing 2019 paper with sections cited in comments.
- **The data pipeline.** Build-time scripts (~2,600 lines) that fetch OpenStreetMap data, clip fixed-radius sites, build both graphs per site, compute metrics, and emit validated, deterministic JSON bundles — plus a candidate-discovery sweep and a coverage survey tool (see §7).
- **The visualisation.** Polar histograms ("roses"), hairline network drawings, small-multiples plate, and the drive/walk comparison spread — all hand-rolled SVG in React server components.
- **The design system.** A print-inspired two-ink visual language documented in `DESIGN.md`, with contrast ratios and type scale asserted by unit tests rather than remembered.
- **The test harness.** 577 tests including synthetic networks with mathematically known answers (see §7).

**Inherited/used as-is:** Next.js, React, Tailwind, Zod, Vitest — framework and tooling only. The data is OpenStreetMap (ODbL, attributed structurally). The method is Boeing's, cited; the dual-network application of it is original.

## 4. Technical approach

- **Fully static site, zero backend.** Next.js 14 App Router with `output: 'export'`, deployed to GitHub Pages. All computation happens at build time; the deployed site makes **zero network requests at runtime**. OSM's volunteer-funded Overpass service is only ever touched by build scripts, cached and rate-spaced.
- **The measurement core is pure and framework-free.** `lib/morphology/` takes numbers in and gives numbers out — no DOM, no React, no clock, no network. This one decision is what makes the whole thing provably correct (§7's synthetic tests) and lets the same code run in Node scripts and in tests.
- **Correctness by construction, not by inspection.** Instead of trusting outputs against real-world data (where there's no oracle), the tests build networks whose answers are known in advance: a perfect grid, the same grid rotated 29°, a random graph, a pure tree. Mathematical invariants — every rose must be 180°-symmetric, circuity ≥ 1 by definition, degree proportions sum to 1 — are asserted on every histogram, synthetic and real.
- **Assumptions are controls, not constants.** Which OSM tags count as "drivable" or "walkable" changes every number, so the tag mapping lives in one documented module, is exposed in the UI as a switchable control (3 mappings), and its sensitivity is reported on its own page.
- **Honesty is engineered in.** Every site reports how well its alleys are actually mapped in OSM (footway coverage); thin sites are flagged rather than silently compared, because missing map data would fake the headline finding. The build fails if data validation fails.
- **No client-side JavaScript to speak of.** Cards, sorting, density modes, and cross-card highlights are all server-rendered HTML + CSS; the product has exactly one tiny client component (a nav-state helper). A thousand SVG paths per site never cross the hydration boundary.

## 5. Actual tech stack

From `package.json` — the dependency list is deliberately short:

- **Runtime dependencies (4):** Next.js 14.2, React 18.3, React DOM, Zod (data validation)
- **Dev:** TypeScript 5.5 (`strict: true`), Tailwind CSS 3.4, Vitest 2, tsx (pipeline scripts), ESLint
- **Notably absent, by design:** no D3, no charting library, no Leaflet/Mapbox, no graph library, no state-management library. The visualisations and the graph maths are the project.
- **Data:** OpenStreetMap via Overpass (build-time only), published under ODbL
- **Infra:** pnpm, GitHub Actions CI/CD, GitHub Pages. Fonts self-hosted via `next/font` (Newsreader, Atkinson Hyperlegible, IBM Plex Mono).

## 6. Notable features

- **The plate** (`/lempeng`): small-multiples view of all 33 sites at once — each card a circular network drawing, a 36-bin orientation rose, and a monospace metric column — sortable by any metric via CSS-only controls whose state lives in the URL.
- **The pair** (`/lokasi/[slug]`): the core product — drive and walk networks of the same disc side by side, two roses overlaid, per-metric deltas, and per-site editorial notes.
- **Hand-rolled polar histograms** with the entropy value derived visibly from the rose it's printed under, plus a full text/table equivalent of every rose for screen readers.
- **A measured, not guessed, comparison set:** a discovery script sweeps 56 cities, bins every mapped footway into disc-sized cells, and ranks candidates by measured density — after two rounds of hand-picking neighbourhoods yielded only 10 usable sites from 49 guesses.
- **Coverage confidence on every site**, with thin-coverage sites flagged in data and UI, and a published survey of 126 candidate centres including the ones rejected and why (e.g. the best-covered candidate in the whole survey turned out to be a botanical garden).
- **An assumptions page** (`/asumsi`) where the OSM tag mapping — the core modelling choice — is switchable, with the sensitivity of every number shown; plus a method page (`/metode`) with citation, definitions, limitations, and ODbL attribution. Fully bilingual (id/en), installable as a PWA.

## 7. Challenges / tradeoffs (with git evidence)

- **From memory to measurement** (`d799df4 "find candidates by measuring, not by remembering"`): the original plan was a hand-curated site list. Hand-listing produced 10 usable sites from 49 guesses — and the misses proved nothing, since an unconsidered neighbourhood is not a rejected one. The pivot: a density sweep over 56 cities that finds well-mapped cells by measurement, which contributed 14 of the 33 sites, including the first discs in Papua, Lombok, and Kalimantan.
- **The data-source pivot:** the PRD specified the Geofabrik Indonesia PBF (~1 GB); the shipped pipeline uses targeted Overpass queries instead, because 33 one-kilometre discs are a few megabytes and reading PBF would mean a protobuf dependency for data used once.
- **The proxy has failure modes, found the hard way:** footway coverage cannot tell an alley from a garden path. Bogor's best-covered candidate (40.9%, the highest ever surveyed) was a botanical garden; Jakarta's best was 78% inside one park. This produced encoded rules — >25% park share is not a fabric; `landuse=grass` is fetched and ignored (mappers use it for roadside verges) — and a validation check that the survey must predict the pipeline within one percentage point, which caught two sites entered with stale coordinates.
- **The finding is honestly bounded:** every gated-housing candidate ever sought directly came back thin (0.9–4.4% coverage), so the kampung-versus-perumahan comparison rests on two readable gated sites out of three — stated as a number on the page, not hidden. One commit (`5c89a8d`) exists specifically to correct a published sentence the data had outgrown.
- **A deliberate performance tradeoff:** the plate exports at ~4.7 MB of HTML, ~59% of it the App Router's serialised flight payload. It was measured, attributed, partially trimmed (ruler ticks went from 165 to 66 bytes each), and the remainder accepted with reasoning documented — the collapsed data tables that account for most of it are an accessibility requirement, not fat.
- **Design as tested code:** contrast ratios and the type scale are recomputed by unit tests from the hex values beside them (`tests/unit/palette.test.ts`, `type-scale.test.ts`); a dedicated test holds the guardrails that stop the distribution ruler from being readable as a ranking.

## 8. Status

- **Live and public:** deployed at https://andifathulms.github.io/morfologi-kota/ via GitHub Actions on every push to `main`; the synthetic suite, invariant suite, data validation, and an a11y audit gate the deploy.
- **Repository:** public — https://github.com/andifathulms/morfologi-kota. Code MIT; derived data offered under ODbL.
- **Maturity:** all planned milestones (M0–M6) shipped, plus a design pass; working tree clean, 577/577 tests green. Production-quality static site, though framed as a personal analytical project rather than a commercial product. Known remaining work is documented (a manual screen-reader pass; the overlaid rose distinguishes its two series by hue alone, mitigated by captions and tables).

## 9. Metrics

- **93 commits** over **8 days** (2026-08-20 → 2026-08-27), single author
- **~11,000 lines** of TypeScript/TSX: ~2,100 measurement core, ~2,600 pipeline scripts, ~2,600 components, ~2,200 app pages, ~1,500 tests
- **577 tests** in 14 files, all passing (verified 2026-08-28); three gated suites (synthetic, invariants, data validation) plus an a11y audit in CI
- **33 sites** across the archipelago, each with **2 networks** (drive + walk) × **3 tag mappings**; 126 candidate centres surveyed across 56 cities to select them
- **4 runtime dependencies**; effectively zero client-side JS beyond one nav helper; zero runtime network requests
- 4 page types × 2 locales, fully static export

## 10. Suggested screenshots

1. **The plate** — the signature view: dozens of cards, each with network drawing + rose + metrics, visibly one system. URL `/lempeng` (or `/id/lempeng`); page at [app/[locale]/lempeng/page.tsx](app/[locale]/lempeng/page.tsx), card at [components/card/](components/card/), plate layout at [components/plate/](components/plate/).
2. **A pair page for a kampung** — the product's whole argument in one screen: sparse driving network beside dense walking network, two roses, deltas. Pick a high-contrast site such as `/lokasi/kampung-bendungan-hilir`; page at [app/[locale]/lokasi/[slug]/page.tsx](app/[locale]/lokasi/[slug]/page.tsx), spread at [components/pair/](components/pair/).
3. **A single rose close-up with its caption** (H and φ printed under it) — the most portfolio-friendly single image; a strong choice is Palangka Raya (lowest entropy, 1957 planned capital) beside IKN (near-highest, planned now). Component at [components/rose/](components/rose/).
4. **The assumptions page** — shows the intellectual honesty angle: three tag mappings side by side with the numbers moving. URL `/asumsi`; page at [app/[locale]/asumsi/page.tsx](app/[locale]/asumsi/page.tsx), controls at [components/controls/](components/controls/).

Capture in light mode at desktop width for the plate (the small-multiples effect needs room), and consider one phone-width shot of a card to show the responsive work.
