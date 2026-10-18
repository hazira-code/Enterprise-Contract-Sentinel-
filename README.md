# Enterprise Contract Sentinel

An on-premise, air-gapped contract compliance engine engineered to evaluate high-value commercial agreements against strict enterprise governance mandates.

```
[Legacy Data (Postgres)] ➔ [Secure MCP Server Bridge] ➔ [Fine-Tuned Llama-3 (QLoRA)] ➔ [LangGraph Agent Orchestration] ➔ [React + TypeScript UI]
```

---

## 1. Ground Truth Enterprise Compliance Rules

The Sentinel pipeline, database schemas, and LangGraph multi-agent workflow enforce four non-negotiable enterprise compliance rules:

| Rule ID | Category | Corporate Mandate & Boundary | Violation Severity |
| :--- | :--- | :--- | :--- |
| **RULE-LIAB-001** | `LIABILITY` | Aggregate limitation of liability cannot exceed **150% of the Annual Contract Value (ACV)**. Uncapped or 2x+ ACV liability clauses trigger instant failure. | `CRITICAL` |
| **RULE-GDPR-002** | `DATA_SOVEREIGNTY` | EU citizen personal data processing must designate **exclusive EU/EEA storage** (e.g. Frankfurt, Germany). Standard Contractual Clauses (**SCCs**, EU 2021/914) must be present if cross-border transfer is mentioned. | `CRITICAL` |
| **RULE-LAW-003** | `GOVERNING_LAW` | Commercial agreements must be governed strictly by the laws of the **State of Delaware** (Court of Chancery) or the **State of New York**. Any foreign jurisdiction triggers instant failure. | `CRITICAL` |
| **RULE-TERM-004** | `AUTO_RENEWAL` | Automatic renewals must mandate at least a **60-day written notice window** prior to expiration. Silent or immediate auto-renewals trigger failure. | `WARNING` / `CRITICAL` |

---

## 2. Monorepo Directory Architecture

```
.
├── ai-engine/                    # Quantized LLM training & evaluation harness
│   ├── train_qlora.py            # PyTorch + Transformers + PEFT QLoRA fine-tuning
│   ├── evaluate_ragas.py         # Ragas extraction accuracy benchmark suite
│   ├── Dockerfile                # Isolated container configuration
│   ├── requirements.txt          # Pinned machine learning dependencies
│   └── README.md
│
├── mcp-server/                   # Model Context Protocol database bridge
│   ├── server.py                 # FastMCP server exposing database tools
│   ├── Dockerfile                # Lightweight Python 3.11 container
│   ├── requirements.txt          # mcp, psycopg3, pydantic dependencies
│   └── README.md
│
├── agent-orchestrator/           # Stateful LangGraph workflow & FastAPI backend
│   ├── app.py                    # 3-node LangGraph: Reader -> Auditor -> Writer
│   ├── Dockerfile                # FastAPI runtime container
│   ├── requirements.txt          # langgraph, fastapi, uvicorn
│   └── README.md
│
├── docker/                       # Container orchestration & schemas
│   ├── init.sql                  # PostgreSQL schema DDL & seed data
│   ├── docker-compose.yml        # Air-gapped multi-container composition
│   └── Dockerfile.frontend       # Production React Nginx container
│
└── src/                          # Interactive React UI & verification engine
    ├── components/               # Dashboard, LangGraphTracker, ViolationsList, etc.
    ├── services/                 # Pure contract evaluation engine
    └── types/                    # Strict TypeScript definitions
```

---

## 3. The Multi-Agent Workflow (LangGraph)

1. **Node 1: The Reader (`reader_node`)**
   - Ingests unstructured commercial contract text.
   - Leverages fine-tuned Llama-3-8B adapter to extract 4 structured clause entities: Liability Cap, Data Sovereignty, Governing Law, and Auto-Renewal timeline.
2. **Conditional Edge (`should_route_audit`)**
   - Validates that mandatory clauses were parsed before proceeding.
3. **Node 2: The Auditor (`auditor_node`)**
   - Invokes the MCP tool `get_compliance_rules` to dynamically query active policies from PostgreSQL.
   - Evaluates extracted clauses against the 150% liability cap, GDPR sovereignty mandates, Delaware/NY law, and 60-day renewal terms.
4. **Node 3: The Writer (`writer_node`)**
   - Calls the MCP tool `flag_contract_violation` for every identified non-compliance.
   - Updates contract lifecycle status to `APPROVED` or `FAILED_COMPLIANCE` via `update_contract_status`.

---

## 4. Local Deployment & Air-Gap Verification

To launch the complete enterprise monorepo locally with Docker Compose:

```bash
# Clone and enter the project
git clone <repo-url> enterprise-contract-sentinel
cd enterprise-contract-sentinel

# Start all five services with network isolation
docker compose -f docker/docker-compose.yml up --build -d
```

### Verification Ports:
- **Web UI Dashboard**: `http://localhost:3000`
- **Agent Orchestrator API**: `http://localhost:8000/docs`
- **MCP Server**: `http://localhost:8001`
- **PostgreSQL Database**: `localhost:5432` (`sentinel_db`)

### Running Unit Tests:
```bash
node --test src/services/contractEngine.test.ts
```
All 12 unit tests evaluate pure clause extraction and compliance logic across the 4 corporate rules.
