import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLeadStatuses() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/lead-statuses",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    statuses: data?.data ?? [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
