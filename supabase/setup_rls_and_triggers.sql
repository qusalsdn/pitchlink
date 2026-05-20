-- =====================================================
-- RLS 정책 및 트리거 함수 설정
-- 한 번에 실행 가능한 SQL 스크립트
-- =====================================================

-- =====================================================
-- 1. 헬퍼 함수: 현재 사용자의 팀 역할 확인
-- =====================================================

-- 특정 팀에서 현재 사용자의 역할 가져오기
CREATE OR REPLACE FUNCTION get_user_team_role(team_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM team_members
    WHERE team_id = team_uuid AND user_id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현재 사용자가 특정 팀의 운영진인지 확인 (admin, manager, coach, chairman)
CREATE OR REPLACE FUNCTION is_team_staff(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid
        AND user_id = auth.uid()
        AND role IN ('admin', 'manager', 'coach', 'chairman')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현재 사용자가 특정 팀의 멤버(운영진 포함)인지 확인
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid
        AND user_id = auth.uid()
        AND role IN ('admin', 'manager', 'coach', 'chairman', 'member')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현재 사용자가 특정 팀의 소속인지 확인 (모든 역할)
CREATE OR REPLACE FUNCTION is_team_any_role(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. 프로필 (profiles) 테이블 RLS
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "프로필 조회" ON profiles;

DROP POLICY IF EXISTS "프로필 생성" ON profiles;

DROP POLICY IF EXISTS "프로필 수정" ON profiles;

DROP POLICY IF EXISTS "프로필 삭제" ON profiles;

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필은 본인만 수정/삭제 가능
CREATE POLICY "프로필 조회" ON profiles FOR SELECT USING (true);

CREATE POLICY "프로필 생성" ON profiles FOR
INSERT
WITH
    CHECK (auth.uid () = id);

CREATE POLICY "프로필 수정" ON profiles FOR
UPDATE USING (auth.uid () = id);

CREATE POLICY "프로필 삭제" ON profiles FOR DELETE USING (auth.uid () = id);

-- =====================================================
-- 3. 팀 (teams) 테이블 RLS
-- =====================================================

DROP POLICY IF EXISTS "팀 조회" ON teams;

DROP POLICY IF EXISTS "팀 생성" ON teams;

DROP POLICY IF EXISTS "팀 수정" ON teams;

DROP POLICY IF EXISTS "팀 삭제" ON teams;

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- 소속된 팀 또는 로그인된 사용자가 join_code로 조회 가능 (초대 코드 가입 지원)
CREATE POLICY "팀 조회" ON teams FOR
SELECT USING (
        is_team_any_role (id)
        OR created_by = auth.uid ()
        OR (
            auth.uid () IS NOT NULL
            AND join_code IS NOT NULL
        )
    );

-- 로그인한 사용자만 팀 생성 가능
CREATE POLICY "팀 생성" ON teams FOR
INSERT
WITH
    CHECK (auth.uid () = created_by);

-- 운영진만 팀 정보 수정 가능
CREATE POLICY "팀 수정" ON teams FOR
UPDATE USING (
    is_team_staff (id)
    OR created_by = auth.uid ()
);

-- 운영진만 팀 삭제 가능
CREATE POLICY "팀 삭제" ON teams FOR DELETE USING (
    is_team_staff (id)
    OR created_by = auth.uid ()
);

-- =====================================================
-- 4. 팀 멤버 (team_members) 테이블 RLS
-- =====================================================

DROP POLICY IF EXISTS "팀멤버 조회" ON team_members;

DROP POLICY IF EXISTS "팀멤버 생성" ON team_members;

DROP POLICY IF EXISTS "팀멤버 수정" ON team_members;

DROP POLICY IF EXISTS "팀멤버 삭제" ON team_members;

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 같은 팀 소속만 멤버 목록 조회 가능
CREATE POLICY "팀멤버 조회" ON team_members FOR
SELECT USING (is_team_any_role (team_id));

-- 운영진만 새 멤버 추가 가능 (단, 본인이 팀 가입은 가능)
CREATE POLICY "팀멤버 생성" ON team_members FOR
INSERT
WITH
    CHECK (
        is_team_staff (team_id)
        OR auth.uid () = user_id
    );

-- 운영진만 역할 수정 가능 (단, 본인은 본인 정보 수정 가능)
CREATE POLICY "팀멤버 수정" ON team_members FOR
UPDATE USING (
    is_team_staff (team_id)
    OR auth.uid () = user_id
);

-- 운영진만 멤버 제거 가능 (단, 본인은 본인 탈퇴 가능)
CREATE POLICY "팀멤버 삭제" ON team_members FOR DELETE USING (
    is_team_staff (team_id)
    OR auth.uid () = user_id
);

-- =====================================================
-- 5. 팀 공지사항 (team_notices) 테이블 RLS
-- =====================================================

DROP POLICY IF EXISTS "공지사항 조회" ON team_notices;

DROP POLICY IF EXISTS "공지사항 생성" ON team_notices;

DROP POLICY IF EXISTS "공지사항 수정" ON team_notices;

DROP POLICY IF EXISTS "공지사항 삭제" ON team_notices;

ALTER TABLE team_notices ENABLE ROW LEVEL SECURITY;

-- 팀 멤버만 공지사항 조회 가능
CREATE POLICY "공지사항 조회" ON team_notices FOR
SELECT USING (is_team_any_role (team_id));

-- 운영진만 공지사항 생성 가능
CREATE POLICY "공지사항 생성" ON team_notices FOR
INSERT
WITH
    CHECK (
        is_team_staff (team_id)
        AND created_by = auth.uid ()
    );

-- 작성자 또는 운영진만 수정 가능
CREATE POLICY "공지사항 수정" ON team_notices FOR
UPDATE USING (
    is_team_staff (team_id)
    AND (
        created_by = auth.uid ()
        OR is_team_staff (team_id)
    )
);

-- 작성자 또는 운영진만 삭제 가능
CREATE POLICY "공지사항 삭제" ON team_notices FOR DELETE USING (
    is_team_staff (team_id)
    AND (
        created_by = auth.uid ()
        OR is_team_staff (team_id)
    )
);

-- =====================================================
-- 6. 경기 (matches) 테이블 RLS
-- =====================================================

DROP POLICY IF EXISTS "경기 조회" ON matches;

DROP POLICY IF EXISTS "경기 생성" ON matches;

DROP POLICY IF EXISTS "경기 수정" ON matches;

DROP POLICY IF EXISTS "경기 삭제" ON matches;

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 팀 멤버만 경기 조회 가능
CREATE POLICY "경기 조회" ON matches FOR
SELECT USING (is_team_any_role (team_id));

-- 운영진만 경기 생성 가능
CREATE POLICY "경기 생성" ON matches FOR
INSERT
WITH
    CHECK (
        is_team_staff (team_id)
        AND created_by = auth.uid ()
    );

-- 작성자 또는 운영진만 수정 가능
CREATE POLICY "경기 수정" ON matches FOR
UPDATE USING (
    is_team_staff (team_id)
    AND (
        created_by = auth.uid ()
        OR is_team_staff (team_id)
    )
);

-- 작성자 또는 운영진만 삭제 가능
CREATE POLICY "경기 삭제" ON matches FOR DELETE USING (
    is_team_staff (team_id)
    AND (
        created_by = auth.uid ()
        OR is_team_staff (team_id)
    )
);

-- =====================================================
-- 7. 출석 (attendance) 테이블 RLS
-- =====================================================

DROP POLICY IF EXISTS "출석 조회" ON attendance;

DROP POLICY IF EXISTS "출석 생성" ON attendance;

DROP POLICY IF EXISTS "출석 수정" ON attendance;

DROP POLICY IF EXISTS "출석 삭제" ON attendance;

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 팀 멤버만 출석 조회 가능 (자신의 출석 포함)
CREATE POLICY "출석 조회" ON attendance FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM matches m
            WHERE
                m.id = attendance.match_id
                AND is_team_any_role (m.team_id)
        )
    );

-- 본인 출석 또는 운영진이 대신 등록 가능
CREATE POLICY "출석 생성" ON attendance FOR
INSERT
WITH
    CHECK (
        auth.uid () = user_id
        OR EXISTS (
            SELECT 1
            FROM matches m
            WHERE
                m.id = attendance.match_id
                AND is_team_staff (m.team_id)
        )
    );

-- 본인 또는 운영진만 수정 가능
CREATE POLICY "출석 수정" ON attendance FOR
UPDATE USING (
    auth.uid () = user_id
    OR EXISTS (
        SELECT 1
        FROM matches m
        WHERE
            m.id = attendance.match_id
            AND is_team_staff (m.team_id)
    )
);

-- 본인 또는 운영진만 삭제 가능
CREATE POLICY "출석 삭제" ON attendance FOR DELETE USING (
    auth.uid () = user_id
    OR EXISTS (
        SELECT 1
        FROM matches m
        WHERE
            m.id = attendance.match_id
            AND is_team_staff (m.team_id)
    )
);

-- =====================================================
-- 8. 경기 댓글 (match_comments) 테이블 RLS
-- =====================================================

DROP POLICY IF EXISTS "경기댓글 조회" ON match_comments;

DROP POLICY IF EXISTS "경기댓글 생성" ON match_comments;

DROP POLICY IF EXISTS "경기댓글 수정" ON match_comments;

DROP POLICY IF EXISTS "경기댓글 삭제" ON match_comments;

ALTER TABLE match_comments ENABLE ROW LEVEL SECURITY;

-- 팀 멤버만 댓글 조회 가능
CREATE POLICY "경기댓글 조회" ON match_comments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM matches m
            WHERE
                m.id = match_comments.match_id
                AND is_team_any_role (m.team_id)
        )
    );

