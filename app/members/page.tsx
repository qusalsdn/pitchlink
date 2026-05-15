import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: members } = await supabase.from("profiles").select("*").eq("is_active", true).order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 뒤로가기 */}
      <BackButton />

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          멤버
        </h1>
        <p className="text-sm text-muted-foreground">총 {members?.length || 0}명의 멤버</p>
      </div>

      {/* 멤버 목록 */}
      {members && members.length > 0 ? (
        <div className="grid gap-2">
          {members.map((member) => (
            <Link key={member.id} href={`/members/${member.id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.nickname || member.name}
                        {member.jersey_number !== null && (
                          <span className="text-muted-foreground ml-1">#{member.jersey_number}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.position || "포지션 미정"}
                        {member.preferred_foot && ` · ${member.preferred_foot}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === "admin" && (
                      <Badge variant="default" className="text-xs">
                        관리자
                      </Badge>
                    )}
                    {member.skill_rating && (
                      <Badge variant="outline" className="text-xs">
                        ⭐ {member.skill_rating}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">등록된 멤버가 없습니다</CardContent>
        </Card>
      )}
    </div>
  );
}
