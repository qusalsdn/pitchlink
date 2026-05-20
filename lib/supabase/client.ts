import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// 클라이언트 컴포넌트에서 사용하는 Supabase 클라이언트
export const createClient = () =>
  createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
