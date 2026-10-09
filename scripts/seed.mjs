/*
 * Seeds demo companies, one recruiter login per company, and 100 jobs.
 *
 *   pnpm seed
 *
 * Re-running is safe: users and companies are upserted (by email / GSTIN),
 * each run gives the recruiters fresh passwords, and their previous jobs
 * (with any applications on them) are replaced. Logins are written to
 * scripts/seed-output/recruiter-logins.csv — keep that file out of git.
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import pg from "pg";

const TOTAL_JOBS = 100;
const OUTPUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "seed-output");
const CSV_PATH = path.join(OUTPUT_DIR, "recruiter-logins.csv");

/* ------------------------------------------------------------------ */
/* Deterministic randomness, so job data is stable between runs        */
/* ------------------------------------------------------------------ */

let seed = 20261009;
function rand() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];
const sample = (list, n) => [...list].sort(() => rand() - 0.5).slice(0, n);

/* ------------------------------------------------------------------ */
/* Indian business identifiers (format-valid, same rules as src/lib/india.ts) */
/* ------------------------------------------------------------------ */

const GSTIN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function gstinCheckDigit(first14) {
    let sum = 0;
    for (let i = 0; i < 14; i++) {
        const product = GSTIN_CHARSET.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
        sum += Math.floor(product / 36) + (product % 36);
    }
    return GSTIN_CHARSET[(36 - (sum % 36)) % 36];
}

const gstin = (stateCode, pan) => {
    const first14 = `${stateCode}${pan}1Z`;
    return first14 + gstinCheckDigit(first14);
};

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */

