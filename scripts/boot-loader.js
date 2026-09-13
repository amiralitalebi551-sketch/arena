/*
 * boot-loader.js — the ONLY thing you type into the platform UI.
 *
 * scripts/bootstrap-cmd.sh strips this comment, folds it to one line and
 * base64-encodes it into NODE_OPTIONS, so the container needs NO Command field:
 * node:22-alpine's own CMD (`node`) runs, node honours NODE_OPTIONS, this module
 * is imported first, and it fetches + runs the real bootstrap (scripts/bootstrap.mjs).
 *
 * It caches its payload at $STATE_DIR/bc.mjs, so if GitHub is unreachable on the next
 * restart the proxy still comes back from the mounted volume. That fallback is
 * the whole reason this file is 4 lines instead of 1.
 *
 * Deliberately compact and free of '%' characters: a human pastes it.
 */
const u=process.env.BOOT_URL,c=process.env.BOOT_C||((process.env.STATE_DIR||"/data")+"/bc.mjs"),f=await import("node:fs");
let t,e="";
try{const r=await fetch(u,{signal:AbortSignal.timeout(30000)});if(r.ok)t=await r.text()}catch(x){e=x.message}
if(!t||t.length<99){try{t=f.readFileSync(c,"utf8");console.log("[boot-loader] cached boot ("+e+")")}catch(x){throw new Error("BOOT_URL failed: "+e)}}
try{f.writeFileSync(c,t)}catch(x){}
await import("data:text/javascript;base64,"+Buffer.from(t).toString("base64"));
