# PRD — Bentuk Kota

**The same neighbourhood is two different cities depending on whether you drive or walk. Indonesian urban form is invisible to the metrics normally used to measure it.**

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, analytical |
| **Deployment** | GitHub Pages (static export, no server, no runtime network) |
| **Language** | Indonesian-first UI; English secondary |
| **Data** | OpenStreetMap via Geofabrik — ODbL |
| **Method reference** | Boeing, G. 2019. *Urban Spatial Order: Street Network Orientation, Configuration, and Entropy.* Applied Network Science 4(1):67. DOI 10.1007/s41109-019-0189-1 |
| **Design** | See `DESIGN.md`. Authoritative for every visual decision. |

*Name: explanatory. Alternatives: **Morfologi Kota**, **Urban Form**. Deliberately not "Pola Jalan" — too close to the sibling project Pola Hujan.*

---

## 1. The method

Boeing's 2019 study measures street network morphology across a hundred cities using OpenStreetMap: the entropy of street bearings in weighted and unweighted models, typical segment length, average circuity, average node degree, and the proportions of four-way intersections and dead-ends — plus an orientation-order indicator **φ** quantifying how closely a network follows the logic of a single grid.

The signature visual is the **polar histogram**: 36 bins, each bar's direction the compass bearing of the streets in that bin, its length their relative frequency. The plots exhibit perfect 180° rotational symmetry, necessarily, since a segment traversed either way differs by exactly 180°.

The examples show what the method reveals. Manhattan's grid sits at 29°, from the 1811 Commissioners' Plan, with Broadway cutting diagonally across it as a vestige of the old Wickquasgeck Trail — the plan and its path dependence in one figure. Chicago is the closest thing to a single perfect grid in the sample at φ = 0.90, with most streets falling into four bins. Boston's neighbourhood grids that don't align with each other produce a visible jumble.

## 2. What makes an Indonesian version original

**Boeing's study is driving-network based, and that cannot see Indonesian urban form.**

A kampung is threaded with *gang* — alleys that are pedestrian-only, tagged in OSM as `footway`, `path` or `service` rather than `residential`. So the same square kilometre yields two entirely different networks depending on which tags you admit.

**A kampung is densely connected on foot and barely connected by car. A gated perumahan is the reverse** — driveable, but with one or two access points and a high dead-end ratio.

So this is not "apply Boeing's method to Indonesia." It is: **compute both networks for the same place and show the gap.** That is simultaneously a genuine result and a critique of applying car-network metrics to cities that do not work that way.

**The paired drive/walk comparison is the product.** Every design and architectural decision serves it.

## 3. The comparison set

Fixed-radius samples so comparison is fair:

| Site type | Expected signature |
|---|---|
| **Kampung kota** | High intersection density on foot, low by car, high entropy |
| **Perumahan cluster** | Low local entropy, high dead-end ratio, few access points |
| **Colonial grid** — Menteng, Kota Lama | Low entropy, clear φ, four-way dominant |
| **New town** — BSD, Alam Sutera | Curvilinear, moderate entropy, low connectivity |
| **IKN** | The open question |

**A hypothesis the tool tests, and does not assert:** that modern planned housing is less connected than the informal settlement it replaced. If the metrics support it that is a real finding; if they don't, that is also a result. **The app reports; it does not conclude in advance.**

**IKN is the live question.** Its street network is a design decision being made now. What φ is it getting? What dead-end ratio? Does it resemble Menteng, BSD, or something new? Placing its rose beside a kampung's and Menteng's is a question with actual stakes.

## 4. The honesty constraints

**Tag interpretation is a modelling choice, not a fact.** Which OSM `highway` values count as drivable and which as walkable changes every number in the product. The mapping is **explicit, documented, and adjustable in the interface** — a user who disagrees can see what changes.

**The headline finding depends on gang being mapped.** If a kampung's alleys are absent from OSM, its walking network collapses toward its driving network and the gap disappears — not because it isn't there, but because nobody mapped it. **Every site therefore reports its footway tagging density as a confidence measure**, and a site with thin pedestrian coverage is flagged rather than compared.

**Radius changes results.** The sampling radius is stated on every card and is not silently varied between sites.

**No site is ranked good or bad.** Different morphologies serve different things; high connectivity is not universally better, and kampung-versus-perumahan carries class overtones in Indonesia that a scoring system would inflame. **The app describes. It does not score.**

## 5. Non-goals

- **No liveability score, no walkability grade, no ranking.** §4.
- **No routing, no navigation, no travel-time estimates.**
- **No nationwide free exploration in v1.** Curated fixed-radius sites; shipping the national network would be gigabytes and would break comparability.
- **No demographic, income, or land-value overlay.** Different data, different project, and combining them invites exactly the judgement §4 excludes.
- **No policy recommendation.**
- **No accounts, no server, no runtime network.**
- **No ML.**

## 6. Features

### 6.1 The plate
Small multiples: one card per site, each with its network drawing, its rose, and its metric column. The whole set visible at once, sortable by any metric — that is how patterns across sites become apparent.

### 6.2 The pair — the product
Any site opened in detail shows **drive and walk side by side**: two networks, two roses, two metric columns, and the delta between them. The gap is the finding, rendered as a comparison rather than described in a caption.

