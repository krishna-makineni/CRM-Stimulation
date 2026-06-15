# Xeno — AI-Native Mini CRM

An AI-powered marketing CRM that helps brands intelligently reach shoppers through personalized campaigns. Built as a full-stack, production-ready platform with native AI integration throughout the workflow.

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | _Deploy and add URL here_ |
| CRM Backend (Render) | _Deploy and add URL here_ |
| Channel Service (Render) | _Deploy and add URL here_ |
| GitHub Repository | _Add repository URL here_ |

## Architecture

```
┌─────────────┐     HTTP      ┌──────────────────┐     HTTP      ┌───────────────────┐
│   Frontend  │ ────────────► │   CRM Service    │ ────────────► │  Channel Service  │
│  (Vercel)   │               │  (Render :5000)  │               │  (Render :5001)   │
│  React/TS   │ ◄──────────── │  Express/MongoDB │ ◄──────────── │  Simulated Events │
└─────────────┘     REST API  └────────┬─────────┘   Webhooks    └───────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  MongoDB Atlas   │
                              └──────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │   OpenAI API     │
                              │  (Segmentation,  │
                              │   Messages, AI   │
                              │    Copilot)      │
                              └──────────────────┘
```

### Communication Lifecycle

```
CRM Service                    Channel Service
    │                               │
    │  POST /send                   │
    │ ─────────────────────────────►│
    │                               │ Simulate: SENT → DELIVERED → OPENED → CLICKED
    │  POST /api/webhooks/receipt   │         (or FAILED)
    │ ◄─────────────────────────────│
    │  (async callbacks w/ retry)   │
    ▼                               ▼
Update Communication status    Exponential backoff
Update Campaign analytics      on failed callbacks
```

## Features

### Core CRM
- **Customer Management** — CRUD, CSV import, profile pages with order history
- **Order Management** — CSV import, realistic seed data generation
- **Segmentation** — Manual and AI-powered natural language segmentation
- **Campaigns** — Create, launch, track across WhatsApp, SMS, Email, RCS
- **Analytics** — Dashboard metrics, funnel charts, campaign comparison

### AI Features (3 Native AI Integrations)

1. **Natural Language Segmentation** — Enter queries like _"Find customers who spent more than ₹10000 and inactive for 60 days"_ → OpenAI extracts structured filters → MongoDB query execution

2. **AI Message Generation** — Generate personalized campaign copy with `{{name}}` placeholders based on objective, audience, tone, and offer

3. **Agentic Campaign Copilot** — Chat-based 8-step workflow:
   - Understand intent → Generate filters → Query customers → Recommend channel → Generate message → Preview → Human approval → Launch

### Channel Simulation
- Simulated delivery events: SENT, DELIVERED, FAILED, OPENED, READ, CLICKED
- Async callbacks with realistic delays
- Retry logic with exponential backoff (up to 5 retries)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, React Query, Recharts, shadcn/ui |
| CRM Backend | Node.js, Express, TypeScript, Mongoose |
| Channel Service | Node.js, Express, TypeScript |
| Database | MongoDB Atlas |
| AI | OpenAI GPT-4o-mini |
| Deployment | Vercel (frontend), Render (backends) |

## Project Structure

```
Xeno/
├── crm-service/          # CRM backend (port 5000)
│   └── src/
│       ├── config/       # Environment, database
│       ├── controllers/  # Route handlers
│       ├── models/       # Mongoose schemas
│       ├── routes/       # API routes
│       ├── services/     # Business logic + AI
│       ├── middleware/   # Error handling
│       └── scripts/      # Seed data
├── channel-service/      # Channel simulator (port 5001)
│   └── src/
│       ├── controllers/
│       └── services/     # Simulation + callbacks
├── frontend/             # React SPA
│   └── src/
│       ├── api/          # API client
│       ├── components/   # UI components
│       └── pages/        # Route pages
└── sample-data/          # CSV import examples
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repo-url>
cd Xeno

# CRM Service
cd crm-service
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI key
npm install

# Channel Service
cd ../channel-service
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Environment Variables

**crm-service/.env**
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/xeno-crm
OPENAI_API_KEY=sk-your-key
CHANNEL_SERVICE_URL=http://localhost:5001
CRM_WEBHOOK_URL=http://localhost:5000/api/webhooks/receipt
```

