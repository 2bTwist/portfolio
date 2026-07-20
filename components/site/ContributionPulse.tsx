"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ContributionGridData } from "@/app/lib/github-contributions";
import { bundledGitHubContributions } from "@/data/github-contributions";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function isContributionGridData(value: unknown): value is ContributionGridData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ContributionGridData>;
  return (
    typeof candidate.total === "number" &&
    typeof candidate.activeDays === "number" &&
    Array.isArray(candidate.weeks) &&
    Array.isArray(candidate.months)
  );
}

export function ContributionPulse({
  initialData = bundledGitHubContributions,
}: {
  initialData?: ContributionGridData;
}) {
  const [data, setData] = useState<ContributionGridData>(initialData);
  const [isRevealed, setIsRevealed] = useState(false);
  const [animationRun, setAnimationRun] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivity() {
      try {
        const response = await fetch("/api/github-contributions", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`GitHub activity request failed: ${response.status}`);

        const snapshot: unknown = await response.json();
        if (!isContributionGridData(snapshot)) throw new Error("Invalid GitHub activity response");

        setData(snapshot);
      } catch {
        if (controller.signal.aborted) return;
        // Keep the bundled snapshot visible when the background refresh fails.
      }
    }

    void loadActivity();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isRevealed) return;
    if (!("IntersectionObserver" in window)) {
      setIsRevealed(true);
      return;
    }

    let observer: IntersectionObserver | null = null;
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsRevealed(true);
        observer?.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer?.disconnect();
  }, [isRevealed]);

  const summary = `${data.total.toLocaleString("en-US")} GitHub contributions across ${data.activeDays.toLocaleString("en-US")} active days in the last year.`;

  return (
    <section className="contribution-pulse mt-14" ref={sectionRef} aria-label="GitHub contributions">
      <div className="pulse-toolbar">
        <div className="pulse-head-actions">
          <span className="pulse-total mono">{data.total.toLocaleString("en-US")} contributions</span>
          <button
            className="pulse-replay mono"
            type="button"
            onClick={() => setAnimationRun((run) => run + 1)}
            aria-label="Replay contribution animation"
          >
            <span aria-hidden="true">↻</span> Replay
          </button>
        </div>
      </div>

      <p className="sr-only">{summary}</p>
      <div className="pulse-grid" aria-label="GitHub contribution graph">
              <div
                key={animationRun}
                className={`pulse-canvas${isRevealed ? " is-revealed" : ""}`}
                style={{ "--week-count": data.weeks.length } as CSSProperties}
                aria-hidden="true"
              >
                <div className="pulse-months mono">
                  {data.months.map((month) => (
                    <span key={`${month.label}-${month.weekIndex}`} style={{ gridColumnStart: month.weekIndex + 1 }}>
                      {month.label}
                    </span>
                  ))}
                </div>
                <div className="pulse-graph-row">
                  <div className="pulse-weekdays mono">
                    <span style={{ gridRow: 2 }}>Mon</span>
                    <span style={{ gridRow: 4 }}>Wed</span>
                    <span style={{ gridRow: 6 }}>Fri</span>
                  </div>
                  <div className="pulse-weeks">
                    {data.weeks.map((week, weekIndex) => (
                      <div className="pulse-week" key={week.start}>
                        {week.days.map((day, dayIndex) => {
                          if (!day) return <span className="pulse-day is-empty" key={`empty-${dayIndex}`} />;
                          const countLabel = day.count === 1 ? "1 contribution" : `${day.count} contributions`;
                          return (
                            <span
                              className={`pulse-day pulse-day--level-${day.level}`}
                              data-contribution-day={day.date}
                              key={day.date}
                              title={`${countLabel} on ${dateFormatter.format(new Date(`${day.date}T00:00:00Z`))}`}
                              style={{
                                "--pulse-delay": `${weekIndex * 20 + dayIndex * 5}ms`,
                              } as CSSProperties}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
      </div>
      <span className="pulse-legend mono" aria-hidden="true">
        less
        {[0, 1, 2, 3, 4].map((level) => (
          <span className={`pulse-day pulse-day--level-${level}`} key={level} />
        ))}
        more
      </span>
    </section>
  );
}
