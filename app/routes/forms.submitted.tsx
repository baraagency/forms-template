import { primaryButtonClassName } from "@baraagency/components";
import {
  Box,
  Divider,
  Paper,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import {
  buildSubmittedRouterHref,
  isSubmissionDebugEnvironment,
  submissionFormLabels,
} from "../forms/_core/submissionUtils";
import { FormBanner } from "../forms/_core/FormBanner";
import { FormRouterBackLink } from "../forms/_core/formRouterBackLink";
import { SubmissionDebugPanel } from "../forms/submitted/SubmissionDebugPanel";
import { searchParamsFromRequest } from "./formLoaderUtils";
import type { Route } from "./+types/forms.submitted";

type SearchParamValue = string | string[] | undefined;
type SubmittedSearchParams = Record<string, SearchParamValue>;

function getSingleSearchParam(
  searchParams: SubmittedSearchParams,
  key: string,
): string {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function SuccessIcon() {
  return (
    <SvgIcon viewBox="0 0 48 48" sx={{ fontSize: 36 }}>
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="m15 24 6 6 12-13"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </SvgIcon>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  return { searchParams: searchParamsFromRequest(request) };
}

export default function SubmittedPage({ loaderData }: Route.ComponentProps) {
  const resolvedSearchParams = loaderData.searchParams;
  const personId =
    getSingleSearchParam(resolvedSearchParams, "personId") ||
    getSingleSearchParam(resolvedSearchParams, "clientId");
  const agentId = getSingleSearchParam(resolvedSearchParams, "agentId");
  const clientName = getSingleSearchParam(resolvedSearchParams, "clientName");
  const agentName = getSingleSearchParam(resolvedSearchParams, "agentName");
  const address = getSingleSearchParam(resolvedSearchParams, "address");
  const dealId = getSingleSearchParam(resolvedSearchParams, "dealId");
  const sisuTransactionId = getSingleSearchParam(
    resolvedSearchParams,
    "sisuTransactionId",
  );
  const debugKey = getSingleSearchParam(resolvedSearchParams, "debugKey");
  const emailWarning = getSingleSearchParam(resolvedSearchParams, "emailWarning");
  const timeoutWarning = getSingleSearchParam(
    resolvedSearchParams,
    "timeoutWarning",
  );
  const formParam = getSingleSearchParam(resolvedSearchParams, "form");
  const formLabel =
    formParam in submissionFormLabels
      ? submissionFormLabels[formParam as keyof typeof submissionFormLabels]
      : submissionFormLabels.pending;
  const showSubmissionDebug = isSubmissionDebugEnvironment(
    process.env.ENVIRONMENT,
  );
  const routerHref = buildSubmittedRouterHref({
    personId,
  });

  const contextRows = [
    {
      label: "Form",
      value: formLabel,
      caption: "",
    },
    {
      label: "Client",
      value: clientName || "Client not provided",
      caption: personId ? `FUB person ID: ${personId}` : "",
    },
    {
      label: "Agent",
      value: agentName || "Agent not provided",
      caption: agentId ? `FUB user ID: ${agentId}` : "",
    },
    {
      label: "Address",
      value: address || "Address not provided",
      caption: sisuTransactionId
        ? `SISU transaction ID: ${sisuTransactionId}`
        : "",
    },
    {
      label: "FUB Deal",
      value: dealId || "Deal ID not provided",
      caption: "",
    },
  ];

  return (
    <main className="page-form">
      <title>Form Submitted</title>
      <header className="page-header">
        <FormBanner />
      </header>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid var(--divider-color)",
          borderRadius: "var(--card-radius)",
          backgroundColor: "var(--card-bg)",
          boxShadow: "var(--card-shadow)",
          p: { xs: 3, sm: 4 },
        }}
      >
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "var(--success-bg)",
              border: "1px solid rgba(30, 70, 32, 0.18)",
              borderRadius: "999px",
              color: "var(--success-color)",
              display: "inline-flex",
              height: 64,
              justifyContent: "center",
              width: 64,
            }}
          >
            <SuccessIcon />
          </Box>

          <Stack spacing={1.25} sx={{ alignItems: "center" }}>
            <Typography
              component="h1"
              sx={{
                color: "var(--page-title-color)",
                fontSize: { xs: "1.7rem", sm: "2rem" },
                fontWeight: 700,
                letterSpacing: "0.02em",
                lineHeight: 1.15,
                textTransform: "uppercase",
              }}
            >
              {formLabel} Submitted
            </Typography>
            <Typography
              sx={{
                color: "var(--body-color)",
                fontSize: "0.95rem",
                lineHeight: 1.65,
                maxWidth: 560,
              }}
            >
              The form submission finished successfully. In production, Follow Up
              Boss and SISU would be updated here.
            </Typography>
            {timeoutWarning ? (
              <Box
                role="status"
                sx={{
                  bgcolor: "var(--warning-bg)",
                  border: "1px solid rgba(102, 60, 0, 0.18)",
                  borderRadius: "var(--btn-radius)",
                  color: "var(--warning-color)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  lineHeight: 1.65,
                  maxWidth: 560,
                  px: 2,
                  py: 1.5,
                  textAlign: "center",
                  width: "100%",
                }}
              >
                {timeoutWarning}
              </Box>
            ) : null}
            {emailWarning ? (
              <Box
                role="status"
                sx={{
                  bgcolor: "var(--warning-bg)",
                  border: "1px solid rgba(102, 60, 0, 0.18)",
                  borderRadius: "var(--btn-radius)",
                  color: "var(--warning-color)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  lineHeight: 1.65,
                  maxWidth: 560,
                  px: 2,
                  py: 1.5,
                  textAlign: "center",
                  width: "100%",
                }}
              >
                {emailWarning}
              </Box>
            ) : null}
          </Stack>

          <Divider flexItem />
          <Box
            component="dl"
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              m: 0,
              textAlign: "left",
              width: "100%",
            }}
          >
            {contextRows.map((row) => (
              <Box
                key={row.label}
                sx={{
                  border: "1px solid var(--divider-color)",
                  borderRadius: "var(--btn-radius)",
                  p: 1.5,
                }}
              >
                <Typography
                  component="dt"
                  sx={{
                    color: "var(--body-color)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {row.label}
                </Typography>
                <Typography
                  component="dd"
                  sx={{
                    color: "var(--foreground)",
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    m: "4px 0 0",
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.value}
                </Typography>
                {row.caption ? (
                  <Typography
                    sx={{
                      color: "var(--body-color)",
                      fontSize: "0.78rem",
                      lineHeight: 1.4,
                      mt: 0.5,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {row.caption}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Box>

          {showSubmissionDebug ? (
            <SubmissionDebugPanel
              debugKey={debugKey}
              fallbackDealId={dealId}
              fallbackSisuTransactionId={sisuTransactionId}
            />
          ) : null}

          <Stack sx={{ width: "100%" }}>
            <FormRouterBackLink
              href={routerHref}
              className={`app-button-press ${primaryButtonClassName} w-full py-[0.85rem]`}
            />
          </Stack>
        </Stack>
      </Paper>
    </main>
  );
}
