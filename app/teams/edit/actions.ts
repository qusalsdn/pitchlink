"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STAFF_ROLES, ALL_ROLES } from "@/lib/constants/roles";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

/**
 * 팀 정보 수정 서버 액션
 * 운영진(admin, manager, coach, chairman)만 호출 가능
 */
export async function updateTeam(teamId: string, data: { name: string; description: string }): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 운영진 권한 확인
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !(STAFF_ROLES as readonly string[]).includes(membership.role ?? "")) {
    return { error: "운영진만 팀 정보를 수정할 수 있습니다." };
  }

  // 팀 정보 업데이트
  const { error: updateError } = await supabase
    .from("teams")
    .update({
      name: data.name.trim(),
      description: data.description.trim() || null,
    })
    .eq("id", teamId);

  if (updateError) {
    console.error("팀 정보 수정 오류:", updateError);
    return { error: "팀 정보 수정에 실패했습니다." };
  }

  revalidatePath("/teams");
  return { success: true };
}

/**
 * 멤버 역할 변경 서버 액션
 * 운영진만 호출 가능, 자기 자신의 역할은 변경 불가
 */
export async function updateMemberRole(teamId: string, targetMemberId: string, newRole: string): Promise<ActionResult> {
  if (!(ALL_ROLES as readonly string[]).includes(newRole)) {
    return { error: "유효하지 않은 역할입니다." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 요청자 운영진 권한 확인
  const { data: myMembership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!myMembership || !(STAFF_ROLES as readonly string[]).includes(myMembership.role ?? "")) {
    return { error: "운영진만 역할을 변경할 수 있습니다." };
  }

  // 대상 멤버 조회
  const { data: targetMember } = await supabase
    .from("team_members")
    .select("id, user_id, role")
    .eq("id", targetMemberId)
    .eq("team_id", teamId)
    .single();

  if (!targetMember) {
    return { error: "해당 멤버를 찾을 수 없습니다." };
  }

  // 자기 자신의 역할은 변경 불가
  if (targetMember.user_id === user.id) {
    return { error: "자신의 역할은 변경할 수 없습니다." };
  }

  // 역할 업데이트 (team_id 조건 추가로 RLS 정책 대응, select로 실제 반영 여부 확인)
  const { data: updated, error: updateError } = await supabase
    .from("team_members")
    .update({ role: newRole })
    .eq("id", targetMemberId)
    .eq("team_id", teamId)
    .select("id");

  if (updateError) {
    console.error("역할 변경 오류:", updateError);
    return { error: "역할 변경에 실패했습니다." };
  }

  if (!updated || updated.length === 0) {
    console.error("역할 변경 오류: 업데이트된 행 없음 (RLS 또는 조건 불일치)");
    return { error: "역할 변경에 실패했습니다. 권한을 확인해주세요." };
  }

  revalidatePath("/teams");
  return { success: true };
}

/**
 * 팀 삭제 서버 액션
 * admin만 호출 가능
 */
export async function deleteTeam(teamId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // admin 권한 확인
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return { error: "관리자만 팀을 삭제할 수 있습니다." };
  }

  // 팀 멤버 전체 삭제 (FK 제약 때문에 먼저 삭제)
  const { error: membersDeleteError } = await supabase.from("team_members").delete().eq("team_id", teamId);

  if (membersDeleteError) {
    console.error("팀 멤버 삭제 오류:", membersDeleteError);
    return { error: "팀 삭제에 실패했습니다." };
  }

  // 팀 삭제
  const { error: teamDeleteError } = await supabase.from("teams").delete().eq("id", teamId);

  if (teamDeleteError) {
    console.error("팀 삭제 오류:", teamDeleteError);
    return { error: "팀 삭제에 실패했습니다." };
  }

  revalidatePath("/teams");
  return { success: true };
}
