import { describe, expect, test } from "bun:test";
import { normalizeSisuClientTypeFields } from "../normalizeSisuClientTypeFields";

describe("normalizeSisuClientTypeFields", () => {
  test("maps Buyer label to client_type 0 and type_id b", () => {
    expect(
      normalizeSisuClientTypeFields({
        first_name: "Test",
        client_type: "Buyer",
      }),
    ).toEqual({
      first_name: "Test",
      client_type: "0",
      type_id: "b",
    });
  });

  test("maps Seller label to client_type 1 and type_id s", () => {
    expect(
      normalizeSisuClientTypeFields({
        client_type: "Seller",
      }),
    ).toEqual({
      client_type: "1",
      type_id: "s",
    });
  });

  test("leaves unknown client_type unchanged", () => {
    expect(
      normalizeSisuClientTypeFields({
        client_type: "Investor",
      }),
    ).toEqual({
      client_type: "Investor",
    });
  });
});
