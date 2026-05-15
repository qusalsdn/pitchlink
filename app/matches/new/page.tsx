"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/client";

const matchSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  location: z.string().min(1, "장소를 입력해주세요"),
  matchDate: z.string().min(1, "날짜와 시간을 선택해주세요"),
  maxPlayers: z.coerce.number().min(2, "최소 2명 이상이어야 합니다").nullish(),
  participationFee: z.coerce.number().min(0, "0원 이상이어야 합니다").nullish(),
  description: z.string().optional(),
});

type MatchFormData = z.infer<typeof matchSchema>;

export default function NewMatchPage() {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  const onSubmit = async (data: MatchFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("root", { message: "로그인이 필요합니다" });
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("club_id").eq("id", user.id).single();

    if (!profile?.club_id) {
      setError("root", { message: "클럽에 소속되어 있지 않습니다" });
      return;
    }

    const { error: insertError } = await supabase.from("matches").insert({
      title: data.title,
      location: data.location,
      match_date: new Date(data.matchDate).toISOString(),
      max_players: data.maxPlayers ?? null,
      participation_fee: data.participationFee ?? null,
      description: data.description || null,
      club_id: profile.club_id,
      created_by: user.id,
    });

    if (insertError) {
      setError("root", { message: insertError.message });
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목 *</label>
              <Input {...register("title")} placeholder="경기 제목" aria-invalid={!!errors.title} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">장소 *</label>
              <Input {...register("location")} placeholder="경기 장소" aria-invalid={!!errors.location} />
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">날짜/시간 *</label>
              <Input {...register("matchDate")} type="datetime-local" aria-invalid={!!errors.matchDate} />
              {errors.matchDate && <p className="text-sm text-destructive">{errors.matchDate.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">최대 인원</label>
                <Input {...register("maxPlayers")} type="number" placeholder="예: 16" aria-invalid={!!errors.maxPlayers} />
                {errors.maxPlayers && <p className="text-sm text-destructive">{errors.maxPlayers.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">참가비 (원)</label>
                <Input
                  {...register("participationFee")}
                  type="number"
                  placeholder="예: 10000"
                  aria-invalid={!!errors.participationFee}
                />
                {errors.participationFee && <p className="text-sm text-destructive">{errors.participationFee.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <Textarea {...register("description")} placeholder="경기에 대한 추가 정보" rows={3} />
            </div>

            {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "생성 중..." : "경기 생성"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
