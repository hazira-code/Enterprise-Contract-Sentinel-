/**
 * Enterprise Contract Sentinel - Core Legal Evaluation Engine
 * Pure logic decoupled for deterministic unit testing and browser execution.
 */

import type {
  ComplianceRule,
  ExtractedClauses,
  Violation,
  ComplianceStatus,
  ContractAuditResult,
  ContractTemplate,
  MCPLogEntry,
  TimelineEntry
} from '../types/contract.ts';

// ----------------------------------------------------------------------------
// THE FOUR GROUND TRUTH CORPORATE RULES
// ----------------------------------------------------------------------------
export const ENTERPRISE_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    rule_id: 'RULE-LIAB-001',
    category: 'LIABILITY',
    name: 'Liability Ceiling Mandate (<= 150% ACV)',
    description: 'Under no circumstances can the limitation of liability exceed 150% of the total annual contract value (ACV). Any uncapped or 2x+ ACV liability clauses must be flagged instantly.',
    severity: 'CRITICAL',
    parameters: {
      max_acv_multiplier: 1.5,
      allow_uncapped: false
    },
    active: true
  },
  {
    rule_id: 'RULE-GDPR-002',
    category: 'DATA_SOVEREIGNTY',
    name: 'GDPR & Sovereign Data Storage Mandate',
    description: 'All EU citizen data processing agreements must explicitly name the EU/EEA or specific sovereign jurisdictions (e.g., Germany, France) as the exclusive data storage region. Standard Contractual Clauses (SCCs) must be present if cross-border transfer is mentioned.',
    severity: 'CRITICAL',
    parameters: {
      permitted_regions: ['EU', 'EEA', 'Germany', 'France', 'Netherlands', 'Ireland', 'Sweden'],
      require_sccs_for_cross_border: true
    },
    active: true
  },
  {
    rule_id: 'RULE-LAW-003',
    category: 'GOVERNING_LAW',
    name: 'Delaware / New York Commercial Jurisdiction',
    description: 'The contract must be governed by the laws of the State of Delaware or the State of New York. Any jurisdiction outside the USA, or states with unfavorable commercial litigation rules, must trigger a critical violation.',
    severity: 'CRITICAL',
    parameters: {
      permitted_jurisdictions: ['State of Delaware', 'Delaware', 'State of New York', 'New York'],
      allow_international: false
    },
    active: true
  },
  {
    rule_id: 'RULE-TERM-004',
    category: 'AUTO_RENEWAL',
    name: 'Auto-Renewal 60-Day Notice Window',
    description: 'Auto-renewal clauses must require at least a 60-day written notice period prior to the expiration date. Silent or immediate auto-renewals must be flagged.',
    severity: 'WARNING',
    parameters: {
      min_notice_days: 60,
      allow_silent_renewal: false
    },
    active: true
  }
];

