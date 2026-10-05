# ARCHITECTURE.md — AI-Powered Code Review Assistant



## 1. Requirements

### Functional Requirements
- Auth: register, login, logout, protected routes (JWT)
- Project CRUD: create, list, delete (name, description, createdAt)
- Code ingestion: ZIP upload, unpacked and associated with a project
- Code explorer: folder-tree view, file preview, syntax highlighting
- AI review engine: review a single file, a set of files, or a whole project
- Review templates: Security, Performance, Code Quality (minimum 3, pluggable)
- Structured review output: summary, issues[], recommendations[], severity (Critical/High/Medium/Low)
- Review history: list, search, open detail
- AI chat over uploaded code, with simple retrieval as context
- Configurable AI provider per project/user: baseURL + apiKey + model, never hardcoded
- Bonus (pick 2): Documentation Generator, Technical Debt Scanner

### Non-Functional Requirements
- **Timeline:** 3 days, solo — this is the dominant constraint. Every decision below optimizes for *shippable and explainable* over *scalable*.
- **Security:** no secrets in repo/commits; API keys encrypted at rest, not just plaintext in DB
- **Maintainability > feature count** (explicit rubric weight: Code Quality 20%, Architecture 15%)
- **Cost:** must run against both a paid cloud API (OpenAI) and a free local model (LM Studio/Ollama) — so token cost/latency budgeting differs per provider
- Mobile responsiveness: nice-to-have, not core
- Deployment: optional

### Constraints
- Team size: 1 (solo)
- Existing familiarity: Node / Express / MongoDB / Mongoose (MERN) — the whole stack stays in TypeScript/Node with tools already known, so no time is spent learning a new framework or ORM under a 3-day clock
- Frontend stack fixed by the assessment: Next.js, TypeScript, Tailwind
- **Compliance note:** the assessment's backend/DB menu lists NestJS/FastAPI and a set of databases. Express and MongoDB should be confirmed as acceptable (MongoDB is only safe if it is on the DB menu). If Express is not allowed, the layered structure in §3.5 maps almost 1:1 onto NestJS modules/controllers/services.

---

## 2. High-Level Design

### 2.1 Component Diagram

```
                        ┌─────────────────────────────┐
                        │        Next.js Frontend      │
                        │  (App Router, TS, Tailwind)  │
                        │                              │
                        │  /login /register            │
                        │  /dashboard                  │
                        │  /project/[id]/explorer      │
                        │  /project/[id]/review/[id]   │
                        │  /project/[id]/chat          │
                        └───────────────┬──────────────┘
                                        │ REST (JSON) + JWT (httpOnly cookie)
                                        │ via Next rewrite: /api/* → Express
                                        ▼
                        ┌─────────────────────────────┐
                        │   Express Backend (TS)       │
                        │                              │
                        │  Middleware: helmet, cors,   │
                        │   cookie-parser, rate-limit, │
                        │   auth (JWT), zod validate,  │
                        │   error handler              │
                        │                              │
                        │  features/                   │
                        │   auth      (JWT, bcrypt)    │
                        │   projects                   │
                        │   files     (zip, tree)      │
                        │   reviews   (templates,      │
                        │              severity)       │
                        │   chat      (retrieval)      │
                        │   ai-providers (config +     │
                        │      OpenAICompatibleClient) │
                        └───────┬─────────────┬────────┘
                                │             │
                    ┌───────────▼───┐   ┌─────▼──────────────────┐
                    │   MongoDB     │   │  AI Provider (external) │
                    │ (Mongoose)    │   │  OpenAI / LM Studio /   │
                    │               │   │  Ollama / OpenRouter    │
                    │ users         │   │  — all speak the same   │
                    │ projects      │   │  /v1/chat/completions   │
                    │ files         │   │  wire format             │
                    │  (meta +      │   └─────────────────────────┘
                    │   content)    │
                    │ reviews       │
                    │ aiproviders   │
                    │ chatsessions  │
                    │ messages      │
                    └───────────────┘
```

