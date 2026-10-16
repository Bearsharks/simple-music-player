// Adapted from shadcn/ui new-york-v4 (MIT). See README.md for provenance.
"use client";

import * as React from "react";
import { cn } from "shared/lib/cn";
import * as PopoverPrimitive from "@radix-ui/react-popover";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  portalContainer,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  portalContainer?: HTMLElement | null;
}) {
  return (
    <PopoverPrimitive.Portal container={portalContainer}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        data-dialog-popover
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "loopy-control",
          "ui:z-50 ui:w-72 ui:origin-(--radix-popover-content-transform-origin) ui:rounded-md ui:border ui:bg-popover ui:p-4 ui:text-popover-foreground ui:shadow-md ui:outline-hidden ui:data-[side=bottom]:slide-in-from-top-2 ui:data-[side=left]:slide-in-from-right-2 ui:data-[side=right]:slide-in-from-left-2 ui:data-[side=top]:slide-in-from-bottom-2 ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=closed]:zoom-out-95 ui:data-[state=open]:animate-in ui:data-[state=open]:fade-in-0 ui:data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn(
        "loopy-control",
        "ui:flex ui:flex-col ui:gap-1 ui:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("loopy-control", "ui:font-medium", className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("loopy-control", "ui:text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
};
