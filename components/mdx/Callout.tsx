import { cn } from "@/lib/utils";

export default function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-accent/40 bg-accent/5",
    warning: "border-yellow-400/40 bg-yellow-400/5",
    success: "border-green-500/40 bg-green-500/5",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border my-6 text-text",
        styles[type]
      )}
    >
      {children}
    </div>
  );
}
