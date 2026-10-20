-- =============================================================================
-- NDC Naija — PostgreSQL schema
-- Double-entry ledger, membership, governance, funding, studio, compliance
-- Money is stored as integer kobo (NGN minor units). Posted journals never
-- mutate in place; they are reversed. Project risk spend cannot post against
-- member savings liability accounts.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'resigned', 'denied');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE membership_class AS ENUM (
    'full_professional',
    'associate_student',
    'corporate_partner',
    'honorary_adviser'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM (
    'draft',
    'submitted',
    'payment_pending',
    'under_review',
    'active',
    'denied',
    'appealing',
    'arrears',
    'paused',
    'resigned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fund_pool_kind AS ENUM (
    'member_savings',
    'operating',
    'project_development',
    'reserve',
    'client_escrow',
    'external_grant'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_stage AS ENUM (
    'submission',
    'validation',
    'technical_diligence',
    'commercial_diligence',
    'funding_committee',
    'execution',
    'monitoring',
    'closed',
    'rejected',
    'paused',
    'restructured'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_type AS ENUM (
    'prototype_mvp',
    'existing_revenue',
    'open_source',
    'community_benefit',
    'scalable_startup'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending', 'in_progress', 'completed', 'recused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Identity and membership
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL UNIQUE,
  phone           text UNIQUE,
  password_hash   text NOT NULL,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  mfa_secret      text,
  mfa_enabled     boolean NOT NULL DEFAULT false,
  mfa_backup_codes text[],
  status          user_status NOT NULL DEFAULT 'pending',
  last_login_at   timestamptz,
  mfa_last_step   bigint,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_last_step bigint;

CREATE TABLE IF NOT EXISTS chapters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code    text NOT NULL UNIQUE,
  name          text NOT NULL,
  region        text NOT NULL DEFAULT 'Northern Nigeria',
  coordinator_user_id uuid REFERENCES users(id),
  status        text NOT NULL DEFAULT 'active',
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id           uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  display_name      text NOT NULL,
  bio               text,
  city              text,
  state_code        text,
  country           text NOT NULL DEFAULT 'NG',
  avatar_url        text,
  headline          text,
  digital_card_number text UNIQUE,
  chapter_id        uuid REFERENCES chapters(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developer_profiles (
  user_id             uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  discipline          text,
  seniority           text,
  years_experience    numeric(4,1),
  availability        text,
  open_to_studio      boolean NOT NULL DEFAULT true,
  open_to_mentorship  boolean NOT NULL DEFAULT false,
  github_login        text,
  github_url          text,
  gitlab_url          text,
  website_url         text,
  preferred_stack     text[],
  hourly_rate_kobo    integer,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      text NOT NULL UNIQUE,
  name      text NOT NULL,
  category  text NOT NULL
);

CREATE TABLE IF NOT EXISTS member_skills (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id    uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level       text NOT NULL DEFAULT 'intermediate',
  years       numeric(4,1),
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS portfolios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  url             text,
  description     text,
  kind            text NOT NULL DEFAULT 'project',
  evidence_status text NOT NULL DEFAULT 'submitted',
  storage_path    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identities (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id_type             text NOT NULL,
  id_number_hash      text,
  document_path       text,
  selfie_path         text,
  status              text NOT NULL DEFAULT 'pending',
  reviewed_by         uuid REFERENCES users(id),
  reviewed_at         timestamptz,
  denial_reason       text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL,
  title         text NOT NULL,
  body          text NOT NULL,
  version       text NOT NULL,
  effective_at  timestamptz NOT NULL DEFAULT now(),
  published     boolean NOT NULL DEFAULT true,
  UNIQUE (slug, version)
);

CREATE TABLE IF NOT EXISTS consents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_version_id uuid NOT NULL REFERENCES policy_versions(id),
  accepted_at       timestamptz NOT NULL DEFAULT now(),
  ip_address        text,
  user_agent        text
);

CREATE TABLE IF NOT EXISTS memberships (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class           membership_class NOT NULL DEFAULT 'full_professional',
  status          membership_status NOT NULL DEFAULT 'draft',
  chapter_id      uuid REFERENCES chapters(id),
  application_note text,
  denial_reason   text,
  approved_by     uuid REFERENCES users(id),
  approved_at     timestamptz,
  joined_at       timestamptz,
  arrears_started_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS memberships_active_user_idx
  ON memberships (user_id) WHERE status IN ('active', 'under_review', 'payment_pending', 'arrears', 'paused', 'submitted');

CREATE TABLE IF NOT EXISTS member_shares (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  units           integer NOT NULL DEFAULT 1,
  unit_price_kobo integer NOT NULL DEFAULT 0,
  issued_at       timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'issued',
  exit_rule_note  text
);

CREATE TABLE IF NOT EXISTS renewals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  amount_kobo     integer NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  grace_until     date,
  invoice_id      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     text NOT NULL,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);

-- ---------------------------------------------------------------------------
-- Auth sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      text NOT NULL UNIQUE,
  user_agent      text,
  ip_address      text,
  device_label    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  revoked_at      timestamptz,
  mfa_verified_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Governance / RBAC
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  is_system   boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  domain      text NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id     uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by  uuid REFERENCES users(id),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS committees (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  mandate     text NOT NULL,
  min_members integer NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS committee_assignments (
  committee_id uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'member',
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (committee_id, user_id)
);

CREATE TABLE IF NOT EXISTS elections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  notice        text NOT NULL,
  opens_at      timestamptz NOT NULL,
  closes_at     timestamptz NOT NULL,
  status        text NOT NULL DEFAULT 'draft',
  tally_reviewed_by uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS election_candidates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id   uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id),
  manifesto     text
);

CREATE TABLE IF NOT EXISTS votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id   uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  voter_id      uuid NOT NULL REFERENCES users(id),
  candidate_id  uuid NOT NULL REFERENCES election_candidates(id),
  cast_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (election_id, voter_id)
);

CREATE TABLE IF NOT EXISTS meetings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  body          text,
  committee_id  uuid REFERENCES committees(id),
  starts_at     timestamptz NOT NULL,
  minutes       text,
  created_by    uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conflict_disclosures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  related_type  text NOT NULL,
  related_id    uuid NOT NULL,
  nature        text NOT NULL,
  recused       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Finance: chart of accounts + double-entry ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fund_pools (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        fund_pool_kind NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL,
  restricted  boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  type          account_type NOT NULL,
  fund_pool_id  uuid REFERENCES fund_pools(id),
  is_savings_liability boolean NOT NULL DEFAULT false,
  is_postable   boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no          bigserial UNIQUE,
  memo              text NOT NULL,
  source            text NOT NULL,
  source_id         uuid,
  idempotency_key   text NOT NULL UNIQUE,
  posted_at         timestamptz NOT NULL DEFAULT now(),
  posted_by         uuid REFERENCES users(id),
  reversed_by_id    uuid REFERENCES journal_entries(id),
  reverses_id       uuid REFERENCES journal_entries(id),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id        uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id      uuid NOT NULL REFERENCES accounts(id),
  member_id       uuid REFERENCES users(id),
  project_id      uuid,
  fund_pool_id    uuid REFERENCES fund_pools(id),
  debit_kobo      bigint NOT NULL DEFAULT 0 CHECK (debit_kobo >= 0),
  credit_kobo     bigint NOT NULL DEFAULT 0 CHECK (credit_kobo >= 0),
  description     text,
  CONSTRAINT journal_line_one_side CHECK (
    (debit_kobo > 0 AND credit_kobo = 0) OR (credit_kobo > 0 AND debit_kobo = 0)
  )
);

CREATE INDEX IF NOT EXISTS journal_lines_account_idx ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS journal_lines_member_idx ON journal_lines(member_id);

CREATE TABLE IF NOT EXISTS contribution_invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  kind            text NOT NULL,
  period          date,
  amount_kobo     integer NOT NULL CHECK (amount_kobo > 0),
  status          text NOT NULL DEFAULT 'open',
  due_at          timestamptz,
  reference       text NOT NULL UNIQUE,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid REFERENCES contribution_invoices(id),
  user_id         uuid NOT NULL REFERENCES users(id),
  provider        text NOT NULL DEFAULT 'paystack',
  provider_ref    text UNIQUE,
  amount_kobo     integer NOT NULL,
  currency        text NOT NULL DEFAULT 'NGN',
  status          text NOT NULL DEFAULT 'initialized',
  idempotency_key text NOT NULL UNIQUE,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id       uuid REFERENCES payment_intents(id),
  user_id         uuid NOT NULL REFERENCES users(id),
  provider        text NOT NULL,
  provider_ref    text NOT NULL UNIQUE,
  amount_kobo     integer NOT NULL,
  currency        text NOT NULL DEFAULT 'NGN',
  status          text NOT NULL,
  paid_at         timestamptz,
  journal_entry_id uuid REFERENCES journal_entries(id),
  raw             jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text NOT NULL,
  event_id        text NOT NULL,
  event_type      text NOT NULL,
  signature_ok    boolean NOT NULL DEFAULT false,
  payload         jsonb NOT NULL,
  processed_at    timestamptz,
  error           text,
  idempotency_key text NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS reconciliations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text NOT NULL,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  provider_total_kobo bigint NOT NULL DEFAULT 0,
  ledger_total_kobo   bigint NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'draft',
  notes           text,
  created_by      uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS savings_claims (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  balance_kobo    bigint NOT NULL DEFAULT 0,
  last_posted_at  timestamptz,
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  amount_kobo     integer NOT NULL CHECK (amount_kobo > 0),
  status          text NOT NULL DEFAULT 'requested',
  eligibility_note text,
  approved_by     uuid REFERENCES users(id),
  second_approver uuid REFERENCES users(id),
  payout_ref      text,
  journal_entry_id uuid REFERENCES journal_entries(id),
  requested_at    timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,
  destination_bank text,
  destination_nuban text
);

CREATE TABLE IF NOT EXISTS reserves (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  target_kobo     bigint NOT NULL DEFAULT 0,
  policy          text NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Funding / incubator
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE,
  title             text NOT NULL,
  problem_statement text NOT NULL,
  target_users      text NOT NULL,
  market_hypothesis text,
  originality_declaration text,
  project_type      project_type NOT NULL DEFAULT 'prototype_mvp',
  stage             project_stage NOT NULL DEFAULT 'submission',
  submitter_id      uuid NOT NULL REFERENCES users(id),
  chapter_id        uuid REFERENCES chapters(id),
  is_public         boolean NOT NULL DEFAULT false,
  score_total       numeric(5,2),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS founders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES users(id),
  full_name     text NOT NULL,
  role          text NOT NULL,
  is_submitter  boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS project_teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id),
  role          text NOT NULL,
  allocation_pct numeric(5,2)
);

CREATE TABLE IF NOT EXISTS ownership_declarations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  arrangement   text NOT NULL,
  background_ip text,
  statement     text NOT NULL,
  signed_at     timestamptz NOT NULL DEFAULT now(),
  signed_by     uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_budgets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  line_item     text NOT NULL,
  amount_kobo   integer NOT NULL,
  category      text NOT NULL,
  notes         text
);

CREATE TABLE IF NOT EXISTS diligence_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  reviewer_id   uuid NOT NULL REFERENCES users(id),
  kind          text NOT NULL,
  status        review_status NOT NULL DEFAULT 'pending',
  score         numeric(5,2),
  notes         text,
  recused       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, reviewer_id, kind)
);

