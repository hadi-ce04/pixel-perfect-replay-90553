import type { Perspective, Theme, Topic } from "@/lib/types";

export const TOPICS: Topic[] = [
  { id: "housing", label: "Student housing", question: "What are French students saying about housing affordability?" },
  { id: "groceries", label: "Grocery costs", question: "How are young people coping with rising grocery prices?" },
  { id: "transport", label: "Public transport", question: "What do commuters say about public transport fares and reliability?" },
  { id: "employment", label: "Youth employment", question: "How do young graduates describe the entry-level job market?" },
  { id: "climate", label: "Climate", question: "How are young people talking about climate action in daily life?" },
];

export const THEMES: Theme[] = [
  // housing
  { id: "rent-burden", topic: "housing", label: "Rent burden", description: "Rent consuming a large share of a student's monthly budget, often described with concrete figures." },
  { id: "guarantor", topic: "housing", label: "Guarantor barriers", description: "Difficulty meeting landlord requirements for a guarantor, income proof or deposits." },
  { id: "crous-shortage", topic: "housing", label: "Residence shortage", description: "Limited places in public student residences and long waiting lists." },
  { id: "colocation", topic: "housing", label: "Shared living", description: "Flat-sharing and other arrangements chosen to reduce housing costs." },
  { id: "commute-tradeoff", topic: "housing", label: "Distance trade-off", description: "Living further from campus to save on rent, at the cost of longer commutes." },
  // groceries
  { id: "price-shock", topic: "groceries", label: "Price shock", description: "Noticing sharp price increases on everyday items at the checkout." },
  { id: "budget-hacks", topic: "groceries", label: "Budget tactics", description: "Shared tips for meal planning, discount apps and cheaper store brands." },
  { id: "food-aid", topic: "groceries", label: "Food aid", description: "Use of food banks, student pantries or solidarity distributions." },
  { id: "shrinkflation", topic: "groceries", label: "Shrinking packs", description: "Product sizes decreasing while prices stay the same or rise." },
  // transport
  { id: "fare-cost", topic: "transport", label: "Fare costs", description: "The cost of passes and tickets relative to income." },
  { id: "reliability", topic: "transport", label: "Reliability", description: "Delays, cancellations and strikes affecting daily travel." },
  { id: "rural-access", topic: "transport", label: "Rural access", description: "Sparse or absent service outside large cities." },
  { id: "cycling-shift", topic: "transport", label: "Shift to cycling", description: "Choosing bikes or scooters instead of public transport." },
  // employment
  { id: "unpaid-internships", topic: "employment", label: "Internship pressure", description: "Low-paid or repeated internships expected before a first contract." },
  { id: "experience-paradox", topic: "employment", label: "Experience paradox", description: "Entry-level roles asking for years of prior experience." },
  { id: "side-jobs", topic: "employment", label: "Side jobs", description: "Combining studies with part-time or gig work to cover costs." },
  { id: "career-pivot", topic: "employment", label: "Career pivots", description: "Retraining or changing sector after a difficult job search." },
  // climate
  { id: "eco-anxiety", topic: "climate", label: "Eco-anxiety", description: "Expressions of worry or helplessness about climate change." },
  { id: "everyday-action", topic: "climate", label: "Everyday action", description: "Personal habits such as reducing meat, waste or flights." },
  { id: "cost-of-green", topic: "climate", label: "Cost of going green", description: "Sustainable choices described as unaffordable for young people." },
  { id: "collective-action", topic: "climate", label: "Collective action", description: "Protests, associations and campus initiatives." },
];

export const PERSPECTIVES: Perspective[] = [
  { id: "student", label: "Student", description: "A person currently enrolled in higher education describing personal experience." },
  { id: "young-worker", label: "Young worker", description: "Someone in early employment or job seeking." },
  { id: "landlord", label: "Landlord / owner", description: "A property owner or rental intermediary." },
  { id: "advocate", label: "Advocate", description: "A union, association or campaign representative." },
  { id: "explainer", label: "Explainer", description: "A creator summarising rules, figures or context for an audience." },
  { id: "skeptic", label: "Skeptic", description: "A creator questioning the dominant framing of the issue." },
  { id: "parent", label: "Parent", description: "A parent speaking about supporting a young adult." },
];

export const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<string, Theme>;
export const perspectiveById = Object.fromEntries(PERSPECTIVES.map((p) => [p.id, p])) as Record<string, Perspective>;
export const topicById = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<string, Topic>;

const fallbackTheme = (id: string): Theme => ({ id, label: id, topic: "housing", description: "" });
export const themeOf = (id: string): Theme => themeById[id] ?? fallbackTheme(id);
export const perspectiveOf = (id: string): Perspective => perspectiveById[id] ?? { id, label: id, description: "" };
export const topicOf = (id: string): Topic => topicById[id] ?? { id: "housing", label: id, question: "" };
