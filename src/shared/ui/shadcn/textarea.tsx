// Adapted from shadcn/ui new-york-v4 (MIT). See README.md for provenance.
import * as React from "react";
import { cn } from "shared/lib/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "loopy-control",
        "ui:flex ui:field-sizing-content ui:min-h-16 ui:w-full ui:rounded-md ui:border ui:border-input ui:bg-transparent ui:px-3 ui:py-2 ui:text-base ui:shadow-xs ui:transition-[color,box-shadow] ui:outline-none ui:placeholder:text-muted-foreground ui:focus-visible:border-ring ui:focus-visible:ring-[3px] ui:focus-visible:ring-ring/50 ui:disabled:cursor-not-allowed ui:disabled:opacity-50 ui:aria-invalid:border-destructive ui:aria-invalid:ring-destructive/20 ui:md:text-sm ui:dark:bg-input/30 ui:dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
