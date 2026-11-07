/**
 * Language-neutral text helpers shared by query planning and evidence analysis.
 *
 * `fold` keeps the exact UTF-16 length of its input, so a match found in folded
 * text maps back to the same offsets in the original source passage. Highlights
 * and shortened excerpts therefore always quote the source verbatim.
 */

const LETTER_OR_DIGIT = /^[\p{L}\p{N}]$/u;

export function fold(text: string): string {
  let out = "";
  for (const ch of text) {
    const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    if (base.length === ch.length) {
      for (const c of base) out += LETTER_OR_DIGIT.test(c) ? c : " ";
    } else if (ch.length === 1) {
      const lower = ch.toLowerCase().charAt(0);
      out += LETTER_OR_DIGIT.test(lower) ? lower : " ";
    } else {
      out += " ".repeat(ch.length);
    }
  }
  return out;
}

/** Folded, space-joined form used as a stable key (e.g. "Élections " → "elections"). */
export function foldKey(text: string): string {
  return fold(text).trim().split(/\s+/).filter(Boolean).join(" ");
}

export function slug(text: string): string {
  return foldKey(text).replace(/\s+/g, "-");
}

export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC");
}

const patternCache = new Map<string, RegExp>();

/** Whole-word (or whole-phrase) pattern over folded text; tolerant of punctuation between words. */
export function termPattern(term: string): RegExp | null {
  const key = foldKey(term);
  if (!key) return null;
  let pattern = patternCache.get(key);
  if (!pattern) {
    const body = key
      .split(" ")
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+");
    pattern = new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "u");
    if (patternCache.size > 2000) patternCache.clear();
    patternCache.set(key, pattern);
  }
  return pattern;
}

export interface TextMatch {
  start: number;
  end: number;
  term: string;
}

/** First match of any term in a source text, with offsets into the original string. */
export function findTerm(text: string, terms: readonly string[], folded = fold(text)): TextMatch | null {
  let best: TextMatch | null = null;
  for (const term of terms) {
    const pattern = termPattern(term);
    const m = pattern ? pattern.exec(folded) : null;
    if (m && (!best || m.index < best.start)) best = { start: m.index, end: m.index + m[0].length, term };
  }
  return best;
}

/** Every non-overlapping match of the given terms, for highlighting. */
export function findAllTerms(text: string, terms: readonly string[]): TextMatch[] {
  const folded = fold(text);
  const found: TextMatch[] = [];
  for (const term of terms) {
    const pattern = termPattern(term);
    if (!pattern) continue;
    const global = new RegExp(pattern.source, "gu");
    for (const m of folded.matchAll(global))
      found.push({ start: m.index!, end: m.index! + m[0].length, term });
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: TextMatch[] = [];
  for (const m of found) if (!merged.length || m.start >= merged[merged.length - 1]!.end) merged.push(m);
  return merged;
}

export interface Token {
  folded: string;
  surface: string;
  start: number;
}

/** Word tokens with their original surface form (apostrophes and hyphens split words). */
export function tokens(text: string): Token[] {
  const folded = fold(text);
  const out: Token[] = [];
  for (const m of folded.matchAll(/[\p{L}\p{N}]+/gu))
    out.push({ folded: m[0], surface: text.slice(m.index!, m.index! + m[0].length), start: m.index! });
  return out;
}

/**
 * Shorten a long passage to an exact contiguous window around a match. Ellipses mark
 * the cut; the quoted words themselves are never altered.
 */
export function excerptWindow(text: string, match: { start: number; end: number } | null, max = 320) {
  if (text.length <= max) return { text, shortened: false };
  const center = match ? Math.floor((match.start + match.end) / 2) : 0;
  let start = Math.max(0, center - Math.floor(max / 2));
  let end = Math.min(text.length, start + max);
  start = Math.max(0, end - max);
  // Prefer word boundaries so no word is cut in half.
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space > -1 && space < (match?.start ?? end)) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > (match?.end ?? start)) end = space;
  }
  return {
    text: `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`,
    shortened: true,
  };
}

const words = (s: string) => s.split(/\s+/).filter(Boolean);

