/* Maps an Explorer href to the lazily-loaded body component that renders that
   page's content in a split pane. lazy() keeps every pane body in its own chunk,
   so split-screen code stays out of the initial bundle until a pane is opened.

   The static pages here are exactly the ones data/pages.ts marks splittable; a
   missing or extra body fails the type check. Anything else is handled by the
   caller as a normal navigation of the primary pane. */

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { SplittableHref } from "@/data/pages";
import type { PaneProps } from "@/components/site/PageShell";

// A body renders its page as a region named `paneLabel`, not the route's <main>.
type PaneBody = LazyExoticComponent<ComponentType<Required<PaneProps>>>;

/* Blog posts + project stories render MDX server-side; their pane body fetches
   the serialized MDX from /api/pane (see MdxPaneBody). One lazy component handles
   every such route — it reads the target href from the split store. */
const MdxPaneBody = lazy(() => import("./MdxPaneBody").then((m) => ({ default: m.MdxPaneBody })));
const MDX_HREF = /^\/(blog|projects)\/[^/]+$/;

const PANE_REGISTRY: Record<SplittableHref, PaneBody> = {
  "/": lazy(() => import("@/app/_body").then((m) => ({ default: m.HomeBody }))),
  "/about": lazy(() => import("@/app/about/_body").then((m) => ({ default: m.AboutBody }))),
  "/projects": lazy(() => import("@/app/projects/_body").then((m) => ({ default: m.ProjectsBody }))),
  "/experience": lazy(() => import("@/app/experience/_body").then((m) => ({ default: m.ExperienceBody }))),
  "/certs": lazy(() => import("@/app/certs/_body").then((m) => ({ default: m.CertsBody }))),
  "/music": lazy(() => import("@/app/music/_body").then((m) => ({ default: m.MusicBody }))),
  "/resume": lazy(() => import("@/app/resume/_body").then((m) => ({ default: m.ResumeBody }))),
  "/privacy": lazy(() => import("@/app/privacy/_body").then((m) => ({ default: m.PrivacyBody }))),
};

const isSplittablePage = (href: string): href is SplittableHref => Object.hasOwn(PANE_REGISTRY, href);

export function paneFor(href: string): PaneBody | null {
  if (isSplittablePage(href)) return PANE_REGISTRY[href];
  if (MDX_HREF.test(href)) return MdxPaneBody;
  return null;
}
