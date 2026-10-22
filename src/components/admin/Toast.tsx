'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastLink = { href: string; label: string };
type ToastState = { id: number; message: string; link?: ToastLink; error?: boolean };
type ToastFn = (message: string, opts?: { link?: ToastLink; error?: boolean }) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function useToast(): ToastFn {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ToastFn>((message, opts) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, link: opts?.link, error: opts?.error });
    setOn(true);
    timer.current = setTimeout(() => setOn(false), opts?.error ? 7000 : 3800);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast adm-toast${on ? ' is-on' : ''}${toast?.error ? ' adm-toast--error' : ''}`} role={toast?.error ? 'alert' : 'status'} aria-live={toast?.error ? 'assertive' : 'polite'}>
        {toast && (
          <>
            <span>{toast.message}</span>
            {toast.link && <a href={toast.link.href} target="_blank" rel="noopener">{toast.link.label}</a>}
            <button type="button" className="adm-toast__close" aria-label="Dismiss message" onClick={() => setOn(false)}>×</button>
          </>
        )}
      </div>
    </ToastContext.Provider>
  );
}
