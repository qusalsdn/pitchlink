import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin, Users, Megaphone, Trophy, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // 로그인 유저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 다가오는 경기 조회 (최대 3개)
  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("*")
    .gte("match_date", new Date().toISOString())
    .order("match_date", { ascending: true })
    .limit(3);

  // 공지사항 조회 (고정 우선, 최대 3개)
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  // 비로그인 상태면 랜딩 페이지
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">⚽ PitchLink</h1>
          <p className="text-muted-foreground text-lg">우리 동호회를 위한 스마트한 경기 관리 플랫폼</p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 유저 프로필 조회
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">⚽ PitchLink</h1>
          <p className="text-sm text-muted-foreground">안녕하세요, {profile?.nickname || profile?.name || "선수"}님</p>
        </div>
        <nav className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/matches">경기</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/members">멤버</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/payments">회비</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/announcements">공지</Link>
          </Button>
        </nav>
      </header>

      <Separator />

      {/* 다가오는 경기 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            다가오는 경기
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/matches">전체보기</Link>
          </Button>
        </div>

        {upcomingMatches && upcomingMatches.length > 0 ? (
          <div className="grid gap-3">
            {upcomingMatches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="hover:bg-accent transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{match.title}</CardTitle>
                      <Badge variant={match.status === "confirmed" ? "default" : "secondary"}>
                        {match.status === "confirmed" ? "확정" : match.status === "cancelled" ? "취소" : "모집중"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(match.match_date).toLocaleDateString("ko-KR", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.location}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {match.max_players && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          최대 {match.max_players}명
                        </span>
                      )}
                      {match.participation_fee && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {match.participation_fee.toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">예정된 경기가 없습니다</CardContent>
          </Card>
        )}
      </section>

      {/* 공지사항 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            공지사항
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/announcements">전체보기</Link>
          </Button>
        </div>

        {announcements && announcements.length > 0 ? (
          <div className="grid gap-2">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    {announcement.is_pinned && (
                      <Badge variant="destructive" className="text-xs">
                        고정
                      </Badge>
                    )}
                    <CardTitle className="text-sm">{announcement.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {announcement.created_at && new Date(announcement.created_at).toLocaleDateString("ko-KR")}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">공지사항이 없습니다</CardContent>
          </Card>
        )}
      </section>

      {/* 퀵 통계 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5" />내 정보
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{profile?.position || "-"}</p>
              <p className="text-xs text-muted-foreground">포지션</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{profile?.jersey_number ?? "-"}</p>
              <p className="text-xs text-muted-foreground">등번호</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{profile?.attendance_score ?? "-"}</p>
              <p className="text-xs text-muted-foreground">출석점수</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{profile?.skill_rating ?? "-"}</p>
              <p className="text-xs text-muted-foreground">스킬레이팅</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
