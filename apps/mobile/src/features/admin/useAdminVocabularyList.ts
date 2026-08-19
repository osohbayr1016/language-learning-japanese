import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import type { Word } from "../../lib/types";

const PAGE = 80;

export function useAdminVocabularyList() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const [hsk, setHsk] = useState<number | undefined>(undefined);
  const [singleOnly, setSingleOnly] = useState(false);
  const [rows, setRows] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const baseParams = useMemo(
    () => ({
      q: debouncedQ || undefined,
      jlpt: hsk,
      single_char: singleOnly ? (1 as const) : undefined,
      limit: PAGE,
    }),
    [debouncedQ, hsk, singleOnly],
  );

  const loadFresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.words.list({ ...baseParams, offset: 0 });
      const data = Array.isArray(r.data) ? r.data : [];
      setRows(data);
      setHasMore(Boolean(r.has_more));
      setTotal(Number(r.total) || 0);
    } finally {
      setLoading(false);
    }
  }, [baseParams]);

  useEffect(() => {
    void loadFresh();
  }, [loadFresh]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const offset = rows.length;
      const r = await api.words.list({ ...baseParams, offset });
      const chunk = Array.isArray(r.data) ? r.data : [];
      setRows((prev) => [...prev, ...chunk]);
      setHasMore(Boolean(r.has_more));
      setTotal(Number(r.total) || 0);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, baseParams, rows.length]);

  return {
    q,
    setQ,
    hsk,
    setHsk,
    singleOnly,
    setSingleOnly,
    rows,
    loading,
    loadingMore,
    hasMore,
    total,
    loadMore,
    reload: loadFresh,
  };
}
