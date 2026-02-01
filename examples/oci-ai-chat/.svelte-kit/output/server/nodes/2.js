import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.CronAMfp.js","_app/immutable/chunks/DMBfRyyZ.js","_app/immutable/chunks/D_LdEIn5.js","_app/immutable/chunks/zUq2wEOL.js","_app/immutable/chunks/B-Yz9b8_.js"];
export const stylesheets = [];
export const fonts = [];
