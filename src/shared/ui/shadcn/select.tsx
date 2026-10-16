// Adapted from shadcn/ui new-york-v4 (MIT). See README.md for provenance.
"use client";

import * as React from "react";
import { cn } from "shared/lib/cn";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";

const SelectScope = React.createContext<{
  trigger: React.RefObject<HTMLButtonElement | null>;
  container: HTMLDialogElement | null;
} | null>(null);

function Select({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const trigger = React.useRef<HTMLButtonElement>(null);
  const [container, setContainer] = React.useState<HTMLDialogElement | null>(
    null,
  );
  return (
    <SelectScope.Provider value={{ trigger, container }}>
      <SelectPrimitive.Root
        {...props}
        onOpenChange={(open) => {
          if (open)
            setContainer(
              trigger.current?.closest<HTMLDialogElement>("dialog[open]") ??
                null,
            );
          onOpenChange?.(open);
        }}
      />
    </SelectScope.Provider>
  );
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ref,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  const scope = React.useContext(SelectScope);
  return (
    <SelectPrimitive.Trigger
      ref={(element) => {
        if (scope) scope.trigger.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "loopy-control",
        "ui:flex ui:w-fit ui:items-center ui:justify-between ui:gap-2 ui:rounded-md ui:border ui:border-input ui:bg-transparent ui:px-3 ui:py-2 ui:text-sm ui:whitespace-nowrap ui:shadow-xs ui:transition-[color,box-shadow] ui:outline-none ui:focus-visible:border-ring ui:focus-visible:ring-[3px] ui:focus-visible:ring-ring/50 ui:disabled:cursor-not-allowed ui:disabled:opacity-50 ui:aria-invalid:border-destructive ui:aria-invalid:ring-destructive/20 ui:data-[placeholder]:text-muted-foreground ui:data-[size=default]:h-9 ui:data-[size=sm]:h-8 ui:*:data-[slot=select-value]:line-clamp-1 ui:*:data-[slot=select-value]:flex ui:*:data-[slot=select-value]:items-center ui:*:data-[slot=select-value]:gap-2 ui:dark:bg-input/30 ui:dark:hover:bg-input/50 ui:dark:aria-invalid:ring-destructive/40 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="ui:size-4 ui:opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  portalContainer,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  portalContainer?: HTMLElement | null;
}) {
  const scope = React.useContext(SelectScope);
  const container =
    portalContainer === undefined ? scope?.container : portalContainer;
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-dialog-popover
        className={cn(
          "loopy-control",
          "ui:relative ui:z-50 ui:max-h-(--radix-select-content-available-height) ui:min-w-[8rem] ui:origin-(--radix-select-content-transform-origin) ui:overflow-x-hidden ui:overflow-y-auto ui:rounded-md ui:border ui:bg-popover ui:text-popover-foreground ui:shadow-md ui:data-[side=bottom]:slide-in-from-top-2 ui:data-[side=left]:slide-in-from-right-2 ui:data-[side=right]:slide-in-from-left-2 ui:data-[side=top]:slide-in-from-bottom-2 ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=closed]:zoom-out-95 ui:data-[state=open]:animate-in ui:data-[state=open]:fade-in-0 ui:data-[state=open]:zoom-in-95",
          position === "popper" &&
            "ui:data-[side=bottom]:translate-y-1 ui:data-[side=left]:-translate-x-1 ui:data-[side=right]:translate-x-1 ui:data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        collisionBoundary={container}
        collisionPadding={8}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "loopy-control",
            "ui:p-1",
            position === "popper" &&
              "ui:h-[var(--radix-select-trigger-height)] ui:w-full ui:min-w-[var(--radix-select-trigger-width)] ui:scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "loopy-control",
        "ui:px-2 ui:py-1.5 ui:text-xs ui:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "loopy-control",
        "ui:relative ui:flex ui:w-full ui:cursor-default ui:items-center ui:gap-2 ui:rounded-sm ui:py-1.5 ui:pr-8 ui:pl-2 ui:text-sm ui:outline-hidden ui:select-none ui:focus:bg-accent ui:focus:text-accent-foreground ui:data-[disabled]:pointer-events-none ui:data-[disabled]:opacity-50 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:*:[span]:last:flex ui:*:[span]:last:items-center ui:*:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="ui:absolute ui:right-2 ui:flex ui:size-3.5 ui:items-center ui:justify-center"
      >
        <SelectPrimitive.ItemIndicator data-slot="select-item-indicator">
          <CheckIcon className="ui:size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "loopy-control",
        "ui:pointer-events-none ui:-mx-1 ui:my-1 ui:h-px ui:bg-border",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "loopy-control",
        "ui:flex ui:cursor-default ui:items-center ui:justify-center ui:py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="ui:size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "loopy-control",
        "ui:flex ui:cursor-default ui:items-center ui:justify-center ui:py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="ui:size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
