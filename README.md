# Portfolio Website

My personal portfolio and blog built with Next.js 16, showcasing my projects, skills, and writing.

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Content:** MDX for blog posts
- **Typography:** Inter (body), Caveat (headings)
- **Theme:** Dark mode support with next-themes
- **Icons:** Lucide React
- **Syntax Highlighting:** Prism React Renderer

## 📁 Project Structure

```
portfolio/
├── app/                    # Next.js App Router pages
│   ├── blog/              # Blog listing and posts
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── CodeBlock.tsx      # Syntax highlighted code blocks
│   ├── ExperienceSection.tsx
│   ├── MDXComponents.tsx  # Custom MDX component mappings
│   ├── Navbar.tsx         # Navigation sidebar
│   ├── ProjectsSection.tsx
│   ├── SkillsSection.tsx
│   └── ThemeProvider.tsx  # Dark mode wrapper
├── content/               # MDX content
│   └── blog/             # Blog posts (.mdx files)
├── data/                  # Data models
│   ├── experience.ts      # Work experience data
│   ├── projects.ts        # Projects data
│   └── skills.ts          # Skills data
├── lib/                   # Utilities
│   └── posts.ts          # Blog post utilities
└── public/               # Static assets
    └── images/           # Images for blog posts
```

## 🎨 Features

- **Data-Driven Architecture** - Update content by editing data files
- **MDX Blog** - Write blog posts with code blocks and images
- **Dark Mode** - Automatic theme switching
- **Responsive Design** - Mobile-friendly layout
- **Type-Safe** - Full TypeScript support
- **Modular Components** - Reusable section components

## 🏃 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## 📝 Adding Content

### Add a Blog Post

Create a new `.mdx` file in `/content/blog/`:

```mdx
---
title: "Your Post Title"
date: "2025-01-20"
summary: "Brief description"
---

# Your content here

Code blocks with syntax highlighting:

\`\`\`typescript
const greeting = "Hello World";
\`\`\`

Images:
![Alt text](/images/blog/your-image.png)
```

### Update Projects

Edit `/data/projects.ts`:

```typescript
export const projects: ProjectItem[] = [
  {
    title: "Your Project",
    summary: "Description",
    tech: ["React", "Node.js"],
    status: "shipped",
    externalUrl: "https://yourproject.com",
  },
];
```

### Update Skills

Edit `/data/skills.ts`:

```typescript
export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: ["TypeScript", "Python", "Go"],
  },
];
```

### Update Experience

Edit `/data/experience.ts`:

```typescript
export const experience: ExperienceItem[] = [
  {
    company: "Company Name",
    roles: [
      {
        title: "Your Title",
        description: "What you did",
        dateRange: "2024 – Present",
      },
    ],
  },
];
```

## 🎨 Customization

### Fonts

Fonts are configured in `/app/globals.css`:
- **Body:** Inter
- **Headings:** Caveat (handwritten style)

### Colors

Tailwind color system using zinc palette with dark mode support.

### Theme

Toggle between light and dark mode using the button in the navbar.

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Build for Production

```bash
pnpm build
pnpm start
```

## 📄 License

**All Rights Reserved.** This source is published publicly for viewing and
educational reference only. You may **not** copy, clone, reuse, redistribute, or
deploy this website (code or content) in whole or in substantial part without
explicit written permission. See [LICENSE](./LICENSE) for the full terms.

## 🔗 Links

- **Live Site:** [Your URL]
- **GitHub:** [@2bTwist](https://github.com/2bTwist)
- **LinkedIn:** [Edmond Batch](https://linkedin.com/in/edmond-batch)

---

Built with ❤️ using Next.js
