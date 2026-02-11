# Authentication & Authorization for RAG with Permify & FusionAuth

Requirements
- Wait for FusionAuth at `http://localhost:9011` and complete the web setup (or use the provided `kickstart/` folder).
- Docker & Docker Compose
- Node.js >= 18 and `npm`
- Install dependencies and run the demo server:
Minimal Quickstart

1. Start local infra (Permify, FusionAuth, Ollama):

```bash
docker-compose up -d
```

2. Copy the example env and install dependencies:

```bash
npm install
```

3. Start the demo server:

```bash
npm run dev
```

4. Seed Permify + sample data (writes schema, relationships, uploads sample docs):

```bash
npm run seed:all
```

Query /chat:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "x-user-email: jane@example.com" \
  -d '{"query":"What does the Q4 report say about revenue?"}'
```

## Architecture

```
┌──────────────┐       ┌──────────────────┐       ┌───────────────┐
│              │       │                  │       │               │
│   End User   │──────▶│   FusionAuth     │──────▶│  Application  │
│              │ login │                  │ JWT   │  (Next.js)    │
└──────────────┘       │                  │       │               │
                       └──────────────────┘       └───────┬───────┘
                                                          │
                                          ┌───────────────┼───────────────┐
                                          │               │               │
                                          ▼               ▼               ▼
                                   ┌─────────────┐ ┌───────────┐ ┌──────────────┐
                                   │  AI Agent   │ │  Document │ │   Permify    │
                                   │ (Ollama)    │ │  Upload   │ │   (ReBAC     │
                                   │             │ │  API      │ │   Engine)    │
                                   └──────┬──────┘ └─────┬─────┘ └──────▲───────┘
                                          │              │               │
                                          ▼              ▼               │
                                   ┌─────────────────────────────-┐      │
                                   │      Permify Retriever       │──────┘
                                   │   (filter docs by permission │
                                   │    before passing to LLM)    │
                                   └──────────────┬──────────────-┘
                                                  │
                                                  ▼
                                   ┌─────────────────────────────┐
                                   │        Vector Store          │
                                   │  (embeddings of all docs)   │
                                   └─────────────────────────────┘
```

## Authorization Model

Permify uses a schema-based authorization model. Define the following in your Permify instance:

```perm
entity user {}

entity organization {
    relation admin @user
    relation member @user
}

entity doc {
    relation org @organization
    relation owner @user
    relation viewer @user

    action view = viewer or owner or org.admin or org.member
}
```

This gives you:

- **Direct user access** -- assign `viewer` or `owner` on a specific document.
- **Wildcard / public access** -- assign `user:*` as `viewer` to make a document public.
- **Organization-level access** -- all members of an org can view documents linked to that org.

### Example Relationships

```
// Public document -- everyone can view
doc:company-handbook#viewer@user:*

// Private document -- only jane can view
doc:financial-report#viewer@user:jane@example.com

// Owner relationship
doc:project-plan#owner@user:john@example.com

// Org-level access
doc:engineering-wiki#org@organization:engineering
organization:engineering#member@user:jane@example.com
organization:engineering#member@user:john@example.com
```

## End-to-End Flow

### 1. User Authentication (FusionAuth)

```
User ──▶ FusionAuth Login (OAuth 2.0 / OIDC)
     ◀── JWT Access Token + ID Token (contains user email, roles)
```

### 2. Document Upload

```
User uploads document
     │
     ▼
Application receives file
     │
     ├──▶ Generate embeddings (OpenAI text-embedding-3-small)
     │         └──▶ Store in Vector Store with metadata { documentId }
     │
     └──▶ Write relationship to Permify
               └──▶ doc:<document_id>#owner@user:<user_email>
               └──▶ (optional) doc:<document_id>#viewer@user:* for public docs
```

### 3. Authorized RAG Query

```
User asks: "What does the financial report say about Q4?"
     │
     ▼
AI Agent receives query + user context (email from JWT)
     │
     ▼
Agent invokes RAG tool → Permify Retriever
     │
     ├──▶ Base retriever returns top-K candidate documents from vector store
     │
     ├──▶ For EACH candidate document:
     │       Permify check:
     │         subject:  user:<user_email>
     │         action:   view
     │         entity:   doc:<document_id>
     │
     │       ✅ Allowed  → include in context
     │       ❌ Denied   → discard
     │
     ▼
Agent receives only authorized documents as context
     │
     ▼
