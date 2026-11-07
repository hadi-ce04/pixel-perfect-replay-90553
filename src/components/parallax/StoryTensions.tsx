import { ArrowUpRight, GitCompareArrows, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { perspectiveOf } from "@/data/catalog";
import { analyzeEvidence, type EvidenceAnalysis } from "@/lib/analysis";
import { excerptWindow, findTerm as findFirst } from "@/lib/text";
import { Highlight } from "./Highlight";
import { useStore } from "@/lib/store";
import { formatDate, formatTime, formatTimeRange } from "@/lib/format";
import {
  buildTensionComparison,
  comparisonThemes,
  eligibleTensionRecords,
  suggestTensionPair,
  suggestedEvidenceIndices,
  defaultEvidenceIndex,
} from "@/lib/tensions";
import type { VideoRecord } from "@/lib/types";
import { SaveButton } from "./SaveButton";
import { comparePassages, type AiComparison, type AiPassage } from "@/lib/ai-analysis";
import { useAiComparison } from "@/lib/useAiAnalysis";
import { AiCitations, AiProvenance, RELATIONSHIP_TEXT } from "./AiCitations";
import "./StoryTensions.css";

export function StoryTensions({
  records,
  initialThemeId,
  onOpenBrief,
  analysis: given,
}: {
  records: VideoRecord[];
  initialThemeId?: string | undefined;
  onOpenBrief: () => void;
  analysis?: EvidenceAnalysis;
}) {
  const { query } = useStore();
  const analysis = useMemo(
    () => given ?? analyzeEvidence(query, records),
    [given, query, records],
  );
  const themes = comparisonThemes(records, analysis);
  const preferred =
    initialThemeId && themes.includes(initialThemeId)
      ? initialThemeId
      : themes.includes("guarantor")
        ? "guarantor"
        : themes[0];
  const [chosenTheme, setChosenTheme] = useState(preferred ?? "");
  const themeId = themes.includes(chosenTheme) ? chosenTheme : (preferred ?? "");
  if (!themeId)
    return (
      <section className="tensions-empty" aria-label="Story Tensions">
        <h2>Start with two connected records.</h2>
        <p>
          This search needs at least two distinct records with evidence and a shared theme. Broaden
          the search or clear filters to make a comparison.
        </p>
      </section>
    );
  return (
    <section className="tensions-workbench" aria-label="Story Tensions">
      <div className="tensions-intro">
        <div>
          <h2>
            The story between
            <br />
            two accounts.
          </h2>
          <p>Put two passages in context. Find the question worth reporting.</p>
        </div>
        <label className="tensions-theme-label">
          Shared theme
          <select
            aria-label="Comparison theme"
            value={themeId}
            onChange={(e) => setChosenTheme(e.target.value)}
          >
            {themes.map((id) => (
              <option key={id} value={id}>
                {analysis.byId[id]?.label ?? id} ({eligibleTensionRecords(records, id, analysis).length}{" "}
                records)
              </option>
            ))}
          </select>
        </label>
      </div>
      <Comparison
        key={themeId}
        records={records}
        themeId={themeId}
        analysis={analysis}
        onOpenBrief={onOpenBrief}
      />
    </section>
  );
}

function Comparison({
  records,
  themeId,
  analysis,
  onOpenBrief,
}: {
  records: VideoRecord[];
  themeId: string;
  analysis: EvidenceAnalysis;
  onOpenBrief: () => void;
}) {
  const { query, saved, reportingLead, chooseReportingLead, openRecord } = useStore();
  const theme = analysis.byId[themeId];
  const suggested = suggestTensionPair(records, themeId, analysis)!;
  const [selectedIds, setSelectedIds] = useState<[string, string]>(suggested);
  const [selectedIndices, setSelectedIndices] = useState<[number, number]>(() =>
    suggestedEvidenceIndices(records, themeId, suggested, analysis),
  );
  const eligible = eligibleTensionRecords(records, themeId, analysis);
  const supporting = (recordId: string) =>
    new Set(
      (theme?.supports ?? [])
        .filter((s) => s.recordId === recordId && s.field === "evidence")
        .map((s) => s.evidenceIndex),
    );
  // Results may change while the workbench is open. Never retain an out-of-scope pair.
  const validIds = selectedIds.every((id) => eligible.some((r) => r.id === id));
  const ids = validIds ? selectedIds : suggested;
  const indices = validIds
    ? selectedIndices
    : suggestedEvidenceIndices(records, themeId, suggested, analysis);
  const comparison = buildTensionComparison(records, themeId, ids, indices, analysis);
  if (!comparison)
    return (
      <p role="status" className="p-6 text-sm">
        These excerpts are no longer available. Select another theme to compare its current
        evidence.
      </p>
    );
  const used =
    reportingLead?.researchQuestion === query &&
    reportingLead.themeId === themeId &&
    ids.every((id) => saved.includes(id)) &&
    reportingLead.recordIds.every((id, i) => id === ids[i]) &&
    reportingLead.evidenceIndices.every((index, i) => index === indices[i]) &&
    reportingLead.excerptTexts.every(
      (text, i) => text === [comparison.left, comparison.right][i]!.evidence.excerpt,
    );
  const choose = (question: string, ai?: AiComparison) =>
    chooseReportingLead({
      themeId,
      ...(theme
        ? { theme: { id: theme.id, kind: theme.kind, label: theme.label, terms: theme.terms } }
        : {}),
      researchQuestion: query,
      recordIds: ids,
      evidenceIndices: indices,
      excerptTexts: [comparison.left.evidence.excerpt, comparison.right.evidence.excerpt],
      question,
      ...(ai ? { ai } : {}),
    });
  const changeRecord = (side: number, id: string) => {
    const next = [...ids] as [string, string];
    next[side] = id;
    const nextIndices = [...indices] as [number, number];
    nextIndices[side] = defaultEvidenceIndex(eligible.find((r) => r.id === id)!, theme);
    setSelectedIds(next);
    setSelectedIndices(nextIndices);
  };
  return (
    <>
      <div className="tensions-pair-note">
        <span className="tensions-connection" aria-hidden="true">
          A <span>↔</span> B
        </span>
        <p>
          {comparison.differentPerspectives
            ? "Different perspective labels. Shared theme."
            : "Shared perspective label. Different accounts."}
          <small>Suggested from record tags. Choose either source and excerpt below.</small>
        </p>
        <span className="tensions-mode">
          {[comparison.left, comparison.right].every((r) => r.record.dataMode === "mock")
            ? "Fictional evidence"
            : "Source evidence"}
        </span>
      </div>
      <div className="tensions-sources">
        {[comparison.left, comparison.right].map((reference, side) => (
          <article
            className="tensions-source"
            key={side}
            aria-label={`Evidence ${side === 0 ? "A" : "B"}`}
          >
            <div className="tensions-source-top">
              <span className="tensions-letter">{side === 0 ? "A" : "B"}</span>
              <span>{perspectiveOf(reference.record.perspective).label}</span>
              <span className="ml-auto font-mono">{reference.record.id}</span>
            </div>
            <label className="tensions-select-label">
              Source record
              <select
                aria-label={`Source ${side === 0 ? "A" : "B"}`}
                value={reference.record.id}
                onChange={(e) => changeRecord(side, e.target.value)}
              >
                {eligible
                  .filter((r) => r.id !== ids[side === 0 ? 1 : 0])
                  .map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.title}
                    </option>
                  ))}
              </select>
            </label>
            <p className="tensions-source-context">
              {reference.record.creatorLabel}
              <br />
              {reference.record.platform} · {formatDate(reference.record.publishedAt)}
            </p>
            <label className="tensions-select-label">
              Passage
              <select
                aria-label={`Excerpt ${side === 0 ? "A" : "B"}`}
                value={reference.index}
                onChange={(e) => {
                  const next = [...indices] as [number, number];
                  next[side] = Number(e.target.value);
                  setSelectedIndices(next);
                }}
              >
                {reference.record.evidence.map((e, index) =>
                  e.excerpt.trim() ? (
                    <option value={index} key={index}>
                      {formatTimeRange(e.startSeconds, e.endSeconds)} / {e.modality}
                      {theme?.terms.length && supporting(reference.record.id).has(index)
                        ? ` / contains “${theme.label}”`
                        : ""}
                    </option>
                  ) : null,
                )}
              </select>
            </label>
            <div className="tensions-excerpt">
              <div className="tensions-modality">
                {reference.evidence.modality}
                <span>
                  {formatTimeRange(reference.evidence.startSeconds, reference.evidence.endSeconds)}
                </span>
              </div>
              <blockquote>
                {reference.evidence.modality === "visual" ? (
                  reference.evidence.excerpt
                ) : (
                  <ExcerptText text={reference.evidence.excerpt} terms={theme?.terms ?? []} />
                )}
              </blockquote>
              {theme?.terms.length && comparison.passageMatches?.[side] === false ? (
                <p className="tensions-record-description">
                  This passage does not contain “{theme.label}”. Choose a marked passage to keep the
                  comparison grounded in the shared term.
                </p>
              ) : null}
            </div>
            <p className="tensions-record-description">{reference.record.description}</p>
            <div className="tensions-source-actions">
              <Button
                variant="editorial"
                onClick={() => openRecord(reference.record.id)}
                aria-label={`Inspect evidence ${side === 0 ? "A" : "B"}`}
              >
                Inspect full context<ArrowUpRight aria-hidden="true" className="ml-1 inline h-3.5 w-3.5 align-[-2px]" />
              </Button>
              <SaveButton id={reference.record.id} />
            </div>
          </article>
        ))}
      </div>
      <div className="tensions-reading">
        <div className="tensions-reading-copy">
          <h3>{comparison.title}</h3>
          <p className="mt-2 text-xs font-semibold text-primary">
            {comparison.interpretation === "prepared-demo"
              ? "Prepared demo interpretation"
              : "Comparison prompt"}
          </p>
          <p>{comparison.reading}</p>
          <div className="tensions-context-note">
            <strong>Keep the circumstances in view</strong>
            <span>
              These records were published on {formatDate(comparison.left.record.publishedAt)} and{" "}
              {formatDate(comparison.right.record.publishedAt)}. Check location, eligibility, and
              individual circumstances before treating differences as disagreement.
            </span>
          </div>
        </div>
        <div className="tensions-question">
          <h3>{comparison.question}</h3>
          <p>Your next reporting question: one to investigate, not a verified conclusion.</p>
          <Button
            className="mt-6 w-full"
            onClick={() => choose(comparison.question)}
          >
            {used && reportingLead?.question === comparison.question
              ? "Reporting question selected"
              : "Use this reporting question"}
          </Button>
          <span role="status" className="tensions-save-status">
            {used
              ? "Both records are saved to your brief."
              : "Saves both records with this question."}
          </span>
          {used && (
            <Button
              variant="editorial"
              className="mt-3 text-xs font-semibold text-primary"
              onClick={onOpenBrief}
            >
              Open editorial brief<ArrowUpRight aria-hidden="true" className="ml-1 inline h-3.5 w-3.5 align-[-2px]" />
            </Button>
          )}
        </div>
      </div>
      <AiPairAnalysis
        key={`${ids.join("|")}:${indices.join("|")}`}
        passages={comparePassages({ left: comparison.left, right: comparison.right })}
        question={query}
        selectedQuestion={used ? (reportingLead?.question ?? null) : null}
        onChoose={choose}
      />
    </>
  );
}