CREATE TABLE IF NOT EXISTS project_scores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  reviewer_id   uuid NOT NULL REFERENCES users(id),
  dimension     text NOT NULL,
  weight_pct    numeric(5,2) NOT NULL,
  score         numeric(5,2) NOT NULL,
  evidence      text,
  UNIQUE (project_id, reviewer_id, dimension)
);

CREATE TABLE IF NOT EXISTS funding_rounds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  instrument    text NOT NULL,
  requested_kobo integer NOT NULL,
  approved_kobo integer,
  source_pool   fund_pool_kind NOT NULL DEFAULT 'project_development',
  status        text NOT NULL DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS funding_decisions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      uuid NOT NULL REFERENCES funding_rounds(id) ON DELETE CASCADE,
  decided_by    uuid NOT NULL REFERENCES users(id),
  decision      text NOT NULL,
  rationale     text,
  decided_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_agreements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  round_id      uuid REFERENCES funding_rounds(id),
  document_path text,
  signed_by_founder uuid REFERENCES users(id),
  signed_by_ndc uuid REFERENCES users(id),
  signed_at     timestamptz,
  status        text NOT NULL DEFAULT 'draft',
  terms         jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS milestones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  title         text NOT NULL,
  acceptance_tests text NOT NULL,
  amount_kobo   integer NOT NULL,
  sequence      integer NOT NULL,
  status        text NOT NULL DEFAULT 'pending',
  due_at        date,
  accepted_at   timestamptz,
  accepted_by   uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS disbursements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id    uuid NOT NULL REFERENCES milestones(id),
  project_id      uuid NOT NULL REFERENCES project_submissions(id),
  amount_kobo     integer NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  unique_reference text NOT NULL UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  approver_one    uuid REFERENCES users(id),
  approver_two    uuid REFERENCES users(id),
  journal_entry_id uuid REFERENCES journal_entries(id),
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  kind          text NOT NULL,
  body          text NOT NULL,
  usage_evidence text,
  submitted_by  uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_risks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  title         text NOT NULL,
  likelihood    text NOT NULL,
  impact        text NOT NULL,
  mitigation    text,
  status        text NOT NULL DEFAULT 'open'
);

