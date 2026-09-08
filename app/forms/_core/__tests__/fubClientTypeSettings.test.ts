import { describe, expect, it } from "bun:test";
import {
  formSupportsFubClientType,
  normalizeFubClientType,
  pickFubStageForClientType,
  pickFubTagsForClientType,
} from "@/app/forms/_core/fubClientTypeSettings";
import type { FormFubStage, FormFubTag } from "@/app/types/storage";

describe("fubClientTypeSettings", () => {
  it("normalizes buyer and seller client types", () => {
    expect(normalizeFubClientType("buyer")).toBe("Buyer");
    expect(normalizeFubClientType("SELLER")).toBe("Seller");
    expect(normalizeFubClientType("tenant")).toBeNull();
  });

  it("picks client-type-specific stages without cross-type fallback", () => {
    const stages: FormFubStage[] = [
      {
        id: 1,
        form: "appointmentSet",
        target: "deal",
        client_type: "Buyer",
        stage_id: 10,
        stage_name: "Buyer stage",
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        form: "appointmentSet",
        target: "deal",
        client_type: "Seller",
        stage_id: 20,
        stage_name: "Seller stage",
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    expect(pickFubStageForClientType(stages, "deal", "Buyer")?.stage_id).toBe(10);
    expect(pickFubStageForClientType(stages, "deal", "Seller")?.stage_id).toBe(20);
    expect(pickFubStageForClientType(stages, "deal", "Buyer")).not.toEqual(
      pickFubStageForClientType(stages, "deal", "Seller"),
    );
  });

  it("filters tags by client type", () => {
    const tags: FormFubTag[] = [
      {
        id: 1,
        form: "appointmentSet",
        client_type: "Buyer",
        tag: "Buyer lead",
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        form: "appointmentSet",
        client_type: "Seller",
        tag: "Seller lead",
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    expect(pickFubTagsForClientType(tags, "Buyer").map((tag) => tag.tag)).toEqual([
      "Buyer lead",
    ]);
    expect(pickFubTagsForClientType(tags, "Seller").map((tag) => tag.tag)).toEqual([
      "Seller lead",
    ]);
  });

  it("only forms with a Buyer/Seller field support client-type scoping", () => {
    expect(formSupportsFubClientType("pending")).toBe(true);
    expect(formSupportsFubClientType("appointmentSet")).toBe(true);
    expect(formSupportsFubClientType("appointmentMet")).toBe(true);
    expect(formSupportsFubClientType("closed")).toBe(true);
    expect(formSupportsFubClientType("agreementSigned")).toBe(false);
  });

  it("matches a null-client-type stage/tags for forms without a client type (e.g. agreementSigned)", () => {
    const stages: FormFubStage[] = [
      {
        id: 1,
        form: "agreementSigned",
        target: "deal",
        client_type: null,
        stage_id: 30,
        stage_name: "Agreement stage",
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    const tags: FormFubTag[] = [
      {
        id: 1,
        form: "agreementSigned",
        client_type: null,
        tag: "Agreement signed",
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    expect(pickFubStageForClientType(stages, "deal", null)?.stage_id).toBe(30);
    expect(pickFubTagsForClientType(tags, null).map((tag) => tag.tag)).toEqual([
      "Agreement signed",
    ]);
  });
});
