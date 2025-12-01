import { 
  InfoIcon, 
  LightbulbIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon,
  LinkIcon 
} from "lucide-react";

type CalloutType = "note" | "tip" | "warning" | "success" | "link";

interface CalloutProps {
  type?: CalloutType;
  children: React.ReactNode;
}

const calloutConfig = {
  note: {
    icon: InfoIcon,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  tip: {
    icon: LightbulbIcon,
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-900 dark:text-green-100",
    iconColor: "text-green-500 dark:text-green-400",
  },
  warning: {
    icon: AlertTriangleIcon,
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-900 dark:text-yellow-100",
    iconColor: "text-yellow-500 dark:text-yellow-400",
  },
  success: {
    icon: CheckCircleIcon,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-900 dark:text-emerald-100",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  link: {
    icon: LinkIcon,
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-900 dark:text-purple-100",
    iconColor: "text-purple-500 dark:text-purple-400",
  },
};

export function Callout({ type = "note", children }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`my-6 flex gap-3 rounded-lg border p-4 ${config.bg} ${config.border}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`} />
      <div className={`flex-1 ${config.text} [&>p]:m-0`}>{children}</div>
    </div>
  );
}
