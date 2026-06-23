"use client";

/* Open-file tabs. Driven entirely by navigation (see store.tsx): visiting a
   known route opens a tab here. Clicking a tab navigates; the × closes it. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "./store";

export function Tabs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { tabs, closeTab } = useSession();

  if (tabs.length === 0) {
    return <div className={className} aria-hidden />;
  }

  return (
    <div className={className} aria-label="Open files">
      {tabs.map((tab) => {
        const active = tab.href === pathname;
        return (
          <div key={tab.href} className="ide-tab" data-active={active}>
            <Link href={tab.href} prefetch aria-current={active ? "page" : undefined}>
              {tab.name}
            </Link>
            <button
              type="button"
              className="ide-tab-close"
              aria-label={`Close ${tab.name}`}
              onClick={() => closeTab(tab.href)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