LLM generates answer using filtered context
```

The LLM never sees documents the user cannot access. It cannot infer, summarize, or leak restricted content.

## Prerequisites

- **Docker & Docker Compose** (for running Permify and FusionAuth)
- **Node.js >= 18** or **Python >= 3.11**
- **OpenAI API key** (for embeddings and chat model)

## Setup

### 1. Infrastructure (Permify + FusionAuth)

Create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  permify:
    image: ghcr.io/permify/permify:latest
    ports:
      - "3476:3476"  # HTTP
      - "3478:3478"  # gRPC
    command: serve
    restart: unless-stopped

  fusionauth:
    image: fusionauth/fusionauth-app:latest
    depends_on:
      - fusionauth-db
    environment:
      DATABASE_URL: jdbc:postgresql://fusionauth-db:5432/fusionauth
      DATABASE_ROOT_USERNAME: postgres
      DATABASE_ROOT_PASSWORD: postgres
      DATABASE_USERNAME: fusionauth
      DATABASE_PASSWORD: fusionauth
      FUSIONAUTH_APP_MEMORY: 512M
      FUSIONAUTH_APP_RUNTIME_MODE: development
      FUSIONAUTH_APP_URL: http://fusionauth:9011
      SEARCH_TYPE: database
    ports:
      - "9011:9011"
    restart: unless-stopped

  fusionauth-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fusionauth
    ports:
      - "5433:5432"
    volumes:
      - fusionauth-db-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  fusionauth-db-data:
```

```bash
docker-compose up -d
```

### 2. Configure FusionAuth

1. Open `http://localhost:9011` and complete the setup wizard.
2. Create a new **Application**:
   - Record the **Client ID** and **Client Secret**.
   - Set the **Authorized redirect URI** to `http://localhost:3000/api/auth/callback`.
   - Enable the **Authorization Code** grant.
3. Create test users (e.g. `jane@example.com`, `john@example.com`).

### 3. Write the Permify Schema

Send the authorization model to Permify:

```bash
curl -X POST http://localhost:3476/v1/tenants/t1/schemas/write \
  -H 'Content-Type: application/json' \
  -d '{
    "schema": "entity user {}\n\nentity organization {\n    relation admin @user\n    relation member @user\n}\n\nentity doc {\n    relation org @organization\n    relation owner @user\n    relation viewer @user\n\n    action view = viewer or owner or org.admin or org.member\n}"
  }'
```

### 4. Environment Variables

```env
# OpenAI
OPENAI_API_KEY=<your-openai-api-key>

# FusionAuth
FUSIONAUTH_URL=http://localhost:9011
FUSIONAUTH_CLIENT_ID=<client-id-from-step-2>
FUSIONAUTH_CLIENT_SECRET=<client-secret-from-step-2>
FUSIONAUTH_ISSUER=http://localhost:9011
FUSIONAUTH_TENANT_ID=<tenant-id>

# Permify
PERMIFY_HOST=localhost
PERMIFY_HTTP_PORT=3476
PERMIFY_GRPC_PORT=3478
PERMIFY_TENANT_ID=t1
```

### 5. Install Dependencies

**Node.js (LangChain + LangGraph)**

```bash
npm install langchain @langchain/openai @langchain/langgraph @langchain/core \
  @fusionauth/typescript-client \
  zod dotenv
```

**Python (LangChain + LangGraph)**

```bash
pip install langchain langchain-openai langgraph \
  permify grpcio \
  fusionauth-client python-dotenv
```

## Implementation Guide

### Permify Retriever (Core Pattern)

The Permify Retriever wraps any LangChain-compatible retriever and filters results through Permify permission checks.

**TypeScript**

```typescript
import { PermifyClient } from "./lib/permify";
import { Document } from "@langchain/core/documents";

interface PermifyRetrieverOptions {
  retriever: any; // base LangChain retriever
  userEmail: string;
  tenantId: string;
}

async function retrieveWithPermify(
  query: string,
  options: PermifyRetrieverOptions
): Promise<Document[]> {
  const { retriever, userEmail, tenantId } = options;

  // 1. Get candidate documents from vector store
  const candidates = await retriever.invoke(query);

  // 2. Check each document against Permify
  const permittedDocs: Document[] = [];

  for (const doc of candidates) {
    const documentId = doc.metadata.documentId;

    const result = await permifyClient.permission.check({
      tenantId,
      metadata: { depth: 5 },
      entity: { type: "doc", id: documentId },
      permission: "view",
      subject: { type: "user", id: userEmail },
    });

    if (result.can === "CHECK_RESULT_ALLOWED") {
      permittedDocs.push(doc);
    }
  }

  return permittedDocs;
}
```

**Python**

