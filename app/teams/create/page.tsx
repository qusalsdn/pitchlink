"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTeam } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Zod 스키마 정의
const createTeamSchema = z.object({
  name: z.string().min(1, "팀 이름을 입력해주세요.").max(50, "팀 이름은 50자 이내로 입력해주세요."),
  description: z.string().max(200, "팀 설명은 200자 이내로 입력해주세요.").optional(),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

export default function CreateTeamPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateTeamFormData) => {
    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) {
      formData.append("description", data.description);
    }

    const result = await createTeam(formData);

    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
    // 성공 시 서버 액션에서 redirect 처리
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-gray-900">
            PitchLink
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* 뒤로 가기 */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>홈으로 돌아가기</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">새 팀 만들기</CardTitle>
            <p className="text-sm text-gray-500 mt-1">축구팀을 생성하고 멤버들을 초대해보세요.</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 팀 이름 */}
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  팀 이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="예: 한강 FC"
                  maxLength={50}
                  disabled={isPending}
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                ) : (
                  <p className="text-xs text-gray-500">최대 50자까지 입력 가능합니다.</p>
                )}
              </div>

              {/* 팀 설명 */}
              <div className="space-y-1.5">
                <Label htmlFor="description">팀 설명 (선택사항)</Label>
                <Textarea
                  id="description"
                  placeholder="팀에 대한 간단한 소개를 적어주세요."
                  rows={3}
                  maxLength={200}
                  disabled={isPending}
                  {...register("description")}
                />
                {errors.description ? (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                ) : (
                  <p className="text-xs text-gray-500">최대 200자까지 입력 가능합니다.</p>
                )}
              </div>

              {/* 서버 에러 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <Link href="/" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={isPending}>
                    취소
                  </Button>
                </Link>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isPending}>
                  {isPending ? "생성 중..." : "팀 만들기"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
