"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Pencil, X, Check, Loader2, UserCircle2, Phone, MapPin, Activity, Ruler, Weight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateProfile } from "./actions";
import { ROLE_LABEL } from "@/lib/constants/roles";

/** 프로필 폼 유효성 검사 스키마 — 숫자 필드는 string으로 받아 액션에서 변환 */
const profileSchema = z.object({
  full_name: z.string().max(30, "이름은 30자 이내로 입력해주세요."),
  phone: z.string().max(20, "전화번호는 20자 이내로 입력해주세요."),
  preferred_position: z.string(),
  dominant_foot: z.string(),
  height_cm: z.string(),
  weight_kg: z.string(),
  skill_level: z.string(),
  injury_status: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

/** 포지션 목록 */
const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"];

/** 주발 옵션 */
const DOMINANT_FOOT_OPTIONS = [
  { value: "right", label: "오른발" },
  { value: "left", label: "왼발" },
  { value: "both", label: "양발" },
];

/** 부상 상태 옵션 */
const INJURY_STATUS_OPTIONS = [
  { value: "healthy", label: "정상" },
  { value: "minor", label: "경상" },
  { value: "injured", label: "부상" },
  { value: "recovering", label: "회복 중" },
];

/** 팀 소속 정보 타입 */
interface TeamMembership {
  role: string | null;
  teams: {
    id: string;
    name: string;
  } | null;
}

/** 프로필 정보 타입 */
interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  preferred_position: string | null;
  dominant_foot: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  skill_level: number | null;
  injury_status: string | null;
}

interface ProfilePageClientProps {
  profile: ProfileData;
  email: string;
  memberships: TeamMembership[];
}

export default function ProfilePageClient({ profile, email, memberships }: ProfilePageClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      preferred_position: profile.preferred_position ?? "",
      dominant_foot: profile.dominant_foot ?? "",
      height_cm: profile.height_cm?.toString() ?? "",
      weight_kg: profile.weight_kg?.toString() ?? "",
      skill_level: profile.skill_level?.toString() ?? "",
      injury_status: profile.injury_status ?? "",
    },
  });

  /** 수정 취소 — 원래 값으로 초기화 */
  const handleCancel = () => {
    reset({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      preferred_position: profile.preferred_position ?? "",
      dominant_foot: profile.dominant_foot ?? "",
      height_cm: profile.height_cm?.toString() ?? "",
      weight_kg: profile.weight_kg?.toString() ?? "",
      skill_level: profile.skill_level?.toString() ?? "",
      injury_status: profile.injury_status ?? "",
    });
    setIsEditing(false);
    setErrorMsg(null);
  };

  /** 폼 제출 — string 필드를 숫자로 변환 후 서버 액션 호출 */
  const onSubmit = (values: ProfileFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const result = await updateProfile({
        ...values,
        height_cm: values.height_cm !== "" ? Number(values.height_cm) : null,
        weight_kg: values.weight_kg !== "" ? Number(values.weight_kg) : null,
        skill_level: values.skill_level !== "" ? Number(values.skill_level) : null,
      });
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg("프로필이 저장되었습니다.");
        setIsEditing(false);
      }
    });
  };

  const dominantFootLabel = DOMINANT_FOOT_OPTIONS.find((o) => o.value === profile.dominant_foot)?.label;
  const injuryLabel = INJURY_STATUS_OPTIONS.find((o) => o.value === profile.injury_status)?.label;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1 -ml-1 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-bold text-lg text-gray-900">내 프로필</span>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              수정
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending} className="gap-1">
                <X className="h-3.5 w-3.5" />
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit(onSubmit)}
                disabled={isPending}
                className="gap-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                저장
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* 알림 메시지 */}
        {errorMsg && (
          <Alert variant="destructive">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}
        {successMsg && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* 아바타 + 기본 정보 */}
        <Card className="shadow-xs">
          <CardContent className="py-5 px-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="프로필 사진"
                    className="h-16 w-16 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserCircle2 className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-1">
                    <Input {...register("full_name")} placeholder="이름 입력" className="h-8 text-base font-semibold" />
                    {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
                  </div>
                ) : (
                  <p className="text-base font-semibold text-gray-900 truncate">{profile.full_name ?? "이름 없음"}</p>
                )}
                <p className="text-sm text-gray-500 mt-0.5 truncate">{email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 소속 팀 */}
        {memberships.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">소속 팀</h3>
            <div className="space-y-2">
              {memberships.map((m) => {
                if (!m.teams) return null;
                return (
                  <Card key={m.teams.id} className="shadow-xs">
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{m.teams.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABEL[m.role ?? ""] ?? m.role ?? "멤버"}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* 연락처 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-gray-500" />
            연락처
          </h3>
          <Card className="shadow-xs">
            <CardContent className="py-4 px-4">
              {isEditing ? (
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs text-gray-500">
                    전화번호
                  </Label>
                  <Input id="phone" {...register("phone")} placeholder="010-0000-0000" className="h-9" />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">전화번호</span>
                  <span className="text-sm text-gray-800">{profile.phone ?? "—"}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* 선수 정보 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-gray-500" />
            선수 정보
          </h3>
          <Card className="shadow-xs">
            <CardContent className="py-4 px-4 space-y-4">
              {isEditing ? (
                <>
                  {/* 선호 포지션 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">선호 포지션</Label>
                    <ControlledSelect
                      control={control}
                      name="preferred_position"
                      placeholder="포지션 선택"
                      onValueChange={(v) => setValue("preferred_position", v)}
                    >
                      {POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </ControlledSelect>
                  </div>

                  {/* 주발 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">주발</Label>
                    <ControlledSelect
                      control={control}
                      name="dominant_foot"
                      placeholder="주발 선택"
                      onValueChange={(v) => setValue("dominant_foot", v)}
                    >
                      {DOMINANT_FOOT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </ControlledSelect>
                  </div>

                  {/* 키 / 몸무게 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">키 (cm)</Label>
                      <Input type="number" {...register("height_cm")} placeholder="170" className="h-9" />
                      {errors.height_cm && <p className="text-xs text-red-500">{errors.height_cm.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">몸무게 (kg)</Label>
                      <Input type="number" {...register("weight_kg")} placeholder="70" className="h-9" />
                      {errors.weight_kg && <p className="text-xs text-red-500">{errors.weight_kg.message}</p>}
                    </div>
                  </div>

                  {/* 실력 수준 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">실력 수준 (1~5)</Label>
                    <ControlledSelect
                      control={control}
                      name="skill_level"
                      placeholder="실력 선택"
                      onValueChange={(v) => setValue("skill_level", v)}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {"★".repeat(n)}
                          {"☆".repeat(5 - n)} ({n}점)
                        </SelectItem>
                      ))}
                    </ControlledSelect>
                  </div>

                  {/* 부상 상태 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">부상 상태</Label>
                    <ControlledSelect
                      control={control}
                      name="injury_status"
                      placeholder="상태 선택"
                      onValueChange={(v) => setValue("injury_status", v)}
                    >
                      {INJURY_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </ControlledSelect>
                  </div>
                </>
              ) : (
                <dl className="space-y-3">
                  <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="포지션" value={profile.preferred_position ?? "—"} />
                  <InfoRow icon={null} label="주발" value={dominantFootLabel ?? profile.dominant_foot ?? "—"} />
                  <InfoRow
                    icon={<Ruler className="h-3.5 w-3.5" />}
                    label="키"
                    value={profile.height_cm ? `${profile.height_cm} cm` : "—"}
                  />
                  <InfoRow
                    icon={<Weight className="h-3.5 w-3.5" />}
                    label="몸무게"
                    value={profile.weight_kg ? `${profile.weight_kg} kg` : "—"}
                  />
                  <InfoRow
                    icon={<Star className="h-3.5 w-3.5" />}
                    label="실력"
                    value={
                      profile.skill_level
                        ? `${"★".repeat(profile.skill_level)}${"☆".repeat(5 - profile.skill_level)} (${profile.skill_level}점)`
                        : "—"
                    }
                  />
                  <InfoRow
                    icon={<Activity className="h-3.5 w-3.5" />}
                    label="부상 상태"
                    value={injuryLabel ?? profile.injury_status ?? "—"}
                  />
                </dl>
              )}
            </CardContent>
          </Card>
        </section>

        <div className="pb-8" />
      </main>
    </div>
  );
}

/** 정보 행 표시용 헬퍼 컴포넌트 */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 w-4 flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

/**
 * useWatch 기반의 controlled Select 컴포넌트
 * — React Compiler memoization 경고 없이 watch 값을 안전하게 사용
 */
function ControlledSelect({
  control,
  name,
  placeholder,
  onValueChange,
  children,
}: {
  control: Control<ProfileFormValues>;
  name: keyof ProfileFormValues;
  placeholder: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const value = useWatch({ control, name }) as string;
  return (
    <Select value={value ?? ""} onValueChange={onValueChange}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