### 2.2 Data Flow — Review Request (the core flow)

```
1. User selects file(s)/project + review template (Security/Perf/Quality) in UI
2. Frontend → POST /api/reviews  { projectId, fileIds[], template, providerId }
3. Backend:
   a. Verify the project belongs to req.user; load AiProvider config (decrypt apiKey)
   b. Load file contents from MongoDB (files collection, `content` field)
   c. Build prompt = templatePrompt + fileContents (truncated/chunked if large)
   d. Call OpenAICompatibleProvider.chat() → /v1/chat/completions
      with `response_format: json_object` (or schema-enforcing system prompt)
   e. Parse + validate JSON (zod) → { summary, issues[], recommendations[], severity }
   f. Persist to `reviews` collection (status: complete | failed)
4. Backend → 201 { reviewId }
5. Frontend polls or receives response → renders review detail view
```

### 2.3 Data Flow — Chat With Code (simple retrieval)

```
1. User asks a question in a project's chat
2. Backend does lexical retrieval (no vector DB needed at this scale):
   - MongoDB $text search over files.content + files.path, scoped to projectId,
     sorted by { $meta: "textScore" }  (or explicit @filename mention)
   - Take top-N files, truncate to a context budget (e.g. 6-8k tokens)
3. Build messages = [system: "answer using only this code" , context, history, question]
4. Call AiProvider.chat() → persist Message docs (role: user/assistant) under ChatSession
5. Return answer, append to session history for next turn
```

### 2.4 API Contract (representative — not exhaustive)

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | create user |
| POST | `/auth/login` | issue JWT (httpOnly cookie) |
| POST | `/auth/logout` | clear cookie |
| GET | `/projects` | list user's projects |
| POST | `/projects` | create project |
| DELETE | `/projects/:id` | delete project (service cascades files/reviews/chat) |
| POST | `/projects/:id/upload` | multipart ZIP upload (multer) |
| GET | `/projects/:id/files` | file tree (nested JSON, built from flat `path` list) |
| GET | `/files/:id/content` | raw content for preview |
| POST | `/reviews` | create review job (file/multi-file/project scope) |
| GET | `/reviews?projectId=&q=` | list + search history |
| GET | `/reviews/:id` | review detail |
| POST | `/ai-providers` | save provider config (baseURL, apiKey, model) |
| GET | `/ai-providers` | list configs (apiKey masked in response) |
| POST | `/chat/sessions/:projectId` | start/continue chat session |
| GET | `/chat/sessions/:id/messages` | history |

### 2.5 Storage Choices

- **Everything persistent:** MongoDB (Atlas free tier or local). Users, projects, file metadata *and* file contents, reviews, provider configs, chat.
- **Raw file contents:** stored in the `files` collection as a `content` string, with a per-file size cap (e.g. 256 KB) enforced at unpack time. Code files are small, this stays far below Mongo's 16 MB document limit, it removes the need for a disk volume (simpler deploy, no path bookkeeping), and it lets Mongo's `$text` index power chat retrieval. Not S3 — out of scope for a 3-day solo build.
- **Session/JWT:** stateless JWT in httpOnly cookie; no Redis session store needed at this scale.

---

## 3. Deep Dive

### 3.1 Data Model (Mongoose / MongoDB)

