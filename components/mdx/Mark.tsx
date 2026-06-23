import type { ReactNode } from "react";

type MarkVariant = "highlight" | "code" | "bold" | "gradient" | "underline";

export function Mark({ variant = "highlight", children }: { variant?: MarkVariant; children: ReactNode }) {
  return <span className={`mark mark--${variant}`}>{children}</span>;
}
