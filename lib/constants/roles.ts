// 운영진 역할 목록
export const STAFF_ROLES = ["admin", "manager", "coach", "chairman"] as const;

// 허용되는 모든 역할
export const ALL_ROLES = ["admin", "manager", "coach", "chairman", "member", "guest"] as const;

// 역할 한글 레이블
export const ROLE_LABEL: Record<string, string> = {
  admin: "총무",
  manager: "감독",
  coach: "코치",
  chairman: "회장",
  member: "회원",
  guest: "게스트",
};

// 역할 옵션 목록 (Select 컴포넌트 등에서 사용)
export const ROLE_OPTIONS = Object.entries(ROLE_LABEL);
