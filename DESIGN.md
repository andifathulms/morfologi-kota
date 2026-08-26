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

## 3. Colour — two inks on a sheet

```
--plate        #F7F4EC   uncoated stock
--ink          #16140F   network lines, text, rose outlines      16.7:1
--ink-muted    #44403A   secondary prose                          9.4:1
--ink-subtle   #5B564E   labels, captions, units                  6.6:1
--rule-strong  #8B8375   card edges, section boundaries           3.4:1
--rule         #B5AE9F   decorative hairlines: rings, circles     2.0:1
--rule-faint   #C9C3B5   row separators inside a table            1.6:1
```

The networks are drawn in ink on plate. Nothing else. A street network rendered in colour becomes decoration; rendered in black it stays evidence.

The ground is warm because neither ink is one a press would put on bright white. Every text role clears AA on it and the measured ratio is written beside the token, in `globals.css` as well as here — a muted step whose contrast nobody wrote down is how `text-ink/50` once shipped at 3.5:1.

### The only two hues in the product

```
--drive        #1F4E6B   printing blue                            8.1:1
--walk         #A3431F   brick                                    5.7:1
--overprint    #13140D   drive × walk — not chosen                16.9:1
```

**These carry the entire semantic load**, because the drive/walk gap is the finding. Everything else being monochrome means the comparison is the only coloured thing on the page and cannot be missed.

**The one place they appear outside a figure is the mark.** The masthead glyph
is a trunk forking into a plain branch and a knotted one — the drivable network
in `--drive`, the walkable network in `--walk`, the shared trunk in `--ink`, in
the same assignment as the legend and never swapped. It is the legend in
miniature rather than a logo that happens to be coloured, which is the only
reason it is allowed: it says the thing the hues are reserved for saying. It
draws in the tokens, not in the exported brand file's own near-miss palette, so
it moves with the sheet under `prefers-contrast: more`. Nothing else may claim
this exception.

**They are two press inks, and where they overlap they overprint.** In the paired rose both series multiply, so the overlap is the colour the two inks make together — the operation a two-colour press performs, and the reason this palette belongs to this product rather than to any product. `--overprint` is declared only so a key can draw a swatch and so a browser without `mix-blend-mode` has something to fall back to; on the page it is produced, never painted.

**The overprint does not replace the shape cue, and must not be allowed to.** Blue and brick sit at 1.4:1 to each other, so they are not separable by luminance and never were. Overprint distinguishes the *overlap*; the heavy outline on walk distinguishes the *two networks*. A reader who separates neither hue still reads three regions. Removing the outline because the overlap now has a colour would quietly return the product to hue-only encoding.

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

### The card is ranked, not merely complete

Every element the card has ever carried is still on it. What is fixed is that it now has an order of arrival and a hierarchy of weight, because a card where the appendix outweighs the evidence makes the reader do the editing:

```
site name · city and type
coverage confidence          ← the caveat, before the thing it qualifies
network drawing              ← the evidence, at the full width of the card
rose + its numbers           ← H at headline size, φ beside it, ΔH under both
metric column                ← the apparatus, at caption size
note · rose table · radius
```

**Coverage is stated before the drawing, not under the metric column.** Nine of sixteen sites are flagged and the flag bounds every number beneath it. Arriving after ten rows of metrics, it reaches the reader after they have already drawn a conclusion from the gap. A thin site takes the ink rule the asides use for a caveat — typographic, never chromatic; §3 still holds and nothing here is an error.

**The card is bounded by a rule across its top, not a box on four sides.** A box at every edge makes sixteen documents; a top rule makes one plate of sixteen figures. Small multiples work when the eye can sweep a row of roses or run down a column of the same number, and a border interrupts exactly that sweep. Rows are spaced further apart than columns so the rule reads as the start of a card rather than the underside of the one above.

### The control is a control

Sorting is the plate's main verb, so it is set as one. Three named groups — **the site**, **per mode**, **between modes** — because that is the only distinction that matters when choosing a sort: the third is the product's subject, the second is a figure for one network, and the first is not a measurement at all. Eleven chips of equal weight, wrapping into two rows, is a tag cloud.

