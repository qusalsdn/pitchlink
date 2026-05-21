"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionResult {
  success?: boolean;
  error?: string;
}

/** 프로필 수정 데이터 타입 */
export interface ProfileUpdateData {
  full_name: string;
  phone: string;
  preferred_position: string;
  dominant_foot: string;
  height_cm: number | null;
  weight_kg: number | null;
  skill_level: number | null;
  injury_status: string;
}

/**
 * 내 프로필 정보를 수정하는 서버 액션
 */
export async function updateProfile(data: ProfileUpdateData): Promise<ProfileActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name.trim() || null,
      phone: data.phone.trim() || null,
      preferred_position: data.preferred_position || null,
      dominant_foot: data.dominant_foot || null,
      height_cm: data.height_cm,
      weight_kg: data.weight_kg,
      skill_level: data.skill_level,
      injury_status: data.injury_status || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("프로필 수정 오류:", updateError);
    return { error: "프로필 수정에 실패했습니다." };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true };
}
