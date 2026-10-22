import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container"><div className="empty">
      <svg viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg>
      <h1 style={{ fontSize: '2.4rem' }}>We couldn’t find that page</h1>
      <p>It may have been removed or the link is incorrect.</p>
      <Link className="btn btn--primary" href="/shop">Browse all products</Link>
    </div></div>
  );
}
