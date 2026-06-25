import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume - Edmond Ndanji",
  description: "Edmond Ndanji's resume.",
};

/* The resume "trick": the page IS the document — a printed-paper sheet rendered
   in HTML (white sheet on the cream desk), with a toolbar to download the real
   PDF. Faithful to public/resume.pdf; update both together. */

const CONTACT = [
  { label: "ndanjiedmond@gmail.com", href: "mailto:ndanjiedmond@gmail.com" },
  { label: "(240) 460-4925", href: "tel:+12404604925" },
  { label: "eddyb.dev", href: "https://eddyb.dev" },
  { label: "linkedin.com/in/edmond-batch", href: "https://www.linkedin.com/in/edmond-batch" },
  { label: "github.com/2bTwist", href: "https://github.com/2bTwist" },
];

function Entry({ title, meta, date }: { title: React.ReactNode; meta?: string; date: string }) {
  return (
    <div className="cv-entry">
      <div className="cv-entry-head">
        <span className="cv-entry-title">{title}</span>
        <span className="cv-entry-date">{date}</span>
      </div>
      {meta ? <div className="cv-entry-meta">{meta}</div> : null}
    </div>
  );
}

export default function ResumePage() {
  return (
    <main className="flex-1">
      <div className="cv-wrap">
        <div className="cv-toolbar">
          <span className="cv-filename mono">Edmond_Ndanji_Resume.pdf</span>
          <a className="cv-download" href="/resume.pdf" download="Edmond_Ndanji_Resume.pdf">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="M7 11l5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            Download PDF
          </a>
        </div>

        <article className="cv-paper" aria-label="Resume">
          <header className="cv-header">
            <h1 className="cv-name">Edmond Batchankwe, Ndanji</h1>
            <p className="cv-contact">
              {CONTACT.map((c, i) => (
                <span key={c.label}>
                  {i > 0 ? <span className="cv-sep"> | </span> : null}
                  <a href={c.href} target="_blank" rel="noreferrer noopener">
                    {c.label}
                  </a>
                </span>
              ))}
            </p>
          </header>

          <section className="cv-section">
            <h2 className="cv-section-title">Education</h2>
            <Entry title="University of Maryland, Baltimore County (UMBC)" date="Dec 2026" />
            <p className="cv-line">Bachelor of Science in Computer Science</p>
            <p className="cv-line">
              <strong>Relevant Coursework:</strong> Data Structures &amp; Algorithms, Software Engineering,
              Operating Systems, Computer Architecture, Discrete Structures, Database Management Systems,
              Computer Networks, Principles of Programming Languages, Linear Algebra
            </p>
          </section>

          <section className="cv-section">
            <h2 className="cv-section-title">Technical Skills</h2>
            <dl className="cv-skills">
              <div><dt>Languages:</dt><dd>Python, TypeScript, JavaScript, Java, C++, Go, Swift, SQL</dd></div>
              <div><dt>Frontend &amp; Mobile:</dt><dd>React Native, Vue.js, SwiftUI, SCSS, Code Splitting, Lazy Loading, Memoization, Web Workers</dd></div>
              <div><dt>Backend &amp; APIs:</dt><dd>Node.js, Express.js, FastAPI, REST APIs, GraphQL, JWT, OAuth 2.0</dd></div>
              <div><dt>Databases:</dt><dd>PostgreSQL, MySQL, SQLite, SQL Server, Oracle, Snowflake, MongoDB</dd></div>
              <div><dt>Cloud &amp; DevOps:</dt><dd>AWS, Vercel, Docker, Kubernetes, GitHub Actions, Jenkins, OpenShift, Azure DevOps Server, CI/CD</dd></div>
              <div><dt>AI &amp; ML:</dt><dd>LangChain, LangGraph, Core ML, Ollama, n8n, Prompt Engineering</dd></div>
              <div><dt>Developer Tools:</dt><dd>VS Code, Xcode, IntelliJ, Git, Claude Code, Jira, Confluence, Figma, LucidChart, Excalidraw</dd></div>
              <div><dt>Certifications:</dt><dd>AWS Certified AI Practitioner, Apple Search Ads Certification</dd></div>
            </dl>
          </section>

          <section className="cv-section">
            <h2 className="cv-section-title">Professional Experience</h2>
            <Entry title="Software Engineering Intern — Cisco Systems" meta="RTP, NC" date="Sep 2025 – Nov 2025" />
            <ul className="cv-bullets">
              <li>Cut page load and interaction latency by 40% across Cisco&apos;s internal Model Context Protocol (MCP) applications by profiling frontend bottlenecks and optimizing render logic, sharpening responsiveness for the engineering teams that relied on the platform.</li>
              <li>Returned for a second term to own the reliability of the MCP platform built the prior term, reducing recurring production incidents by 35% and keeping it stable for 5+ engineering teams through proactive triage and bug fixes.</li>
            </ul>
            <Entry title="Software Engineering Intern — Cisco Systems" meta="RTP, NC" date="Jun 2025 – Aug 2025" />
            <ul className="cv-bullets">
              <li>Built and deployed a decoupled MCP server with FastAPI and FastMCP that connected AI agents to Cisco&apos;s internal tools, making each onboarded tool instantly discoverable and callable by an agent rather than wired up by hand.</li>
              <li>Shipped a Vue.js dashboard that gave 20+ engineers a single interface to onboard, configure, and manage 15+ internal tools on the MCP server, replacing manual setup for each tool.</li>
              <li>Created an agentic chatbot client that ran in the browser to validate any onboarded tool against the MCP server from the dashboard, cutting manual tool testing overhead by 40% so engineers could verify a tool with an agent rather than by hand.</li>
            </ul>
          </section>

          <section className="cv-section">
            <h2 className="cv-section-title">Technical Projects</h2>
            <Entry title="TactileLens" meta="Kotlin, Android, LiteRT (TensorFlow Lite), Qualcomm Hexagon NPU, U2Net" date="May 2026" />
            <ul className="cv-bullets">
              <li>Earned Finalist honors at the Qualcomm × Google Developer Hackathon by building an Android AI app that converts live camera textures into haptic and audio feedback in real time, mapping roughness, hardness, friction, and density into multisensory output for low vision accessibility.</li>
              <li>Held the full inference pipeline under 20 ms, fast enough to preserve a live illusion of touch, by running it on the Snapdragon Hexagon NPU via LiteRT and a U2Net segmentation model with a zero copy ByteBuffer path.</li>
              <li>Delivered smooth, consistent output by offloading matrix math to the NPU and mapping texture axes to Android VibrationEffect haptics and synchronized Media3 audio, calibrated against empirical material centroids for accurate classification.</li>
            </ul>
            <Entry title="BeSeen" meta="Swift, React Native, TypeScript, SQLite, PostgreSQL, Supabase" date="Dec 2025 – Feb 2026" />
            <ul className="cv-bullets">
              <li>Built and launched an iOS wellness app with daily habit tracking, streaks, and partner sharing, scaling it to 200 active users and 40 connected partnerships by leveraging App Store Optimization (ASO), Apple Search Ads, and organic content.</li>
              <li>Kept core features fully usable offline and partner data in sync in real time by architecting offline first sync over on device SQLite and Supabase/PostgreSQL, built end to end in React Native with auth and push notifications.</li>
              <li>Instrumented the app with PostHog for product analytics and Sentry for error and performance monitoring, enabling data driven UX, faster bug fixes, and continuous iteration.</li>
            </ul>
          </section>

          <section className="cv-section">
            <h2 className="cv-section-title">Academic Honors &amp; Achievements</h2>
            <ul className="cv-bullets">
              <li>President&apos;s List (Fall 2024) and Dean&apos;s List, UMBC</li>
              <li>35% Merit Scholarship Recipient, UMBC</li>
            </ul>
          </section>

          <section className="cv-section">
            <h2 className="cv-section-title">Leadership &amp; Extracurricular</h2>
            <ul className="cv-bullets">
              <li><strong>Resident Assistant</strong> — UMBC Department of Residential Life</li>
              <li><strong>Restaurant Manager</strong> — led front of house operations and staff coordination</li>
              <li><strong>National Society of Black Engineers</strong> — Marketing Director</li>
              <li><strong>ColorStack</strong> — Member</li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}
