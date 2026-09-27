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
--plate        #F4F3EE   the sheet — the page
--sheet        #FBFAF7   raised ground: menus, figure panels, the pair spread
--well         #E8E6DF   sunk ground: sticky toolbar, running head
--ink          #15161A   network lines, text, rose outlines      16.3:1
--ink-muted    #383A40   long-form prose                         10.2:1
--ink-subtle   #52545B   labels, captions, units                  6.8:1
--rule-strong  #6C6E74   structural: card rules, section edges     4.6:1
--rule         #86878C   informative: sampling circle, rose ring   3.2:1
--rule-faint   #D6D4CD   decorative: row separators                1.3:1
```

The networks are drawn in ink on plate. Nothing else. A street network rendered in colour becomes decoration; rendered in black it stays evidence.

**The stock moved in the 2026 design pass.** It was a warm cream (#F7F4EC), and the cream read as an old scan rather than a current study and dulled the printing blue. The sheet is now a cooler, less yellow off-white; it is still not bright white, because neither ink is one a press would put on bright white. Every text role clears AA on it and the measured ratio is written beside the token, in `globals.css` as well as here — a muted step whose contrast nobody wrote down is how `text-ink/50` once shipped at 3.5:1.

**Three grounds, not one.** `sheet` is raised and `well` is sunk. They separate the surfaces a reader operates (the toolbar, a menu) from the plate the figures sit on, without a drop shadow anywhere in the product. They are grounds, not rungs: every text rung, the structural rule and both hues are asserted at their thresholds on all three.

### The neutrals are a ladder, and every rung has a job

The sheet and the two hues have not moved. Everything between them has, because three of the rungs used to do nearly the same thing and two of them could not draw a boundary a reader could see.

**`rule` carries information, so it clears 3:1.** The sampling circle is the edge of the sample and the rose's ring is the bound its bars are read against. Neither is decoration, and at 2.0:1 both were lines you could only see once you knew they were there.

**`rule-faint` is below 3:1 on purpose and is the only token that is.** It separates rows in a column whose figures are already aligned and whose labels are already present; nothing in the table depends on seeing it. A row rule that competes with its own numbers is how ten metrics became a grey block twice the weight of the drawing above them.

**The ratios are asserted, not remembered.** `tests/unit/palette.test.ts` recomputes every one of them from the hex beside it and fails when a colour and its comment drift apart — which is the failure a written-down number can never catch on its own, because the page still renders perfectly with the wrong figure in the margin. It also holds the ladder in descending order and refuses a second rung below 3:1.

### The only two hues in the product

```
--drive        #1B4F78   printing blue                            7.8:1
--walk         #A8431C   brick                                    5.4:1
--overprint    #635853   half-strength drive × walk — not chosen  6.2:1
```

The blue is a little deeper and cooler than it was (#1F4E6B) so it separates from ink on a thin rose bar; the brick a little warmer (#A3431F) so it reads as brick rather than rust on the new stock.

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

**They are two press inks, and where they overlap they overprint.** In the paired rose both series are filled at half strength and multiply, so the overlap is the colour the two tints make together — the operation a two-colour press performs, and the reason this palette belongs to this product rather than to any product. `--overprint` is declared only so a key can draw a swatch and so a browser without `mix-blend-mode` has something to fall back to; on the page it is produced, never painted.

**Half strength, not full.** At full strength blue × brick is #14140D — indistinguishable from the ink outlines — so until this pass the paired rose read as a black shape with coloured fringes, and the gap the hues exist to show was the one thing it hid. At half strength the three regions are three visibly different tones, and the outlines, at full strength, still carry each bar's edge.

**The overprint does not replace the shape cue, and must not be allowed to.** Blue and brick sit at 1.4:1 to each other — a figure the palette test records rather than tolerates — so they are not separable by luminance and never were. Overprint distinguishes the *overlap*; the heavy outline on walk distinguishes the *two networks*. A reader who separates neither hue still reads three regions. Removing the outline because the overlap now has a colour would quietly return the product to hue-only encoding.

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

### The plate's reading order

```
the opening        one disc — Kendara / Jalan kaki / Selisih — and its readout
the caveat         ⚑ the coverage finding, in full, ahead of every figure
the gap figure     two marks per site on one axis; thin sites in their own block
the toolbar        sticky: sort menu, direction, density, coverage filter
the cards
```

**The page shows the claim before it explains it.** Until the 2026 pass about 3,700 px of argument, calibration networks and legend stood ahead of the first card. The argument's findings are now the gap figure; the calibration, the legend and the method notes are on the method page under *Cara membaca lempeng*, linked from the toolbar. The coverage caveat did not move, because PRD §4 fixes where it goes.

### 6c. The gap figure

One row per site, a solid drive square and an outlined walk square on one axis, so the line between them is the gap — the 24-row table it replaced said the same thing in numbers a reader had to subtract. It carries the ruler's guards (§6a): sorted and saying so, no ramp, no third hue. **Thin sites are shown in their own block, under a heading that says they are not compared, with hollow marks and a broken line** — interleaving them would compare them and dropping them would hide the data's first finding. Three metrics switch with radios; each is a list of real text, and the full table sits beneath as its text equivalent (§10).

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

**Since the 2026 pass the rose sits beside its numbers, and the metric column is one table carrying both modes** — each metric named once, drive and walk side by side, the same rows and formats as every other column. The coverage line is a meter: a bar from 0 to 50% with both thresholds marked, ink on `--well`, describing the data and not the place. The disc is the link to the pair.

**Coverage is stated before the drawing, not under the metric column.** Nine of sixteen sites are flagged and the flag bounds every number beneath it. Arriving after ten rows of metrics, it reaches the reader after they have already drawn a conclusion from the gap. A thin site takes the ink rule the asides use for a caveat — typographic, never chromatic; §3 still holds and nothing here is an error.

**The card is bounded by a rule across its top, not a box on four sides.** A box at every edge makes sixteen documents; a top rule makes one plate of sixteen figures. Small multiples work when the eye can sweep a row of roses or run down a column of the same number, and a border interrupts exactly that sweep. Rows are spaced further apart than columns so the rule reads as the start of a card rather than the underside of the one above.

### 6a. The distribution ruler

A number alone is unreadable. `φ 0.308` is ordered or it is not, and the answer is in the other fifteen sites — which on this plate are two screens away. Under each headline figure sits the set, drawn: a hairline axis across the observed range, one faint tick per site, and this site's mark where it falls.

**Both modes share one axis.** The range is the extremes of every site in *either* mode, so the horizontal distance between the drive mark and the walk mark is ΔH. Two independently scaled rulers would put the two figures on two different axes, and the gap — the entire subject of the product — would be the one thing the figure could not show.

**It is a distribution, not a league table**, and the guards are not decoration:

- The axis is the observed range of these sites. Nothing marks either end as preferable, because nothing about the measurement makes either end preferable.
- No ramp, no gradient, no diverging scale. The mark takes its series' ink; the ticks are `--rule-strong`. §3 stands.
- The text equivalent says *sorted by*, never *ranked*: "position 4 of 16 when the set is sorted by this metric, smallest first". §4 permits sorting and this is a sort, stated as one.
- The set is not a population. Sixteen sites chosen on data completeness are not a sample of Indonesian urban form, and the plate says so above the grid.

**Hovering a card lights that site's tick on every other card's ruler.** Every ruler carries a tick for every site, so this is the sweep across small multiples that a grid of separate figures cannot otherwise make: where does this place sit, on every other place's scale, at once. `:has()`, no script, 120 ms.

### The plate says what it is sorted by

The control is at the top of the page and the cards are three screens below it. The figure that produced the current order takes a neutral band — `--rule-faint`, no hue, nothing that could be read as a grade — on every card that carries it. A reader should never have to scroll back to the control to remember what they are looking at an ordering of.

The name sort marks nothing. The alphabet is not a finding.

**The coverage caveat is restated above the grid.** It is made properly in the opening, which a reader arriving by a shared sort link has not read, and nine of sixteen sites are flagged. It is set at the size of the argument it is, not as a parameter.

### The control is a control

Sorting is the plate's main verb, so it is set as one. Three named groups — **the site**, **per mode**, **between modes** — because that is the only distinction that matters when choosing a sort: the third is the product's subject, the second is a figure for one network, and the first is not a measurement at all. Eleven chips of equal weight, wrapping into two rows, is a tag cloud.

**It is a sticky toolbar.** The sort is a menu (`<details>` holding the same radios, grouped the same way) whose summary always names the current sort, so a reader on the ninth card still knows what the grid is an ordering of. Direction, density and a coverage filter are segmented controls beside it. The bar sits on `--well`. The coverage filter hides the thin cards only when the reader asks; the default is every site.

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

### 6b. The pair reads as a spread

A pair page is three figures, two metric columns and a difference drawing, and it is taller than any screen it will be read on. It is set as a journal spread, because that is the form that solves exactly this.

**The running head is the legend contract made continuous.** Site, city, type, radius, bin count and coverage state, sticky at the top of the article. Past the second disc a reader has otherwise lost the two things every figure below is conditional on. It is the one-line form; the full band stays in the margin rail, where there is room to say it properly.

**Parameters go to the margin, the argument holds the measure.** Radius, tag mapping, coverage sentence and extract version sit in a ruled rail to the right from `lg`, which is where a journal puts a footnote. As a full-width band they were a wall of monospace a reader had to cross to reach the drawings, with the sentence that matters — the coverage caveat — fourth in it.

**Figures are numbered here and nowhere else.** The pair's three figures are fixed and in a fixed order, so a number means something and gives a reader something to point at. The plate's cards are deliberately unnumbered: they re-sort, and a number that moves names nothing.

**The opening is the two discs and the gap between them.** Since the 2026 pass the discs take the width of their columns and the middle column carries the gap at headline size — kilometres reachable only on foot, then the change in intersection density, dead-ends and H, then the overlaid rose. A site's finding is a number like +23.7 km and it was a row in a table.

**One comparison table replaced three metric columns.** Every metric is named once; drive, walk and their difference sit side by side (so it is still never a vertical stack), and a last column places both values in the set on the distribution ruler's terms (§6a) — every site's tick in both modes, a solid drive square, an outlined walk square, no preferred end. The notes the columns each printed are stated once under it.

**Previous and next walk the set by name.** Never by a metric: a *next* that meant *next best* would be the ranking PRD §4 forbids.

**The method paragraph is stated once per page.** It printed under all three roses — the same eighty words, three times, on a page whose subject is the difference between two of them.

**No initial capital on the opening paragraph.** The site notes are one sentence; a three-line drop cap on a two-line paragraph is a broken figure rather than an editorial one. The opening takes its weight from size and measure instead.

**Every card carries its radius and coverage confidence.** Not in a tooltip — printed on the card.

### 6d. Three places, each with one job

```
Lempeng   shows      the claim, the gap at every site, the cards
Lokasi    finds      the set by island group, and every pair page
Metode    explains   reading the plate, parameters, definitions, calibration,
                     limitations, site selection — and Asumsi as its second tab
