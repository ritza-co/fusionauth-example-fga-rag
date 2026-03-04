import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const SERVER = process.env.SERVER_URL || "http://localhost:3000";

const JANE   = "567f1ddc-1c23-4b80-81f8-f32a2d1945c4"; // customer-support lead
const JOHN   = "d1cfbb04-0ffe-4669-b5a1-67900f33bb16"; // fraud-and-security lead
const SARAH  = "66376233-9f1a-4f02-8729-f1f18cca972c"; // customer-support
const MIKE   = "aa7467a7-c4eb-4860-99b6-5236b8dc28d1"; // customer-support
const EMILY  = "2b38724d-354a-4989-82cd-15c2fb64b8ea"; // fraud-and-security
const CARLOS = "3987da40-b458-4f7f-8151-e5224356ac02"; // fraud-and-security
const RACHEL = "dbc41a40-5f42-4b4f-b31c-b98f900f1f94"; // disputes-chargebacks lead
const DAVID  = "7dc8b3e3-6ae5-4248-9175-59f011c8437e"; // disputes-chargebacks
const LISA   = "f189dcc4-015c-46de-9609-dab7873e42a9"; // disputes-chargebacks
const TOM    = "59f5561e-dc9f-477f-a82f-70a36922ece5"; // loan-servicing lead
const PRIYA  = "a04f44a8-aca1-45f6-b3a1-96944608fae4"; // loan-servicing

const csDocs = [
  {
    documentId: "cs-doc-1",
    content: "Customer onboarding standard operating procedure: new accounts must complete identity verification within 48 hours. Support agents should guide customers through document upload, KYC check, and initial account funding steps. Escalate incomplete onboardings older than 72 hours to a team lead.",
    owner: JANE,
    public: false,
  },
  {
    documentId: "cs-doc-2",
    content: "Q4 customer satisfaction metrics: overall CSAT score improved to 87% from 82% in Q3. First-response time averaged 4.2 minutes, down from 6.1 minutes. Top complaint category remains payment processing delays at 23% of all tickets. NPS increased to +42.",
    owner: JANE,
    public: false,
  },
  {
    documentId: "cs-doc-3",
    content: "Escalation procedures for tier 2 support: when a tier 1 agent cannot resolve a case within 15 minutes or the issue involves account security, the ticket must be escalated to tier 2. Include a summary, steps already taken, and customer sentiment rating. Tier 2 SLA is 2-hour resolution.",
    owner: SARAH,
    public: false,
  },
  {
    documentId: "cs-doc-4",
    content: "Live chat response time guidelines: agents must respond to the initial chat message within 60 seconds. Average handle time target is 8 minutes per session. If wait queue exceeds 5 customers, overflow routing activates and sends chats to the phone support pool.",
    owner: SARAH,
    public: false,
  },
  {
    documentId: "cs-doc-5",
    content: "Phone support troubleshooting playbook: for payment failures, verify card status, check for fraud holds, and confirm billing address. For login issues, reset password via secure link and never share temporary credentials verbally. For account closures, transfer to retention team before processing.",
    owner: MIKE,
    public: false,
  },
  {
    documentId: "cs-doc-6",
    content: "Common billing inquiries FAQ: refunds take 5-7 business days to appear. Subscription changes apply at the next billing cycle. Double charges should be reported within 30 days for automatic reversal. International transaction fees are 2.5% and are non-refundable.",
    owner: MIKE,
    public: false,
  },
  {
    documentId: "cs-doc-7",
    content: "VIP customer handling protocol: accounts with Platinum tier or above receive priority routing with a maximum 30-second wait time. Dedicated relationship managers handle all escalations. VIP complaints must be resolved within 4 hours and require a follow-up satisfaction call within 24 hours.",
    owner: JANE,
    public: false,
  },
  {
    documentId: "cs-doc-8",
    content: "Customer feedback analysis Q3: 1,240 survey responses collected. Top positive themes: friendly agents (34%), fast resolution (28%). Top negative themes: long hold times (19%), repeated information requests (15%). Recommendation: implement CRM screen-pop to reduce repeat questions.",
    owner: SARAH,
    public: false,
  },
  {
    documentId: "cs-doc-9",
    content: "Support ticket triage and priority matrix: P1 (critical) — account locked or funds missing, 1-hour SLA. P2 (high) — payment failures or security concerns, 4-hour SLA. P3 (medium) — feature requests or general questions, 24-hour SLA. P4 (low) — cosmetic issues, 72-hour SLA.",
    owner: MIKE,
    public: false,
  },
  {
    documentId: "cs-doc-10",
    content: "SLA compliance report January: 94.6% of P1 tickets resolved within 1 hour (target 95%). P2 compliance at 97.2%. Three P1 breaches traced to after-hours staffing gaps. Action item: add one overnight shift agent starting February to cover the 2 AM – 6 AM window.",
    owner: JANE,
    public: false,
  },
];

