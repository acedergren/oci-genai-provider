import { z } from "zod";
import { v4 } from "uuid";
import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
const SessionStatusSchema = z.enum(["active", "completed", "error"]);
const ToolCallStatusSchema = z.enum(["pending", "running", "completed", "error"]);
const SessionConfigSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  agentRole: z.string().optional(),
  systemPrompt: z.string().optional()
}).passthrough();
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  reasoning: z.string().optional()
});
const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
  result: z.unknown().optional(),
  status: ToolCallStatusSchema,
  startedAt: z.number(),
  completedAt: z.number().optional(),
  error: z.string().optional()
});
const SessionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.number(),
  updatedAt: z.number(),
  title: z.string().optional(),
  model: z.string(),
  region: z.string(),
  status: SessionStatusSchema,
  config: SessionConfigSchema.optional()
});
const TurnSchema = z.object({
  id: z.string(),
  sessionId: z.string().uuid(),
  turnNumber: z.number().int().positive(),
  createdAt: z.number(),
  userMessage: MessageSchema,
  assistantResponse: MessageSchema.optional(),
  toolCalls: z.array(ToolCallSchema),
  tokensUsed: z.number().int().nonnegative().optional(),
  costUsd: z.number().nonnegative().optional(),
  error: z.string().nullable()
});
const SCHEMA_VERSION = 1;
function initializeSchema(db) {
  db.exec(`
    -- Schema version tracking
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL,
      title         TEXT,
      model         TEXT NOT NULL,
      region        TEXT NOT NULL,
      status        TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'error')),
      config        TEXT
    );

    -- Turns table
    CREATE TABLE IF NOT EXISTS turns (
      id              TEXT PRIMARY KEY,
      session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      turn_number     INTEGER NOT NULL,
      created_at      INTEGER NOT NULL,
      user_message    TEXT NOT NULL,
      assistant_response TEXT,
      tool_calls      TEXT,
      tokens_used     INTEGER,
      cost_usd        REAL,
      error           TEXT,
      UNIQUE(session_id, turn_number)
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_turns_session ON turns(session_id, turn_number);
    CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  `);
  const existing = db.prepare("SELECT version FROM schema_version").get();
  if (!existing) {
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(SCHEMA_VERSION);
  }
}
function parseJson(json, schema) {
  return schema.parse(JSON.parse(json));
}
function parseJsonOrUndefined(json, schema) {
  if (!json)
    return void 0;
  return schema.parse(JSON.parse(json));
}
function parseJsonOrDefault(json, schema, defaultValue) {
  if (!json)
    return defaultValue;
  return schema.parse(JSON.parse(json));
}
function buildUpdateQuery(table, id, fields, baseUpdates = []) {
  const updates = baseUpdates.map((u) => `${u.column} = ?`);
  const params = baseUpdates.map((u) => u.value);
  for (const field of fields) {
    if (field.value !== void 0) {
      updates.push(`${field.column} = ?`);
      const serialized = field.serialize ? field.serialize(field.value) : field.value;
      params.push(serialized);
    }
  }
  if (updates.length === 0)
    return null;
  params.push(id);
  return {
    sql: `UPDATE ${table} SET ${updates.join(", ")} WHERE id = ?`,
    params
  };
}
class StateRepository {
  db;
  constructor(db) {
    this.db = db;
  }
  // ============================================================================
  // Private Row Mapping Helpers
  // ============================================================================
  /**
   * Map a database row to a validated Session domain object.
   * Uses Zod schema for runtime validation of parsed JSON.
   */
  mapRowToSession(row) {
    return SessionSchema.parse({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      title: row.title ?? void 0,
      model: row.model,
      region: row.region,
      status: row.status,
      config: parseJsonOrUndefined(row.config, SessionConfigSchema)
    });
  }
  /**
   * Map a database row to a validated Turn domain object.
   * Uses Zod schema for runtime validation of parsed JSON.
   */
  mapRowToTurn(row) {
    return TurnSchema.parse({
      id: row.id,
      sessionId: row.session_id,
      turnNumber: row.turn_number,
      createdAt: row.created_at,
      userMessage: parseJson(row.user_message, MessageSchema),
      assistantResponse: parseJsonOrUndefined(row.assistant_response, MessageSchema),
      toolCalls: parseJsonOrDefault(row.tool_calls, z.array(ToolCallSchema), []),
      tokensUsed: row.tokens_used ?? void 0,
      costUsd: row.cost_usd ?? void 0,
      error: row.error
    });
  }
  // ============================================================================
  // Session Methods
  // ============================================================================
  createSession(input) {
    const now = Date.now();
    const id = input.id ?? v4();
    this.db.prepare(`
      INSERT INTO sessions (id, created_at, updated_at, title, model, region, status, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, now, now, input.title ?? null, input.model, input.region, input.status ?? "active", input.config ? JSON.stringify(input.config) : null);
    return this.getSession(id);
  }
  getSession(id) {
    const row = this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
    return row ? this.mapRowToSession(row) : null;
  }
  listSessions(options = {}) {
    const limit = options.limit ?? 50;
    let query = "SELECT * FROM sessions";
    const params = [];
    if (options.status) {
      query += " WHERE status = ?";
      params.push(options.status);
    }
    query += " ORDER BY updated_at DESC LIMIT ?";
    params.push(limit);
    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.mapRowToSession(row));
  }
  updateSession(id, input) {
    const query = buildUpdateQuery("sessions", id, [
      { column: "title", value: input.title },
      { column: "status", value: input.status },
      {
        column: "config",
        value: input.config,
        serialize: (v) => JSON.stringify(v)
      }
    ], [{ column: "updated_at", value: Date.now() }]);
    if (query) {
      this.db.prepare(query.sql).run(...query.params);
    }
    return this.getSession(id);
  }
  // ============================================================================
  // Turn Methods
  // ============================================================================
  addTurn(sessionId, input) {
    const id = `turn_${v4().slice(0, 8)}`;
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO turns (id, session_id, turn_number, created_at, user_message, tool_calls, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, sessionId, input.turnNumber, now, JSON.stringify(input.userMessage), "[]", null);
    this.db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(now, sessionId);
    return this.getTurn(id);
  }
  getTurn(id) {
    const row = this.db.prepare("SELECT * FROM turns WHERE id = ?").get(id);
    return row ? this.mapRowToTurn(row) : null;
  }
  updateTurn(id, input) {
    const query = buildUpdateQuery("turns", id, [
      {
        column: "assistant_response",
        value: input.assistantResponse,
        serialize: (v) => JSON.stringify(v)
      },
      {
        column: "tool_calls",
        value: input.toolCalls,
        serialize: (v) => JSON.stringify(v)
      },
      { column: "tokens_used", value: input.tokensUsed },
      { column: "cost_usd", value: input.costUsd },
      { column: "error", value: input.error }
    ]);
    if (!query)
      return this.getTurn(id);
    this.db.prepare(query.sql).run(...query.params);
    return this.getTurn(id);
  }
  getSessionTurns(sessionId) {
    const rows = this.db.prepare("SELECT * FROM turns WHERE session_id = ? ORDER BY turn_number ASC").all(sessionId);
    return rows.map((row) => this.mapRowToTurn(row));
  }
  // ============================================================================
  // Session Resume Methods
  // ============================================================================
  /**
   * Get the most recent active session.
   * Used for `--continue` flag functionality.
   */
  getMostRecentSession() {
    const row = this.db.prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1").get();
    return row ? this.mapRowToSession(row) : null;
  }
  /**
   * Restore a complete session with all its turns.
   * Returns session + turns for full context restoration.
   */
  restoreSession(id) {
    const session = this.getSession(id);
    if (!session)
      return null;
    const turns = this.getSessionTurns(id);
    return { session, turns };
  }
}
const state = {
  db: null,
  path: null
};
const DEFAULT_DB_DIR = path.join(os.homedir(), ".oci-provider-examples");
const DEFAULT_DB_PATH = path.join(DEFAULT_DB_DIR, "agent-state.db");
function getDatabasePath() {
  return process.env.AGENT_STATE_DB_PATH ?? DEFAULT_DB_PATH;
}
function ensureDirectory(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
function getConnection(customPath) {
  const requestedPath = getDatabasePath();
  if (state.db) {
    if (state.path && requestedPath !== state.path) {
      throw new Error(`Connection already exists to "${state.path}". Cannot connect to "${requestedPath}". Call resetConnection() first to connect to a different database.`);
    }
    return state.db;
  }
  ensureDirectory(requestedPath);
  state.db = new Database(requestedPath);
  state.path = requestedPath;
  state.db.pragma("journal_mode = WAL");
  state.db.pragma("foreign_keys = ON");
  initializeSchema(state.db);
  return state.db;
}
let repository = null;
function getRepository() {
  if (!repository) {
    const db = getConnection();
    repository = new StateRepository(db);
  }
  return repository;
}
export {
  getRepository as g
};
