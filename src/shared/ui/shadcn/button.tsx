// Adapted from shadcn/ui new-york-v4 (MIT). See README.md for provenance.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "shared/lib/cn";
import * as Slot from "@radix-ui/react-slot";

const buttonVariants = cva(
  "ui:inline-flex ui:shrink-0 ui:items-center ui:justify-center ui:gap-2 ui:rounded-md ui:text-sm ui:font-medium ui:whitespace-nowrap ui:transition-all ui:outline-none ui:focus-visible:border-ring ui:focus-visible:ring-[3px] ui:focus-visible:ring-ring/50 ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:aria-invalid:border-destructive ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "ui:bg-primary ui:text-primary-foreground ui:hover:bg-primary/90",
        destructive:
          "ui:bg-destructive ui:text-white ui:hover:bg-destructive/90 ui:focus-visible:ring-destructive/20 ui:dark:bg-destructive/60 ui:dark:focus-visible:ring-destructive/40",
        outline:
          "ui:border ui:bg-background ui:shadow-xs ui:hover:bg-accent ui:hover:text-accent-foreground ui:dark:border-input ui:dark:bg-input/30 ui:dark:hover:bg-input/50",
        secondary:
          "ui:bg-secondary ui:text-secondary-foreground ui:hover:bg-secondary/80",
        ghost:
          "ui:hover:bg-accent ui:hover:text-accent-foreground ui:dark:hover:bg-accent/50",
        link: "ui:text-primary ui:underline-offset-4 ui:hover:underline",
      },
      size: {
        default: "ui:h-9 ui:px-4 ui:py-2 ui:has-[>svg]:px-3",
        xs: "ui:h-6 ui:gap-1 ui:rounded-md ui:px-2 ui:text-xs ui:has-[>svg]:px-1.5 ui:[&_svg:not([class*='size-'])]:size-3",
        sm: "ui:h-8 ui:gap-1.5 ui:rounded-md ui:px-3 ui:has-[>svg]:px-2.5",
        lg: "ui:h-10 ui:rounded-md ui:px-6 ui:has-[>svg]:px-4",
        icon: "ui:size-9",
        "icon-xs":
          "ui:size-6 ui:rounded-md ui:[&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "ui:size-8",
        "icon-lg": "ui:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        "loopy-control",
        buttonVariants({ variant, size, className }),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
