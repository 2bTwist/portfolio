"use client";

/* next/link that reports its navigation as pending (components/ide/navPending).
   Every internal link uses this; ESLint keeps next/link imports to this file. */

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { beginNavigation } from "@/components/ide/navPending";

export default function Link({ onNavigate, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink
      {...props}
      onNavigate={(event) => {
        let cancelled = false;
        onNavigate?.({
          preventDefault: () => {
            cancelled = true;
            event.preventDefault();
          },
        });
        if (cancelled) return;
        const { href } = props;
        beginNavigation(typeof href === "string" ? href : (href.pathname ?? ""));
      }}
    />
  );
}