// ----------------------------------------------------------------------------
// SEED ENTERPRISE CONTRACT TEMPLATES
// ----------------------------------------------------------------------------
export const SAMPLE_CONTRACTS: ContractTemplate[] = [
  {
    id: 'CTR-APEX-2026',
    title: 'Apex Global Master SaaS Agreement (Severe Violations)',
    counterparty: 'Apex Global Tech Ltd',
    acv_usd: 250000,
    expectedStatus: 'FAILED_COMPLIANCE',
    description: 'Features 250% ACV liability cap, Singapore data transfer without SCCs, London UK governing law, and 30-day auto-renewal notice.',
    raw_text: `MASTER SERVICES AGREEMENT (MSA)
Reference ID: MSA-2026-AG-8812
Effective Date: January 1, 2026
Between: Enterprise Client Corp ("Customer") and Apex Global Tech Ltd ("Vendor")
Annual Contract Value (ACV): $250,000.00 USD

SECTION 1. SCOPE OF SERVICES
Vendor shall provide Customer with enterprise cloud data aggregation and workflow software as further described in Exhibit A.

SECTION 4. TERM AND RENEWAL
This Agreement shall commence on the Effective Date and remain in effect for an initial period of twelve (12) months. Thereafter, this Agreement shall automatically renew for successive one-year periods unless either party provides written notice of non-renewal at least thirty (30) days prior to the expiration of the then-current term.

SECTION 9. LIMITATION OF LIABILITY
IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT, WHETHER IN CONTRACT, TORT, OR UNDER ANY OTHER THEORY OF LIABILITY, EXCEED TWO HUNDRED AND FIFTY PERCENT (250%) OF THE TOTAL ANNUAL CONTRACT VALUE (ACV) PAID OR PAYABLE BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE INCIDENT GIVING RISE TO LIABILITY.

SECTION 14. DATA PROTECTION & PRIVACY
Vendor shall process Customer Personal Data in accordance with Vendor's Global Processing Policy. Customer acknowledges and agrees that Customer Personal Data may be processed and stored in Vendor's primary cloud infrastructure located in Singapore and Malaysia. The parties expressly agree that Standard Contractual Clauses (SCCs) are not executed, as Vendor maintains internal company binding protocols.

SECTION 18. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by, and construed in accordance with, the laws of England and Wales, without regard to its conflict of law provisions. Any dispute, claim, or controversy arising out of this Agreement shall be referred to and finally resolved by the High Court of Justice in London, United Kingdom.`
  },
  {
    id: 'CTR-NORTH-2026',
    title: 'NorthStar Cloud Infrastructure Agreement (Fully Compliant)',
    counterparty: 'NorthStar Systems Inc',
    acv_usd: 500000,
    expectedStatus: 'APPROVED',
    description: 'Adheres to 100% ACV liability ceiling, exclusive Frankfurt EU sovereign storage with executed SCCs, Delaware Court of Chancery jurisdiction, and 90-day renewal notice.',
    raw_text: `ENTERPRISE INFRASTRUCTURE SUBSCRIPTION AGREEMENT
Reference ID: EISA-2026-NS-1049
Effective Date: March 15, 2026
Between: Enterprise Client Corp ("Customer") and NorthStar Systems Inc ("Provider")
Annual Contract Value (ACV): $500,000.00 USD

ARTICLE 1. ENGAGEMENT AND SERVICES
Provider agrees to deliver managed enterprise cloud hosting, distributed compute clusters, and telemetry services.

ARTICLE 3. TERM AND TERMINATION
The initial term of this Agreement is three (3) years. The Agreement shall automatically renew for additional one-year periods unless either party delivers written notice of termination at least ninety (90) days prior to the expiration date.

ARTICLE 8. LIMITATION OF LIABILITY
THE TOTAL AGGREGATE LIABILITY OF PROVIDER FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL STRICTLY BE CAPPED AT ONE HUNDRED PERCENT (100%) OF THE TOTAL FEES (ACV) PAID BY CUSTOMER UNDER THIS AGREEMENT DURING THE TWELVE (12) MONTHS PRECEDING THE DATE ON WHICH THE LIABILITY AROSE.

ARTICLE 12. DATA SOVEREIGNTY AND GDPR COMPLIANCE
All Personal Data of European Union citizens collected, processed, or stored under this Agreement shall be stored exclusively in data centers located within Frankfurt, Germany (EU). Provider shall not transfer any personal data outside the European Economic Area (EEA). The parties have executed the European Commission Standard Contractual Clauses (EU 2021/914) attached hereto as Exhibit B.

ARTICLE 17. GOVERNING LAW AND VENUE
This Agreement shall be governed by and interpreted in accordance with the substantive laws of the State of Delaware, USA, without giving effect to any choice of law rules. The parties submit to the exclusive jurisdiction and venue of the Court of Chancery of Delaware located in Wilmington, Delaware.`
  },
  {
    id: 'CTR-FINCORP-2026',
    title: 'FinCorp Data Processing Addendum (GDPR & Liability Breach)',
    counterparty: 'FinCorp Analytics AG',
    acv_usd: 180000,
    expectedStatus: 'FAILED_COMPLIANCE',
    description: 'Contains uncapped direct liability, unclarified multi-tenant storage across North America without SCCs, New York governing law, and silent auto-renewal.',
    raw_text: `DATA PROCESSING ADDENDUM & COMMERCIAL AGREEMENT
Reference ID: DPA-2026-FC-339
Effective Date: June 1, 2026
Between: Enterprise Client Corp ("Customer") and FinCorp Analytics AG ("Vendor")
Annual Contract Value (ACV): $180,000.00 USD

CLAUSE 2. TERM AND RENEWAL
The term shall commence on the Effective Date. This agreement renews silently upon the expiration of each calendar year with no written notice requirement unless explicitly terminated by mutual written consent.

CLAUSE 7. LIMITATION OF LIABILITY
NEITHER PARTY SHALL HAVE ANY CEILING OR CAP ON DIRECT DAMAGES RESULTING FROM A BREACH OF CONFIDENTIALITY, SYSTEM AVAILABILITY, OR SERVICE LEVEL AGREEMENTS (UNLIMITED LIABILITY). VENDOR DISCLAIMS ALL INCIDENTAL AND CONSEQUENTIAL DAMAGES.

CLAUSE 11. DATA STORAGE AND TRANSFERS
Customer acknowledges that analytics data and customer records will be hosted across multi-tenant regions in North America and Western Europe, with transfers executed without formal Standard Contractual Clauses due to internal company policies.

CLAUSE 19. GOVERNING LAW
This Addendum and any dispute arising out of or related to it shall be governed by and construed under the laws of the State of New York, USA. The parties submit to the jurisdiction of the commercial courts sitting in the Borough of Manhattan, New York.`
  }
];

