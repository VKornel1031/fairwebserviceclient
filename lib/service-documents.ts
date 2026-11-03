export const SERVICE_DOCUMENT_LIMIT = 3 * 1024 * 1024;
export const SERVICE_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;
export type ServiceDocument = {
  id: string;
  name: string;
  mediaType: string;
  size: number;
};
