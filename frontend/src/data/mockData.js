// Mock streaming events that simulate the backend pipeline
export const MOCK_STREAM_EVENTS = [
  { delay: 400,   agent: 'Orchestrator',            type: 'thinking',  content: 'Inspecting 3 uploaded file(s). Detecting types and building the processing pipeline...' },
  { delay: 1000,  agent: 'Orchestrator',            type: 'progress',  content: 'Stage 1/8: Ingesting files...', data: { stage: 1, total: 8 } },
  { delay: 1400,  agent: 'IngestionAgent',          type: 'thinking',  content: 'Checking MIME types and file extensions for each uploaded file...' },
  { delay: 2000,  agent: 'IngestionAgent',          type: 'action',    content: "'Q1_Financial_Report.pdf' detected as: pdf" },
  { delay: 2400,  agent: 'IngestionAgent',          type: 'action',    content: "'Sales_Deck_2024.pptx' detected as: pptx" },
  { delay: 2800,  agent: 'IngestionAgent',          type: 'action',    content: "'Customer_Feedback.csv' detected as: csv" },
  { delay: 3200,  agent: 'IngestionAgent',          type: 'complete',  content: 'Ingested 3 documents — saved to job store', data: { documents: 3 } },

  { delay: 3600,  agent: 'Orchestrator',            type: 'progress',  content: 'Stage 2/8: Parsing documents...', data: { stage: 2, total: 8 } },
  { delay: 4000,  agent: 'DocumentParserAgent',     type: 'thinking',  content: "Parsing 'Q1_Financial_Report.pdf'. Opening with PyMuPDF, checking for embedded images and tables..." },
  { delay: 4800,  agent: 'DocumentParserAgent',     type: 'action',    content: "Found 6 embedded images in 'Q1_Financial_Report.pdf'" },
  { delay: 5200,  agent: 'DocumentParserAgent',     type: 'action',    content: "Extracted 3 tables from 'Q1_Financial_Report.pdf' using pdfplumber" },
  { delay: 5700,  agent: 'DocumentParserAgent',     type: 'result',    content: "Parsed 'Q1_Financial_Report.pdf': 31 content blocks", data: { blocks: 31, tables: 3, images: 6 } },
  { delay: 6200,  agent: 'DocumentParserAgent',     type: 'thinking',  content: "Parsing 'Sales_Deck_2024.pptx'. Extracting text from 18 slides..." },
  { delay: 6800,  agent: 'DocumentParserAgent',     type: 'result',    content: "Parsed 'Sales_Deck_2024.pptx': 18 slide blocks", data: { blocks: 18 } },
  { delay: 7200,  agent: 'DocumentParserAgent',     type: 'result',    content: "Parsed 'Customer_Feedback.csv': 1 structured table block (2,847 rows)", data: { blocks: 1, rows: 2847 } },
  { delay: 7600,  agent: 'DocumentParserAgent',     type: 'complete',  content: 'Parsed 3 documents — 50 total content blocks extracted' },

  { delay: 8000,  agent: 'Orchestrator',            type: 'progress',  content: 'Stage 3/8: Analyzing embedded images with vision model...', data: { stage: 3, total: 8 } },
  { delay: 8400,  agent: 'VisionAgent',             type: 'thinking',  content: 'Found 6 images in PDF. Loading vision model (meta-llama/llama-3.2-11b-vision). Will analyze charts, diagrams, and tables in each image...' },
  { delay: 9000,  agent: 'VisionAgent',             type: 'action',    content: 'Vision analysis on image — page 4' },
  { delay: 9600,  agent: 'VisionAgent',             type: 'result',    content: 'Page 4 image: Bar chart — Q1 Revenue by Region. Data: North $1.2M, South $0.8M, East $1.5M, West $0.9M', data: { preview: 'Bar chart with revenue data extracted' } },
  { delay: 10200, agent: 'VisionAgent',             type: 'action',    content: 'Vision analysis on image — page 7' },
  { delay: 10800, agent: 'VisionAgent',             type: 'result',    content: 'Page 7 image: Org chart — Executive team structure. CEO → 3 VPs → 12 Directors', data: { preview: 'Org chart structure extracted' } },
  { delay: 11400, agent: 'VisionAgent',             type: 'complete',  content: 'Vision analysis complete — 6 images analyzed and converted to text' },

  { delay: 11800, agent: 'Orchestrator',            type: 'progress',  content: 'Stage 5/8: Embedding content into vector DB...', data: { stage: 5, total: 8 } },
  { delay: 12200, agent: 'ChunkingAgent',           type: 'thinking',  content: 'Splitting 50 content blocks into overlapping chunks. Using sentence-transformers (all-MiniLM-L6-v2) for local embedding — no API calls needed...' },
  { delay: 12800, agent: 'ChunkingAgent',           type: 'progress',  content: 'Embedding 50/127 chunks into ChromaDB...', data: { percent: 40 } },
  { delay: 13400, agent: 'ChunkingAgent',           type: 'progress',  content: 'Embedding 100/127 chunks into ChromaDB...', data: { percent: 79 } },
  { delay: 14000, agent: 'ChunkingAgent',           type: 'complete',  content: 'Stored 127 chunks in vector DB', data: { total_chunks: 127 } },

  { delay: 14400, agent: 'Orchestrator',            type: 'progress',  content: 'Stage 6/8: Extracting entities and facts...', data: { stage: 6, total: 8 } },
  { delay: 14800, agent: 'EntityExtractionAgent',   type: 'thinking',  content: "Running spaCy NER on all documents to find persons, organizations, dates, monetary values. Then calling LLM for structured fact extraction (subject → attribute → value)..." },
  { delay: 15600, agent: 'EntityExtractionAgent',   type: 'action',    content: "Extracting entities from 'Q1_Financial_Report.pdf'" },
  { delay: 16400, agent: 'EntityExtractionAgent',   type: 'result',    content: "Extracted 34 facts from 'Q1_Financial_Report.pdf'", data: { facts: 34 } },
  { delay: 17000, agent: 'EntityExtractionAgent',   type: 'action',    content: "Extracting entities from 'Customer_Feedback.csv'" },
  { delay: 17800, agent: 'EntityExtractionAgent',   type: 'result',    content: "Extracted 18 facts from 'Customer_Feedback.csv'", data: { facts: 18 } },
  { delay: 18400, agent: 'EntityExtractionAgent',   type: 'thinking',  content: 'Running fuzzy deduplication on extracted entities. Merging: "Acme Corp" + "ACME" + "Acme Inc" → canonical "Acme Corp"...' },
  { delay: 19200, agent: 'EntityExtractionAgent',   type: 'complete',  content: 'Extracted 63 entities and 89 facts', data: { entity_count: 63, fact_count: 89 } },

  { delay: 19600, agent: 'Orchestrator',            type: 'progress',  content: 'Stage 7/8: Cross-document conflict detection...', data: { stage: 7, total: 8 } },
  { delay: 20000, agent: 'CrossDocumentAgent',      type: 'thinking',  content: 'Grouping 89 facts by (subject, attribute) to find cases where multiple documents make different claims about the same thing...' },
  { delay: 20800, agent: 'CrossDocumentAgent',      type: 'action',    content: "Conflict: 'Q1 Total Revenue' — 'Q1_Financial_Report.pdf' says '$4.4M', 'Sales_Deck_2024.pptx' says '$4.1M'" },
  { delay: 21600, agent: 'CrossDocumentAgent',      type: 'result',    content: "Conflict resolved: Q1 Financial Report post-dates Sales Deck. $4.4M is likely the restated figure.", data: { resolution: 'Financial Report value preferred' } },
  { delay: 22400, agent: 'CrossDocumentAgent',      type: 'action',    content: "Conflict: 'Headcount Q1' — PDF says '247', deck says '231'" },
  { delay: 23000, agent: 'CrossDocumentAgent',      type: 'result',    content: 'Conflict noted: 16-person discrepancy in headcount. Possibly FTE vs total including contractors.', data: { resolution: 'Manual review recommended' } },
  { delay: 23600, agent: 'CrossDocumentAgent',      type: 'complete',  content: 'Found 3 conflicts, 12 confirmed overlaps', data: { conflict_count: 3, overlap_count: 12 } },

  { delay: 24000, agent: 'KnowledgeGraphAgent',     type: 'thinking',  content: 'Building entity relationship graph using NetworkX. Linking entities that appear together in facts...' },
  { delay: 24800, agent: 'KnowledgeGraphAgent',     type: 'complete',  content: 'Knowledge graph built: 41 nodes, 67 edges', data: { node_count: 41, edge_count: 67 } },

  { delay: 25200, agent: 'Orchestrator',            type: 'progress',  content: 'Stage 8/8: Generating insights and final report...', data: { stage: 8, total: 8 } },
  { delay: 25600, agent: 'InsightAgent',            type: 'thinking',  content: 'Synthesizing all extracted knowledge — entities, facts, conflicts, and graph structure — to surface the 5 most surprising and actionable findings...' },
  { delay: 26800, agent: 'InsightAgent',            type: 'result',    content: '[CONTRADICTION] Revenue Discrepancy: Q1 revenue figures differ by $300K across two documents', data: { confidence: 0.91 } },
  { delay: 27400, agent: 'InsightAgent',            type: 'result',    content: '[PATTERN] Customer churn mentions spike in feedback correlated with pricing discussions', data: { confidence: 0.87 } },
  { delay: 28000, agent: 'InsightAgent',            type: 'result',    content: '[RISK] Vendor "GlobalSupply Ltd" appears in 4 documents but no contract document was found', data: { confidence: 0.93 } },
  { delay: 28600, agent: 'InsightAgent',            type: 'result',    content: '[GAP] No data found for Q1 Southeast region — mentioned as "pending" in all three sources', data: { confidence: 0.85 } },
  { delay: 29200, agent: 'InsightAgent',            type: 'complete',  content: 'Generated 5 insights (3 from LLM synthesis + 2 from conflict detection)' },

  { delay: 29600, agent: 'ReportAgent',             type: 'thinking',  content: 'Compiling executive summary. Assembling chart data, section structure, and narrative from all agent outputs...' },
  { delay: 30800, agent: 'ReportAgent',             type: 'complete',  content: 'Report ready — executive summary and 4 dashboard sections generated' },

  { delay: 31200, agent: 'Orchestrator',            type: 'complete',  content: 'Pipeline complete — all insights are ready!', data: { job_id: 'mock-job-001' } },
]

