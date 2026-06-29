/* Maps an Explorer href to the lazily-loaded body component that renders that
   page's content in a split pane. lazy() keeps every pane body in its own chunk,
   so split-screen code stays out of the initial bundle until a pane is opened.

   Phase 1: only the non-MDX, no-server-data routes are registered. Dropping any
   other file (blog posts, project stories) is handled by the caller as a normal
   navigation of the primary pane. */

import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/* Blog posts + project stories render MDX server-side; their pane body fetches
   the rendered HTML from /api/pane (see MdxPaneBody). One lazy component handles
   every such route — it reads the target href from the split store. */
const MdxPaneBody = lazy(() => import("./MdxPaneBody").then((m) => ({ default: m.MdxPaneBody })));
const MDX_HREF = /^\/(blog|projects)\/[^/]+$/;

export const PANE_REGISTRY: Record<string, LazyExoticComponent<ComponentType>> = {
  "/": lazy(() => import("@/app/_body").then((m) => ({ default: m.HomeBody }))),
  "/about": lazy(() => import("@/app/about/_body").then((m) => ({ default: m.AboutBody }))),
  "/projects": lazy(() => import("@/app/projects/_body").then((m) => ({ default: m.ProjectsBody }))),
  "/experience": lazy(() => import("@/app/experience/_body").then((m) => ({ default: m.ExperienceBody }))),
  "/certs": lazy(() => import("@/app/certs/_body").then((m) => ({ default: m.CertsBody }))),
  "/music": lazy(() => import("@/app/music/_body").then((m) => ({ default: m.MusicBody }))),
  "/resume": lazy(() => import("@/app/resume/_body").then((m) => ({ default: m.ResumeBody }))),
  "/privacy": lazy(() => import("@/app/privacy/_body").then((m) => ({ default: m.PrivacyBody }))),
};

export function paneFor(href: string): LazyExoticComponent<ComponentType> | null {
  if (PANE_REGISTRY[href]) return PANE_REGISTRY[href];
  if (MDX_HREF.test(href)) return MdxPaneBody;
  return null;
}