**Direction is its own control.** Each metric starts largest-first and the name starts at A; *Reversed* turns that around, and says so, instead of hiding the direction inside each metric where a reader cannot see it.

**Every chip keeps its mode.** `φ` and `φ — Jalan kaki` are different numbers, and a group legend cannot disambiguate a chip that omits which network it sorts by. Ten repetitions of one word is the price of precision, and this product pays it.

### Density — three ways to draw the same card

The card is taller than it is wide and the plate promises the whole set at once. The honest resolution is not to hide half of it by default but to let the reader choose how much of each card is drawn:

```
Penuh          the full figure — drawing, rose, metrics, note
Ringkas        drops the metric column and the note
Lembar kontak  the drawings alone, six to a row
```

**Nothing is removed from the document and nothing is hidden by default.** A mode changes how much of a card is drawn, never what it says.

**The rose table survives every mode.** §10 forbids making it a fallback, and a density control that quietly dropped it would be exactly that under a friendlier name.

**The coverage line survives every mode**, for the same reason: it is the qualifier on the comparison, not an ornament of the full card.

**The contact sheet states the radius once, for the sheet.** It is the one exception to the rule that every card prints its own, and it is allowed because the radius is fixed across the set, the sheet is a single figure with a single caption, and the alternative is sixteen copies of one parameter inside a figure whose whole point is that nothing but the shape is on it. §6's rule is against a radius that varies silently; a sheet legend states it louder than a card footer does.

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

**Body floor is 16.** 14 is captions, units, citations and control labels — never running prose. A sentence a reader is expected to read is 16 or larger, including the ones that feel secondary: the standing description in the masthead and the thin-coverage warning are both arguments, not annotations.

### The label role

`font-mono · 14 · uppercase · tracking-wide` marks a **standing label** — an element that names a mode or a destination rather than saying anything: the language switch, a section marker over a figure. Uppercase is what stops these reading as prose at a size where prose is not allowed.

It is the only place uppercase or letter-spacing appears. Headings are never uppercase; neither is anything with a verb in it.

**A label is never a heading.** If it introduces one figure rather than a section, it is a `<p>` in this role and the figure is titled by its `<figcaption>`. The plate briefly had three visual treatments for `h2` — 14px mono, 16px sans and 22px serif — which tells a sighted reader three different things about one structural rank.

**One treatment per heading level.** `h1` 36 serif, `h2` 22 serif, `h3` 18 serif or 16 sans where it sits inside a card, `h4` 16 sans. A heading that wants to look smaller than its level is a label; a heading that wants to look bigger is at the wrong level.

### The headline metric role

`font-mono · 22 · tabular` is the **headline metric** — the one figure on a card that is the reason the card exists. On the plate that is H, per mode, with ΔH under both; everything else in the metric column stays at 14.

**It is set in the rose's own caption, not beside it.** §4 already requires every rose to carry its entropy and φ, so a separate headline block prints H twice at two different sizes, and a reader cannot tell whether two identical figures are one measurement or two. The emphasis is a property of the caption, which is why the rose takes it as a prop rather than the card assembling its own.

**φ does not take the headline size.** It is the second reading of the same rose rather than a second finding, so it sits at caption size beside H.

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

- **Every rose has a table equivalent** — 36 bins with bearings and shares — always available, not a fallback. It is also what someone would paste into a message. On the plate that is sixteen cards times thirty-six bins, and it is most of why that page is the size it is. The cost is known and it is accepted: a table that is one click away is a fallback, which is the thing this line exists to forbid.
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
- No coverage flag printed below the numbers it qualifies.
- No headline figure that repeats a number the same card already prints.
- No vertical stacking of the drive/walk pair on desktop.
- No density mode that drops the rose table or the coverage line.
- No sort chip that omits which mode it sorts by.
- No basemap, labels, or landmarks under the networks.
- No dark mode.
- No component library.
