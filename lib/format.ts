/**
 * Number formatting for the metric columns.
 *
 * Every metric carries its units and is set in tabular figures (DESIGN.md §7),
 * because the columns are read down and compared across cards and proportional
 * figures would break the alignment that makes that possible.
 */

export function fixed(value: number, places: number): string {
  return value.toFixed(places)
}

export function percent(value: number, places = 1): string {
  return `${(value * 100).toFixed(places)}%`
}

export function metres(value: number, places = 0): string {
  return `${value.toFixed(places)} m`
}

export function kilometres(valueM: number, places = 1): string {
  return `${(valueM / 1000).toFixed(places)} km`
}

export function perKm2(value: number, places = 0): string {
  return `${value.toFixed(places)} /km²`
}

export function degrees(value: number, places = 0): string {
  return `${value.toFixed(places)}°`
}

/** Deltas are signed: the sign is the point, so it is never dropped. */
export function signed(value: number, places: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sign}${Math.abs(value).toFixed(places)}`
}

export function signedPercent(value: number, places = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sign}${(Math.abs(value) * 100).toFixed(places)}%`
}