const fsDocs = [
  {
    documentId: "fs-doc-1",
    content: "Fraud detection rules engine configuration: velocity rule triggers when more than 3 transactions exceed $500 within 10 minutes from the same device fingerprint. Geo-anomaly rule flags transactions originating from a country not seen in the last 90 days of account history.",
    owner: JOHN,
    public: false,
  },
  {
    documentId: "fs-doc-2",
    content: "Monthly suspicious activity report — December: 342 SARs filed, up 8% from November. Largest case involved a structured deposit pattern totaling $284,000 across 15 accounts. Collaborated with disputes team on 12 overlapping chargeback-fraud cases. Two cases referred to law enforcement.",
    owner: JOHN,
    public: false,
  },
  {
    documentId: "fs-doc-3",
    content: "Account takeover prevention strategies: implement device binding with SMS or TOTP verification for new device logins. Monitor for credential-stuffing patterns such as high login failure rates from rotating IPs. Enforce mandatory password resets when breach databases match customer emails.",
    owner: EMILY,
    public: false,
  },
  {
    documentId: "fs-doc-4",
    content: "KYC verification process updates: effective February 1st, all new business accounts require beneficial ownership documentation for individuals holding 25% or more equity. Enhanced due diligence now required for customers in high-risk jurisdictions listed in the updated country matrix.",
    owner: EMILY,
    public: false,
  },
  {
    documentId: "fs-doc-5",
    content: "PCI DSS compliance checklist: quarterly vulnerability scans completed by approved scanning vendor. Annual penetration test scheduled for March. Encryption at rest verified for all cardholder data environments. Access logs reviewed weekly. Next audit date: April 15.",
    owner: CARLOS,
    public: false,
  },
  {
    documentId: "fs-doc-6",
    content: "Security incident response playbook: upon detection, the on-call analyst classifies severity (SEV1-SEV3) and opens a war room. SEV1 events require VP notification within 15 minutes. Evidence preservation begins immediately — no system restarts until forensic snapshots are captured.",
    owner: CARLOS,
    public: false,
  },
  {
    documentId: "fs-doc-7",
    content: "Transaction monitoring threshold adjustments for Q1: lowered the wire transfer alert threshold from $10,000 to $7,500 for personal accounts. Added new rule for rapid peer-to-peer transfers exceeding $2,000 within 24 hours. Crypto on-ramp transactions now monitored above $1,000.",
    owner: JOHN,
    public: false,
  },
  {
    documentId: "fs-doc-8",
    content: "Anti-money laundering flag review Q4: 189 alerts generated, 47 escalated to investigation. False positive rate decreased to 62% after model retraining. Three cases resulted in account termination. Updated typology: layering through gift card purchases now detected by the new ML model.",
    owner: EMILY,
    public: false,
  },
  {
    documentId: "fs-doc-9",
    content: "Penetration testing results summary: external test found two medium-severity findings — an exposed admin panel on a staging subdomain and an IDOR vulnerability in the document download endpoint. Both remediated within 48 hours. Internal test: no critical findings; one low-severity misconfiguration in firewall rules.",
    owner: CARLOS,
    public: false,
  },
  {
    documentId: "fs-doc-10",
    content: "Two-factor authentication rollout plan: Phase 1 (January) — mandatory TOTP for all admin accounts. Phase 2 (March) — SMS fallback for general users. Phase 3 (June) — hardware security key support for high-value accounts. Goal: 100% 2FA adoption by end of Q2.",
    owner: JOHN,
    public: false,
  },
];

