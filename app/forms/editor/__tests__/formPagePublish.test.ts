import { describe, expect, it } from "bun:test";
import type { TeamFieldCatalog } from "@/app/forms/_core/teamFieldOptions";
import {
  findRemovedPublishedFields,
  resolvePublishedPageOptions,
  type PublishOptionLoaders,
} from "../formPagePublish";
import type { FieldBlockProps, FormPageData } from "../formPageTypes";

const sisuField: FieldBlockProps = {
  id: "transactionType",
  label: "Transaction Type",
  kind: "choice",
  required: true,
  optionSource: "sisu",
  sisuFieldKey: "transactionType",
  options: [{ label: "Old", value: "old" }],
};

const manualField: FieldBlockProps = {
  id: "manual",
  label: "Manual",
  kind: "choice",
  required: false,
  optionSource: "manual",
  options: [{ label: "A", value: "a" }],
};

const catalog: TeamFieldCatalog = {
  transactionType: {
    name: "transactionType",
    label: "Transaction Type",
    type: "dropdown",
    custom: false,
    options: [
      { value: "lease", label: "Lease Listing" },
      { value: "none", label: "None" },
    ],
  },
};

function documentWith(fields: FieldBlockProps[]): FormPageData {
  return {
    content: fields.map((field) => ({ type: "FieldBlock", props: field })),
    root: { props: {} },
  };
}

function loaders(overrides: Partial<PublishOptionLoaders> = {}): PublishOptionLoaders {
  return {
    loadSisuTeamFields: async () => ({ data: catalog, error: null }),
    loadSisuAgents: async () => ({
      data: [{ value: "501", label: "Taylor ISA" }],
      error: null,
    }),
    loadSisuVendors: async () => ({
      data: [{ value: "2001", label: "Sample Mortgage Co" }],
      error: null,
    }),
    loadFubUsers: async () => ({
      data: [{ value: "1", label: "Alex Agent" }],
      error: null,
    }),
    loadFubAppointmentTypes: async () => ({
      data: [{ value: "1", label: "Buyer Consultation" }],
      error: null,
    }),
    ...overrides,
  };
}

describe("resolvePublishedPageOptions", () => {
  it("replaces SISU options and leaves manual options alone", async () => {
    const result = await resolvePublishedPageOptions(
      documentWith([sisuField, manualField]),
      loaders(),
    );

    expect(result.data.content[0].props.options).toEqual([
      { value: "lease", label: "Lease Listing" },
      { value: "none", label: "None" },
    ]);
    expect(result.data.content[1].props.options).toEqual([
      { label: "A", value: "a" },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps the existing snapshot and warns when the catalog fails", async () => {
    const result = await resolvePublishedPageOptions(
      documentWith([sisuField]),
      loaders({
        loadSisuTeamFields: async () => ({ data: null, error: "offline" }),
      }),
    );

    expect(result.data.content[0].props.options).toEqual([
      { label: "Old", value: "old" },
    ]);
    expect(result.warnings[0]).toContain("SISU");
  });

  it("resolves SISU agents, SISU vendors, FUB users, and appointment types", async () => {
    const result = await resolvePublishedPageOptions(
      documentWith([
        {
          id: "assignedIsa",
          label: "Assigned ISA",
          kind: "choice",
          required: true,
          optionSource: "sisuAgents",
          optionFilter: "ISISA",
          options: [],
        },
        {
          id: "mortgageCompany",
          label: "Mortgage Company",
          kind: "choice",
          required: true,
          optionSource: "sisuVendors",
          optionFilter: "mortgageCompany",
          options: [],
        },
        {
          id: "assignedOsa",
          label: "Assigned OSA",
          kind: "choice",
          required: true,
          optionSource: "fubUsers",
          options: [],
        },
        {
          id: "appointmentType",
          label: "Appointment Type",
          kind: "choice",
          required: true,
          optionSource: "fubAppointmentTypes",
          options: [],
        },
      ]),
      loaders(),
    );

    expect(result.data.content.map((block) => block.props.options)).toEqual([
      [{ value: "501", label: "Taylor ISA" }],
      [{ value: "2001", label: "Sample Mortgage Co" }],
      [{ value: "1", label: "Alex Agent" }],
      [{ value: "1", label: "Buyer Consultation" }],
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("warns for every unavailable dynamic source", async () => {
    const failure = async () => ({ data: null, error: "offline" });
    const result = await resolvePublishedPageOptions(
      documentWith([
        sisuField,
        {
          id: "assignedIsa",
          label: "Assigned ISA",
          kind: "choice",
          required: true,
          optionSource: "sisuAgents",
          optionFilter: "ISISA",
          options: [],
        },
        {
          id: "mortgageCompany",
          label: "Mortgage Company",
          kind: "choice",
          required: true,
          optionSource: "sisuVendors",
          optionFilter: "mortgageCompany",
          options: [],
        },
        {
          id: "assignedOsa",
          label: "Assigned OSA",
          kind: "choice",
          required: true,
          optionSource: "fubUsers",
          options: [],
        },
        {
          id: "appointmentType",
          label: "Appointment Type",
          kind: "choice",
          required: true,
          optionSource: "fubAppointmentTypes",
          options: [],
        },
      ]),
      loaders({
        loadSisuTeamFields: failure,
        loadSisuAgents: failure,
        loadSisuVendors: failure,
        loadFubUsers: failure,
        loadFubAppointmentTypes: failure,
      }),
    );

    expect(result.warnings).toHaveLength(5);
  });

  it("finds fields removed since the previous publish", () => {
    const previous = documentWith([
      { ...manualField, id: "oldField", label: "Old Field" },
      { ...manualField, id: "keptField", label: "Kept Field" },
    ]);
    const next = documentWith([
      { ...manualField, id: "keptField", label: "Kept Field" },
    ]);

    expect(
      findRemovedPublishedFields(previous, next).map((field) => field.id),
    ).toEqual(["oldField"]);
  });
});
