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
pnpm data:discover          # DEV — find candidate centres by footway density
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
- Type: Newsreader (prose, variable `opsz`), Atkinson Hyperlegible (labels and controls, 400/700 only — `font-semibold` resolves to 700), IBM Plex Mono (every figure). `text-xs` is the 15 px metric size; `text-2xs` is the 13 px standing-label role and is never prose and never interactive. `leading-prose` for long-form, `leading-note` for captions.
- Colour and type numbers are asserted, not remembered: `tests/unit/palette.test.ts` recomputes every declared contrast ratio from the hex beside it, and `tests/unit/type-scale.test.ts` holds the floor, the metric size and the label role.

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

**M0–M6 shipped, plus a design pass across the plate and the pair.** Measures, pipeline, plate, pair, assumptions and method are all in place; 27 sites at r = 800 m, both modes, 3 tag mappings, 499 tests green.

The design pass is five commits and it is documented in DESIGN.md rather than here — §6 (the card ranked, the control, density), §6a (the distribution ruler), §6b (the pair as a spread), §7 (the headline metric role). Four things are worth knowing before changing any of it:

- **The card's headline is the rose's caption**, not a block beside it. §12 already requires every rose to carry its H and φ, so a separate headline printed both twice at two sizes. The metric column drops those two rows on the plate for the same reason, and only there.
- **The distribution ruler is the one thing in the product that could be misread as a ranking**, and every guard on it is deliberate: observed range with no preferred end, no ramp, ties sharing a position, and a text equivalent that says *sorted by*. `tests/unit/distribution-ruler.test.ts` holds the line. Read PRD §4 before touching it.
- **Density modes may not drop the rose table or the coverage line.** Contact mode drops the per-card radius and states it once in the sheet legend; that is the only exception and DESIGN.md §6 argues it.
- **Sorting, ordering, density, the cross-card tick highlight and the sorted-metric band are all CSS.** No client component was added and none should be: the cards are server components and a thousand SVG paths per site must never cross the hydration boundary.

Two things worth knowing before picking up the next task:

- **`data:fetch` uses Overpass, not the Geofabrik PBF.** Twelve discs of a kilometre are a few megabytes against most of a gigabyte, and reading PBF would mean a protobuf dependency for data used once. Build-time only, cached under a git-ignored `data/cache/`, requests sequential and spaced. The invariant that neither service is touched at runtime is unchanged.
- **Nine of the twelve sites come back flagged for thin footway coverage.** That is the risk the PRD names, measured rather than assumed. The plate and every affected pair say so in prose before a reader can draw a conclusion from the gap. Do not quietly drop the flag to make the headline comparison look stronger.

**The plate is a big document, and that is a decision rather than an oversight.** It exports at about 3.9 MB of HTML at 27 sites, and roughly 59% of that is the RSC flight payload the App Router inlines — a serialised second copy of every SVG path and every rose-table row. The payload is structural: it is not caused by a stray client component, and the product has exactly one of those (`NavLink`, which sets `aria-current`). The ruler ticks are the one part that grows with the *square* of the set — one tick per site, two rulers per card — so their presentation moved to a class in `globals.css` and their positions round to two decimals, which took them from 165 bytes each to 66. The next lever, when the set outgrows that: the tick pattern is identical on every card, so it could live in `defs` and be referenced with `use`, taking 1,458 elements to 54. It is not done yet because CSS cannot reach inside a `use` shadow tree and the cross-card highlight needs those ticks addressable. What is left to trim is content, and the largest item is one collapsed rose table per site. Those stay. DESIGN.md §10 requires a table equivalent that is available rather than reachable, and moving it behind a link to the pair page would make it the fallback that line forbids. If you measure this page and it looks alarming, this is the reasoning you are looking for.

Adding a site is `data/sites/index.ts`, then `pnpm data:fetch && pnpm data:build && pnpm data:validate`. `public/data/` is generated from `data/out/` by `scripts/publish-data.mjs` on `dev` and `build` — it is how the ODbL offer is made good, so don't drop it.