const COMPANIES = [
    {
        legal_name: "Nimbus Cloudworks Private Limited",
        display_name: "Nimbus Cloudworks",
        company_type: "PRIVATE_LIMITED",
        industry: "Software Product",
        company_size: "201–500",
        founded_year: 2016,
        website: "https://nimbuscloudworks.example",
        description:
            "Nimbus builds developer tooling and managed cloud infrastructure for fast-growing SaaS teams across India and Southeast Asia.",
        pan: "AABCN4821K",
        state_code: "29",
        registration_number: "U72200KA2016PTC094512",
        address_line: "4th Floor, Prestige Tech Park, Outer Ring Road, Marathahalli",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560103",
        email: "hiring@nimbuscloudworks.example",
        recruiter: { first_name: "Ananya", last_name: "Rao", job_title: "Talent Acquisition Lead" },
        families: ["engineering", "devops", "data", "product", "design"],
    },
    {
        legal_name: "LedgerLeaf Fintech Solutions Private Limited",
        display_name: "LedgerLeaf",
        company_type: "PRIVATE_LIMITED",
        industry: "Fintech / Banking",
        company_size: "501–1,000",
        founded_year: 2014,
        website: "https://ledgerleaf.example",
        description:
            "LedgerLeaf runs payments, lending and accounting rails for over 2 lakh small businesses, with RBI-compliant infrastructure built in-house.",
        pan: "AACCL7315M",
        state_code: "27",
        registration_number: "U67190MH2014PTC253318",
        address_line: "Level 9, One BKC, G Block, Bandra Kurla Complex",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400051",
        email: "careers@ledgerleaf.example",
        recruiter: { first_name: "Rohan", last_name: "Mehta", job_title: "Senior HR Business Partner" },
        families: ["engineering", "data", "finance", "security", "sales"],
    },
    {
        legal_name: "Sanjeevani Health Technologies Private Limited",
        display_name: "Sanjeevani Health",
        company_type: "PRIVATE_LIMITED",
        industry: "Healthcare / Pharma",
        company_size: "1,001–5,000",
        founded_year: 2011,
        website: "https://sanjeevanihealth.example",
        description:
            "Sanjeevani operates a network of diagnostic labs and a telemedicine platform serving 40+ cities, pairing clinicians with modern software.",
        pan: "AADCS2290Q",
        state_code: "36",
        registration_number: "U85110TG2011PTC076641",
        address_line: "Plot 17, Hitech City Main Road, Madhapur",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500081",
        email: "talent@sanjeevanihealth.example",
        recruiter: { first_name: "Priya", last_name: "Reddy", job_title: "HR Manager" },
        families: ["healthcare", "engineering", "operations", "data", "support"],
    },
    {
        legal_name: "Vidyapath Learning Private Limited",
        display_name: "Vidyapath",
        company_type: "PRIVATE_LIMITED",
        industry: "Education / EdTech",
        company_size: "51–200",
        founded_year: 2019,
        website: "https://vidyapath.example",
        description:
            "Vidyapath delivers live and self-paced test preparation in nine Indian languages to more than a million learners.",
        pan: "AAECV5512D",
        state_code: "07",
        registration_number: "U80900DL2019PTC351276",
        address_line: "3rd Floor, Aggarwal Corporate Tower, Rajendra Place",
        city: "Delhi NCR",
        state: "Delhi",
        pincode: "110008",
        email: "people@vidyapath.example",
        recruiter: { first_name: "Karan", last_name: "Malhotra", job_title: "Recruitment Manager" },
        families: ["teaching", "content", "engineering", "marketing", "sales"],
    },
    {
        legal_name: "Trackwise Logistics Limited",
        display_name: "Trackwise Logistics",
        company_type: "PUBLIC_LIMITED",
        industry: "Logistics / Supply Chain",
        company_size: "5,000+",
        founded_year: 2008,
        website: "https://trackwiselogistics.example",
        description:
            "Trackwise moves freight for India's largest retailers through 120 warehouses and a 9,000-vehicle fleet, tracked end to end on its own platform.",
        pan: "AAFCT9043H",
        state_code: "33",
        registration_number: "L63030TN2008PLC067923",
        address_line: "No. 42, Mount Poonamallee Road, Guindy",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600032",
        email: "jobs@trackwiselogistics.example",
        recruiter: { first_name: "Meera", last_name: "Krishnan", job_title: "Head of Talent Acquisition" },
        families: ["supply", "operations", "engineering", "finance", "hr"],
    },
    {
        legal_name: "Kalaa Consumer Brands Private Limited",
        display_name: "Kalaa",
        company_type: "PRIVATE_LIMITED",
        industry: "Retail / FMCG",
        company_size: "501–1,000",
        founded_year: 2013,
        website: "https://kalaabrands.example",
        description:
            "Kalaa is a direct-to-consumer home and personal-care brand sold online and through 300+ retail partners across India.",
        pan: "AAGCK6678P",
        state_code: "24",
        registration_number: "U52100GJ2013PTC074219",
        address_line: "B-702, Mondeal Heights, SG Highway",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380015",
        email: "hr@kalaabrands.example",
        recruiter: { first_name: "Aditya", last_name: "Shah", job_title: "HR Business Partner" },
        families: ["marketing", "sales", "supply", "retail", "design"],
    },
];

/* ------------------------------------------------------------------ */
/* Job templates, grouped by family                                    */
/* ------------------------------------------------------------------ */

