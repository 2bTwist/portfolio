type MarkVariant = "highlight" | "code" | "bold" | "gradient" | "underline";

interface MarkProps {
  variant?: MarkVariant;
  children: React.ReactNode;
}

const markStyles = {
  highlight: "bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded",
  code: "bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400",
  bold: "font-bold text-zinc-900 dark:text-zinc-100",
  gradient: "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold",
  underline: "underline decoration-2 decoration-blue-500 dark:decoration-blue-400 underline-offset-2",
};

export function Mark({ variant = "highlight", children }: MarkProps) {
  return <span className={markStyles[variant]}>{children}</span>;
}