**Coverage is still the binding constraint on the finding, and it always will be.** `pnpm data:survey` measures candidate centres before they are adopted — same radius, same tag mapping as the pipeline, selecting on data completeness and never on the metrics, because choosing sites by their entropy would be choosing the finding in advance. Eighteen of twenty-seven sites now clear the threshold, from 101 candidate centres surveyed.

**Candidates are found by measurement now, not by memory.** `pnpm data:discover` sweeps 26 cities, bins every mapped footway into cells the size of a sampling disc, ranks them by length, and names them from OSM's own `place` nodes. Two rounds of hand-listing neighbourhoods yielded 10 usable sites from 49 guesses, and the misses said nothing — a neighbourhood nobody thought of is not one that was measured and rejected. The search found Kebayoran Baru, Cihapit, Pathuk, Kesepuhan, Sanur Kaja, Gadang, Gapuk Utara and Hamadi, including the first sites in Papua, Lombok, Cirebon, Banjarmasin and Denpasar.

Three things it taught, all of them now encoded rather than remembered:

- **The survey measures park share for every candidate that clears.** Jakarta Gambir came back at 46.4% coverage, the best figure ever surveyed, and 78% of its pedestrian length is inside Medan Merdeka. Surabaya Jagir clears on 56% park. The rule is >25% green is not a fabric, and `withheld` carries the sentence into the published survey.
- **`landuse=grass` is fetched and then ignored.** Mappers use it for a roadside verge as often as a lawn, and counting it made Bantarjati read 30% park on nothing but planted medians.
- **`data:validate` asserts the survey predicts the pipeline.** Two sites were entered with coordinates from an earlier search run, after re-ranking had relabelled the cells; Gadang built cleanly at 14.0% against a survey row reading 25.3%, and no other check would ever have said so. Tolerance is one percentage point, which also catches a centre typed 35 m off. All six gated perumahan candidates came back thin (0.9–4.4%), which bounds what the kampung-versus-perumahan comparison can currently say. Adding a well-mapped perumahan cluster, or mapping one, is still the single most valuable thing anyone could do here.

**Two things the second survey round taught, and both are about the proxy rather than the cities.**

- **Footway coverage cannot tell a gang from a garden path.** The best-covered candidate in the whole survey — Bogor Suryakencana at 40.9% — is a third botanical garden, because `highway=footway` inside the Kebun Raya counts exactly like an alley. Bogor is in the set at Empang instead, 1.4 km south, where the garden is 7% of the pedestrian length. The rejected centre stays in `data/survey.json` with `withheld` giving the reason, and the method page prints it: a published survey whose best-covered row says "not adopted" and explains nothing invites exactly the inference the project cannot afford. **If you adopt a centre, check what its footways actually are before you trust its coverage.**
- **The same caveat is a property of some real sites, not only rejected ones.** Ubud clears the threshold on a walking network that is mostly rice-field and ridge `path`, and Pasar Atas on one that is partly public stairs. Both are in the set with the caveat written on the card, in the site note and in the plate's summary — the alternative was to exclude two of the ten readable sites for being interesting.

Where the next real work is:
- **A screen-reader pass with VoiceOver or NVDA is still owed.** `pnpm audit:a11y` checks the exported HTML for the structures a reader depends on and gates CI, but it cannot tell you whether a page makes *sense* when heard — in particular whether the pair view's three columns are followable in reading order, and whether 36-row rose tables are navigable or merely present.
- **The overlaid rose still separates its two series by hue alone.** Mitigated by the caption, the per-bin title and the table, not solved. drive and walk sit at 1.4:1 to each other by luminance.
- **The density search only looks at 26 cities and only keeps three cells each.** Both numbers are arbitrary and both are in `scripts/find-candidates.ts`. Widening it is the cheapest way to grow the set, and the survey and the park check will filter whatever it finds.
- **Balikpapan Sepinggan Raya clears at 26% with no park and is not adopted**, because its morphology cannot be established from the map: serially named streets in a residential grid read as planned housing, but nothing in OSM says whether it is gated, and that is the whole of what `perumahan` means here. Someone who knows the place could settle it in a sentence.
