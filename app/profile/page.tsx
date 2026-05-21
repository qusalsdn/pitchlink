import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProfilePageClient from "./ProfilePageClient";

/** 로딩 폴백 */
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

async function ProfilePageInner() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 프로필 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, phone, preferred_position, dominant_foot, height_cm, weight_kg, skill_level, injury_status")
    .eq("id", user.id)
    .single();

  // 소속 팀 조회
  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, teams(id, name)")
    .eq("user_id", user.id);

  return (
    <ProfilePageClient
      profile={{
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        phone: profile?.phone ?? null,
        preferred_position: profile?.preferred_position ?? null,
        dominant_foot: profile?.dominant_foot ?? null,
        height_cm: profile?.height_cm ?? null,
        weight_kg: profile?.weight_kg ?? null,
        skill_level: profile?.skill_level ?? null,
        injury_status: profile?.injury_status ?? null,
      }}
      email={user.email ?? ""}
      memberships={
        (memberships ?? []).map((m) => ({
          role: m.role,
          teams: m.teams as { id: string; name: string } | null,
        }))
      }
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProfilePageInner />
    </Suspense>
  );
}
