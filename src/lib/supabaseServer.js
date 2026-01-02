import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export function getSupabaseServerClient() {
	if (cachedClient) return cachedClient;
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !anonKey) {
		throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
	}
	// Prefer service role for server-side operations if available (e.g., Storage writes)
	const key = serviceKey || anonKey;
	cachedClient = createClient(url, key, {
		autoRefreshToken: false,
		persistSession: false,
		realtime: { enabled: false }
	});
	return cachedClient;
}


