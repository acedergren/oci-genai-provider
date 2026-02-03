/**
 * Bun-based file utilities
 *
 * Provides async file operations using Bun's native APIs.
 * Falls back to node:fs for directory operations.
 *
 * @example
 * ```typescript
 * import { fileExists, readTextFile, writeTextFile } from './utils/file.js';
 *
 * if (await fileExists('config.json')) {
 *   const content = await readTextFile('config.json');
 *   console.log(JSON.parse(content));
 * }
 * ```
 */

import * as path from 'node:path';
import * as os from 'node:os';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

/**
 * Expand ~ to home directory in paths
 */
export function expandPath(filePath: string): string {
  if (!filePath) return filePath;
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Check if a file exists using Bun.file().exists()
 *
 * @param filePath - Path to check (supports ~ expansion)
 * @returns true if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const expanded = expandPath(filePath);
  return Bun.file(expanded).exists();
}

/**
 * Synchronous file existence check (for validators that can't be async)
 *
 * @param filePath - Path to check (supports ~ expansion)
 * @returns true if file exists
 */
export function fileExistsSync(filePath: string): boolean {
  const expanded = expandPath(filePath);
  return existsSync(expanded);
}

/**
 * Read text content from a file using Bun.file().text()
 *
 * @param filePath - Path to read (supports ~ expansion)
 * @returns File contents as string
 * @throws If file doesn't exist or can't be read
 */
export async function readTextFile(filePath: string): Promise<string> {
  const expanded = expandPath(filePath);
  const file = Bun.file(expanded);

  if (!(await file.exists())) {
    throw new Error(`File not found: ${expanded}`);
  }

  return file.text();
}

/**
 * Read JSON from a file using Bun.file().json()
 *
 * @param filePath - Path to read (supports ~ expansion)
 * @returns Parsed JSON content
 * @throws If file doesn't exist or JSON is invalid
 */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const expanded = expandPath(filePath);
  const file = Bun.file(expanded);

  if (!(await file.exists())) {
    throw new Error(`File not found: ${expanded}`);
  }

  return file.json() as Promise<T>;
}

/**
 * Write text content to a file using Bun.write()
 *
 * @param filePath - Path to write (supports ~ expansion)
 * @param content - Content to write
 * @param options - Write options
 */
export async function writeTextFile(
  filePath: string,
  content: string,
  options?: { mode?: number }
): Promise<void> {
  const expanded = expandPath(filePath);

  // Ensure parent directory exists
  const dir = path.dirname(expanded);
  await ensureDirectory(dir);

  await Bun.write(expanded, content, { mode: options?.mode });
}

/**
 * Write JSON to a file using Bun.write()
 *
 * @param filePath - Path to write (supports ~ expansion)
 * @param data - Data to write as JSON
 * @param options - Write options
 */
export async function writeJsonFile(
  filePath: string,
  data: unknown,
  options?: { mode?: number; pretty?: boolean }
): Promise<void> {
  const content = options?.pretty !== false ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await writeTextFile(filePath, content, { mode: options?.mode });
}

/**
 * Ensure a directory exists using node:fs/promises mkdir
 *
 * @param dirPath - Directory path (supports ~ expansion)
 * @param mode - Directory mode (default: 0o755)
 */
export async function ensureDirectory(dirPath: string, mode = 0o755): Promise<void> {
  const expanded = expandPath(dirPath);
  await mkdir(expanded, { recursive: true, mode });
}

/**
 * Get file size without reading content (lazy via Bun.file)
 *
 * @param filePath - Path to check (supports ~ expansion)
 * @returns File size in bytes, or 0 if file doesn't exist
 */
export async function getFileSize(filePath: string): Promise<number> {
  const expanded = expandPath(filePath);
  const file = Bun.file(expanded);

  if (!(await file.exists())) {
    return 0;
  }

  return file.size;
}

/**
 * Read file as ArrayBuffer for binary content
 *
 * @param filePath - Path to read (supports ~ expansion)
 * @returns File contents as ArrayBuffer
 */
export async function readBinaryFile(filePath: string): Promise<ArrayBuffer> {
  const expanded = expandPath(filePath);
  const file = Bun.file(expanded);

  if (!(await file.exists())) {
    throw new Error(`File not found: ${expanded}`);
  }

  return file.arrayBuffer();
}

/**
 * Get home directory path
 */
export function getHomePath(): string {
  return os.homedir();
}

/**
 * Common config paths
 */
export const CONFIG_PATHS = {
  ociConfig: '~/.oci/config',
  opencodeConfig: '~/.config/opencode/opencode.json',
  claudeCodeConfig: '~/.claude.json',
  envFile: './.env',
} as const;