const dcDocs = [
  {
    documentId: "dc-doc-1",
    content: "Chargeback reason code analysis: Visa reason code 10.4 (fraud) accounts for 41% of all chargebacks received. Mastercard 4837 (no cardholder authorization) at 22%. Friendly fraud cases identified in 18% of all disputes. Average dispute value: $127.50.",
    owner: RACHEL,
    public: false,
  },
  {
    documentId: "dc-doc-2",
    content: "Visa dispute resolution timeline: pre-dispute phase allows 30 days for merchant response. If unresolved, the issuer has 75 days to file a formal chargeback. Merchant representment must be submitted within 30 days with compelling evidence. Arbitration filing deadline is 10 days after pre-arbitration.",
    owner: RACHEL,
    public: false,
  },
  {
    documentId: "dc-doc-3",
    content: "Mastercard arbitration process guide: after a second chargeback cycle, either party may file for arbitration. Filing fee is $500 and non-refundable if the filing party loses. Required documentation includes the original transaction record, delivery proof, and customer communication logs.",
    owner: DAVID,
    public: false,
  },
  {
    documentId: "dc-doc-4",
    content: "Merchant representment best practices: always include the signed receipt or digital agreement, AVS and CVV match confirmation, IP geolocation data, and delivery tracking with signature. Success rate improves from 32% to 58% when all four evidence categories are submitted together.",
    owner: DAVID,
    public: false,
  },
  {
    documentId: "dc-doc-5",
    content: "Pre-arbitration case management: before escalating to arbitration, review the case for settlement opportunity. Cases under $250 are often more cost-effective to accept. Maintain a tracker of all pre-arb cases with deadlines, assigned analyst, and current status. Weekly review with team lead required.",
    owner: LISA,
    public: false,
  },
  {
    documentId: "dc-doc-6",
    content: "Dispute evidence collection checklist: obtain transaction receipt, cardholder verification method used, authorization response code, delivery confirmation with tracking number, customer service communication logs, terms of service acceptance record, and device fingerprint data from the transaction.",
    owner: LISA,
    public: false,
  },
  {
    documentId: "dc-doc-7",
    content: "Friendly fraud detection patterns: indicators include the cardholder making repeat purchases after filing a dispute, IP address matching the delivery address, digital goods consumed before the chargeback was filed, and social media posts confirming receipt of the product. Flag these for the fraud team.",
    owner: RACHEL,
    public: false,
  },
  {
    documentId: "dc-doc-8",
    content: "Chargeback ratio monitoring report: current Visa chargeback ratio is 0.73% (threshold 0.9%). Mastercard ratio at 0.81% (threshold 1.0%). Three merchant IDs are approaching warning thresholds. Action plan: enhanced monitoring for MID-4422 and MID-5561, merchant outreach for MID-3890.",
    owner: DAVID,
    public: false,
  },
  {
    documentId: "dc-doc-9",
    content: "Automated dispute response templates: Template A covers unauthorized transaction disputes with AVS mismatch. Template B handles service-not-rendered claims with delivery proof. Template C addresses subscription cancellation disputes with terms acceptance evidence. Each template auto-attaches relevant evidence from the case file.",
    owner: LISA,
    public: false,
  },
  {
    documentId: "dc-doc-10",
    content: "Regulatory compliance for dispute handling: Regulation E requires provisional credit within 10 business days for consumer disputes. Regulation Z covers credit card billing errors with a 60-day filing window. All dispute communications must be retained for 7 years per record-keeping requirements.",
    owner: RACHEL,
    public: false,
  },
];

