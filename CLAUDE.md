# CLAUDE.md — Bentuk Kota

Street network morphology comparison for Indonesian urban form. Boeing's orientation-entropy method applied to fixed-radius sites, computed separately for the driving and walking networks so the gap between them is visible. Static site, GitHub Pages, no backend, no runtime network.

Read `PRD.md` before starting any task, and **`DESIGN.md` before writing any UI** — it opens with the shared house layer used across these projects.

**Four things shape everything:**

1. **The drive/walk pair is the product.** A kampung is densely connected on foot and barely by car; a gated perumahan is the reverse. Boeing's global study is driving-network based and cannot see this. Everything else exists to support that comparison.
2. **The finding depends on gang being mapped.** If a kampung's alleys are absent from OSM, its walking network collapses toward its driving network and the gap vanishes — for the wrong reason. **Every site reports its footway coverage**, and thin sites are flagged rather than compared.
3. **Tag interpretation is a modelling choice, not a fact.** Which `highway` values count as drivable or walkable changes every number. It is exposed as a control, never a hidden constant.
4. **The app describes; it never scores.** No grade, no ranking, no liveability index. Kampung-versus-perumahan carries class overtones in Indonesia and a score would inflame what a measurement can illuminate.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS, tokens from `DESIGN.md`
- Zod for site and manifest validation
- Vitest
- pnpm
- **No graph library, no charting library, no mapping library.** The graph construction, the entropy, and the rose are the project.
- Fonts via `next/font`, self-hosted.

## Commands

```bash
pnpm dev
pnpm build                  # static export; runs data:validate first
pnpm preview                # serve ./out under the production basePath
pnpm test                   # vitest watch
pnpm test:run               # vitest once — before every commit
pnpm test:synthetic         # grids, rotated grids, random graphs, trees
pnpm test:invariants        # rose symmetry, circuity ≥ 1, degree sums
pnpm data:fetch             # DEV/CI — pull Geofabrik Indonesia PBF
pnpm data:build             # clip sites, build both graphs, compute, emit
pnpm data:validate          # manifest, radius, coverage, ODbL attribution
pnpm typecheck
pnpm lint
```

`pnpm test:synthetic`, `pnpm test:invariants` and `pnpm data:validate` gate the build and CI.

## Layout

```
app/
  [locale]/                 # id (default), en
    lempeng/                # the plate — small multiples
    lokasi/[slug]/          # the pair — drive vs walk
    asumsi/                 # tag mapping + sensitivity
    metode/                 # citation, definitions, ODbL, limitations
components/
  card/                     # network drawing + rose + metric column
  rose/                     # 36-bin polar histogram
  network/                  # ink hairline drawing, circular clip
  pair/                     # side-by-side drive/walk + deltas
  metrics/                  # monospace tabular column
  table/                    # rose's text equivalent
lib/
  morphology/               # THE CORE. Pure. Runs in Node.
    graph.ts                # nodes, edges, degree
    bearing.ts              # segment bearings, length weighting
    entropy.ts              # binned entropy, normalised
    phi.ts                  # orientation-order indicator
    circuity.ts             # sampled network/euclidean ratio
    degrees.ts              # four-way and dead-end proportions
    coverage.ts             # footway tagging density
  tags/                     # drivable / walkable tag sets — ONE place
scripts/
  build-data.ts             # DEV/CI — PBF → clipped sites → metrics
data/
  sites/                    # site definitions: centre, radius, type label
  out/                      # simplified geometry + metrics + manifest
tests/
  synthetic/  invariants/
```

## Invariants

1. **`lib/morphology` is pure and runs in Node.** Numbers and geometry in, numbers out. No DOM, no React, no clock, no network, no module-level mutable state. This is what makes the synthetic suite possible.

2. **Overpass and Geofabrik are build-time only.** **Never call either at runtime.** Overpass is a volunteer-funded service optimised for flexibility rather than performance; querying it from a deployed page is both slow and discourteous.