**channel-service/.env**
```
PORT=5001
CRM_WEBHOOK_URL=http://localhost:5000/api/webhooks/receipt
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Database

```bash
cd crm-service
npm run seed
```

This creates 100 customers with realistic orders and 3 sample segments.

### 4. Run Services

```bash
# Terminal 1 — CRM Service
cd crm-service && npm run dev

# Terminal 2 — Channel Service
cd channel-service && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

## API Endpoints

### CRM Service (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers |
| GET | `/customers/:id` | Customer profile + orders |
| POST | `/customers/import` | CSV import |
| GET | `/orders` | List orders |
| POST | `/segments/parse` | AI natural language segmentation |
| POST | `/segments` | Save segment |
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns/:id/launch` | Launch campaign |
| POST | `/campaigns/generate-message` | AI message generation |
| GET | `/analytics/dashboard` | Dashboard metrics |
| POST | `/copilot/sessions` | Start AI copilot session |
| POST | `/copilot/sessions/:id/messages` | Send copilot message |
| POST | `/webhooks/receipt` | Channel delivery callbacks |

### Channel Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Receive communication request |
| GET | `/health` | Health check |

## Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set `VITE_API_URL` to your Render CRM service URL + `/api`
4. Deploy

### CRM Service (Render)
1. Create Web Service from repo, root dir `crm-service`
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Set environment variables (MONGODB_URI, OPENAI_API_KEY, CHANNEL_SERVICE_URL, CRM_WEBHOOK_URL)

### Channel Service (Render)
1. Create Web Service from repo, root dir `channel-service`
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Set `CRM_WEBHOOK_URL` to your CRM service receipt endpoint

Or use the included `render.yaml` Blueprint for one-click deploy.

## AI Workflow Explanation

### Segmentation Pipeline
```
User Query (NL) → OpenAI (structured JSON) → MongoDB Query Builder → Customer Results
                     ↓ (fallback)
              Regex-based parser
```

### Copilot Agent Flow
```
User Goal
  → Step 1: Extract intent (objective, segment query, tone)
  → Step 2: Parse NL to filters (OpenAI)
  → Step 3: Query MongoDB for matching customers
  → Step 4: Recommend channel (historical performance + AI)
  → Step 5: Generate personalized message (OpenAI)
  → Step 6: Build campaign preview
  → Step 7: Present to marketer for approval
  → Step 8: On "approve" → Create campaign → Launch → Channel Service
```

Human-in-the-loop: campaigns are **never** launched without explicit marketer approval.

## Scaling Considerations & Trade-offs

### Current Architecture (Direct HTTP)
- **Pros**: Simple, easy to debug, no additional infrastructure
- **Cons**: Tight coupling, no guaranteed delivery, single-point failures

### Future Improvements

| Improvement | Benefit | Trade-off |
|-------------|---------|-----------|
| **Kafka/RabbitMQ** | Decoupled services, guaranteed delivery, replay capability | Operational complexity, need message broker infra |
| **Worker Queues** (Bull/BullMQ) | Reliable campaign dispatch, rate limiting | Redis dependency, more moving parts |
| **Event-Driven Architecture** | Real-time analytics, loose coupling | Event schema management, eventual consistency |
| **Horizontal Scaling** | Handle more concurrent campaigns | Session state (copilot), MongoDB connection pooling |
| **Webhook Signature Verification** | Security for receipt callbacks | Key management overhead |
| **Redis for Copilot Sessions** | Persist sessions across restarts | Additional service dependency |

### Why Direct HTTP for Now
For an MVP with simulated channels and moderate traffic, direct HTTP with retry logic is sufficient. The architecture is designed with clear service boundaries so migrating to message queues requires minimal code changes — only the `channelClient.ts` and `callbackService.ts` transport layers need updating.

