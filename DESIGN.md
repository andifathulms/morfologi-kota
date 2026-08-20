# DESIGN — Bentuk Kota

Authoritative for every visual decision in this repository. `PRD.md` says what the product is; this says what it looks like and why. When code and this document disagree, this document is right.

---

## 1. The house layer

These projects should read as siblings — recognisably from the same hand — without looking like one template recoloured. **What is shared is rhythm and rigour; what is per-app is identity.**

**Shared across every project:**

```
space    4 8 12 16 24 32 48 64 96 128     4px base
motion   fast 120ms · state 240ms · orchestrated 500–600ms · ease cubic-bezier(0.2,0,0,1)
edge     hairline 0.5px · radius 2px only
```

- **One orchestrated moment per app.** Everything else is state change.
- **The legend contract.** Every view states what it is showing, at what parameters, and what it cannot show.
- **The citation line.** Small, monospace, always present where a claim is made.
- **Type floor 16px.** Tabular figures on anything that updates.
- **Zero runtime network. Offline after first load. Self-hosted fonts.**
- **Reduced motion gets a complete alternative**, never a degraded one.
- **No component library.**

**Per-app:** colour, typeface, layout, and the instrument.

## 2. This app's identity

**A journal figure, not a dashboard.**

The other projects in this set are atlases and instruments. This one is a comparative analysis with a method section, and it should look like what it is: a research plate. Black line work on white stock, sober typography, metrics in a monospace column, everything reproducible.

That register also does real work. §4 forbids scoring kampung against perumahan, and a plate reads as description where a dashboard reads as assessment. **The visual language enforces the framing.**

## 3. Colour — monochrome, plus exactly two

```
--plate   #FAF9F6    paper stock
--ink     #14140F    network lines, text, rose outlines
--rule    #D8D5CC    hairlines, card edges, grid
```

The networks are drawn in ink on plate. Nothing else. A street network rendered in colour becomes decoration; rendered in black it stays evidence.

### The only two hues in the product

```
--drive   #2A5D7C    slate blue
--walk    #A85B32    terracotta
```

**These carry the entire semantic load**, because the drive/walk gap is the finding. Everything else being monochrome means the comparison is the only coloured thing on the page and cannot be missed.

Distinguishable at hairline weight and under common colour-vision deficiencies — necessary, because two overlaid roses is exactly where hue confusion would destroy the point.

### Nothing else gets a colour

**No red.** Nothing here is an error.
**No score ramp, no green-to-red, no traffic light.** §4 of the PRD forbids ranking; a diverging colour scale would smuggle it back in.
**No colour by site type.** Kampung and perumahan are not categories to be tinted — the metrics distinguish them, and colouring them would pre-classify what the tool is meant to measure.

## 4. The rose

36 bins, per Boeing. Bar direction is compass bearing; bar length is relative frequency.

- **Symmetric by construction** — 180° rotational symmetry is a mathematical necessity, and an asymmetric rose is a bug, not a finding.
- North at top, clockwise, cardinal ticks at 0°, 90°, 180°, 270°.
- Bars filled in `--drive` or `--walk`; in the paired view, drawn overlaid with the smaller in front.
- Hairline `--rule` circle at the maximum, so bar lengths are readable against a bound.
- **Every rose is captioned with its entropy and φ.** A rose without its numbers is a shape; with them it is a measurement.

## 5. The network drawing

Ink hairlines on plate, uniform weight — **no road-class hierarchy.** This is a morphology study, not a wayfinding map: rendering arterials thicker would imply an importance the analysis does not use, and would visually flatten the fine grain that is the whole point in a kampung.

Fixed-radius circular clip, edge drawn as a hairline so the sampling boundary is visible rather than implied.

No labels, no basemap, no landmarks. The shape is the subject.

### The one permitted distinction: mode membership

The difference drawing — what walking adds to driving — needs to separate two sets of edges inside a single disc. It does so with **ink for the walk-only edges and `--rule` for the shared network**, never with a hue.

This is not a loophole in the no-hierarchy rule, and it must not be read as one. The rule forbids ranking streets by *road class*, because the analysis does not use road class and drawing it in would smuggle an importance the measurement never claimed. Mode membership is a different thing: it *is* the subject of that figure, it is decided by the tag mapping the page already states, and it is the one distinction the product exists to show.

Nothing else earns this. A drawing may not distinguish by road class, by site type, by traffic, by width, or by anything else. If a second exception is ever proposed, it is being proposed against this paragraph.

## 6. Layout — small multiples

**The plate** is a grid of site cards: network drawing, rose, metric column. All sites visible at once, sortable by any metric — patterns across the set appear by re-sorting, which is what small multiples are for.

**The pair** opens a site into two columns, drive on the left and walk on the right, each with its own network, rose and metrics, and a delta column between them. **Never stacked vertically** — the comparison must be side by side to read as a comparison.

Desktop: four cards per row on the plate, two columns plus deltas in the pair. Mobile: one card per row; the pair becomes a swipe between two panes with the delta column pinned beneath, since side-by-side is unreadable at that width.

**Every card carries its radius and coverage confidence.** Not in a tooltip — printed on the card.

## 7. Type

```
Source Serif 4    display, headings, prose — academic register
IBM Plex Sans     labels, controls, axis text
IBM Plex Mono     all metrics, bearings, coordinates, citations
```

Self-hosted via `next/font`.

```
14  16  18  22  28  36  46          1.25 ratio
```

Light ground, so no dark-mode weight correction. Body 400, headings 600.

**Tabular figures on every metric, without exception.** The metric columns are read down and compared across cards; proportional figures would break the alignment that makes that possible.

## 8. Motion

**The orchestrated moment: bearings accumulating.** Selecting a site draws the network while the rose fills bin by bin, so the histogram is visibly *derived from* the drawing rather than appearing beside it. About 600ms.

In the paired view both modes draw simultaneously — the gap opening as it happens.

Everything else is state change: re-sorting the plate, editing the tag mapping, toggling a mode.

```
--dur-fast    120ms
--dur-state   240ms
--dur-draw    600ms
```

**Reduced motion:** networks and roses render complete and instant. Nothing is lost but the derivation.

## 9. Legend and method — the honesty contract

Never optional. Every card states:

1. **Sampling radius.**
2. **Mode** — drive or walk — and the tag set it used.
3. **Footway coverage confidence**, with thin sites visibly flagged.

And the method page carries the Boeing citation, the metric definitions, the tag mapping with its sensitivity, ODbL attribution, and the statement that this describes rather than scores.

## 10. Accessibility

- **Every rose has a table equivalent** — 36 bins with bearings and shares — always available, not a fallback. It is also what someone would paste into a message.
- **Colour is never the only channel:** drive and walk are labelled on every card and in every axis, and the paired view is positional as well as chromatic.
- Metric columns are already text and read cleanly in order.
- Sorting and mode toggles keyboard-operable; focus visible at 3px.
- Type floor 16px; AA contrast on `--plate` for both accents at the sizes used.

## 11. What not to do

- No colour on the network drawings.
- No road-class weight hierarchy.
- No score ramp, no diverging scale, no green-to-red.
- No colour coding by site type.
- No rose without its entropy and φ.
- No card without its radius and coverage confidence.
- No vertical stacking of the drive/walk pair on desktop.
- No basemap, labels, or landmarks under the networks.
- No dark mode.
- No component library.
