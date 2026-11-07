export type Platform = "TikTok" | "Instagram" | "YouTube";
export type Modality = "speech" | "on-screen text" | "visual";
export type ContentType =
  "Testimonial" | "Street interview" | "Explainer" | "Vlog" | "Commentary" | "Unclassified";

export type TopicId = "housing" | "groceries" | "transport" | "employment" | "climate";

export interface EvidenceEntry {
  modality: Modality;
  excerpt: string;
  mediaIndex?: number;
  startSeconds: number | null;
  endSeconds: number | null;
}

export interface VideoRecord {
  id: string;
  platform: Platform;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  creatorLabel: string;
  durationSeconds: number | null;
  contentType: ContentType;
  topic: TopicId | "unclassified";
  evidence: EvidenceEntry[];
  themes: string[]; // theme ids
  perspective: string; // perspective id
  dataMode: "mock" | "live";
  /** "keyword" = legacy dictionary tags; "evidence-terms" = themes derived from returned passages. */
  annotationMethod?: "keyword" | "evidence-terms";
  sourceMediaCount?: number;
  /** Hashtags supplied by the source platform, exactly as returned. */
  hashtags?: string[];
}

export interface Theme {
  id: string;
  label: string;
  topic: TopicId | "unclassified";
  description: string;
}

export interface Perspective {
  id: string;
  label: string;
  description: string;
}

export interface Topic {
  id: TopicId;
  label: string;
  question: string;
}

export interface SearchFilters {
  platforms: Platform[];
  topics: TopicId[];
  contentTypes: ContentType[];
  from: string | null;
  to: string | null;
}

export const emptyFilters: SearchFilters = {
  platforms: [],
  topics: [],
  contentTypes: [],
  from: null,
  to: null,
};

export interface SearchResult {
  record: VideoRecord;
  score: number;
  matchedExcerpt: EvidenceEntry | null;
  /** Question facet keys that Oriane reported as matched (named query groups). */
  matchedFacets?: string[];
}