// Dashboard mock data
export const MOCK_REPORT = {
  executive_summary: `Three documents were analyzed: Q1 Financial Report (PDF, 28 pages), Sales Presentation (PPTX, 18 slides), and Customer Feedback export (CSV, 2,847 rows). Overall data quality scored 74/100, with the primary issue being inconsistent revenue reporting across sources.

The most significant finding is a $300K discrepancy in Q1 total revenue between the financial report ($4.4M) and the sales deck ($4.1M). The financial report, published two weeks later, likely contains the restated figure. Additionally, headcount figures differ by 16 employees — possibly FTE vs. total workforce including contractors.

Recommended immediate actions: (1) Confirm the correct Q1 revenue figure with finance and update the sales deck, (2) Resolve the headcount definition inconsistency, (3) Investigate the Southeast region data gap which appears in all three sources, (4) Request a contract on file for GlobalSupply Ltd which has significant presence across documents but no formal agreement found.`,
  chart_data: {
    entity_types: { ORG: 18, MONEY: 14, DATE: 12, PERSON: 11, GPE: 8 },
    insight_types: { contradiction: 2, risk: 1, gap: 1, pattern: 1 },
    docs_by_type: { pdf: 1, pptx: 1, csv: 1 },
  }
}

export const MOCK_INSIGHTS = [
  {
    id: '1',
    insight_type: 'contradiction',
    title: 'Revenue Discrepancy Across Sources',
    description: 'Q1 total revenue is reported as $4.4M in the financial report and $4.1M in the sales deck — a $300K difference that may cause stakeholder confusion.',
    evidence: ['Q1_Financial_Report.pdf p.3: "Total Q1 revenue: $4.4M"', 'Sales_Deck_2024.pptx slide 5: "Q1 closed at $4.1M"'],
    confidence: 0.91,
    recommended_action: 'Verify correct Q1 figure with CFO and update the sales deck before next investor call.'
  },
  {
    id: '2',
    insight_type: 'risk',
    title: 'Undocumented Vendor Relationship',
    description: '"GlobalSupply Ltd" appears in 4 separate document sections as a key supplier but no contract document, SLA, or agreement was found in the uploaded set.',
    evidence: ['Mentioned 4 times across 2 documents', 'No corresponding contract in document set'],
    confidence: 0.93,
    recommended_action: 'Locate or create a formal vendor agreement for GlobalSupply Ltd before Q2 purchase orders.'
  },
  {
    id: '3',
    insight_type: 'pattern',
    title: 'Churn Correlates with Pricing Discussions',
    description: 'Customer feedback analysis shows that 73% of churn-related comments appear within the same feedback record as pricing-related keywords. This correlation is strong enough to suggest pricing perception is the primary churn driver.',
    evidence: ['2,079 of 2,847 feedback records mention pricing', '73% overlap with churn sentiment'],
    confidence: 0.87,
    recommended_action: 'Conduct pricing sensitivity analysis and consider tiered pricing options for at-risk segments.'
  },
  {
    id: '4',
    insight_type: 'gap',
    title: 'Southeast Region Data Absent',
    description: 'All three documents reference the Southeast region as "data pending" or omit it entirely. This represents a systemic reporting gap that may affect executive decision-making.',
    evidence: ['PDF p.12: "Southeast — data pending Q2"', 'CSV: 0 rows with region=Southeast'],
    confidence: 0.85,
    recommended_action: 'Follow up with regional manager to obtain Q1 Southeast figures before board presentation.'
  },
  {
    id: '5',
    insight_type: 'contradiction',
    title: 'Headcount Inconsistency (16 person gap)',
    description: 'Financial report headcount (247) differs from the sales deck figure (231) by 16 employees. This likely reflects a different definition — FTE vs. total workforce.',
    evidence: ['Q1_Financial_Report.pdf: "Total headcount: 247"', 'Sales_Deck_2024.pptx: "Team of 231"'],
    confidence: 0.78,
    recommended_action: 'Standardize headcount definition across all external documents to avoid misrepresentation.'
  },
]

