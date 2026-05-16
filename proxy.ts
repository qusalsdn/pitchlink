import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/proxy";

// 인증 없이 접근 가능한 공개 경로
const PUBLIC_PATHS = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, supabaseResponse } = createClient(request);

  // 세션 갱신 (액세스 토큰 만료 시 자동 갱신)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // 미인증 사용자가 보호된 경로 접근 시 로그인으로 리다이렉트
  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // 인증된 사용자가 로그인/회원가입 접근 시 홈으로 리다이렉트
  if (user && isPublicPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

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
