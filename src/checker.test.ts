import { describe, expect, it } from "vitest";
import {
  DEFAULT_RUBRIC,
  SAMPLE_ASSIGNMENT,
  SAMPLE_REFERENCE,
  computeScore,
  countWords,
  parseRubric,
  runAssignmentChecks,
} from "./checker";

describe("assignment checker", () => {
  it("counts words using the same broad rule as the original Python script", () => {
    expect(countWords("One, two-three four.")).toBe(4);
  });

  it("flags a short assignment with missing sections and no citation", () => {
    const report = runAssignmentChecks({
      assignmentText: "This is too short and has no required headings.",
      rubric: DEFAULT_RUBRIC,
      references: [],
    });

    expect(report.score).toBeLessThan(100);
    expect(report.checks.find((check) => check.id === "word-count")?.passed).toBe(false);
    expect(report.checks.find((check) => check.id === "sections")?.passed).toBe(false);
    expect(report.checks.find((check) => check.id === "citations")?.passed).toBe(false);
  });

  it("detects high overlap with a reference submission", () => {
    const report = runAssignmentChecks({
      assignmentText: SAMPLE_ASSIGNMENT,
      rubric: DEFAULT_RUBRIC,
      references: [{ name: "sample-reference.txt", text: SAMPLE_REFERENCE }],
    });

    expect(report.checks.find((check) => check.id === "similarity")?.passed).toBe(false);
  });

  it("parses valid rubric JSON and rejects invalid thresholds", () => {
    expect(parseRubric(JSON.stringify(DEFAULT_RUBRIC)).rubric).toEqual(DEFAULT_RUBRIC);
    expect(parseRubric('{ "similarity_threshold": 1.2 }').error).toMatch(/Similarity/);
  });

  it("computes percentage score from passed checks", () => {
    expect(
      computeScore([
        { id: "word-count", name: "A", passed: true, detail: "" },
        { id: "sections", name: "B", passed: false, detail: "" },
      ]),
    ).toBe(50);
  });
});
