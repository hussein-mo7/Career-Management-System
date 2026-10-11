import { connectDB } from "@/server/db";
import { startOfWeek } from "@/server/domain/career";
import { hashPassword } from "@/server/auth/password";
import { ensureCareer, ensureCriteria } from "@/server/services/account";
import {
  Application,
  CareerAction,
  Company,
  Interaction,
  Interview,
  Person,
  User,
  WeeklyProgress,
} from "@/server/models";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  required("MONGODB_URI");
  required("JWT_SECRET");
  const email = required("SEED_USER_EMAIL").toLowerCase();
  const password = required("SEED_USER_PASSWORD");
  const name = process.env.SEED_USER_NAME || "Hussein";

  if (password.length < 8) throw new Error("SEED_USER_PASSWORD must be at least 8 characters");
  if ((process.env.JWT_SECRET || "").length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }

  await connectDB();

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name,
      passwordHash: await hashPassword(password),
      title: "Full-Stack Developer",
      currentGoal:
        "Build strong production experience and progress toward Senior Full-Stack Developer / Tech Lead.",
      careerStatement:
        "Full-stack developer focused on real products, clear communication, and steady growth toward senior ownership.",
      targetRegions: ["Gulf", "Palestine", "Jordan"],
    });
    console.log(`Created account for ${email}`);
  } else {
    console.log(`Account already exists for ${email}. Password was left unchanged.`);
  }

  await ensureCareer(user._id);
  await ensureCriteria(user._id);

  const existingDemo = await Company.exists({ userId: user._id, isDemo: true });
  if (existingDemo) {
    console.log("Example data already exists. Nothing else was added.");
    return;
  }

  const [northwind, lumen, harbor] = await Company.create([
    {
      userId: user._id,
      isDemo: true,
      name: "Northwind Labs",
      website: "https://northwind.example",
      location: "Remote",
      country: "Palestine",
      industry: "SaaS",
      types: ["startup", "product_company"],
      size: "8 engineers",
      remoteModel: "remote_first",
      description: "Example SaaS startup with a small product team and real paying users.",
      whyInterests: "Small product team shipping a real SaaS product.",
      whyFits: "Remote-first, senior engineers, and room to work across the stack.",
      concerns: "Need to confirm they actually do code reviews.",
      status: "qualified",
      fitRating: 4,
      nextAction: "Read the engineering blog and find a senior developer",
      nextActionDate: new Date("2026-10-12T00:00:00.000Z"),
    },
    {
      userId: user._id,
      isDemo: true,
      name: "Lumen Pay",
      website: "https://lumenpay.example",
      location: "Amman",
      country: "Jordan",
      industry: "Fintech",
      types: ["startup"],
      size: "15 engineers",
      remoteModel: "hybrid",
      description: "Example fintech startup working on payments for small businesses.",
      whyInterests: "Real financial workflows and a chance to learn backend depth.",
      whyFits: "Product company with users and a CTO who still reviews code.",
      concerns: "Hybrid expectation may not fit a remote-first search.",
      status: "networking",
      fitRating: 3,
      nextAction: "Follow up after the intro call",
    },
    {
      userId: user._id,
      isDemo: true,
      name: "Harbor Devtools",
      website: "https://harbor.example",
      location: "Remote",
      country: "Gulf",
      industry: "Developer tools",
      types: ["product_company", "mid_size"],
      size: "24 engineers",
      remoteModel: "remote_friendly",
      description: "Example developer-tools company building an API platform.",
      whyInterests: "Developers are the users, so the product feedback loop is direct.",
      whyFits: "API design, auth, and deployment are everyday work.",
      concerns: "Team may already be larger than the preferred size.",
      status: "researching",
      fitRating: 5,
    },
  ]);

  const [lena, samir, nora, maya] = await Person.create([
    {
      userId: user._id,
      isDemo: true,
      name: "Lena Ortiz",
      role: "Senior Developer",
      companyId: northwind._id,
      relationshipType: "senior_developer",
      howWeMet: "Engineering blog comment",
      linkedin: "https://www.linkedin.com/in/example-lena",
      notes: "Example contact. Knows the Northwind codebase well.",
    },
    {
      userId: user._id,
      isDemo: true,
      name: "Samir Haddad",
      role: "CTO",
      companyId: lumen._id,
      relationshipType: "cto",
      howWeMet: "Warm intro",
      notes: "Example CTO contact.",
    },
    {
      userId: user._id,
      isDemo: true,
      name: "Nora Khalil",
      role: "Recruiter",
      companyId: harbor._id,
      relationshipType: "recruiter",
      howWeMet: "Job post",
      notes: "Example recruiter.",
    },
    {
      userId: user._id,
      isDemo: true,
      name: "Maya Chen",
      role: "Mentor",
      relationshipType: "mentor",
      howWeMet: "Career community",
      notes: "Example mentor outside a target company.",
    },
  ]);

  await Interaction.create([
    {
      userId: user._id,
      isDemo: true,
      personId: maya._id,
      date: new Date("2026-10-03T00:00:00.000Z"),
      type: "coffee_chat",
      notes: "Discussed CV, LinkedIn, remote work, interviews, and career direction.",
      learned: "I need to communicate my career story more clearly instead of simply listing technologies.",
      improve: "Natural introduction, storytelling, and asking more questions.",
      nextStep: "Improve introduction and practice storytelling.",
      reflection: { introClear: false, toldStory: false, followUpQuestions: true, genuineInterest: true },
    },
    {
      userId: user._id,
      isDemo: true,
      personId: lena._id,
      date: new Date("2026-10-06T00:00:00.000Z"),
      type: "networking",
      notes: "Asked how Northwind reviews code and how juniors get ownership.",
      learned: "The team pairs on the first month and reviews every pull request.",
      improve: "Prepare two specific questions about the product before the next message.",
      nextStep: "Send a short thank-you and one follow-up question.",
    },
    {
      userId: user._id,
      isDemo: true,
      personId: samir._id,
      date: new Date("2026-10-07T00:00:00.000Z"),
      type: "mentoring",
      notes: "Walked through how they structure API reviews.",
      learned: "They care more about clear trade-offs than a perfect architecture diagram.",
      improve: "Explain a decision and its cost, not only the implementation.",
      nextStep: "Rewrite one project story around a trade-off.",
    },
  ]);

  const [fullStack, backend] = await Application.create([
    {
      userId: user._id,
      isDemo: true,
      companyId: northwind._id,
      role: "Full-Stack Developer",
      jobUrl: "https://northwind.example/jobs/full-stack",
      dateApplied: new Date("2026-10-04T00:00:00.000Z"),
      status: "applied",
      cvVersion: "2026-10",
      contactId: lena._id,
      nextAction: "Follow up if there is no reply by Friday",
      followUpDate: new Date("2026-10-16T00:00:00.000Z"),
      notes: "Example application.",
    },
    {
      userId: user._id,
      isDemo: true,
      companyId: lumen._id,
      role: "Backend Developer",
      jobUrl: "https://lumenpay.example/jobs/backend",
      status: "screening",
      cvVersion: "2026-10",
      contactId: samir._id,
      notes: "Example backend application.",
    },
  ]);

  await Interview.create([
    {
      userId: user._id,
      isDemo: true,
      companyId: northwind._id,
      applicationId: fullStack._id,
      role: "Full-Stack Developer",
      date: new Date("2026-10-08T00:00:00.000Z"),
      type: "technical",
      interviewer: "Lena Ortiz",
      result: "pending",
      wentWell: "I explained a production bug clearly.",
      wentWrong: "Authentication details were fuzzy.",
      lessons: "Review session handling before the next technical round.",
      nextSteps: "Practice auth and indexing questions.",
    },
    {
      userId: user._id,
      isDemo: true,
      companyId: lumen._id,
      applicationId: backend._id,
      role: "Backend Developer",
      date: new Date("2026-10-02T00:00:00.000Z"),
      type: "hr",
      interviewer: "Amal Nasser",
      result: "passed",
      wentWell: "The introduction was calmer than last time.",
      wentWrong: "I still listed tools before the story.",
      lessons: "Lead with the problem I solved.",
      nextSteps: "Prepare a two-minute career story.",
    },
  ]);

  await CareerAction.create([
    {
      userId: user._id,
      isDemo: true,
      title: "Follow up with Lena Ortiz",
      personId: lena._id,
      companyId: northwind._id,
      dueDate: new Date("2026-10-11T00:00:00.000Z"),
      status: "pending",
    },
    {
      userId: user._id,
      isDemo: true,
      title: "Review the authentication question",
      companyId: northwind._id,
      dueDate: new Date("2026-10-13T00:00:00.000Z"),
      status: "pending",
    },
    {
      userId: user._id,
      isDemo: true,
      title: "Research Harbor Devtools engineering culture",
      companyId: harbor._id,
      personId: nora._id,
      status: "pending",
    },
  ]);

  const weekStart = startOfWeek();
  const week = await WeeklyProgress.findOne({ userId: user._id, weekStart });
  if (!week) {
    await WeeklyProgress.create({
      userId: user._id,
      isDemo: true,
      weekStart,
      wins: "Had a clear coffee chat and sent one application.",
      lessons: "Listing technologies is weaker than telling the story of the work.",
      focus: "Practice authentication and rewrite the introduction.",
    });
  }

  console.log("Example data added. Log in with the seed account and change the password in Settings.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    process.exit(1);
  });
