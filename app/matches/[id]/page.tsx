import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, MapPin, Users, CreditCard, Trophy, Target } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 경기 정보
  const { data: match } = await supabase.from("matches").select("*").eq("id", id).single();

  if (!match) return notFound();

  // 참가자 목록
  const { data: participants } = await supabase.from("match_participants").select("*, profiles(*)").eq("match_id", id);

  // 팀 편성
  const { data: teams } = await supabase.from("teams").select("*, team_members(*, profiles(*))").eq("match_id", id);

  // 경기 기록
  const { data: stats } = await supabase.from("match_stats").select("*, profiles(*)").eq("match_id", id);

  const matchDate = new Date(match.match_date);
  const isPast = matchDate < new Date();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 뒤로가기 */}
      <BackButton href="/matches" label="경기 목록" />

      {/* 경기 정보 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{match.title}</CardTitle>
            <div className="flex gap-2">
              {isPast && <Badge variant="outline">종료</Badge>}
              <Badge
                variant={match.status === "confirmed" ? "default" : match.status === "cancelled" ? "destructive" : "secondary"}
              >
                {match.status === "confirmed" ? "확정" : match.status === "cancelled" ? "취소" : "모집중"}
              </Badge>
            </div>
          </div>
          <CardDescription className="space-y-1">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {matchDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {match.location}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {match.max_players && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                최대 {match.max_players}명
              </span>
            )}
            {match.participation_fee && (
              <span className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                참가비 {match.participation_fee.toLocaleString()}원
              </span>
            )}
          </div>
          {match.description && <p className="text-sm">{match.description}</p>}
        </CardContent>
      </Card>

      {/* 참가자 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          참가자 ({participants?.length || 0}
          {match.max_players ? `/${match.max_players}` : ""}명)
        </h2>
        {participants && participants.length > 0 ? (
          <div className="grid gap-2">
            {participants.map((p) => (
              <Card key={p.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(p.profiles as { name: string })?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {(p.profiles as { nickname: string | null; name: string })?.nickname ||
                          (p.profiles as { name: string })?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(p.profiles as { position: string | null })?.position || "포지션 미정"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.attended && (
                      <Badge variant="default" className="text-xs">
                        출석
                      </Badge>
                    )}
                    {p.is_late && (
                      <Badge variant="destructive" className="text-xs">
                        지각
                      </Badge>
                    )}
                    <Badge variant={p.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                      {p.status === "confirmed" ? "확정" : p.status || "대기"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">아직 참가 신청자가 없습니다</CardContent>
          </Card>
        )}
      </section>

      {/* 팀 편성 */}
      {teams && teams.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />팀 편성
          </h2>
          <div className="grid gap-3">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {team.color && <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: team.color }} />}
                    {team.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(
                      team.team_members as Array<{
                        id: string;
                        profiles: { name: string; nickname: string | null } | null;
                      }>
                    )?.map((member) => (
                      <Badge key={member.id} variant="outline">
                        {member.profiles?.nickname || member.profiles?.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 경기 기록 */}
      {isPast && stats && stats.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            경기 기록
          </h2>
          <div className="grid gap-2">
            {stats.map((stat) => (
              <Card key={stat.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(stat.profiles as { name: string })?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">
                      {(stat.profiles as { nickname: string | null; name: string })?.nickname ||
                        (stat.profiles as { name: string })?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stat.goals ? <Badge variant="default">{stat.goals}골</Badge> : null}
                    {stat.assists ? <Badge variant="secondary">{stat.assists}어시</Badge> : null}
                    {stat.mom && <Badge variant="destructive">MOM</Badge>}
                    {stat.yellow_cards ? <Badge className="bg-yellow-400 text-black">옐로 {stat.yellow_cards}</Badge> : null}
                    {stat.red_cards ? <Badge variant="destructive">레드 {stat.red_cards}</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* 하단 네비게이션 */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </div>
  );
}
