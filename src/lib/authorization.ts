export type AppRole = "family_member_caregiver" | "professional" | "admin";
export type PersonAccess = "owner" | "caregiver" | "professional" | "viewer";
export type PersonAction =
  | "view"
  | "edit_profile"
  | "write_journal"
  | "complete_task"
  | "recommend"
  | "review"
  | "manage_consent";

const allowed: Record<PersonAccess, PersonAction[]> = {
  owner: ["view", "edit_profile", "write_journal", "complete_task", "manage_consent"],
  caregiver: ["view", "edit_profile", "write_journal", "complete_task"],
  professional: ["view", "recommend", "review"],
  viewer: ["view"],
};

export function canPerformPersonAction(access: PersonAccess | null, action: PersonAction) {
  return access !== null && allowed[access].includes(action);
}

export function assertRole(actual: AppRole, accepted: AppRole[]) {
  if (!accepted.includes(actual))
    throw new Error("Forbidden: role is not permitted for this operation");
}