const ROLES = {
    engineering: [
        { title: "Frontend Engineer", dept: "Engineering - Software & QA", skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS"], nice: ["Next.js", "Tailwind CSS", "Jest", "Figma"] },
        { title: "Backend Engineer", dept: "Engineering - Software & QA", skills: ["Node.js", "PostgreSQL", "REST APIs", "TypeScript"], nice: ["Redis", "Kafka", "Docker", "GraphQL"] },
        { title: "Full Stack Developer", dept: "Engineering - Software & QA", skills: ["React", "Node.js", "PostgreSQL", "TypeScript"], nice: ["AWS", "Prisma", "Next.js"] },
        { title: "Java Developer", dept: "Engineering - Software & QA", skills: ["Java", "Spring Boot", "Microservices", "MySQL"], nice: ["Kafka", "Kubernetes", "Hibernate"] },
        { title: "Python Developer", dept: "Engineering - Software & QA", skills: ["Python", "Django", "REST APIs", "PostgreSQL"], nice: ["FastAPI", "Celery", "Docker"] },
        { title: "Android Developer", dept: "Engineering - Software & QA", skills: ["Kotlin", "Android SDK", "Jetpack Compose"], nice: ["Coroutines", "Firebase", "MVVM"] },
        { title: "QA Automation Engineer", dept: "Engineering - Software & QA", skills: ["Selenium", "Java", "TestNG", "API Testing"], nice: ["Cypress", "Playwright", "Jenkins"] },
    ],
    devops: [
        { title: "DevOps Engineer", dept: "DevOps & Cloud", skills: ["AWS", "Docker", "Kubernetes", "CI/CD"], nice: ["Terraform", "Prometheus", "Helm"] },
        { title: "Site Reliability Engineer", dept: "DevOps & Cloud", skills: ["Linux", "Kubernetes", "Monitoring", "Python"], nice: ["Grafana", "Go", "Incident Management"] },
        { title: "Cloud Architect", dept: "DevOps & Cloud", skills: ["AWS", "Azure", "Solution Architecture", "Networking"], nice: ["Terraform", "Cost Optimisation"] },
    ],
    data: [
        { title: "Data Analyst", dept: "Data Science & Analytics", skills: ["SQL", "Excel", "Power BI", "Python"], nice: ["Tableau", "Statistics", "Looker"] },
        { title: "Data Scientist", dept: "Data Science & Analytics", skills: ["Python", "Machine Learning", "SQL", "Statistics"], nice: ["PyTorch", "NLP", "MLOps"] },
        { title: "Data Engineer", dept: "Data Science & Analytics", skills: ["Python", "Spark", "SQL", "Airflow"], nice: ["Snowflake", "dbt", "Kafka"] },
        { title: "Machine Learning Engineer", dept: "Data Science & Analytics", skills: ["Python", "PyTorch", "MLOps", "Docker"], nice: ["LLMs", "Kubernetes", "Vector Databases"] },
    ],
    product: [
        { title: "Product Manager", dept: "Product Management", skills: ["Product Strategy", "Roadmapping", "User Research", "Analytics"], nice: ["SQL", "A/B Testing", "Jira"] },
        { title: "Associate Product Manager", dept: "Product Management", skills: ["Product Thinking", "Communication", "Analytics"], nice: ["SQL", "Figma", "Wireframing"] },
    ],
    design: [
        { title: "UI/UX Designer", dept: "UX, Design & Architecture", skills: ["Figma", "Wireframing", "Prototyping", "User Research"], nice: ["Design Systems", "Adobe XD", "Motion Design"] },
        { title: "Graphic Designer", dept: "UX, Design & Architecture", skills: ["Adobe Photoshop", "Adobe Illustrator", "Typography"], nice: ["Canva", "After Effects", "Packaging Design"] },
    ],
    security: [
        { title: "Security Engineer", dept: "IT & Information Security", skills: ["Application Security", "OWASP", "Penetration Testing"], nice: ["SIEM", "ISO 27001", "Cloud Security"] },
        { title: "IT Compliance Analyst", dept: "IT & Information Security", skills: ["ISO 27001", "Risk Assessment", "Audit"], nice: ["SOC 2", "RBI Guidelines", "PCI DSS"] },
    ],
    finance: [
        { title: "Financial Analyst", dept: "Finance & Accounting", skills: ["Financial Modelling", "Excel", "Budgeting", "Forecasting"], nice: ["Power BI", "SAP", "SQL"] },
        { title: "Accounts Executive", dept: "Finance & Accounting", skills: ["Tally", "GST", "Accounts Payable", "Reconciliation"], nice: ["TDS", "Excel", "Zoho Books"] },
        { title: "Chartered Accountant", dept: "Finance & Accounting", skills: ["Ind AS", "Statutory Audit", "Taxation", "GST"], nice: ["SAP FICO", "Transfer Pricing"], edu: "CA / CS / ICWA" },
    ],
    sales: [
        { title: "Business Development Executive", dept: "Sales & Business Development", skills: ["B2B Sales", "Lead Generation", "Negotiation", "CRM"], nice: ["Salesforce", "Cold Calling", "LinkedIn Sales Navigator"] },
        { title: "Key Account Manager", dept: "Sales & Business Development", skills: ["Account Management", "Client Relationship", "Negotiation"], nice: ["Upselling", "CRM", "Excel"] },
        { title: "Inside Sales Representative", dept: "Sales & Business Development", skills: ["Inside Sales", "Communication", "CRM"], nice: ["Hindi", "Objection Handling", "Freshsales"] },
    ],
    marketing: [
        { title: "Digital Marketing Manager", dept: "Marketing & Communication", skills: ["SEO", "Google Ads", "Meta Ads", "Analytics"], nice: ["Marketing Automation", "GA4", "Content Strategy"] },
        { title: "Performance Marketing Specialist", dept: "Marketing & Communication", skills: ["Google Ads", "Meta Ads", "Campaign Optimisation"], nice: ["Excel", "Attribution", "Amazon Ads"] },
        { title: "Brand Manager", dept: "Marketing & Communication", skills: ["Brand Strategy", "Consumer Insights", "Campaign Management"], nice: ["Market Research", "Agency Management"], edu: "MBA / PGDM" },
        { title: "Social Media Executive", dept: "Marketing & Communication", skills: ["Social Media Marketing", "Content Creation", "Instagram"], nice: ["Canva", "Influencer Marketing", "Video Editing"] },
    ],
    healthcare: [
        { title: "Lab Technician", dept: "Healthcare & Life Sciences", skills: ["Sample Collection", "Clinical Pathology", "Lab Safety"], nice: ["NABL Standards", "LIMS"], edu: "Diploma" },
        { title: "Medical Officer (Telemedicine)", dept: "Healthcare & Life Sciences", skills: ["MBBS", "Teleconsultation", "Patient Care"], nice: ["EMR Systems", "Hindi", "Telugu"], edu: "Any graduate" },
        { title: "Clinical Data Coordinator", dept: "Healthcare & Life Sciences", skills: ["Clinical Data Management", "GCP", "Excel"], nice: ["SAS", "Medical Coding"] },
    ],
    operations: [
        { title: "Operations Manager", dept: "Customer Success, Service & Operations", skills: ["Operations Management", "Process Improvement", "Team Leadership"], nice: ["Six Sigma", "Excel", "Vendor Management"] },
        { title: "Operations Executive", dept: "Customer Success, Service & Operations", skills: ["Coordination", "MS Excel", "Communication"], nice: ["ERP", "MIS Reporting"] },
    ],
    support: [
        { title: "Customer Support Associate", dept: "Customer Success, Service & Operations", skills: ["Customer Service", "Communication", "Ticketing Tools"], nice: ["Hindi", "Freshdesk", "Zendesk"] },
        { title: "Customer Success Manager", dept: "Customer Success, Service & Operations", skills: ["Customer Success", "Onboarding", "Retention"], nice: ["SaaS", "Gainsight", "Upselling"] },
    ],
    teaching: [
        { title: "Mathematics Faculty (JEE)", dept: "Teaching & Training", skills: ["Mathematics", "JEE Preparation", "Online Teaching"], nice: ["Doubt Solving", "Content Creation"] },
        { title: "Physics Faculty (NEET)", dept: "Teaching & Training", skills: ["Physics", "NEET Preparation", "Online Teaching"], nice: ["Hindi", "Question Bank Creation"] },
        { title: "Academic Counsellor", dept: "Teaching & Training", skills: ["Counselling", "Sales", "Communication"], nice: ["EdTech", "CRM", "Hindi"] },
    ],
    content: [
        { title: "Content Writer", dept: "Content, Editorial & Journalism", skills: ["Content Writing", "SEO Writing", "Research"], nice: ["WordPress", "Hindi", "Copywriting"] },
        { title: "Video Editor", dept: "Media Production & Entertainment", skills: ["Adobe Premiere Pro", "After Effects", "Storytelling"], nice: ["DaVinci Resolve", "YouTube", "Motion Graphics"] },
    ],
    supply: [
        { title: "Supply Chain Analyst", dept: "Procurement & Supply Chain", skills: ["Demand Planning", "Excel", "Inventory Management"], nice: ["SAP MM", "SQL", "Power BI"] },
        { title: "Warehouse Manager", dept: "Procurement & Supply Chain", skills: ["Warehouse Operations", "Inventory Control", "Team Management"], nice: ["WMS", "5S", "Safety Compliance"] },
        { title: "Procurement Executive", dept: "Procurement & Supply Chain", skills: ["Vendor Management", "Purchase Orders", "Negotiation"], nice: ["SAP", "Cost Analysis"] },
        { title: "Fleet Coordinator", dept: "Procurement & Supply Chain", skills: ["Fleet Management", "Route Planning", "Coordination"], nice: ["GPS Tracking", "Excel"] },
    ],
    hr: [
        { title: "HR Executive", dept: "Human Resources", skills: ["Recruitment", "Onboarding", "HR Operations"], nice: ["Payroll", "HRMS", "Labour Law"] },
        { title: "Talent Acquisition Specialist", dept: "Human Resources", skills: ["Sourcing", "Interviewing", "Stakeholder Management"], nice: ["Naukri", "LinkedIn Recruiter", "Employer Branding"] },
    ],
    retail: [
        { title: "Store Manager", dept: "Retail & Merchandising", skills: ["Retail Operations", "Team Management", "Sales"], nice: ["Visual Merchandising", "POS"] },
        { title: "Category Manager", dept: "Retail & Merchandising", skills: ["Category Management", "Pricing", "Vendor Negotiation"], nice: ["E-commerce", "Excel", "Marketplace Management"] },
    ],
};

/* Experience bands per level: [level, min, max, salary LPA min, salary LPA max] */
const LEVELS = [
    ["ENTRY", 0, 2, 3, 7],
    ["MID", 2, 5, 7, 16],
    ["SENIOR", 5, 9, 15, 30],
    ["LEAD", 8, 14, 25, 50],
];

const PREFIX = { ENTRY: ["Junior ", "", ""], MID: [""], SENIOR: ["Senior "], LEAD: ["Lead ", "Principal "] };

const EDUCATION_BY_DEPT = {
    "Engineering - Software & QA": "B.Tech / B.E.",
    "DevOps & Cloud": "B.Tech / B.E.",
    "Data Science & Analytics": "Any graduate",
    "Finance & Accounting": "B.Com / BBA",
    "Product Management": "Any graduate",
};

const BENEFITS = [
    "Health insurance",
    "Provident fund",
    "Performance bonus",
    "Flexible hours",
    "Work from home allowance",
    "Paid time off",
    "Learning budget",
    "Stock options / ESOPs",
    "Parental leave",
    "Meal allowance",
    "Transport / cab",
    "Gym / wellness",
];

const NEARBY_CITIES = {
    Bengaluru: ["Bengaluru", "Hyderabad", "Chennai", "Pune"],
    Mumbai: ["Mumbai", "Pune", "Bengaluru"],
    Hyderabad: ["Hyderabad", "Bengaluru", "Chennai", "Pune"],
    "Delhi NCR": ["Delhi NCR", "Noida", "Gurugram", "Jaipur"],
    Chennai: ["Chennai", "Bengaluru", "Kochi", "Hyderabad"],
    Ahmedabad: ["Ahmedabad", "Mumbai", "Pune", "Jaipur"],
};

function deriveLocation(workMode, locations) {
    if (workMode === "REMOTE") return locations.length ? `Remote · ${locations.join(", ")}` : "Remote";
    const cities = locations.join(", ");
    return workMode === "HYBRID" ? `${cities} · Hybrid` : cities;
}

function describe(role, company, level, skills) {
    const years = level[2] === 0 ? "freshers and early-career candidates" : `${level[1]}–${level[2]} years of experience`;
    return [
        `<p>${company.display_name} is hiring a <strong>${role.title}</strong> to join our ${role.dept.split(" - ")[0].toLowerCase()} team. ${company.description}</p>`,
        `<h3>What you'll do</h3>`,
        `<ul>`,
        `<li>Own day-to-day ${role.title.toLowerCase()} responsibilities and deliver measurable outcomes each quarter.</li>`,
        `<li>Work closely with cross-functional partners to plan, prioritise and ship work.</li>`,
        `<li>Apply ${skills.slice(0, 2).join(" and ")} to solve real problems for our customers.</li>`,
        `<li>Document what you build and share learnings with the wider team.</li>`,
        `</ul>`,
        `<h3>What we're looking for</h3>`,
        `<ul>`,
        `<li>This role suits ${years}.</li>`,
        `<li>Hands-on strength in ${skills.join(", ")}.</li>`,
        `<li>Clear written and verbal communication, and a bias for ownership.</li>`,
        `</ul>`,
        `<p>We review every application and aim to respond within 7 working days.</p>`,
    ].join("");
}

function buildJob(company, recruiterId, index) {
    const role = pick(company.families.flatMap((f) => ROLES[f]));
    const level = pick(role.title.startsWith("Junior") || role.title.startsWith("Associate") ? LEVELS.slice(0, 1) : LEVELS);
    const [experience_level, levelMin, levelMax, payMin, payMax] = level;

    const employment_type =
        experience_level === "ENTRY" && rand() < 0.25 ? "INTERNSHIP" : rand() < 0.08 ? "CONTRACT" : rand() < 0.05 ? "PART_TIME" : "FULL_TIME";
    const work_mode = pick(["ONSITE", "ONSITE", "HYBRID", "HYBRID", "REMOTE"]);
    const nearby = NEARBY_CITIES[company.city];
    const locations = work_mode === "REMOTE" ? (rand() < 0.5 ? [] : ["India"]) : sample(nearby, int(1, 2));

    const min_experience = employment_type === "INTERNSHIP" ? 0 : int(levelMin, levelMin + 1);
    const max_experience = employment_type === "INTERNSHIP" ? 0 : int(Math.max(min_experience, levelMax - 1), levelMax);

    const internship = employment_type === "INTERNSHIP";
    const salary_min = internship ? int(1, 3) : int(payMin, Math.round((payMin + payMax) / 2));
    const salary_max = internship ? salary_min + 1 : int(salary_min + 2, payMax + 4);

    const skills = sample(role.skills, Math.max(2, role.skills.length - int(0, 1)));
    const nice_to_have_skills = sample(role.nice, int(1, role.nice.length));

    const roll = rand();
    const status = roll < 0.85 ? "PUBLISHED" : roll < 0.94 ? "DRAFT" : "CLOSED";

    const daysAgo = int(0, 45);
    const created_at = new Date(Date.now() - daysAgo * 86_400_000 - int(0, 86_399) * 1000);
    const application_deadline =
        rand() < 0.6 ? new Date(new Date(new Date().toDateString()).getTime() + int(10, 60) * 86_400_000) : null;

    const title = internship
        ? `${role.title} Intern`
        : /^(Junior|Associate|Senior|Lead|Head) /.test(role.title)
          ? role.title
          : `${pick(PREFIX[experience_level])}${role.title}`;

    return {
        id: crypto.randomUUID(),
        recruiterId,
        title,
        description: describe(role, company, level, skills),
        location: deriveLocation(work_mode, locations),
        department: role.dept,
        employment_type,
        experience_level,
        work_mode,
        locations,
        openings: internship ? int(2, 10) : pick([1, 1, 1, 2, 2, 3, 5]),
        min_experience,
        max_experience,
        salary_min,
        salary_max,
        salary_disclosed: rand() < 0.85,
        skills,
        nice_to_have_skills,
        education: role.edu ?? EDUCATION_BY_DEPT[role.dept] ?? pick(["Any graduate", "Any graduate", "Any qualification"]),
        benefits: sample(BENEFITS, int(3, 7)),
        resume_required: rand() < 0.9,
        application_deadline,
        status,
        created_at,
        index,
    };
}

/* ------------------------------------------------------------------ */
/* Passwords                                                           */
/* ------------------------------------------------------------------ */

function generatePassword() {
    // Readable but strong: e.g. "Kite-Rumba-7342!" (letters, number, symbol, 14+ chars).
    const words = ["Maple", "Kite", "Rumba", "Orbit", "Tiger", "Lotus", "Cobalt", "Falcon", "Mango", "Saffron", "Pixel", "Harbor"];
    const w = () => words[crypto.randomInt(words.length)];
    const digits = String(crypto.randomInt(1000, 10000));
    const symbol = "!@#$%&*"[crypto.randomInt(7)];
    return `${w()}-${w()}-${digits}${symbol}`;
}

const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const logins = [];

try {
    await client.query("BEGIN");

    const recruiters = [];
    for (const company of COMPANIES) {
        const companyGstin = gstin(company.state_code, company.pan);

        const { rows: [companyRow] } = await client.query(
            `INSERT INTO "Company" (id, legal_name, display_name, company_type, industry, company_size, founded_year,
                website, description, gstin, pan, registration_number, address_line, city, state, pincode,
                verification_status, verified_at, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'VERIFIED',now(),now(),now())
             ON CONFLICT (gstin) DO UPDATE SET
                legal_name = EXCLUDED.legal_name, display_name = EXCLUDED.display_name,
                company_type = EXCLUDED.company_type, industry = EXCLUDED.industry,
                company_size = EXCLUDED.company_size, founded_year = EXCLUDED.founded_year,
                website = EXCLUDED.website, description = EXCLUDED.description, pan = EXCLUDED.pan,
                registration_number = EXCLUDED.registration_number, address_line = EXCLUDED.address_line,
                city = EXCLUDED.city, state = EXCLUDED.state, pincode = EXCLUDED.pincode,
                verification_status = 'VERIFIED', verified_at = now(), updated_at = now()
             RETURNING id`,
            [
                crypto.randomUUID(), company.legal_name, company.display_name, company.company_type,
                company.industry, company.company_size, company.founded_year, company.website,
                company.description, companyGstin, company.pan, company.registration_number,
                company.address_line, company.city, company.state, company.pincode,
            ]
        );

        const password = generatePassword();
        const hash = await bcrypt.hash(password, 10);
        const { rows: [user] } = await client.query(
            `INSERT INTO "User" (id, email, password_hash, role, is_active, created_at, updated_at)
             VALUES ($1, lower($2), $3, 'RECRUITER', true, now(), now())
             ON CONFLICT (email) DO UPDATE
               SET role = 'RECRUITER', password_hash = EXCLUDED.password_hash, is_active = true, updated_at = now()
             RETURNING id, email`,
            [crypto.randomUUID(), company.email, hash]
        );

        const { recruiter: r } = company;
        const { rows: [profile] } = await client.query(
            `INSERT INTO "RecruiterProfile" (id, "userId", first_name, last_name, company_name, job_title, phone,
                department, linkedin_url, hiring_for, hiring_volume, "companyId", onboarding_completed, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'Human Resources / Talent Acquisition',NULL,'OWN_COMPANY','21–100 hires / year',$8,true,now(),now())
             ON CONFLICT ("userId") DO UPDATE SET
                first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
                company_name = EXCLUDED.company_name, job_title = EXCLUDED.job_title, phone = EXCLUDED.phone,
                "companyId" = EXCLUDED."companyId", onboarding_completed = true, updated_at = now()
             RETURNING id`,
            [
                crypto.randomUUID(), user.id, r.first_name, r.last_name, company.display_name,
                r.job_title, `9${String(crypto.randomInt(100000000, 1000000000))}`, companyRow.id,
            ]
        );

        // Replace this recruiter's previous jobs (and anything hanging off them).
        await client.query(
            `DELETE FROM "ApplicationStatusHistory" WHERE "applicationId" IN
               (SELECT a.id FROM "Application" a JOIN "Job" j ON j.id = a."jobId" WHERE j."recruiterId" = $1)`,
            [profile.id]
        );
        await client.query(
            `DELETE FROM "Application" WHERE "jobId" IN (SELECT id FROM "Job" WHERE "recruiterId" = $1)`,
            [profile.id]
        );
        await client.query(`DELETE FROM "Job" WHERE "recruiterId" = $1`, [profile.id]);

        recruiters.push({ company, profileId: profile.id, jobs: 0 });
        logins.push({ company, email: user.email, password, gstin: companyGstin });
    }

    // Spread the jobs across companies: an even share each, remainder to the first few.
    const counts = { PUBLISHED: 0, DRAFT: 0, CLOSED: 0 };
    for (let i = 0; i < TOTAL_JOBS; i++) {
        const target = recruiters[i % recruiters.length];
        const job = buildJob(target.company, target.profileId, i);
        await client.query(
            `INSERT INTO "Job" (id, "recruiterId", title, description, location, department, employment_type,
                experience_level, work_mode, locations, openings, min_experience, max_experience, salary_min,
                salary_max, salary_disclosed, skills, nice_to_have_skills, education, benefits, resume_required,
                application_deadline, status, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$24)`,
            [
                job.id, job.recruiterId, job.title, job.description, job.location, job.department,
                job.employment_type, job.experience_level, job.work_mode, JSON.stringify(job.locations),
                job.openings, job.min_experience, job.max_experience, job.salary_min, job.salary_max,
                job.salary_disclosed, JSON.stringify(job.skills), JSON.stringify(job.nice_to_have_skills),
                job.education, JSON.stringify(job.benefits), job.resume_required, job.application_deadline,
                job.status, job.created_at,
            ]
        );
        target.jobs++;
        counts[job.status]++;
    }

    await client.query("COMMIT");

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const header = ["company", "legal_name", "industry", "city", "gstin", "recruiter_name", "role", "email", "password", "jobs_seeded"];
    const rows = logins.map((l, i) => [
        l.company.display_name, l.company.legal_name, l.company.industry, l.company.city, l.gstin,
        `${l.company.recruiter.first_name} ${l.company.recruiter.last_name}`, "RECRUITER",
        l.email, l.password, recruiters[i].jobs,
    ]);
    fs.writeFileSync(CSV_PATH, [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n");

    console.log(`Seeded ${recruiters.length} companies and ${TOTAL_JOBS} jobs ` +
        `(${counts.PUBLISHED} published, ${counts.DRAFT} draft, ${counts.CLOSED} closed).`);
    for (const r of recruiters) console.log(`  ${r.company.display_name.padEnd(22)} ${r.jobs} jobs`);
    console.log(`Logins written to ${path.relative(process.cwd(), CSV_PATH)}`);
} catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed, nothing was saved:", error);
    process.exitCode = 1;
} finally {
    await client.end();
}
