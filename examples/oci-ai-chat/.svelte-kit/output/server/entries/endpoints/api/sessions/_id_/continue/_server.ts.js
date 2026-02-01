import { error, json } from "@sveltejs/kit";
import { g as getRepository } from "../../../../../../chunks/db.js";
import { a as switchToSession } from "../../../../../../chunks/session.js";
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
export {
  POST
};
