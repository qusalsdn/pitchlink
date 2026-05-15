import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // 세션 갱신 (액세스 토큰 만료 시 자동 갱신)
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - 이미지/폰트 파일
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
