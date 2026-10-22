'use client';
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { errorMessage } from './errors';

export type Loaded<T> = {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

/** Runs an async loader on mount and exposes its result, error and a reload function. */
export function useLoad<T>(load: () => Promise<T>): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadRef.current());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { data, setData, error, loading, reload };
}
