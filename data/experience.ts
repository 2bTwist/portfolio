export interface ExperienceItem {
  company: string;
  roles: {
    title: string;
    description: string;
    dateRange: string;
  }[];
}

export const experience: ExperienceItem[] = [
  {
    company: "Cisco",
    roles: [
      {
        title: "Software Engineering Intern",
        description: "Integrated a browser-based MCP client chatbot to test tools directly in-app, reducing testing time by 40% and streamlining engineering workflows.",
        dateRange: "Jun 2025 – Nov 2025",
      },
    ],
  },
];
