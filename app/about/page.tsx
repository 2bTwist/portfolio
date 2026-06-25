import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { profile } from "@/data/profile";
import { PageShell } from "@/components/site/PageShell";
import { HoverWord } from "@/components/site/HoverWord";
import { CopyEmail } from "@/components/site/CopyEmail";

export const metadata: Metadata = {
  title: "About - Edmond Ndanji",
  description: profile.blurb,
};

export default function AboutPage() {
  return (
    <PageShell width="wide">
      <h1 className="display text-4xl sm:text-5xl font-bold mb-8" style={{ color: "var(--text)" }}>
        About
      </h1>

      <div className="about-grid">
        <figure className="about-figure">
          <div className="about-portrait">
            <Image
              src="/images/portrait.jpg"
              alt="Edmond at the NSBE National Convention in Chicago, in front of Cloud Gate"
              width={1050}
              height={1400}
              sizes="(min-width: 768px) 380px, 100vw"
              priority
            />
          </div>
          <figcaption className="about-caption">
            <a className="txt-link" href="https://www.nsbe.org" target="_blank" rel="noreferrer noopener">
              NSBE
            </a>{" "}
            National Convention, Chicago
          </figcaption>
        </figure>

        <div className="about-prose">
          <p>
            I&apos;m a developer based in the US, originally from{" "}
            <HoverWord
              pop={
                // eslint-disable-next-line @next/next/no-img-element -- animated gif
                <img className="flag-pop" src="/images/cameroon-flag.gif" alt="Flag of Cameroon" width={84} height={55} />
              }
            >
              Cameroon
            </HoverWord>
            .
          </p>

          <p>
            What I care about most is a good product. Whether it&apos;s software or hardware, you can
            feel when something was made with intent, when real thought and effort went into getting
            it right. I&apos;ll happily talk about that kind of work for days, and sometimes I{" "}
            <Link href="/writing" className="hl-marker hl-link">
              write
            </Link>{" "}
            about it too.
          </p>

          <p>
            I build a lot of my own things, though most never make it online. I&apos;m a bit of a
            perfectionist and would rather ship nothing than ship something half-done. It&apos;s a
            habit I&apos;m slowly learning to let go of.
          </p>

          <p>
            Most of my work is about crafting systems that are reliable and intuitive. I spend a lot
            of time thinking about the intersection between product and engineering. Right now
            I&apos;m building another app focused on using AI agents to run a car rental business
            right from your phone, while responding to user complaints on my current one.
          </p>

          <p>
            Outside of programming, I play table tennis, so challenge me to a game whenever you see
            me, I&apos;m always down. I also play some chess. I picked it up during covid and got my
            rating up to 1362 on{" "}
            <a className="txt-link" href={profile.links.chess} target="_blank" rel="noreferrer noopener">
              chess.com
            </a>
            .
          </p>

          <p>
            My dream is to create opportunities and resources for kids back home, so the next ones
            like me don&apos;t have to leave their country just to build something cool.
          </p>

          <p>
            I&apos;m always open to a conversation about opportunities, project ideas, or your
            product. If you&apos;d like me to try something you&apos;re building, I&apos;m down. The
            best way to reach me is <CopyEmail email={profile.email} />.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
