export type TokenSummary = {
  id: string;
  name: string;
  hint: string;
  canWrite: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};
