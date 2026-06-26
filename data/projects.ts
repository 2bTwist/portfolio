/* Projects — the heart of the site. Tagged web vs mobile. `image` is the
   on-brand card art (public/images/projects/<id>.png); until it is dropped in,
   the card shows a tinted name placeholder. */

export type ProjectKind = "web" | "mobile";

export type Project = {
  id: string;
  title: string;
  kind: ProjectKind;
  blurb: string;
  detail: string;
  tags: string[];
  featured?: boolean;
  /* On-brand preview image (public/images/projects/<id>.png); falls back to a
     generated placeholder until the art is dropped in. */
  image?: string;
  links?: {
    live?: string;
    repo?: string;
  };
};

export const PROJECTS: Project[] = [
  {
    id: "cisco-mcp",
    title: "Cisco MCP Platform",
    kind: "web",
    featured: true,
    blurb:
      "An internal MCP marketplace at Cisco: a FastAPI + FastMCP server that lets AI agents discover and call internal tools on their own, with a Vue dashboard to onboard and test them.",
    detail:
      "An internal MCP (Model Context Protocol) marketplace at Cisco. MCP is an open standard that lets AI agents discover and call tools through one consistent interface instead of bespoke wiring per tool. I built the first version: a decoupled FastAPI and FastMCP server that exposes internal tools to agents, a Vue dashboard where 20+ engineers onboard and manage 15+ tools, and an in-browser agent client to test them, replacing a lot of manual wiring and tool-by-tool checking. I later came back to make it fast and dependable, profiling the frontend to cut interaction latency by around 40% and bringing recurring production incidents down by 35% for the 5+ engineering teams that rely on it.",
    tags: ["python", "fastapi", "fastmcp", "vue"],
    image: "/images/projects/cisco-mcp-bw.webp",
  },
  {
    id: "tactilelens",
    title: "TactileLens",
    kind: "mobile",
    featured: true,
    blurb: "An Android app that turns what the camera sees into touch, mapping textures to real-time haptics and sound for low-vision accessibility.",
    detail:
      "A finalist at the Qualcomm x Google Developer Hackathon. TactileLens converts live camera textures into haptic and audio feedback in real time, mapping roughness, hardness, friction, and density into multisensory output so low-vision users can feel a surface instead of seeing it. The full inference pipeline runs under 20ms, fast enough to preserve a live illusion of touch, by running on the Snapdragon Hexagon NPU via LiteRT with a U2Net segmentation model and a zero-copy ByteBuffer path. Texture axes map to Android VibrationEffect haptics and synchronized Media3 audio, calibrated against empirical material centroids for accurate classification.",
    tags: ["kotlin", "android", "litert", "on-device ai"],
    image: "/images/projects/tactilelens-bw.webp",
    links: { repo: "https://github.com/chisomogugu/TactileLens---Vision-to-Haptics-AI-Application" },
  },
  {
    id: "beseen",
    title: "BeSeen",
    kind: "mobile",
    featured: true,
    blurb: "A wellness app for couples with daily habit tracking, streaks, and partner sharing that stays in sync even offline.",
    detail:
      "An iOS wellness app built end to end in React Native, with daily habit tracking, streaks, and partner sharing, now at 200+ active users and 40 connected partnerships. Core features stay fully usable offline with partner data syncing in real time, architected as offline-first over on-device SQLite and Supabase/Postgres, with auth and push notifications. It is instrumented with PostHog for product analytics and Sentry for error and performance monitoring, and grew through App Store Optimization, Apple Search Ads, and organic content.",
    tags: ["react native", "typescript", "supabase", "ios"],
    image: "/images/projects/beseen-bw.webp",
    links: { live: "https://apps.apple.com/app/id6760330166" },
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
