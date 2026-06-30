import { describe, expect, it } from "bun:test";
import {
  buildFormRouterReturnUrl,
  buildFormRouterReturnUrlFromSearchParams,
  buildFormRouteUrl,
  filterDealsForForm,
  getContextBadge,
  getDealLabel,
  getDealSisuTransactionId,
  getDealStageLabel,
  getDealTypeLabel,
  getPersonLabel,
  hasFubContext,
  mapFubUserToAgentOption,
  parseFormRouterQuery,
  parsePositiveInteger,
} from "../_core/formRouterUtils";

describe("parsePositiveInteger", () => {
  it("returns a positive integer for numeric values only", () => {
    expect(parsePositiveInteger("42")).toBe(42);
    expect(parsePositiveInteger("0")).toBeNull();
    expect(parsePositiveInteger("-1")).toBeNull();
    expect(parsePositiveInteger("3.14")).toBeNull();
    expect(parsePositiveInteger("abc")).toBeNull();
    expect(parsePositiveInteger(null)).toBeNull();
  });
});

describe("parseFormRouterQuery", () => {
  it("prefers personId while accepting clientId fallback", () => {
    expect(parseFormRouterQuery("?personId=123&clientId=456").personId).toBe("123");
    expect(parseFormRouterQuery("?clientId=456").personId).toBe("456");
  });

  it("reads signed embedded context parameters", () => {
    expect(parseFormRouterQuery("?context=abc&signature=def")).toEqual({
      personId: null,
      agentId: null,
      context: "abc",
      signature: "def",
    });
  });
});

describe("buildFormRouteUrl", () => {
  it("preserves selected lead context for form handoff", () => {
    const url = buildFormRouteUrl("/forms/pending", {
      clientId: 123,
      agentId: 456,
      clientName: "Jane Client",
      agentName: "Alex Agent",
      dealId: "789",
      sisuTransactionId: "4567",
    });

    expect(url).toBe(
      "/forms/pending?clientId=123&agentId=456&agentName=Alex+Agent&clientName=Jane+Client&dealId=789&sisuTransactionId=4567",
    );
  });
});

describe("filterDealsForForm", () => {
  const deals = [
    { id: 1, name: "Closed", status: "Archived", stageName: "Closed" },
    { id: 2, name: "Lost", status: "Active", stageName: "Lost" },
    { id: 3, name: "Active", status: "Active", stageName: "Pending" },
  ];

  it("excludes closed and lost deals", () => {
    expect(filterDealsForForm(deals).map((deal) => deal.id)).toEqual([3]);
  });
});

describe("getDealSisuTransactionId", () => {
  it("reads known SISU id fields from a FUB deal", () => {
    expect(getDealSisuTransactionId({ id: 1, customSisuTransactionId: "123" })).toBe(
      "123",
    );
    expect(getDealSisuTransactionId({ id: 2, customSISUID: 456 })).toBe("456");
    expect(getDealSisuTransactionId({ id: 3 })).toBeNull();
  });
});

describe("getContextBadge", () => {
  it("prefers the raw query person id before embedded context id", () => {
    expect(getContextBadge("99", 123)).toBe("clientId: 99");
  });
});

describe("mapFubUserToAgentOption", () => {
  it("uses display name when present", () => {
    expect(
      mapFubUserToAgentOption({
        id: "7",
        firstName: "Ada",
        lastName: "Lovelace",
      }),
    ).toEqual({ id: 7, name: "Ada Lovelace" });
  });
});

describe("getPersonLabel", () => {
  it("returns a full name when available", () => {
    expect(getPersonLabel({ id: "12", firstName: "Jane", lastName: "Client" })).toBe(
      "Jane Client",
    );
  });
});

describe("getDealLabel", () => {
  it("returns useful deal labels for named and unnamed deals", () => {
    expect(getDealLabel({ id: 101, name: "123 Main St" })).toBe("123 Main St");
    expect(getDealLabel({ id: 102, status: "Active" })).toBe("Deal #102 - Active");
  });
});

describe("getDealStageLabel", () => {
  it("prefers stage name before falling back to stage id", () => {
    expect(getDealStageLabel({ id: 101, stageName: "Closed", stageId: 186 })).toBe(
      "Closed",
    );
  });
});

describe("getDealTypeLabel", () => {
  it("uses seller pipeline id as the strongest seller signal", () => {
    expect(getDealTypeLabel({ id: 1, pipelineId: 17, stageName: "Buyer Pending" })).toBe(
      "Seller",
    );
  });
});

describe("buildFormRouterReturnUrlFromSearchParams", () => {
  it("rebuilds the router URL from routed form search params", () => {
    expect(
      buildFormRouterReturnUrlFromSearchParams(
        {
          clientId: "218562",
          agentId: "456",
          context: "embedded-context",
          signature: "signed",
        },
        { personId: "999" },
      ),
    ).toBe("/forms?clientId=999&context=embedded-context&signature=signed");
  });
});

describe("hasFubContext", () => {
  it("treats signed query context or decoded FUB context as FUB context", () => {
    expect(hasFubContext({ context: "abc", signature: "def" }, null)).toBe(true);
    expect(hasFubContext({ context: null, signature: null }, { fubPersonId: 218562 })).toBe(
      true,
    );
  });
});

describe("buildFormRouterReturnUrl", () => {
  it("returns only the clientId parameter for form router links", () => {
    expect(buildFormRouterReturnUrl("218562")).toBe("/forms?clientId=218562");
  });
});
