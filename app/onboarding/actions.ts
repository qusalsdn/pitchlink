"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface OnboardingResult {
  error?: string;
  success?: boolean;
}

/**
 * 온보딩에서 새 팀을 생성하는 서버 액션
 * 팀 생성 후 자동으로 admin 역할로 team_members에 추가
 */
export async function createTeamOnboarding(formData: FormData): Promise<OnboardingResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name?.trim()) {
    return { error: "팀 이름을 입력해주세요." };
  }

  // 팀 생성
  const { error: teamError } = await supabase
    .from("teams")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (teamError) {
    console.error("팀 생성 오류:", teamError);
    return { error: "팀 생성 중 오류가 발생했습니다. 다시 시도해주세요." };
  }

  revalidatePath("/");
  redirect("/");
}

/**
 * 초대 코드로 팀에 참여하는 서버 액션
 */
export async function joinTeamByCode(formData: FormData): Promise<OnboardingResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const joinCode = formData.get("joinCode") as string;

  if (!joinCode?.trim()) {
    return { error: "초대 코드를 입력해주세요." };
  }

  // 초대 코드로 팀 조회
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("join_code", joinCode.trim().toUpperCase())
    .single();

  if (teamError || !team) {
    return { error: "유효하지 않은 초대 코드입니다. 다시 확인해주세요." };
  }

  // 이미 가입된 팀인지 확인
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    return { error: "이미 해당 팀에 소속되어 있습니다." };
  }

  // 팀 멤버로 추가 (member 역할)
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: user.id,
    role: "member",
  });

  if (memberError) {
    console.error("팀 참여 오류:", memberError);
    return { error: "팀 참여 중 오류가 발생했습니다. 다시 시도해주세요." };
  }

  revalidatePath("/");
  redirect("/");
}
