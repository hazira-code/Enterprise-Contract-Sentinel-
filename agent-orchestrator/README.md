# LangGraph Agent Orchestrator

Hosts the stateful LangGraph multi-agent workflow inside a production FastAPI application.

## Workflow Nodes
- **Reader Node**: Parses clauses from incoming commercial agreements.
- **Auditor Node**: Evaluates clauses against the 4 ground-truth rules queried via MCP.
- **Writer Node**: Invokes MCP tools to write violation records and update database state.

## Endpoints
- `POST /api/audit`: Trigger an audit run for a document.
- `GET /api/contracts/{id}`: Retrieve existing audit findings.
- `GET /api/rules`: Query active compliance rules.
- `GET /api/health`: Health probe.
