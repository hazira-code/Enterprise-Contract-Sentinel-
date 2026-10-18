#!/usr/bin/env python3
"""
Enterprise Contract Sentinel - Model Context Protocol (MCP) Server
File: /mcp-server/server.py

Objective:
Official Python MCP Server implementing the enterprise database tool bridge.
Exposes three secure, auditable tools to LangGraph agents:
1. get_compliance_rules(category: str) -> Queries Postgres tables containing corporate compliance rules
2. flag_contract_violation(contract_id: str, violation_details: str) -> Writes structured violation logs
3. update_contract_status(contract_id: str, status: str) -> Updates contract lifecycle & compliance status
"""

import os
import sys
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

import psycopg
from psycopg.rows import dict_row
from mcp.server.fastmcp import FastMCP

# -----------------------------------------------------------------------------
# LOGGING SETUP
# -----------------------------------------------------------------------------
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] [MCP-Server] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("mcp_server.log", mode="a", encoding="utf-8")
    ]
)
logger = logging.getLogger("EnterpriseContractSentinel.MCPServer")

# -----------------------------------------------------------------------------
# DATABASE CONNECTION CONFIGURATION
# -----------------------------------------------------------------------------
DB_HOST = os.getenv("POSTGRES_HOST", "postgres")
DB_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
DB_NAME = os.getenv("POSTGRES_DB", "sentinel_db")
DB_USER = os.getenv("POSTGRES_USER", "sentinel_admin")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "SentinelEnterpriseSecret2026")

DB_CONN_INFO = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}"

def get_db_connection() -> psycopg.Connection:
    """Creates a psycopg3 connection with dictionary row factory."""
    return psycopg.connect(DB_CONN_INFO, row_factory=dict_row)

# Fallback in-memory store for local sandbox verification if PostgreSQL daemon is disconnected
OFFLINE_MEMORY_STORE: Dict[str, Any] = {
    "compliance_rules": [
        {
            "rule_id": "RULE-LIAB-001",
            "category": "LIABILITY",
            "name": "Liability Ceiling Mandate",
            "description": "Limitation of liability cannot exceed 150% of the total annual contract value (ACV). Uncapped or 2x+ ACV liability is strictly prohibited.",
            "threshold_max_acv_multiplier": 1.5,
            "allow_uncapped": False,
            "severity": "CRITICAL"
        },
        {
            "rule_id": "RULE-GDPR-002",
            "category": "DATA_SOVEREIGNTY",
            "name": "GDPR EU/EEA Sovereign Storage & SCC Mandate",
            "description": "All EU citizen data processing agreements must explicitly name the EU/EEA or specific sovereign jurisdictions (e.g., Germany, France) as exclusive storage. Standard Contractual Clauses (SCCs) mandatory if cross-border transfer mentioned.",
            "permitted_regions": ["EU", "EEA", "Germany", "France", "Netherlands", "Ireland", "Sweden"],
            "require_sccs_for_cross_border": True,
            "severity": "CRITICAL"
        },
        {
            "rule_id": "RULE-LAW-003",
            "category": "GOVERNING_LAW",
            "name": "Delaware / New York Commercial Jurisdiction",
            "description": "The contract must be governed by the laws of the State of Delaware or the State of New York. Any jurisdiction outside USA or states with unfavorable commercial litigation rules triggers critical violation.",
            "permitted_states": ["Delaware", "New York", "DE", "NY"],
            "allow_international": False,
            "severity": "CRITICAL"
        },
        {
            "rule_id": "RULE-TERM-004",
            "category": "AUTO_RENEWAL",
            "name": "60-Day Written Notice Termination Window",
            "description": "Auto-renewal clauses must require at least a 60-day written notice period prior to the expiration date. Silent or immediate auto-renewals must be flagged.",
            "minimum_notice_days": 60,
            "allow_silent_renewal": False,
            "severity": "WARNING"
        }
    ],
    "violations": [],
    "contracts": {}
}

# -----------------------------------------------------------------------------
# FASTMCP SERVER INITIALIZATION
# -----------------------------------------------------------------------------
mcp = FastMCP(
    "Enterprise-Contract-Sentinel-MCP",
    dependencies=["psycopg", "pydantic"]
)

# -----------------------------------------------------------------------------
# TOOL 1: GET COMPLIANCE RULES
# -----------------------------------------------------------------------------
@mcp.tool()
async def get_compliance_rules(category: str = "ALL") -> str:
    """
    Queries PostgreSQL compliance_rules table for corporate compliance constraints.
    Supported categories: 'LIABILITY', 'DATA_SOVEREIGNTY', 'GOVERNING_LAW', 'AUTO_RENEWAL', or 'ALL'.
    Returns a structured JSON string of rule objects.
    """
    logger.info(f"MCP Tool Invocation: get_compliance_rules(category='{category}')")
    category_upper = category.strip().upper()

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                if category_upper == "ALL":
                    cur.execute(
                        "SELECT rule_id, category, name, description, parameters, severity FROM compliance_rules WHERE active = true ORDER BY rule_id"
                    )
                else:
                    cur.execute(
                        "SELECT rule_id, category, name, description, parameters, severity FROM compliance_rules WHERE active = true AND category = %s ORDER BY rule_id",
                        (category_upper,)
                    )
                rows = cur.fetchall()
                logger.info(f"Fetched {len(rows)} active compliance rules from PostgreSQL.")
                return json.dumps({"status": "success", "count": len(rows), "rules": rows}, default=str)
    except Exception as db_err:
        logger.warning(f"Database query failed ({db_err}). Falling back to local offline verified rule repository.")
        all_rules = OFFLINE_MEMORY_STORE["compliance_rules"]
        if category_upper == "ALL":
            selected = all_rules
        else:
            selected = [r for r in all_rules if r["category"] == category_upper]
        return json.dumps({
            "status": "success",
            "source": "offline_fallback",
            "count": len(selected),
            "rules": selected
        }, indent=2)

