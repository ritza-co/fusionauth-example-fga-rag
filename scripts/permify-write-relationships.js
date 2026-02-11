import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const PERMIFY_HOST = process.env.PERMIFY_HOST || "localhost";
const PERMIFY_HTTP_PORT = process.env.PERMIFY_HTTP_PORT || "3476";
const TENANT_ID = process.env.PERMIFY_TENANT_ID || "t1";

const BASE = `http://${PERMIFY_HOST}:${PERMIFY_HTTP_PORT}/v1`;

const ADMIN = "00000000-0000-0000-0000-000000000001";
const JANE = "00000000-0000-0000-0000-000000000002";
const JOHN = "00000000-0000-0000-0000-000000000003";

const tuples = [
  {
    entity: { type: "organization", id: "acme" },
    relation: "admin",
    subject: { type: "user", id: ADMIN },
  },
  {
    entity: { type: "organization", id: "acme" },
    relation: "member",
    subject: { type: "user", id: JANE },
  },

  {
    entity: { type: "doc", id: "doc-1" },
    relation: "org",
    subject: { type: "organization", id: "acme" },
  },
  {
    entity: { type: "doc", id: "doc-2" },
    relation: "org",
    subject: { type: "organization", id: "acme" },
  },
  {
    entity: { type: "doc", id: "doc-3" },
    relation: "org",
    subject: { type: "organization", id: "acme" },
  },

  {
    entity: { type: "doc", id: "doc-1" },
    relation: "owner",
    subject: { type: "user", id: JANE },
  },
  {
    entity: { type: "doc", id: "doc-2" },
    relation: "owner",
    subject: { type: "user", id: JANE },
  },
  {
    entity: { type: "doc", id: "doc-3" },
    relation: "owner",
    subject: { type: "user", id: JANE },
  },

  {
    entity: { type: "doc", id: "doc-1" },
    relation: "viewer",
    subject: { type: "user", id: JOHN },
  },
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
