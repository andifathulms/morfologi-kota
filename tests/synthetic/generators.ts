/**
 * The synthetic fixtures, re-exported.
 *
 * They moved to `lib/reference/networks.ts` so the pipeline can emit them —
 * a reader needs the same known-answer networks the suite uses in order to
 * read a real number, and shipping a different set would mean the calibration
 * on the page was not the calibration CI checks.
 *
 * This file stays so the suite's imports are unchanged: a pedagogy pass should
 * not touch a single assertion.
 */
export * from '@/lib/reference/networks'
