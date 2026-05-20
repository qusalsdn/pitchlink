import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserCircle2, Crown, ShieldAlert } from "lucide-react";
import { InviteCodeCard } from "./InviteCodeCard";

// 운영진 역할 목록
const STAFF_ROLES = ["admin", "manager", "coach", "chairman"] as const;

// 역할 한글 레이블
const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  manager: "매니저",
  coach: "코치",
  chairman: "회장",
  member: "회원",
  guest: "게스트",
};

// 포지션 한글 매핑
const POSITION_LABEL: Record<string, string> = {
  goalkeeper: "GK",
  defender: "DF",
  midfielder: "MF",
  forward: "FW",
};

// 실력 레벨 레이블
function SkillBadge({ level }: { level: number | null }) {
  if (!level) return null;
  const labels: Record<number, { text: string; className: string }> = {
    1: { text: "입문", className: "bg-gray-100 text-gray-600" },
    2: { text: "초급", className: "bg-blue-50 text-blue-600" },
    3: { text: "중급", className: "bg-green-50 text-green-600" },
    4: { text: "고급", className: "bg-orange-50 text-orange-600" },
    5: { text: "전문", className: "bg-purple-50 text-purple-600" },
  };
  const info = labels[level] ?? { text: `Lv.${level}`, className: "bg-gray-100 text-gray-500" };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${info.className}`}>{info.text}</span>;
}

type ProfileInfo = {
  full_name: string | null;
  avatar_url: string | null;
  preferred_position: string | null;
  skill_level: number | null;
  injury_status: string | null;
} | null;

interface PageProps {
  searchParams: Promise<{ team?: string }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 현재 유저가 속한 모든 팀 조회 (join_code 포함)
  const { data: myMemberships } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, name, description, join_code)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  const myTeams = (myMemberships ?? [])
    .map((m) => ({
      teamId: m.team_id,
      myRole: m.role,
      team: m.teams as { id: string; name: string; description: string | null; join_code: string | null } | null,
    }))
    .filter((m) => m.team !== null);

  // URL searchParams에서 선택된 팀 ID 결정 (기본값: 첫 번째 팀)
  const { team: teamIdParam } = await searchParams;
  const selectedTeamId = myTeams.find((m) => m.teamId === teamIdParam)?.teamId ?? myTeams[0]?.teamId ?? null;
  const selectedTeamInfo = myTeams.find((m) => m.teamId === selectedTeamId) ?? null;
  const selectedTeam = selectedTeamInfo?.team ?? null;

  // 선택된 팀의 멤버 전체 조회
  const { data: rawMembers } = selectedTeamId
    ? await supabase
        .from("team_members")
        .select("id, role, joined_at, user_id")
        .eq("team_id", selectedTeamId)
        .order("role", { ascending: true }) // admin 먼저
        .order("joined_at", { ascending: true })
    : { data: [] };

  const members = rawMembers ?? [];

  // 멤버 user_id 목록으로 프로필 일괄 조회
  const userIds = members.map((m) => m.user_id).filter(Boolean) as string[];
  const { data: rawProfiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, preferred_position, skill_level, injury_status")
        .in("id", userIds)
    : { data: [] };

  // user_id → profile 맵
  const profileMap = new Map((rawProfiles ?? []).map((p) => [p.id, p]));

  // 운영진 / 일반 회원 / 게스트 분리
  const staffMembers = members.filter((m) => STAFF_ROLES.includes(m.role as (typeof STAFF_ROLES)[number]));
  const regularMembers = members.filter((m) => m.role === "member");
  const guests = members.filter((m) => m.role === "guest");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-bold text-lg text-gray-900">내 팀</span>
        </div>

        {/* 팀이 여러 개일 때 탭 표시 */}
        {myTeams.length > 1 && (
          <div className="px-4 pb-0 flex gap-1 overflow-x-auto scrollbar-none border-t border-gray-100">
            {myTeams.map(({ teamId, team }) => {
              const isActive = teamId === selectedTeamId;
              return (
                <Link
                  key={teamId}
                  href={`/teams?team=${teamId}`}
                  className={`shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {team?.name ?? "팀"}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <main className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* 팀 없음 안내 */}
        {myTeams.length === 0 && (
          <Card className="border-dashed border-2 border-gray-300 bg-white">
            <CardContent className="py-12 text-center">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-500 mb-1">소속 팀이 없습니다</p>
              <p className="text-sm text-gray-400">팀에 참여하면 멤버를 확인할 수 있어요.</p>
            </CardContent>
          </Card>
        )}

        {selectedTeam && (
          <>
            {/* ━━━ 섹션 1: 팀 정보 ━━━ */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base truncate">{selectedTeam.name}</p>
                    {selectedTeam.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{selectedTeam.description}</p>
                    )}
                  </div>
                </div>
                {/* 통계 */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{members.length}</p>
                    <p className="text-[11px] text-gray-400">전체</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{staffMembers.length}</p>
                    <p className="text-[11px] text-gray-400">운영진</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{regularMembers.length + guests.length}</p>
                    <p className="text-[11px] text-gray-400">일반 회원</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ━━━ 섹션 2: 멤버 목록 ━━━ */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                {/* 운영진 (관리자/매니저/코치/회장) */}
                {staffMembers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-yellow-500" />
                      운영진
                    </h3>
                    <div className="space-y-2.5">
                      {staffMembers.map((member) => {
                        const profile = (member.user_id ? (profileMap.get(member.user_id) ?? null) : null) as ProfileInfo;
                        const displayName = profile?.full_name ?? "이름 없음";
                        const isMe = member.user_id === user.id;
                        const isInjured = profile?.injury_status && profile.injury_status !== "healthy";
                        const posLabel = profile?.preferred_position
                          ? (POSITION_LABEL[profile.preferred_position] ?? profile.preferred_position)
                          : null;
                        const roleLabel = ROLE_LABEL[member.role ?? ""] ?? "운영진";

                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg bg-yellow-50/60 border border-yellow-100"
                          >
                            {/* 아바타 */}
                            <div className="w-9 h-9 rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center shrink-0 overflow-hidden">
                              {profile?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle2 className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>

                            {/* 이름 + 포지션 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-gray-900 text-sm">{displayName}</span>
                                {isMe && (
                                  <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                                    나
                                  </span>
                                )}
                                {isInjured && <ShieldAlert className="h-3.5 w-3.5 text-red-400" />}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {posLabel && <span className="text-[11px] text-gray-400 font-medium">{posLabel}</span>}
                                <SkillBadge level={profile?.skill_level ?? null} />
                              </div>
                            </div>

                            {/* 역할 배지 */}
                            <Badge className="text-[10px] shrink-0 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                              {roleLabel}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 구분선 */}
                {staffMembers.length > 0 && (regularMembers.length > 0 || guests.length > 0) && (
                  <div className="border-t border-gray-100 my-4" />
                )}

                {/* 일반 회원 */}
                {regularMembers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      일반 회원 · {regularMembers.length}명
                    </h3>
                    <div className="space-y-1.5">
                      {regularMembers.map((member) => {
                        const profile = (member.user_id ? (profileMap.get(member.user_id) ?? null) : null) as ProfileInfo;
                        const displayName = profile?.full_name ?? "이름 없음";
                        const isMe = member.user_id === user.id;
                        const isInjured = profile?.injury_status && profile.injury_status !== "healthy";
                        const posLabel = profile?.preferred_position
                          ? (POSITION_LABEL[profile.preferred_position] ?? profile.preferred_position)
                          : null;

                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {/* 아바타 */}
                            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                              {profile?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle2 className="h-4 w-4 text-gray-400" />
                              )}
                            </div>

                            {/* 이름 + 포지션 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-gray-900 text-sm">{displayName}</span>
                                {isMe && (
                                  <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                                    나
                                  </span>
                                )}
                                {isInjured && <ShieldAlert className="h-3.5 w-3.5 text-red-400" />}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {posLabel && <span className="text-[11px] text-gray-400 font-medium">{posLabel}</span>}
                                <SkillBadge level={profile?.skill_level ?? null} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 게스트 */}
                {guests.length > 0 && (
                  <>
                    {(staffMembers.length > 0 || regularMembers.length > 0) && <div className="border-t border-gray-100 my-4" />}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-300" />
                        게스트 · {guests.length}명
                      </h3>
                      <div className="space-y-1.5">
                        {guests.map((member) => {
                          const profile = (member.user_id ? (profileMap.get(member.user_id) ?? null) : null) as ProfileInfo;
                          const displayName = profile?.full_name ?? "이름 없음";
                          const isMe = member.user_id === user.id;

                          return (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors opacity-70"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                {profile?.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <UserCircle2 className="h-4 w-4 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-gray-700 text-sm">{displayName}</span>
                                  {isMe && (
                                    <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                                      나
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                게스트
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* 멤버 없음 */}
                {members.length === 0 && <div className="py-8 text-center text-sm text-gray-400">팀 멤버가 없습니다.</div>}
              </CardContent>
            </Card>

            {/* ━━━ 섹션 3: 초대 코드 (운영진만 표시) ━━━ */}
            {selectedTeamInfo?.myRole && STAFF_ROLES.includes(selectedTeamInfo.myRole as (typeof STAFF_ROLES)[number]) && (
              <InviteCodeCard teamId={selectedTeamId!} joinCode={selectedTeam?.join_code ?? null} isAdmin={true} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
