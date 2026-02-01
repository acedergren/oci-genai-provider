import { v4 } from "uuid";
import { g as getRepository } from "./db.js";
const SESSION_COOKIE = "oci_chat_session";
const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30
  // 30 days
};
function getOrCreateSession(cookies, options) {
  const repository = getRepository();
  const existingId = cookies.get(SESSION_COOKIE);
  if (existingId) {
    const session2 = repository.getSession(existingId);
    if (session2 && session2.status === "active") {
      return { sessionId: existingId, isNew: false };
    }
  }
  const session = repository.createSession({
    id: v4(),
    model: options.model,
    region: options.region,
    status: "active"
  });
  cookies.set(SESSION_COOKIE, session.id, COOKIE_OPTIONS);
  return { sessionId: session.id, isNew: true };
}
function startNewSession(cookies, options) {
  const repository = getRepository();
  const oldId = cookies.get(SESSION_COOKIE);
  if (oldId) {
    try {
      repository.updateSession(oldId, { status: "completed" });
    } catch {
    }
  }
  const session = repository.createSession({
    id: v4(),
    model: options.model,
    region: options.region,
    status: "active"
  });
  cookies.set(SESSION_COOKIE, session.id, COOKIE_OPTIONS);
  return { sessionId: session.id, isNew: true };
}
function switchToSession(cookies, sessionId) {
  const repository = getRepository();
  const session = repository.getSession(sessionId);
  if (!session) {
    return false;
  }
  if (session.status === "completed") {
    repository.updateSession(sessionId, { status: "active" });
  }
  cookies.set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
  return true;
}
function getCurrentSessionId(cookies) {
  return cookies.get(SESSION_COOKIE);
}
export {
  switchToSession as a,
  getCurrentSessionId as b,
  getOrCreateSession as g,
  startNewSession as s
};