**Embed vs. reference rule used throughout:** embed data that is always read together and bounded in size (a review's `issues[]`); reference (separate collection + `projectId`/`userId` field + index) data that is unbounded or queried on its own (files, messages, reviews).

```typescript
// models/user.model.ts
const UserSchema = new Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true });

// models/project.model.ts
const ProjectSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String },
}, { timestamps: true });

// models/file.model.ts
const FileSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  path:      { type: String, required: true },   // relative path in the zip, e.g. src/auth/auth.service.ts
  language:  { type: String },                   // inferred from extension
  sizeBytes: { type: Number, required: true },
  content:   { type: String, required: true },   // raw file text (capped at unpack time)
}, { timestamps: true });
FileSchema.index({ projectId: 1, path: 1 }, { unique: true });
FileSchema.index({ path: 'text', content: 'text' });   // powers chat retrieval

// models/aiProvider.model.ts
const AiProviderSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label:     { type: String, required: true },   // "My OpenAI", "Local LM Studio"
  baseUrl:   { type: String, required: true },
  apiKeyEnc: { type: String, select: false },    // AES-256-GCM ciphertext, never plaintext, never returned
  model:     { type: String, required: true },
}, { timestamps: true });

// models/review.model.ts
const IssueSchema = new Schema({
  title:       { type: String },
  description: { type: String, required: true },
  file:        { type: String },
  line:        { type: Number },
  severity:    { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
}, { _id: false });

const ReviewSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  scope:     { type: String, enum: ['SINGLE_FILE', 'MULTI_FILE', 'PROJECT'], required: true },
  template:  { type: String, enum: ['SECURITY', 'PERFORMANCE', 'QUALITY'], required: true },
  fileIds:   [{ type: Schema.Types.ObjectId, ref: 'File' }],   // which files were included
  summary:   { type: String },
  issues:    [IssueSchema],                                    // embedded subdocuments
  recommendations: [{ type: String }],
  severity:  { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },   // overall
  status:    { type: String, enum: ['pending', 'complete', 'failed'], default: 'pending' },
  error:     { type: String },
}, { timestamps: true });
ReviewSchema.index({ summary: 'text', 'issues.description': 'text' });   // review-history search
ReviewSchema.index({ projectId: 1, createdAt: -1 });

// models/chatSession.model.ts
const ChatSessionSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
}, { timestamps: true });

// models/message.model.ts
const MessageSchema = new Schema({
  chatSessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
  role:          { type: String, enum: ['user', 'assistant'], required: true },
  content:       { type: String, required: true },
}, { timestamps: true });
```

**Design decisions, justified:**
- `issues` is an embedded subdocument array rather than a `Json` blob: it is naturally document-shaped (always read with its review, bounded size), so we get schema validation and per-issue `severity` for free, with no join or extra collection.
- `messages` are **not** embedded in `ChatSession`: a chat grows without bound and would eventually approach the 16 MB document limit; a separate collection with an index on `chatSessionId` keeps reads paginated and cheap.
- `files` are a flat list keyed by `path`; the nested tree for the explorer is built in the service layer from that list (split on `/`). No recursive tree structure is stored.
- `apiKeyEnc` and `passwordHash` use `select: false` so they can never leak by accident through a normal query.

**Cascading deletes (no foreign keys in Mongo):** `ProjectsService.delete(id, userId)` verifies ownership, then removes children explicitly: messages → chat sessions → reviews → files → project. Wrapped in a Mongoose transaction (`session.withTransaction`) when running on Atlas/replica set, otherwise executed children-first so a partial failure never leaves orphaned children pointing at a missing parent. This is one more thing to write compared with a relational DB, and it is covered by an integration test.

### 3.2 AI Provider Abstraction (the highest-leverage design decision)

```typescript
interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
interface ProviderConfig { baseUrl: string; apiKey: string; model: string }

interface AIProvider {
  chat(messages: ChatMessage[], config: ProviderConfig): Promise<string>;
}

class OpenAICompatibleProvider implements AIProvider {
  async chat(messages: ChatMessage[], config: ProviderConfig) {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: config.model, messages, temperature: 0.2 }),
      signal: AbortSignal.timeout(120_000),   // local models can be slow
    });
    if (!res.ok) throw new Error(`Provider error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }
}
```

One class covers OpenAI, LM Studio, Ollama (OpenAI-compat mode), and OpenRouter, because they all implement the same `/v1/chat/completions` contract — only `baseUrl`/`apiKey`/`model` differ, and those come from the `AiProvider` document, never from `.env` hardcoding. This directly satisfies "provider configuration must not be hardcoded" and is worth calling out explicitly in `AI_USAGE.md` as an engineering decision.

The provider is injected into `ReviewsService` and `ChatService` through their constructors (plain constructor injection, wired in one composition file), so tests can pass a fake `AIProvider` and the OpenAI-compatible class stays swappable.

### 3.3 Error Handling & Retry Logic

- AI calls: wrap in try/catch; on failure, persist `Review.status = 'failed'` with the error message rather than losing the request — surfaces in Review History instead of silently disappearing.
- Malformed JSON from the model: one retry with a stricter system prompt ("respond with valid JSON only, no markdown fences"); responses are validated with a zod schema. If it still fails, store raw text under `summary` and flag `status: 'failed'` rather than crashing the request.
- ZIP upload: validate max archive size (multer limit), cap per-file size, and skip non-code/binary bloat (node_modules, .git, images, lockfiles) at unpack time via an ignore-list, so storage and prompt context don't balloon. Guard against zip-slip (reject entries whose normalized path escapes the root).
- HTTP layer: one central Express error-handling middleware maps known errors (validation, auth, not-found) to consistent JSON `{ error: { code, message } }`; async handlers are wrapped so rejected promises reach it (Express 5 does this natively; with Express 4 use a small `asyncHandler` wrapper).

### 3.4 Caching / Performance Notes (small-scale, still worth stating)

- No caching layer needed at this scale — reviews are on-demand and infrequent. If revisited at higher scale: cache file-tree JSON per project (invalidate on new upload) and consider embedding-based retrieval for chat instead of lexical ranking once codebases exceed a few hundred files.
- Listing endpoints use `.lean()` and field projection (e.g. the file tree endpoint never selects `content`) so large file bodies aren't pulled across the wire unnecessarily.

### 3.5 Backend Structure (layered, feature-folder)

```
server/
  src/
    app.ts                  // express app, middleware, route mounting
    server.ts               // connect Mongo, listen
    config/env.ts           // zod-validated environment variables
    middleware/             // auth.ts, validate.ts, error.ts, upload.ts
    features/
      auth/        auth.routes.ts  auth.controller.ts  auth.service.ts
      projects/    ...
      files/       ...      zip.service.ts, tree.util.ts
      reviews/     ...      templates/{security,performance,quality}.ts
      chat/        ...      retrieval.service.ts
      ai-providers/ ...     provider.interface.ts, openai-compatible.provider.ts, crypto.ts
    models/                 // Mongoose schemas (section 3.1)
    utils/                  // logger (pino), asyncHandler, errors