// ----------------------------------------------------------------------------
// NODE 1: THE READER - PURE CLAUSE EXTRACTION LOGIC
// ----------------------------------------------------------------------------
export function extractContractClauses(rawText: string, acvUsd: number): ExtractedClauses {
  // 1. Liability extraction
  const isUncapped = /(?:uncapped|unlimited liability|no ceiling or cap|without limitation|neither party shall have any ceiling)/i.test(rawText);
  let capPercentage: number | null = 100;
  let liabRaw = '';

  if (isUncapped) {
    capPercentage = null;
    const uncappedMatch = rawText.match(/([^.\n]*?(?:uncapped|unlimited liability|no ceiling|without limitation|neither party shall have any ceiling)[^.\n]*)/i);
    liabRaw = uncappedMatch ? uncappedMatch[0].trim() : 'Unlimited liability detected (no ceiling).';
  } else {
    const percentMatch = rawText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s*(?:the\s*)?(?:total\s*)?(?:Annual Contract Value|ACV|fees))/i);
    const wordsPercentMatch = rawText.match(/(two hundred(?:\s+and\s+fifty)?|one hundred(?:\s+and\s+fifty)?|three hundred)\s*percent\s*\(([\d]+)%\)/i);
    const multiplierMatch = rawText.match(/(\d+(?:\.\d+)?)\s*x\s*(?:the\s*)?(?:Annual Contract Value|ACV|fees)/i);

    if (percentMatch) {
      capPercentage = parseFloat(percentMatch[1]);
      const snippetMatch = rawText.match(new RegExp(`([^.\\n]*?${percentMatch[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.\\n]*)`, 'i'));
      liabRaw = snippetMatch ? snippetMatch[0].trim() : percentMatch[0];
    } else if (wordsPercentMatch) {
      capPercentage = parseFloat(wordsPercentMatch[2]);
      liabRaw = wordsPercentMatch[0];
    } else if (multiplierMatch) {
      capPercentage = parseFloat(multiplierMatch[1]) * 100;
      liabRaw = multiplierMatch[0];
    } else {
      const sectionMatch = rawText.match(/(?:SECTION|ARTICLE|CLAUSE)?\s*\d*\.?\s*LIMITATION OF LIABILITY[:.]?\s*([^\n]+(?:\n[^\n]+){1,3})/i);
      liabRaw = sectionMatch ? sectionMatch[0].trim() : 'Standard liability terms detected.';
    }
  }

  // 2. Data Sovereignty extraction
  const sccNegation = /(?:not executed|no standard contractual clauses|without formal standard contractual clauses|not deemed necessary|are not executed)/i.test(rawText);
  const sccsMentioned = /(?:Standard Contractual Clauses|SCCs|EU 2021\/914|standard data protection clauses)/i.test(rawText);
  const sccsPresent = sccsMentioned && !sccNegation;

  const regions: string[] = [];
  const candidateRegions = ['Frankfurt', 'Germany', 'France', 'EU', 'EEA', 'Singapore', 'Malaysia', 'United States', 'North America', 'United Kingdom', 'Japan', 'India'];
  for (const reg of candidateRegions) {
    if (new RegExp(`\\b${reg}\\b`, 'i').test(rawText)) {
      regions.push(reg);
    }
  }
  const euExclusive = /stored exclusively in.*?(?:EU|EEA|Frankfurt|Germany|France)/i.test(rawText);
  const dataSnippetMatch = rawText.match(/(?:SECTION|ARTICLE|CLAUSE)?\s*\d*\.?\s*(?:DATA PROTECTION|PRIVACY|DATA SOVEREIGNTY|GDPR)[:.]?\s*([^\n]+(?:\n[^\n]+){1,3})/i);
  const dataRaw = dataSnippetMatch ? dataSnippetMatch[0].trim() : `Data processed across: ${regions.join(', ') || 'unspecified'}`;

  // 3. Governing Law extraction
  let jurisdiction = 'Unknown';
  let seat = 'Unknown';
  if (/\b(?:Delaware|DE)\b/i.test(rawText)) {
    jurisdiction = 'State of Delaware';
    seat = 'Court of Chancery of Delaware';
  } else if (/\b(?:New York|NY)\b/i.test(rawText)) {
    jurisdiction = 'State of New York';
    seat = 'Borough of Manhattan, New York';
  } else if (/\b(?:England|Wales|London|United Kingdom|English Law)\b/i.test(rawText)) {
    jurisdiction = 'England and Wales';
    seat = 'High Court of Justice in London, United Kingdom';
  } else if (/\b(?:California|Texas|Florida|Illinois)\b/i.test(rawText)) {
    const stateMatch = rawText.match(/\b(California|Texas|Florida|Illinois)\b/i);
    jurisdiction = stateMatch ? `State of ${stateMatch[1]}` : 'Other US State';
    seat = `${jurisdiction} Courts`;
  }
  const lawSnippetMatch = rawText.match(/(?:SECTION|ARTICLE|CLAUSE)?\s*\d*\.?\s*(?:GOVERNING LAW|JURISDICTION|APPLICABLE LAW)[:.]?\s*([^\n]+(?:\n[^\n]+){1,2})/i);
  const lawRaw = lawSnippetMatch ? lawSnippetMatch[0].trim() : `Governing law: ${jurisdiction}`;

  // 4. Auto-Renewal extraction
  const isSilent = /renews? silently|silent renewal|no written notice requirement/i.test(rawText);
  let noticeDays = 30;
  if (isSilent) {
    noticeDays = 0;
  } else {
    // Support "at least thirty (30) days", "(90) days", "60 calendar days", etc.
    const daysMatch = rawText.match(/(?:\((\d+)\)|\b(\d+)\b)\s*(?:calendar\s*)?days?\s*(?:prior|advance|written\s*notice)?/i);
    if (daysMatch) {
      const parsed = daysMatch[1] || daysMatch[2];
      if (parsed) {
        noticeDays = parseInt(parsed, 10);
      }
    }
  }
  const renewalSnippetMatch = rawText.match(/(?:SECTION|ARTICLE|CLAUSE)?\s*\d*\.?\s*(?:TERM AND RENEWAL|TERMINATION|RENEWAL)[:.]?\s*([^\n]+(?:\n[^\n]+){1,2})/i);
  const renewalRaw = isSilent
    ? 'Silent automatic renewal with no advance written notice requirement.'
    : renewalSnippetMatch
      ? renewalSnippetMatch[0].trim()
      : `Renewal notice window of ${noticeDays} days.`;

  return {
    liability: {
      raw_text: liabRaw,
      cap_percentage_acv: capPercentage,
      is_uncapped: isUncapped,
      dollar_cap: capPercentage ? Math.round(acvUsd * (capPercentage / 100)) : null
    },
    data_sovereignty: {
      raw_text: dataRaw,
      storage_regions: regions,
      sccs_present: sccsPresent,
      eu_exclusive: euExclusive
    },
    governing_law: {
      raw_text: lawRaw,
      governing_jurisdiction: jurisdiction,
      court_seat: seat
    },
    auto_renewal: {
      raw_text: renewalRaw,
      notice_window_days: noticeDays,
      is_silent: isSilent
    }
  };
}

