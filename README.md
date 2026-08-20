# Bentuk Kota — Morfologi Kota

Street network morphology comparison for Indonesian urban form. Boeing's
orientation-entropy method applied to fixed-radius sites, computed separately
for the **driving** and the **walking** network so that the gap between them is
visible.

> A kampung is densely connected on foot and barely connected by car. A gated
> perumahan is the reverse. A driving-network metric cannot see the difference.
> This computes both networks for the same place and shows the gap.

The app **describes; it never scores.** There is no grade, no ranking, no
liveability index anywhere in the data, the code, or the copy.

## Method

Boeing, G. 2019. *Urban Spatial Order: Street Network Orientation,
Configuration, and Entropy.* Applied Network Science 4(1):67.
<https://doi.org/10.1007/s41109-019-0189-1>

Orientation entropy over 36 bins, the orientation-order indicator φ, average
circuity, average node degree, four-way and dead-end proportions, intersection
density and median segment length — computed per site, per mode.

## Data and licence

Street geometry from **OpenStreetMap contributors**, © OpenStreetMap
contributors, available under the **Open Database Licence (ODbL)**.
<https://www.openstreetmap.org/copyright>

The emitted geometry and metrics in `data/out/` are a **derived database** and
are offered under the **same ODbL terms**. The source code is MIT.

## What it currently shows

Sixteen sites at a fixed 800 m radius — kampung kota, perumahan cluster,
colonial grid, new town, and IKN — each computed for both networks under three
tag mappings.

**The first finding is a finding about the data.** Nine of the sixteen sites
have thin *gang* coverage in OpenStreetMap: their walking network is nearly
their driving network, not because the alleys are absent but because they are
unmapped. Those sites are flagged in the data, on the plate, and above every
affected comparison. The drive/walk gap at a flagged site is not a statement
about the place.

At the seven sites where coverage does allow the comparison, the plate reports
what the numbers say — computed from the data, not written into the copy — and
says in the same breath that seven sites is not a statement about Indonesian
urban form. Candidate sites are measured before adoption with `pnpm
data:survey`, on data completeness only and never on the metrics: choosing
sites by their entropy would be choosing the finding in advance.

**Which numbers survive the modelling choice** is reported too. Entropy,
circuity and average node degree are robust to the tag mapping; φ and dead-end
proportion moderate; four-way proportion, intersection density, median segment
length and network length are sensitive, and mean nothing quoted without the
mapping that produced them.

## Taking the data

The bundles in `data/out/` ship with the site and are linked from the plate,
from every site page, and in full from the method page. Share-alike means they
are offered, not merely credited.

Any page prints as a figure: controls drop out, cards go two to a row and are
never split across a page break, and the legend with the sampling radius and
the attribution stays on the paper.

## Development

```bash
pnpm install
pnpm test:run        # unit + synthetic + invariants + emitted data
pnpm data:survey     # measure candidate centres before adopting them
pnpm audit:a11y      # structural accessibility check over ./out
pnpm data:fetch      # build time only — pulls OSM extracts per site (cached)
pnpm data:build      # clip, build both graphs, compute, emit data/out
pnpm data:validate   # manifest, radius, coverage, ODbL attribution
pnpm dev
pnpm build && pnpm preview
```

`pnpm test:synthetic`, `pnpm test:invariants` and `pnpm data:validate` gate the
build and CI. **No network request is made at runtime** — the fetch and the
computation are build-time only.
