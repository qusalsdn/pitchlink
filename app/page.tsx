import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Megaphone, LogOut, ChevronRight, UserCircle2 } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 프로필 조회
  const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();

  // 소속 팀 조회
  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("role, teams(id, name, description)")
    .eq("user_id", user.id);

  // 팀이 없으면 온보딩으로 리다이렉트
  const teams = teamMemberships ?? [];
  if (teams.length === 0) {
    redirect("/onboarding");
  }

  const primaryTeam = teams[0]?.teams ?? null;
  const primaryTeamId = primaryTeam ? (primaryTeam as { id: string }).id : null;

  // 다가오는 경기 조회 (첫 번째 팀 기준)
  const { data: upcomingMatches } = primaryTeamId
    ? await supabase
        .from("matches")
        .select("id, title, match_date, location")
        .eq("team_id", primaryTeamId)
        .gte("match_date", new Date().toISOString())
        .order("match_date", { ascending: true })
        .limit(3)
    : { data: [] };

  // 최근 공지사항 조회
  const { data: notices } = primaryTeamId
    ? await supabase
        .from("team_notices")
        .select("id, title, created_at, is_pinned")
        .eq("team_id", primaryTeamId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3)
    : { data: [] };

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "회원";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">PitchLink</span>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <LogOut className="h-4 w-4" />
              <span>로그아웃</span>
            </button>
          </form>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* 환영 메시지 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900">안녕하세요, {displayName}님! 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">오늘도 멋진 플레이를 기대합니다.</p>
        </section>

        {/* 소속 팀 목록 */}
        {teams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-green-600" />내 팀
              </h3>
              <Link href="/teams" className="text-xs text-green-600 hover:underline flex items-center gap-0.5">
                전체 보기 <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {teams.map((membership) => {
                const team = membership.teams as { id: string; name: string; description: string | null } | null;
                if (!team) return null;
                return (
                  <Card key={team.id} className="shadow-xs hover:shadow-sm transition-shadow">
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{team.name}</p>
                        {team.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{team.description}</p>}
                      </div>
                      <Badge variant={membership.role === "admin" ? "default" : "secondary"} className="text-xs">
                        {membership.role === "admin" ? "관리자" : "멤버"}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* 다가오는 경기 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-green-600" />
              다가오는 경기
            </h3>
            <Link href="/matches" className="text-xs text-green-600 hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {!upcomingMatches || upcomingMatches.length === 0 ? (
            <Card className="shadow-xs">
              <CardContent className="py-8 text-center text-sm text-gray-400">예정된 경기가 없습니다.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingMatches.map((match) => {
                const matchDate = new Date(match.match_date);
                const month = matchDate.getMonth() + 1;
                const day = matchDate.getDate();
                const weekday = ["일", "월", "화", "수", "목", "금", "토"][matchDate.getDay()];
                const hour = matchDate.getHours().toString().padStart(2, "0");
                const minute = matchDate.getMinutes().toString().padStart(2, "0");

                return (
                  <Link key={match.id} href={`/matches/${match.id}`}>
                    <Card className="shadow-xs hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <div className="min-w-[3rem] text-center bg-green-50 rounded-lg py-1.5 px-2">
                          <p className="text-xs text-green-600 font-medium">
                            {month}/{day}
                          </p>
                          <p className="text-xs text-gray-500">{weekday}요일</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{match.title ?? "경기"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {hour}:{minute} · {match.location ?? "장소 미정"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 공지사항 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-1.5">
              <Megaphone className="h-4 w-4 text-green-600" />
              공지사항
            </h3>
            <Link href="/announcements" className="text-xs text-green-600 hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {!notices || notices.length === 0 ? (
            <Card className="shadow-xs">
              <CardContent className="py-8 text-center text-sm text-gray-400">등록된 공지사항이 없습니다.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notices.map((notice) => {
                const createdAt = new Date(notice.created_at ?? "");
                const dateStr = `${createdAt.getMonth() + 1}/${createdAt.getDate()}`;

                return (
                  <Link key={notice.id} href="/announcements">
                    <Card className="shadow-xs hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {notice.is_pinned && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                고정
                              </Badge>
                            )}
                            <p className="font-medium text-gray-900 truncate">{notice.title}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 빠른 메뉴 */}
        <section className="pb-8">
          <h3 className="font-semibold text-gray-800 mb-3">빠른 메뉴</h3>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/matches">
              <Card className="shadow-xs hover:shadow-sm transition-shadow cursor-pointer text-center">
                <CardContent className="py-4 px-2">
                  <CalendarDays className="h-6 w-6 text-green-600 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-gray-700">경기 일정</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/teams">
              <Card className="shadow-xs hover:shadow-sm transition-shadow cursor-pointer text-center">
                <CardContent className="py-4 px-2">
                  <Users className="h-6 w-6 text-blue-500 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-gray-700">멤버</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/announcements">
              <Card className="shadow-xs hover:shadow-sm transition-shadow cursor-pointer text-center">
                <CardContent className="py-4 px-2">
                  <Megaphone className="h-6 w-6 text-orange-500 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-gray-700">공지사항</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/profile">
              <Card className="shadow-xs hover:shadow-sm transition-shadow cursor-pointer text-center">
                <CardContent className="py-4 px-2">
                  <UserCircle2 className="h-6 w-6 text-purple-500 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-gray-700">내 프로필</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
