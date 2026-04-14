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
      const result = await actor.scanUrl(url);
      console.debug(
        "[CyberScan] scanUrl raw response (first 500 chars):",
        result.slice(0, 500),
      );
      return result;
    },
    onError: (err) => {
      console.error("[CyberScan] scanUrl mutation error:", err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    },
  });
}

export function useScanIp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (ip: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.scanIp(ip);
      console.debug(
        "[CyberScan] scanIp raw response (first 500 chars):",
        result.slice(0, 500),
      );
      return result;
    },
    onError: (err) => {
      console.error("[CyberScan] scanIp mutation error:", err);
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
      const result = await actor.lookupDns(domain);
      console.debug(
        "[CyberScan] lookupDns raw response (first 500 chars):",
        result.slice(0, 500),
      );
      return result;
    },
    onError: (err) => {
      console.error("[CyberScan] lookupDns mutation error:", err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    },
  });
}

export function usePhishingDetect() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error("Actor not ready");
      // scanPhishing is available on the backend; cast to extended interface
      const extActor = actor as typeof actor & {
        scanPhishing: (url: string) => Promise<string>;
      };
      const result = await extActor.scanPhishing(url);
      console.debug(
        "[CyberScan] scanPhishing raw response (first 500 chars):",
        result.slice(0, 500),
      );
      return result;
    },
    onError: (err) => {
      console.error("[CyberScan] scanPhishing mutation error:", err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    },
  });
}
