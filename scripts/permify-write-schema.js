import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const PERMIFY_BASE_URL = process.env.PERMIFY_BASE_URL || "http://localhost:3476/v1";
const TENANT_ID = process.env.PERMIFY_TENANT_ID || "t1";
const PERMIFY_PRESHARED_KEY = process.env.PERMIFY_PRESHARED_KEY || "";

const authHeaders = {
  "Content-Type": "application/json",
  ...(PERMIFY_PRESHARED_KEY ? { Authorization: `Bearer ${PERMIFY_PRESHARED_KEY}` } : {}),
};

const schema = `entity user {}

entity organization {
    relation admin @user
    relation member @user

    permission edit = admin
}

entity team {
    relation org @organization
    relation member @user
    relation lead @user
}

entity doc {
    relation org @organization
    relation team @team
    relation owner @user
    relation viewer @user

    permission view = viewer or owner or org.admin or team.member or team.lead
}`;

async function main() {
  const url = `${PERMIFY_BASE_URL}/tenants/${TENANT_ID}/schemas/write`;
  try {
    const resp = await axios.post(url, { schema }, { headers: authHeaders });
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
