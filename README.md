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

Twelve sites at a fixed 800 m radius — kampung kota, perumahan cluster,
colonial grid, new town, and IKN — each computed for both networks under three
tag mappings.

**The first finding is a finding about the data.** Nine of the twelve sites
have thin *gang* coverage in OpenStreetMap: their walking network is nearly
their driving network, not because the alleys are absent but because they are
unmapped. Those sites are flagged in the data, on the plate, and above every
affected comparison. The drive/walk gap at a flagged site is not a statement
about the place.

## Development

```bash
pnpm install
pnpm test:run        # unit + synthetic + invariants
pnpm data:fetch      # build time only — pulls OSM extracts per site (cached)
pnpm data:build      # clip, build both graphs, compute, emit data/out
pnpm data:validate   # manifest, radius, coverage, ODbL attribution
pnpm dev
pnpm build && pnpm preview
```

`pnpm test:synthetic`, `pnpm test:invariants` and `pnpm data:validate` gate the
build and CI. **No network request is made at runtime** — the fetch and the
computation are build-time only.
