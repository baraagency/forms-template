import { loadFixture } from "@/app/api/_mock/loadFixture";
import { fetchLiveFubAppointmentTypes, fetchLiveFubUsers } from "@/app/api/_services/fubLiveClient";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import {
  fetchLiveSisuTeamFields,
  normalizeSisuTeamFieldCatalog,
} from "@/app/api/_services/sisuLiveClient";
import { isSisuApiEnabled } from "@/app/api/_services/sisuApiMode";
import {
  createEmptyFormSubmissionDisplayContext,
  type FormSubmissionDisplayContext,
} from "@/app/forms/_core/formSubmissionDisplayValues";
import { DEFAULT_APPOINTMENT_TYPE_OPTIONS } from "@/app/forms/appointment-set/appointmentSetFormUtils";
import { getClosedSelectOptions } from "@/app/forms/closed/closedTeamFieldOptions";
import { getPendingSelectOptions } from "@/app/forms/pending/pendingTeamFieldOptions";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";
import type { TeamFieldSelectOption } from "@/app/forms/_core/teamFieldOptions";

type VendorFixture = {
  vendors?: Record<string, TeamFieldSelectOption[] | undefined>;
};

function toLabelMap(
  options: readonly TeamFieldSelectOption[],
): Map<string, string> {
  const labels = new Map<string, string>();
  for (const option of options) {
    labels.set(String(option.value), option.label);
  }
  return labels;
}

async function loadTeamFieldCatalog() {
  if (!isSisuApiEnabled()) {
    return {};
  }

  const result = await fetchLiveSisuTeamFields();
  if (result.error || !result.data?.fields) {
    return {};
  }

  return normalizeSisuTeamFieldCatalog(result.data.fields);
}

async function loadFubUserLabels(): Promise<Map<string, string>> {
  if (isFubApiEnabled()) {
    const result = await fetchLiveFubUsers({ limit: 250 });
    if (result.data?.users?.length) {
      return new Map(
        result.data.users.map((user) => [String(user.id), user.name || `User ${user.id}`]),
      );
    }
  }

  const fixture = loadFixture<{ users: Array<{ id: number; name: string }> }>(
    "fub-users.json",
  );
  return new Map(
    fixture.users.map((user) => [String(user.id), user.name || `User ${user.id}`]),
  );
}

async function loadAppointmentTypeLabels(): Promise<Map<string, string>> {
  if (isFubApiEnabled()) {
    const result = await fetchLiveFubAppointmentTypes();
    if (result.data?.length) {
      return new Map(
        result.data.map((type) => [String(type.id), type.name || `Type ${type.id}`]),
      );
    }
  }

  const fixture = loadFixture<{ appointmentTypes: Array<{ id: number; name: string }> }>(
    "fub-appointment-types.json",
  );
  const types =
    fixture.appointmentTypes.length > 0
      ? fixture.appointmentTypes
      : [...DEFAULT_APPOINTMENT_TYPE_OPTIONS];

  return new Map(types.map((type) => [String(type.id), type.name]));
}

function loadSisuIsaLabels(): Map<string, string> {
  const fixture = loadFixture<{
    agents: Array<{ value: string; label: string; isIsa?: boolean }>;
  }>("sisu-team-agents.json");

  return new Map(
    fixture.agents
      .filter((agent) => agent.isIsa !== false)
      .map((agent) => [String(agent.value), agent.label]),
  );
}

function loadVendorLabels(): {
  mortgageCompanyLabels: Map<string, string>;
  attorneyLabels: Map<string, string>;
} {
  const fixture = loadFixture<VendorFixture>("sisu-vendors.json");
  const vendors = fixture.vendors ?? {};

  return {
    mortgageCompanyLabels: toLabelMap(vendors.mortgageCompany ?? []),
    attorneyLabels: toLabelMap(vendors.attorney ?? []),
  };
}

export async function loadFormSubmissionDisplayContext(
  form: SettingsFormKind,
): Promise<FormSubmissionDisplayContext> {
  const base = createEmptyFormSubmissionDisplayContext();
  const teamFields = await loadTeamFieldCatalog();
  const vendorLabels = form === "pending" ? loadVendorLabels() : null;

  return {
    pendingOptions: getPendingSelectOptions(teamFields),
    closedOptions: getClosedSelectOptions(teamFields),
    fubUserLabels: await loadFubUserLabels(),
    sisuIsaLabels: loadSisuIsaLabels(),
    appointmentTypeLabels: await loadAppointmentTypeLabels(),
    mortgageCompanyLabels:
      vendorLabels?.mortgageCompanyLabels ?? base.mortgageCompanyLabels,
    attorneyLabels: vendorLabels?.attorneyLabels ?? base.attorneyLabels,
  };
}
