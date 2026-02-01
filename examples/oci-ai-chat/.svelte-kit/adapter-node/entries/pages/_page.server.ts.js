import { g as getRepository } from "../../chunks/db.js";
import { b as getCurrentSessionId } from "../../chunks/session.js";
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
export {
  load
};
