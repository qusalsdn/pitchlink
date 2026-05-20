"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, Ticket } from "lucide-react";
import { regenerateJoinCode } from "./actions";

interface InviteCodeCardProps {
  teamId: string;
  joinCode: string | null;
  isAdmin: boolean;
}

/**
 * 초대 코드 표시 및 관리 카드
 * - 모든 멤버: 초대 코드 확인 + 복사
 * - 관리자: 초대 코드 재생성
 */
export function InviteCodeCard({ teamId, joinCode, isAdmin }: InviteCodeCardProps) {
  const [code, setCode] = useState(joinCode);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 클립보드에 복사
  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 복사 실패 시 무시
    }
  };

  // 초대 코드 재생성
  const handleRegenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await regenerateJoinCode(teamId);
      if (result.error) {
        setError(result.error);
      } else if (result.joinCode) {
        setCode(result.joinCode);
      }
    });
  };

  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
        <Ticket className="h-3.5 w-3.5 text-green-500" />
        초대 코드
      </h3>
      <Card className="shadow-xs">
        <CardContent className="py-4 px-4">
          {code ? (
            <div className="space-y-3">
              {/* 코드 표시 */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-center">
                  <span className="text-lg font-bold tracking-[0.25em] text-gray-800 select-all">{code}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 h-10 w-10 p-0"
                  aria-label="코드 복사"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                이 코드를 공유하여 새 멤버를 초대하세요.
              </p>

              {/* 관리자: 재생성 버튼 */}
              {isAdmin && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isPending}
                  className="w-full text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
                  {isPending ? "생성 중..." : "코드 재생성"}
                </Button>
              )}

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-400">초대 코드가 아직 없습니다.</p>
              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Ticket className="h-4 w-4 mr-1.5" />
                  {isPending ? "생성 중..." : "초대 코드 생성"}
                </Button>
              )}
              {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
