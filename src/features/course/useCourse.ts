import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@src/context/AuthContext";
import { request } from "@src/lib/api/client";
import {
  canStudy,
  DEFAULT_PREFERENCES,
  localDay,
  mergeEvents,
  validateEvent,
  validPreferences,
  type CourseEvent,
  type EventInput,
  type Preferences,
} from "../../../packages/curriculum/src";
import { CoursePersistence, type Draft } from "./persistence";
export function courseAccount(token: string | null) {
  try {
    return String(
      JSON.parse(
        atob(token!.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).sub ?? "guest",
    );
  } catch {
    return "guest";
  }
}
export function useCourse() {
  const { token } = useAuth();
  const account = courseAccount(token);
  const persistence = useMemo(() => new CoursePersistence(account), [account]);
  const [events, setEvents] = useState<CourseEvent[]>([]);
  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(0);
  const [notice, setNotice] = useState(""),
    [storageError, setStorageError] = useState(""),
    [recovery, setRecovery] = useState<string | null>(null),
    [syncing, setSyncing] = useState(false);
  const eventsRef = useRef(events),
    preferencesRef = useRef(preferences),
    draftsRef = useRef(drafts);
  const alive = useRef(true),
    ready = useRef(false),
    busy = useRef(false),
    pending = useRef(new Set<string>()),
    dirty = useRef(false),
    cursor = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const channel = useRef<BroadcastChannel | null>(null);
  const meta = () => ({
    preferences: preferencesRef.current,
    drafts: draftsRef.current,
    cursor: cursor.current,
    dirty: dirty.current,
  });
  const enqueue = useCallback((work: () => Promise<unknown>) => {
    if (alive.current) setSaving((n) => n + 1);
    const next = queue.current.catch(() => undefined).then(work);
    queue.current = next
      .catch(() => {
        if (alive.current)
          setStorageError(
            "Ахиц төхөөрөмжид хадгалагдсангүй. Экспорт хийж аваад «Дахин хадгалах» дарна уу.",
          );
      })
      .finally(() => {
        if (alive.current) setSaving((n) => Math.max(0, n - 1));
      });
    return next;
  }, []);
  const sync = useCallback(async () => {
    if (!token || !ready.current || busy.current) return;
    busy.current = true;
    setSyncing(true);
    try {
      await queue.current;
      let more = true;
      let remotePreferences: Preferences | undefined;
      while (more) {
        const r = await request<{
          data: {
            events: CourseEvent[];
            cursor: number;
            hasMore: boolean;
            preferences: Preferences;
          };
        }>(`/api/user/course?after=${cursor.current}`, { token });
        if (!alive.current) return;
        if (
          !r.data ||
          !Array.isArray(r.data.events) ||
          !r.data.events.every(validateEvent) ||
          !Number.isSafeInteger(r.data.cursor) ||
          r.data.cursor < cursor.current ||
          (r.data.hasMore && r.data.cursor === cursor.current)
        )
          throw Error("Серверийн явцын өгөгдөл буруу байна.");
        await enqueue(() => persistence.events(r.data.events, false));
        r.data.events.forEach((e) => pending.current.delete(e.id));
        eventsRef.current = mergeEvents(eventsRef.current, r.data.events);
        setEvents(eventsRef.current);
        cursor.current = r.data.cursor;
        more = r.data.hasMore;
        remotePreferences = r.data.preferences;
        await enqueue(() => persistence.meta(meta()));
      }
      if (!dirty.current && validPreferences(remotePreferences)) {
        preferencesRef.current = remotePreferences;
        setPreferences(remotePreferences);
      }
      while (pending.current.size) {
        const chunk = eventsRef.current
          .filter((e) => pending.current.has(e.id))
          .slice(0, 100);
        if (!chunk.length)
          throw Error("Илгээгээгүй явцын жагсаалтыг сэргээж чадсангүй.");
        const r = await request<{ accepted: string[] }>(
          "/api/user/course/events",
          { token, method: "POST", body: JSON.stringify({ events: chunk }) },
        );
        if (!alive.current) return;
        if (
          !Array.isArray(r.accepted) ||
          chunk.some((e) => !r.accepted.includes(e.id))
        )
          throw Error("Сервер бүх явцыг баталгаажуулсангүй.");
        await enqueue(() => persistence.events(chunk, false));
        chunk.forEach((e) => pending.current.delete(e.id));
      }
      // Loop so edits made while a settings request was in flight are also sent.
      while (dirty.current) {
        const sent = preferencesRef.current;
        await request("/api/user/course/preferences", {
          token,
          method: "PUT",
          body: JSON.stringify(sent),
        });
        if (JSON.stringify(sent) === JSON.stringify(preferencesRef.current))
          dirty.current = false;
      }
      await enqueue(() => persistence.meta(meta()));
      if (alive.current) setNotice("Төхөөрөмжүүдийн явц ижил боллоо");
    } catch (e) {
      if (alive.current)
        setNotice(
          (e instanceof Error ? e.message : "Холболт тасарлаа") +
            " · Энэ төхөөрөмж дээр үргэлжлүүлж болно.",
        );
    } finally {
      busy.current = false;
      if (alive.current) setSyncing(false);
    }
  }, [token, persistence, enqueue]);
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    const load = async () => {
      try {
        await queue.current;
        const saved = await persistence.load();
        if (cancelled) return;
        eventsRef.current = mergeEvents(eventsRef.current, saved.events);
        setEvents(eventsRef.current);
        if (!ready.current || !dirty.current) {
          preferencesRef.current = saved.preferences;
          setPreferences(saved.preferences);
        }
        draftsRef.current = saved.drafts;
        setDrafts(saved.drafts);
        saved.pending.forEach((id) => pending.current.add(id));
        cursor.current = Math.max(cursor.current, saved.cursor);
        dirty.current ||= saved.dirty;
        setRecovery(saved.recovery);
        ready.current = true;
        setLoading(false);
        void sync();
      } catch {
        if (cancelled) return;
        setStorageError(
          "Ахицын санг нээж чадсангүй. Хөтчийн storage тохиргоог шалгаад дахин ачаална уу. Хуучин явцыг устгаагүй.",
        );
        setLoading(false);
      }
    };
    void load();
    if ("BroadcastChannel" in window) {
      channel.current = new BroadcastChannel("nihongo-course-" + account);
      channel.current.onmessage = () => void load();
    }
    const online = () => void sync();
    const focused = () => void load();
    window.addEventListener("online", online);
    window.addEventListener("focus", focused);
    return () => {
      cancelled = true;
      alive.current = false;
      channel.current?.close();
      window.removeEventListener("online", online);
      window.removeEventListener("focus", focused);
    };
  }, [persistence, account, sync]);
  useEffect(() => {
    if (loading || (!pending.current.size && !dirty.current)) return;
    const timer = setTimeout(() => void sync(), 1200);
    return () => clearTimeout(timer);
  }, [events, preferences, loading, sync]);
  const add = useCallback(
    (data: EventInput) => {
      if (!ready.current)
        throw Error("Ахицын сан ачаалж байна. Түр хүлээнэ үү.");
      const now = new Date();
      const event = {
        ...data,
        id: crypto.randomUUID(),
        at: now.toISOString(),
        day: localDay(now, preferencesRef.current.timezone),
      } as CourseEvent;
      if (!validateEvent(event)) throw Error("Дасгалын өгөгдөл буруу байна.");
      if (
        (event.kind === "task" || event.kind === "attempt") &&
        !canStudy(eventsRef.current, event.lessonId)
      )
        throw Error("Өмнөх хичээлээ дуусгана уу.");
      eventsRef.current = mergeEvents(eventsRef.current, [event]);
      pending.current.add(event.id);
      if (alive.current) setEvents(eventsRef.current);
      void enqueue(() => persistence.events([event], true))
        .then(() => channel.current?.postMessage("events"))
        .catch(() => undefined);
      return event;
    },
    [persistence, enqueue],
  );
  const savePreferences = async (p: Preferences) => {
    if (!validPreferences(p)) throw Error("Буруу тохиргоо");
    preferencesRef.current = p;
    dirty.current = true;
    setPreferences(p);
    await enqueue(() => persistence.meta(meta()));
    await sync();
  };
  const updateDraft = (key: string, draft: Draft | null) => {
    const next = { ...draftsRef.current };
    if (draft) next[key] = draft;
    else delete next[key];
    draftsRef.current = next;
    setDrafts(next);
    void enqueue(() => persistence.draft(key, draft, meta())).catch(
      () => undefined,
    );
  };
  const importProgress = async (text: string) => {
    const data = JSON.parse(text);
    if (
      data?.version !== 1 ||
      !Array.isArray(data.events) ||
      !data.events.every(validateEvent) ||
      !validPreferences(data.preferences)
    )
      throw Error("Япон сургалтын экспортын файл биш байна.");
    const known = new Set(eventsRef.current.map((e) => e.id));
    const added = (data.events as CourseEvent[]).filter(
      (e) => !known.has(e.id),
    );
    await enqueue(() => persistence.events(added, true));
    added.forEach((e) => pending.current.add(e.id));
    eventsRef.current = mergeEvents(eventsRef.current, added);
    setEvents(eventsRef.current);
    await savePreferences(data.preferences);
  };
  const importGuest = async () => {
    const guest = await new CoursePersistence("guest").load();
    if (!guest.events.length)
      throw Error("Энэ хөтөч дээр бүртгэлгүй суралцсан явц алга.");
    await importProgress(
      JSON.stringify({
        version: 1,
        events: guest.events,
        preferences: preferencesRef.current,
      }),
    );
  };
  const retryStorage = async () => {
    try {
      await enqueue(() =>
        persistence.events(
          eventsRef.current.filter((e) => pending.current.has(e.id)),
          true,
        ),
      );
      await enqueue(() => persistence.meta(meta()));
      setStorageError("");
      await sync();
    } catch {
      /* original error remains visible */
    }
  };
  return {
    events,
    preferences,
    add,
    savePreferences,
    sync,
    syncing,
    notice,
    storageError,
    importProgress,
    importGuest,
    drafts,
    updateDraft,
    loading,
    saving,
    recovery,
    retryStorage,
    ready: ready.current,
  };
}
export type CourseStore = ReturnType<typeof useCourse>;
