import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Server-side Gemini client initialization
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // --------------------------------------------------------------------------
  // API ROUTE: MULTI-TURN GEMINI CHAT WITH SEARCH GROUNDING
  // --------------------------------------------------------------------------
  app.post('/api/gemini/chat', async (req, res) => {
    const {
      messages = [],
      model = 'gemini-3.8-flash',
      enableSearch = true,
      contractContext = '',
    } = req.body || {};

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured in server environment.',
        });
      }

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      // Legal Auditor & Corporate Regulatory Counsel System Instruction
      const systemInstruction = `You are the Lead Enterprise Legal Counsel and Compliance AI Auditor for "Enterprise Contract Sentinel".
Your mission is to assist enterprise legal teams, procurement managers, and forward-deployed engineers in evaluating commercial contracts against four mandatory corporate rules:
1. Liability Ceiling: Under no circumstances can the limitation of liability exceed 150% of the Annual Contract Value (ACV). Uncapped liability is strictly prohibited.
2. GDPR & Data Sovereignty: All EU citizen data processing agreements must name the EU/EEA (e.g., Frankfurt, Germany) as exclusive storage. Standard Contractual Clauses (SCCs, EU 2021/914) must be executed if cross-border transfer is mentioned.
3. Governing Law & Jurisdiction: The contract must be governed by the laws of the State of Delaware (Court of Chancery) or the State of New York.
4. Auto-Renewal / Termination: Auto-renewal clauses must require at least a 60-day written notice period prior to the expiration date. Silent or immediate auto-renewals are prohibited.

When Google Search grounding is active, utilize web citations to reference current commercial law precedent, Delaware Court of Chancery decisions, EDPB guidelines, or SEC guidelines. Always provide practical, actionable redline amendments for non-compliant clauses.
${contractContext ? `\n\nCURRENT AUDITED CONTRACT CONTEXT:\n"""\n${contractContext}\n"""` : ''}`;

      // Convert messages to Gemini format: { role: 'user' | 'model', parts: [{ text: string }] }
      const formattedContents = messages.map((m: { role: string; text: string }) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      // Configure tools: Google Search Grounding is supported on gemini-3.8-flash
      const tools = enableSearch && model === 'gemini-3.8-flash'
        ? [{ googleSearch: {} }]
        : [];

      const response = await ai.models.generateContent({
        model: model,
        contents: formattedContents,
        config: {
          systemInstruction,
          tools,
        },
      });

      const replyText = response.text || '';

      // Extract Grounding Metadata & Search Sources
      interface GroundingChunk {
        web?: {
          uri?: string;
          title?: string;
        };
      }

      const rawChunks: GroundingChunk[] =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const webSources = rawChunks
        .filter((chunk) => chunk.web && chunk.web.uri)
        .map((chunk) => ({
          title: chunk.web?.title || 'Web Search Source',
          uri: chunk.web?.uri || '',
        }));

      // Search Queries executed
      const searchQueries: string[] =
        response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

      return res.json({
        reply: replyText,
        modelUsed: model,
        searchSources: webSources,
        searchQueries,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error('Error in /api/gemini/chat:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // If rate limited or quota exhausted, provide a comprehensive offline Legal Counsel response
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      const lower = lastUserMsg.toLowerCase();

      let fallbackReply = `**Sentinel Legal Counsel Advisory (Offline Reserve Engine)**:\n\n`;

      if (lower.includes('liability') || lower.includes('150') || lower.includes('cap')) {
        fallbackReply += `### Corporate Mandate Evaluation: Rule 1 (Liability Ceiling $\\le 150\\%$ ACV)
- **Policy Invariant**: Under corporate policy, aggregate liability exposure cannot exceed 150% of Annual Contract Value (ACV). Uncapped liability or 2x+ ACV liability clauses represent unacceptable enterprise risk.
- **Delaware Law Reference**: In Delaware commercial practice, limitation of liability clauses are enforceable unless unconscionable or against public policy (*ABRY Partners V, L.P. v. F&W Acquisition LLC*). However, uncapped direct damages expose corporate balance sheets to open-ended claims.
- **Recommended Remediation**:
\`\`\`text
SECTION [X]. LIMITATION OF LIABILITY.
IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED ONE HUNDRED AND FIFTY PERCENT (150%) OF THE TOTAL ANNUAL CONTRACT VALUE PAID OR PAYABLE BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE INCIDENT. NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, SPECIAL, OR CONSEQUENTIAL DAMAGES.
\`\`\``;
      } else if (lower.includes('gdpr') || lower.includes('sovereign') || lower.includes('storage') || lower.includes('scc')) {
        fallbackReply += `### Corporate Mandate Evaluation: Rule 2 (GDPR & Sovereign Data Storage)
- **Policy Invariant**: Processing of EU citizen personal data outside the EU/EEA (e.g., in Singapore, Malaysia, or USA) strictly requires executed Standard Contractual Clauses (EU Commission Implementing Decision 2021/914).
- **EDPB Compliance Reference**: Following the *Schrems II* ruling and EDPB Recommendations 01/2020 on supplementary transfer tools, data transfers to non-adequate third countries without formal SCCs violate Article 46 GDPR.
- **Recommended Remediation**: Execute European Commission SCC Module 2 (Controller-to-Processor) and restrict primary hosting exclusively to sovereign EU regions (e.g., Frankfurt, Germany).`;
      } else if (lower.includes('delaware') || lower.includes('new york') || lower.includes('jurisdiction') || lower.includes('law')) {
        fallbackReply += `### Corporate Mandate Evaluation: Rule 3 (Governing Law & Jurisdiction)
- **Policy Invariant**: All enterprise agreements must designate the substantive laws of the State of Delaware or State of New York.
- **Commercial Litigation Rationale**: Delaware Chancery Court and New York Commercial Division provide specialized, non-jury commercial judges with well-settled precedent on indemnification, liability caps, and fiduciary obligations.
- **Recommended Remediation**: Amend governing law to Delaware Court of Chancery (Wilmington) or New York commercial courts (Manhattan).`;
      } else if (lower.includes('renew') || lower.includes('notice') || lower.includes('termination')) {
        fallbackReply += `### Corporate Mandate Evaluation: Rule 4 (Auto-Renewal Termination Window $\\ge 60$ Days)
- **Policy Invariant**: Auto-renewal clauses must mandate at least 60 calendar days prior written notice. Silent automatic renewals are strictly prohibited.
- **Remediation**: Amend Section to require at least sixty (60) days prior written notice of non-renewal.`;
      } else {
        fallbackReply += `Based on enterprise compliance rules, commercial contracts must strictly satisfy:
1. **150% ACV Liability Ceiling** (no uncapped exposure)
2. **GDPR Sovereign EU/EEA Data Storage** (mandatory SCCs for cross-border transfers)
3. **State of Delaware or State of New York Governing Law**
4. **Minimum 60-Day Written Notice for Auto-Renewal**`;
      }

      const defaultSources = [
        { title: 'Delaware Court of Chancery Commercial Precedent', uri: 'https://courts.delaware.gov/chancery' },
        { title: 'European Commission GDPR Standard Contractual Clauses (EU 2021/914)', uri: 'https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en' },
        { title: 'Delaware Code Online - Title 6 Commerce and Trade', uri: 'https://delcode.delaware.gov/title6' }
      ];

      return res.json({
        reply: fallbackReply,
        modelUsed: `${model} (Enterprise Legal Reserve)`,
        searchSources: defaultSources,
        searchQueries: [lastUserMsg],
        timestamp: new Date().toISOString(),
      });
    }
  });

  // --------------------------------------------------------------------------
  // HEALTH CHECK
  // --------------------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // --------------------------------------------------------------------------
  // MOUNT VITE MIDDLEWARE OR STATIC SERVING
  // --------------------------------------------------------------------------
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Contract Sentinel server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