export const MOCK_CONFLICTS = [
  {
    id: '1',
    conflict_type: 'value_mismatch',
    description: "'Q1 Total Revenue': 'Q1_Financial_Report.pdf' says '$4.4M', 'Sales_Deck_2024.pptx' says '$4.1M'",
    resolution: 'Financial Report was published 14 days after the Sales Deck and likely contains the restated, audited figure. Q1 Financial Report value ($4.4M) is preferred.',
    confidence: 0.91
  },
  {
    id: '2',
    conflict_type: 'value_mismatch',
    description: "'Q1 Headcount': 'Q1_Financial_Report.pdf' says '247', 'Sales_Deck_2024.pptx' says '231'",
    resolution: 'Likely definitional: Financial Report may include part-time/contract staff. Manual review recommended to standardize definition.',
    confidence: 0.62
  },
  {
    id: '3',
    conflict_type: 'value_mismatch',
    description: "'Customer Churn Rate Q1': PDF says '4.2%', CSV aggregate says '3.8%'",
    resolution: 'CSV shows raw retention data while PDF may use adjusted churn. Both values may be correct under different methodologies.',
    confidence: 0.71
  }
]

export const MOCK_ENTITIES = [
  { id: '1', canonical_name: 'Acme Corp', entity_type: 'ORG',    aliases: ['ACME', 'Acme Inc'], source_docs: ['Q1_Financial_Report.pdf', 'Sales_Deck_2024.pptx'] },
  { id: '2', canonical_name: 'GlobalSupply Ltd', entity_type: 'ORG', aliases: [], source_docs: ['Q1_Financial_Report.pdf', 'Sales_Deck_2024.pptx'] },
  { id: '3', canonical_name: 'Sarah Chen', entity_type: 'PERSON', aliases: [], source_docs: ['Q1_Financial_Report.pdf'] },
  { id: '4', canonical_name: 'Marcus Webb', entity_type: 'PERSON', aliases: [], source_docs: ['Sales_Deck_2024.pptx'] },
  { id: '5', canonical_name: 'Southeast Region', entity_type: 'GPE', aliases: ['SE Region'], source_docs: ['Q1_Financial_Report.pdf', 'Sales_Deck_2024.pptx', 'Customer_Feedback.csv'] },
  { id: '6', canonical_name: 'Q1 2024', entity_type: 'DATE', aliases: ['Q1', 'January-March 2024'], source_docs: ['Q1_Financial_Report.pdf', 'Sales_Deck_2024.pptx'] },
  { id: '7', canonical_name: '$4.4M', entity_type: 'MONEY', aliases: ['4.4 million'], source_docs: ['Q1_Financial_Report.pdf'] },
  { id: '8', canonical_name: 'NovaTech Solutions', entity_type: 'ORG', aliases: [], source_docs: ['Customer_Feedback.csv'] },
  { id: '9', canonical_name: 'DataBridge API', entity_type: 'PRODUCT', aliases: [], source_docs: ['Sales_Deck_2024.pptx'] },
  { id: '10', canonical_name: 'Enterprise Plan', entity_type: 'PRODUCT', aliases: ['Enterprise Tier'], source_docs: ['Customer_Feedback.csv', 'Sales_Deck_2024.pptx'] },
]

