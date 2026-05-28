import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-md border border-border bg-bg-surface p-5 shadow-card",
        className,
      )}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cn("mb-3 text-base font-semibold", className)} />;
}

export function CardLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={cn("text-xs uppercase tracking-wide text-fg-muted", className)} />
  );
}
