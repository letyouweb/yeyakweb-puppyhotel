-- Enable pgcrypto for gen_random_uuid (id default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_faqs_updated_at ON public.faqs;
CREATE TRIGGER trg_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_faqs_site_active_order
  ON public.faqs (site_id, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_faqs_tags_gin
  ON public.faqs USING gin(tags);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faqs_select_active_public" ON public.faqs;
CREATE POLICY "faqs_select_active_public"
  ON public.faqs
  FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "faqs_write_authenticated" ON public.faqs;
CREATE POLICY "faqs_write_authenticated"
  ON public.faqs
  FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);
