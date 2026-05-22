import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  UserCircle2,
  ShieldAlert,
  Ruler,
  Weight,
  Footprints,
  Calendar,
  Crown,
} from "lucide-react";
import { ROLE_LABEL, STAFF_ROLES } from "@/lib/constants/roles";

// 포지션 한글 매핑
const POSITION_LABEL: Record<string, string> = {
  goalkeeper: "골키퍼 (GK)",
  defender: "수비수 (DF)",
  midfielder: "미드필더 (MF)",
  forward: "공격수 (FW)",
};

// 주발 한글 매핑
const FOOT_LABEL: Record<string, string> = {
  left: "왼발",
  right: "오른발",
  both: "양발",
};

// 부상 상태 한글 매핑
const INJURY_LABEL: Record<string, { text: string; className: string }> = {
  healthy: { text: "건강함", className: "bg-green-100 text-green-700" },
  minor: { text: "경상", className: "bg-yellow-100 text-yellow-700" },
  major: { text: "중상", className: "bg-red-100 text-red-700" },
  recovering: { text: "회복중", className: "bg-blue-100 text-blue-700" },
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
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${info.className}`}>
      {info.text}
    </span>
  );
}

interface PageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ team?: string }>;
}

export default async function MemberDetailPage({ params, searchParams }: PageProps) {
  const supabase = await createClient();
  const { userId } = await params;
  const { team: teamIdParam } = await searchParams;

  // 인증 확인
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect("/login");
  }

  // 조회 대상 회원의 프로필 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone, preferred_position, dominant_foot, height_cm, weight_kg, skill_level, injury_status, created_at")
    .eq("id", userId)
    .single();

  if (!profile) {
    notFound();
  }

  // 팀 멤버십 정보 조회 (특정 팀이 지정된 경우)
  let membershipInfo: {
    role: string | null;
    joined_at: string | null;
    team_name: string | null;
    team_id: string | null;
  } | null = null;

  if (teamIdParam) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role, joined_at, teams(id, name)")
      .eq("user_id", userId)
      .eq("team_id", teamIdParam)
      .single();

    if (membership) {
      membershipInfo = {
        role: membership.role,
        joined_at: membership.joined_at,
        team_name: (membership.teams as { id: string; name: string } | null)?.name ?? null,
        team_id: (membership.teams as { id: string; name: string } | null)?.id ?? null,
      };
    }
  }

  // 지정된 팀이 없으면 가입한 첫 번째 팀 정보 조회
  if (!membershipInfo) {
    const { data: firstMembership } = await supabase
      .from("team_members")
      .select("role, joined_at, team_id, teams(id, name)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .single();

    if (firstMembership) {
      membershipInfo = {
        role: firstMembership.role,
        joined_at: firstMembership.joined_at,
        team_name: (firstMembership.teams as { id: string; name: string } | null)?.name ?? null,
        team_id: firstMembership.team_id,
      };
    }
  }

  const isStaff = membershipInfo?.role && STAFF_ROLES.includes(membershipInfo.role as (typeof STAFF_ROLES)[number]);
  const roleLabel = membershipInfo?.role ? (ROLE_LABEL[membershipInfo.role] ?? membershipInfo.role) : null;
  const injuryInfo = profile.injury_status ? (INJURY_LABEL[profile.injury_status] ?? null) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link href={teamIdParam ? `/teams?team=${teamIdParam}` : "/teams"}>
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <span className="font-bold text-lg text-gray-900">회원 정보</span>
        </div>
      </header>

      <main className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* 프로필 카드 */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              {/* 아바타 */}
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center shrink-0 overflow-hidden mb-4">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "회원"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="h-12 w-12 text-gray-400" />
                )}
              </div>

              {/* 이름 */}
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {profile.full_name ?? "이름 없음"}
              </h1>

              {/* 역할 배지 */}
              {roleLabel && (
                <Badge
                  className={`text-xs mt-1 ${
                    isStaff
                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                      : membershipInfo?.role === "guest"
                      ? "bg-gray-100 text-gray-600 border-gray-200"
                      : "bg-green-100 text-green-700 border-green-200"
                  }`}
                >
                  {isStaff && <Crown className="h-3 w-3 mr-1" />}
                  {roleLabel}
                </Badge>
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-100 my-5" />

            {/* 상세 정보 그리드 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 포지션 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">선호 포지션</p>
                <p className="font-medium text-gray-900">
                  {profile.preferred_position
                    ? (POSITION_LABEL[profile.preferred_position] ?? profile.preferred_position)
                    : "미설정"}
                </p>
              </div>

              {/* 실력 레벨 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">실력 레벨</p>
                <div className="mt-0.5">
                  <SkillBadge level={profile.skill_level} />
                </div>
              </div>

              {/* 주발 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Footprints className="h-3 w-3" />
                  주발
                </p>
                <p className="font-medium text-gray-900">
                  {profile.dominant_foot ? (FOOT_LABEL[profile.dominant_foot] ?? profile.dominant_foot) : "미설정"}
                </p>
              </div>

              {/* 부상 상태 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">부상 상태</p>
                {injuryInfo ? (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 ${injuryInfo.className}`}>
                    <ShieldAlert className="h-3 w-3" />
                    {injuryInfo.text}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">건강함</span>
                )}
              </div>

              {/* 키 */}
              {profile.height_cm && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    키
                  </p>
                  <p className="font-medium text-gray-900">{profile.height_cm} cm</p>
                </div>
              )}

              {/* 몸무게 */}
              {profile.weight_kg && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Weight className="h-3 w-3" />
                    몸무게
                  </p>
                  <p className="font-medium text-gray-900">{profile.weight_kg} kg</p>
                </div>
              )}
            </div>

            {/* 가입일 */}
            {membershipInfo?.joined_at && (
              <>
                <div className="border-t border-gray-100 my-5" />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    팀 가입일: {new Date(membershipInfo.joined_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 팀 정보 카드 */}
        {membershipInfo?.team_name && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">소속 팀</p>
              <p className="font-semibold text-gray-900">{membershipInfo.team_name}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
