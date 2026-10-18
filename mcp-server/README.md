# Model Context Protocol (MCP) Server

Implements the official Model Context Protocol server exposing three database tools to LangGraph agents:

1. `get_compliance_rules(category: str)`: Queries PostgreSQL `compliance_rules` table.
2. `flag_contract_violation(contract_id: str, violation_details: str)`: Writes violation logs to `contract_violations`.
3. `update_contract_status(contract_id: str, status: str)`: Updates contract lifecycle state.

## Transport Modes
- `stdio`: Fast IPC for co-located agent execution.
- `sse` / `http`: Networked tool invocation over Docker internal bridge.
