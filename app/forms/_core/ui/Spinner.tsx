import { joinClassNames } from "./joinClassNames";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={joinClassNames("bara-spinner", className)} />
  );
}
