"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/BackButton";

const loginSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<LoginFormData>({
    // @ts-expect-error Zod v4 타입 호환성 문제
    resolver: zodResolver(loginSchema),
  });
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = form;

  const handleLogin = async (data: LoginFormData) => {
    clearErrors("root");

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleSignUp = async () => {
    const values = getValues();

    if (!values.email || !values.password) {
      setError("root", { message: "이메일과 비밀번호를 입력해주세요" });
      return;
    }

    clearErrors("root");

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    setError("root", { message: "확인 이메일을 전송했습니다. 이메일을 확인해주세요." });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-4">
        <BackButton />
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">⚽ PitchLink</CardTitle>
            <CardDescription>동호회 계정으로 로그인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Input {...register("email")} type="email" placeholder="이메일" aria-invalid={!!errors.email} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Input {...register("password")} type="password" placeholder="비밀번호" aria-invalid={!!errors.password} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              {errors.root && <p className="text-sm text-destructive text-center">{errors.root.message}</p>}

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "로딩..." : "로그인"}
                </Button>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleSignUp} className="w-full">
                  회원가입
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
