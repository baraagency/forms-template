import type { ReactNode } from "react";

export function Row({ children }: { children: ReactNode }) {
  return <div className="bara-row">{children}</div>;
}
