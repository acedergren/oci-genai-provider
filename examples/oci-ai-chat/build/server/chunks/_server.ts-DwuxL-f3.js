import { j as json } from './index-CoD1IJuy.js';
import { g as getRepository } from './db-BQTIxghw.js';
import { s as startNewSession } from './session-CLd7uHz-.js';
import 'zod';
import 'uuid';
import 'fs';
import 'path';
import 'util';
import 'os';

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

export { GET, POST };
//# sourceMappingURL=_server.ts-DwuxL-f3.js.map
