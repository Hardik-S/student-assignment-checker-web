export type CheckId = "word-count" | "sections" | "citations" | "similarity" | "grammar";

export type CheckResult = {
  id: CheckId;
  name: string;
  passed: boolean;
  detail: string;
  value?: string;
};

export type Rubric = {
  min_words: number;
  max_words: number;
  required_sections: string[];
  min_citations: number;
  similarity_threshold: number;
};

export type ReferenceDocument = {
  name: string;
  text: string;
};

export type AssignmentReport = {
  generatedAt: string;
  score: number;
  wordCount: number;
  checks: CheckResult[];
  rubric: Rubric;
  referenceCount: number;
  aiFeedback: string | null;
};

export const DEFAULT_RUBRIC: Rubric = {
  min_words: 150,
  max_words: 800,
  required_sections: ["Introduction", "Body", "Conclusion"],
  min_citations: 1,
  similarity_threshold: 0.35,
};

export const SAMPLE_ASSIGNMENT = `Introduction
Technology can support learning when it is used with a clear goal. In my class, feedback tools helped me notice mistakes before submitting work.

Body
The most useful part was seeing patterns in my writing. For example, I sometimes wrote long sentences that made my argument harder to follow. A checker does not replace a teacher, but it can help a student revise earlier in the process. Research on formative feedback also shows that quick review cycles can improve revision habits (Hattie, 2009).

Conclusion
Overall, assignment checking tools should be used as a first-pass support system. They are best when they point out issues and still leave the final judgment to a human reader.`;

export const SAMPLE_REFERENCE = `Introduction
Technology can support learning when it is used with a clear goal. In my class, feedback tools helped me notice mistakes before submitting work.

Body
The most useful part was seeing patterns in my writing. For example, I sometimes wrote long sentences that made my argument harder to follow. A checker does not replace a teacher, but it can help a student revise earlier in the process.

Conclusion
Overall, assignment checking tools should be used as a first-pass support system.`;

export function countWords(text: string): number {
  return text.match(/\b\w+\b/g)?.length ?? 0;
}

export function parseRubric(rubricJson: string): { rubric?: Rubric; error?: string } {
  try {
    const parsed = JSON.parse(rubricJson) as Partial<Rubric>;
    const rubric: Rubric = {
      min_words: toNumber(parsed.min_words, DEFAULT_RUBRIC.min_words),
      max_words: toNumber(parsed.max_words, DEFAULT_RUBRIC.max_words),
      required_sections: Array.isArray(parsed.required_sections)
        ? parsed.required_sections.map(String).filter(Boolean)
        : DEFAULT_RUBRIC.required_sections,
      min_citations: toNumber(parsed.min_citations, DEFAULT_RUBRIC.min_citations),
      similarity_threshold: toNumber(
        parsed.similarity_threshold,
        DEFAULT_RUBRIC.similarity_threshold,
      ),
    };

    if (rubric.min_words < 0 || rubric.max_words < rubric.min_words) {
      return { error: "Word count bounds are invalid." };
    }

    if (rubric.similarity_threshold <= 0 || rubric.similarity_threshold >= 1) {
      return { error: "Similarity threshold must be between 0 and 1." };
    }

    return { rubric };
  } catch {
    return { error: "Rubric JSON is not valid." };
  }
}

export function runAssignmentChecks(params: {
  assignmentText: string;
  rubric: Rubric;
  references: ReferenceDocument[];
}): AssignmentReport {
  const { assignmentText, rubric, references } = params;
  const checks = [
    checkWordCount(assignmentText, rubric),
    checkRequiredSections(assignmentText, rubric),
    checkCitations(assignmentText, rubric),
    checkSimilarity(assignmentText, references, rubric.similarity_threshold),
    checkGrammarHeuristics(assignmentText),
  ];
  const score = computeScore(checks);

  return {
    generatedAt: new Date().toISOString(),
    score,
    wordCount: countWords(assignmentText),
    checks,
    rubric,
    referenceCount: references.filter((reference) => reference.text.trim()).length,
    aiFeedback: null,
  };
}

export function computeScore(checks: CheckResult[]): number {
  if (checks.length === 0) return 0;
  const passed = checks.filter((check) => check.passed).length;
  return Number(((100 * passed) / checks.length).toFixed(1));
}

