import { PendingFormClient } from "./PendingFormClient";

type SearchParamValue = string | string[] | undefined;
type PendingSearchParams = Record<string, SearchParamValue>;

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<PendingSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <PendingFormClient
      searchParams={resolvedSearchParams}
      previousSubmissionFormData={null}
    />
  );
}
