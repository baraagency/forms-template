import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import {
  readSubmittedDebugRecord,
  type SubmittedDebugRecord,
} from "../_core/submissionUtils";

type DebugSection = {
  id: string;
  title: string;
  status: string;
  rows: Array<{ label: string; value: string }>;
  data: unknown;
};

function formatDebugValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    const stringValue = String(value).trim();
    return stringValue || "Not returned";
  }

  return "Not returned";
}

function getRecordId(value: unknown, keys: string[]): string {
  if (typeof value !== "object" || value === null) {
    return "";
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const id = formatDebugValue(record[key]);
    if (id !== "Not returned") {
      return id;
    }
  }

  return "";
}

function formatRawJson(value: unknown): string {
  if (value === undefined) {
    return "Not returned";
  }

  return JSON.stringify(value, null, 2) ?? "Not returned";
}

function buildSections(
  record: SubmittedDebugRecord,
  fallbackDealId: string,
  fallbackSisuTransactionId: string,
): DebugSection[] {
  return [
    {
      id: "fub-deal",
      title: "FUB Deal",
      status: "Created or updated",
      rows: [
        {
          label: "Deal ID",
          value:
            getRecordId(record.deal, ["id", "deal_id", "dealId"]) ||
            fallbackDealId ||
            "Not returned",
        },
        { label: "Stored At", value: record.storedAt || "Not returned" },
      ],
      data: record.deal,
    },
    {
      id: "sisu-transaction",
      title: "SISU Transaction",
      status: "Created or updated",
      rows: [
        {
          label: "Transaction ID",
          value:
            getRecordId(record.transaction, [
              "client_id",
              "transaction_id",
              "id",
            ]) ||
            fallbackSisuTransactionId ||
            "Not returned",
        },
        { label: "Stored At", value: record.storedAt || "Not returned" },
      ],
      data: record.transaction,
    },
  ];
}

function SubmissionDebugDetails({ section }: { section: DebugSection }) {
  return (
    <Box
      component="details"
      sx={{
        borderBottom: "1px solid var(--divider-color)",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Box
        component="summary"
        sx={{
          alignItems: "center",
          cursor: "pointer",
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          listStyle: "none",
          py: 2,
          "&::-webkit-details-marker": { display: "none" },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "var(--foreground)",
              fontSize: "0.94rem",
              fontWeight: 700,
            }}
          >
            {section.title}
          </Typography>
          <Typography
            sx={{
              color: "var(--body-color)",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              mt: 0.5,
              textTransform: "uppercase",
            }}
          >
            {section.status}
          </Typography>
        </Box>
        <Box
          aria-hidden="true"
          sx={{
            alignItems: "center",
            border: "1px solid var(--divider-color)",
            borderRadius: "999px",
            color: "var(--body-color)",
            display: "flex",
            flexShrink: 0,
            fontSize: "1rem",
            height: 28,
            justifyContent: "center",
            width: 28,
          }}
        >
          +
        </Box>
      </Box>
      <Box component="dl" sx={{ display: "grid", gap: 1.5, m: 0, pb: 2 }}>
        {section.rows.map((row) => (
          <Box key={row.label}>
            <Typography
              component="dt"
              sx={{
                color: "var(--body-color)",
                fontSize: "0.7rem",
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
                fontFamily: "monospace",
                fontSize: "0.82rem",
                m: "4px 0 0",
                overflowWrap: "anywhere",
              }}
            >
              {row.value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box
        component="pre"
        sx={{
          bgcolor: "#111827",
          borderRadius: "var(--btn-radius)",
          color: "#f9fafb",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          lineHeight: 1.55,
          maxHeight: 360,
          mb: 2,
          overflow: "auto",
          p: 2,
          whiteSpace: "pre-wrap",
        }}
      >
        {formatRawJson(section.data)}
      </Box>
    </Box>
  );
}

export function SubmissionDebugPanel({
  debugKey,
  fallbackDealId,
  fallbackSisuTransactionId,
}: {
  debugKey: string;
  fallbackDealId: string;
  fallbackSisuTransactionId: string;
}) {
  const [record, setRecord] = useState<SubmittedDebugRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      setRecord(debugKey ? readSubmittedDebugRecord(debugKey) : null);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [debugKey]);

  const sections = useMemo(() => {
    if (!record) {
      return [];
    }

    return buildSections(record, fallbackDealId, fallbackSisuTransactionId);
  }, [fallbackDealId, fallbackSisuTransactionId, record]);

  if (!debugKey) {
    return null;
  }

  return (
    <Box
      component="section"
      aria-labelledby="submission-debug-heading"
      sx={{ textAlign: "left", width: "100%" }}
    >
      <Stack spacing={0.75}>
        <Typography
          id="submission-debug-heading"
          component="h2"
          sx={{
            color: "var(--body-color)",
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Debug Data
        </Typography>
        <Typography
          sx={{ color: "var(--body-color)", fontSize: "0.88rem", lineHeight: 1.5 }}
        >
          Created or updated records from the submission workflow.
        </Typography>
      </Stack>

      <Box
        sx={{
          borderBottom: "1px solid var(--divider-color)",
          borderTop: "1px solid var(--divider-color)",
          mt: 2,
        }}
      >
        {sections.length
          ? sections.map((section) => (
              <SubmissionDebugDetails key={section.id} section={section} />
            ))
          : loaded && (
              <Typography
                sx={{
                  color: "var(--body-color)",
                  fontSize: "0.88rem",
                  py: 2,
                }}
              >
                Debug data is not available for this browser session.
              </Typography>
            )}
      </Box>
    </Box>
  );
}
