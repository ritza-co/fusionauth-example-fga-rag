import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const PERMIFY_HOST = process.env.PERMIFY_HOST || "localhost";
const PERMIFY_HTTP_PORT = process.env.PERMIFY_HTTP_PORT || "3476";
const TENANT_ID = process.env.PERMIFY_TENANT_ID || "t1";

const BASE = `http://${PERMIFY_HOST}:${PERMIFY_HTTP_PORT}/v1`;

const schema = `entity user {}

entity organization {
    relation admin @user
    relation member @user

    permission edit = admin
}

entity doc {
    relation org @organization
    relation owner @user
    relation viewer @user

    permission view = viewer or owner or org.admin
}`;

async function main() {
  const url = `${BASE}/tenants/${TENANT_ID}/schemas/write`;
  try {
    const resp = await axios.post(url, { schema }, { headers: { "Content-Type": "application/json" } });
    console.log("Schema write response:", resp.data ?? resp.status);
  } catch (err) {
    const e = err;
    console.error("Failed to write schema:", e?.response?.data ?? e?.message ?? e);
    process.exitCode = 1;
  }
}

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) main();
