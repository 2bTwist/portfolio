/* The pre-paint script. The root layout inlines it at the top of <body>, so it runs
   before the first paint: a returning visitor's palette and explorer width are in
   place from the first frame. It repeats the palette and explorer-width decoders
   of app/lib/preferences.ts in plain script; preferences.test.ts runs both over
   the same stored strings. The default palette is already server-rendered, so only
   the others ride along. Only the server imports this, which keeps the palette
   data out of the client bundle. */

import { DEFAULT_PALETTE_INDEX, PALETTES } from "./palette";
import { EXPLORER_RANGE, PREFERENCES } from "./preferences";

const OTHER_PALETTES = Object.fromEntries(
  PALETTES.flatMap((p, i) => (i === DEFAULT_PALETTE_INDEX ? [] : [[i, p.vars]])),
);
export const PRE_PAINT_SCRIPT = `try{(function(s){
function num(v){var n=Number(v);return v!=null&&v.trim()!==""&&isFinite(n)?n:undefined}
var p=${JSON.stringify(OTHER_PALETTES)},i=num(s.getItem(${JSON.stringify(PREFERENCES.palette.key)}));
if(i!==undefined&&p[i]&&Math.floor(i)===i)for(var k in p[i])document.body.style.setProperty(k,p[i][k]);
var w=num(s.getItem(${JSON.stringify(PREFERENCES.explorerWidth.key)}));
if(w!==undefined){w=Math.round(w);if(w>=${EXPLORER_RANGE[0]}&&w<=${EXPLORER_RANGE[1]})document.body.style.setProperty("--explorer-width",w/16+"rem")}
})(localStorage)}catch(e){}`;