-- ---------------------------------------------------------------------------
-- Studio
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_organisations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  contact_email text,
  sector        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  brief         text NOT NULL,
  client_id     uuid REFERENCES client_organisations(id),
  owner_id      uuid REFERENCES users(id),
  status        text NOT NULL DEFAULT 'open',
  is_public     boolean NOT NULL DEFAULT false,
  budget_kobo   integer,
  skills        text[],
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  document_path text,
  due_at        timestamptz,
  status        text NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS proposals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  author_id     uuid NOT NULL REFERENCES users(id),
  scope         text NOT NULL,
  amount_kobo   integer NOT NULL,
  margin_kobo   integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'draft',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id),
  score         numeric(5,2),
  status        text NOT NULL DEFAULT 'suggested',
  UNIQUE (opportunity_id, user_id)
);

CREATE TABLE IF NOT EXISTS statements_of_work (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id),
  proposal_id   uuid REFERENCES proposals(id),
  body          text NOT NULL,
  payment_plan  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ip_terms      text,
  status        text NOT NULL DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS studio_contracts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id        uuid REFERENCES statements_of_work(id),
  opportunity_id uuid REFERENCES opportunities(id),
  document_path text,
  status        text NOT NULL DEFAULT 'draft',
  signed_at     timestamptz
);

