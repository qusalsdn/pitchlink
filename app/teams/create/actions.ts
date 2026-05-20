"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface CreateTeamResult {
  error?: string;
  success?: boolean;
}

export async function createTeam(formData: FormData): Promise<CreateTeamResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

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
