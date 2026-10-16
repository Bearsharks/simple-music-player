import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
const twMerge = extendTailwindMerge({ prefix: "ui" });

/** Standard shadcn class composition; business features stay outside shared UI. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
