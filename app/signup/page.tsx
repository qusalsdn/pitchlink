"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "이름은 최소 2자 이상이어야 합니다."),
    email: z.string().email("유효한 이메일을 입력해주세요."),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setServerError("이미 사용 중인 이메일입니다.");
      } else {
        setServerError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      return;
    }

    setIsSuccess(true);
    setTimeout(() => router.push("/login"), 3000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">가입 완료!</h2>
          <p className="text-gray-500 text-sm">
            이메일 인증 링크를 발송했습니다.
            <br />
            메일을 확인하고 인증을 완료해주세요.
          </p>
          <p className="text-xs text-gray-400 mt-4">잠시 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <Logo className="mb-8" />

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">회원가입</CardTitle>
            <CardDescription>새 계정을 만들고 팀에 참여하세요.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* 서버 에러 메시지 */}
              {serverError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* 이름 */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">이름</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="홍길동"
                  autoComplete="name"
                  {...register("fullName")}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              {/* 이메일 */}
              <div className="space-y-1.5">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1.5">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="6자 이상 입력"
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 재입력"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>
              <p className="text-sm text-center text-gray-500">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="font-medium text-green-600 hover:underline">
                  로그인
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
