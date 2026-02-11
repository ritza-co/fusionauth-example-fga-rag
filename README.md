# FusionAuth FGA + RAG Example

A Next.js chat application that combines **FusionAuth** for authentication, **Permify** for fine-grained authorization (FGA), and **Ollama** for local RAG (Retrieval-Augmented Generation). Users can only query documents they have permission to access — permissions are enforced _before_ documents reach the LLM, so unauthorized content is never exposed.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 18+

## Quick Setup

```bash
# Start infrastructure (FusionAuth, Permify, Ollama, PostgreSQL)
docker compose up -d

# Install dependencies
npm install

# Copy environment file (defaults work out of the box with kickstart)
cp .env.example .env

# Start the dev server
npm run dev

# Seed Permify schema, relationships, and sample documents
npm run seed:all
```

Open [http://localhost:3000](http://localhost:3000). Sign in with one of the seed users or create a new account:

| User | Email | Password | Org Role |
|------|-------|----------|----------|
| Admin | `admin@example.com` | `password` | admin |
| Jane | `jane@example.com` | `password` | member |
| John | `john@example.com` | `password` | -- |
| Stranger | `stranger@example.com` | `password` | -- |

New users who register through FusionAuth are automatically added as members of the organization.

## APIs

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a query -- returns an answer generated from permitted documents |
| `GET` | `/api/chat/history` | List the current user's conversations |
| `GET` | `/api/chat/history/[id]` | Get a specific conversation with messages |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents` | List all documents the current user can access |
| `POST` | `/api/upload` | Upload a new document (auto-linked to the organization) |

### Organization

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/organization` | Get organization details and member list |
| `POST` | `/api/organization/members` | Add a member by email _(admin only)_ |
| `DELETE` | `/api/organization/members` | Remove a member _(admin only)_ |
| `POST` | `/api/organization/admins` | Promote a member to admin _(admin only)_ |
| `DELETE` | `/api/organization/admins` | Demote an admin _(admin only)_ |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `*` | `/api/auth/[...nextauth]` | NextAuth OAuth callbacks (FusionAuth provider) |
| `GET` | `/api/logout` | Redirect to FusionAuth logout |

## Contributors

- [FusionAuth](https://fusionauth.io) -- Authentication and user management
- [Permify](https://permify.co) -- Fine-grained authorization (ReBAC)
