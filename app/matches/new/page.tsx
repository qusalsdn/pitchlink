"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/client";

export default function NewMatchPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const location = formData.get("location") as string;
    const matchDate = formData.get("match_date") as string;
    const maxPlayers = formData.get("max_players") as string;
    const participationFee = formData.get("participation_fee") as string;
    const description = formData.get("description") as string;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다");
      setLoading(false);
      return;
    }

    // 유저의 club_id 조회
    const { data: profile } = await supabase.from("profiles").select("club_id").eq("id", user.id).single();

    if (!profile?.club_id) {
      setError("클럽에 소속되어 있지 않습니다");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("matches").insert({
      title,
      location,
      match_date: new Date(matchDate).toISOString(),
      max_players: maxPlayers ? parseInt(maxPlayers) : null,
      participation_fee: participationFee ? parseInt(participationFee) : null,
      description: description || null,
      club_id: profile.club_id,
      created_by: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/matches");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <BackButton href="/matches" label="경기 목록" />

      <Card>
        <CardHeader>
          <CardTitle>경기 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목 *</label>
              <Input name="title" placeholder="경기 제목" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">장소 *</label>
              <Input name="location" placeholder="경기 장소" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">날짜/시간 *</label>
              <Input name="match_date" type="datetime-local" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">최대 인원</label>
                <Input name="max_players" type="number" placeholder="예: 16" min={2} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">참가비 (원)</label>
                <Input name="participation_fee" type="number" placeholder="예: 10000" min={0} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <Textarea name="description" placeholder="경기에 대한 추가 정보" rows={3} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "생성 중..." : "경기 생성"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
