import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("forms", "routes/forms._index.tsx"),
  route("forms/settings", "routes/forms.settings.tsx"),
  route("forms/pending", "routes/forms.pending.tsx"),
  route("forms/appointment-set", "routes/forms.appointment-set.tsx"),
  route("forms/appointment-met", "routes/forms.appointment-met.tsx"),
  route("forms/closed", "routes/forms.closed.tsx"),
  route("forms/submitted", "routes/forms.submitted.tsx"),

  // FUB
  route("api/fub/context", "api/fub/context/route.ts"),
  route("api/fub/users", "api/fub/users/route.ts"),
  route("api/fub/appointment-types", "api/fub/appointment-types/route.ts"),
  route("api/fub/stages", "api/fub/stages/route.ts"),
  route("api/fub/tags", "api/fub/tags/route.ts"),
  route("api/fub/pipelines", "api/fub/pipelines/route.ts"),
  route("api/fub/people", "api/fub/people/route.ts"),
  route("api/fub/people/:personId", "api/fub/people/[personId]/route.ts"),
  route("api/fub/deals", "api/fub/deals/route.ts"),

  // SISU
  route("api/sisu/team-agents", "api/sisu/team-agents/route.ts"),
  route("api/sisu/team-fields", "api/sisu/team-fields/route.ts"),
  route("api/sisu/vendors", "api/sisu/vendors/route.ts"),
  route(
    "api/sisu/transactions/:transactionId",
    "api/sisu/transactions/[transactionId]/route.ts",
  ),
  route(
    "api/sisu/transactions/by-fub-deal",
    "api/sisu/transactions/by-fub-deal/route.ts",
  ),

  // Form submits
  route("api/forms/pending/submit", "api/forms/pending/submit/route.ts"),
  route(
    "api/forms/appointment-set/submit",
    "api/forms/appointment-set/submit/route.ts",
  ),
  route(
    "api/forms/appointment-met/submit",
    "api/forms/appointment-met/submit/route.ts",
  ),
  route("api/forms/closed/submit", "api/forms/closed/submit/route.ts"),

  // Settings
  route("api/forms/settings/auth", "api/forms/settings/auth/route.ts"),
  route("api/forms/settings/gmail", "api/forms/settings/gmail/route.ts"),
  route(
    "api/forms/settings/gmail/oauth/start",
    "api/forms/settings/gmail/oauth/start/route.ts",
  ),
  route(
    "api/forms/settings/gmail/oauth/callback",
    "api/forms/settings/gmail/oauth/callback/route.ts",
  ),
  route(
    "api/forms/settings/gmail/disconnect",
    "api/forms/settings/gmail/disconnect/route.ts",
  ),
  route(
    "api/forms/settings/recipients",
    "api/forms/settings/recipients/route.ts",
  ),
  route(
    "api/forms/settings/recipients/:recipientId",
    "api/forms/settings/recipients/[recipientId]/route.ts",
  ),
  route(
    "api/forms/settings/router-forms",
    "api/forms/settings/router-forms/route.ts",
  ),
  route(
    "api/forms/settings/router-forms/:slug",
    "api/forms/settings/router-forms/[slug]/route.ts",
  ),
  route(
    "api/forms/settings/sisu-mappings",
    "api/forms/settings/sisu-mappings/route.ts",
  ),
  route(
    "api/forms/settings/sisu-mappings/:id",
    "api/forms/settings/sisu-mappings/[id]/route.ts",
  ),
  route(
    "api/forms/settings/fub/stages",
    "api/forms/settings/fub/stages/route.ts",
  ),
  route(
    "api/forms/settings/fub/stages/:id",
    "api/forms/settings/fub/stages/[id]/route.ts",
  ),
  route("api/forms/settings/fub/tags", "api/forms/settings/fub/tags/route.ts"),
  route(
    "api/forms/settings/fub/tags/:id",
    "api/forms/settings/fub/tags/[id]/route.ts",
  ),
  route(
    "api/forms/settings/fub/person-mappings",
    "api/forms/settings/fub/person-mappings/route.ts",
  ),
  route(
    "api/forms/settings/fub/person-mappings/:id",
    "api/forms/settings/fub/person-mappings/[id]/route.ts",
  ),
  route(
    "api/forms/settings/fub/deal-mappings",
    "api/forms/settings/fub/deal-mappings/route.ts",
  ),
  route(
    "api/forms/settings/fub/deal-mappings/:id",
    "api/forms/settings/fub/deal-mappings/[id]/route.ts",
  ),
] satisfies RouteConfig;