-- 팀 멤버만 댓글 작성 가능
CREATE POLICY "경기댓글 생성" ON match_comments FOR
INSERT
WITH
    CHECK (
        auth.uid () = user_id
        AND EXISTS (
            SELECT 1
            FROM matches m
            WHERE
                m.id = match_comments.match_id
                AND is_team_any_role (m.team_id)
        )
    );

-- 작성자만 수정 가능
CREATE POLICY "경기댓글 수정" ON match_comments FOR
UPDATE USING (auth.uid () = user_id);

-- 작성자 또는 운영진만 삭제 가능
CREATE POLICY "경기댓글 삭제" ON match_comments FOR DELETE USING (
    auth.uid () = user_id
    OR EXISTS (
        SELECT 1
        FROM matches m
        WHERE
            m.id = match_comments.match_id
            AND is_team_staff (m.team_id)
    )
);

-- =====================================================
-- 9. 팀 회비 (team_fees) 테이블 RLS
-- =====================================================

DROP POLICY IF EXISTS "팀회비 조회" ON team_fees;

DROP POLICY IF EXISTS "팀회비 생성" ON team_fees;

DROP POLICY IF EXISTS "팀회비 수정" ON team_fees;

DROP POLICY IF EXISTS "팀회비 삭제" ON team_fees;

