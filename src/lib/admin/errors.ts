// Turns Supabase / Postgres errors into messages a store owner can act on.
type DbError = { message: string; code?: string; details?: string | null };

export function friendlyDbError(e: DbError): string {
  const msg = e.message || '';
  if (e.code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return 'You do not have permission to change this. Make sure your account is listed in the admins table.';
  }
  if (e.code === '23505') {
    if (/sku/i.test(msg) || /sku/i.test(e.details ?? '')) return 'That SKU is already used by another product. Use a different SKU or leave it empty.';
    return 'An item with the same ID already exists. Try a slightly different name.';
  }
  if (e.code === 'PGRST116') return 'Nothing was saved. The item may have been deleted, or your account does not have admin rights.';
  if (e.code === '23503') return 'This item is still linked to other records, so it cannot be changed this way.';
  if (e.code === '23514') return 'One of the values is not allowed (for example a negative price or stock). Please check the form.';
  if (/failed to fetch|network/i.test(msg)) return 'Could not reach the server. Check your internet connection and try again.';
  if (/jwt|not authenticated|auth session/i.test(msg)) return 'Your session has expired. Please sign in again.';
  return msg || 'Something went wrong. Please try again.';
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e && 'message' in e) return friendlyDbError(e as DbError);
  return 'Something went wrong. Please try again.';
}

/** A raw database row (snake_case). Convert it with the mappers in src/lib/mappers.ts. */
export type Row = Record<string, unknown>;

/** Unwraps a Supabase response, throwing a friendly Error when it failed. Pass the expected data type as T. */
export function check<T = unknown>(res: { data: unknown; error: DbError | null }): T {
  if (res.error) throw new Error(friendlyDbError(res.error));
  return res.data as T;
}

/** Unwraps a Supabase response that returns a list of rows. */
export function checkRows(res: { data: unknown; error: DbError | null }): Row[] {
  return check<Row[] | null>(res) ?? [];
}
