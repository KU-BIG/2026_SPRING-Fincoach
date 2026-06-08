import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** 매거진 시트 — 카드 X. 보더만, 그림자 없음. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-md border border-border bg-bg-surface p-6",
        className,
      )}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...props}
      className={cn("serif mb-3 text-xl font-medium leading-snug", className)}
    />
  );
}

export function CardLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cn("caption", className)} />;
}
