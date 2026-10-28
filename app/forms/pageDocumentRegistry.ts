import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";
import { APPOINTMENT_SET_PAGE_DOCUMENT } from "./appointment-set/appointmentSetPageDocument";
import { APPOINTMENT_MET_PAGE_DOCUMENT } from "./appointment-met/appointmentMetPageDocument";
import { CLOSED_PAGE_DOCUMENT } from "./closed/closedPageDocument";
import { PENDING_PAGE_DOCUMENT } from "./pending/pendingPageDocument";
import type { FormPageData } from "./editor/formPageTypes";

/** Code fallback document per form; also the first-publish seed. */
export function getFormPageFallback(form: SettingsFormKind): FormPageData {
  switch (form) {
    case "appointmentSet":
      return APPOINTMENT_SET_PAGE_DOCUMENT;
    case "appointmentMet":
      return APPOINTMENT_MET_PAGE_DOCUMENT;
    case "closed":
      return CLOSED_PAGE_DOCUMENT;
    case "pending":
      return PENDING_PAGE_DOCUMENT;
  }
}
