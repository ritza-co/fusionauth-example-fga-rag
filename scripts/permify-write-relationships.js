import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const PERMIFY_HOST = process.env.PERMIFY_HOST || "localhost";
const PERMIFY_HTTP_PORT = process.env.PERMIFY_HTTP_PORT || "3476";
const TENANT_ID = process.env.PERMIFY_TENANT_ID || "t1";

const BASE = `http://${PERMIFY_HOST}:${PERMIFY_HTTP_PORT}/v1`;

const ADMIN   = "ec218805-2030-4827-a5d0-734c7703184b";
const JANE    = "567f1ddc-1c23-4b80-81f8-f32a2d1945c4"; // customer-support lead
const JOHN    = "d1cfbb04-0ffe-4669-b5a1-67900f33bb16"; // fraud-and-security lead
const SARAH   = "66376233-9f1a-4f02-8729-f1f18cca972c"; // customer-support
const MIKE    = "aa7467a7-c4eb-4860-99b6-5236b8dc28d1"; // customer-support
const EMILY   = "2b38724d-354a-4989-82cd-15c2fb64b8ea"; // fraud-and-security
const CARLOS  = "3987da40-b458-4f7f-8151-e5224356ac02"; // fraud-and-security
const RACHEL  = "dbc41a40-5f42-4b4f-b31c-b98f900f1f94"; // disputes-chargebacks lead
const DAVID   = "7dc8b3e3-6ae5-4248-9175-59f011c8437e"; // disputes-chargebacks
const LISA    = "f189dcc4-015c-46de-9609-dab7873e42a9"; // disputes-chargebacks
const TOM     = "59f5561e-dc9f-477f-a82f-70a36922ece5"; // loan-servicing lead
const PRIYA   = "a04f44a8-aca1-45f6-b3a1-96944608fae4"; // loan-servicing

const orgRel  = (relation, userId) => ({ entity: { type: "organization", id: "acme" }, relation, subject: { type: "user", id: userId } });
const teamRel = (teamId, relation, userId) => ({ entity: { type: "team", id: teamId }, relation, subject: { type: "user", id: userId } });
const teamOrg = (teamId) => ({ entity: { type: "team", id: teamId }, relation: "org", subject: { type: "organization", id: "acme" } });
const docOrg  = (docId) => ({ entity: { type: "doc", id: docId }, relation: "org", subject: { type: "organization", id: "acme" } });
const docOwner = (docId, userId) => ({ entity: { type: "doc", id: docId }, relation: "owner", subject: { type: "user", id: userId } });
const docTeam = (docId, teamId) => ({ entity: { type: "doc", id: docId }, relation: "team", subject: { type: "team", id: teamId } });
const docViewer = (docId, userId) => ({ entity: { type: "doc", id: docId }, relation: "viewer", subject: { type: "user", id: userId } });

// All Docs
const csDocs = ["cs-doc-1","cs-doc-2","cs-doc-3","cs-doc-4","cs-doc-5","cs-doc-6","cs-doc-7","cs-doc-8","cs-doc-9","cs-doc-10"];
const fsDocs = ["fs-doc-1","fs-doc-2","fs-doc-3","fs-doc-4","fs-doc-5","fs-doc-6","fs-doc-7","fs-doc-8","fs-doc-9","fs-doc-10"];
const dcDocs = ["dc-doc-1","dc-doc-2","dc-doc-3","dc-doc-4","dc-doc-5","dc-doc-6","dc-doc-7","dc-doc-8","dc-doc-9","dc-doc-10"];
const lsDocs = ["ls-doc-1","ls-doc-2","ls-doc-3","ls-doc-4","ls-doc-5","ls-doc-6","ls-doc-7","ls-doc-8","ls-doc-9","ls-doc-10"];

// Ownership map (matches upload-sample-docs.js)
const csOwners = [JANE, JANE, SARAH, SARAH, MIKE, MIKE, JANE, SARAH, MIKE, JANE];
const fsOwners = [JOHN, JOHN, EMILY, EMILY, CARLOS, CARLOS, JOHN, EMILY, CARLOS, JOHN];
const dcOwners = [RACHEL, RACHEL, DAVID, DAVID, LISA, LISA, RACHEL, DAVID, LISA, RACHEL];
const lsOwners = [TOM, TOM, PRIYA, PRIYA, TOM, TOM, PRIYA, PRIYA, TOM, PRIYA];