export const MOCK_FACTS = [
  { id: '1', subject: 'Q1 Revenue',      attribute: 'total',           value: '$4.4M',   source_doc: 'Q1_Financial_Report.pdf', confidence: 0.97 },
  { id: '2', subject: 'Q1 Revenue',      attribute: 'total',           value: '$4.1M',   source_doc: 'Sales_Deck_2024.pptx',    confidence: 0.95 },
  { id: '3', subject: 'Headcount',       attribute: 'total Q1',        value: '247',     source_doc: 'Q1_Financial_Report.pdf', confidence: 0.96 },
  { id: '4', subject: 'Headcount',       attribute: 'total Q1',        value: '231',     source_doc: 'Sales_Deck_2024.pptx',    confidence: 0.94 },
  { id: '5', subject: 'Churn Rate',      attribute: 'Q1',              value: '4.2%',    source_doc: 'Q1_Financial_Report.pdf', confidence: 0.88 },
  { id: '6', subject: 'NPS Score',       attribute: 'Q1 average',      value: '42',      source_doc: 'Customer_Feedback.csv',   confidence: 0.92 },
  { id: '7', subject: 'Enterprise Plan', attribute: 'price per seat',  value: '$120/mo', source_doc: 'Sales_Deck_2024.pptx',    confidence: 0.99 },
  { id: '8', subject: 'GlobalSupply Ltd', attribute: 'contract status', value: 'unknown', source_doc: 'Q1_Financial_Report.pdf', confidence: 0.70 },
]

