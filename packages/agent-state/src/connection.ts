// packages/agent-state/src/connection.ts
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { initializeSchema } from './schema.js';

let connection: Database.Database | null = null;

const DEFAULT_DB_DIR = path.join(os.homedir(), '.oci-provider-examples');
const DEFAULT_DB_PATH = path.join(DEFAULT_DB_DIR, 'agent-state.db');

/**
 * Get the database path from environment or default.
 */
export function getDatabasePath(): string {
  return process.env.AGENT_STATE_DB_PATH ?? DEFAULT_DB_PATH;
}

/**
 * Ensure the directory for the database file exists.
 */
function ensureDirectory(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get or create the database connection.
 * Uses singleton pattern - returns same connection on subsequent calls.
 * Automatically initializes schema on first connection.
 */
export function getConnection(customPath?: string): Database.Database {
  if (connection) {
    return connection;
  }

  const dbPath = customPath ?? getDatabasePath();
  ensureDirectory(dbPath);

  connection = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  connection.pragma('journal_mode = WAL');

  // Enable foreign keys
  connection.pragma('foreign_keys = ON');

  // Initialize schema
  initializeSchema(connection);

  return connection;
}

/**
 * Close the database connection.
 * Useful for testing or graceful shutdown.
 */
export function closeConnection(): void {
  if (connection) {
    connection.close();
    connection = null;
  }
}

/**
 * Reset the connection (close and clear singleton).
 * Useful for testing with different database paths.
 */
export function resetConnection(): void {
  closeConnection();
}