### 6.3 The rose
36 bins, per Boeing. Symmetric by construction. Hovering a bar reports its bearing range and share.

### 6.4 The metric column
Orientation entropy, φ, average circuity, average node degree, four-way proportion, dead-end proportion, intersection density, median segment length. Monospace, tabular, always with units.

### 6.5 Tag mapping
The drivable and walkable tag sets, shown and editable. Change one and the metrics recompute. **The assumption is a control, not a constant.**

### 6.6 Coverage confidence
Footway tagging density per site, with thin-coverage sites flagged. §4.

### 6.7 IKN
Its own card with the same treatment, and a short editorial framing of what its morphology implies — descriptive, not prescriptive.

### 6.8 Method page
The Boeing citation, the metric definitions, the tag mapping, the sampling radius, ODbL attribution, and everything in §4.

## 7. Architecture

Static Next.js 14 App Router export. No backend, no runtime network.

```
Geofabrik Indonesia PBF (build time)
  → clip to fixed-radius sites
  → build drive graph + walk graph per site
  → bearings, entropy, φ, degrees, circuity, coverage
  → emit: simplified geometry + metrics per site per mode
  → plate | pair | rose | method
```

**Build-time only.** Overpass and Geofabrik are never called at runtime — Overpass in particular is a volunteer-funded service whose own operators note it is optimised for flexibility rather than performance, and is not recommended for direct use in web applications.

**`lib/morphology` is pure and runs in Node.** Graph construction, bearings, entropy, φ, degree statistics, circuity sampling. No DOM, no React, no network. This is what makes §8 possible.

**ODbL.** The shipped geometry and metrics are a derived database, so they carry ODbL and are offered as such. Attribution appears on the plate and in the repository, not only in a footer.

**Payload stays small** because sites are curated and geometry is simplified — a few dozen sites, two modes each.

## 8. Testing — synthetic networks with known morphology

No data oracle is needed, because networks with known properties can be constructed.

**A perfect square grid** must produce four populated bins, minimum entropy, and φ at its maximum. **The same grid rotated 29°** must produce identical entropy with shifted bins — a direct check that the measure is rotation-invariant and the binning is right.

**A random geometric graph** must produce near-uniform bearings and near-maximum entropy.

**A pure tree network** must produce a dead-end proportion matching its construction exactly.

**Rose symmetry is a mathematical necessity and a free invariant:** every histogram must be 180°-rotationally symmetric. **An asymmetric rose means the bearing computation is wrong**, and this assertion costs nothing while catching the most likely bug in the whole project.

**Circuity** must be ≥ 1 for every sampled pair, always, by definition.

**Determinism.** Same extract version, sites, radius and tag mapping produce a byte-identical bundle.

**Tag-mapping sensitivity** is reported, not asserted: changing the mapping changes the numbers, and the method page shows by how much.

## 9. Milestones

| | | |
|---|---|---|
| **M0** | The measures | Scaffold; graph construction, bearings, entropy, φ, degrees, circuity. Synthetic suite green. **No UI.** |
| **M1** | Pipeline | PBF clip, site definitions, dual-mode graphs, coverage confidence, metrics emitted. |
| **M2** | The plate | Small multiples, network drawings, roses, metric columns, sorting. **Ship publicly here.** |
| **M3** | The pair | Drive/walk detail view with deltas. **The reason the project exists.** |
| **M4** | Assumptions | Tag mapping control, sensitivity display, coverage flags. |
| **M5** | Context | IKN card and framing, method page, ODbL attribution. |
| **M6** | Polish | Export, sharing, a11y. |

## 10. Success criteria

- Synthetic grids, rotated grids, random graphs and trees all produce their known values.
- Every rose is 180°-rotationally symmetric, asserted.
- Circuity ≥ 1 on every sampled pair.
- Every site reports its sampling radius and footway coverage.
- Thin-coverage sites are flagged rather than silently compared.
- The tag mapping is visible and adjustable.
- No score, grade, or ranking anywhere in the product.
- ODbL attribution present and the derived data offered.
- Zero network requests after first load. JS ≤ 200 KB gzipped.

## 11. Deployment

`output: 'export'`, `basePath` matching the repository name, `.nojekyll` in the output root. Site data ships as a separate chunk. Pipeline validation gates the deploy. Fonts self-hosted. Verify under the production `basePath` with `pnpm preview` before pushing.

## 12. Risks

| Risk | Mitigation |
|---|---|
| **Missing gang read as a real finding.** | Coverage confidence per site, thin sites flagged, stated in the method page. The headline depends on it, so it is measured, not assumed. |
| **Tag mapping treated as objective.** | Exposed as a control with a sensitivity display. Documented as a modelling choice. |
| **Kampung-versus-perumahan read as a judgement.** | No score, no grade, no ranking. Descriptive language throughout. §4. |
| **Overpass hit at runtime.** | Build-time only, stated as an invariant. |
| **ODbL share-alike overlooked.** | Derived data carries ODbL and is offered; attribution structural. |
| **Radius varied silently between sites.** | Stated per card, fixed across the comparison set. |
| **Scope creep into a liveability index.** | §5 is binding. |
