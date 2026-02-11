import axios from 'axios';

const PERMIFY_HOST = process.env.PERMIFY_HOST || 'localhost';
const PERMIFY_HTTP_PORT = process.env.PERMIFY_HTTP_PORT || '3476';
const TENANT_ID = process.env.PERMIFY_TENANT_ID || 't1';

const BASE = `http://${PERMIFY_HOST}:${PERMIFY_HTTP_PORT}/v1`;

export class PermifyClient {
  base: string;
  tenantId: string;

  constructor({ base = BASE, tenantId = TENANT_ID } = {}) {
    this.base = base;
    this.tenantId = tenantId;
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
      console.log('Sending request to Permify', {
        url,
        entityType,
        entityId,
        permission,
        subjectType,
        subjectId,
        relation,
      });
      const resp = await axios.post(
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
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const can = resp.data?.can;
      return (
        can === 'CHECK_RESULT_ALLOWED' ||
        can === 'allowed' ||
        can === 'ALLOW'
      );
    } catch (err) {
      const e: any = err as any;
      console.error(
        'Permify check error',
        e?.response?.data ?? e?.message ?? e
      );
      return false;
    }
  }

  async writeRelationships(
    tuples: Array<{
      entity: { type: string; id: string };
      relation: string;
      subject: { type: string; id: string };
    }>
  ) {
    const url = `${this.base}/tenants/${this.tenantId}/relationships/write`;
    try {
      await axios.post(url, { tuples, metadata: {} });
      return true;
    } catch (err) {
      const e: any = err as any;
      console.error(
        'Permify write error',
        e?.response?.data ?? e?.message ?? e
      );
      return false;
    }
  }
}

export const permifyClient = new PermifyClient();
