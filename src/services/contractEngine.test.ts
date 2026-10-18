/**
 * Fast-feedback unit tests for Enterprise Contract Sentinel
 * Uses Node's built-in test runner (node:test) and node:assert/strict
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractContractClauses,
  evaluateContractCompliance,
  ENTERPRISE_COMPLIANCE_RULES,
  SAMPLE_CONTRACTS
} from './contractEngine.ts';

// ----------------------------------------------------------------------------
// RULE 1: LIABILITY CEILING TESTS (<= 150% ACV)
// ----------------------------------------------------------------------------
test('Rule 1: Flags liability cap exceeding 150% ACV (250% ACV)', () => {
  const sampleText = `
    SECTION 9. LIMITATION OF LIABILITY.
    Neither party's aggregate liability shall exceed two hundred and fifty percent (250%) of the total Annual Contract Value (ACV).
  `;
  const clauses = extractContractClauses(sampleText, 250000);
  assert.equal(clauses.liability.cap_percentage_acv, 250);
  assert.equal(clauses.liability.is_uncapped, false);

  const { violations, status } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 250000);
  const liabViolation = violations.find((v) => v.rule_id === 'RULE-LIAB-001');

  assert.ok(liabViolation, 'Must flag Rule 1 violation for 250% ACV liability');
  assert.equal(liabViolation.severity, 'CRITICAL');
  assert.match(liabViolation.explanation, /250.*exceeding the mandatory 150%/);
  assert.equal(status, 'FAILED_COMPLIANCE');
});

test('Rule 1: Flags completely uncapped liability clauses', () => {
  const sampleText = `
    CLAUSE 7. LIMITATION OF LIABILITY.
    NEITHER PARTY SHALL HAVE ANY CEILING OR CAP ON DIRECT DAMAGES (UNLIMITED LIABILITY).
  `;
  const clauses = extractContractClauses(sampleText, 100000);
  assert.equal(clauses.liability.is_uncapped, true);

  const { violations, status } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 100000);
  const liabViolation = violations.find((v) => v.rule_id === 'RULE-LIAB-001');

  assert.ok(liabViolation, 'Must flag Rule 1 violation for uncapped liability');
  assert.equal(liabViolation.severity, 'CRITICAL');
  assert.match(liabViolation.explanation, /completely uncapped/);
});

test('Rule 1: Approves liability caps within 150% ACV (e.g., 100% ACV)', () => {
  const sampleText = `
    ARTICLE 8. LIMITATION OF LIABILITY.
    The total aggregate liability of Provider shall strictly be capped at one hundred percent (100%) of the total fees (ACV).
  `;
  const clauses = extractContractClauses(sampleText, 500000);
  assert.equal(clauses.liability.cap_percentage_acv, 100);

  const { violations } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 500000);
  const liabViolation = violations.find((v) => v.rule_id === 'RULE-LIAB-001');
  assert.equal(liabViolation, undefined, 'Must not flag compliant 100% liability cap');
});

// ----------------------------------------------------------------------------
// RULE 2: GDPR & DATA SOVEREIGNTY TESTS
// ----------------------------------------------------------------------------
test('Rule 2: Flags non-EU storage when SCCs are omitted', () => {
  const sampleText = `
    SECTION 14. DATA PROTECTION.
    Customer Personal Data may be processed and stored in Vendor's primary cloud infrastructure located in Singapore and Malaysia.
    The parties agree that Standard Contractual Clauses (SCCs) are not executed.
  `;
  const clauses = extractContractClauses(sampleText, 250000);
  assert.ok(clauses.data_sovereignty.storage_regions.includes('Singapore'));
  assert.equal(clauses.data_sovereignty.sccs_present, false);

  const { violations, status } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 250000);
  const gdprViolation = violations.find((v) => v.rule_id === 'RULE-GDPR-002');

  assert.ok(gdprViolation, 'Must flag Rule 2 violation for Singapore data transfer without SCCs');
  assert.equal(gdprViolation.severity, 'CRITICAL');
  assert.match(gdprViolation.explanation, /outside EU\/EEA in \[Singapore, Malaysia\] without executed Standard Contractual Clauses/);
});

test('Rule 2: Approves exclusive EU storage with executed SCCs', () => {
  const sampleText = `
    ARTICLE 12. DATA SOVEREIGNTY.
    All Personal Data of European Union citizens shall be stored exclusively in data centers located within Frankfurt, Germany (EU).
    The parties have executed the European Commission Standard Contractual Clauses (EU 2021/914).
  `;
  const clauses = extractContractClauses(sampleText, 500000);
  assert.equal(clauses.data_sovereignty.eu_exclusive, true);
  assert.equal(clauses.data_sovereignty.sccs_present, true);

  const { violations } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 500000);
  const gdprViolation = violations.find((v) => v.rule_id === 'RULE-GDPR-002');
  assert.equal(gdprViolation, undefined, 'Must not flag compliant EU exclusive storage with SCCs');
});

// ----------------------------------------------------------------------------
// RULE 3: GOVERNING LAW & JURISDICTION TESTS
// ----------------------------------------------------------------------------
test('Rule 3: Flags foreign or non-Delaware/NY governing law (London, UK)', () => {
  const sampleText = `
    SECTION 18. GOVERNING LAW.
    This Agreement shall be governed by the laws of England and Wales. High Court of Justice in London, United Kingdom.
  `;
  const clauses = extractContractClauses(sampleText, 250000);
  assert.equal(clauses.governing_law.governing_jurisdiction, 'England and Wales');

  const { violations, status } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 250000);
  const lawViolation = violations.find((v) => v.rule_id === 'RULE-LAW-003');

  assert.ok(lawViolation, 'Must flag Rule 3 violation for English Law');
  assert.equal(lawViolation.severity, 'CRITICAL');
  assert.match(lawViolation.explanation, /Delaware or the State of New York/);
});

test('Rule 3: Approves State of Delaware and State of New York', () => {
  const delawareText = `ARTICLE 17. GOVERNING LAW. Governed exclusively by the substantive laws of the State of Delaware, Court of Chancery.`;
  const deClauses = extractContractClauses(delawareText, 100000);
  const deResult = evaluateContractCompliance(deClauses, ENTERPRISE_COMPLIANCE_RULES, 100000);
  assert.equal(deResult.violations.find((v) => v.rule_id === 'RULE-LAW-003'), undefined);

  const nyText = `CLAUSE 19. JURISDICTION. Governed by the laws of the State of New York, Borough of Manhattan.`;
  const nyClauses = extractContractClauses(nyText, 100000);
  const nyResult = evaluateContractCompliance(nyClauses, ENTERPRISE_COMPLIANCE_RULES, 100000);
  assert.equal(nyResult.violations.find((v) => v.rule_id === 'RULE-LAW-003'), undefined);
});

// ----------------------------------------------------------------------------
// RULE 4: AUTO-RENEWAL / TERMINATION NOTICE TESTS
// ----------------------------------------------------------------------------
test('Rule 4: Flags auto-renewal notice period under 60 days (30 days)', () => {
  const sampleText = `
    SECTION 4. TERM.
    Automatically renews unless either party provides written notice of non-renewal at least thirty (30) days prior.
  `;
  const clauses = extractContractClauses(sampleText, 250000);
  assert.equal(clauses.auto_renewal.notice_window_days, 30);

  const { violations } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 250000);
  const termViolation = violations.find((v) => v.rule_id === 'RULE-TERM-004');

  assert.ok(termViolation, 'Must flag Rule 4 warning for 30-day notice');
  assert.equal(termViolation.severity, 'WARNING');
  assert.match(termViolation.explanation, /30 days.*minimum 60-day/);
});

test('Rule 4: Flags silent auto-renewals with 0 days notice', () => {
  const sampleText = `
    CLAUSE 2. TERM.
    This agreement renews silently upon the expiration of each calendar year with no written notice requirement.
  `;
  const clauses = extractContractClauses(sampleText, 100000);
  assert.equal(clauses.auto_renewal.is_silent, true);

  const { violations } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 100000);
  const termViolation = violations.find((v) => v.rule_id === 'RULE-TERM-004');

  assert.ok(termViolation, 'Must flag silent auto-renewal as critical trap');
  assert.equal(termViolation.severity, 'CRITICAL');
});

test('Rule 4: Approves auto-renewal notice >= 60 days (90 days)', () => {
  const sampleText = `
    ARTICLE 3. TERM.
    Automatically renews unless terminated by either party upon at least ninety (90) days prior written notice.
  `;
  const clauses = extractContractClauses(sampleText, 500000);
  assert.equal(clauses.auto_renewal.notice_window_days, 90);

  const { violations } = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, 500000);
  assert.equal(violations.find((v) => v.rule_id === 'RULE-TERM-004'), undefined);
});

// ----------------------------------------------------------------------------
// FULL END-TO-END TEMPLATE VALIDATION
// ----------------------------------------------------------------------------
test('End-to-End: Apex Global sample triggers all 4 rule violations and FAILED_COMPLIANCE', () => {
  const apexTemplate = SAMPLE_CONTRACTS[0];
  const clauses = extractContractClauses(apexTemplate.raw_text, apexTemplate.acv_usd);
  const result = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, apexTemplate.acv_usd);

  assert.equal(result.status, 'FAILED_COMPLIANCE');
  assert.equal(result.violations.length, 4, 'Should detect all 4 rule violations in Apex sample');
});

test('End-to-End: NorthStar sample passes all 4 rules and returns APPROVED', () => {
  const northstarTemplate = SAMPLE_CONTRACTS[1];
  const clauses = extractContractClauses(northstarTemplate.raw_text, northstarTemplate.acv_usd);
  const result = evaluateContractCompliance(clauses, ENTERPRISE_COMPLIANCE_RULES, northstarTemplate.acv_usd);

  assert.equal(result.status, 'APPROVED');
  assert.equal(result.violations.length, 0, 'Should pass all rules with 0 violations');
});
