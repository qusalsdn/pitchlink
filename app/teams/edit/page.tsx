"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, UserCircle2, Trash2, AlertTriangle } from "lucide-react";
import { updateTeam, updateMemberRole, deleteTeam } from "./actions";
import { ROLE_OPTIONS } from "@/lib/constants/roles";

// 폼 스키마 정의
const teamEditSchema = z.object({
  name: z.string().min(1, "팀 이름을 입력해주세요.").max(50, "팀 이름은 50자 이내로 입력해주세요."),
  description: z.string().max(200, "팀 설명은 200자 이내로 입력해주세요."),
});

type TeamEditFormValues = z.infer<typeof teamEditSchema>;

// 멤버 정보 타입
interface MemberInfo {
  id: string;
  user_id: string | null;
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export default function TeamEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [teamName, setTeamName] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TeamEditFormValues>({
    resolver: zodResolver(teamEditSchema),
    defaultValues: { name: "", description: "" },
  });

  // 멤버 목록 조회 함수
  const fetchMembers = useCallback(async (supabase: ReturnType<typeof createClient>, tid: string) => {
    const { data: rawMembers } = await supabase
      .from("team_members")
      .select("id, user_id, role")
      .eq("team_id", tid)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true });

    if (!rawMembers) return;

    // 프로필 일괄 조회
    const userIds = rawMembers.map((m) => m.user_id).filter(Boolean) as string[];
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds)
      : { data: [] };

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    setMembers(
      rawMembers.map((m) => {
        const profile = m.user_id ? profileMap.get(m.user_id) : null;
        return {
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        };
      }),
    );
  }, []);

  // 팀 정보 및 권한 확인
  useEffect(() => {
    if (!teamId) {
      setError("팀 정보를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    const fetchTeam = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setMyUserId(user.id);

      // 운영진 권한 확인
      const { data: membership } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      const staffRoles = ["admin", "manager", "coach", "chairman"];
      if (!membership || !staffRoles.includes(membership.role ?? "")) {
        setError("운영진만 팀 정보를 수정할 수 있습니다.");
        setLoading(false);
        return;
      }

      setMyRole(membership.role);

      // 팀 정보 조회
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id, name, description")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        setError("팀 정보를 불러올 수 없습니다.");
        setLoading(false);
        return;
      }

      setTeamName(team.name);
      reset({
        name: team.name,
        description: team.description ?? "",
      });

      // 멤버 목록 조회
      await fetchMembers(supabase, teamId);

      setLoading(false);
    };

    fetchTeam();
  }, [teamId, router, reset, fetchMembers]);

  // 폼 제출
  const onSubmit = (data: TeamEditFormValues) => {
    if (!teamId) return;

    startTransition(async () => {
      const result = await updateTeam(teamId, {
        name: data.name,
        description: data.description ?? "",
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setTeamName(data.name);
      router.push(`/teams?team=${teamId}`);
    });
  };

  // 멤버 역할 변경 핸들러
  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!teamId) return;
    setRoleUpdating(memberId);
    setError(null);

    const result = await updateMemberRole(teamId, memberId, newRole);

    if (result.error) {
      setError(result.error);
      setRoleUpdating(null);
      return;
    }

    // 로컬 state 업데이트
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    setRoleUpdating(null);
  };

  // 팀 삭제 핸들러
  const handleDeleteTeam = () => {
    if (!teamId) return;

    startTransition(async () => {
      const result = await deleteTeam(teamId);

      if (result.error) {
        setError(result.error);
        setShowDeleteConfirm(false);
        setDeleteConfirmText("");
        return;
      }

      router.replace("/teams");
    });
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // 에러 상태 (권한 없음 등)
  if (error && !isDirty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 h-14 flex items-center gap-3">
            <Link href={teamId ? `/teams?team=${teamId}` : "/teams"} className="text-gray-500 hover:text-gray-700 -ml-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-bold text-lg text-gray-900">팀 수정</span>
          </div>
        </header>
        <main className="px-4 py-6 max-w-lg mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <Link href="/teams" className="text-sm text-green-600 underline mt-3 inline-block">
                돌아가기
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link href={`/teams?team=${teamId}`} className="text-gray-500 hover:text-gray-700 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-bold text-lg text-gray-900">팀 설정</span>
        </div>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* 에러 메시지 (글로벌) */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* ━━━ 섹션 1: 팀 기본 정보 수정 ━━━ */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">기본 정보</h3>

              <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-500 mb-1">
                  팀 이름 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="팀 이름을 입력하세요"
                  {...register("name")}
                  className={errors.name ? "border-red-300 focus:ring-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-medium text-gray-500 mb-1">
                  팀 설명
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="팀에 대한 간단한 설명을 입력하세요"
                  {...register("description")}
                  className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none ${
                    errors.description ? "border-red-300 focus:ring-red-500" : "border-input"
                  }`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
              </div>

              {/* 저장 버튼 — 카드 안에 포함 */}
              <Button
                type="submit"
                disabled={isPending || !isDirty}
                className="w-full h-10 text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    저장 중...
                  </span>
                ) : (
                  "저장하기"
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* ━━━ 섹션 2: 멤버 권한 변경 ━━━ */}
        {members.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">멤버 권한 관리</h3>
              <p className="text-xs text-gray-400 mb-3">멤버의 역할을 변경할 수 있습니다.</p>

              <div className="divide-y divide-gray-100">
                {members.map((member) => {
                  const isMe = member.user_id === myUserId;
                  const displayName = member.full_name ?? "이름 없음";
                  const isUpdating = roleUpdating === member.id;

                  return (
                    <div key={member.id} className="flex items-center gap-3 py-2.5">
                      {/* 아바타 */}
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {member.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={member.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle2 className="h-4 w-4 text-gray-400" />
                        )}
                      </div>

                      {/* 이름 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900 text-sm truncate">{displayName}</span>
                          {isMe && (
                            <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                              나
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 역할 선택 — shadcn Select */}
                      <div className="shrink-0">
                        {isUpdating ? (
                          <div className="w-[76px] h-8 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <Select
                            value={member.role ?? "member"}
                            disabled={isMe}
                            onValueChange={(value) => handleRoleChange(member.id, value)}
                          >
                            <SelectTrigger size="sm" className={`w-[76px] text-xs ${isMe ? "opacity-50" : ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" align="end">
                              <SelectGroup>
                                <SelectLabel>역할</SelectLabel>
                                {ROLE_OPTIONS.map(([value, label]) => (
                                  <SelectItem key={value} value={value} className="text-xs">
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ━━━ 섹션 3: 팀 삭제 (admin만) ━━━ */}
        {myRole === "admin" && (
          <Card className="shadow-sm border-red-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold text-red-600">위험 구역</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">팀을 삭제하면 모든 데이터가 영구적으로 삭제되며 되돌릴 수 없습니다.</p>

              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-9 text-sm border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />팀 삭제
                </Button>
              ) : (
                <div className="space-y-3 p-3 rounded-lg bg-red-50/60 border border-red-100">
                  <p className="text-xs text-red-600 font-medium">
                    확인을 위해 팀 이름 <span className="font-bold">&quot;{teamName}&quot;</span>을 입력해주세요.
                  </p>
                  <Input
                    placeholder="팀 이름 입력"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="h-9 text-sm border-red-200 focus:ring-red-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                      }}
                      className="flex-1 h-9 text-sm"
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      disabled={deleteConfirmText !== teamName || isPending}
                      onClick={handleDeleteTeam}
                      className="flex-1 h-9 text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          삭제 중...
                        </span>
                      ) : (
                        "영구 삭제"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
