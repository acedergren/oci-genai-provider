import { error, json } from "@sveltejs/kit";
import { g as getRepository } from "../../../../../chunks/db.js";
const GET = async ({ params }) => {
  const repository = getRepository();
  const session = repository.getSession(params.id);
  if (!session) {
    throw error(404, "Session not found");
  }
  const turns = repository.getSessionTurns(params.id);
  return json({ session, turns });
};
const DELETE = async ({ params }) => {
  const repository = getRepository();
  const session = repository.getSession(params.id);
  if (!session) {
    throw error(404, "Session not found");
  }
  repository.updateSession(params.id, { status: "completed" });
  return json({ success: true });
};
export {
  DELETE,
  GET
};
