import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 전체 회비 내역 (로그인 유저 기준)
  const { data: payments } = user
    ? await supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    : { data: null };

  const paidPayments = payments?.filter((p) => p.status === "paid") || [];
  const pendingPayments = payments?.filter((p) => p.status === "pending") || [];

  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 뒤로가기 */}
      <BackButton />

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          회비 관리
        </h1>
        <p className="text-sm text-muted-foreground">납부 현황을 확인하세요</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xl font-bold">{totalPaid.toLocaleString()}원</p>
            <p className="text-xs text-muted-foreground">납부 완료</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xl font-bold">{totalPending.toLocaleString()}원</p>
            <p className="text-xs text-muted-foreground">미납</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭: 전체 / 미납 / 완납 */}
      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            전체
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            미납
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex-1">
            완납
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-3">
          <PaymentList payments={payments || []} />
        </TabsContent>
        <TabsContent value="pending" className="mt-3">
          <PaymentList payments={pendingPayments} />
        </TabsContent>
        <TabsContent value="paid" className="mt-3">
          <PaymentList payments={paidPayments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface Payment {
  id: string;
  amount: number;
  status: string | null;
  payment_type: string | null;
  memo: string | null;
  paid_at: string | null;
  created_at: string | null;
}

function PaymentList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">내역이 없습니다</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2">
      {payments.map((payment) => (
        <Card key={payment.id}>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {payment.status === "paid" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-orange-500" />
                )}
                {payment.amount.toLocaleString()}원
              </CardTitle>
              <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="text-xs">
                {payment.status === "paid" ? "완납" : "미납"}
              </Badge>
            </div>
            <CardDescription className="text-xs flex items-center justify-between">
              <span>
                {payment.payment_type === "membership"
                  ? "월회비"
                  : payment.payment_type === "participation"
                    ? "참가비"
                    : payment.payment_type || "기타"}
                {payment.memo && ` · ${payment.memo}`}
              </span>
              <span>
                {payment.paid_at
                  ? new Date(payment.paid_at).toLocaleDateString("ko-KR")
                  : payment.created_at
                    ? new Date(payment.created_at).toLocaleDateString("ko-KR")
                    : ""}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
