"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface TeamActionResult {
  error?: string;
  joinCode?: string;
}

/**
 * 초대 코드 재생성 서버 액션
 * admin 역할만 호출 가능
 */
export async function regenerateJoinCode(teamId: string): Promise<TeamActionResult> {
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

  const staffRoles = ["admin", "manager", "coach", "chairman"];
  if (!membership || !staffRoles.includes(membership.role ?? "")) {
    return { error: "운영진만 초대 코드를 재생성할 수 있습니다." };
  }

  // 새 초대 코드 생성 (DB 함수 호출)
  const { data: newCode, error: rpcError } = await supabase.rpc("generate_join_code");

  if (rpcError || !newCode) {
    console.error("초대 코드 생성 오류:", rpcError);
    return { error: "초대 코드 생성에 실패했습니다." };
  }

  // 팀에 새 코드 저장
  const { error: updateError } = await supabase.from("teams").update({ join_code: newCode }).eq("id", teamId);

  if (updateError) {
    console.error("초대 코드 업데이트 오류:", updateError);
    return { error: "초대 코드 저장에 실패했습니다." };
  }

  revalidatePath("/teams");
  return { joinCode: newCode };
}