CREATE TABLE IF NOT EXISTS deliverables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id        uuid REFERENCES statements_of_work(id),
  title         text NOT NULL,
  acceptance    text,
  status        text NOT NULL DEFAULT 'pending',
  due_at        date
);

CREATE TABLE IF NOT EXISTS studio_invoices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   uuid REFERENCES studio_contracts(id),
  client_id     uuid REFERENCES client_organisations(id),
  amount_kobo   integer NOT NULL,
  status        text NOT NULL DEFAULT 'draft',
  reference     text NOT NULL UNIQUE,
  journal_entry_id uuid REFERENCES journal_entries(id),
  issued_at     timestamptz
);

CREATE TABLE IF NOT EXISTS contractor_payables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  invoice_id    uuid REFERENCES studio_invoices(id),
  amount_kobo   integer NOT NULL,
  status        text NOT NULL DEFAULT 'scheduled',
  paid_at       timestamptz,
  journal_entry_id uuid REFERENCES journal_entries(id)
);

CREATE TABLE IF NOT EXISTS sprints (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id),
  name          text NOT NULL,
  starts_on     date NOT NULL,
  ends_on       date NOT NULL,
  goal          text
);

CREATE TABLE IF NOT EXISTS timesheets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  opportunity_id uuid REFERENCES opportunities(id),
  work_date     date NOT NULL,
  minutes       integer NOT NULL,
  notes         text,
  status        text NOT NULL DEFAULT 'submitted'
);

