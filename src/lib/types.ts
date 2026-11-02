export type Platform = "TikTok" | "Instagram";
export type Modality = "speech" | "on-screen text" | "visual";
export type ContentType =
  | "Testimonial"
  | "Street interview"
  | "Explainer"
  | "Vlog"
  | "Commentary";

export type TopicId = "housing" | "groceries" | "transport" | "employment" | "climate";

export interface EvidenceEntry {
  modality: Modality;
  excerpt: string;
  startSeconds: number;
  endSeconds: number;
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
  durationSeconds: number;
  contentType: ContentType;
  topic: TopicId;
  evidence: EvidenceEntry[];
  themes: string[]; // theme ids
  perspective: string; // perspective id
  dataMode: "mock" | "live";
}

export interface Theme {
  id: string;
  label: string;
  topic: TopicId;
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
}
