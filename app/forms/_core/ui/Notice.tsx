import type { ReactNode } from "react";
import { joinClassNames } from "./joinClassNames";

export function Notice({
  tone,
  children,
}: {
  tone: "success" | "warning";
  children: ReactNode;
}) {
  return (
    <div className={joinClassNames("bara-notice", `bara-notice--${tone}`)}>
      {children}
    </div>
  );
}
