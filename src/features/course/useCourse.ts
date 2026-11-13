import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@src/context/AuthContext';
import { request } from '@src/lib/api/client';
import {
  canStudy,
  localDay,
  mergeEvents,
  parseSaved,
  validateEvent,
  validPreferences,
  type CourseEvent,
  type EventInput,
  type Preferences,
} from '../../../packages/curriculum/src';
function accountKey(token: string | null) {
  try {
    const encoded = token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(encoded));
    return String(p.sub ?? 'guest');
  } catch {
    return 'guest';
  }
}
function safeRead(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function useCourse() {
  const { token } = useAuth();
  const key = 'nihongo.course.v1.' + accountKey(token);
  const initial = useMemo(() => parseSaved(safeRead(key)), [key]);
  const [events, setEvents] = useState(initial.events),
    [preferences, setPreferences] = useState(initial.preferences);
  const [notice, setNotice] = useState(''),
    [syncing, setSyncing] = useState(false),
    [storageError, setStorageError] = useState('');
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const acknowledged = useRef(new Set<string>()),
    busy = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const dirty = useRef(safeRead(key + '.preferences-dirty') === '1');
  useEffect(() => {
    try {
      const old = localStorage.getItem(key);
      if (old) {
        try {
          const raw = JSON.parse(old);
          if (
            raw.version !== 1 ||
            !Array.isArray(raw.events) ||
            !raw.events.every(validateEvent)
          )
            localStorage.setItem(key + '.recovery', old);
        } catch {
          localStorage.setItem(key + '.recovery', old);
        }
      }
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, events, preferences }),
      );
      setStorageError('');
    } catch {
      setStorageError('Хөтчид хадгалж чадсангүй. Явцаа экспортолж аваарай.');
    }
  }, [events, preferences, key]);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === key) {
        const other = parseSaved(e.newValue);
        setEvents((old) => mergeEvents(old, other.events));
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, [key]);
  const sync = useCallback(async () => {
    if (!token || busy.current) return;
    busy.current = true;
    setSyncing(true);
    try {
      let cursor = 0,
        hasMore = true;
      let remote: CourseEvent[] = [];
      let remotePrefs: Preferences | undefined;
      while (hasMore) {
        const r = await request<{
          data: {
            events: CourseEvent[];
            cursor: number;
            hasMore: boolean;
            preferences: Preferences;
          };
        }>(`/api/user/course?after=${cursor}`, { token });
        if (!alive.current) return;
        if (
          !r.data ||
          !Array.isArray(r.data.events) ||
          !r.data.events.every(validateEvent) ||
          (r.data.hasMore && r.data.cursor <= cursor)
        )
          throw Error('Серверийн явцын өгөгдөл буруу байна.');
        remote = mergeEvents(remote, r.data.events);
        cursor = r.data.cursor;
        hasMore = r.data.hasMore;
        remotePrefs = r.data.preferences;
        r.data.events.forEach((e) => acknowledged.current.add(e.id));
      }
      const merged = mergeEvents(eventsRef.current, remote);
      eventsRef.current = merged;
      setEvents((old) =>
        old.length === merged.length &&
        old.every((e, i) => e.id === merged[i].id)
          ? old
          : merged,
      );
      if (dirty.current) {
        const sent = preferencesRef.current;
        await request('/api/user/course/preferences', {
          token,
          method: 'PUT',
          body: JSON.stringify(sent),
        });
        if (JSON.stringify(sent) === JSON.stringify(preferencesRef.current)) {
          dirty.current = false;
          localStorage.removeItem(key + '.preferences-dirty');
        }
      } else if (validPreferences(remotePrefs))
        setPreferences((old) =>
          JSON.stringify(old) === JSON.stringify(remotePrefs)
            ? old
            : remotePrefs!,
        );
      // Drain events added while the previous batch was in flight as well.
      for (let rounds = 0; rounds < 205; rounds++) {
        const chunk = eventsRef.current
          .filter((e) => !acknowledged.current.has(e.id))
          .slice(0, 100);
        if (!chunk.length) break;
        await request('/api/user/course/events', {
          token,
          method: 'POST',
          body: JSON.stringify({ events: chunk }),
        });
        if (!alive.current) return;
        chunk.forEach((e) => acknowledged.current.add(e.id));
      }
      setNotice('Төхөөрөмжүүдийн явц ижил боллоо');
    } catch (e) {
      if (alive.current)
        setNotice(
          (e instanceof Error ? e.message : 'Холболт тасарлаа') +
            ' · Энэ төхөөрөмж дээр үргэлжлүүлж болно.',
        );
    } finally {
      busy.current = false;
      if (alive.current) setSyncing(false);
    }
  }, [token, key]);
  useEffect(() => {
    void sync();
    const online = () => void sync();
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, [sync]);
  useEffect(() => {
    if (!events.some((e) => !acknowledged.current.has(e.id))) return;
    const timer = setTimeout(() => void sync(), 1500);
    return () => clearTimeout(timer);
  }, [events, sync]);
  useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(() => void sync(), 1500);
    return () => clearTimeout(timer);
  }, [preferences, sync]);
  const add = useCallback(
    (data: EventInput) => {
      const now = new Date();
      const e = {
        ...data,
        id: crypto.randomUUID(),
        at: now.toISOString(),
        day: localDay(now, preferences.timezone),
      } as CourseEvent;
      if (!validateEvent(e)) throw Error('Дасгалын өгөгдөл буруу байна.');
      if (e.kind === 'task' && !canStudy(eventsRef.current, e.lessonId))
        throw Error('Өмнөх хичээлээ дуусгана уу.');
      const next = mergeEvents(eventsRef.current, [e]);
      eventsRef.current = next;
      setEvents(next);
      return e;
    },
    [preferences.timezone],
  );
  const savePreferences = async (p: Preferences) => {
    if (!validPreferences(p)) return;
    preferencesRef.current = p;
    setPreferences(p);
    dirty.current = true;
    try {
      localStorage.setItem(key + '.preferences-dirty', '1');
    } catch {
      setStorageError('Тохиргоог хөтчид хадгалж чадсангүй.');
    }
    // A failed write remains queued for manual/online synchronization.
    await sync();
  };
  const importProgress = (text: string) => {
    const data = JSON.parse(text);
    if (
      data?.version !== 1 ||
      !Array.isArray(data.events) ||
      data.events.length > 20000 ||
      !data.events.every(validateEvent) ||
      !validPreferences(data.preferences)
    )
      throw Error('Япон сургалтын экспортын файл биш байна.');
    const merged = mergeEvents(eventsRef.current, data.events);
    if (merged.length > 20000) throw Error('Явцын хэмжээний хязгаарт хүрлээ.');
    eventsRef.current = merged;
    setEvents(merged);
    void savePreferences(data.preferences);
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
  };
}
export type CourseStore = ReturnType<typeof useCourse>;
