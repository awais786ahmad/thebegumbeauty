'use client';
import { useEffect, useId, useRef, useState } from 'react';
import Icon from '@/components/Icon';

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/** Right-hand drawer with scrim, Escape to close and focus return. Mount it only while open. */
export default function Drawer({ title, onClose, children, footer, className = 'editor' }: Props) {
  const [shown, setShown] = useState(false);
  const titleId = useId();
  const panel = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => setShown(true));
    const t = setTimeout(() => {
      const root = panel.current;
      const target = root?.querySelector<HTMLElement>('[data-autofocus]') ?? root?.querySelector<HTMLElement>('input:not([type="file"]), textarea, select');
      target?.focus({ preventScroll: true });
    }, 320);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <>
      <div className={`scrim${shown ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside ref={panel} className={`drawer drawer--right ${className}${shown ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="drawer__head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__foot adm-drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}
