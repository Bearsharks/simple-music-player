import type { ComponentProps } from "react";
import { Button } from "./shadcn/button";
import { cn } from "shared/lib/cn";
import "./BrandPrimaryButton.scss";

/** Product signature CTA; all behavior, refs and asChild composition stay in Button. */
export default function BrandPrimaryButton({
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "variant">) {
  return (
    <Button
      {...props}
      variant="default"
      className={cn("brand-primary-button", className)}
    />
  );
}
