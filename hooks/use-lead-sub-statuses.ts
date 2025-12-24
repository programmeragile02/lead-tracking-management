import useSWR from "swr";

export function useLeadSubStatuses(statusId?: number | null) {
  const { data, isLoading } = useSWR(
    statusId ? `/api/lead-sub-statuses?statusId=${statusId}` : null,
    (url) => fetch(url).then((r) => r.json())
  );

  return {
    subStatuses: data?.data ?? [],
    loading: isLoading,
  };
}