ALTER TABLE team_fees ENABLE ROW LEVEL SECURITY;

-- 팀 멤버만 회비 조회 가능
CREATE POLICY "팀회비 조회" ON team_fees FOR
SELECT USING (is_team_any_role (team_id));

-- 운영진만 회비 생성 가능
CREATE POLICY "팀회비 생성" ON team_fees FOR
INSERT
WITH
    CHECK (
        is_team_staff (team_id)
        AND created_by = auth.uid ()
    );

-- 운영진만 회비 수정 가능
CREATE POLICY "팀회비 수정" ON team_fees FOR
UPDATE USING (
    is_team_staff (team_id)
    AND (
        created_by = auth.uid ()
        OR is_team_staff (team_id)
    )
);

-- 운영진만 회비 삭제 가능
CREATE POLICY "팀회비 삭제" ON team_fees FOR DELETE USING (
    is_team_staff (team_id)
    AND (
        created_by = auth.uid ()
        OR is_team_staff (team_id)
    )
);

-- =====================================================
-- 10. 회비 납부 (fee_payments) 테이블 RLS
-- =====================================================

DROP POLICY IF EXISTS "회비납부 조회" ON fee_payments;

DROP POLICY IF EXISTS "회비납부 생성" ON fee_payments;

DROP POLICY IF EXISTS "회비납부 수정" ON fee_payments;

DROP POLICY IF EXISTS "회비납부 삭제" ON fee_payments;

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- 팀 멤버만 납부 내역 조회 가능 (자신의 내역 포함)
CREATE POLICY "회비납부 조회" ON fee_payments FOR
SELECT USING (
        auth.uid () = user_id
        OR EXISTS (
            SELECT 1
            FROM team_fees tf
            WHERE
                tf.id = fee_payments.fee_id
                AND is_team_staff (tf.team_id)
        )
    );

