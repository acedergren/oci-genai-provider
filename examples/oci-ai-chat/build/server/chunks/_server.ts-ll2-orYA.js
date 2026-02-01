import { e as error, j as json } from './index-CoD1IJuy.js';
import { g as getRepository } from './db-BQTIxghw.js';
import 'zod';
import 'uuid';
import 'fs';
import 'path';
import 'util';
import 'os';

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

export { DELETE, GET };
//# sourceMappingURL=_server.ts-ll2-orYA.js.map
