export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_name: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_name?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "admin" | "user" | string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "admin" | "user" | string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "admin" | "user" | string;
          created_at?: string;
        };
      };
      test_results: {
        Row: {
          id: string;
          user_id: string | null;
          module: string;
          band_score: number;
          accuracy: number;
          metrics: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          module: string;
          band_score: number;
          accuracy: number;
          metrics?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          module?: string;
          band_score?: number;
          accuracy?: number;
          metrics?: Json | null;
          created_at?: string;
        };
      };
    };
  };
}

type TableName = keyof Database["public"]["Tables"];
type TableInsert<TTable extends TableName> = Database["public"]["Tables"][TTable]["Insert"];
type TableRow<TTable extends TableName> = Database["public"]["Tables"][TTable]["Row"];

export interface SupabaseUser {
  id: string;
  email?: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user: SupabaseUser;
}

interface SupabaseError {
  message: string;
  status?: number;
}

interface SupabaseAuthResponse {
  data: {
    session: SupabaseSession | null;
    user: SupabaseUser | null;
  };
  error: SupabaseError | null;
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ??
  process.env.VITE_SUPABASE_URL ??
  "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "";

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "local";
const storageKey = `sb-${projectRef}-auth-token`;

function readStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const exact = window.localStorage.getItem(storageKey);
  const fallbackKey = Object.keys(window.localStorage).find((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));
  const raw = exact ?? (fallbackKey ? window.localStorage.getItem(fallbackKey) : null);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { currentSession?: SupabaseSession; access_token?: string; user?: SupabaseUser };
    if (parsed.currentSession) {
      return parsed.currentSession;
    }

    if (parsed.access_token && parsed.user) {
      return parsed as SupabaseSession;
    }
  } catch {
    return null;
  }

  return null;
}

function storeSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      currentSession: session,
      expiresAt: session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined
    })
  );
}

function missingConfigError(): SupabaseError | null {
  if (supabaseUrl && supabaseAnonKey) {
    return null;
  }

  return {
    message: "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  };
}

function readAuthHeaders(): HeadersInit {
  const session = readStoredSession();

  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`
  };
}

class SelectQuery<TTable extends TableName> implements PromiseLike<{ data: TableRow<TTable>[] | null; error: SupabaseError | null }> {
  private readonly params = new URLSearchParams();

  constructor(
    private readonly table: TTable,
    columns: string
  ) {
    this.params.set("select", columns);
  }

  eq(column: keyof TableRow<TTable> & string, value: string | number | boolean | null) {
    this.params.set(column, `eq.${String(value)}`);
    return this;
  }

  order(column: keyof TableRow<TTable> & string, options: { ascending?: boolean } = {}) {
    this.params.set("order", `${column}.${options.ascending === false ? "desc" : "asc"}`);
    return this;
  }

  limit(count: number) {
    this.params.set("limit", String(count));
    return this;
  }

  async execute(): Promise<{ data: TableRow<TTable>[] | null; error: SupabaseError | null }> {
    const configError = missingConfigError();
    if (configError) {
      return { data: null, error: configError };
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${String(this.table)}?${this.params.toString()}`, {
      method: "GET",
      headers: readAuthHeaders()
    });

    if (!response.ok) {
      return { data: null, error: await parseError(response) };
    }

    return { data: (await response.json()) as TableRow<TTable>[], error: null };
  }

  then<TResult1 = { data: TableRow<TTable>[] | null; error: SupabaseError | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: TableRow<TTable>[] | null; error: SupabaseError | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

async function parseError(response: Response): Promise<SupabaseError> {
  try {
    const payload = (await response.json()) as { message?: string; error_description?: string; error?: string };
    return {
      message: payload.message ?? payload.error_description ?? payload.error ?? response.statusText,
      status: response.status
    };
  } catch {
    return {
      message: response.statusText,
      status: response.status
    };
  }
}

export const supabase = {
  auth: {
    async getSession(): Promise<{ data: { session: SupabaseSession | null }; error: SupabaseError | null }> {
      return { data: { session: readStoredSession() }, error: null };
    },
    async signInWithPassword(input: { email: string; password: string }): Promise<SupabaseAuthResponse> {
      const configError = missingConfigError();
      if (configError) {
        return { data: { session: null, user: null }, error: configError };
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        return { data: { session: null, user: null }, error: await parseError(response) };
      }

      const session = (await response.json()) as SupabaseSession;
      storeSession(session);
      return { data: { session, user: session.user }, error: null };
    },
    async signOut(): Promise<{ error: SupabaseError | null }> {
      storeSession(null);
      return { error: null };
    }
  },
  from<TTable extends TableName>(table: TTable) {
    return {
      select(columns = "*") {
        return new SelectQuery(table, columns);
      },
      async insert(values: TableInsert<TTable> | TableInsert<TTable>[]): Promise<{ data: null; error: SupabaseError | null }> {
        const configError = missingConfigError();
        if (configError) {
          return { data: null, error: configError };
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/${String(table)}`, {
          method: "POST",
          headers: {
            ...readAuthHeaders(),
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify(values)
        });

        if (!response.ok) {
          return { data: null, error: await parseError(response) };
        }

        return { data: null, error: null };
      }
    };
  }
};