```python
from permify import PermifyClient
from langchain_core.documents import Document

async def retrieve_with_permify(
    query: str,
    retriever,
    user_email: str,
    tenant_id: str,
) -> list[Document]:
    # 1. Get candidate documents from vector store
    candidates = await retriever.ainvoke(query)

    # 2. Check each document against Permify
    permitted_docs = []

    for doc in candidates:
        document_id = doc.metadata.get("document_id")

        result = permify_client.permission.check(
            tenant_id=tenant_id,
            metadata={"depth": 5},
            entity={"type": "doc", "id": document_id},
            permission="view",
            subject={"type": "user", "id": user_email},
        )

        if result.can == "CHECK_RESULT_ALLOWED":
            permitted_docs.append(doc)

    return permitted_docs
```

### Writing Relationships on Document Upload

When a user uploads a document, create the corresponding relationship in Permify:

```typescript
// On document upload
await permifyClient.relationship.write({
  tenantId: "t1",
  metadata: {},
  tuples: [
    {
      entity: { type: "doc", id: documentId },
      relation: "owner",
      subject: { type: "user", id: userEmail },
    },
  ],
});
```

### Sharing a Document with Another User

```typescript
await permifyClient.relationship.write({
  tenantId: "t1",
  metadata: {},
  tuples: [
    {
      entity: { type: "doc", id: documentId },
      relation: "viewer",
      subject: { type: "user", id: recipientEmail },
    },
  ],
});
```

### Making a Document Public

```typescript
await permifyClient.relationship.write({
  tenantId: "t1",
  metadata: {},
  tuples: [
    {
      entity: { type: "doc", id: documentId },
      relation: "viewer",
      subject: { type: "user", id: "*" },
    },
  ],
});
```

### AI Agent Setup (LangGraph)

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

const ragTool = tool(
  async ({ query }, config) => {
    const userEmail = config?.configurable?.userEmail;

    const docs = await retrieveWithPermify(query, {
      retriever: vectorStore.asRetriever(),
      userEmail,
      tenantId: "t1",
    });

    return docs.map((d) => d.pageContent).join("\n\n");
  },
  {
    name: "get_context_documents",
    description:
      "Search for relevant documents to answer the user's question. " +
      "Only returns documents the current user is authorized to view.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

const agent = createReactAgent({
  llm: model,
  tools: [ragTool],
});

// Invoke with user context
const response = await agent.invoke(
  { messages: [{ role: "user", content: "What does the Q4 report say?" }] },
  { configurable: { userEmail: "jane@example.com" } }
);
```

## Project Structure

```
fusionauth-example-fga-rag/
├── docker-compose.yml           # Permify + FusionAuth infrastructure
├── .env                         # Environment variables
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/            # FusionAuth OAuth callback & session
│   │   │   ├── chat/            # AI agent endpoint
│   │   │   └── documents/
│   │   │       └── upload/      # Document upload + Permify tuple creation
│   │   ├── chat/                # Chat UI
│   │   └── documents/           # Document management UI
│   └── lib/
│       ├── auth.ts              # FusionAuth client & session helpers
│       ├── permify.ts           # Permify client & helpers
│       └── rag/
│           ├── agent.ts         # LangGraph agent definition
│           ├── embedding.ts     # OpenAI embedding setup
│           ├── retriever.ts     # Permify Retriever implementation
│           └── vectorstore.ts   # Vector store initialization
├── package.json
└── README.md
```

## Security Considerations

- **Pre-filtering, not post-filtering.** Documents are filtered before reaching the LLM. The model never sees unauthorized content and cannot leak it through inference or summarization.
- **Principle of least privilege.** Users only see documents explicitly shared with them, owned by them, or available through their organization membership.
- **Centralized authorization logic.** All permission checks go through Permify. The AI agent and application code never implement authorization logic directly.
- **Audit trail.** Permify relationship writes and permission checks can be logged for compliance and debugging.
- **Token validation.** All API requests validate the FusionAuth JWT before extracting user identity. Never trust client-supplied identity without verification.

## Extending the Model

The Permify schema can be extended to support more complex scenarios:

```perm
entity user {}

entity team {
    relation lead @user
    relation member @user
}

entity folder {
    relation owner @user
    relation editor @user
    relation viewer @user @team#member

    action view = viewer or editor or owner
    action edit = editor or owner
}

entity doc {
    relation parent @folder
    relation owner @user
    relation editor @user
    relation viewer @user

    action view = viewer or editor or owner or parent.view
    action edit = editor or owner or parent.edit
}
```

This adds:

- **Team-based access** -- grant a team viewer access to a folder, all members inherit it.
- **Folder hierarchy** -- documents inherit permissions from their parent folder.
- **Role differentiation** -- separate `viewer`, `editor`, and `owner` roles with distinct capabilities.

## License

[MIT](LICENSE)
