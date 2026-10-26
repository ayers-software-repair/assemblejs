import { definePage } from "@asmjs/core";

// Under the public prefix, placing the ledger deferred: the browser asks for it afterwards, at
// the ledger's own address, which decides of that request as of any other. The badge brings the
// runtime that fills it, as a deferral needs one assembly with a browser half on the page.
export default definePage({ route: "/public/later", place: { ledger: { defer: true } } });
