// packages/agent-state/src/repository.ts
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  type Session,
  SessionSchema,
  SessionConfigSchema,
  type Turn,
  TurnSchema,
  type Message,
  MessageSchema,
  type ToolCall,
  ToolCallSchema,
} from './types.js';
import { z } from 'zod';

// ============================================================================
// SQLite Row Types (database representation)
// ============================================================================

/** Raw session row from SQLite */
interface SessionRow {
  id: string;
  created_at: number;
  updated_at: number;
  title: string | null;
  model: string;
  region: string;
  status: string;
  config: string | null;
}

/** Raw turn row from SQLite */
interface TurnRow {
  id: string;
  session_id: string;
  turn_number: number;
  created_at: number;
  user_message: string;
  assistant_response: string | null;
  tool_calls: string | null;
  tokens_used: number | null;
  cost_usd: number | null;
  error: string | null;
}

// ============================================================================
// JSON Parse Helpers (with Zod validation)
// ============================================================================

/**
 * Parse JSON string with Zod schema validation.
 * Provides runtime type safety instead of unsafe type assertions.
 */
function parseJson<T>(json: string, schema: z.ZodSchema<T>): T {
  return schema.parse(JSON.parse(json));
}

/**
 * Parse optional JSON string with Zod schema validation.
 * Returns undefined if json is null/undefined.
 */
function parseJsonOrUndefined<T>(json: string | null, schema: z.ZodSchema<T>): T | undefined {
  if (!json) return undefined;
  return schema.parse(JSON.parse(json));
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateSessionInput {
  id?: string;
  model: string;
  region: string;
  title?: string;
  status?: 'active' | 'completed' | 'error';
  config?: Record<string, unknown>;
}

export interface UpdateSessionInput {
  title?: string;
  status?: 'active' | 'completed' | 'error';
  config?: Record<string, unknown>;
}

export interface AddTurnInput {
  turnNumber: number;
  userMessage: Message;
}

export interface UpdateTurnInput {
  assistantResponse?: Message;
  toolCalls?: ToolCall[];
  tokensUsed?: number;
  costUsd?: number;
  error?: string | null;
}

export interface ListSessionsOptions {
  limit?: number;
  status?: 'active' | 'completed' | 'error';
}

export class StateRepository {
  constructor(private db: Database.Database) {}

  // ============================================================================
  // Private Row Mapping Helpers
  // ============================================================================

  /**
   * Map a database row to a validated Session domain object.
   * Uses Zod schema for runtime validation of parsed JSON.
   */
  private mapRowToSession(row: SessionRow): Session {
    return SessionSchema.parse({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      title: row.title ?? undefined,
      model: row.model,
      region: row.region,
      status: row.status,
      config: parseJsonOrUndefined(row.config, SessionConfigSchema),
    });
  }

  /**
   * Map a database row to a validated Turn domain object.
   * Uses Zod schema for runtime validation of parsed JSON.
   */
  private mapRowToTurn(row: TurnRow): Turn {
    return TurnSchema.parse({
      id: row.id,
      sessionId: row.session_id,
      turnNumber: row.turn_number,
      createdAt: row.created_at,
      userMessage: parseJson(row.user_message, MessageSchema),
      assistantResponse: parseJsonOrUndefined(row.assistant_response, MessageSchema),
      toolCalls: row.tool_calls ? parseJson(row.tool_calls, z.array(ToolCallSchema)) : [],
      tokensUsed: row.tokens_used ?? undefined,
      costUsd: row.cost_usd ?? undefined,
      error: row.error,
    });
  }

  // ============================================================================
  // Session Methods
  // ============================================================================

  createSession(input: CreateSessionInput): Session {
    const now = Date.now();
    const id = input.id ?? uuidv4();

    this.db
      .prepare(
        `
      INSERT INTO sessions (id, created_at, updated_at, title, model, region, status, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        now,
        now,
        input.title ?? null,
        input.model,
        input.region,
        input.status ?? 'active',
        input.config ? JSON.stringify(input.config) : null
      );

    return this.getSession(id)!;
  }

  getSession(id: string): Session | null {
    const row = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as
      | SessionRow
      | undefined;

    return row ? this.mapRowToSession(row) : null;
  }

  listSessions(options: ListSessionsOptions = {}): Session[] {
    const limit = options.limit ?? 50;
    let query = 'SELECT * FROM sessions';
    const params: (string | number)[] = [];

    if (options.status) {
      query += ' WHERE status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY updated_at DESC LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(query).all(...params) as SessionRow[];
    return rows.map((row) => this.mapRowToSession(row));
  }

  updateSession(id: string, input: UpdateSessionInput): Session | null {
    const updates: string[] = ['updated_at = ?'];
    const params: (string | number)[] = [Date.now()];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.config !== undefined) {
      updates.push('config = ?');
      params.push(JSON.stringify(input.config));
    }

    params.push(id);

    this.db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    return this.getSession(id);
  }

  // ============================================================================
  // Turn Methods
  // ============================================================================

  addTurn(sessionId: string, input: AddTurnInput): Turn {
    const id = `turn_${uuidv4().slice(0, 8)}`;
    const now = Date.now();

    this.db
      .prepare(
        `
      INSERT INTO turns (id, session_id, turn_number, created_at, user_message, tool_calls, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(id, sessionId, input.turnNumber, now, JSON.stringify(input.userMessage), '[]', null);

    // Update session timestamp
    this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(now, sessionId);

    return this.getTurn(id)!;
  }

  getTurn(id: string): Turn | null {
    const row = this.db.prepare('SELECT * FROM turns WHERE id = ?').get(id) as TurnRow | undefined;
    return row ? this.mapRowToTurn(row) : null;
  }

  updateTurn(id: string, input: UpdateTurnInput): Turn | null {
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.assistantResponse !== undefined) {
      updates.push('assistant_response = ?');
      params.push(JSON.stringify(input.assistantResponse));
    }
    if (input.toolCalls !== undefined) {
      updates.push('tool_calls = ?');
      params.push(JSON.stringify(input.toolCalls));
    }
    if (input.tokensUsed !== undefined) {
      updates.push('tokens_used = ?');
      params.push(input.tokensUsed);
    }
    if (input.costUsd !== undefined) {
      updates.push('cost_usd = ?');
      params.push(input.costUsd);
    }
    if (input.error !== undefined) {
      updates.push('error = ?');
      params.push(input.error);
    }

    if (updates.length === 0) return this.getTurn(id);

    params.push(id);

    this.db.prepare(`UPDATE turns SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    return this.getTurn(id);
  }

  getSessionTurns(sessionId: string): Turn[] {
    const rows = this.db
      .prepare('SELECT * FROM turns WHERE session_id = ? ORDER BY turn_number ASC')
      .all(sessionId) as TurnRow[];

    return rows.map((row) => this.mapRowToTurn(row));
  }

  // ============================================================================
  // Session Resume Methods
  // ============================================================================

  /**
   * Get the most recent active session.
   * Used for `--continue` flag functionality.
   */
  getMostRecentSession(): Session | null {
    const row = this.db
      .prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1")
      .get() as SessionRow | undefined;

    return row ? this.mapRowToSession(row) : null;
  }

  /**
   * Restore a complete session with all its turns.
   * Returns session + turns for full context restoration.
   */
  restoreSession(id: string): { session: Session; turns: Turn[] } | null {
    const session = this.getSession(id);
    if (!session) return null;

    const turns = this.getSessionTurns(id);
    return { session, turns };
  }
}