CREATE TABLE IF NOT EXISTS qa_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid REFERENCES deliverables(id),
  reviewer_id   uuid REFERENCES users(id),
  result        text NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_disputes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id),
  raised_by     uuid REFERENCES users(id),
  body          text NOT NULL,
  stage         text NOT NULL DEFAULT 'project_lead',
  status        text NOT NULL DEFAULT 'open',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Technical review
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS repos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES project_submissions(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES users(id),
  provider      text NOT NULL,
  url           text NOT NULL,
  visibility    text NOT NULL DEFAULT 'private',
  oauth_connected boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS architecture_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  reviewer_id   uuid NOT NULL REFERENCES users(id),
  findings      text NOT NULL,
  score         numeric(5,2),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES project_submissions(id),
  title         text NOT NULL,
  severity      text NOT NULL,
  status        text NOT NULL DEFAULT 'open',
  disclosed_responsibly boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS assessments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES project_submissions(id),
  kind          text NOT NULL,
  result        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS acceptance_tests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id  uuid REFERENCES milestones(id) ON DELETE CASCADE,
  description   text NOT NULL,
  passed        boolean,
  evidence_path text
);

CREATE TABLE IF NOT EXISTS audit_evidence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  related_type  text NOT NULL,
  related_id    uuid NOT NULL,
  path          text NOT NULL,
  uploaded_by   uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentorships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id     uuid NOT NULL REFERENCES users(id),
  mentee_id     uuid NOT NULL REFERENCES users(id),
  focus         text,
  status        text NOT NULL DEFAULT 'requested',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_programmes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  synopsis      text NOT NULL,
  fee_kobo      integer NOT NULL DEFAULT 0,
  starts_on     date,
  is_public     boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS programme_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id  uuid NOT NULL REFERENCES training_programmes(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id),
  status        text NOT NULL DEFAULT 'applied',
  UNIQUE (programme_id, user_id)
);

CREATE TABLE IF NOT EXISTS events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  body          text,
  chapter_id    uuid REFERENCES chapters(id),
  starts_at     timestamptz NOT NULL,
  location      text,
  is_public     boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS communities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  name          text NOT NULL,
  description   text
);

