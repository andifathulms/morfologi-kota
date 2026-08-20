# Derived database — ODbL 1.0

The files in this directory are **not** covered by the repository's MIT
licence. They are a derived database built from OpenStreetMap:

> © OpenStreetMap contributors. Available under the Open Database Licence
> (ODbL) v1.0 — <https://opendatacommons.org/licenses/odbl/1-0/>

They are offered here under the **same ODbL terms**, as share-alike requires.

Each `<slug>.json` holds one site: the simplified street geometry for both
modes in local metres about the site centre, the metric column for each mode,
the footway coverage measure, and the sensitivity of the headline numbers to
the tag mapping. `manifest.json` holds the parameters — sampling radius, bin
count, tag mapping, extract version — and the metrics for every site without
the geometry.

Regenerate with `pnpm data:fetch && pnpm data:build && pnpm data:validate`.
The raw extracts these are built from live in `data/cache/` and are never
committed.
