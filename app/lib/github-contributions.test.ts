import { describe, expect, it } from "vitest";
import {
  buildContributionCalendar,
  parseGitHubContributions,
} from "./github-contributions";

const FIXTURE = `
  <div class="js-yearly-contributions">
    <h2>1,204 contributions in the last year</h2>
    <table>
      <tbody>
        <tr>
          <td data-level="0" data-date="2026-01-31" class="ContributionCalendar-day"></td>
          <tool-tip>No contributions on January 31st.</tool-tip>
          <td class="ContributionCalendar-day" data-date="2026-02-01" data-level="2"></td>
          <tool-tip>3 contributions on February 1st.</tool-tip>
          <td data-date="2026-02-02" class="ContributionCalendar-day" data-level="1"></td>
          <tool-tip>1 contribution on February 2nd.</tool-tip>
          <td data-date="2026-02-08" data-level="4" class="ContributionCalendar-day"></td>
          <tool-tip>12 contributions on February 8th.</tool-tip>
        </tr>
      </tbody>
    </table>
  </div>
`;

describe("parseGitHubContributions", () => {
  it("extracts the total and normalized day records from GitHub's public calendar", () => {
    const result = parseGitHubContributions(FIXTURE);

    expect(result.total).toBe(1204);
    expect(result.activeDays).toBe(3);
    expect(result.days).toEqual([
      { date: "2026-01-31", count: 0, level: 0 },
      { date: "2026-02-01", count: 3, level: 2 },
      { date: "2026-02-02", count: 1, level: 1 },
      { date: "2026-02-08", count: 12, level: 4 },
    ]);
  });

  it("rejects markup that no longer contains a contribution calendar", () => {
    expect(() => parseGitHubContributions("<html><body>changed</body></html>")).toThrow(
      "GitHub contribution markup did not contain a calendar",
    );
  });
});

describe("buildContributionCalendar", () => {
  it("groups days into Sunday-first weeks and labels month boundaries", () => {
    const parsed = parseGitHubContributions(FIXTURE);
    const calendar = buildContributionCalendar(parsed.days);

    expect(calendar.weeks).toHaveLength(3);
    expect(calendar.weeks[0].days[6]).toEqual({
      date: "2026-01-31",
      count: 0,
      level: 0,
    });
    expect(calendar.weeks[1].days[0]?.date).toBe("2026-02-01");
    expect(calendar.weeks[1].days[1]?.date).toBe("2026-02-02");
    expect(calendar.weeks[2].days[0]?.date).toBe("2026-02-08");
    expect(calendar.months).toEqual([{ label: "Feb", weekIndex: 1 }]);
  });
});
