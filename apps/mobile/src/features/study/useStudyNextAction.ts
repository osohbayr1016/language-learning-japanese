import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { StudyNextAction } from '../../lib/api/user';

export function useStudyNextAction(refreshKey: unknown) {
  const { token } = useAuth();
  const [action, setAction] = useState<StudyNextAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const retry = useCallback(() => setRevision((v) => v + 1), []);

  useEffect(() => {
    let alive = true;

    if (!token) {
      setAction(null);
      setError('Өнөөдрийн хувийн төлөвлөгөөг харахын тулд нэвтэрнэ үү.');
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    setLoading(true);
    setError(null);

    void api.user
      .nextAction(token)
      .then((res) => {
        if (!alive) return;
        setAction(res.data);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setAction(null);
        setError(e instanceof Error ? e.message : 'Өнөөдрийн төлөвлөгөөг ачаалж чадсангүй');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, refreshKey, revision]);

  return { action, loading, error, retry };
}
