import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, CreditCard, Plus } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";

export default async function MatchesPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase.from("matches").select("*").order("match_date", { ascending: false });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 뒤로가기 */}
      <BackButton />

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">경기 일정</h1>
          <p className="text-sm text-muted-foreground">전체 경기 목록을 확인하세요</p>
        </div>
        <Button asChild>
          <Link href="/matches/new">
            <Plus className="h-4 w-4 mr-1" />
            경기 생성
          </Link>
        </Button>
      </div>

      {/* 경기 목록 */}
      {matches && matches.length > 0 ? (
        <div className="grid gap-3">
          {matches.map((match) => {
            const matchDate = new Date(match.match_date);
            const isPast = matchDate < new Date();

            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className={`hover:bg-accent transition-colors ${isPast ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{match.title}</CardTitle>
                      <div className="flex gap-2">
                        {isPast && <Badge variant="outline">종료</Badge>}
                        <Badge
                          variant={
                            match.status === "confirmed" ? "default" : match.status === "cancelled" ? "destructive" : "secondary"
                          }
                        >
                          {match.status === "confirmed" ? "확정" : match.status === "cancelled" ? "취소" : "모집중"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {matchDate.toLocaleDateString("ko-KR", {
                          year: "numeric",
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
                    {match.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{match.description}</p>}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">등록된 경기가 없습니다</CardContent>
        </Card>
      )}
    </div>
  );
}
