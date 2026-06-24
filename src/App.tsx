import {
  AlertTriangle,
  BookOpen,
  Braces,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Database,
  Download,
  FileText,
  ListChecks,
  Play,
  RotateCcw,
  TerminalSquare,
  Upload,
} from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  AssignmentReport,
  DEFAULT_RUBRIC,
  ReferenceDocument,
  SAMPLE_ASSIGNMENT,
  SAMPLE_REFERENCE,
  parseRubric,
  runAssignmentChecks,
} from "./checker";

type Mode = "modern" | "legacy";

const rubricTemplate = JSON.stringify(DEFAULT_RUBRIC, null, 2);

const workflowSteps = [
  "Paste or load assignment text",
  "Confirm rubric JSON",
  "Add reference submissions",
  "Run checks",
  "Export review report",
];

const legacyCommand =
  "python assignment_checker.py --file submission_name.txt --rubric rubric.json --corpus-dir reference_corpus --output reports/submission_name_report.json";

function App() {
  const [mode, setMode] = useState<Mode>("modern");
  const [assignmentText, setAssignmentText] = useState(SAMPLE_ASSIGNMENT);
  const [rubricJson, setRubricJson] = useState(rubricTemplate);
  const [manualReference, setManualReference] = useState(SAMPLE_REFERENCE);
  const [references, setReferences] = useState<ReferenceDocument[]>([
    { name: "sample-reference.txt", text: SAMPLE_REFERENCE },
  ]);
  const [report, setReport] = useState<AssignmentReport>(() =>
    runAssignmentChecks({
      assignmentText: SAMPLE_ASSIGNMENT,
      rubric: DEFAULT_RUBRIC,
      references: [{ name: "sample-reference.txt", text: SAMPLE_REFERENCE }],
    }),
  );
  const [rubricError, setRubricError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const assignmentInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const reportJson = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const passingChecks = report.checks.filter((check) => check.passed).length;
  const statusLabel = report.score === 100 ? "Ready" : report.score >= 70 ? "Review" : "Needs attention";

  function runChecks() {
    const parsed = parseRubric(rubricJson);
    if (!parsed.rubric) {
      setRubricError(parsed.error ?? "Rubric JSON is not valid.");
      return;
    }

    setRubricError(null);
    const manualReferenceEntry =
      manualReference.trim().length > 0
        ? [{ name: "manual-reference.txt", text: manualReference }]
        : [];
    setReport(
      runAssignmentChecks({
        assignmentText,
        rubric: parsed.rubric,
        references: [...references, ...manualReferenceEntry],
      }),
    );
  }

  async function readAssignmentFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAssignmentText(await file.text());
    event.target.value = "";
  }

  async function readReferenceFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const loaded = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        text: await file.text(),
      })),
    );
    setReferences((current) => [...current, ...loaded]);
    event.target.value = "";
  }

  function resetSample() {
    setAssignmentText(SAMPLE_ASSIGNMENT);
    setRubricJson(rubricTemplate);
    setManualReference(SAMPLE_REFERENCE);
    setReferences([{ name: "sample-reference.txt", text: SAMPLE_REFERENCE }]);
    setRubricError(null);
    setReport(
      runAssignmentChecks({
        assignmentText: SAMPLE_ASSIGNMENT,
        rubric: DEFAULT_RUBRIC,
        references: [{ name: "sample-reference.txt", text: SAMPLE_REFERENCE }],
      }),
    );
  }

  function downloadReport() {
    const blob = new Blob([reportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "assignment-check-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyReport() {
    await navigator.clipboard.writeText(reportJson);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h1>Assignment Checker</h1>
            <p>Rule-based first-pass review</p>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="segmented" aria-label="Interface mode">
            <button
              className={mode === "modern" ? "active" : ""}
              type="button"
              onClick={() => setMode("modern")}
            >
              <ListChecks size={16} />
              Modern
            </button>
            <button
              className={mode === "legacy" ? "active" : ""}
              type="button"
              onClick={() => setMode("legacy")}
            >
              <TerminalSquare size={16} />
              Legacy CLI
            </button>
          </div>
          <button className="primary-action" type="button" onClick={runChecks}>
            <Play size={17} />
            Run checks
          </button>
        </div>
      </header>

      {mode === "modern" ? (
        <main className="workspace" aria-label="Assignment checker workspace">
          <section className="input-column">
            <Panel
              icon={<FileText size={18} />}
              title="Assignment text"
              actions={
                <>
                  <input
                    ref={assignmentInputRef}
                    accept=".txt,text/plain"
                    className="file-input-hidden"
                    type="file"
                    tabIndex={-1}
                    onChange={readAssignmentFile}
                  />
                  <IconButton
                    label="Load text file"
                    onClick={() => assignmentInputRef.current?.click()}
                  >
                    <Upload size={16} />
                  </IconButton>
                </>
              }
            >
              <textarea
                className="assignment-editor"
                aria-label="Assignment text"
                value={assignmentText}
                onChange={(event) => setAssignmentText(event.target.value)}
                spellCheck="true"
              />
            </Panel>

            <div className="lower-grid">
              <Panel
                icon={<Braces size={18} />}
                title="Rubric JSON"
                actions={
                  <IconButton label="Reset rubric" onClick={() => setRubricJson(rubricTemplate)}>
                    <RotateCcw size={16} />
                  </IconButton>
                }
              >
                <textarea
                  className="rubric-editor"
                  aria-label="Rubric JSON"
                  value={rubricJson}
                  onChange={(event) => setRubricJson(event.target.value)}
                  spellCheck="false"
                />
                {rubricError ? <p className="field-error">{rubricError}</p> : null}
              </Panel>

              <Panel
                icon={<Database size={18} />}
                title="Reference corpus"
                actions={
                  <>
                    <input
                      ref={referenceInputRef}
                      accept=".txt,text/plain"
                      className="file-input-hidden"
                      multiple
                      type="file"
                      tabIndex={-1}
                      onChange={readReferenceFiles}
                    />
                    <IconButton
                      label="Add reference files"
                      onClick={() => referenceInputRef.current?.click()}
                    >
                      <Upload size={16} />
                    </IconButton>
                  </>
                }
              >
                <textarea
                  className="reference-editor"
                  aria-label="Manual reference submission"
                  value={manualReference}
                  onChange={(event) => setManualReference(event.target.value)}
                  spellCheck="true"
                />
                <div className="reference-list" aria-label="Loaded reference files">
                  {references.map((reference, index) => (
                    <span key={`${reference.name}-${index}`}>{reference.name}</span>
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <aside className="results-column" aria-label="Assignment check results">
            <section className="score-panel">
              <div className="score-ring" style={{ "--score": report.score } as React.CSSProperties}>
                <span>{report.score}%</span>
              </div>
              <div>
                <p className="eyebrow">{statusLabel}</p>
                <h2>
                  {passingChecks}/{report.checks.length} checks passed
                </h2>
                <p className="muted">
                  {report.wordCount} words · {report.referenceCount} reference source
                  {report.referenceCount === 1 ? "" : "s"}
                </p>
              </div>
            </section>

            <section className="check-list" aria-label="Check details">
              {report.checks.map((check) => (
                <article className="check-row" key={check.id}>
                  <div className={check.passed ? "status-icon pass" : "status-icon fail"}>
                    {check.passed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div>
                    <h3>{check.name}</h3>
                    <p>{check.detail}</p>
                  </div>
                  <strong>{check.value}</strong>
                </article>
              ))}
            </section>

            <section className="report-panel">
              <div className="panel-heading compact">
                <div>
                  <BookOpen size={18} />
                  <h2>Report JSON</h2>
                </div>
                <div className="report-actions">
                  <IconButton label={copyState === "copied" ? "Copied" : "Copy report"} onClick={copyReport}>
                    <Copy size={16} />
                  </IconButton>
                  <IconButton label="Download report" onClick={downloadReport}>
                    <Download size={16} />
                  </IconButton>
                </div>
              </div>
              <pre>{reportJson}</pre>
            </section>

            <section className="workflow-rail" aria-label="Review workflow">
              {workflowSteps.map((step, index) => (
                <div key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </section>
          </aside>
        </main>
      ) : (
        <main className="legacy-view" aria-label="Legacy command line workflow">
          <section className="legacy-panel">
            <div className="legacy-copy">
              <TerminalSquare size={24} />
              <h2>Original Python CLI</h2>
              <p>
                The imported student workflow is preserved in <code>legacy/assignment_checker.py</code>
                with the original README beside it.
              </p>
            </div>
            <div className="command-strip">
              <code>{legacyCommand}</code>
            </div>
            <div className="legacy-grid">
              <div>
                <h3>Original checks</h3>
                <ul>
                  <li>Word count range</li>
                  <li>Required sections</li>
                  <li>APA-style citations</li>
                  <li>Similarity against a reference corpus</li>
                  <li>Grammar heuristics</li>
                  <li>Optional Claude feedback with <code>ANTHROPIC_API_KEY</code></li>
                </ul>
              </div>
              <div>
                <h3>Web app difference</h3>
                <ul>
                  <li>Runs in the browser with no server secret exposure</li>
                  <li>Exports the same review shape as JSON</li>
                  <li>Uses local text/file inputs instead of folder paths</li>
                  <li>Keeps AI feedback disabled until a backend is added</li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        <button className="text-button" type="button" onClick={resetSample}>
          Reset sample data
        </button>
        <span>Adapted from samman41/student--assignment-checker</span>
      </footer>
    </div>
  );
}

type PanelProps = {
  icon: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function Panel({ icon, title, actions, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

type IconButtonProps = {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

export default App;