function checkWordCount(text: string, rubric: Rubric): CheckResult {
  const words = countWords(text);
  const passed = words >= rubric.min_words && words <= rubric.max_words;

  return {
    id: "word-count",
    name: "Word count",
    passed,
    detail: `${words} words; expected ${rubric.min_words}-${rubric.max_words}.`,
    value: String(words),
  };
}

function checkRequiredSections(text: string, rubric: Rubric): CheckResult {
  const normalized = text.toLowerCase();
  const missing = rubric.required_sections.filter(
    (section) => !normalized.includes(section.toLowerCase()),
  );

  return {
    id: "sections",
    name: "Required sections",
    passed: missing.length === 0,
    detail: missing.length === 0 ? "All required sections found." : `Missing: ${missing.join(", ")}.`,
    value: missing.length === 0 ? "Complete" : `${missing.length} missing`,
  };
}

function checkCitations(text: string, rubric: Rubric): CheckResult {
  const citationPattern = /\([A-Z][A-Za-z-]+(?:\s(?:&|and)\s[A-Z][A-Za-z-]+)?,?\s\d{4}\)/g;
  const matches = text.match(citationPattern) ?? [];
  const passed = matches.length >= rubric.min_citations;

  return {
    id: "citations",
    name: "Citations (APA-style)",
    passed,
    detail: `Found ${matches.length}; required at least ${rubric.min_citations}.`,
    value: String(matches.length),
  };
}

function checkSimilarity(
  text: string,
  references: ReferenceDocument[],
  threshold: number,
): CheckResult {
  const usableReferences = references.filter((reference) => reference.text.trim().length > 0);
  if (usableReferences.length === 0) {
    return {
      id: "similarity",
      name: "Similarity check",
      passed: true,
      detail: "Skipped because no reference corpus was provided.",
      value: "Skipped",
    };
  }

  const similarities = usableReferences.map((reference) => ({
    name: reference.name,
    ratio: textSimilarity(text, reference.text),
  }));
  const best = similarities.reduce((currentBest, candidate) =>
    candidate.ratio > currentBest.ratio ? candidate : currentBest,
  );

  return {
    id: "similarity",
    name: "Similarity check",
    passed: best.ratio < threshold,
    detail: `Highest similarity ${(best.ratio * 100).toFixed(0)}% vs "${best.name}" (threshold ${(
      threshold * 100
    ).toFixed(0)}%).`,
    value: `${(best.ratio * 100).toFixed(0)}%`,
  };
}

function checkGrammarHeuristics(text: string): CheckResult {
  const issues: string[] = [];
  const sentences = text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const longSentences = sentences.filter((sentence) => countWords(sentence) > 40);
  const repeatedWords = Array.from(text.matchAll(/\b(\w+)\s+\1\b/gi)).map((match) =>
    match[1].toLowerCase(),
  );
  const uniqueRepeats = Array.from(new Set(repeatedWords)).sort();

  if (longSentences.length > 0) {
    issues.push(`${longSentences.length} sentence(s) over 40 words`);
  }
  if (uniqueRepeats.length > 0) {
    issues.push(`Repeated word(s): ${uniqueRepeats.join(", ")}`);
  }

  return {
    id: "grammar",
    name: "Grammar heuristics",
    passed: issues.length === 0,
    detail: issues.length === 0 ? "No issues found." : issues.join("; "),
    value: issues.length === 0 ? "Clear" : `${issues.length} issue type(s)`,
  };
}

function textSimilarity(a: string, b: string): number {
  const first = shingles(tokenize(a), 5);
  const second = shingles(tokenize(b), 5);
  if (first.size === 0 || second.size === 0) return 0;

  let overlap = 0;
  for (const shingle of first) {
    if (second.has(shingle)) overlap += 1;
  }
  const union = new Set([...first, ...second]).size;
  return union === 0 ? 0 : overlap / union;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b[\w']+\b/g) ?? [];
}

function shingles(words: string[], size: number): Set<string> {
  if (words.length === 0) return new Set();
  if (words.length < size) return new Set([words.join(" ")]);

  const result = new Set<string>();
  for (let index = 0; index <= words.length - size; index += 1) {
    result.add(words.slice(index, index + size).join(" "));
  }
  return result;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
