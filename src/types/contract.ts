export type Severity = 'CRITICAL' | 'HIGH' | 'WARNING';

export type ComplianceStatus = 'APPROVED' | 'FAILED_COMPLIANCE' | 'PENDING_AUDIT' | 'REQUIRES_LEGAL_ESCALATION';

export type RuleCategory = 'LIABILITY' | 'DATA_SOVEREIGNTY' | 'GOVERNING_LAW' | 'AUTO_RENEWAL';

export interface ComplianceRule {
  rule_id: string;
  category: RuleCategory;
  name: string;
  description: string;
  severity: Severity;
  parameters: {
    max_acv_multiplier?: number;
    allow_uncapped?: boolean;
    permitted_regions?: string[];
    require_sccs_for_cross_border?: boolean;
    permitted_jurisdictions?: string[];
    allow_international?: boolean;
    min_notice_days?: number;
    allow_silent_renewal?: boolean;
  };
  active: boolean;
}

export interface LiabilityClause {
  raw_text: string;
  cap_percentage_acv: number | null;
  is_uncapped: boolean;
  dollar_cap?: number | null;
}

export interface DataSovereigntyClause {
  raw_text: string;
  storage_regions: string[];
  sccs_present: boolean;
  eu_exclusive: boolean;
}

export interface GoverningLawClause {
  raw_text: string;
  governing_jurisdiction: string;
  court_seat: string;
}

export interface AutoRenewalClause {
  raw_text: string;
  notice_window_days: number;
  is_silent: boolean;
}

export interface ExtractedClauses {
  liability: LiabilityClause;
  data_sovereignty: DataSovereigntyClause;
  governing_law: GoverningLawClause;
  auto_renewal: AutoRenewalClause;
}

export interface Violation {
  rule_id: string;
  severity: Severity;
  clause_reference: string;
  raw_text: string;
  explanation: string;
  remediation: string;
}

export interface MCPLogEntry {
  tool: 'get_compliance_rules' | 'flag_contract_violation' | 'update_contract_status';
  action: string;
  payload?: Record<string, unknown>;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export interface TimelineEntry {
  node: 'reader' | 'auditor' | 'writer' | 'init';
  title: string;
  description: string;
  timestamp: string;
}

export interface ContractAuditResult {
  contract_id: string;
  title: string;
  counterparty?: string;
  acv_usd: number;
  raw_text: string;
  audit_status: ComplianceStatus;
  extracted_clauses: ExtractedClauses;
  violations: Violation[];
  mcp_logs: MCPLogEntry[];
  timeline: TimelineEntry[];
  completed_at: string;
}

export interface ContractTemplate {
  id: string;
  title: string;
  counterparty: string;
  acv_usd: number;
  description: string;
  expectedStatus: ComplianceStatus;
  raw_text: string;
}
