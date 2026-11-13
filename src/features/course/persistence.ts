import {
  DEFAULT_PREFERENCES,
  mergeEvents,
  validateEvent,
  validPreferences,
  type CourseEvent,
  type Preferences,
} from "../../../packages/curriculum/src";

export type Draft = Record<string, unknown>;
type Meta = {
  account: string;
  preferences: Preferences;
  dirty: boolean;
  cursor: number;
  drafts: Record<string, Draft>;
};
type Row = {
  key: string;
  account: string;
  event: CourseEvent;
  pending: number;
};
export type SavedCourse = Meta & {
  events: CourseEvent[];
  pending: string[];
  recovery: string | null;
};
const DB_NAME = "nihongo-progress-v2";
let opening: Promise<IDBDatabase> | undefined;
function database() {
  return (opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const events = request.result.createObjectStore("events", {
        keyPath: "key",
      });
      events.createIndex("account", "account");
      request.result.createObjectStore("meta", { keyPath: "account" });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        opening = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      opening = undefined;
      reject(request.error);
    };
    request.onblocked = () =>
      reject(
        Error("Ахицын сан шинэчлэхийн тулд бусад нээлттэй цонхоо хаана уу."),
      );
  }));
}
function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function committed(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () =>
      reject(tx.error ?? Error("Ахиц хадгалагдсангүй"));
  });
}
export class CoursePersistence {
  constructor(readonly account: string) {}
  private activeLoad: Promise<SavedCourse> | undefined;
  load(): Promise<SavedCourse> {
    return (this.activeLoad ??= this.read().finally(() => {
      this.activeLoad = undefined;
    }));
  }
  private async read(): Promise<SavedCourse> {
    const db = await database();
    const tx = db.transaction(["events", "meta"], "readonly");
    const [rows, meta] = await Promise.all([
      result(
        tx.objectStore("events").index("account").getAll(this.account),
      ) as Promise<Row[]>,
      result(tx.objectStore("meta").get(this.account)) as Promise<
        Meta | undefined
      >,
    ]);
    let recovery: string | null = null;
    let legacy: { events: CourseEvent[]; preferences: Preferences } | undefined;
    const oldKey = "nihongo.course.v1." + this.account;
    try {
      const raw = localStorage.getItem(oldKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (
            parsed?.version !== 1 ||
            !Array.isArray(parsed.events) ||
            !parsed.events.every(validateEvent)
          )
            throw Error();
          legacy = {
            events: parsed.events,
            preferences: validPreferences(parsed.preferences)
              ? parsed.preferences
              : DEFAULT_PREFERENCES,
          };
        } catch {
          recovery = raw;
        }
      }
      recovery ??= localStorage.getItem(oldKey + ".recovery");
    } catch {
      /* IndexedDB remains usable if browser localStorage is restricted. */
    }
    const current: Meta = meta ?? {
      account: this.account,
      preferences: legacy?.preferences ?? DEFAULT_PREFERENCES,
      dirty: !!legacy,
      cursor: 0,
      drafts: {},
    };
    if (legacy) {
      const known = new Set(rows.map((row) => row.event.id));
      const missing = legacy.events.filter((event) => !known.has(event.id));
      if (missing.length) {
        await this.events(missing, true);
        rows.push(
          ...missing.map((event) => ({
            key: this.account + ":" + event.id,
            account: this.account,
            event,
            pending: 1,
          })),
        );
      }
      await this.meta(current);
      // Remove the old large snapshot only after the complete migration commits.
      // Corrupt originals are never overwritten or removed.
      try {
        localStorage.removeItem(oldKey);
        localStorage.removeItem(oldKey + ".preferences-dirty");
      } catch {
        /* safe to retry migration */
      }
    }
    return {
      ...current,
      events: mergeEvents(
        [],
        rows.map((row) => row.event),
      ),
      pending: rows.filter((row) => row.pending).map((row) => row.event.id),
      recovery,
    };
  }
  async events(events: CourseEvent[], pending: boolean) {
    if (!events.length) return;
    const db = await database();
    const tx = db.transaction("events", "readwrite");
    const done = committed(tx);
    for (const event of events)
      tx.objectStore("events").put({
        key: this.account + ":" + event.id,
        account: this.account,
        event,
        pending: pending ? 1 : 0,
      } satisfies Row);
    await done;
  }
  async meta(meta: Omit<Meta, "account"> | Meta) {
    const db = await database();
    const tx = db.transaction("meta", "readwrite");
    const done = committed(tx);
    const store = tx.objectStore("meta");
    const saved = (await result(store.get(this.account))) as Meta | undefined;
    // Settings/sync must not replace drafts saved by another open tab.
    store.put({
      ...meta,
      drafts: saved?.drafts ?? meta.drafts,
      account: this.account,
    });
    await done;
  }
  async draft(
    key: string,
    draft: Draft | null,
    defaults: Omit<Meta, "account">,
  ) {
    const db = await database();
    const tx = db.transaction("meta", "readwrite");
    const done = committed(tx);
    const store = tx.objectStore("meta");
    const saved = ((await result(store.get(this.account))) as
      | Meta
      | undefined) ?? { ...defaults, account: this.account };
    const drafts = { ...saved.drafts };
    if (draft) drafts[key] = draft;
    else delete drafts[key];
    store.put({ ...saved, drafts });
    await done;
  }
}
