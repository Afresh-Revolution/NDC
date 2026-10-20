import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { getSql } from "./engine";

const scrypt = promisify(scryptCb);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

const CHAPTERS = [
  ["KD", "Kaduna"], ["KN", "Kano"], ["KT", "Katsina"], ["SO", "Sokoto"],
  ["KB", "Kebbi"], ["ZA", "Zamfara"], ["JI", "Jigawa"], ["BA", "Bauchi"],
  ["GO", "Gombe"], ["YO", "Yobe"], ["BO", "Borno"], ["AD", "Adamawa"],
  ["TA", "Taraba"], ["PL", "Plateau"], ["NI", "Niger"], ["KW", "Kwara"],
  ["KO", "Kogi"], ["NA", "Nasarawa"], ["BE", "Benue"], ["FC", "FCT Abuja"],
];

const SKILLS = [
  ["frontend", "Frontend engineering", "engineering"],
  ["backend", "Backend engineering", "engineering"],
  ["mobile", "Mobile engineering", "engineering"],
  ["devops", "DevOps / SRE", "engineering"],
  ["qa", "Quality assurance", "engineering"],
  ["security", "Cybersecurity", "engineering"],
  ["data", "Data / AI engineering", "engineering"],
  ["game", "Game development", "engineering"],
  ["design", "UI/UX and product design", "design"],
  ["pm", "Technical product management", "product"],
  ["writing", "Technical writing", "product"],
  ["founder", "Founding / commercialisation", "product"],
];

const POLICIES = [
  ["code-of-conduct", "Code of Conduct", "1.0",
    "Members must not harass, discriminate, plagiarise, distribute malicious code, misuse credentials, or make deceptive portfolio claims. Responsible vulnerability disclosure, confidentiality, and explicit authorisation for security testing are required. Vote buying, forged receipts, favour trading and procurement collusion are prohibited."],
  ["bylaws", "Cooperative Bylaws (proposed)", "1.0",
    "Proposed framework pending member adoption and professional/regulatory review. One-member-one-vote is the baseline where compatible with registration class. Membership does not automatically guarantee project financing, employment, loans, or investment returns."],
  ["funding-risk", "Funding Risk Disclosure", "1.0",
    "Project support is gated, evidence-based, and never an entitlement. A project that fails must not cause a hidden loss against unrelated members' withdrawable contributions. Loans, crowdfunding and equity products remain disabled until authorised."],
  ["privacy", "Privacy Notice (NDPA 2023)", "1.0",
    "NDC processes identity, membership, financial and project data under the Nigeria Data Protection Act 2023. Members may request access, correction, and portability of their own data. Contracts, identity files and private code use private signed-download URLs."],
  ["ip-commitment", "Intellectual Property Commitment", "1.0",
    "NDC membership does not transfer existing ideas, repositories, patents, designs or client work to the cooperative. Ownership depends on the signed project-specific legal instrument. Background IP remains with the founder."],
  ["savings-policy", "Member Savings and Withdrawal Policy (proposed)", "1.0",
    "Monthly savings are recorded as member claims, not operating revenue. Withdrawals follow bylaws, liquidity planning and legal obligations. Three consecutive months of arrears trigger notice and a 30-day response window; savings are not confiscated automatically."],
];

