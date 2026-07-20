import type {
  ContributionGridData,
  ContributionLevel,
  ContributionWeek,
} from "@/app/lib/github-contributions";

// Compact last-known-good snapshot. The client renders this immediately, then
// refreshes it from the cached API without ever blocking the graph on network.
const LEVELS =
  "000000000000000000001100000100011110110111000100000110100000000110000011110001000000001111111001011001010001110110111111011111101111011110010100000000011000001111100000111111000000001100001011000011101111011111111111211111110101110111111121111101011111112101111112111111111121111101111101110111111110122010000111233112231101233211221423121241022111111121111111100220xxxxx";
const COUNTS =
  "0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,9,0,0,0,0,0,4,0,0,0,1,3,1,1,0,5,3,0,3,5,4,0,0,0,6,0,0,0,0,0,4,15,0,1,0,0,0,0,0,0,0,0,4,1,0,0,0,0,0,18,7,7,1,0,0,0,4,0,0,0,0,0,0,0,0,4,11,2,6,5,7,8,0,0,5,0,1,4,0,0,2,0,1,0,0,0,12,13,9,0,1,7,0,2,13,2,11,4,2,0,3,5,3,11,6,1,0,10,9,14,1,0,13,8,3,4,0,0,3,0,1,0,0,0,0,0,0,0,0,0,10,6,0,0,0,0,0,11,1,12,1,2,0,0,0,0,0,1,2,2,3,1,1,0,0,0,0,0,0,0,0,1,2,0,0,0,0,1,0,1,2,0,0,0,0,1,6,5,0,8,5,3,1,0,10,10,6,1,12,4,5,7,3,5,15,21,10,4,3,2,7,14,1,0,4,0,5,6,1,0,5,6,11,3,12,7,13,22,12,12,2,1,4,0,7,0,3,4,7,5,17,2,7,30,3,0,3,4,19,19,1,2,26,7,1,6,5,1,20,6,5,8,2,40,5,2,2,8,3,0,4,7,3,11,18,0,1,2,2,0,14,5,4,19,8,14,19,1,0,9,25,24,0,4,0,0,0,0,3,18,7,33,43,50,16,14,34,28,53,7,14,0,2,36,44,57,23,3,17,35,28,4,81,36,53,5,21,14,21,74,11,0,31,40,1,11,6,11,1,7,18,25,16,6,3,9,18,10,8,1,0,0,29,37,0,x,x,x,x,x";

const countValues = COUNTS.split(",");
const firstDay = new Date("2025-07-20T00:00:00Z");

function dateAt(index: number): string {
  const date = new Date(firstDay);
  date.setUTCDate(firstDay.getUTCDate() + index);
  return date.toISOString().slice(0, 10);
}

const weeks: ContributionWeek[] = Array.from(
  { length: Math.ceil(LEVELS.length / 7) },
  (_, weekIndex) => ({
    start: dateAt(weekIndex * 7),
    days: Array.from({ length: 7 }, (_, dayIndex) => {
      const index = weekIndex * 7 + dayIndex;
      const level = LEVELS[index];
      if (!level || level === "x") return null;
      return {
        date: dateAt(index),
        level: Number.parseInt(level, 10) as ContributionLevel,
        count: Number.parseInt(countValues[index], 10),
      };
    }),
  }),
);

export const bundledGitHubContributions: ContributionGridData = {
  total: 2351,
  activeDays: 228,
  months: [
    { label: "Aug", weekIndex: 1 },
    { label: "Sep", weekIndex: 6 },
    { label: "Oct", weekIndex: 10 },
    { label: "Nov", weekIndex: 14 },
    { label: "Dec", weekIndex: 19 },
    { label: "Jan", weekIndex: 23 },
    { label: "Feb", weekIndex: 28 },
    { label: "Mar", weekIndex: 32 },
    { label: "Apr", weekIndex: 36 },
    { label: "May", weekIndex: 40 },
    { label: "Jun", weekIndex: 45 },
    { label: "Jul", weekIndex: 49 },
  ],
  weeks,
};
