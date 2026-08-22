import type { ResourceBounds } from "@issue/tool-runtime";

/**
 * Phase 3 DEFAULT_BOUNDS mirror the frozen Phase 2 D-BOUNDS
 * (ARCHITECTURE.md §29.3; phase-02 DECISIONS.md D-BOUNDS):
 * 2 / 5 / 10 / 1 MiB / 4096.
 */
export const DEFAULT_BOUNDS: ResourceBounds = {
  maxRetries: 2,
  maxCorrections: 5,
  maxVerifications: 10,
  maxBytesPerRead: 1024 * 1024,
  chunkSize: 4096,
};
