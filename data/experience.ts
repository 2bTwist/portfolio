/* Work history, education, and community roles for the Experience timeline.
   Sourced from the resume + LinkedIn. Each role carries a short prose summary;
   the longer illustrated story lives on the per-experience `story` page. */

export type Role = {
  title: string;
  period: string;
  summary: string;
};

export type ExperienceEntry = {
  org: string;
  location?: string;
  url?: string;
  /* logo in /public; falls back to a monogram chip when absent */
  logo?: string;
  logoClass?: string;
  roles: Role[];
  /* href to the blog-style "read more" story, when one exists */
  story?: string;
};

export const EXPERIENCE: ExperienceEntry[] = [
  {
    org: "UMBC · DoIT",
    location: "Baltimore, MD · Remote",
    url: "https://doit.umbc.edu",
    logo: "/images/umbc.webp",
    logoClass: "xp-logo--square",
    roles: [
      {
        title: "IT Support Specialist",
        period: "Dec 2023 – Present",
        summary:
          "Part of the Division of IT support team, helping students and staff work through technical issues. Along the way I have built small Python tools to automate routine fixes and used a bit of data analysis to shape an FAQ system that brought response times down.",
      },
    ],
  },
  {
    org: "Cisco Systems",
    location: "RTP, NC",
    url: "https://www.cisco.com",
    logo: "/images/cisco.svg",
    story: "/experience/cisco",
    roles: [
      {
        title: "Software Engineering Intern",
        period: "Sep 2025 – Nov 2025",
        summary:
          "Came back to own the platform I had helped build, this time focused on making it fast and dependable. I profiled the frontend and cut interaction latency by around 40%, and brought recurring production incidents down by 35% so the platform stayed steady for the 5+ engineering teams leaning on it.",
      },
      {
        title: "Software Engineering Intern",
        period: "Jun 2025 – Aug 2025",
        summary:
          "Built the first version of Cisco's internal MCP platform: a decoupled FastAPI and FastMCP server that let AI agents discover and call internal tools on their own, a Vue dashboard where 20+ engineers could onboard and manage 15+ tools, and an in-browser agent client to test them. It replaced a lot of manual wiring and tool-by-tool checking.",
      },
    ],
  },
];

export type Education = {
  org: string;
  degree: string;
  period: string;
  location?: string;
  logo?: string;
  summary: string;
};

export const EDUCATION: Education = {
  org: "University of Maryland, Baltimore County",
  degree: "B.S. in Computer Science",
  period: "Expected Dec 2026",
  location: "Baltimore, MD",
  logo: "/images/umbc.webp",
  summary:
    "Studying computer science, graduating December 2026. Along the way I have made the President's List and Dean's List and hold a 35% merit scholarship.",
};

export type Activity = {
  role: string;
  org?: string;
  url?: string;
  logo?: string;
};

export const LEADERSHIP: Activity[] = [
  {
    role: "Marketing Director",
    org: "National Society of Black Engineers",
    url: "https://www.nsbe.org",
    logo: "/images/nsbe.webp",
  },
  {
    role: "Member",
    org: "ColorStack",
    url: "https://www.colorstack.org",
    logo: "/images/colorstack.webp",
  },
  { role: "Restaurant Manager" },
];