3. **Tag sets live in `lib/tags` as named, documented constants** — one place, exposed to the UI as a control. **Never inline a `highway=` check at a call site.** Changing the mapping changes every number, so it is a visible decision.

4. **Every site computes both modes.** A site with only one mode is incomplete, not a partial result. The pair is the product.

5. **Every site reports footway coverage**, and sites below the threshold are flagged in the data and in the UI. **Never compare a thin-coverage site as though its walking network were complete.**

6. **Sampling radius is fixed across the comparison set** and printed on every card. Never varied silently between sites — it changes the metrics.

7. **Rose symmetry is asserted.** Every 36-bin histogram must be 180°-rotationally symmetric. **An asymmetric rose means the bearing computation is wrong**, and this check costs nothing while catching the likeliest bug in the project.

8. **Circuity is ≥ 1 for every sampled pair**, by definition. A value below 1 means the network distance calculation is broken.

9. **No score, grade, ranking, or index anywhere** — in data, code, copy, or metadata. There is no `score` field in this codebase and adding one is a design regression. Sites may be *sorted* by a metric; they are never *rated*.

10. **No colour on the network drawings, and no road-class weight hierarchy.** Uniform ink hairlines. `DESIGN.md` §5.

11. **`--drive` and `--walk` are the only hues in the product.** Never colour by site type, never introduce a third accent, never a diverging ramp.

12. **Every rose renders with its entropy and φ.** A rose without its numbers is a shape, not a measurement.

13. **ODbL.** The emitted geometry and metrics are a derived database: they carry ODbL, are offered as such, and attribution appears on the plate and in the repository — not only in a footer.

14. **Raw PBF is never committed.** The pipeline emits simplified geometry and metrics per site.

15. **Zero network requests at runtime.**

16. **Nothing is computed in a component.**

## Working style

- **Read the Boeing paper before implementing the measures.** It is open access and it defines φ, the binning, and the weighting precisely. Do not reconstruct them from memory — cite the section in the comment.
- **Write the synthetic generators before the measures.** A perfect grid, the same grid rotated, a random geometric graph, a pure tree. You know their answers, so correctness is provable rather than plausible.
- **Assert rose symmetry from the first commit.** It is free and it catches bearing-convention errors immediately.
- **When a metric looks wrong, check the bearing convention and the length weighting first.** Those are where this kind of code bleeds.
- **Build coverage confidence at M1, not later.** The headline comparison is only meaningful with it, and a plate shipped without it makes a claim it cannot support.
- **When tempted to rank the sites, stop.** Sorting is fine; scoring is not. §4 of the PRD.
- **Don't touch `next.config.js`, the Actions workflow, `lib/tags`, or `data:validate` without saying so explicitly.**
- **Don't add a graph, charting, or mapping dependency.**
- **Never weaken a test to make something pass.**

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for modes, sites and results, keyed on `type`. Exhaustive `switch` with a `never` default.
- No `any`. No non-null `!` in `lib/morphology`.
- Bearings in degrees `[0, 360)` named `*Deg`. Lengths in metres named `*M`. Entropy dimensionless named `*Entropy`. φ named `orientationOrder`.
- Follow the paper's notation where it exists: `H` for entropy, `phi` for orientation-order. Cite the section in a comment.
- Site ids stable and readable: `menteng`, `kampung-bendungan-hilir`, `bsd-cluster`, `ikn-inti`. They appear in URLs.
- Indonesian first in UI copy; morphology terms in their standard English form where that is what a reader will meet elsewhere — *entropy*, *circuity*, *dead-end*.
- Tabular figures on every metric.
- Tailwind tokens exactly as in `DESIGN.md` — `plate`, `ink`, `rule`, `drive`, `walk`. Never raw hex in components.

## Testing rules

