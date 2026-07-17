/**
 * Future roles architecture (documented for pitch, not implemented in MVP).
 *
 * MVP hanya membangun role Family Member / Caregiver. Skema di bawah menunjukkan
 * bagaimana produk akan berskala tanpa perubahan besar pada tabel-tabel yang
 * sudah ada:
 *
 *   CREATE TYPE public.app_role AS ENUM ('family_member','professional','admin');
 *
 *   CREATE TABLE public.user_roles (
 *     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *     role public.app_role NOT NULL,
 *     profession text,               -- diisi bila role = professional
 *     verified boolean DEFAULT false,
 *     UNIQUE (user_id, role)
 *   );
 *
 *   -- Akses professional selalu diberikan via undangan keluarga (grant),
 *   -- tidak pernah self-assigned.
 *   CREATE TABLE public.profile_access_grants (
 *     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     person_profile_id uuid REFERENCES public.person_profiles(id),
 *     granted_to_user_id uuid REFERENCES auth.users(id),
 *     scope text NOT NULL,           -- 'read_roadmap' | 'read_journal' | ...
 *     revoked_at timestamptz
 *   );
 *
 * Kebijakan RLS: has_role() function + join ke profile_access_grants menentukan
 * apakah non-owner dapat membaca data Person Profile tertentu.
 */
export const FUTURE_ROLES_NOTE = "Family Member (MVP) · Professional (planned) · Admin (planned)";
