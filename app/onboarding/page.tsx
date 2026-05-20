"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTeamOnboarding, joinTeamByCode } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/Logo";
import { Users, UserPlus, Loader2, Trophy, LogOut } from "lucide-react";

// 팀 생성 스키마
const createTeamSchema = z.object({
  name: z.string().min(1, "팀 이름을 입력해주세요.").max(50, "팀 이름은 50자 이내로 입력해주세요."),
  description: z.string().max(200, "팀 설명은 200자 이내로 입력해주세요.").optional(),
});

// 팀 참여 스키마
const joinTeamSchema = z.object({
  joinCode: z.string().min(1, "초대 코드를 입력해주세요."),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;
type JoinTeamFormData = z.infer<typeof joinTeamSchema>;

type Tab = "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 팀 생성 폼
  const createForm = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "", description: "" },
  });

  // 팀 참여 폼
  const joinForm = useForm<JoinTeamFormData>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: { joinCode: "" },
  });

  // 팀 생성 핸들러
  const handleCreate = async (data: CreateTeamFormData) => {
    setIsPending(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);

    const result = await createTeamOnboarding(formData);
    if (result?.error) {
      setServerError(result.error);
      setIsPending(false);
    }
  };

  // 팀 참여 핸들러
  const handleJoin = async (data: JoinTeamFormData) => {
    setIsPending(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("joinCode", data.joinCode);

    const result = await joinTeamByCode(formData);
    if (result?.error) {
      setServerError(result.error);
      setIsPending(false);
    }
  };

  // 탭 전환 시 에러 초기화
  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setServerError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <Logo className="mb-6" />

        {/* 환영 메시지 */}
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <Trophy className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">환영합니다! 🎉</h1>
          <p className="text-sm text-gray-500 mt-1">시작하려면 팀을 만들거나 초대 코드로 참여하세요.</p>
        </div>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            {/* 커스텀 탭 */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => switchTab("create")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
                  activeTab === "create" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users className="h-4 w-4" />팀 만들기
              </button>
              <button
                type="button"
                onClick={() => switchTab("join")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
                  activeTab === "join" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <UserPlus className="h-4 w-4" />팀 참여하기
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {/* 서버 에러 메시지 */}
            {serverError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* 팀 생성 탭 */}
            {activeTab === "create" && (
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
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
                    {...createForm.register("name")}
                  />
                  {createForm.formState.errors.name ? (
                    <p className="text-xs text-red-500">{createForm.formState.errors.name.message}</p>
                  ) : (
                    <p className="text-xs text-gray-400">팀을 대표하는 이름을 지어주세요.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">팀 설명 (선택)</Label>
                  <Textarea
                    id="description"
                    placeholder="팀에 대한 간단한 소개를 적어주세요."
                    rows={3}
                    maxLength={200}
                    disabled={isPending}
                    {...createForm.register("description")}
                  />
                  {createForm.formState.errors.description && (
                    <p className="text-xs text-red-500">{createForm.formState.errors.description.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    "팀 만들기"
                  )}
                </Button>
              </form>
            )}

            {/* 팀 참여 탭 */}
            {activeTab === "join" && (
              <form onSubmit={joinForm.handleSubmit(handleJoin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="joinCode">
                    초대 코드 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="joinCode"
                    type="text"
                    placeholder="예: ABC123"
                    className="text-center tracking-widest uppercase text-lg"
                    disabled={isPending}
                    {...joinForm.register("joinCode")}
                  />
                  {joinForm.formState.errors.joinCode ? (
                    <p className="text-xs text-red-500">{joinForm.formState.errors.joinCode.message}</p>
                  ) : (
                    <p className="text-xs text-gray-400">팀 관리자에게 받은 초대 코드를 입력하세요.</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      참여 중...
                    </>
                  ) : (
                    "팀 참여하기"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-4 mx-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
        >
          {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          로그아웃
        </button>
      </div>
    </div>
  );
}