const lsDocs = [
  {
    documentId: "ls-doc-1",
    content: "Loan portfolio performance summary Q4: total outstanding balance $142M across 8,400 active loans. Weighted average interest rate 6.8%. 30-day delinquency rate decreased to 3.2% from 3.9% in Q3. Net charge-off rate held steady at 1.1%. Portfolio yield improved 15 basis points.",
    owner: TOM,
    public: false,
  },
  {
    documentId: "ls-doc-2",
    content: "Payment processing system upgrade plan: migrate from batch-based nightly processing to real-time payment posting by Q2. Phase 1: API integration with payment gateway. Phase 2: real-time ledger updates. Phase 3: automated payment reconciliation. Expected to reduce payment posting errors by 40%.",
    owner: TOM,
    public: false,
  },
  {
    documentId: "ls-doc-3",
    content: "Delinquency rate tracking dashboard specs: display 30/60/90-day delinquency buckets with drill-down by loan product, origination channel, and geographic region. Include trend charts for the trailing 12 months. Alert threshold: notify servicing manager when any bucket exceeds the portfolio benchmark by 0.5%.",
    owner: PRIYA,
    public: false,
  },
  {
    documentId: "ls-doc-4",
    content: "Loan modification request procedures: borrowers must submit a hardship letter, proof of income, and two months of bank statements. Review timeline is 15 business days. Approved modifications may include rate reduction (max 2%), term extension (max 10 years), or principal forbearance. All modifications require VP approval above $50,000.",
    owner: PRIYA,
    public: false,
  },
  {
    documentId: "ls-doc-5",
    content: "Interest rate adjustment notification templates: for ARM loans approaching reset dates, send borrower notice 45 days in advance. Include the current rate, new rate, new monthly payment amount, and options for refinancing. Ensure all notices comply with TILA disclosure requirements.",
    owner: TOM,
    public: false,
  },
  {
    documentId: "ls-doc-6",
    content: "Escrow account management guidelines: annual escrow analysis must be completed by March 31. Shortages under $300 can be spread over 12 months. Surpluses over $50 must be refunded within 30 days. Tax and insurance disbursements must be made by their due dates to avoid penalties.",
    owner: TOM,
    public: false,
  },
  {
    documentId: "ls-doc-7",
    content: "Borrower communication compliance guide: all collection calls must occur between 8 AM and 9 PM borrower local time per FDCPA. Written notices must include the debt validation statement. Cease-and-desist requests must be honored within 5 business days. Record all communications in the servicing system.",
    owner: PRIYA,
    public: false,
  },
  {
    documentId: "ls-doc-8",
    content: "Late payment fee waiver approval process: first occurrence within 12 months may be waived by any servicing agent. Second occurrence requires team lead approval. Third and subsequent waivers require manager sign-off with documented justification. Track all waivers in the borrower's account notes.",
    owner: PRIYA,
    public: false,
  },
  {
    documentId: "ls-doc-9",
    content: "Loan servicing transfer checklist: notify borrower 15 days before transfer with new servicer contact information. Transfer all escrow balances within 3 business days. Provide complete payment history and loan documents to the receiving servicer. Confirm MERS registration update if applicable.",
    owner: TOM,
    public: false,
  },
  {
    documentId: "ls-doc-10",
    content: "Monthly servicing performance metrics: call center answer rate 91% (target 90%). Average handle time 6.3 minutes. Payment processing accuracy 99.7%. Escrow disbursement timeliness 100%. Investor reporting delivered on schedule for all 5 reporting deadlines. One CFPB complaint received and resolved within 10 days.",
    owner: PRIYA,
    public: false,
  },
];

const docs = [...csDocs, ...fsDocs, ...dcDocs, ...lsDocs];

async function uploadDoc(d) {
  try {
    const resp = await axios.post(`${SERVER}/api/upload`, { documentId: d.documentId, content: d.content, public: d.public }, { headers: { "Content-Type": "application/json", "x-user-id": d.owner } });
    console.log(`Uploaded ${d.documentId}:`, resp.data);
  } catch (err) {
    const e = err;
    console.error(`Failed to upload ${d.documentId}:`, e?.response?.data ?? e?.message ?? e);
  }
}

async function main() {
  const CONCURRENCY = 5;
  for (let i = 0; i < docs.length; i += CONCURRENCY) {
    const batch = docs.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(uploadDoc));
  }
}

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) main();
