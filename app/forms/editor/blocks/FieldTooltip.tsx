import Tooltip from "@mui/material/Tooltip";
import { Info } from "lucide-react";

/**
 * Info button plus a visually hidden description that inputs reference through
 * aria-describedby. The tooltip text is not hover-only for assistive tech.
 */
export function FieldTooltip({
  id,
  label,
  text,
}: {
  id: string;
  label: string;
  text: string;
}) {
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
      <Tooltip title={text}>
        <button
          type="button"
          aria-label={`About ${label}`}
          aria-describedby={id}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full"
        >
          <Info size={13} aria-hidden="true" />
        </button>
      </Tooltip>
      <span id={id} className="sr-only">
        {text}
      </span>
    </span>
  );
}
