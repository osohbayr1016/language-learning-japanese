import type { GameSessionBody } from "./api/games";
import type { ProgressBody } from "./api/user";
import { parseJwtPayloadUnsafe } from "./auth/accessToken";

export type PendingReward =
  | { kind: "study"; session_id: string; created_at: number; body: ProgressBody & { session_id: string } }
  | { kind: "game"; session_id: string; created_at: number; body: GameSessionBody & { session_id: string } };

export type RewardStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};

const MAX_PENDING = 100;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

/** JWT payload only selects a local namespace. The API still verifies the token. */
export function rewardAccountFromToken(token: string | null): string | null {
  const sub = parseJwtPayloadUnsafe(token)?.sub;
  return typeof sub === "number" && Number.isSafeInteger(sub) && sub > 0
    ? String(sub)
    : null;
}

export function makeRewardOutbox(storage: RewardStorage) {
  const locks = new Map<string, Promise<void>>();

  function key(account: string): string {
    if (!/^[1-9][0-9]{0,15}$/.test(account)) throw Error("Invalid reward account");
    return "nihongo.pending-rewards.v1.user." + account;
  }

  async function exclusive<T>(account: string, work: () => Promise<T>): Promise<T> {
    const previous = locks.get(account) ?? Promise.resolve();
    let unlock: () => void = () => undefined;
    const current = new Promise<void>((resolve) => { unlock = resolve; });
    locks.set(account, current);
    await previous.catch(() => undefined);
    try {
      return await work();
    } finally {
      unlock();
      if (locks.get(account) === current) locks.delete(account);
    }
  }

  function parse(raw: string | null): PendingReward[] {
    if (!raw) return [];
    const rows: unknown = JSON.parse(raw);
    if (!Array.isArray(rows) || rows.length > MAX_PENDING) throw Error("Invalid pending reward data");
    for (const value of rows) {
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw Error("Invalid pending reward item");
      const row = value as Record<string, unknown>;
      const body = row.body as Record<string, unknown> | null;
      if (
        (row.kind !== "game" && row.kind !== "study") ||
        typeof row.session_id !== "string" ||
        !SESSION_ID_PATTERN.test(row.session_id) ||
        typeof row.created_at !== "number" ||
        !Number.isFinite(row.created_at) ||
        !body || typeof body !== "object" || Array.isArray(body) ||
        body.session_id !== row.session_id
      ) throw Error("Invalid pending reward item");
    }
    return rows as PendingReward[];
  }

  async function list(account: string): Promise<PendingReward[]> {
    return exclusive(account, async () => parse(await storage.getItem(key(account))));
  }

  async function put(account: string, entry: PendingReward): Promise<void> {
    await exclusive(account, async () => {
      const id = entry.session_id;
      if (!SESSION_ID_PATTERN.test(id) || entry.body.session_id !== id)
        throw Error("Invalid session identifier");
      const storageKey = key(account);
      const records = parse(await storage.getItem(storageKey));
      const old = records.find(x => x.session_id === id && x.kind === entry.kind);
      if (old) {
        if (JSON.stringify(old.body) !== JSON.stringify(entry.body))
          throw Error("Conflicting retry payload");
        return;
      }
      if (records.length >= MAX_PENDING)
        throw Error("Pending upload limit reached; reconnect and sync existing sessions");
      records.push(entry);
      await storage.setItem(storageKey, JSON.stringify(records));
    });
  }

  async function remove(account: string, kind: PendingReward["kind"], sessionId: string): Promise<void> {
    await exclusive(account, async () => {
      const storageKey = key(account);
      const records = parse(await storage.getItem(storageKey));
      const remaining = records.filter(x => x.kind !== kind || x.session_id !== sessionId);
      if (records.length === remaining.length) return;
      if (remaining.length) await storage.setItem(storageKey, JSON.stringify(remaining));
      else await storage.removeItem(storageKey);
    });
  }

  return { list, put, remove };
}