```

Rule: **routes → controllers → services → models**. Controllers only parse/validate the request and shape the response; all business logic lives in services; only services touch Mongoose. This is the main maintainability argument for the rubric, and it is the same separation NestJS would force.

---

## 4. Scale & Reliability

*(Not required for a 3-day intern assessment, but stating it explicitly is a strong "production-ready thinking" signal for the rubric — and it's the last piece of the system-design framework.)*

### 4.1 Load Estimation (realistic scope for this assessment)
- Expected usage: single reviewer/demo account, a handful of projects, each with tens to low-hundreds of files. Not a multi-tenant SaaS load.
- The one genuinely expensive operation is the **AI call** — not the database or file I/O. A "whole project" review scope is the ceiling case: if a project has 200 files at ~500 tokens each, that's ~100k tokens of raw context, which exceeds most models' context windows before you even add the system prompt.
- **Mitigation implemented now, not deferred:** chunk project-scope reviews file-by-file (or in small batches), run them sequentially or with limited concurrency (e.g. 3 in flight), and merge the per-chunk `issues[]`/`recommendations[]` into one aggregate `Review` document. This isn't an optimization for later — without it, "entire project" review simply fails on any real-sized codebase.

### 4.2 Horizontal vs. Vertical Scaling
- At this scale: a single Express instance + a single MongoDB deployment is correct — introducing a second app server or extra replicas would be unjustified complexity (directly against "we value maintainability over complexity").
- **What would change first if this became a real product:** the AI-call path is the natural place to scale horizontally (stateless workers pulling review jobs off a queue), not the CRUD API, since AI latency (seconds) dwarfs DB/API latency (milliseconds). Express is stateless (JWT in a cookie), so extra instances behind a load balancer need no session changes.

### 4.3 Failover & Redundancy
- Out of scope for the assessment (single-instance, optional deployment). Documented here rather than built, to show the boundary is a deliberate choice, not an oversight.
- If revisited: MongoDB would run on a managed replica set (Atlas) with automated backups/point-in-time recovery before any app-tier redundancy, since a lost review job is recoverable (re-run) but lost project/file data is not. A replica set also enables multi-document transactions for the cascade delete.

### 4.4 Monitoring & Alerting
- Minimum viable for the assessment: structured request logging (`pino` + `pino-http`) plus persisting `Review.status = 'failed'` with the error message, so failures are visible in-app (Review History) rather than only in server logs.
- Not building: dashboards, alerting, tracing — correctly out of scope, but worth naming so the omission reads as a decision.

### 4.5 What to Revisit as the System Grows
- Swap lexical chat-retrieval for embedding-based retrieval (MongoDB Atlas Vector Search or a dedicated vector store) once codebases exceed a few hundred files — lexical ranking degrades as file count grows and filenames stop correlating with relevance.
- Move review execution off the request/response cycle onto a job queue (BullMQ, since it's Node-native; requires Redis) once review latency (tied to AI provider response time) starts blocking requests under concurrent users.
- Move large or numerous file bodies out of MongoDB into object storage (S3-compatible), keeping only metadata and a storage key in Mongo, if projects grow beyond what is comfortable to store inline.

---

## 5. ADR-1: Backend Framework — Express vs NestJS vs FastAPI

**Status:** Accepted (revised; previously NestJS)
**Deciders:** Solo candidate, 3-day timeline

### Context
The candidate's existing depth is in Node/Express/Mongoose (MERN), not Python and not NestJS. The frontend is fixed (Next.js, TS, Tailwind) and the whole system should stay in one language.

### Decision
Express with TypeScript, structured as feature folders with a strict routes → controllers → services → models layering.

### Options Considered

**Option A: Express + TypeScript**
| Dimension | Assessment |
|---|---|
| Complexity | Low — minimal boilerplate, direct control |
| Cost | None |
| Scalability | Good for this scope; structure depends on discipline, not the framework |
| Team familiarity | High — already used daily |

Pros: zero framework learning curve; least boilerplate for a 3-day build; every line is understood, which matters because "you should understand every line you submit"; same language across frontend and backend.
Cons: no enforced architecture, so the layering and folder conventions must be kept deliberately; no built-in DI or validation (solved with constructor injection + zod); not the framework marked "Preferred" in the assessment, which may carry a scoring signal.

**Option B: NestJS**
| Dimension | Assessment |
|---|---|
| Complexity | Medium — modules, decorators, DI ceremony |
| Cost | None |
| Scalability | Good — opinionated, modular |
| Team familiarity | Medium/Low — new framework on top of the app itself |

Pros: enforced structure, built-in DI/guards/pipes, listed as "Preferred".
Cons: extra learning time and boilerplate inside a 3-day window; risk of submitting patterns that aren't fully understood.

**Option C: FastAPI**
| Dimension | Assessment |
|---|---|
| Complexity | Low (framework) but High (context switch) |
| Cost | None |
| Scalability | Good |
| Team familiarity | Low — new language under a hard deadline |

Cons: splits the codebase across two languages, Python tooling overhead, highest risk of shallow understanding.

### Trade-off Analysis
The 3-day constraint dominates. Express wins on speed and understanding-depth; its one real weakness (no enforced structure) is mitigated by the explicit layering in §3.5 and constructor injection of the AI provider. The cost is the possible loss of the "Preferred framework" signal; this is why the compliance note in §1 recommends confirming Express is acceptable.

### Consequences
- Easier: fastest path to working code, single-language stack, full control of middleware
- Harder: architecture quality depends entirely on following the conventions; validation, auth guards and error handling are hand-wired middleware
- Revisit: if the project outgrows the assessment, or Express is disallowed, port feature folders to NestJS modules (the layering already matches)

---

## 6. ADR-2: Database — MongoDB (Mongoose) vs PostgreSQL (Prisma)

**Status:** Accepted (revised; previously PostgreSQL + Prisma)

### Context
Candidate's practical experience is MongoDB/Mongoose. The entity graph (User → Projects → Files / Reviews / ChatSessions → Messages) is hierarchical, but the access patterns are simple: everything is fetched by `projectId` or `userId`, and no feature requires joining across unrelated entities.

### Decision
MongoDB, via Mongoose.

### Options Considered

**Option A: MongoDB + Mongoose**
| Dimension | Assessment |
|---|---|
| Complexity | Low — directly familiar |
| Cost | None (local or Atlas free tier) |
| Scalability | Fine for this scope and well beyond it |
| Team familiarity | High |

Pros: no new tooling to learn; reviews are document-shaped (summary + embedded `issues[]` + `recommendations[]`) and map naturally to a single document with schema validation; file contents can live in the same database and be searched with a built-in `$text` index for chat retrieval; no migration step (schema changes are code changes); one database to run and deploy.
Cons: no foreign keys, so referential integrity and cascading deletes are enforced in the service layer; multi-document transactions need a replica set (Atlas provides this); relationships need explicit `ref` / `populate` or manual lookups; less rigid data guarantees than a relational schema.

**Option B: PostgreSQL + Prisma**
| Dimension | Assessment |
|---|---|
| Complexity | Medium — new schema language and migration workflow |
| Cost | None |
| Scalability | Strong relational integrity and cascades |
| Team familiarity | Medium/Low — Prisma is new |

Pros: foreign keys and `onDelete: Cascade` give integrity for free; typed queries; migrations visible in Git history.
Cons: a second new tool (Prisma) to learn alongside the rest of the build; migration step on every model change; the relational advantages matter less here because the app has no complex cross-entity queries.

### Trade-off Analysis
Because the access patterns are scoped lookups (by project or user) rather than joins, the main relational advantage — enforced integrity and cascades — is replaced by a small, tested piece of service code. In exchange the build avoids a new ORM and migration workflow, and gains embedded review documents and built-in text search. The "Database Design" rubric line is addressed through an explicit embed-vs-reference rule, indexes chosen for the real query patterns, and `select: false` on sensitive fields (§3.1), rather than through foreign keys.

### Consequences
- Easier: fastest start, no migrations, natural fit for nested review output, built-in text search for retrieval and review-history search
- Harder: cascade deletes and ownership checks live in application code and must be tested; no database-level referential integrity
- Revisit: if analytics across reviews (e.g. "all CRITICAL issues across projects") or strict integrity become requirements, move to PostgreSQL and normalize `issues` into their own table

---

## 7. Action Items
1. [ ] Scaffold Express + TypeScript server with feature folders: `auth`, `projects`, `files`, `reviews`, `ai-providers`, `chat` (plus shared `middleware/`, `models/`, `config/env.ts`)
2. [ ] Define Mongoose models and indexes from Section 3.1 (text indexes on `File` and `Review`, unique `(projectId, path)`)
3. [ ] Implement `OpenAICompatibleProvider` and provider-config CRUD (encrypt `apiKey` at rest — AES-256-GCM via Node `crypto`, key from env)
4. [ ] ZIP upload (multer) → unpack with ignore-list and size caps → persist file docs pipeline
5. [ ] Review engine: template prompts (Security/Performance/Quality) → structured JSON parsing with zod → persistence
6. [ ] Chat: `$text` retrieval + session/message persistence
7. [ ] Frontend: dashboard, explorer (tree + syntax highlighting via shiki), review detail, chat UI; Next.js rewrite `/api/*` → Express so the httpOnly cookie stays same-origin
8. [ ] Pick 2 bonus features: recommend Documentation Generator + Technical Debt Scanner (reuse review-engine plumbing)
9. [ ] Write README.md, ARCHITECTURE.md (this doc, refine post-build), AI_USAGE.md
