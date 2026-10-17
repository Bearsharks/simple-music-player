export type ImportItem = { kind: "video" | "playlist"; id: string };
export type ImportEnvelope = { type: "loopy.import"; version: 1; requestId: string; items: ImportItem[] };
export const EXTENSION_ID: string;
export const MAX_ITEMS: number;
export function validPlaylistId(value: unknown): value is string;
export function sanitizePreview(value: unknown, item: ImportItem): { title: string; thumbnailVideoId: string };
export function validItem(value: unknown): value is ImportItem;
export function validEnvelope(value: unknown): value is ImportEnvelope;
export function allowedApp(raw: string): boolean;
