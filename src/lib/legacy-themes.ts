/**
 * The keyword dictionary used before evidence-derived themes. Kept only so that reporting
 * questions saved with these tags can still be validated and exported; never applied to new searches.
 */
export const LEGACY_KEYWORD_THEMES: Record<string, string[]> = {
  "rent-burden": ["loyer", "rent", "cher", "afford"],
  guarantor: ["garant", "guarant"],
  "crous-shortage": ["crous", "residence", "waiting list"],
  colocation: ["colocation", "flat-sharing", "shared flat"],
  "commute-tradeoff": ["trajet", "commute"],
  "price-shock": ["inflation", "prix", "grocery prices"],
  "budget-hacks": ["budget", "repas", "meal"],
  "food-aid": ["alimentaire", "food bank", "pantry"],
  shrinkflation: ["shrinkflation", "reduit"],
  "fare-cost": ["tarif", "fare", "abonnement"],
  reliability: ["retard", "annule", "strike", "greve"],
  "rural-access": ["rural", "village"],
  "cycling-shift": ["velo", "cycling"],
  "unpaid-internships": ["stage", "internship"],
  "experience-paradox": ["experience", "junior"],
  "side-jobs": ["job etudiant", "part-time"],
  "career-pivot": ["reconversion", "retraining"],
  "eco-anxiety": ["eco-anxiete", "eco anxiety"],
  "everyday-action": ["recycl", "recycling"],
  "cost-of-green": ["ecologique", "sustainable"],
  "collective-action": ["manifestation", "protest"],
};
