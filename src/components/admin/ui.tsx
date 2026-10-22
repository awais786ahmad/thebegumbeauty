'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Icon from '@/components/Icon';
import { errorMessage } from '@/lib/admin/errors';
import { IMAGE_ACCEPT, uploadImage, uploadImages, type MediaFolder } from '@/lib/admin/upload';
import { useToast } from './Toast';

export function StatusPill({ status }: { status: string }) {
  return <span className={`status status--${status.toLowerCase()}`}>{status}</span>;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="adm-state" role="status" aria-live="polite">
      <span className="adm-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function LoadError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="adm-state adm-state--error" role="alert">
      <p>{error}</p>
      <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function Empty({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="empty adm-empty">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function ItemThumb({ image, size = 44 }: { image: string; size?: number }) {
  return image
    ? <img src={image} alt="" width={size} height={size} />
    : <span className="item-ph" aria-hidden="true" style={{ width: size, height: size }}><Icon name="box" className="icon--sm" /></span>;
}

/** Product thumbnail (falls back to a placeholder box when a product has no images). */
export function Thumb({ src, className = 'thumb' }: { src?: string; className?: string }) {
  return src ? <img className={className} src={src} alt="" loading="lazy" /> : <span className={`${className} adm-thumb-ph`} aria-hidden="true"><Icon name="box" className="icon--sm" /></span>;
}

type UploadProps = {
  folder: MediaFolder;
  label: string;
  /** Accessible name when the visible label is not specific enough (e.g. "Photo for item 2"). */
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  onUploaded: (url: string) => void;
  onBusy?: (busy: boolean) => void;
};

/** A button-styled file input that uploads one image to Supabase Storage. */
export function UploadButton({ folder, label, ariaLabel, className = 'btn btn--secondary btn--sm', disabled, onUploaded, onBusy }: UploadProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const setB = (b: boolean) => { setBusy(b); onBusy?.(b); };
  return (
    <label className={`${className} adm-upload${busy || disabled ? ' is-busy' : ''}`} aria-disabled={busy || disabled ? 'true' : undefined}>
      <Icon name="upload" className="icon--sm" />
      {busy ? 'Uploading…' : label}
      <input
        type="file"
        accept={IMAGE_ACCEPT}
        aria-label={ariaLabel ?? label}
        disabled={busy || disabled}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setB(true);
          try { onUploaded(await uploadImage(file, folder)); }
          catch (err) { toast(errorMessage(err), { error: true }); }
          finally { setB(false); }
        }}
      />
    </label>
  );
}

/** Image gallery editor: thumbnails with remove buttons plus a multi-file upload tile. First image is the main one. */
export function ImageList({ images, onChange, folder, onBusy }: { images: string[]; onChange: (next: string[]) => void; folder: MediaFolder; onBusy?: (busy: boolean) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const setB = (b: boolean) => { setBusy(b); onBusy?.(b); };
  const move = (i: number, d: number) => {
    const next = images.slice();
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="uploads">
      {images.map((src, i) => (
        <figure key={src + i}>
          <img src={src} alt={`Image ${i + 1}`} />
          <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label={`Remove image ${i + 1}`}>×</button>
          <figcaption>
            {i === 0 ? 'Main' : (
              <button type="button" className="link-btn adm-make-main" onClick={() => move(i, -i)} aria-label={`Make image ${i + 1} the main image`}>Make main</button>
            )}
          </figcaption>
        </figure>
      ))}
      <label className={`upload-btn${busy ? ' is-busy' : ''}`}>
        <span><Icon name="upload" /><br />{busy ? 'Uploading…' : 'Upload images'}</span>
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          disabled={busy}
          aria-label="Upload images"
          onChange={async (e) => {
            const files = e.target.files ? [...e.target.files] : [];
            e.target.value = '';
            if (!files.length) return;
            setB(true);
            try { onChange(images.concat(await uploadImages(files, folder))); }
            catch (err) { toast(errorMessage(err), { error: true }); }
            finally { setB(false); }
          }}
        />
      </label>
    </div>
  );
}
