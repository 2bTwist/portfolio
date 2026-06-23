/* Projects — the heart of the site. Tagged web vs mobile. `demo` reserves a
   per-project interactive slot (Appetize / Expo Snack), filled project by
   project later. Content is placeholder until Phase 6. */

export type ProjectKind = "web" | "mobile";

export type ProjectDemo = {
  type: "appetize" | "snack" | "embed";
  src: string;
};

export type Project = {
  id: string;
  title: string;
  kind: ProjectKind;
  blurb: string;
  detail: string;
  tags: string[];
  featured?: boolean;
  links?: {
    live?: string;
    repo?: string;
  };
  demo?: ProjectDemo;
};

export const PROJECTS: Project[] = [
  {
    id: "ledger",
    title: "Ledger",
    kind: "web",
    featured: true,
    blurb: "Double-entry finance engine with a real-time dashboard.",
    detail:
      "A double-entry accounting core in TypeScript with an event-sourced ledger, a reconciliation engine, and a live dashboard. Handles multi-currency, immutable journals, and sub-100ms balance queries over millions of entries.",
    tags: ["next", "postgres", "typescript"],
    links: { live: "#", repo: "#" },
  },
  {
    id: "tempo",
    title: "Tempo",
    kind: "mobile",
    featured: true,
    blurb: "Habit tracker with a tactile, gesture-first interface.",
    detail:
      "A React Native habit tracker built around physical-feeling gestures: swipe to complete, long-press to reschedule, haptics on every commit. Offline-first with conflict-free sync.",
    tags: ["expo", "react-native", "reanimated"],
    links: { live: "#", repo: "#" },
  },
  {
    id: "atlas",
    title: "Atlas",
    kind: "web",
    blurb: "Self-hosted analytics that respects privacy.",
    detail:
      "A cookieless, self-hostable analytics platform. Edge ingestion, columnar storage, and a query layer that returns funnels and retention without ever fingerprinting a visitor.",
    tags: ["go", "clickhouse", "edge"],
    links: { live: "#", repo: "#" },
  },
  {
    id: "pocket",
    title: "Pocket Studio",
    kind: "mobile",
    blurb: "On-device photo editing with a node-based pipeline.",
    detail:
      "A mobile photo editor with a node-based, non-destructive pipeline running entirely on-device via Metal/GPU shaders. Export presets, history scrubbing, and zero cloud round-trips.",
    tags: ["swift", "metal", "ios"],
    links: { live: "#", repo: "#" },
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