async function seed() {
  const sql = await getSql();

  for (const [code, name] of CHAPTERS) {
    await sql`
      INSERT INTO chapters (state_code, name, description)
      VALUES (${code}, ${name}, ${`NDC chapter for ${name}, initially organised around Northern Nigeria.`})
      ON CONFLICT (state_code) DO NOTHING
    `;
  }

  const pools = [
    ["member_savings", "Member savings liability", "Recorded member contributions and approved withdrawals. Not speculative venture capital.", true],
    ["operating", "Operating fund", "Administration, audit, support, approved staff and platform expenses.", false],
    ["project_development", "Project development fund", "Prototype grants and limited milestone support from authorised risk capital only.", true],
    ["reserve", "Reserve / contingency", "Unexpected costs and credit/project losses under board-approved reserve policy.", true],
    ["client_escrow", "Client escrow / contract receipts", "Milestone payments for studio work. Contract-specific segregation.", true],
    ["external_grant", "External sponsorship / grants", "Programme-specific deliverables under restricted-use terms.", true],
  ] as const;
  for (const [kind, name, description, restricted] of pools) {
    await sql`
      INSERT INTO fund_pools (kind, name, description, restricted)
      VALUES (${kind}::fund_pool_kind, ${name}, ${description}, ${restricted})
      ON CONFLICT (kind) DO NOTHING
    `;
  }

  const poolIds = Object.fromEntries(
    (await sql<{ id: string; kind: string }[]>`SELECT id, kind::text FROM fund_pools`).map((p) => [p.kind, p.id]),
  );

  const accounts: [string, string, string, string | null, boolean][] = [
    ["1100", "Operating cash", "asset", "operating", false],
    ["1110", "Payment processor clearing", "asset", "operating", false],
    ["1200", "Project development cash", "asset", "project_development", false],
    ["1300", "Reserve cash", "asset", "reserve", false],
    ["1400", "Client escrow cash", "asset", "client_escrow", false],
    ["1500", "Restricted grant cash", "asset", "external_grant", false],
    ["2100", "Member savings liability", "liability", "member_savings", true],
    ["2200", "Contractor payables", "liability", "operating", false],
    ["2300", "Unearned studio receipts", "liability", "client_escrow", false],
    ["3100", "Member share capital", "equity", null, false],
    ["3200", "Operating surplus", "equity", "operating", false],
    ["3300", "Reserve equity", "equity", "reserve", false],
    ["4100", "Membership fees", "revenue", "operating", false],
    ["4200", "Studio margin (earned)", "revenue", "operating", false],
    ["4300", "Training and enterprise fees", "revenue", "operating", false],
    ["4400", "Grant administration overhead", "revenue", "operating", false],
    ["5100", "Operating expenses", "expense", "operating", false],
    ["5200", "Project grants and milestone support", "expense", "project_development", false],
    ["5300", "Developer compensation (studio)", "expense", "operating", false],
  ];
  for (const [code, name, type, pool, savings] of accounts) {
    await sql`
      INSERT INTO accounts (code, name, type, fund_pool_id, is_savings_liability)
      VALUES (
        ${code}, ${name}, ${type}::account_type,
        ${pool ? poolIds[pool] : null}, ${savings}
      )
      ON CONFLICT (code) DO NOTHING
    `;
  }

  await sql`
    INSERT INTO reserves (name, target_kobo, policy)
    SELECT 'General contingency', 0,
      'Board-approved reserve policy. Project losses cannot be charged to member savings liabilities.'
    WHERE NOT EXISTS (SELECT 1 FROM reserves)
  `;

  const roles = [
    ["super_admin", "Super Administrator", "Full platform, finance, policy and membership control. Dual-control still required for payouts."],
    ["admin", "National Administrator", "Admissions, operations and cooperative administration."],
    ["board", "Board of Directors", "Strategy, risk appetite, budget and policy adoption."],
    ["secretariat", "Management / Secretariat", "Membership operations, support, procurement and contract execution."],
    ["finance_audit", "Finance / Audit committee", "Statements, reconciliations, reserves and independent audit coordination."],
    ["technical_review", "Technical Review committee", "Architecture, engineering standards, cyber/data diligence, milestones."],
    ["investment_project", "Investment / Project committee", "Project triage, funding decisions and monitored exposure."],
    ["ethics", "Ethics and Disputes committee", "Conflicts of interest, grievances, procedural fairness and appeals."],
    ["chapter_coordinator", "State chapter coordinator", "Local programmes and support; no unrestricted finance powers."],
    ["member", "Full professional member", "Vote, submit projects and join paid delivery teams subject to eligibility."],
    ["associate", "Associate / student", "Training and mentorship; no automatic voting, borrowing or project finance rights."],
    ["partner", "Corporate / partner", "Sponsored challenges and mentorship under contract."],
  ];
  for (const [slug, name, description] of roles) {
    await sql`
      INSERT INTO roles (slug, name, description, is_system)
      VALUES (${slug}, ${name}, ${description}, true)
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  const permissions = [
    ["members.read", "View members", "membership"],
    ["members.verify", "Verify identity and admit members", "membership"],
    ["members.sanction", "Issue sanctions", "membership"],
    ["finance.invoice", "Issue invoices", "finance"],
    ["finance.reconcile", "Reconcile payments", "finance"],
    ["finance.treasury", "View treasury and fund pools", "finance"],
    ["finance.withdraw.approve", "Approve withdrawals (dual control)", "finance"],
    ["finance.export", "Export financial reports", "finance"],
    ["projects.review", "Review project submissions", "funding"],
    ["projects.score", "Score projects", "funding"],
    ["projects.decide", "Funding committee decision", "funding"],
    ["projects.disburse", "Approve milestone disbursement", "funding"],
    ["studio.manage", "Manage studio contracts", "studio"],
    ["governance.roles", "Manage roles and permissions", "governance"],
    ["governance.committees", "Manage committees", "governance"],
    ["governance.policies", "Publish policy versions", "governance"],
    ["audit.read", "Read audit logs", "compliance"],
    ["support.handle", "Handle tickets, complaints and appeals", "compliance"],
    ["reports.read", "View operational reports", "governance"],
    ["flags.manage", "Toggle feature flags", "platform"],
  ];
  for (const [slug, name, domain] of permissions) {
    await sql`
      INSERT INTO permissions (slug, name, domain) VALUES (${slug}, ${name}, ${domain})
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  const allPerms = await sql<{ id: string; slug: string }[]>`SELECT id, slug FROM permissions`;
  const allRoles = await sql<{ id: string; slug: string }[]>`SELECT id, slug FROM roles`;
  const roleBy = Object.fromEntries(allRoles.map((r) => [r.slug, r.id]));
  const permBy = Object.fromEntries(allPerms.map((p) => [p.slug, p.id]));

  const grant = async (role: string, slugs: string[]) => {
    for (const s of slugs) {
      await sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${roleBy[role]}, ${permBy[s]})
        ON CONFLICT DO NOTHING
      `;
    }
  };

  await grant("super_admin", allPerms.map((p) => p.slug));
  await grant("admin", allPerms.map((p) => p.slug).filter((s) => s !== "flags.manage"));
  await grant("finance_audit", [
    "finance.invoice", "finance.reconcile", "finance.treasury",
    "finance.withdraw.approve", "finance.export", "audit.read", "reports.read",
  ]);
  await grant("investment_project", ["projects.review", "projects.score", "projects.decide", "reports.read"]);
  await grant("technical_review", ["projects.review", "projects.score"]);
  await grant("ethics", ["members.sanction", "support.handle", "audit.read"]);
  await grant("secretariat", ["members.read", "members.verify", "support.handle", "studio.manage"]);
  await grant("board", ["reports.read", "finance.treasury", "governance.policies", "audit.read"]);
  await grant("chapter_coordinator", ["members.read", "support.handle"]);

  const committees = [
    ["general_assembly", "General Assembly", "Elect board, ratify bylaws, budgets, audits, material investment and governance policies."],
    ["board", "Board of Directors", "Strategy, risk appetite, budget, executive oversight and policy adoption."],
    ["finance_audit", "Finance / Audit committee", "Statements, reconciliations, reserves, controls and independent audit coordination."],
    ["technical_review", "Technical Review committee", "Architecture, engineering standards, cyber/data diligence, milestones."],
    ["investment_project", "Investment / Project committee", "Project triage, funding decisions and monitored exposure."],
    ["ethics", "Ethics and Disputes committee", "Conflicts of interest, grievances, procedural fairness and appeals."],
  ];
  for (const [slug, name, mandate] of committees) {
    await sql`
      INSERT INTO committees (slug, name, mandate, min_members)
      VALUES (${slug}, ${name}, ${mandate}, 2)
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  for (const [slug, name, category] of SKILLS) {
    await sql`
      INSERT INTO skills (slug, name, category) VALUES (${slug}, ${name}, ${category})
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  for (const [slug, title, version, body] of POLICIES) {
    await sql`
      INSERT INTO policy_versions (slug, title, body, version, published)
      VALUES (${slug}, ${title}, ${body}, ${version}, true)
      ON CONFLICT (slug, version) DO NOTHING
    `;
  }

  const flags: [string, boolean, string][] = [
    ["loans", false, "Member credit / repayable facilities. Disabled until counsel opinion and lending permissions."],
    ["investment", false, "Investment products. Disabled until SEC-compliant structure exists."],
    ["disbursement", false, "Milestone fund distributions. Requires signed agreement, dual approval, and board/member authorisation."],
    ["public_equity_portal", false, "Must not operate an unregistered public equity/debt funding portal."],
    ["studio", true, "Client studio workflows."],
    ["mentorship", true, "Mentorship and learning programmes."],
  ];
  for (const [key, enabled, description] of flags) {
    await sql`
      INSERT INTO feature_flags (key, enabled, description)
      VALUES (${key}, ${enabled}, ${description})
      ON CONFLICT (key) DO UPDATE SET description = excluded.description
    `;
  }

  const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? "admin@ndcnaija.org";
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe_SuperAdmin_2026!";
  const adminName = process.env.SUPER_ADMIN_NAME ?? "NDC Super Admin";
  const hash = await hashPassword(adminPassword);
  const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${adminEmail}`;
  let adminId = existing[0]?.id;
  if (!adminId) {
    const [u] = await sql<{ id: string }[]>`
      INSERT INTO users (email, password_hash, status, email_verified_at, mfa_enabled)
      VALUES (${adminEmail}, ${hash}, 'active', now(), false)
      RETURNING id
    `;
    adminId = u.id;
    const [first, ...rest] = adminName.split(" ");
    await sql`
      INSERT INTO profiles (user_id, first_name, last_name, display_name, digital_card_number)
      VALUES (${adminId}, ${first}, ${rest.join(" ") || "Administrator"}, ${adminName}, ${"NDC-000001"})
    `;
    await sql`INSERT INTO developer_profiles (user_id) VALUES (${adminId})`;
    await sql`
      INSERT INTO memberships (user_id, class, status, joined_at, approved_at)
      VALUES (${adminId}, 'full_professional', 'active', now(), now())
    `;
  } else {
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${adminId}`;
  }
  await sql`
    INSERT INTO user_roles (user_id, role_id)
    VALUES (${adminId}, ${roleBy.super_admin})
    ON CONFLICT DO NOTHING
  `;

  const news = [
    ["proposed-framework", "NDC publishes proposed cooperative framework",
      "Version 1.0 of the master roadmap is a research-grounded blueprint, not a promise of loans or guaranteed returns.",
      "Northside Developers Cooperative (NDC Naija) is proposed as a member-owned institution for software developers and adjacent technology professionals, initially organised around Northern Nigeria. Membership does not automatically guarantee project financing, employment, loans, or investment returns."],
    ["savings-are-liabilities", "Why member savings are not operating revenue",
      "At 100 members contributing ₦10,000, the ledger records an obligation — not free capital.",
      "Funds owed back to members must be separately recorded and safeguarded. A project that fails must not cause a hidden loss against unrelated members' withdrawable contributions."],
  ];
  for (const [slug, title, excerpt, body] of news) {
    await sql`
      INSERT INTO news_posts (slug, title, excerpt, body, published_at, created_by)
      VALUES (${slug}, ${title}, ${excerpt}, ${body}, now(), ${adminId})
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  const programmes = [
    ["Responsible product diligence clinic", "Structured customer interviews, competitor maps and willingness-to-pay evidence for member teams.", 0],
    ["Studio delivery standards", "QA, acceptance tests, IP hygiene and milestone reporting for paid cooperative work.", 0],
    ["Open-source maintenance circle", "Sponsorship discovery, maintenance contracts and microgrants — never a claim on member savings.", 0],
  ] as const;
  for (const [title, synopsis, fee] of programmes) {
    await sql`
      INSERT INTO training_programmes (title, synopsis, fee_kobo, is_public)
      SELECT ${title}, ${synopsis}, ${fee}, true
      WHERE NOT EXISTS (SELECT 1 FROM training_programmes WHERE title = ${title})
    `;
  }

  await sql`
    INSERT INTO communities (slug, name, description)
    VALUES
      ('frontend', 'Frontend builders', 'UI engineering, design systems and accessibility.'),
      ('backend', 'Backend and platforms', 'APIs, data, reliability and security.'),
      ('founders', 'Technical founders', 'Evidence-based product commercialisation.')
    ON CONFLICT (slug) DO NOTHING
  `;

  await sql`
    INSERT INTO oss_opportunities (title, kind, description, is_public)
    SELECT 'Maintainer microgrant intake', 'maintenance',
      'Documented open-source maintainers may request non-dilutive support from the project development fund — never from member savings.',
      true
    WHERE NOT EXISTS (SELECT 1 FROM oss_opportunities)
  `;

  console.log(`Seed complete. Super admin: ${adminEmail}`);
  await sql.end();
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
