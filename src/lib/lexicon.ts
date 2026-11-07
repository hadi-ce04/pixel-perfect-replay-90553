/**
 * Small English ↔ French vocabulary used only to widen exact-text retrieval across the two
 * languages Parallax is tested with. These are word equivalents, not topics or themes:
 * nothing here classifies a source, and every expansion is shown in the query plan.
 *
 * Oriane's exact matching is case-insensitive but accent-sensitive, so accented and
 * unaccented forms are generated separately by the planner.
 *
 * Deliberately excluded: forms that collide with common words in the other language
 * (French "but", "car", "court"; bare "AI", which matches French "ai").
 */
import { foldKey } from "./text";

const ENTRIES: string[][] = [
  // Politics and public life
  ["election", "elections", "élection", "élections", "electoral", "électoral", "électorale"],
  ["vote", "votes", "voting", "voter", "voté"],
  ["voter", "voters", "électeur", "électeurs", "électrice", "électrices"],
  ["candidate", "candidates", "candidat", "candidats", "candidate", "candidates", "candidature"],
  ["president", "presidents", "président", "présidente", "présidents"],
  ["presidential", "présidentielle", "présidentielles"],
  ["legislative", "législatives", "législative"],
  ["municipal", "municipales", "municipale"],
  ["mayor", "mayors", "maire", "maires"],
  ["government", "governments", "gouvernement", "gouvernements"],
  ["minister", "ministers", "ministre", "ministres"],
  ["prime minister", "premier ministre", "première ministre"],
  ["parliament", "parlement", "assemblée nationale", "national assembly"],
  ["campaign", "campaigns", "campagne", "campagnes"],
  ["debate", "debates", "débat", "débats"],
  ["poll", "polls", "sondage", "sondages"],
  ["party", "parties", "parti", "partis"],
  ["law", "laws", "loi", "lois"],
  ["bill", "projet de loi", "proposition de loi"],
  ["reform", "reforms", "réforme", "réformes"],
  ["pension", "pensions", "retraite", "retraites"],
  ["tax", "taxes", "taxation", "impôt", "impôts", "taxe"],
  ["immigration", "immigrant", "immigrants", "immigré", "immigrés", "migrant", "migrants"],
  ["protest", "protests", "manifestation", "manifestations", "manif"],
  ["strike", "strikes", "grève", "grèves"],
  ["democracy", "démocratie"],
  ["referendum", "référendum"],
  ["war", "wars", "guerre", "guerres"],
  ["peace", "paix"],
  ["police", "policier", "policiers", "policing"],
  ["justice", "tribunal", "procès", "trial"],
  ["corruption", "scandal", "scandale"],
  // Economy, work and daily costs
  ["price", "prices", "prix"],
  ["affordability", "affordable", "unaffordable", "abordable", "abordables", "trop cher"],
  ["inflation"],
  ["cost of living", "coût de la vie", "pouvoir d'achat", "purchasing power"],
  ["salary", "salaries", "wage", "wages", "salaire", "salaires"],
  ["job", "jobs", "emploi", "emplois", "boulot"],
  ["work", "travail", "travailler"],
  ["unemployment", "chômage"],
  ["internship", "internships", "stage", "stages", "stagiaire"],
  ["rent", "rents", "loyer", "loyers"],
  ["housing", "logement", "logements"],
  ["landlord", "landlords", "propriétaire", "propriétaires", "bailleur"],
  ["tenant", "tenants", "locataire", "locataires"],
  ["guarantor", "guarantors", "garant", "garants"],
  ["debt", "debts", "dette", "dettes"],
  ["budget", "budgets"],
  ["money", "argent"],
  ["bank", "banks", "banque", "banques"],
  ["energy", "énergie"],
  ["electricity", "électricité"],
  ["fuel", "carburant", "essence", "gasoline", "petrol"],
  ["groceries", "grocery", "courses", "supermarché", "supermarket"],
  ["food", "nourriture", "alimentation", "alimentaire"],
  ["farmer", "farmers", "agriculteur", "agriculteurs", "farming", "agriculture"],
  // Society, education, health
  ["student", "students", "étudiant", "étudiants", "étudiante", "étudiantes"],
  ["school", "schools", "école", "écoles", "lycée", "collège"],
  ["university", "universities", "université", "universités", "fac"],
  ["teacher", "teachers", "professeur", "professeurs", "prof", "profs", "enseignant", "enseignants"],
  ["exam", "exams", "examen", "examens", "baccalauréat", "bac"],
  ["health", "santé"],
  ["hospital", "hospitals", "hôpital", "hôpitaux"],
  ["doctor", "doctors", "médecin", "médecins"],
  ["mental health", "santé mentale"],
  ["family", "families", "famille", "familles"],
  ["child", "children", "enfant", "enfants"],
  ["women", "woman", "femme", "femmes"],
  ["racism", "racisme", "discrimination", "discriminations"],
  ["religion", "religions"],
  ["security", "safety", "sécurité"],
  ["crime", "crimes", "criminalité", "délinquance"],
  // Sport
  ["football", "foot", "soccer"],
  ["match", "matches", "matchs", "game"],
  ["team", "teams", "équipe", "équipes"],
  ["player", "players", "joueur", "joueurs", "joueuse", "joueuses"],
  ["coach", "coaches", "entraîneur", "entraîneurs", "sélectionneur"],
  ["league", "ligue", "championnat", "championship"],
  ["cup", "coupe"],
  ["world cup", "coupe du monde", "mondial"],
  ["olympics", "olympic games", "jeux olympiques", "JO"],
  ["transfer", "transfers", "transfert", "transferts", "mercato"],
  ["referee", "referees", "arbitre", "arbitres", "arbitrage"],
  ["fan", "fans", "supporter", "supporters", "supportrice"],
  ["stadium", "stade", "stades"],
  ["rugby"],
  ["tennis"],
  ["basketball", "basket", "NBA"],
  ["cycling", "cyclisme", "tour de france"],
  ["victory", "win", "victoire", "victoires"],
  ["defeat", "loss", "défaite", "défaites"],
  // Technology
  ["artificial intelligence", "intelligence artificielle", "IA"],
  ["phone", "phones", "smartphone", "smartphones", "téléphone", "téléphones", "portable"],
  ["app", "apps", "application", "applications", "appli"],
  ["internet", "web", "online", "en ligne"],
  ["social media", "social network", "réseaux sociaux", "réseau social"],
  ["data", "données"],
  ["privacy", "vie privée", "confidentialité"],
  ["algorithm", "algorithms", "algorithme", "algorithmes"],
  ["robot", "robots"],
  ["computer", "computers", "ordinateur", "ordinateurs", "PC"],
  ["video game", "video games", "jeu vidéo", "jeux vidéo", "gaming"],
  ["cyberattack", "hack", "hacking", "cyberattaque", "piratage"],
  ["screen", "screens", "écran", "écrans"],
  ["electric car", "electric cars", "voiture électrique", "voitures électriques"],
  ["startup", "startups", "start-up"],
  // Climate and environment
  ["climate", "climat", "climatique"],
  ["environment", "environnement", "environmental", "environnemental", "écologie", "ecology"],
  ["pollution"],
  ["heatwave", "heat wave", "canicule", "canicules"],
  ["flood", "floods", "flooding", "inondation", "inondations"],
  ["drought", "sécheresse", "sécheresses"],
  ["recycling", "recyclage"],
  ["nuclear", "nucléaire"],
  // Transport
  ["transport", "transports", "public transport", "transports en commun"],
  ["train", "trains", "SNCF", "TGV"],
  ["bus"],
  ["metro", "métro", "subway", "underground"],
  ["cars", "voiture", "voitures"],
  ["bike", "bikes", "bicycle", "vélo", "vélos"],
  ["ticket", "tickets", "billet", "billets"],
  // Culture and media
  ["music", "musique"],
  ["film", "films", "movie", "movies", "cinéma"],
  ["series", "série", "séries"],
  ["book", "books", "livre", "livres"],
  ["artist", "artists", "artiste", "artistes"],
  ["news", "actualité", "actualités", "actu", "info", "infos"],
  ["journalist", "journalists", "journaliste", "journalistes"],
  ["misinformation", "disinformation", "désinformation", "fake news", "infox", "fausse information"],
];

const index = new Map<string, number>();
ENTRIES.forEach((entry, i) => {
  for (const form of entry) {
    const key = foldKey(form);
    if (!index.has(key)) index.set(key, i);
  }
});

export const LEXICON_MAX_WORDS = Math.max(...ENTRIES.flat().map((f) => foldKey(f).split(" ").length));

/** Equivalent surface forms for a word or short phrase, or null when it is not in the lexicon. */
export function lexiconForms(text: string): string[] | null {
  const i = index.get(foldKey(text));
  return i === undefined ? null : ENTRIES[i]!;
}