// ----------------------------------------------------------------------------
// NODE 2: THE AUDITOR - PURE COMPLIANCE EVALUATION LOGIC
// ----------------------------------------------------------------------------
export function evaluateContractCompliance(
  clauses: ExtractedClauses,
  rules: ComplianceRule[] = ENTERPRISE_COMPLIANCE_RULES,
  acvUsd: number = 250000
): { violations: Violation[]; status: ComplianceStatus } {
  const violations: Violation[] = [];

  // RULE 1: LIABILITY CEILING (<= 150% ACV)
  const liab = clauses.liability;
  if (liab.is_uncapped) {
    violations.push({
      rule_id: 'RULE-LIAB-001',
      severity: 'CRITICAL',
      clause_reference: 'Limitation of Liability',
      raw_text: liab.raw_text,
      explanation: 'CRITICAL: Liability is completely uncapped. Enterprise policy strictly prohibits unlimited liability exposure.',
      remediation: `Impose an express aggregate liability cap not to exceed 150% of the Annual Contract Value ($${Math.round(acvUsd * 1.5).toLocaleString()}).`
    });
  } else if (liab.cap_percentage_acv !== null && liab.cap_percentage_acv > 150) {
    const dollarExposure = Math.round(acvUsd * (liab.cap_percentage_acv / 100));
    const ceilingDollar = Math.round(acvUsd * 1.5);
    violations.push({
      rule_id: 'RULE-LIAB-001',
      severity: 'CRITICAL',
      clause_reference: 'Limitation of Liability',
      raw_text: liab.raw_text,
      explanation: `CRITICAL: Liability is ${liab.cap_percentage_acv}% of ACV ($${dollarExposure.toLocaleString()}), exceeding the mandatory 150% corporate ceiling ($${ceilingDollar.toLocaleString()}).`,
      remediation: `Amend Section to reduce liability ceiling to 100%-150% of ACV ($${ceilingDollar.toLocaleString()}).`
    });
  }

  // RULE 2: GDPR & DATA SOVEREIGNTY
  const data = clauses.data_sovereignty;
  const nonEuRegions = data.storage_regions.filter((r) =>
    ['Singapore', 'Malaysia', 'United States', 'North America', 'India', 'Japan'].includes(r)
  );

  if (nonEuRegions.length > 0 && !data.sccs_present) {
    violations.push({
      rule_id: 'RULE-GDPR-002',
      severity: 'CRITICAL',
      clause_reference: 'Data Protection & Sovereignty',
      raw_text: data.raw_text,
      explanation: `NON-COMPLIANT: EU personal data processing outside EU/EEA in [${nonEuRegions.join(', ')}] without executed Standard Contractual Clauses (SCCs).`,
      remediation: 'Restrict data storage exclusively to EU/EEA (e.g. Frankfurt, Germany) or formally execute and attach the EU 2021/914 Standard Contractual Clauses.'
    });
  } else if (!data.eu_exclusive && !data.sccs_present && data.storage_regions.length === 0) {
    violations.push({
      rule_id: 'RULE-GDPR-002',
      severity: 'HIGH',
      clause_reference: 'Data Protection & Sovereignty',
      raw_text: data.raw_text,
      explanation: 'HIGH RISK: Ambiguous data storage region without explicit EU sovereignty guarantees or SCC commitments.',
      remediation: 'Designate exclusive EU/EEA storage locations or append Standard Contractual Clauses (SCCs).'
    });
  }

  // RULE 3: GOVERNING LAW & JURISDICTION (Delaware or NY)
  const law = clauses.governing_law;
  const permitted = ['State of Delaware', 'Delaware', 'State of New York', 'New York'];
  const isPermitted = permitted.some((p) => law.governing_jurisdiction.toLowerCase().includes(p.toLowerCase()));

  if (!isPermitted) {
    violations.push({
      rule_id: 'RULE-LAW-003',
      severity: 'CRITICAL',
      clause_reference: 'Governing Law & Jurisdiction',
      raw_text: law.raw_text,
      explanation: `NON-COMPLIANT: Governing Law listed as '${law.governing_jurisdiction}'. Corporate compliance mandates exclusive jurisdiction in the State of Delaware or the State of New York.`,
      remediation: 'Revise Governing Law to Delaware (Court of Chancery) or New York State commercial courts.'
    });
  }

  // RULE 4: AUTO-RENEWAL / TERMINATION NOTICE (>= 60 Days)
  const renewal = clauses.auto_renewal;
  if (renewal.is_silent) {
    violations.push({
      rule_id: 'RULE-TERM-004',
      severity: 'CRITICAL',
      clause_reference: 'Term and Renewal',
      raw_text: renewal.raw_text,
      explanation: 'CRITICAL: Contract features silent auto-renewal with 0 days written notice requirement, trapping enterprise in perpetual renewal.',
      remediation: 'Replace silent renewal with explicit requirement of at least sixty (60) days prior written notice.'
    });
  } else if (renewal.notice_window_days < 60) {
    violations.push({
      rule_id: 'RULE-TERM-004',
      severity: 'WARNING',
      clause_reference: 'Term and Renewal',
      raw_text: renewal.raw_text,
      explanation: `WARNING: Auto-renewal notice window is ${renewal.notice_window_days} days. Corporate rule mandates a minimum 60-day written notice window.`,
      remediation: `Increase non-renewal notification period from ${renewal.notice_window_days} days to a minimum of sixty (60) days prior written notice.`
    });
  }

  // Determine overall status
  const hasCritical = violations.some((v) => v.severity === 'CRITICAL');
  const hasHigh = violations.some((v) => v.severity === 'HIGH');

  let status: ComplianceStatus = 'APPROVED';
  if (hasCritical || hasHigh) {
    status = 'FAILED_COMPLIANCE';
  } else if (violations.length > 0) {
    status = 'REQUIRES_LEGAL_ESCALATION';
  }

  return { violations, status };
}

