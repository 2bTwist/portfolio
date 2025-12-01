import { Github, Linkedin, Mail } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-3xl">
      {/* Name */}
      <h1 className="text-5xl mb-4 tracking-wide" style={{ fontFamily: "var(--font-caveat)" }}>
        EDMOND
      </h1>

      {/* Subtitle */}
      <p className="text-xl mb-2">
        Software Engineer & Product Builder
      </p>

      {/* Description */}
      <p className="text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
        I build scalable backend systems and products. Currently working on PeerPush.
        Interested in distributed systems, APIs, and developer tools.
      </p>

      {/* Connect Section */}
      <div className="mt-20">
        <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-caveat)" }}>
          CONNECT
        </h2>

        <div className="flex items-center gap-10">
          <a
            href="https://github.com/2bTwist"
            className="flex gap-2 items-center hover:opacity-70"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={20} /> GitHub
          </a>

          <a
            href="https://linkedin.com/in/edmond-batch"
            className="flex gap-2 items-center hover:opacity-70"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin size={20} /> LinkedIn
          </a>

          <a
            href="mailto:ndanjiedmond@gmail.com"
            className="flex gap-2 items-center hover:opacity-70"
          >
            <Mail size={20} /> Email
          </a>
        </div>
      </div>
    </div>
  );
}
