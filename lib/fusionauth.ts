import axios from 'axios';

const FUSIONAUTH_URL =
  process.env.AUTH_FUSIONAUTH_ISSUER || 'http://localhost:9011';
const API_KEY = process.env.FUSIONAUTH_API_KEY || '';

const headers = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

export type FusionAuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

export async function getUserByEmail(
  email: string
): Promise<FusionAuthUser | null> {
  try {
    const resp = await axios.get(
      `${FUSIONAUTH_URL}/api/user?email=${encodeURIComponent(email)}`,
      { headers }
    );
    const u = resp.data?.user;
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
    };
  } catch (err) {
    const e = err as any;
    if (e?.response?.status === 404) return null;
    console.error(
      'FusionAuth getUserByEmail error',
      e?.response?.data ?? e?.message ?? e
    );
    return null;
  }
}

export async function getUserById(
  id: string
): Promise<FusionAuthUser | null> {
  try {
    const resp = await axios.get(`${FUSIONAUTH_URL}/api/user/${id}`, {
      headers,
    });
    const u = resp.data?.user;
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
    };
  } catch (err) {
    const e = err as any;
    if (e?.response?.status === 404) return null;
    console.error(
      'FusionAuth getUserById error',
      e?.response?.data ?? e?.message ?? e
    );
    return null;
  }
}
