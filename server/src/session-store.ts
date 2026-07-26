import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { GuidedAnswer } from "../../shared/question.ts";
import type { GuidedSession } from "../../shared/session.ts";
import { validateSession, validateSessionAnswer } from "../../shared/session.ts";

export interface StoredSession {
  session: GuidedSession;
  answers: GuidedAnswer[];
  finalized: boolean;
  completedCheckpoints: string[];
  updatedAt: number;
}

const FILE_PATTERN = /^[a-f0-9]{64}\.json$/;
const MAX_FILE_BYTES = 256 * 1024;

export class FileSessionStore {
  private readonly rootDir: string;
  private readonly maxSessions: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(
    rootDir = join(tmpdir(), "intent-foundry", "guided-sessions-v1"),
    maxSessions = 20,
    ttlMs = 24 * 60 * 60 * 1000,
    now = () => Date.now(),
  ) {
    this.rootDir = rootDir;
    this.maxSessions = maxSessions;
    this.ttlMs = ttlMs;
    this.now = now;
    mkdirSync(rootDir, { recursive: true, mode: 0o700 });
    if (!lstatSync(rootDir).isDirectory() || lstatSync(rootDir).isSymbolicLink()) {
      throw new Error("Intent Foundry session store must be a real directory");
    }
  }

  get(sessionId: string): StoredSession | null {
    this.cleanup();
    const path = this.pathFor(sessionId);
    try {
      const stats = statSync(path);
      if (!stats.isFile() || stats.size > MAX_FILE_BYTES) return null;
      const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
      if (!isStoredSession(parsed, sessionId)) return null;
      if (this.now() - parsed.updatedAt > this.ttlMs) {
        unlinkSync(path);
        return null;
      }
      return parsed;
    } catch (error) {
      if (isMissing(error)) return null;
      return null;
    }
  }

  put(stored: Omit<StoredSession, "updatedAt">): StoredSession {
    const record: StoredSession = { ...stored, updatedAt: this.now() };
    if (!isStoredSession(record, stored.session.sessionId)) {
      throw new Error("Refusing to persist an invalid guided session");
    }
    const serialized = JSON.stringify(record);
    if (Buffer.byteLength(serialized, "utf8") > MAX_FILE_BYTES) {
      throw new Error("Refusing to persist an oversized guided session");
    }
    mkdirSync(this.rootDir, { recursive: true, mode: 0o700 });
    const target = this.pathFor(stored.session.sessionId);
    const temporary = join(this.rootDir, `.${this.hash(stored.session.sessionId)}.${process.pid}.${this.now()}.tmp`);
    writeFileSync(temporary, serialized, { encoding: "utf8", mode: 0o600, flag: "wx" });
    renameSync(temporary, target);
    this.cleanup();
    return record;
  }

  private cleanup(): void {
    const now = this.now();
    const files = readdirSync(this.rootDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && FILE_PATTERN.test(entry.name))
      .map((entry) => {
        const path = join(this.rootDir, entry.name);
        return { path, mtimeMs: statSync(path).mtimeMs };
      })
      .sort((left, right) => right.mtimeMs - left.mtimeMs);

    for (const [index, file] of files.entries()) {
      if (index >= this.maxSessions || now - file.mtimeMs > this.ttlMs) unlinkSync(file.path);
    }
  }

  private pathFor(sessionId: string): string {
    return join(this.rootDir, `${this.hash(sessionId)}.json`);
  }

  private hash(sessionId: string): string {
    return createHash("sha256").update(sessionId, "utf8").digest("hex");
  }
}

function isStoredSession(value: unknown, expectedSessionId: string): value is StoredSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredSession>;
  if (!candidate.session || candidate.session.sessionId !== expectedSessionId) return false;
  if (validateSession(candidate.session) !== null) return false;
  if (!Array.isArray(candidate.answers) || typeof candidate.finalized !== "boolean") return false;
  if (!Array.isArray(candidate.completedCheckpoints)) return false;
  const validCheckpointIds = new Set((candidate.session.checkpoints ?? []).map((item) => item.checkpointId));
  if (!candidate.completedCheckpoints.every((id) => typeof id === "string" && validCheckpointIds.has(id))) return false;
  if (typeof candidate.updatedAt !== "number" || !Number.isFinite(candidate.updatedAt)) return false;
  return candidate.answers.every((answer) => validateSessionAnswer(candidate.session!, answer) === null);
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
