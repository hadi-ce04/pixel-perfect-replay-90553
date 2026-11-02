import type { ContentType, Modality, TopicId, VideoRecord } from "@/lib/types";

// All records below are FICTIONAL demonstration data. Creator labels are
// generic descriptors, not real accounts. No source URLs exist.

type Ev = [Modality, number, number, string];
type Row = [
  "T" | "I",
  string, // title
  string, // description
  string, // date
  string, // creator label
  number, // duration
  ContentType,
  string[], // themes
  string, // perspective
  Ev[],
];

const S: Modality = "speech";
const O: Modality = "on-screen text";
const V: Modality = "visual";

const rows: Record<TopicId, Row[]> = {
  housing: [
    ["T", "My 14 m² studio costs 690 € a month", "A Lyon student walks through her studio and breaks down her monthly budget.", "2026-01-14", "Student creator · Lyon", 74, "Testimonial", ["rent-burden"], "student",
      [[S, 4, 15, "Rent is 690 euros, my scholarship is 580. So before I've eaten anything, I'm already negative."], [O, 16, 22, "Rent = 62% of my monthly income"], [V, 30, 41, "Camera pans across a single room with a bed folded against a kitchenette."]]],
    ["I", "Why landlords keep asking students for a guarantor", "A rental agent explains the screening rules applied to student applicants.", "2025-11-03", "Rental agent · Paris", 92, "Explainer", ["guarantor"], "landlord",
      [[S, 8, 24, "We receive forty files for one studio. Without a guarantor earning three times the rent, the owner won't even look at it."], [S, 40, 52, "I understand it's unfair for students without family support, but owners are worried about unpaid rent."]]],
    ["T", "Day 212 on the residence waiting list", "A first-year student documents months of waiting for a public residence room.", "2025-12-08", "First-year student · Bordeaux", 58, "Vlog", ["crous-shortage", "commute-tradeoff"], "student",
      [[O, 0, 6, "Waiting list position: 1,184"], [S, 10, 26, "Meanwhile I sleep at my aunt's place, an hour and a half by train from campus."]]],
    ["T", "Street interview: how much do you pay in rent?", "Students outside a Paris university answer one question about their housing costs.", "2026-02-02", "Campus street interviews", 120, "Street interview", ["rent-burden", "colocation"], "student",
      [[S, 5, 14, "850 for a room in a shared flat. Four of us, one bathroom."], [S, 33, 41, "I live with my parents. Honestly, it's the only reason I can study here."], [S, 70, 82, "I work 15 hours a week just to cover rent. My grades took the hit."]]],
    ["I", "Flat-sharing saved my degree", "A student explains how a five-person colocation halved her housing costs.", "2025-10-21", "Master's student · Toulouse", 66, "Testimonial", ["colocation"], "student",
      [[S, 6, 20, "Alone I was paying 640. Now it's 330 with bills. It's not glamorous but I can breathe."], [V, 22, 34, "Shared fridge with labelled shelves and a chore rota on the door."]]],
    ["I", "The housing crisis is not only about students", "A creator argues that the student housing debate ignores young workers and families.", "2026-01-29", "Policy commentary channel", 140, "Commentary", ["rent-burden", "crous-shortage"], "skeptic",
      [[S, 12, 30, "Every autumn we hear about students, but apprentices and young workers face the same prices with fewer aids."], [O, 45, 50, "Housing aid is not only for students"]]],
    ["T", "I commute 3 hours a day to afford rent", "A student shows his daily route from a satellite town to campus.", "2025-09-30", "Engineering student · Île-de-France", 81, "Vlog", ["commute-tradeoff", "rent-burden"], "student",
      [[S, 3, 18, "Rent here is 450 instead of 900 in the city. I pay for it with three hours on trains every day."], [V, 40, 55, "Timelapse of a crowded early-morning regional train platform."]]],
    ["I", "Explained: student housing aid in 90 seconds", "An explainer summarises the main housing aid schemes and their limits.", "2025-11-18", "Civic explainer account", 90, "Explainer", ["guarantor", "rent-burden"], "explainer",
      [[O, 5, 12, "A public guarantee scheme exists for students without a guarantor"], [S, 30, 48, "Many students don't know the public guarantee exists, and some landlords still refuse it."]]],
    ["T", "Student union protest at the rectorate", "Footage and speech from a student union rally about residence places.", "2026-03-05", "Student union representative", 104, "Commentary", ["crous-shortage"], "advocate",
      [[S, 15, 32, "We're asking for new residence places now, not in ten years when this generation has given up."], [V, 50, 62, "Banners reading 'A roof to study' held outside a public building."]]],
  ],
  groceries: [
    ["T", "Same basket, one year apart", "A student repeats an identical grocery shop and compares receipts.", "2026-01-08", "Student creator · Lille", 63, "Vlog", ["price-shock"], "student",
      [[O, 8, 14, "Last year: 38.20 € · This year: 46.90 €"], [S, 20, 32, "Same pasta, same yoghurt, same everything. Almost nine euros more."]]],
    ["I", "Feeding myself on 40 € a week", "A meal-planning creator shares a weekly student menu.", "2025-10-12", "Budget cooking account", 98, "Explainer", ["budget-hacks"], "explainer",
      [[S, 10, 25, "Lentils, eggs, frozen veg and store brands. Batch cook on Sunday and you're done."], [O, 60, 66, "Total: 39.40 € for 14 meals"]]],
    ["T", "First time at the student food pantry", "A student talks about overcoming embarrassment to use a campus pantry.", "2025-12-15", "Undergraduate · Grenoble", 72, "Testimonial", ["food-aid"], "student",
      [[S, 5, 22, "I waited three months before going. I thought it was for other people. There were so many students in the queue."], [V, 30, 40, "Volunteers handing out bags of vegetables in a university hallway."]]],
    ["I", "The cereal box got smaller again", "A creator weighs products to show reduced pack sizes.", "2025-11-26", "Consumer watch channel", 55, "Explainer", ["shrinkflation", "price-shock"], "explainer",
      [[V, 4, 14, "Two cereal boxes on a scale: 500 g and 440 g, same price label."], [S, 16, 28, "They didn't raise the price. They just gave you less."]]],
    ["T", "Supermarket street poll: what got expensive?", "Shoppers aged 18–25 name the item that hurts their budget most.", "2026-02-11", "Neighbourhood street interviews", 110, "Street interview", ["price-shock", "budget-hacks"], "young-worker",
      [[S, 6, 12, "Olive oil. I just stopped buying it."], [S, 40, 52, "Meat. I'm basically vegetarian now, not by choice."], [S, 80, 90, "I use the anti-waste app every evening, that's how I eat."]]],
    ["I", "Prices are high, but are students really worse off?", "A commentator compares food inflation with recent aid increases.", "2026-03-01", "Economics commentary channel", 130, "Commentary", ["price-shock"], "skeptic",
      [[S, 20, 40, "Food inflation has slowed. The real problem is rent eating everything else — groceries are where people feel it."], [O, 70, 76, "Context matters: compare prices with income"]]],
    ["T", "Volunteering at a solidarity grocery", "An association volunteer explains how the student grocery works.", "2025-09-22", "Student association volunteer", 88, "Explainer", ["food-aid"], "advocate",
      [[S, 8, 26, "Products are sold at 10 to 30 percent of the market price. Demand has doubled since last year at our site."]]],
    ["I", "My mum sends me food parcels", "A parent describes sending groceries to her son in another city.", "2025-12-02", "Parent creator", 61, "Testimonial", ["food-aid", "price-shock"], "parent",
      [[S, 4, 20, "Every two weeks I post a box. It's cheaper for me here than for him in the city, and I worry he skips meals."]]],
    ["T", "Anti-waste baskets: worth it?", "A student tests evening surplus baskets from bakeries and stores.", "2026-01-20", "Student creator · Nantes", 77, "Vlog", ["budget-hacks"], "student",
      [[V, 10, 22, "Unboxing a basket of bread, pastries and fruit labelled 3.99 €."], [S, 30, 44, "Great value, but you can't plan a week around it. Some days there's nothing left."]]],
  ],
  transport: [
    ["T", "My monthly pass vs my part-time salary", "A student compares her transport costs to her earnings.", "2025-10-05", "Student creator · Marseille", 59, "Testimonial", ["fare-cost"], "student",
      [[S, 3, 16, "The pass is cheaper with the youth discount, but it's still a full shift of work every month."]]],
    ["I", "Third cancelled train this week", "A commuter films the departures board during a disruption.", "2026-02-18", "Daily commuter · Rouen", 45, "Vlog", ["reliability"], "young-worker",
      [[V, 0, 10, "Departure board with several trains marked 'Supprimé'."], [S, 12, 26, "I'll be late again. My manager has stopped believing me."]]],
    ["T", "No bus after 7 pm in my village", "A student explains how rural transport shapes her study options.", "2025-11-11", "Student · rural Brittany", 83, "Testimonial", ["rural-access"], "student",
      [[S, 6, 24, "The last bus leaves at 6:50. Evening classes are impossible unless my dad drives 40 minutes."], [O, 30, 36, "Nearest station: 22 km"]]],
    ["I", "Why I switched to a second-hand bike", "A creator explains switching from metro to cycling.", "2026-03-10", "Urban cycling account", 70, "Vlog", ["cycling-shift", "fare-cost"], "young-worker",
      [[S, 10, 22, "Bike cost me 120 euros. It paid for itself in two months and I'm never stuck in a strike again."]]],
    ["T", "Explained: who gets discounted fares?", "An explainer reviews youth and student fare schemes in major cities.", "2025-09-15", "Civic explainer account", 95, "Explainer", ["fare-cost"], "explainer",
      [[O, 4, 10, "Discount schemes vary by region"], [S, 20, 40, "In some regions students travel almost free, in others they pay full price. Where you study changes everything."]]],
    ["I", "Strike day street interviews", "Young commuters share how they are getting to work during a strike.", "2026-01-23", "City street interviews", 115, "Street interview", ["reliability", "cycling-shift"], "young-worker",
      [[S, 8, 16, "I support the strikers, but I lose a day's pay each time."], [S, 50, 60, "Scooter. Forty minutes in the cold, but it works."]]],
    ["T", "Free transport is the wrong debate", "A commentator argues that service frequency matters more than fares.", "2025-12-19", "Urban policy commentary", 125, "Commentary", ["reliability", "rural-access"], "skeptic",
      [[S, 15, 35, "A free bus that comes once an hour doesn't help anyone. Frequency first, then talk about price."]]],
    ["I", "Users' association demands rural lines", "An association spokesperson presents a petition for rural bus routes.", "2026-02-27", "Transport users' association", 90, "Commentary", ["rural-access"], "advocate",
      [[S, 10, 28, "Young people without cars are stuck. We collected signatures across twelve villages."], [V, 40, 50, "Petition boxes stacked on a table at a town hall."]]],
    ["T", "Cycling to campus in the rain", "A student vlogs her bike commute through winter weather.", "2025-11-29", "Student creator · Strasbourg", 52, "Vlog", ["cycling-shift"], "student",
      [[V, 2, 14, "Rain-soaked cycle lane filmed from a handlebar camera."], [S, 20, 30, "The tram is reliable here, but 30 euros saved is 30 euros of food."]]],
  ],
  employment: [
    ["I", "My fourth internship, still no contract", "A graduate describes a chain of internships without a job offer.", "2026-01-11", "Business graduate · Paris", 79, "Testimonial", ["unpaid-internships"], "young-worker",
      [[S, 5, 22, "Four internships, great feedback each time, and each time they took a new intern instead of hiring me."]]],
    ["T", "Junior role, 3 years experience required", "A creator reacts to entry-level job adverts asking for experience.", "2025-10-27", "Career commentary account", 50, "Commentary", ["experience-paradox"], "young-worker",
      [[O, 3, 9, "'Junior position — minimum 3 years experience'"], [S, 10, 20, "How am I supposed to get experience if junior jobs need experience?"]]],
    ["T", "Working nights while studying law", "A student describes balancing hotel night shifts and classes.", "2025-12-04", "Law student · Montpellier", 86, "Vlog", ["side-jobs"], "student",
      [[S, 6, 24, "Friday and Saturday nights at reception. I revise between check-ins. I'm tired all the time."], [V, 30, 40, "Desk lamp over law textbooks next to a hotel reception computer."]]],
    ["I", "Recruiter: what we actually look for", "A recruiter explains how entry-level candidates are evaluated.", "2026-02-06", "Tech recruiter", 112, "Explainer", ["experience-paradox", "unpaid-internships"], "explainer",
      [[S, 15, 35, "Experience can be projects, associations, side jobs. Many graduates undersell what they've already done."]]],
    ["T", "I quit marketing to become an electrician", "A young worker explains retraining after a long job search.", "2026-03-02", "Apprentice electrician", 94, "Testimonial", ["career-pivot"], "young-worker",
      [[S, 8, 28, "A master's degree and eight months of applications. Now I'm an apprentice, paid, and I have offers already."]]],
    ["I", "Delivery riding between lectures", "A student shows her gig-work schedule around her timetable.", "2025-09-28", "Student rider · Lyon", 68, "Vlog", ["side-jobs"], "student",
      [[O, 4, 10, "Avg. 9.40 €/hour after costs"], [S, 14, 28, "Flexible, yes. But no sick pay and the algorithm decides how much I earn."]]],
    ["T", "Graduates are pickier than they admit", "A commentator argues that young candidates reject available jobs.", "2025-11-21", "Business commentary channel", 118, "Commentary", ["experience-paradox"], "skeptic",
      [[S, 12, 30, "There are vacancies in hospitality, care, construction. The problem is a mismatch with what graduates want."]]],
    ["I", "Union campaign for paid internships", "A student union representative presents demands on internship pay.", "2026-01-30", "Student union representative", 87, "Commentary", ["unpaid-internships"], "advocate",
      [[S, 10, 26, "Internships replace real jobs. We want stronger pay and limits on how many interns a company can take."]]],
    ["T", "Street interview: are you finding work?", "Recent graduates outside a job fair describe their search.", "2026-02-20", "Job fair street interviews", 105, "Street interview", ["experience-paradox", "career-pivot"], "young-worker",
      [[S, 5, 14, "Sixty applications, two interviews."], [S, 45, 56, "I found something in two weeks — but in a completely different field."]]],
  ],
  climate: [
    ["T", "I can't stop thinking about the future", "A student speaks candidly about anxiety linked to climate news.", "2025-10-09", "Psychology student · Paris", 71, "Testimonial", ["eco-anxiety"], "student",
      [[S, 6, 24, "Sometimes I wonder if it makes sense to plan a career when the summers keep getting hotter."]]],
    ["I", "Going vegetarian on a student budget", "A creator shows how cutting meat lowered both emissions and costs.", "2025-11-14", "Budget cooking account", 84, "Explainer", ["everyday-action", "cost-of-green"], "explainer",
      [[S, 10, 26, "Legumes are cheaper than meat. For me going vegetarian was the one green choice that saved money."]]],
    ["T", "Organic is a luxury I can't afford", "A student compares organic and conventional prices.", "2026-01-17", "Student creator · Rennes", 60, "Vlog", ["cost-of-green"], "student",
      [[O, 5, 11, "Organic basket: 61 € · Conventional: 42 €"], [S, 14, 26, "People tell us to consume responsibly. With what money?"]]],
    ["I", "Campus climate collective's first action", "A collective organises a repair café and clothing swap on campus.", "2025-12-10", "Campus climate collective", 96, "Commentary", ["collective-action", "everyday-action"], "advocate",
      [[V, 8, 20, "Students repairing bikes and laptops at tables in a university hall."], [S, 30, 46, "Individual guilt doesn't work. Doing things together does."]]],
    ["T", "Climate march street interviews", "Young protesters explain why they joined a climate march.", "2026-03-08", "City street interviews", 108, "Street interview", ["collective-action", "eco-anxiety"], "student",
      [[S, 6, 15, "I'm here because it's better than doom-scrolling alone."], [S, 60, 72, "We want policy, not just reusable straws."]]],
    ["I", "Eco-anxiety is being overhyped", "A commentator argues that alarmist content hurts young people's engagement.", "2026-02-14", "Science commentary channel", 122, "Commentary", ["eco-anxiety"], "skeptic",
      [[S, 15, 34, "Fear doesn't mobilise, it paralyses. We need stories of solutions, not endless catastrophe."]]],
    ["T", "Train vs plane for my Erasmus trip", "A student compares cost and time of travelling by rail versus air.", "2025-09-19", "Erasmus student", 76, "Vlog", ["cost-of-green", "everyday-action"], "student",
      [[O, 6, 12, "Train: 14 h · 139 € — Plane: 2 h · 49 €"], [S, 16, 30, "I took the train, but I understand why most of my friends didn't."]]],
    ["I", "Explained: what actually cuts your footprint", "An explainer ranks personal actions by impact.", "2025-10-31", "Civic explainer account", 99, "Explainer", ["everyday-action"], "explainer",
      [[O, 5, 12, "Biggest levers: transport, diet, heating"], [S, 20, 38, "Recycling matters, but it's small compared with how you travel and what you eat."]]],
    ["T", "A parent on raising climate-aware kids", "A parent discusses conversations about climate at home.", "2026-01-05", "Parent creator", 67, "Testimonial", ["eco-anxiety", "everyday-action"], "parent",
      [[S, 8, 24, "My daughter is 19 and angrier than I ever was. I try to listen instead of reassuring her too fast."]]],
  ],
};

export const RECORDS: VideoRecord[] = (Object.keys(rows) as TopicId[]).flatMap((topic) =>
  rows[topic].map((r, i) => ({
    id: `${topic.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
    platform: r[0] === "T" ? "TikTok" : "Instagram",
    sourceUrl: null,
    thumbnailUrl: null,
    title: r[1],
    description: r[2],
    publishedAt: r[3],
    creatorLabel: r[4],
    durationSeconds: r[5],
    contentType: r[6],
    topic,
    themes: r[7],
    perspective: r[8],
    evidence: r[9].map(([modality, startSeconds, endSeconds, excerpt]) => ({ modality, startSeconds, endSeconds, excerpt })),
    dataMode: "mock" as const,
  })),
);