/** English and French function words, question scaffolding and spoken fillers (folded). */
export const STOPWORDS = new Set(
  words(`
a an the of to in on for and or nor but if then so than too very is are was were be been being am
do does did doing done have has had having will would shall should can could may might must
what how who whom whose why when where which while whether about above across after against along
among around at before behind below beneath beside between beyond by down during except from inside
into near off onto out outside over past since through throughout till toward towards under until
up upon with within without via per
i me my mine myself we us our ours ourselves you your yours yourself yourselves he him his himself
she her hers herself it its itself they them their theirs themselves this that these those there here
any some all both each every few more most other others such no not only own same just also even
still yet ever never always often again once now today
say says said saying tell tells telling talk talks talking discuss discussing discussed think thinks
thinking thought feel feels feeling felt know knows known want wants wanted get gets got getting go
goes going gone make makes making made see seeing seen look looking let lets use using used come
coming take taking give giving put react reacts reacting reacted respond responding really actually basically literally like likes liked gonna wanna
yeah yes okay ok oh hey hi hello thing things stuff lot lots kind sort way ways much many well right
something anything everything nothing someone anyone everyone people person guys guy one two
because cause time times better best good great bad worse worst new old big little back next last first
maybe probably sure true real really pretty whole every ago around enough else instead though although
day days week weeks thank thanks please watch follow comment share video videos
le la les l un une des du de d au aux ce cet cette ces c ca cela ceci celui celle ceux celles
et ou mais donc or ni car si que qu qui quoi dont ou comment pourquoi quand quel quelle quels quelles
combien est sont etait etaient etre ete suis es sommes etes ai as avons avez ont avait avaient avoir
eu fait faire font faisait fais va vais vont aller allait peut peux pouvez pouvons peuvent pouvait
doit dois doivent devoir faut fallait veut veux voulez voulons veulent vouloir dit dire disent disait
parle parlent parler pense pensent penser pensez sais sait savoir savez vois voit voir
je j me m moi tu te t toi il ils elle elles on nous vous lui leur leurs se s soi y en
mon ma mes ton ta tes son sa ses notre nos votre vos
dans sur sous avec sans pour par chez vers entre contre selon depuis pendant avant apres
propos concernant parmi
ne n pas plus moins tres trop bien tout tous toute toutes rien aucun aucune chaque meme autre autres
aussi encore deja alors ensuite puis voila voici ici la oui non si bon bah ben euh hein ouais genre
truc trucs chose choses vraiment juste enfin quand meme parce comme ainsi tellement assez peu beaucoup
fois jamais toujours souvent
abonne abonnez abonnes abonnement like likez partage partagez commente commentez follow subscribe
lien bio video videos tiktok insta instagram youtube reel reels short shorts fyp pourtoi foryou
foryoupage viral
`),
);

/** Words that describe a speaker or audience. Shown in the plan but never used as a search constraint. */
export const CONTEXT_WORDS = new Set(
  words(`
french francais francaise francaises english anglais american americans americain americains british
european europeens europeen german allemand spanish espagnol italian italien african africain
canadian canadien belgian belge swiss suisse
young youth jeune jeunes gens public citizens citoyens citoyen individuals individus population
residents habitants internautes users utilisateurs viewers creators createurs influencers
influenceurs
`),
);

export const PLATFORM_WORDS: Record<string, "TikTok" | "Instagram" | "YouTube"> = {
  tiktok: "TikTok",
  tiktoks: "TikTok",
  instagram: "Instagram",
  insta: "Instagram",
  reels: "Instagram",
  youtube: "YouTube",
  shorts: "YouTube",
};

/** Lowercase connectors that may sit inside a proper name (e.g. "Coupe du Monde", "Bank of England"). */
export const NAME_CONNECTORS = new Set(words("de du des la le of the van von di da del y"));

export function looksFrench(text: string) {
  const t = words(foldKey(text));
  const fr = t.filter((w) => /^(le|la|les|des|du|est|sont|que|qui|quoi|comment|pourquoi|sur|avec|pour|dans|disent|pensent|et)$/.test(w)).length;
  const en = t.filter((w) => /^(the|is|are|what|how|why|who|about|with|for|in|saying|think|and|of)$/.test(w)).length;
  return fr === 0 && en === 0 ? "unknown" : fr > 0 && en > 0 && Math.abs(fr - en) <= 1 ? "mixed" : fr > en ? "fr" : "en";
}
