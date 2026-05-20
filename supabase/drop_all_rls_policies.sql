-- =====================================================
-- 모든 RLS 정책, 트리거 및 헬퍼 함수 삭제 스크립트
-- 이름과 관계없이 모든 정책과 트리거를 동적으로 삭제합니다.
-- =====================================================

-- =====================================================
-- 1. 모든 정책 동적 삭제를 위한 헬퍼 함수
-- =====================================================
CREATE OR REPLACE FUNCTION drop_all_policies_for_table(table_name text)
RETURNS void AS $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = table_name
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. 모든 테이블의 모든 정책 삭제 (이름과 관계없이)
-- =====================================================
SELECT drop_all_policies_for_table ('profiles');

SELECT drop_all_policies_for_table ('teams');

SELECT drop_all_policies_for_table ('team_members');

SELECT drop_all_policies_for_table ('matches');

SELECT drop_all_policies_for_table ('attendance');

SELECT drop_all_policies_for_table ('team_fees');

SELECT drop_all_policies_for_table ('fee_payments');

SELECT drop_all_policies_for_table ('team_notices');

SELECT drop_all_policies_for_table ('match_comments');

-- =====================================================
-- 3. 모든 테이블 RLS 비활성화
-- =====================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

ALTER TABLE matches DISABLE ROW LEVEL SECURITY;

ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

ALTER TABLE team_fees DISABLE ROW LEVEL SECURITY;

ALTER TABLE fee_payments DISABLE ROW LEVEL SECURITY;

ALTER TABLE team_notices DISABLE ROW LEVEL SECURITY;

ALTER TABLE match_comments DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. 헬퍼 함수 삭제 (정책 삭제 후 삭제)
-- =====================================================
DROP FUNCTION IF EXISTS drop_all_policies_for_table (text);

DROP FUNCTION IF EXISTS get_user_team_role (UUID);

DROP FUNCTION IF EXISTS is_team_member (UUID);

DROP FUNCTION IF EXISTS is_team_staff (UUID);

DROP FUNCTION IF EXISTS is_team_admin (UUID);

DROP FUNCTION IF EXISTS is_team_any_role (UUID);

-- =====================================================
-- 5. 모든 트리거 동적 삭제를 위한 헬퍼 함수
-- =====================================================
CREATE OR REPLACE FUNCTION drop_all_triggers_for_table(table_name text)
RETURNS void AS $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
        AND event_object_table = table_name
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_record.trigger_name, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. 모든 테이블의 모든 트리거 동적 삭제
-- =====================================================
SELECT drop_all_triggers_for_table ('profiles');

SELECT drop_all_triggers_for_table ('teams');

SELECT drop_all_triggers_for_table ('team_members');

SELECT drop_all_triggers_for_table ('matches');

SELECT drop_all_triggers_for_table ('attendance');

SELECT drop_all_triggers_for_table ('team_fees');

SELECT drop_all_triggers_for_table ('fee_payments');

SELECT drop_all_triggers_for_table ('team_notices');

SELECT drop_all_triggers_for_table ('match_comments');

-- =====================================================
-- 7. 특정 트리거 함수 직접 삭제 (동적 삭제 전에 실행)
-- =====================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;

DROP TRIGGER IF EXISTS after_team_insert ON teams;

DROP TRIGGER IF EXISTS before_fee_payment_insert ON fee_payments;

DROP TRIGGER IF EXISTS before_fee_payment_update ON fee_payments;

DROP TRIGGER IF EXISTS before_team_insert ON teams;

-- =====================================================
-- 8. 모든 트리거 함수 동적 삭제 (public 스키마의 트리거 함수만)
-- =====================================================
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.proname AS function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        LEFT JOIN pg_trigger t ON p.oid = t.tgfoid
        WHERE n.nspname = 'public'
        AND (
            p.prorettype = 'trigger'::regtype::oid
            OR t.tgname IS NOT NULL
        )
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I() CASCADE', func_record.function_name);
    END LOOP;
END $$;

-- =====================================================
-- 9. 트리거 삭제용 헬퍼 함수 정리
-- =====================================================
DROP FUNCTION IF EXISTS drop_all_triggers_for_table (text);