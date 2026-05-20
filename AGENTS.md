- 해당 프로젝트는 축구회를 관리하기 위한 웹 애플리케이션입니다.
- 웹 프로젝트지만 모바일 환경에 최적화되어야 하고, PWA로 제작되어야 합니다.

1. 타입스크립트를 사용합니다.
2. Tailwind CSS + shadcn/ui를 사용합니다.
3. 폼은 Zod + React Hook Form 조합으로 작성합니다.
4. 백엔드 및 데이터베이스는 Supabase를 사용하고 types/supabase.ts를 참고하여 연동합니다.
5. 인증은 Supabase Auth를 사용합니다.
6. 로그인/회원가입은 Supabase Auth를 사용합니다.
7. team_members 테이블의 role 컬럼에 admin, manager, coach, chairman, member, guest 중 하나가 저장됩니다.
8. 운영진은 admin, manager, coach, chairman 중 하나입니다.
9. member는 team_members 테이블의 role 컬럼에 member가 저장됩니다.
10. guest는 team_members 테이블의 role 컬럼에 guest가 저장됩니다.