# -----------------------------------------------------------------------------
# TOOL 2: FLAG CONTRACT VIOLATION
# -----------------------------------------------------------------------------
@mcp.tool()
async def flag_contract_violation(contract_id: str, violation_details: str) -> str:
    """
    Writes a structured contract compliance violation log to PostgreSQL.
    violation_details must be a JSON string or descriptive text containing:
    - rule_id: ID of violated rule (e.g. RULE-LIAB-001)
    - severity: 'CRITICAL', 'HIGH', or 'WARNING'
    - clause_reference: Title or section number
    - raw_text: Extracted problematic clause
    - explanation: Why this breaches corporate rules
    - remediation: Recommended amendment
    """
    logger.info(f"MCP Tool Invocation: flag_contract_violation for contract '{contract_id}'")
    now_utc = datetime.now(timezone.utc).isoformat()

    try:
        parsed_details = json.loads(violation_details) if isinstance(violation_details, str) and violation_details.startswith("{") else {
            "explanation": violation_details
        }
    except Exception:
        parsed_details = {"explanation": violation_details}

    rule_id = parsed_details.get("rule_id", "RULE-GENERAL")
    severity = parsed_details.get("severity", "CRITICAL")
    clause_ref = parsed_details.get("clause_reference", "General Clause")
    raw_text = parsed_details.get("raw_text", "")
    explanation = parsed_details.get("explanation", violation_details)
    remediation = parsed_details.get("remediation", "Amend language to conform to corporate policy.")

    record = {
        "contract_id": contract_id,
        "rule_id": rule_id,
        "severity": severity,
        "clause_reference": clause_ref,
        "raw_text": raw_text,
        "explanation": explanation,
        "remediation": remediation,
        "logged_at": now_utc
    }

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO contract_violations
                        (contract_id, rule_id, severity, clause_reference, raw_text, explanation, remediation, created_at)
                    VALUES
                        (%s, %s, %s, %s, %s, %s, %s, NOW())
                    RETURNING id;
                    """,
                    (contract_id, rule_id, severity, clause_ref, raw_text, explanation, remediation)
                )
                row = cur.fetchone()
                conn.commit()
                violation_id = row["id"] if row else 1
                logger.info(f"Logged violation {violation_id} for contract {contract_id} in PostgreSQL.")
                return json.dumps({
                    "status": "success",
                    "violation_id": violation_id,
                    "contract_id": contract_id,
                    "severity": severity
                })
    except Exception as db_err:
        logger.warning(f"Database write failed ({db_err}). Persisting to offline memory store.")
        OFFLINE_MEMORY_STORE["violations"].append(record)
        return json.dumps({
            "status": "success",
            "source": "offline_fallback",
            "contract_id": contract_id,
            "logged_record": record
        })

# -----------------------------------------------------------------------------
# TOOL 3: UPDATE CONTRACT STATUS
# -----------------------------------------------------------------------------
@mcp.tool()
async def update_contract_status(contract_id: str, status: str) -> str:
    """
    Updates contract compliance lifecycle status in PostgreSQL.
    Allowed statuses:
    - 'PENDING_AUDIT'
    - 'AUDIT_IN_PROGRESS'
    - 'APPROVED'
    - 'FAILED_COMPLIANCE'
    - 'REQUIRES_LEGAL_ESCALATION'
    """
    logger.info(f"MCP Tool Invocation: update_contract_status('{contract_id}', '{status}')")
    valid_statuses = [
        "PENDING_AUDIT",
        "AUDIT_IN_PROGRESS",
        "APPROVED",
        "FAILED_COMPLIANCE",
        "REQUIRES_LEGAL_ESCALATION"
    ]
    status_upper = status.strip().upper()
    if status_upper not in valid_statuses:
        return json.dumps({
            "status": "error",
            "message": f"Invalid status '{status}'. Must be one of: {valid_statuses}"
        })

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE contracts
                    SET compliance_status = %s, updated_at = NOW()
                    WHERE contract_id = %s
                    RETURNING contract_id, title, compliance_status;
                    """,
                    (status_upper, contract_id)
                )
                updated = cur.fetchone()
                if not updated:
                    # Insert record if missing
                    cur.execute(
                        """
                        INSERT INTO contracts (contract_id, title, compliance_status, created_at, updated_at)
                        VALUES (%s, %s, %s, NOW(), NOW())
                        RETURNING contract_id, compliance_status;
                        """,
                        (contract_id, f"Contract {contract_id}", status_upper)
                    )
                    updated = cur.fetchone()
                conn.commit()
                logger.info(f"Updated contract {contract_id} status to '{status_upper}' in PostgreSQL.")
                return json.dumps({
                    "status": "success",
                    "contract_id": contract_id,
                    "compliance_status": status_upper,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
    except Exception as db_err:
        logger.warning(f"Database update failed ({db_err}). Storing status in offline memory store.")
        OFFLINE_MEMORY_STORE["contracts"][contract_id] = {
            "compliance_status": status_upper,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        return json.dumps({
            "status": "success",
            "source": "offline_fallback",
            "contract_id": contract_id,
            "compliance_status": status_upper
        })

# -----------------------------------------------------------------------------
# MAIN SERVER RUNNER
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Initializing Enterprise Contract Sentinel MCP Server over stdio transport...")
    mcp.run()
