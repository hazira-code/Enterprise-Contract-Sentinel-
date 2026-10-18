-- ============================================================================
-- Enterprise Contract Sentinel - PostgreSQL Database Initialization Script
-- File: /docker/init.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. CONTRACTS TABLE
-- Tracks audited enterprise agreements and lifecycle compliance status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
    contract_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    counterparty VARCHAR(255) DEFAULT 'Unspecified Counterparty',
    acv_usd NUMERIC(15, 2) DEFAULT 0.00,
    compliance_status VARCHAR(64) NOT NULL DEFAULT 'PENDING_AUDIT',
    effective_date DATE,
    expiration_date DATE,
    raw_document_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. COMPLIANCE RULES TABLE (THE GROUND TRUTH REPOSITORY)
-- Injects the four non-negotiable enterprise compliance mandates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_rules (
    rule_id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity VARCHAR(32) NOT NULL DEFAULT 'CRITICAL',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. CONTRACT VIOLATIONS TABLE
-- Structured logs written by the Writer agent via MCP server
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contract_violations (
    id SERIAL PRIMARY KEY,
    contract_id VARCHAR(64) NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
    rule_id VARCHAR(64) NOT NULL REFERENCES compliance_rules(rule_id),
    severity VARCHAR(32) NOT NULL,
    clause_reference VARCHAR(255) NOT NULL,
    raw_text TEXT NOT NULL,
    explanation TEXT NOT NULL,
    remediation TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 4. CLAUSES EXTRACTED TABLE
-- Stores intermediate structured extractions emitted by Node 1 (The Reader)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clauses_extracted (
    id SERIAL PRIMARY KEY,
    contract_id VARCHAR(64) NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
    clause_type VARCHAR(64) NOT NULL,
    raw_snippet TEXT NOT NULL,
    parsed_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score NUMERIC(5, 4) DEFAULT 1.0000,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. AUDIT LOGS TABLE
-- Traceability for all multi-agent node executions and MCP tool calls
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id VARCHAR(64) NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
    agent_node VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(compliance_status);
CREATE INDEX IF NOT EXISTS idx_violations_contract_id ON contract_violations(contract_id);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON contract_violations(severity);
CREATE INDEX IF NOT EXISTS idx_clauses_contract_type ON clauses_extracted(contract_id, clause_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_contract ON audit_logs(contract_id);

-- ----------------------------------------------------------------------------
-- SEED DATA: THE FOUR GROUND TRUTH CORPORATE RULES
-- ----------------------------------------------------------------------------
INSERT INTO compliance_rules (rule_id, category, name, description, parameters, severity, active)
VALUES
    (
        'RULE-LIAB-001',
        'LIABILITY',
        'Liability Ceiling Mandate (<= 150% ACV)',
        'Under no circumstances can the limitation of liability exceed 150% of the total annual contract value (ACV). Any uncapped or 2x+ ACV liability clauses must be flagged instantly.',
        '{"max_acv_multiplier": 1.5, "allow_uncapped": false}'::jsonb,
        'CRITICAL',
        TRUE
    ),
    (
        'RULE-GDPR-002',
        'DATA_SOVEREIGNTY',
        'GDPR & Data Sovereignty Mandate',
        'All EU citizen data processing agreements must explicitly name the EU/EEA or specific sovereign jurisdictions (e.g., Germany, France) as the exclusive data storage region. Standard Contractual Clauses (SCCs) must be present if cross-border transfer is mentioned.',
        '{"permitted_regions": ["EU", "EEA", "Germany", "France", "Netherlands", "Ireland", "Sweden"], "require_sccs_for_cross_border": true}'::jsonb,
        'CRITICAL',
        TRUE
    ),
    (
        'RULE-LAW-003',
        'GOVERNING_LAW',
        'Governing Law & Delaware/NY Jurisdiction',
        'The contract must be governed by the laws of the State of Delaware or the State of New York. Any jurisdiction outside the USA, or states with unfavorable commercial litigation rules, must trigger a critical violation.',
        '{"permitted_jurisdictions": ["State of Delaware", "Delaware", "State of New York", "New York"], "allow_international": false}'::jsonb,
        'CRITICAL',
        TRUE
    ),
    (
        'RULE-TERM-004',
        'AUTO_RENEWAL',
        'Auto-Renewal Minimum Notice Window (>= 60 Days)',
        'Auto-renewal clauses must require at least a 60-day written notice period prior to the expiration date. Silent or immediate auto-renewals must be flagged.',
        '{"min_notice_days": 60, "allow_silent_renewal": false}'::jsonb,
        'WARNING',
        TRUE
    )
ON CONFLICT (rule_id) DO UPDATE SET
    parameters = EXCLUDED.parameters,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- SEED DATA: SAMPLE CONTRACTS FOR IMMEDIATE SYSTEM DEMONSTRATION
-- ----------------------------------------------------------------------------
INSERT INTO contracts (contract_id, title, counterparty, acv_usd, compliance_status, effective_date, expiration_date)
VALUES
    ('CTR-APEX-2026', 'Apex Global Master SaaS Agreement (Violations Present)', 'Apex Global Tech Ltd', 250000.00, 'FAILED_COMPLIANCE', '2026-01-01', '2027-01-01'),
    ('CTR-NORTH-2026', 'NorthStar Cloud Infrastructure Agreement (Compliant)', 'NorthStar Systems Inc', 500000.00, 'APPROVED', '2026-03-15', '2029-03-15'),
    ('CTR-FINCORP-2026', 'FinCorp Data Processing Addendum (GDPR & Liability Breach)', 'FinCorp Analytics AG', 180000.00, 'FAILED_COMPLIANCE', '2026-06-01', '2027-06-01')
ON CONFLICT (contract_id) DO NOTHING;

-- Seed violations for Apex Global contract
INSERT INTO contract_violations (contract_id, rule_id, severity, clause_reference, raw_text, explanation, remediation)
VALUES
    (
        'CTR-APEX-2026',
        'RULE-LIAB-001',
        'CRITICAL',
        'Section 9 (Limitation of Liability)',
        'In no event shall either party''s aggregate liability exceed two hundred and fifty percent (250%) of the total Annual Contract Value (ACV).',
        'CRITICAL: Liability is 250% of ACV ($625,000), which exceeds the 150% corporate ceiling ($375,000).',
        'Amend Section 9 to reduce the aggregate liability ceiling to 100%-150% of ACV.'
    ),
    (
        'CTR-APEX-2026',
        'RULE-GDPR-002',
        'CRITICAL',
        'Section 14 (Data Protection & Privacy)',
        'Customer Personal Data may be processed and stored in Vendor''s primary cloud infrastructure located in Singapore and Malaysia.',
        'NON-COMPLIANT: EU personal data processing outside EU/EEA in [Singapore, Malaysia] without executed Standard Contractual Clauses (SCCs).',
        'Restrict data storage exclusively to EU/EEA (e.g., Frankfurt, Germany) or incorporate and execute the EU 2021/914 Standard Contractual Clauses.'
    ),
    (
        'CTR-APEX-2026',
        'RULE-LAW-003',
        'CRITICAL',
        'Section 18 (Governing Law)',
        'This Agreement shall be governed by the laws of England and Wales. High Court of Justice in London, UK.',
        'NON-COMPLIANT: Governing Law listed as England and Wales. Corporate compliance mandates exclusive jurisdiction in the State of Delaware or State of New York.',
        'Amend Governing Law to the State of Delaware (Court of Chancery) or the State of New York.'
    ),
    (
        'CTR-APEX-2026',
        'RULE-TERM-004',
        'WARNING',
        'Section 4 (Term and Renewal)',
        'Automatically renews unless written notice of non-renewal is provided at least thirty (30) days prior.',
        'WARNING: Auto-renewal notice window is 30 days. Corporate policy mandates at least 60 days written notice.',
        'Increase notice period from 30 days to at least sixty (60) days prior written notice.'
    )
ON CONFLICT DO NOTHING;