const tuples = [
  // Org-level roles
  orgRel("admin", ADMIN),
  orgRel("member", JANE),
  orgRel("member", JOHN),
  orgRel("member", SARAH),
  orgRel("member", MIKE),
  orgRel("member", EMILY),
  orgRel("member", CARLOS),
  orgRel("member", RACHEL),
  orgRel("member", DAVID),
  orgRel("member", LISA),
  orgRel("member", TOM),
  orgRel("member", PRIYA),

  // Teams → org
  teamOrg("customer-support"),
  teamOrg("fraud-and-security"),
  teamOrg("disputes-chargebacks"),
  teamOrg("loan-servicing"),

  // Team members & leads
  // Customer Support
  teamRel("customer-support", "member", JANE),
  teamRel("customer-support", "lead",   JANE),
  teamRel("customer-support", "member", SARAH),
  teamRel("customer-support", "member", MIKE),

  // Fraud & Security
  teamRel("fraud-and-security", "member", JOHN),
  teamRel("fraud-and-security", "lead",   JOHN),
  teamRel("fraud-and-security", "member", EMILY),
  teamRel("fraud-and-security", "member", CARLOS),

  // Disputes & Chargebacks
  teamRel("disputes-chargebacks", "member", RACHEL),
  teamRel("disputes-chargebacks", "lead",   RACHEL),
  teamRel("disputes-chargebacks", "member", DAVID),
  teamRel("disputes-chargebacks", "member", LISA),

  // Loan Servicing
  teamRel("loan-servicing", "member", TOM),
  teamRel("loan-servicing", "lead",   TOM),
  teamRel("loan-servicing", "member", PRIYA),

  // Customer Support docs
  ...csDocs.map(docOrg),
  ...csDocs.map((id, i) => docOwner(id, csOwners[i])),
  ...csDocs.map(id => docTeam(id, "customer-support")),

  // Fraud & Security docs  
  ...fsDocs.map(docOrg),
  ...fsDocs.map((id, i) => docOwner(id, fsOwners[i])),
  ...fsDocs.map(id => docTeam(id, "fraud-and-security")),

  // Disputes & Chargebacks docs
  ...dcDocs.map(docOrg),
  ...dcDocs.map((id, i) => docOwner(id, dcOwners[i])),
  ...dcDocs.map(id => docTeam(id, "disputes-chargebacks")),

  // Loan Servicing docs
  ...lsDocs.map(docOrg),
  ...lsDocs.map((id, i) => docOwner(id, lsOwners[i])),
  ...lsDocs.map(id => docTeam(id, "loan-servicing")),

  // Cross-team observer (viewer) relations
  // Fraud team observing Customer Support docs
  docViewer("cs-doc-2",  JOHN),   // CSAT metrics — fraud correlates with satisfaction drops
  docViewer("cs-doc-7",  EMILY),  // VIP handling — fraud team needs VIP escalation context
  docViewer("cs-doc-5",  CARLOS), // Troubleshooting playbook — fraud holds referenced here

  // Disputes team observing Fraud & Security docs
  docViewer("fs-doc-1",  RACHEL), // Fraud rules — disputes team references fraud flags
  docViewer("fs-doc-8",  RACHEL), // AML review — overlaps with chargeback-fraud cases
  docViewer("fs-doc-2",  DAVID),  // Suspicious activity report — shared fraud-dispute cases

  // Loan Servicing observing Disputes & Chargebacks docs
  docViewer("dc-doc-1",  TOM),    // Chargeback analysis — affects loan payment chargebacks
  docViewer("dc-doc-8",  PRIYA),  // Chargeback ratio monitoring — impacts loan products
  docViewer("dc-doc-10", TOM),    // Reg compliance — loan servicing must comply with Reg E/Z too

  // Customer Support observing Disputes & Chargebacks docs
  docViewer("dc-doc-6",  JANE),   // Evidence checklist — CS helps collect dispute evidence
  docViewer("dc-doc-9",  SARAH),  // Dispute templates — CS uses these for customer replies

  // Customer Support observing Loan Servicing docs
  docViewer("ls-doc-4",  SARAH),  // Loan modification procedures — CS fields these inquiries
  docViewer("ls-doc-7",  MIKE),   // Borrower communication guide — CS talks to borrowers

  // Fraud team observing Disputes docs
  docViewer("dc-doc-7",  CARLOS), // Friendly fraud patterns — fraud team investigates these
  docViewer("dc-doc-4",  EMILY),  // Representment practices — fraud evidence feeds into these

  // Loan Servicing observing Fraud docs
  docViewer("fs-doc-5",  TOM),    // PCI compliance — loan servicing must comply too
  docViewer("fs-doc-10", PRIYA),  // 2FA rollout — affects borrower portal access

  // Disputes observing Loan Servicing docs
  docViewer("ls-doc-1",  DAVID),  // Portfolio performance — context for loan disputes
  docViewer("ls-doc-3",  LISA),   // Delinquency tracking — overlaps with payment disputes
];

async function main() {
  const url = `${BASE}/tenants/${TENANT_ID}/relationships/write`;
  try {
    const resp = await axios.post(url, { tuples, metadata: {} }, { headers: { "Content-Type": "application/json" } });
    console.log("Relationships write response:", resp.data ?? resp.status);
    console.log(`Wrote ${tuples.length} relationship tuples.`);
  } catch (err) {
    const e = err;
    console.error("Failed to write relationships:", e?.response?.data ?? e?.message ?? e);
    process.exitCode = 1;
  }
}

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) main();
