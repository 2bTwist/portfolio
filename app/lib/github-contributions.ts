export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export type ContributionDay = {
  date: string;
  count: number;
  level: ContributionLevel;
};

export type ContributionWeek = {
  start: string;
  days: Array<ContributionDay | null>;
};

export type ContributionMonth = {
  label: string;
  weekIndex: number;
};

export type ParsedContributions = {
  total: number;
  activeDays: number;
  days: ContributionDay[];
};

export type ContributionCalendar = {
  weeks: ContributionWeek[];
  months: ContributionMonth[];
};

export type ContributionSnapshot = ParsedContributions & ContributionCalendar;

export type ContributionGridData = Omit<ContributionSnapshot, "days">;

const CONTRIBUTIONS_URL = "https://github.com/users/2bTwist/contributions";

function numberFrom(text: string): number {
  return Number.parseInt(text.replaceAll(",", ""), 10);
}

function dayCount(tooltip: string): number {
  const plainText = tooltip.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (/^No contributions\b/i.test(plainText)) return 0;

  const count = plainText.match(/([\d,]+) contributions?\b/i);
  if (!count) {
    throw new Error("GitHub contribution markup contained an unreadable day count");
  }
  return numberFrom(count[1]);
}

export function parseGitHubContributions(html: string): ParsedContributions {
  const totalMatch = html.match(/<h2\b[^>]*>\s*([\d,]+)\s*contributions?\b/i);
  const cellPattern =
    /<td\b(?=[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})")(?=[^>]*\bdata-level="([0-4])")(?=[^>]*\bclass="[^"]*ContributionCalendar-day[^"]*")[^>]*><\/td>\s*<tool-tip\b[^>]*>([\s\S]*?)<\/tool-tip>/gi;

  const byDate = new Map<string, ContributionDay>();
  for (const match of html.matchAll(cellPattern)) {
    const date = match[1];
    const level = Number.parseInt(match[2], 10) as ContributionLevel;
    byDate.set(date, { date, level, count: dayCount(match[3]) });
  }

  if (!totalMatch || byDate.size === 0) {
    throw new Error("GitHub contribution markup did not contain a calendar");
  }

  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    total: numberFrom(totalMatch[1]),
    activeDays: days.filter((day) => day.count > 0).length,
    days,
  };
}

function utcDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function sundayOf(date: Date): Date {
  const sunday = new Date(date);
  sunday.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return sunday;
}

export function buildContributionCalendar(days: ContributionDay[]): ContributionCalendar {
  if (days.length === 0) return { weeks: [], months: [] };

  const weeksByStart = new Map<string, ContributionWeek>();
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    const date = utcDate(day.date);
    const start = isoDate(sundayOf(date));
    const week = weeksByStart.get(start) ?? { start, days: Array<ContributionDay | null>(7).fill(null) };
    week.days[date.getUTCDay()] = day;
    weeksByStart.set(start, week);
  }

  const weeks = [...weeksByStart.values()].sort((a, b) => a.start.localeCompare(b.start));
  const weekIndexByStart = new Map(weeks.map((week, index) => [week.start, index]));
  const months: ContributionMonth[] = [];

  const first = utcDate(days[0].date);
  months.push({
    label: first.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
    weekIndex: 0,
  });

  for (const day of days) {
    const date = utcDate(day.date);
    if (date.getUTCDate() !== 1) continue;

    const weekIndex = weekIndexByStart.get(isoDate(sundayOf(date)));
    const label = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    if (weekIndex === undefined || months.some((month) => month.weekIndex === weekIndex)) continue;
    months.push({ label, weekIndex });
  }

  const readableMonths = months.filter((month, index) => {
    const next = months[index + 1];
    return !next || next.weekIndex - month.weekIndex >= 3;
  });

  return { weeks, months: readableMonths };
}

export async function fetchGitHubContributions(): Promise<ContributionSnapshot> {
  const response = await fetch(CONTRIBUTIONS_URL, {
    headers: {
      Accept: "text/html",
      "User-Agent": "eddyb.dev contribution calendar",
    },
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!response.ok) {
    throw new Error(`GitHub contributions request failed with ${response.status}`);
  }

  const parsed = parseGitHubContributions(await response.text());
  return { ...parsed, ...buildContributionCalendar(parsed.days) };
}
