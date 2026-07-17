-- Production hardening: validate stored data, enforce parent ownership, and
-- provide a distributed/atomic rate limiter for server functions.

ALTER TABLE public.person_profiles
  ADD CONSTRAINT person_profiles_display_name_length CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 80),
  ADD CONSTRAINT person_profiles_age_range CHECK (age IS NULL OR age BETWEEN 0 AND 120),
  ADD CONSTRAINT person_profiles_summary_length CHECK (char_length(support_summary) <= 1000),
  ADD CONSTRAINT person_profiles_support_needs_count CHECK (cardinality(support_needs) <= 20),
  ADD CONSTRAINT person_profiles_emergency_name_length CHECK (char_length(emergency_contact_name) <= 120),
  ADD CONSTRAINT person_profiles_emergency_phone_length CHECK (char_length(emergency_contact_phone) <= 40);

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_content_length CHECK (char_length(btrim(content)) BETWEEN 1 AND 8000);

ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_entries_content_length CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000),
  ADD CONSTRAINT journal_entries_mood_tag_allowed CHECK (
    mood_tag IS NULL OR mood_tag IN ('Tenang', 'Bersemangat', 'Lelah', 'Kesulitan', 'Bangga')
  );

ALTER TABLE public.roadmap_items
  ADD CONSTRAINT roadmap_items_title_length CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  ADD CONSTRAINT roadmap_items_description_length CHECK (description IS NULL OR char_length(description) <= 1000);

CREATE UNIQUE INDEX person_profiles_one_active_per_owner
  ON public.person_profiles(owner_id) WHERE active;

DROP POLICY "own roadmaps" ON public.roadmaps;
CREATE POLICY "own roadmaps" ON public.roadmaps FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (
    auth.uid() = owner_id AND EXISTS (
      SELECT 1 FROM public.person_profiles p
      WHERE p.id = person_profile_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY "own roadmap_items" ON public.roadmap_items;
CREATE POLICY "own roadmap_items" ON public.roadmap_items FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (
    auth.uid() = owner_id AND EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.owner_id = auth.uid()
    )
  );

DROP POLICY "own chat_messages" ON public.chat_messages;
CREATE POLICY "own chat_messages" ON public.chat_messages FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (
    auth.uid() = owner_id AND (
      person_profile_id IS NULL OR EXISTS (
        SELECT 1 FROM public.person_profiles p
        WHERE p.id = person_profile_id AND p.owner_id = auth.uid()
      )
    )
  );

DROP POLICY "own journal_entries" ON public.journal_entries;
CREATE POLICY "own journal_entries" ON public.journal_entries FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (
    auth.uid() = owner_id AND EXISTS (
      SELECT 1 FROM public.person_profiles p
      WHERE p.id = person_profile_id AND p.owner_id = auth.uid()
    )
  );

CREATE TABLE public.app_rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (user_id, action, window_start)
);
ALTER TABLE public.app_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_app_rate_limit(p_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_window_seconds integer;
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN RETURN false; END IF;

  SELECT max_requests, window_seconds INTO v_limit, v_window_seconds
  FROM (VALUES
    ('chat', 20, 3600),
    ('roadmap', 5, 86400),
    ('journal', 30, 3600),
    ('profile', 20, 3600),
    ('aid', 30, 3600)
  ) AS limits(action, max_requests, window_seconds)
  WHERE action = p_action;

  IF v_limit IS NULL THEN RETURN false; END IF;
  v_window_start := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / v_window_seconds) * v_window_seconds
  );

  INSERT INTO public.app_rate_limits(user_id, action, window_start, request_count)
  VALUES (v_user_id, p_action, v_window_start, 1)
  ON CONFLICT (user_id, action, window_start) DO UPDATE
    SET request_count = app_rate_limits.request_count + 1
    WHERE app_rate_limits.request_count < v_limit
  RETURNING request_count INTO v_count;

  DELETE FROM public.app_rate_limits
  WHERE user_id = v_user_id AND window_start < clock_timestamp() - interval '2 days';
  RETURN v_count IS NOT NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_app_rate_limit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_app_rate_limit(text) TO authenticated;
