import axios from 'axios';

const PERMIFY_BASE_URL = process.env.PERMIFY_BASE_URL || `http://localhost:3476/v1`;
const TENANT_ID = process.env.PERMIFY_TENANT_ID || 't1';
const PERMIFY_PRESHARED_KEY = process.env.PERMIFY_PRESHARED_KEY || '';

export class PermifyClient {
  base: string;
  tenantId: string;
  private http: ReturnType<typeof axios.create>;

  constructor({ base = PERMIFY_BASE_URL, tenantId = TENANT_ID, presharedKey = PERMIFY_PRESHARED_KEY } = {}) {
    this.base = base;
    this.tenantId = tenantId;
    this.http = axios.create({
      headers: {
        'Content-Type': 'application/json',
        ...(presharedKey ? { Authorization: `Bearer ${presharedKey}` } : {}),
      },
    });
  }

  async checkPermission({
    entityType,
    entityId,
    permission,
    subjectType,
    subjectId,
    relation = '',
  }: {
    entityType: string;
    entityId: string;
    permission: string;
    subjectType: string;
    subjectId: string;
    relation?: string;
  }): Promise<boolean> {
    const url = `${this.base}/tenants/${this.tenantId}/permissions/check`;

    try {
      const resp = await this.http.post(
        url,
        {
          metadata: {
            snap_token: '',
            schema_version: '',
            depth: 20,
          },
          entity: {
            type: entityType,
            id: entityId,
          },
          permission,
          subject: {
            type: subjectType,
            id: subjectId,
            relation,
          },
        }
      );

      return resp.data?.can === 'CHECK_RESULT_ALLOWED';
    } catch (err) {
      const e = err as any;
      console.error(
        'Permify check error',
        e?.response?.data ?? e?.message ?? e
      );
      return false;
    }
  }

  async lookupEntity({
    entityType,
    permission,
    subjectType,
    subjectId,
  }: {
    entityType: string;
    permission: string;
    subjectType: string;
    subjectId: string;
  }): Promise<string[]> {
    const url = `${this.base}/tenants/${this.tenantId}/permissions/lookup-entity`;
    try {
      const resp = await this.http.post(
        url,
        {
          metadata: { snap_token: '', schema_version: '', depth: 20 },
          entity_type: entityType,
          permission,
          subject: { type: subjectType, id: subjectId, relation: '' },
        }
      );
      return resp.data?.entity_ids ?? [];
    } catch (err) {
      const e = err as any;
      console.error(
        'Permify lookupEntity error',
        e?.response?.data ?? e?.message ?? e
      );
      return [];
    }
  }

  async lookupSubject({
    entityType,
    entityId,
    permission,
    subjectType,
  }: {
    entityType: string;
    entityId: string;
    permission: string;
    subjectType: string;
  }): Promise<string[]> {
    const url = `${this.base}/tenants/${this.tenantId}/permissions/lookup-subject`;
    try {
      const resp = await this.http.post(
        url,
        {
          metadata: { snap_token: '', schema_version: '', depth: 20 },
          entity: { type: entityType, id: entityId },
          permission,
          subject_reference: { type: subjectType, relation: '' },
        }
      );
      return resp.data?.subject_ids ?? [];
    } catch (err) {
      const e = err as any;
      console.error(
        'Permify lookupSubject error',
        e?.response?.data ?? e?.message ?? e
      );
      return [];
    }
  }

  async deleteRelationships({
    entityType,
    entityId,
    relation,
    subjectType,
    subjectId,
  }: {
    entityType: string;
    entityId: string;
    relation: string;
    subjectType: string;
    subjectId: string;
  }) {
    const url = `${this.base}/tenants/${this.tenantId}/relationships/delete`;
    try {
      await this.http.post(
        url,
        {
          filter: {
            entity: { type: entityType, ids: [entityId] },
            relation,
            subject: { type: subjectType, ids: [subjectId], relation: '' },
          },
        }
      );
      return true;
    } catch (err) {
      const e = err as any;
      console.error(
        'Permify delete error',
        e?.response?.data ?? e?.message ?? e
      );
      return false;
    }
  }

  async writeRelationships(
    tuples: Array<{
      entity: { type: string; id: string };
      relation: string;
      subject: { type: string; id: string; relation?: string };
    }>
  ) {
    const url = `${this.base}/tenants/${this.tenantId}/relationships/write`;
    try {
      await this.http.post(
        url,
        {
          metadata: { schema_version: '' },
          tuples: tuples.map((t) => ({
            entity: t.entity,
            relation: t.relation,
            subject: {
              type: t.subject.type,
              id: t.subject.id,
              relation: t.subject.relation ?? '',
            },
          })),
        }
      );
      return true;
    } catch (err) {
      const e = err as any;
      console.error(
        'Permify write error',
        e?.response?.data ?? e?.message ?? e
      );
      return false;
    }
  }
}

export const permifyClient = new PermifyClient();
