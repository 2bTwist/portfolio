import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import portrait from "@/public/images/portrait.jpg";
import { profile } from "@/data/profile";
import { PageShell } from "@/components/site/PageShell";
import { HoverWord } from "@/components/site/HoverWord";
import { CopyEmail } from "@/components/site/CopyEmail";
import { CompanyLink } from "@/components/site/CompanyLink";
import { SocialLinks } from "@/components/site/SocialLinks";

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
              src={portrait}
              alt="Edmond at the NSBE National Convention in Chicago, in front of Cloud Gate"
              sizes="(min-width: 768px) 380px, 100vw"
              placeholder="blur"
              priority
            />
          </div>
          <figcaption className="about-caption">
            <a className="txt-link" href="https://www.nsbe.org" target="_blank" rel="noreferrer noopener">
              NSBE
            </a>{" "}
            National Convention, Chicago
          </figcaption>
          <SocialLinks className="about-socials" />
        </figure>

        <div className="about-prose">
          <p>
            I&apos;m a developer based in the US, originally from{" "}
            <HoverWord
              pop={
                // eslint-disable-next-line @next/next/no-img-element -- animated gif
                <img className="flag-pop" src="/images/cameroon-flag.gif" alt="Flag of Cameroon" width={84} height={55} loading="lazy" decoding="async" />
              }
            >
              Cameroon
            </HoverWord>
            .
          </p>

          <p>
            What I care about most is a good product. Whether it&apos;s software or hardware, you can
            feel when something was <strong>made with intent</strong>, when real thought and effort
            went into getting it right. I&apos;ll happily talk about that kind of work for days, and
            sometimes I{" "}
            <Link href="/writing" prefetch={false} className="hl-marker hl-link">
              write
            </Link>{" "}
            about it too.
          </p>

          <p>
            I build a lot of my own things, though most never make it online. I&apos;m a bit of a
            perfectionist and would <strong>rather ship nothing than ship something half-done</strong>.
            It&apos;s a habit I&apos;m slowly learning to let go of.
          </p>

          <p>
            Most of my work is about crafting systems that are <strong>reliable and intuitive</strong>.
            I spend a lot of time thinking about the intersection between product and engineering.
            Right now I&apos;m building another app focused on using{" "}
            <strong>AI agents to run a car rental business right from your phone</strong>, while also
            responding to user requests and complaints on{" "}
            <CompanyLink
              name="BeSeen"
              href="https://apps.apple.com/app/id6760330166"
              logo={
                // eslint-disable-next-line @next/next/no-img-element -- app icon
                <img className="company-logo company-logo--app" src="/images/beseen.webp" alt="BeSeen" width={56} height={56} />
              }
            />
            .
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
            My dream is to create <strong>opportunities and resources for kids back home</strong>, so
            the next ones like me don&apos;t have to leave their country just to build something cool.
          </p>

          <p>
            I&apos;m always open to a conversation about opportunities, project ideas, or your
            product. If you&apos;d like me to try something you&apos;re building, count me in. The
            best way to reach me is <CopyEmail email={profile.email} />.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
