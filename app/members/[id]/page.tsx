import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Trophy, Target, Flame } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 프로필 조회
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();

  if (!profile) return notFound();

  // 해당 유저의 경기 기록 집계
  const { data: stats } = await supabase.from("match_stats").select("*").eq("user_id", id);

  const totalGoals = stats?.reduce((sum, s) => sum + (s.goals || 0), 0) || 0;
  const totalAssists = stats?.reduce((sum, s) => sum + (s.assists || 0), 0) || 0;
  const totalMom = stats?.filter((s) => s.mom).length || 0;
  const totalMatches = stats?.length || 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 뒤로가기 */}
      <BackButton href="/members" label="멤버 목록" />

      {/* 프로필 카드 */}
      <Card>
        <CardContent className="py-6 flex flex-col items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl">{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold">
              {profile.nickname || profile.name}
              {profile.jersey_number !== null && <span className="text-muted-foreground ml-2">#{profile.jersey_number}</span>}
            </h1>
            <p className="text-sm text-muted-foreground">{profile.name}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {profile.position && <Badge variant="secondary">{profile.position}</Badge>}
              {profile.preferred_foot && <Badge variant="outline">{profile.preferred_foot}</Badge>}
              {profile.role === "admin" && <Badge variant="default">관리자</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기본 정보 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{profile.attendance_score ?? "-"}</p>
            <p className="text-xs text-muted-foreground">출석점수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{profile.skill_rating ?? "-"}</p>
            <p className="text-xs text-muted-foreground">스킬레이팅</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 누적 기록 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          누적 기록
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />골
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-3xl font-bold">{totalGoals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Flame className="h-3 w-3" />
                어시스트
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-3xl font-bold">{totalAssists}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs text-muted-foreground">MOM</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-3xl font-bold">{totalMom}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs text-muted-foreground">경기 수</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-3xl font-bold">{totalMatches}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