// ----------------------------------------------------------------------------
// FULL LANGGRAPH MULTI-AGENT WORKFLOW SIMULATION WITH STEPWISE REPORTING
// ----------------------------------------------------------------------------
export async function executeContractAuditWorkflow(
  contract: {
    contract_id: string;
    title: string;
    counterparty?: string;
    raw_text: string;
    acv_usd: number;
  },
  rules: ComplianceRule[] = ENTERPRISE_COMPLIANCE_RULES,
  onStepProgress?: (step: 'reader' | 'auditor' | 'writer', stateData: Partial<ContractAuditResult>) => void
): Promise<ContractAuditResult> {
  const timeline: TimelineEntry[] = [];
  const mcpLogs: MCPLogEntry[] = [];

  // Step 1: Initializing
  timeline.push({
    node: 'init',
    title: 'Audit Workflow Initialized',
    description: `Target: ${contract.title} (ACV: $${contract.acv_usd.toLocaleString()})`,
    timestamp: new Date().toISOString()
  });

  // Step 2: Node 1 - The Reader
  if (onStepProgress) {
    onStepProgress('reader', { timeline });
  }
  await new Promise((resolve) => setTimeout(resolve, 350));

  const extracted = extractContractClauses(contract.raw_text, contract.acv_usd);
  timeline.push({
    node: 'reader',
    title: 'Node 1: The Reader Completed',
    description: `Extracted 4 key clauses: Liability (${extracted.liability.is_uncapped ? 'Uncapped' : extracted.liability.cap_percentage_acv + '% ACV'}), Sovereignty (${extracted.data_sovereignty.storage_regions.join(', ') || 'N/A'}), Law (${extracted.governing_law.governing_jurisdiction}), Renewal (${extracted.auto_renewal.notice_window_days}d)`,
    timestamp: new Date().toISOString()
  });

  // Step 3: Node 2 - The Auditor
  if (onStepProgress) {
    onStepProgress('auditor', { extracted_clauses: extracted, timeline });
  }
  await new Promise((resolve) => setTimeout(resolve, 400));

  mcpLogs.push({
    tool: 'get_compliance_rules',
    action: 'Retrieved 4 active compliance mandates from PostgreSQL via MCP tool',
    payload: { category: 'ALL', count: rules.length },
    timestamp: new Date().toISOString(),
    status: 'success'
  });

  const { violations, status } = evaluateContractCompliance(extracted, rules, contract.acv_usd);
  timeline.push({
    node: 'auditor',
    title: 'Node 2: The Auditor Completed',
    description: `Evaluated clauses against 4 rules. Flagged ${violations.length} violations (${violations.filter((v) => v.severity === 'CRITICAL').length} Critical). Status: ${status}`,
    timestamp: new Date().toISOString()
  });

  // Step 4: Node 3 - The Writer
  if (onStepProgress) {
    onStepProgress('writer', {
      extracted_clauses: extracted,
      violations,
      audit_status: status,
      timeline,
      mcp_logs: mcpLogs
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 350));

  for (const v of violations) {
    mcpLogs.push({
      tool: 'flag_contract_violation',
      action: `Logged ${v.severity} violation for ${v.clause_reference} to PostgreSQL`,
      payload: { rule_id: v.rule_id, severity: v.severity, remediation: v.remediation },
      timestamp: new Date().toISOString(),
      status: v.severity === 'CRITICAL' ? 'warning' : 'success'
    });
  }

  mcpLogs.push({
    tool: 'update_contract_status',
    action: `Updated contract lifecycle status in database to '${status}'`,
    payload: { contract_id: contract.contract_id, compliance_status: status },
    timestamp: new Date().toISOString(),
    status: 'success'
  });

  timeline.push({
    node: 'writer',
    title: 'Node 3: The Writer Completed',
    description: `Persisted ${violations.length} structured violation logs and finalized state to '${status}' via MCP bridge.`,
    timestamp: new Date().toISOString()
  });

  return {
    contract_id: contract.contract_id,
    title: contract.title,
    counterparty: contract.counterparty,
    acv_usd: contract.acv_usd,
    raw_text: contract.raw_text,
    audit_status: status,
    extracted_clauses: extracted,
    violations,
    mcp_logs: mcpLogs,
    timeline,
    completed_at: new Date().toISOString()
  };
}
