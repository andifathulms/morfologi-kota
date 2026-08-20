/**
 * Puts a CSS-only control's state in the URL, so it survives a refresh and can
 * be sent to someone.
 *
 * The sort and the tag mapping are radio inputs driven entirely by CSS. That
 * is a deliberate architecture, not an accident: the cards stay server
 * components, so a thousand SVG paths per site never cross a client boundary
 * or enter the hydration payload, and the plate works with scripting off. The
 * cost was that a reader who found a revealing sort had nothing to share — the
 * URL said nothing about what they were looking at.
 *
 * So this adds the smallest thing that fixes it and nothing more: one inline
 * script, no React client component, no router hook, no dependency. It reads a
 * query parameter and checks the matching radio; it listens for a change and
 * rewrites the parameter. Everything else — the ordering, the highlight, the
 * focus ring — remains the CSS that was already there.
 *
 * Four properties worth stating, because each one is why a heavier approach
 * was not taken:
 *
 * - **Scripting off still works.** Without it the page opens on its default
 *   and every control still sorts. That is a complete state, not a degraded
 *   one; only the sharing is missing.
 * - **It runs before the grid parses.** The element is rendered after the
 *   radios and before `.plate-grid`, so the radio is set before the cards
 *   exist and there is no visible re-sort on load.
 * - **`replaceState`, not `pushState`.** Choosing a sort is not navigation,
 *   and forty entries of back-button history for one page would be worse than
 *   the problem being solved.
 * - **The value is checked against a list.** A query parameter is attacker-
 *   controlled input; it selects from `keys` by equality and is never
 *   interpolated into a selector or into the DOM.
 *
 * It applies the radio twice — once immediately, once on `load` — and the
 * second is deliberate. Setting the `checked` IDL attribute raises the
 * element's dirty checkedness flag, after which React's hydration writes
 * `defaultChecked` and cannot move it back; that is the spec's behaviour and
 * it should hold. But it is behaviour I could not exercise here without a
 * browser, so the second pass makes the reasoning unnecessary: it is
 * idempotent, it costs about sixty bytes, and if hydration ever did reset the
 * control the page would repair itself rather than quietly ignore the URL.
 */
export function UrlState({
  param,
  name,
  idPrefix,
  keys,
  defaultKey,
}: {
  /** Query parameter to read and write, e.g. `urut`. */
  readonly param: string
  /** The radio group's `name`, so the listener ignores every other control. */
  readonly name: string
  /** Prefix the radio ids share, e.g. `sort-`. */
  readonly idPrefix: string
  /** Every legal value. Anything else in the URL is ignored. */
  readonly keys: readonly string[]
  /** The value that means "no parameter" — omitted from the URL when chosen. */
  readonly defaultKey: string
}) {
  // `</script>` cannot appear in these values today — they are internal
  // constants — but a JSON string that later could would end the script tag
  // early. Escaping the angle bracket costs nothing and removes the class.
  const j = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c')

  const script = `(function(){
var P=${j(param)},N=${j(name)},X=${j(idPrefix)},
K=${j(keys)},D=${j(defaultKey)};
function A(){try{
var v=new URLSearchParams(location.search).get(P);
if(v&&K.indexOf(v)>-1){var el=document.getElementById(X+v);if(el&&!el.checked)el.checked=true}
}catch(e){}}
A();addEventListener('load',A);
document.addEventListener('change',function(e){
var t=e.target;if(!t||t.name!==N||!t.id||t.id.indexOf(X)!==0)return;
var k=t.id.slice(X.length);if(K.indexOf(k)<0)return;
try{var u=new URL(location.href);
if(k===D){u.searchParams.delete(P)}else{u.searchParams.set(P,k)}
history.replaceState(null,'',u.toString())}catch(e){}
});
})();`

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
