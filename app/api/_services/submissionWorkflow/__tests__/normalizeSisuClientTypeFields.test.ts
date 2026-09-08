import { describe, expect, test } from "bun:test";
import { normalizeSisuClientTypeFields } from "../normalizeSisuClientTypeFields";

describe("normalizeSisuClientTypeFields", () => {
  test("maps Buyer label to type_id b", () => {
    expect(
      normalizeSisuClientTypeFields({
        first_name: "Test",
        type_id: "Buyer",
      }),
    ).toEqual({
      first_name: "Test",
      type_id: "b",
    });
  });

  test("maps Seller label to type_id s", () => {
    expect(
      normalizeSisuClientTypeFields({
        type_id: "Seller",
      }),
    ).toEqual({
      type_id: "s",
    });
  });

  test("leaves an already-normalized type_id unchanged", () => {
    expect(normalizeSisuClientTypeFields({ type_id: "b" })).toEqual({
      type_id: "b",
    });
    expect(normalizeSisuClientTypeFields({ type_id: "s" })).toEqual({
      type_id: "s",
    });
  });

  test("leaves unknown type_id values unchanged", () => {
    expect(
      normalizeSisuClientTypeFields({
        type_id: "Investor",
      }),
    ).toEqual({
      type_id: "Investor",
    });
  });

  test("leaves payloads without type_id unchanged", () => {
    expect(
      normalizeSisuClientTypeFields({
        first_name: "Test",
      }),
    ).toEqual({
      first_name: "Test",
    });
  });
});