CREATE TABLE IF NOT EXISTS community_members (
  community_id  uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS oss_opportunities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  repo_url      text,
  kind          text NOT NULL,
  description   text NOT NULL,
  is_public     boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS resources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  url           text,
  body          text,
  kind          text NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  body          text NOT NULL,
  audience      text NOT NULL DEFAULT 'members',
  published_at  timestamptz,
  created_by    uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_key    text NOT NULL,
  sender_id     uuid NOT NULL REFERENCES users(id),
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),
  related_type  text,
  related_id    uuid,
  rating        integer,
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  excerpt       text,
  body          text NOT NULL,
  published_at  timestamptz,
  created_by    uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS snake_scores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score         integer NOT NULL CHECK (score >= 0 AND score <= 9999),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS snake_scores_best_idx ON snake_scores (score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS snake_scores_user_idx ON snake_scores (user_id, score DESC);

-- ---------------------------------------------------------------------------
-- Compliance and platform
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_access_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),
  path          text NOT NULL,
  action        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid REFERENCES users(id),
  action        text NOT NULL,
  entity        text NOT NULL,
  entity_id     uuid,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS support_tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),
  chapter_id    uuid REFERENCES chapters(id),
  subject       text NOT NULL,
  body          text NOT NULL,
  status        ticket_status NOT NULL DEFAULT 'open',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disputes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),
  kind          text NOT NULL,
  body          text NOT NULL,
  status        text NOT NULL DEFAULT 'open',
  stage         text NOT NULL DEFAULT 'intake',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),
  against_user_id uuid REFERENCES users(id),
  body          text NOT NULL,
  evidence_path text,
  status        text NOT NULL DEFAULT 'submitted',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appeals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  related_type  text NOT NULL,
  related_id    uuid NOT NULL,
  body          text NOT NULL,
  status        text NOT NULL DEFAULT 'open',
  decision      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sanctions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  reason        text NOT NULL,
  action        text NOT NULL,
  issued_by     uuid REFERENCES users(id),
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  kind          text NOT NULL,
  status        text NOT NULL DEFAULT 'received',
  payload       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),
  title         text NOT NULL,
  body          text NOT NULL,
  kind          text NOT NULL DEFAULT 'info',
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_notices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  body          text NOT NULL,
  severity      text NOT NULL DEFAULT 'medium',
  audience      text NOT NULL DEFAULT 'all',
  published_at  timestamptz
);

CREATE TABLE IF NOT EXISTS jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  run_at        timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'queued',
  last_error    text
);

CREATE TABLE IF NOT EXISTS feature_flags (
  key           text PRIMARY KEY,
  enabled       boolean NOT NULL DEFAULT false,
  description   text NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_connections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      text NOT NULL,
  provider_user text,
  access_token_enc text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key           text PRIMARY KEY,
  count         integer NOT NULL DEFAULT 0,
  window_starts timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Ledger invariants
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_journal_balanced()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  d bigint;
  c bigint;
BEGIN
  SELECT COALESCE(SUM(debit_kobo),0), COALESCE(SUM(credit_kobo),0)
    INTO d, c FROM journal_lines WHERE entry_id = NEW.entry_id;
  IF d <> c THEN
    RAISE EXCEPTION 'journal % is unbalanced: debit % credit %', NEW.entry_id, d, c;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_journal_balanced ON journal_lines;
CREATE CONSTRAINT TRIGGER trg_journal_balanced
AFTER INSERT OR UPDATE ON journal_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_journal_balanced();

CREATE OR REPLACE FUNCTION forbid_project_spend_from_savings()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  savings boolean;
  src text;
BEGIN
  SELECT is_savings_liability INTO savings FROM accounts WHERE id = NEW.account_id;
  SELECT source INTO src FROM journal_entries WHERE id = NEW.entry_id;
  IF savings AND src IN ('project_disbursement', 'grant_spend', 'venture_loss') THEN
    RAISE EXCEPTION 'project risk expenditure cannot be sourced from member savings liabilities';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_no_savings_for_project ON journal_lines;
CREATE TRIGGER trg_no_savings_for_project
BEFORE INSERT ON journal_lines
FOR EACH ROW EXECUTE FUNCTION forbid_project_spend_from_savings();

CREATE OR REPLACE FUNCTION forbid_journal_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'posted journal entries are reversed, never silently edited';
END $$;

DROP TRIGGER IF EXISTS trg_journal_immutable ON journal_entries;
CREATE TRIGGER trg_journal_immutable
BEFORE UPDATE ON journal_entries
FOR EACH ROW
WHEN (OLD.reversed_by_id IS NOT DISTINCT FROM NEW.reversed_by_id
  AND OLD.reverses_id IS NOT DISTINCT FROM NEW.reverses_id)
EXECUTE FUNCTION forbid_journal_mutation();
