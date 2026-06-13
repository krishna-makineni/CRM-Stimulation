# Xeno System Architecture

Copy this Mermaid diagram into [Mermaid Live Editor](https://mermaid.live).

```mermaid
flowchart TD

A[Marketer]

subgraph P1["Phase 1: Customer & Order Management"]
    B[Upload Customers CSV]
    C[Upload Orders CSV]
    D[Customer API]
    E[Order API]
    F[(Customers Collection)]
    G[(Orders Collection)]
end

subgraph P2["Phase 2: AI-Powered Segmentation"]
    H[NLP Segment Builder]
    I["OpenAI: Intent Extraction"]
    J{Ambiguous Query?}
    K[Conversational Refinement]
    L[Generate Structured Filters]
    M[Generate MongoDB Query]
    N[Create BullMQ Segmentation Job]
    O[(Redis)]
    P[Segment Worker]
    Q[Retrieve Matching Customers]
    R[Segment Preview]
    S[Generate Segment Insights]
    T[Auto Segment Naming]
    U[Campaign Recommendations]
    V{Approve Segment?}
    W[(Segments Collection)]
end

subgraph P3["Phase 3: AI Campaign Copilot"]
    X[Campaign Goal]
    Y["OpenAI: Understand Intent"]
    Z[Retrieve Approved Segment]
    AA[Channel Recommendation Engine]
    AB["OpenAI: Generate Campaign Message"]
    AC[Campaign Preview]
    AD{Approve Campaign?}
    AE[Campaign API]
    AF[(Campaigns Collection)]
end

subgraph P4["Phase 4: Campaign Execution"]
    AG[Create BullMQ Campaign Job]
    AH[(Redis)]
    AI[Campaign Worker]
    AJ[Retrieve Segment Customers]
    AK[Create Communication Records]
    AL[Personalize Messages]
    AM[(Communications Collection)]
end

subgraph P5["Phase 5: Channel Service"]
    AN["POST /send"]
    AO[Channel Service]
    AP[Delivery Simulation Worker]
    AQ[SENT]
    AR[DELIVERED]
    AS[FAILED]
    AT[OPENED]
    AU[READ]
    AV[CLICKED]
end

subgraph P6["Phase 6: Receipt Processing"]
    AW["POST /webhooks/receipt"]
    AX[Webhook Handler]
    AY[Create BullMQ Analytics Job]
    AZ[(Redis)]
    BA[Analytics Worker]
    BB[Update Communication Status]
    BC[(Analytics Collection)]
end

subgraph P7["Phase 7: Analytics & AI Insights"]
    BD[Metrics Aggregation]
    BE[Delivery Rate]
    BF[Open Rate]
    BG[Click Through Rate]
    BH["OpenAI: Generate Insights"]
    BI[Analytics Dashboard]
end

%% Phase 1
A --> B
A --> C
B --> D --> F
C --> E --> G

%% Phase 2
A --> H
H --> I --> J
J -->|Yes| K --> I
J -->|No| L --> M --> N --> O --> P
F --> Q
G --> Q
P --> Q
Q --> R --> S --> T --> U --> V
V -->|No| H
V -->|Yes| W
P -. Stores Segment .-> W

%% Phase 3
A --> X
X --> Y --> Z
W --> Z
G --> AA
Z --> AA --> AB --> AC --> AD
AD -->|No| X
AD -->|Yes| AE
AE --> AF

%% Phase 4
AE --> AG --> AH --> AI
W --> AJ
AI --> AJ --> AK --> AL
AL --> AM

%% Phase 5
AM --> AN --> AO --> AP
AP --> AQ
AP --> AR
AP --> AS
AP --> AT
AP --> AU
AP --> AV

%% Phase 6
AQ --> AW
AR --> AW
AS --> AW
AT --> AW
AU --> AW
AV --> AW
AW --> AX --> AY --> AZ --> BA --> BB
BB --> AM
BA --> BC

%% Phase 7
BC --> BD
BD --> BE
BD --> BF
BD --> BG
BC --> BH --> BI
BE --> BI
BF --> BI
BG --> BI
BI --> A
```

## Implementation Mapping

| Phase | Implemented In |
|-------|----------------|
| 1 | `customerController`, `orderController`, CSV import |
| 2 | `segmentWorker`, `openaiService`, `segmentInsightService`, `Segments.tsx` |
| 3 | `copilotService`, `Copilot.tsx`, campaign controllers |
| 4 | `campaignWorker`, `campaignService` |
| 5 | `channel-service` simulation |
| 6 | `analyticsWorker`, `webhookController`, `AnalyticsEvent` model |
| 7 | `analyticsInsightService`, `Dashboard.tsx` |

## Running Workers

```bash
# Without Redis (inline jobs — dev default)
USE_INLINE_JOBS=true npm run dev

# With Redis + BullMQ workers
REDIS_URL=redis://localhost:6379 npm run dev
npm run dev:worker   # separate terminal
```
