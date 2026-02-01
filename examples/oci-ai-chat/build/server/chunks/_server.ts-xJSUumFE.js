import { e as error, j as json } from './index-CoD1IJuy.js';
import { g as getRepository } from './db-BQTIxghw.js';
import { b as switchToSession } from './session-CLd7uHz-.js';
import 'zod';
import 'uuid';
import 'fs';
import 'path';
import 'util';
import 'os';

const POST = async ({ params, cookies }) => {
  const success = switchToSession(cookies, params.id);
  if (!success) {
    throw error(404, "Session not found");
  }
  const repository = getRepository();
  const session = repository.getSession(params.id);
  const turns = repository.getSessionTurns(params.id);
  const messages = turns.flatMap((turn) => {
    const msgs = [];
    if (turn.userMessage) {
      msgs.push({ role: turn.userMessage.role, content: turn.userMessage.content });
    }
    if (turn.assistantResponse) {
      msgs.push({ role: turn.assistantResponse.role, content: turn.assistantResponse.content });
    }
    return msgs;
  });
  const usage = turns.reduce(
    (acc, turn) => ({
      tokens: acc.tokens + (turn.tokensUsed || 0),
      cost: acc.cost + (turn.costUsd || 0)
    }),
    { tokens: 0, cost: 0 }
  );
  return json({ session, messages, usage });
};

export { POST };
//# sourceMappingURL=_server.ts-xJSUumFE.js.map
