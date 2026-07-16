import { describe, expect, it } from "vitest";
import { parseDraft } from "./onboarding-draft";

describe("onboarding draft parser", () => {
  it("rejects malformed and unknown versions", () => {
    expect(parseDraft("{broken")).toBeNull();
    expect(parseDraft(JSON.stringify({ version: 2, step: 1, data: {} }))).toBeNull();
  });

  it("sanitizes restored data and allowlists catalog values", () => {
    const draft = parseDraft(JSON.stringify({
      version: 1,
      step: 3,
      data: {
        displayName: "<b>Adit</b>",
        birthYear: "20x20",
        relationship: "attacker",
        supportNeeds: ["communication", "unknown"],
        communication: ["visual_support", "unknown"],
        accessibility: ["reduced_noise"],
        primaryLanguage: "unknown",
        notes: "<script>bad()</script>Catatan",
      },
    }));
    expect(draft).toMatchObject({
      step: 3,
      data: {
        displayName: "Adit",
        birthYear: "2020",
        relationship: "",
        supportNeeds: ["communication"],
        communication: ["visual_support"],
        accessibility: ["reduced_noise"],
        primaryLanguage: "id",
        notes: "Catatan",
      },
    });
  });
});