- `pnpm test:run` before every commit; `test:synthetic` and `test:invariants` before any commit touching `lib/morphology` or `lib/tags`.
- **Synthetic fixtures are permanent:** a perfect square grid gives four populated bins and minimum entropy; the same grid rotated 29° gives identical entropy with shifted bins; a random geometric graph gives near-maximum entropy; a pure tree gives its constructed dead-end proportion exactly.
- **Rose symmetry asserted on every histogram**, synthetic and real.
- **Circuity ≥ 1 asserted on every sampled pair.**
- Degree proportions asserted to sum to one.
- New site → radius recorded, both modes computed, coverage confidence present.
- Tag-mapping change → sensitivity recomputed and reported; no assertion, since the numbers legitimately move.
- Determinism: same extract version, sites, radius and tag mapping produce a byte-identical bundle.
- Bug fix → failing test first.

## Deployment

`main` builds and deploys via Actions; the synthetic and invariant suites plus data validation gate it. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. Site data ships as a separate chunk. Verify with `pnpm preview` before pushing.

## Framing

The site cites Boeing 2019 for the method, states the sampling radius and tag mapping on every card, reports footway coverage per site, and says plainly that it describes urban form rather than rating it. OpenStreetMap is attributed under ODbL and the derived data is offered under the same terms. No OIKN or government branding anywhere, including on the IKN card.

## Current state

**M0–M6 shipped.** Measures, pipeline, plate, pair, assumptions and method are all in place; 12 sites at r = 800 m, both modes, 3 tag mappings, 201 tests green.

Two things worth knowing before picking up the next task:

- **`data:fetch` uses Overpass, not the Geofabrik PBF.** Twelve discs of a kilometre are a few megabytes against most of a gigabyte, and reading PBF would mean a protobuf dependency for data used once. Build-time only, cached under a git-ignored `data/cache/`, requests sequential and spaced. The invariant that neither service is touched at runtime is unchanged.
- **Nine of the twelve sites come back flagged for thin footway coverage.** That is the risk the PRD names, measured rather than assumed. The plate and every affected pair say so in prose before a reader can draw a conclusion from the gap. Do not quietly drop the flag to make the headline comparison look stronger.

**The plate is a big document, and that is a decision rather than an oversight.** It exports at about 2.1 MB of HTML, 347 KB gzipped, and roughly 59% of that is the RSC flight payload the App Router inlines — a serialised second copy of every SVG path and every rose-table row. The payload is structural: it is not caused by a stray client component, and the product has exactly one of those (`NavLink`, which sets `aria-current`). What is left to trim is content, and the largest item is the sixteen collapsed rose tables. Those stay. DESIGN.md §10 requires a table equivalent that is available rather than reachable, and moving it behind a link to the pair page would make it the fallback that line forbids. If you measure this page and it looks alarming, this is the reasoning you are looking for.

Adding a site is `data/sites/index.ts`, then `pnpm data:fetch && pnpm data:build && pnpm data:validate`. `public/data/` is generated from `data/out/` by `scripts/publish-data.mjs` on `dev` and `build` — it is how the ODbL offer is made good, so don't drop it.

**Coverage is still the binding constraint on the finding, and it always will be.** `pnpm data:survey` measures candidate centres before they are adopted — same radius, same tag mapping as the pipeline, selecting on data completeness and never on the metrics, because choosing sites by their entropy would be choosing the finding in advance. Seven of sixteen sites now clear the threshold. Every gated perumahan candidate surveyed came back thin (1.4–4.4%), which bounds what the kampung-versus-perumahan comparison can currently say. Adding a well-mapped perumahan cluster, or mapping one, is the single most valuable thing anyone could do here.

Where the next real work is:
- **A screen-reader pass with VoiceOver or NVDA is still owed.** `pnpm audit:a11y` checks the exported HTML for the structures a reader depends on and gates CI, but it cannot tell you whether a page makes *sense* when heard — in particular whether the pair view's three columns are followable in reading order, and whether 36-row rose tables are navigable or merely present.
- **The overlaid rose still separates its two series by hue alone.** Mitigated by the caption, the per-bin title and the table, not solved. drive and walk sit at 1.4:1 to each other by luminance.
- **`pnpm data:survey` candidates are hand-listed.** They could be found by querying for footway density across a city rather than by guessing neighbourhoods.
