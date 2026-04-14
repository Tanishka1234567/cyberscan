import {
  createActorWithConfig,
  useActor as useActorBase,
} from "@caffeineai/core-infrastructure";
import { type backendInterface, createActor } from "../backend";

/**
 * Project-specific useActor hook that wires the generated backend actor
 * into the infrastructure's actor management system.
 */
export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  return useActorBase<backendInterface>(
    (canisterId, uploadFile, downloadFile, options) =>
      createActor(canisterId, uploadFile, downloadFile, options),
  );
}

export { createActorWithConfig };
