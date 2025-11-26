import { Github, Linkedin, Mail } from "lucide-react";

export default function HomePage() {
  return (
    <div className="prose-custom">
      <header className="mb-20">
        <h1 className="text-4xl font-display font-semibold mb-3">
          Edmond
        </h1>

        <p className="text-xl text-text-subtle mb-6">
          Software Engineer & Product Builder
        </p>

        <p className="leading-relaxed text-text-subtle max-w-prose">
          I build scalable backend systems and products. Currently working on PeerPush.
          Interested in distributed systems, APIs, and developer tools.
        </p>
      </header>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-8">Connect</h2>

        <div className="flex gap-6">
          <a
            href="https://github.com/2btwist"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-text-subtle hover:text-accent transition"
          >
            <Github className="w-5 h-5" />
            GitHub
          </a>

          <a
            href="https://www.linkedin.com/in/edmond-batch/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-text-subtle hover:text-accent transition"
          >
            <Linkedin className="w-5 h-5" />
            LinkedIn
          </a>

          <a
            href="mailto:edmond@example.com"
            className="flex items-center gap-2 text-text-subtle hover:text-accent transition"
          >
            <Mail className="w-5 h-5" />
            Email
          </a>
        </div>
      </section>
    </div>
  );
}
