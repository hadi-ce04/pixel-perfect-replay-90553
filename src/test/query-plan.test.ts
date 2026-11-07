import { describe, expect, it } from "vitest";
import { planQuery, searchableFacets, type QueryPlan } from "@/lib/query-plan";

const facet = (plan: QueryPlan, key: string) => plan.facets.find((f) => f.key === key);
const keys = (plan: QueryPlan) => searchableFacets(plan).map((f) => f.key);

describe("question planning", () => {
  it("keeps the full question and reads a French election question with accent variants", () => {
    const q = "Que disent les électeurs sur les élections municipales à Marseille ?";
    const plan = planQuery(q);
    expect(plan.question).toBe(q);
    expect(plan.language).toBe("fr");
    expect(facet(plan, "marseille")).toMatchObject({ kind: "entity", role: "anchor" });
    const elections = facet(plan, "elections")!;
    expect(elections.role).toBe("topic");
    expect(elections.terms).toEqual(expect.arrayContaining(["élections", "elections", "élection"]));
    expect(elections.variants.find((v) => v.term === "elections")?.reason).toBe("accent");
    expect(keys(plan)).toEqual(expect.arrayContaining(["electeurs", "municipales"]));
    expect(plan.ignored).toEqual(expect.arrayContaining(["que", "disent", "les"]));
  });

  it("translates an English election question for French-language sources", () => {
    const plan = planQuery("What are voters saying about the 2027 presidential election?");
    expect(plan.language).toBe("en");
    expect(facet(plan, "election")!.terms).toEqual(expect.arrayContaining(["élection", "élections"]));
    expect(facet(plan, "presidential")!.terms).toContain("présidentielle");
    expect(facet(plan, "2027")).toMatchObject({ kind: "number", role: "topic" });
    expect(plan.notes.join(" ")).toMatch(/not used as a publication-date filter/);
  });

  it("treats a sports star as a named entity with an unaccented variant", () => {
    const plan = planQuery("How are fans reacting to Mbappé at Real Madrid?");
    expect(facet(plan, "mbappe")).toMatchObject({ kind: "entity", role: "anchor" });
    expect(facet(plan, "mbappe")!.terms).toEqual(["Mbappé", "Mbappe"]);
    expect(facet(plan, "real madrid")).toMatchObject({ kind: "entity" });
    expect(facet(plan, "fans")!.terms).toEqual(expect.arrayContaining(["supporters"]));
  });

  it("keeps mixed-case technology names and multi-word names together", () => {
    const tech = planQuery("what do students think about ChatGPT at school");
    expect(facet(tech, "chatgpt")).toMatchObject({ kind: "entity", role: "anchor" });
    expect(facet(tech, "school")!.terms).toEqual(expect.arrayContaining(["école", "ecole"]));
    const person = planQuery("Emmanuel Macron et la réforme des retraites");
    expect(facet(person, "emmanuel macron")).toMatchObject({ kind: "entity", label: "Emmanuel Macron" });
    expect(facet(person, "reforme")!.terms).toEqual(expect.arrayContaining(["reform", "réforme"]));
    expect(facet(person, "retraites")!.terms).toEqual(expect.arrayContaining(["pension", "retraite"]));
  });

  it("does not turn who is speaking into a search constraint", () => {
    const plan = planQuery("What are French students saying about housing affordability?");
    expect(facet(plan, "french")).toMatchObject({ role: "context" });
    expect(keys(plan)).not.toContain("french");
    expect(facet(plan, "housing")!.terms).toEqual(expect.arrayContaining(["logement", "logements"]));
    expect(facet(plan, "students")!.terms).toEqual(expect.arrayContaining(["étudiants", "étudiant"]));
    expect(keys(plan)).toContain("affordability");
  });

  it("keeps quoted phrases, hashtags and elisions exact, and maps platform words to a filter", () => {
    const plan = planQuery(`Ce que disent les gens sur TikTok de "logement étudiant" et #crous à l'université`);
    expect(facet(plan, "logement etudiant")).toMatchObject({ kind: "phrase", role: "anchor" });
    expect(facet(plan, "crous")).toMatchObject({ kind: "hashtag" });
    expect(facet(plan, "universite")).toBeDefined();
    expect(plan.platforms).toEqual(["TikTok"]);
    expect(keys(plan)).not.toContain("tiktok");
  });

  it("preserves meaningful distinctions between questions in the same topic", () => {
    const a = keys(planQuery("Why are students struggling to find a guarantor for rent?"));
    const b = keys(planQuery("Are landlords raising rent near universities?"));
    expect(a).toContain("guarantor");
    expect(b).toContain("landlords");
    expect(a).not.toEqual(b);
  });

  it("produces no searchable facet for an empty or scaffolding-only question", () => {
    expect(searchableFacets(planQuery(""))).toEqual([]);
    expect(searchableFacets(planQuery("What are people saying about it?"))).toEqual([]);
  });

  it("is deterministic", () => {
    const q = "Paris 2024: what did athletes say about the Olympics?";
    expect(planQuery(q)).toEqual(planQuery(q));
    expect(facet(planQuery(q), "paris 2024")).toMatchObject({ kind: "entity" });
  });
});
