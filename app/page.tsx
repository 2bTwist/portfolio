import { Github, Mail, Linkedin as LinkedinIcon } from "lucide-react";
import { SkillsSection } from "@/components/SkillsSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { ProjectsSection } from "@/components/ProjectsSection";

export default function HomePage() {
  return (
    <div className="max-w-5xl">

      {/* Header with name + icons */}
      <div className="flex items-center gap-6 mb-4">
        <h1
          className="text-5xl tracking-wide"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          EDMOND NDANJI
        </h1>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/2bTwist"
            className="hover:opacity-70"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <Github size={22} />
          </a>

          <a
            href="https://linkedin.com/in/edmond-batch"
            className="hover:opacity-70"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <LinkedinIcon size={22} />
          </a>

          <a
            href="mailto:ndanjiedmond@gmail.com"
            className="hover:opacity-70"
            aria-label="Email"
          >
            <Mail size={22} />
          </a>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-xl mb-2">
        Software Engineer & Product Enthusiast
      </p>

      {/* Bio */}
      <div className="text-zinc-600 dark:text-zinc-400 max-w-5xl leading-relaxed space-y-4">
      <p> Hi there! I&apos;m Edmond, a passionate full-stack engineer with a love for building innovative products. I enjoy going down the rabbit hole to understand how engineers create systems that feel seamless and intuitive, but are actually made up of complex and intricate parts working together in a cohesive way. </p> 
      <p> When I&apos;m not coding, you&apos;ll probably find me exploring new technologies (A.K.A. going back and forth with new AI agents) or diving into product design and user experience. </p> 
      <p> I&apos;m always excited to connect with like-minded people at the intersection of technology, finance, and entrepreneurship, so feel free to reach out! </p>
      </div>

      <SkillsSection />
      <ExperienceSection />
      <ProjectsSection />
    </div>
  );
}
