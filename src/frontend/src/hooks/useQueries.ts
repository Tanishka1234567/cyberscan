import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScanHistoryEntry } from "../backend.d.ts";
import { useActor } from "./useActor";

export function useGetScanHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<ScanHistoryEntry[]>({
    queryKey: ["scanHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getScanHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useScanUrl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.scanUrl(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    },
  });
}

export function useLookupDns() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (domain: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.lookupDns(domain);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    },
  });
}
