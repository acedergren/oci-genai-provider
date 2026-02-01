import { json } from "@sveltejs/kit";
import { g as getRepository } from "../../../../chunks/db.js";
import { s as startNewSession } from "../../../../chunks/session.js";
const GET = async ({ url }) => {
  const repository = getRepository();
  const limit = parseInt(url.searchParams.get("limit") ?? "20");
  const status = url.searchParams.get("status");
  const sessions = repository.listSessions({ limit, status });
  return json({ sessions });
};
const POST = async ({ request, cookies }) => {
  const body = await request.json().catch(() => ({}));
  const model = body.model ?? "meta.llama-3.3-70b-instruct";
  const region = body.region ?? "eu-frankfurt-1";
  const { sessionId } = startNewSession(cookies, { model, region });
  const repository = getRepository();
  const session = repository.getSession(sessionId);
  return json({ session }, { status: 201 });
};
export {
  GET,
  POST
};
