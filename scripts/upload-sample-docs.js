import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const SERVER = process.env.SERVER_URL || "http://localhost:3000";

const docs = [
  {
    documentId: "doc-1",
    content: "Q4 financial report: revenue grew 12% year-over-year and operating costs decreased by 8%.",
    owner: "00000000-0000-0000-0000-000000000002",
    public: false,
  },
  {
    documentId: "doc-2",
    content: "Engineering roadmap: database migration planned for Q1 and new API gateway rollout in Q2.",
    owner: "00000000-0000-0000-0000-000000000002",
    public: false,
  },
  {
    documentId: "doc-3",
    content: "HR confidential: salary adjustments approved for the engineering team, effective March.",
    owner: "00000000-0000-0000-0000-000000000002",
    public: false,
  },
];

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
  for (const d of docs) {
    await uploadDoc(d);
  }
}

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) main();