export const MOCK_GRAPH = {
  nodes: [
    { id: 'Acme Corp',        type: 'ORG',     x: 300, y: 160, size: 14 },
    { id: 'GlobalSupply Ltd', type: 'ORG',     x: 520, y: 90,  size: 12 },
    { id: 'Q1 Revenue',       type: 'MONEY',   x: 180, y: 280, size: 12 },
    { id: 'Sarah Chen',       type: 'PERSON',  x: 420, y: 280, size: 10 },
    { id: 'Marcus Webb',      type: 'PERSON',  x: 580, y: 240, size: 10 },
    { id: 'Q1 2024',          type: 'DATE',    x: 280, y: 60,  size: 11 },
    { id: 'Enterprise Plan',  type: 'PRODUCT', x: 100, y: 160, size: 10 },
    { id: 'NovaTech',         type: 'ORG',     x: 460, y: 360, size: 10 },
    { id: 'DataBridge API',   type: 'PRODUCT', x: 180, y: 380, size: 9  },
    { id: 'Southeast Region', type: 'GPE',     x: 620, y: 360, size: 11 },
  ],
  edges: [
    { source: 'Acme Corp',       target: 'Q1 Revenue',       rel: 'reported' },
    { source: 'Acme Corp',       target: 'GlobalSupply Ltd', rel: 'supplier' },
    { source: 'Acme Corp',       target: 'Q1 2024',          rel: 'period' },
    { source: 'Sarah Chen',      target: 'Acme Corp',        rel: 'works_at' },
    { source: 'Marcus Webb',     target: 'Acme Corp',        rel: 'works_at' },
    { source: 'Enterprise Plan', target: 'Acme Corp',        rel: 'sold_by' },
    { source: 'NovaTech',        target: 'Enterprise Plan',  rel: 'uses' },
    { source: 'DataBridge API',  target: 'Acme Corp',        rel: 'product_of' },
    { source: 'Southeast Region', target: 'Q1 Revenue',      rel: 'missing_data' },
  ]
}

export const PIPELINE_STAGES = [
  { id: 1, name: 'Ingestion',         agent: 'IngestionAgent',        icon: 'Upload' },
  { id: 2, name: 'Document Parsing',  agent: 'DocumentParserAgent',   icon: 'FileText' },
  { id: 3, name: 'Vision Analysis',   agent: 'VisionAgent',           icon: 'Eye' },
  { id: 4, name: 'Video Processing',  agent: 'VideoAgent',            icon: 'Video' },
  { id: 5, name: 'Vector Embedding',  agent: 'ChunkingAgent',         icon: 'Database' },
  { id: 6, name: 'Entity Extraction', agent: 'EntityExtractionAgent', icon: 'Tag' },
  { id: 7, name: 'Cross-Doc Analysis',agent: 'CrossDocumentAgent',    icon: 'GitMerge' },
  { id: 8, name: 'Insight Synthesis', agent: 'InsightAgent',          icon: 'Lightbulb' },
]
