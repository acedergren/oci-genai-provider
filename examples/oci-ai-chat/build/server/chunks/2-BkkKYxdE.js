import { g as getRepository } from './db-BQTIxghw.js';
import { g as getCurrentSessionId } from './session-CLd7uHz-.js';
import 'zod';
import 'uuid';
import 'fs';
import 'path';
import 'util';
import 'os';

const load = async ({ cookies }) => {
  const repository = getRepository();
  const currentSessionId = getCurrentSessionId(cookies);
  const sessions = repository.listSessions({ limit: 50 });
  const initialMessages = currentSessionId ? repository.getSessionTurns(currentSessionId).flatMap((turn) => [
    turn.userMessage && { role: turn.userMessage.role, content: turn.userMessage.content },
    turn.assistantResponse && { role: turn.assistantResponse.role, content: turn.assistantResponse.content }
  ].filter(Boolean)) : [];
  return {
    sessions,
    currentSessionId,
    initialMessages
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 2;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BrdTwkWQ.js')).default;
const server_id = "src/routes/+page.server.ts";
const imports = ["_app/immutable/nodes/2.CronAMfp.js","_app/immutable/chunks/DMBfRyyZ.js","_app/immutable/chunks/D_LdEIn5.js","_app/immutable/chunks/zUq2wEOL.js","_app/immutable/chunks/B-Yz9b8_.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=2-BkkKYxdE.js.map
