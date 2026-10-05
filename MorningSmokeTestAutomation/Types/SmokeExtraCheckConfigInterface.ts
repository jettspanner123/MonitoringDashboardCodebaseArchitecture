// An environment-specific extra check (FCS, Admin Controlls, JRDS, NOCAS, ...)
// on top of the common pages every environment has. 'page-load-only' pages
// have nothing further to assert on besides the page itself opening; just
// give them a url. 'selector-wait' pages additionally need a specific
// element to show up (a login form, a tree pane, ...) - give them a
// selector too.
type SmokeExtraCheckConfigInterface =
    | { name: string; url: string; kind: 'page-load-only' }
    | { name: string; url: string; kind: 'selector-wait'; selector: string };

export default SmokeExtraCheckConfigInterface;
