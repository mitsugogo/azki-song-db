export type SeichiMapIdentityPreview = {
  baseVersion: number;
  candidateHash: string;
  updatedAt: string | null;
  needsApply: boolean;
  summary: {
    locationCount: number;
    registryCount: number;
    addedCount: number;
    updatedCount: number;
    unchangedCount: number;
  };
  changes: {
    id: string;
    name: string;
    kind: "added" | "updated";
  }[];
};

export type SeichiMapIdentityErrorCode =
  | "forbidden"
  | "invalid_request"
  | "conflict"
  | "kml_unavailable"
  | "invalid_kml"
  | "invalid_registry"
  | "storage_failed";
