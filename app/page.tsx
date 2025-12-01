import { Github, Mail, Linkedin as LinkedinIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-5xl">
      {/* Name */}
      <h1 className="text-5xl mb-4 tracking-wide" style={{ fontFamily: "var(--font-caveat)" }}>
        EDMOND NDANJI
      </h1>

      {/* Subtitle */}
      <p className="text-xl mb-2">
        Software Engineer & Product Enthusiast
      </p>

      {/* Description */}
      <div className="text-zinc-600 dark:text-zinc-400 max-w-5xl leading-relaxed space-y-4">
        <p>
          Hi there! I&apos;m Edmond, a passionate full stack engineer with a love for building innovative products.
          I enjoy going down the rabbit hole to understand how engineers create systems that feel seemless and intuitive but are actually a combination of complex and intricate systems working together in a cohesive manner.
        </p>
        
        <p>
          When I&apos;m not coding, you can find me exploring new technologies(A.K.A going back and forth with new AI agents), or learning about product design and user experience.
        </p>
        <p>I&apos;m always eager to connect with like-minded individuals at the intersection of techology, finance, and entrepreneurship, so feel free to reach out!</p>
      </div>

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
            <LinkedinIcon size={20} /> LinkedIn
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
