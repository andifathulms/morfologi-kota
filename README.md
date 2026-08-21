<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/brand/lockup-dark.png">
    <img alt="Bentuk Kota — dua kota, satu alamat" src=".github/brand/lockup-light.png" width="560">
  </picture>
</p>

<p align="center">
  <strong>The same neighbourhood is two different cities depending on whether you drive or walk.</strong><br>
  Street network morphology for Indonesian urban form — the driving network and the
  walking network, measured separately for the same place.
</p>

<p align="center">
  <a href="https://andifathulms.github.io/morfologi-kota/"><img alt="Open the plate" src="https://img.shields.io/badge/open-the%20plate-1F4E6B?style=flat-square"></a>
  <a href="https://github.com/andifathulms/morfologi-kota/actions/workflows/deploy.yml"><img alt="build and deploy" src="https://github.com/andifathulms/morfologi-kota/actions/workflows/deploy.yml/badge.svg"></a>
  <img alt="Code MIT" src="https://img.shields.io/badge/code-MIT-16140F?style=flat-square">
  <a href="https://opendatacommons.org/licenses/odbl/1-0/"><img alt="Data ODbL 1.0" src="https://img.shields.io/badge/data-ODbL%201.0-A3431F?style=flat-square"></a>
</p>

---

A kampung is densely connected on foot and barely connected by car. A gated
perumahan is the reverse. Boeing's orientation-entropy method is computed on
driving networks and cannot see that difference at all — so this computes
**both** networks for the same disc of ground and shows the gap between them.

**It describes; it never scores.** No grade, no ranking, no liveability index,
in the data, the code, the copy or the metadata. Sites can be *sorted*. They are
never *rated*. Kampung-versus-perumahan carries class overtones in Indonesia
that a score would inflame and a measurement can only illuminate.

## The first finding is a finding about the data

Nine of the sixteen sites have thin *gang* coverage in OpenStreetMap. Their
walking network is nearly their driving network — not because the alleys are
absent, but because nobody has mapped them. **The drive/walk gap at those sites
is not a statement about the place**, and every one of them is flagged in the
data, on the plate, and in prose above every comparison it touches.

That leaves seven sites where the comparison can be read at all. The plate says
what those seven say — computed from the data rather than written into the copy
— and says in the same breath that seven sites is not a statement about
Indonesian urban form. Not one surveyed *perumahan* candidate cleared the
threshold, which bounds what the headline comparison can currently claim.

Candidates are measured before they are adopted, at the same radius under the
same tag mapping, **on data completeness only and never on the metrics**:
choosing sites by their entropy would be choosing the finding in advance. The
ones that were measured and rejected are published too.

## What it measures

| | |
|---|---|
| **Sites** | 16 — kampung kota, perumahan cluster, colonial grid, new town, IKN |
| **Radius** | 800 m, fixed across the whole set and printed on every card |
| **Bins** | 36 × 10°, length-weighted |
| **Modes** | drive and walk, computed separately for every site |
| **Tag mappings** | 3, all precomputed, switchable in the page |

Orientation entropy **H**, the orientation-order indicator **φ**, sampled
circuity, average node degree, four-way and dead-end proportions, intersection
density, median segment length and network length — per site, per mode, with the
delta between the two.

**Which numbers survive the modelling choice is reported as well.** Entropy,
circuity and average node degree are robust to the tag mapping; φ and dead-end
proportion moderate; four-way proportion, intersection density, median segment
length and network length are sensitive, and mean nothing quoted without the
mapping that produced them.

## How it is checked

There is no data oracle, so the suite builds networks whose answers are known: a
perfect grid must give four populated bins and minimum entropy; the same grid
rotated 29° must give identical entropy with shifted bins; a random geometric
graph must approach maximum entropy; a pure tree must give its constructed
dead-end proportion exactly.

Two invariants run on every histogram the pipeline emits. **Every rose is
180°-rotationally symmetric** — an asymmetric one means the bearing computation
is wrong, and the check is free. **Circuity is ≥ 1 on every sampled pair**, by
definition. Both gate the build and CI, along with data validation and a
structural accessibility audit over the exported HTML.

## Method

Boeing, G. 2019. *Urban Spatial Order: Street Network Orientation,
Configuration, and Entropy.* Applied Network Science 4(1):67.
<https://doi.org/10.1007/s41109-019-0189-1>

## Data and licence

Street geometry from **OpenStreetMap contributors**, under the **Open Database
Licence (ODbL) 1.0**. <https://www.openstreetmap.org/copyright>

The geometry and metrics emitted into `data/out/` are a **derived database**, so
they carry ODbL and are **offered** under the same terms — linked from the
plate, from every site page, and in full from the method page. Share-alike means
offered, not merely credited. The source code is MIT.

**No network request is made at runtime.** Extracts are fetched at build time
and cached; the deployed pages are static files that do not call OpenStreetMap,
Overpass, or anything else. Any page also prints as a figure: controls drop out,
cards go two to a row and are never split across a page break, and the sampling
radius and attribution stay on the paper.

## Development

```bash
pnpm install
pnpm dev

pnpm test:run        # unit, synthetic, invariants, emitted data
pnpm test:synthetic  # grids, rotated grids, random graphs, trees
pnpm test:invariants # rose symmetry, circuity >= 1, degree sums
pnpm audit:a11y      # structural accessibility check over ./out

pnpm data:survey     # measure candidate centres before adopting them
pnpm data:fetch      # build time only — OSM extracts per site, cached
pnpm data:build      # clip, build both graphs, compute, emit data/out
pnpm data:validate   # manifest, radius, coverage, ODbL attribution

pnpm build && pnpm preview
```

Adding a site is `data/sites/index.ts`, then `data:fetch`, `data:build`,
`data:validate`. `pnpm test:synthetic`, `pnpm test:invariants` and
`pnpm data:validate` gate the build and CI.

Next.js 14 App Router, static export, TypeScript strict, Tailwind, Vitest.
**No graph library, no charting library, no mapping library** — the graph
construction, the entropy and the rose are the project.

`PRD.md` is what it is for. `DESIGN.md` is what it looks like and why, and is
authoritative over both the code and this file. `CLAUDE.md` is the working
brief.

## Where the next work is

- **A screen-reader pass is still owed.** `pnpm audit:a11y` checks the exported
  HTML for the structures a reader depends on, but it cannot tell you whether a
  page makes sense when heard.
- **The overlaid rose separates its two series by hue alone.** Mitigated by the
  outline, the caption, the per-bin title and the table — not solved. The two
  inks sit at 1.4:1 to each other.
- **Adding a well-mapped perumahan cluster, or mapping one**, remains the single
  most useful thing anyone could do to this project.
