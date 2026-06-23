import { InfoIcon, LightbulbIcon, AlertTriangleIcon, CheckCircleIcon, LinkIcon } from "lucide-react";
import type { ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning" | "success" | "link";

const icons = {
  note: InfoIcon,
  tip: LightbulbIcon,
  warning: AlertTriangleIcon,
  success: CheckCircleIcon,
  link: LinkIcon,
} as const;

export function Callout({ type = "note", children }: { type?: CalloutType; children: ReactNode }) {
  const Icon = icons[type];
  return (
    <div className={`callout callout--${type}`}>
      <Icon className="callout-icon" size={20} aria-hidden="true" />
      <div className="callout-body">{children}</div>
    </div>
  );
}
