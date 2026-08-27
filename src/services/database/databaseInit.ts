// No-op: all data now lives in Supabase. Users are seeded in the database.
export async function initDatabase(): Promise<void> {
  // Intentionally empty — kept for backward compatibility with App.tsx boot sequence.
}
