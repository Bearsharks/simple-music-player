import {
  useImperativeHandle,
  useLayoutEffect,
  type ComponentProps,
  type Ref,
} from "react";

/**
 * Bridge the existing imperative popup API to Radix's real invoking button.
 * No duplicate/hidden trigger is rendered and the button is never reparented.
 */
export default function ExternalMenuTrigger({
  target,
  ref,
  ...props
}: Omit<ComponentProps<"button">, "ref"> & {
  target: HTMLElement;
  ref?: Ref<HTMLElement>;
  "data-state"?: string;
}) {
  useImperativeHandle(ref, () => target, [target]);
  useLayoutEffect(() => {
    const names = [
      "id",
      "aria-haspopup",
      "aria-expanded",
      "aria-controls",
      "data-state",
    ] as const;
    const original = names.map((name) => target.getAttribute(name));
    names.forEach((name) => {
      const value = props[name];
      if (value !== undefined) target.setAttribute(name, String(value));
    });
    return () =>
      names.forEach((name, index) => {
        if (original[index] === null) target.removeAttribute(name);
        else target.setAttribute(name, original[index]!);
      });
  }, [
    target,
    props.id,
    props["aria-haspopup"],
    props["aria-expanded"],
    props["aria-controls"],
    props["data-state"],
  ]);
  return null;
}
