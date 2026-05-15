import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, profiles(name, nickname)")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 뒤로가기 */}
      <BackButton />

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          공지사항
        </h1>
        <p className="text-sm text-muted-foreground">클럽 소식을 확인하세요</p>
      </div>

      {/* 공지 목록 */}
      {announcements && announcements.length > 0 ? (
        <div className="grid gap-3">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {announcement.is_pinned && (
                    <Badge variant="destructive" className="text-xs">
                      고정
                    </Badge>
                  )}
                  <CardTitle className="text-base">{announcement.title}</CardTitle>
                </div>
                <CardDescription className="text-xs flex items-center justify-between">
                  <span>
                    {(announcement.profiles as { nickname: string | null; name: string })?.nickname ||
                      (announcement.profiles as { name: string })?.name ||
                      "관리자"}
                  </span>
                  <span>
                    {announcement.created_at &&
                      new Date(announcement.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">등록된 공지사항이 없습니다</CardContent>
        </Card>
      )}
    </div>
  );
}