```

**The masthead is one row**: the mark and wordmark, the three sections, a chip naming the active tag mapping, and the language. The chip is on every page and links to *Asumsi* — the mapping changes every number, so it is stated where every number is rather than behind one nav item (CLAUDE.md, Invariants §3). The standing description stays under the row at caption size; the plate's opening says it at full size.

**The Lokasi index groups by island**, which is a fact about location and never a classification of form: it tints nothing and orders nothing but the alphabet within a group. It opens with the site centres plotted by longitude and latitude and no basemap — the archipelago appears from the points alone, and so does how unevenly the set covers it. Thin-coverage centres are hollow, as in the gap figure. Each entry carries the overlaid rose with its H and φ set beside it (§4, Invariants §12).

## 7. Type

```
Newsreader                   display, headings, prose — academic register
Atkinson Hyperlegible Next   labels, controls, axis text, metric names
Atkinson Hyperlegible Mono   all figures, bearings, coordinates, citations
```

Self-hosted: Newsreader via `next/font/google`, both Atkinson faces from `app/fonts` via `next/font/local` (OFL 1.1), because the Google loader in Next 14 predates them.

**Newsreader is variable on `opsz`, and the axis is requested.** Source Serif 4 has the same axis and was loaded as two static weights, which meant the 36 px heading was set with the letterfit of 16 px body text and the body with the letterfit of a heading — exactly backwards, and invisible until you know to look for it. Optical sizing now follows the size, automatically, everywhere the serif appears.

**Atkinson Hyperlegible is a decision, not a taste.** It was drawn by the Braille Institute for readers with low vision, and its letterforms are drawn so that the characters that normally collapse into one another stay apart: `l` against `I` against `1`, `0` against `O`, `6` against `8`, `b/d`, `p/q`. This product is made of place names and three-decimal figures. That is the whole argument.

**The argument now covers the figures too.** Since 2025 the Braille Institute ships *Next*, variable 200–800 — which ends the missing 600 the original imposed — and a *Mono* with the same disambiguated forms. The mono replaced IBM Plex Mono, so the digits, which are most of the text in a metric column, get the legibility the sans was chosen for, and labels and figures read as one voice.

**Metric names are sans; only figures are mono.** A column where the label and the number were both monospace read like a terminal, and the figure lost its emphasis to its own label.

**Display headings are 500, tracked −2.5%.** 600 at 36 px and above was heavy for a journal, and the serif's default fit opens up at display sizes.

```
13  15  16  18  22  28  36  46      1.25 ratio, with two roles below the floor
```

Light ground, so no dark-mode weight correction. Body 400, display headings 500, small headings and labels 600.

**Body floor is 16.** A sentence a reader is expected to read is 16 or larger, including the ones that feel secondary: the standing description in the masthead and the thin-coverage warning are both arguments, not annotations.

**15 is the metric size** — captions, units, citations, and every figure in every metric column. It was 14, which made the densest text in the product also the smallest: a metric column is ten mono rows, read down and compared across sixteen cards, and it was set two steps below prose that nobody has to compare at all. The floor was protecting the wrong thing.

**13 is the standing-label role and nothing else.** Uppercase, tracked, never a figure, and never interactive — a label names a thing, a control is pressed, and the smallest type in the product is the wrong size for anything a reader has to hit. Uppercase with letter-spacing reads larger than its nominal size, which is what lets a section marker sit under the numbers it introduces instead of competing with them.

### Two leadings, because prose and captions are two jobs

```
--lead-prose  1.62   long-form serif at prose measure
--lead-note   1.45   card notes, captions, secondary paragraphs
```

One value used to do both, so a nine-line argument and a two-line site note were set identically. Long-form at 68 characters wants the air; a note that ends before it needs it looks loose with the same figure.

### The label role

`13 · uppercase · tracking-wide` marks a **standing label** — an element that names a mode or a destination rather than saying anything: the language switch, a section marker over a figure. Uppercase is what stops these reading as prose at a size where prose is not allowed.

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

**It opens the plate.** The opening disc switches between the driving network, the walking network and *Selisih* — the walk-only edges in ink over the shared network in `--rule-strong` (§5's one permitted distinction). Choosing *Selisih* redraws the walk-only edges, because an animation restarts when its element is rendered again. Radios and `:has()`, no script; the difference is the resting state.

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
- **Colour is never the only channel:** drive and walk are labelled on every card and in every axis, and the paired view is positional as well as chromatic. **The swatch is drawn on every rose caption, not only the overlaid one** — a single-series rose named in `--drive` and nothing else is a name carried by hue alone, and the two hues are 1.4:1 to each other.
- Metric columns are already text and read cleanly in order.
- Sorting and mode toggles keyboard-operable; focus visible at 3px.
- Type floor 16px; AA contrast on `--plate` for both accents at the sizes used.

## 11. What not to do

- No colour on the network drawings.
- No road-class weight hierarchy.
- No score ramp, no diverging scale, no green-to-red.
- No ruler whose axis has a preferred end, and no ruler labelled as a rank.
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