-- 본인 납부 또는 운영진이 대신 등록 가능
CREATE POLICY "회비납부 생성" ON fee_payments FOR
INSERT
WITH
    CHECK (
        auth.uid () = user_id
        OR EXISTS (
            SELECT 1
            FROM team_fees tf
            WHERE
                tf.id = fee_payments.fee_id
                AND is_team_staff (tf.team_id)
        )
    );

-- 본인 또는 운영진만 수정 가능
CREATE POLICY "회비납부 수정" ON fee_payments FOR
UPDATE USING (
    auth.uid () = user_id
    OR EXISTS (
        SELECT 1
        FROM team_fees tf
        WHERE
            tf.id = fee_payments.fee_id
            AND is_team_staff (tf.team_id)
    )
);

-- 본인 또는 운영진만 삭제 가능
CREATE POLICY "회비납부 삭제" ON fee_payments FOR DELETE USING (
    auth.uid () = user_id
    OR EXISTS (
        SELECT 1
        FROM team_fees tf
        WHERE
            tf.id = fee_payments.fee_id
            AND is_team_staff (tf.team_id)
    )
);

-- =====================================================
-- 11. 트리거 함수: updated_at 자동 갱신
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- attendance 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. 트리거 함수: 팀 생성 시 생성자를 자동으로 admin으로 추가
-- =====================================================

CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO team_members (team_id, user_id, role, joined_at)
    VALUES (NEW.id, NEW.created_by, 'admin', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_team_insert ON teams;

CREATE TRIGGER after_team_insert
    AFTER INSERT ON teams
    FOR EACH ROW
    EXECUTE FUNCTION add_creator_as_admin();

-- =====================================================
-- 13. 트리거 함수: 회비 납부 시 납부 일자 자동 설정
-- =====================================================

CREATE OR REPLACE FUNCTION set_paid_at_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND NEW.paid_at IS NULL THEN
        NEW.paid_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_fee_payment_insert ON fee_payments;

CREATE TRIGGER before_fee_payment_insert
    BEFORE INSERT ON fee_payments
    FOR EACH ROW
    EXECUTE FUNCTION set_paid_at_on_payment();

DROP TRIGGER IF EXISTS before_fee_payment_update ON fee_payments;

CREATE TRIGGER before_fee_payment_update
    BEFORE UPDATE ON fee_payments
    FOR EACH ROW
    EXECUTE FUNCTION set_paid_at_on_payment();

-- =====================================================
-- 14. 고유한 팀 가입 코드 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION generate_unique_join_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- 8자리 랜덤 코드 생성 (대문자 + 숫자)
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- 코드 중복 확인
        SELECT EXISTS(SELECT 1 FROM teams WHERE join_code = new_code) INTO code_exists;
        
        -- 중복되지 않으면 반환
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. 트리거 함수: 팀 생성 시 자동으로 가입 코드 생성
-- =====================================================

CREATE OR REPLACE FUNCTION set_team_join_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.join_code IS NULL OR NEW.join_code = '' THEN
        NEW.join_code := generate_unique_join_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_team_insert ON teams;

CREATE TRIGGER before_team_insert
    BEFORE INSERT ON teams
    FOR EACH ROW
    EXECUTE FUNCTION set_team_join_code();

-- =====================================================
-- 16. 트리거 함수: 회원가입 시 자동으로 프로필 생성
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        avatar_url,
        preferred_position,
        dominant_foot,
        height_cm,
        weight_kg,
        skill_level,
        injury_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거 등록 (Supabase Auth 연동)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 17. RLS 정책 강제 적용 (Realtime 구독용)
-- =====================================================

-- Realtime 기능을 위한 publication 설정 (선택사항)
-- ALTER PUBLICATION supabase_realtime ADD TABLE teams;
-- ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
-- ALTER PUBLICATION supabase_realtime ADD TABLE matches;
-- ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
-- ALTER PUBLICATION supabase_realtime ADD TABLE team_notices;
-- ALTER PUBLICATION supabase_realtime ADD TABLE match_comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE team_fees;
-- ALTER PUBLICATION supabase_realtime ADD TABLE fee_payments;

-- =====================================================
-- 18. 완료 메시지
-- =====================================================

SELECT 'RLS 정책 및 트리거 함수 설정이 완료되었습니다.' AS message;