function AiPairAnalysis({
  passages,
  question,
  selectedQuestion,
  onChoose,
}: {
  passages: AiPassage[];
  question: string;
  selectedQuestion: string | null;
  onChoose: (question: string, ai: AiComparison) => void;
}) {
  const { result, run, status, error } = useAiComparison(passages, question);
  const groups: { kind: "common" | "difference" | "context-gap"; title: string }[] = [
    { kind: "difference", title: "Where they differ" },
    { kind: "common", title: "What they share" },
    { kind: "context-gap", title: "Context missing from both" },
  ];
  return (
    <section className="tensions-ai" aria-label="AI comparison">
      <div className="tensions-ai-head">
        <div>
          <h3>Read the two passages together</h3>
          <p>
            An AI model reads only passages A and B and must quote them for every point. Points
            whose quotes do not match the source exactly are discarded.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={run}
          disabled={status === "loading"}
          aria-busy={status === "loading"}
        >
          <GitCompareArrows aria-hidden="true" className="mr-2 h-4 w-4" />
          {status === "loading"
            ? "Analysing…"
            : result
              ? "Analyse again"
              : "Analyse this pair"}
        </Button>
      </div>
      {status === "error" && (
        <div role="alert" className="tensions-ai-error">
          <p>AI comparison failed: {error}</p>
          <Button variant="outline" size="sm" onClick={run}>
            <RotateCcw aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}
      {result && status !== "loading" && (
        <div className="tensions-ai-result">
          <p className="tensions-ai-relationship">{RELATIONSHIP_TEXT[result.relationship]}</p>
          <p className="tensions-ai-summary">{result.summary}</p>
          {groups.map((g) => {
            const points = result.points.filter((p) => p.kind === g.kind);
            if (!points.length) return null;
            return (
              <div key={g.kind} className="tensions-ai-group">
                <h4>{g.title}</h4>
                <ul>
                  {points.map((p, i) => (
                    <li key={i}>
                      <p>{p.text}</p>
                      <AiCitations citations={p.citations} passages={passages} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {result.caveats.length > 0 && (
            <div className="tensions-ai-group">
              <h4>Before you compare</h4>
              <ul className="list-disc pl-5">
                {result.caveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {result.droppedPoints > 0 && (
            <p className="tensions-ai-dropped">
              {result.droppedPoints} {result.droppedPoints === 1 ? "point was" : "points were"}{" "}
              removed because the quoted words were not found in the passages.
            </p>
          )}
          {result.reportingQuestions.length > 0 && (
            <div className="tensions-ai-group">
              <h4>Suggested reporting questions</h4>
              <ul className="tensions-ai-questions">
                {result.reportingQuestions.map((q) => {
                  const chosen = selectedQuestion === q;
                  return (
                    <li key={q}>
                      <span>{q}</span>
                      <Button
                        variant={chosen ? "default" : "outline"}
                        size="sm"
                        onClick={() => onChoose(q, result)}
                        aria-pressed={chosen}
                        aria-label={`Use reporting question: ${q}`}
                      >
                        {chosen ? "Selected" : "Use"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <AiProvenance model={result.model} generatedAt={result.generatedAt} />
        </div>
      )}
    </section>
  );
}

/** Long passages (e.g. a whole transcript without timed chunks) are windowed around the match. */
function ExcerptText({ text, terms }: { text: string; terms: string[] }) {
  if (text.length <= 600)
    return (
      <>
        “<Highlight text={text} terms={terms} />”
      </>
    );
  const first = terms.length ? findFirst(text, terms) : null;
  const shown = excerptWindow(text, first, 600);
  return (
    <>
      “<Highlight text={shown.text} terms={terms} />”
      <small className="block text-[10px] text-muted-foreground">
        Shortened for display. Inspect full context for the complete passage.
      </small>
    </>
  );
}
