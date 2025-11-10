-- 002_add_faq_table.sql : FAQ 테이블 + 인덱스 + 트리거 + RLS
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid,
  question text NOT NULL,
  answer text NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- tags 검색용 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_faqs_tags ON public.faqs USING gin (tags);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public._update_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_faqs_updated_at ON public.faqs;
CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public._update_updated_at();

-- Row-Level Security 설정
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 공개 조회
CREATE POLICY "select_faqs_public" ON public.faqs
  FOR SELECT 
  USING (true);

-- RLS 정책: 인증된 사용자만 INSERT
CREATE POLICY "authenticated_faq_insert" ON public.faqs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS 정책: 인증된 사용자만 UPDATE
CREATE POLICY "authenticated_faq_update" ON public.faqs
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS 정책: 인증된 사용자만 DELETE
CREATE POLICY "authenticated_faq_delete" ON public.faqs
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
