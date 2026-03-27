const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { jsPDF } = require('jspdf');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const PDF_DIR = path.join(ROOT, 'pdfs');
const CHECKLIST = readJson(path.join(DATA_DIR, 'checklist.json'));

const SCHOOL_CONFIGS = [
  {
    sourceFolder: 'north_broward',
    sourceDataFile: 'north_broward_data.json',
    targetFolder: 'school_1',
    targetDataFile: 'school_1_data.json',
    name: 'School 1',
    location: 'Florida Region',
    color: [59, 130, 246]
  },
  {
    sourceFolder: 'windermere',
    sourceDataFile: 'windermere_data.json',
    targetFolder: 'school_2',
    targetDataFile: 'school_2_data.json',
    name: 'School 2',
    location: 'Florida Region',
    color: [245, 158, 11]
  }
];

const SHARED_REPLACEMENTS = [
  [/North Broward Preparatory School/gi, 'School 1'],
  [/North Broward Preparatory/gi, 'School 1'],
  [/North Broward Prep/gi, 'School 1'],
  [/North Broward/gi, 'School 1'],
  [/Windermere Preparatory School/gi, 'School 2'],
  [/Windermere Preparatory/gi, 'School 2'],
  [/Windermere Prep/gi, 'School 2'],
  [/Windermere/gi, 'School 2'],
  [/north_broward/gi, 'school_1'],
  [/windermere/gi, 'school_2'],
  [/Nord Anglia Education/gi, 'the school operator'],
  [/Nord Anglia schools/gi, 'these schools'],
  [/Nord Anglia/gi, 'the school operator'],
  [/Coral Springs,\s*FL\s*33065/gi, 'Florida Region'],
  [/Coral Springs,\s*FL/gi, 'Florida Region'],
  [/Orlando,\s*FL\s*34786/gi, 'Florida Region'],
  [/Orlando,\s*FL/gi, 'Florida Region'],
  [/Windermere,\s*FL\s*34786/gi, 'Florida Region'],
  [/Windermere,\s*FL/gi, 'Florida Region'],
  [/Broward County/gi, 'County A'],
  [/Orange County/gi, 'County B'],
  [/Broward/gi, 'County A'],
  [/Orange/gi, 'County B'],
  [/admin@northbrowardprep\.edu/gi, 'admin@school1.demo'],
  [/admin@windermereprep\.edu/gi, 'admin@school2.demo'],
  [/NB-0042/gi, 'S1-0042'],
  [/WM-0187/gi, 'S2-0187'],
  [/FL-PS-20482/gi, 'FL-PS-S1-0482'],
  [/LOS214F01234/gi, 'SEVIS-S1-01234'],
  [/County seal #FL-882/gi, 'County seal #FR-882'],
  [/the school operator schools are/gi, 'these schools are']
];

const PAGE_TRANSFORMS = {
  index: [
    { from: /<title>.*?<\/title>/, to: '<title>ComplianceIQ - Florida Private School Regulatory Dashboard</title>' },
    { from: '<div class="header-subtitle">FLORIDA PRIVATE SCHOOL</div>', to: '<div class="header-subtitle">FLORIDA PRIVATE SCHOOL</div>' },
    { from: 'data-demo-toggle="dashboard" data-mode="named"', to: 'data-demo-toggle="dashboard" data-mode="school"' },
    { from: 'href="story.html"', to: 'href="story-anonymous.html"' },
    { from: 'href="Compliance-story.html"', to: 'href="Compliance-story-anonymous.html"' },
    { from: 'North Broward Preparatory', to: 'School 1' },
    { from: 'Windermere Preparatory', to: 'School 2' },
    { from: '<script src="script.js"></script>', to: '<script src="script-anonymous.js"></script>' }
  ],
  storyHtml: [
    { from: /<title>.*?<\/title>/, to: '<title>The Compliance Gap - A Data Story by ComplianceIQ</title>' },
    { from: 'data-demo-toggle="page" data-mode="named"', to: 'data-demo-toggle="page" data-mode="school"' },
    { from: 'href="index.html"', to: 'href="index-anonymous.html"' },
    { from: 'href="Compliance-story.html"', to: 'href="Compliance-story-anonymous.html"' },
    { from: 'North Broward Preparatory', to: 'School 1' },
    { from: 'Windermere Preparatory', to: 'School 2' },
    { from: 'North Broward', to: 'School 1' },
    { from: 'Windermere', to: 'School 2' },
    { from: 'Coral Springs, FL', to: 'Florida Region' },
    { from: 'Orlando, FL', to: 'Florida Region' },
    { from: '(22 more regulations analyzed for North Broward)', to: '(22 more regulations analyzed for School 1)' },
    {
      from: 'North Broward maintained an <strong>87% compliance score</strong> â€” 21 of 28 regulations fully met. Their documentation was organized, filings were ahead of deadline, and staff clearances were up to date.',
      to: 'School 1 maintained an <strong>87% compliance score</strong> â€” 21 of 28 regulations fully met. Their documentation was organized, filings were ahead of deadline, and staff clearances were up to date.'
    },
    {
      from: 'Windermere scored <strong>61%</strong> â€” only 14 regulations fully compliant. The gaps weren&rsquo;t random. They concentrated in three areas: <em>administrative deadlines</em>, <em>personnel screening</em>, and <em>facility safety</em>.',
      to: 'School 2 scored <strong>61%</strong> â€” only 14 regulations fully compliant. The gaps weren&rsquo;t random. They concentrated in three areas: <em>administrative deadlines</em>, <em>personnel screening</em>, and <em>facility safety</em>.'
    },
    {
      from: 'North Broward holds a consistent green line. Windermere&rsquo;s line fractures across administrative and safety categories.',
      to: 'School 1 holds a consistent green line. School 2&rsquo;s line fractures across administrative and safety categories.'
    },
    {
      from: 'North Broward&rsquo;s compliance score â€” strong, but still 3 critical gaps in radon testing, chemical hygiene, and IRS reporting.',
      to: 'School 1&rsquo;s compliance score â€” strong, but still 3 critical gaps in radon testing, chemical hygiene, and IRS reporting.'
    },
    {
      from: 'Windermere&rsquo;s score â€” 7 non-compliant regulations. The pattern: expired clearances, missed deadlines, missing documentation sections.',
      to: 'School 2&rsquo;s score â€” 7 non-compliant regulations. The pattern: expired clearances, missed deadlines, missing documentation sections.'
    },
    { from: '<script src="story.js"></script>', to: '<script src="story-anonymous.js"></script>' }
  ],
  storyJs: [
    { from: /North Broward/g, to: 'School 1' },
    { from: /N\. Broward/g, to: 'School 1' },
    { from: /Windermere/g, to: 'School 2' },
    { from: /Broward County #FL-882/g, to: 'County A #FR-882' },
    { from: /Coral Springs/g, to: 'Florida Region' },
    { from: /Orlando/g, to: 'Florida Region' }
  ],
  complianceHtml: [
    {
      from: 'For Nord Anglia Education â€” which operates schools across 35 countries â€” the question was pointed:',
      to: 'For a multi-campus private school operator, the question was pointed:'
    },
    {
      from: '"Policy as Code" engine for Nord Anglia (North Broward + Windermere).',
      to: '"Policy as Code" engine for two Florida private schools (School 1 + School 2).'
    },
    {
      from: 'Nord Anglia schools are corporate subsidiaries of a private equity firm â€” not\n          nonprofits.',
      to: 'These schools are corporate subsidiaries rather than nonprofits.'
    },
    {
      from: 'K-12 schools in Florida (specifically Nord Anglia schools like North Broward Prep\n        and Windermere Prep).',
      to: 'K-12 schools in Florida (specifically two private schools labelled School 1 and School 2).'
    },
    {
      from: 'Context: I am building a "Policy as Code" compliance engine for private, international K-12 schools in Florida (specifically Nord Anglia schools like North Broward Prep and Windermere Prep). The software will ingest PDFs (forms, logs, certificates) and structured data to automatically flag non-compliance.',
      to: 'Context: I am building a "Policy as Code" compliance engine for private, international K-12 schools in Florida (specifically two private schools labelled School 1 and School 2). The software will ingest PDFs (forms, logs, certificates) and structured data to automatically flag non-compliance.'
    },
    { from: 'data-demo-toggle="page" data-mode="named"', to: 'data-demo-toggle="page" data-mode="school"' },
    { from: 'href="index.html"', to: 'href="index-anonymous.html"' },
    { from: 'Nord Anglia Education Â· Florida', to: 'Florida Case Study' },
    { from: 'North Broward Prep Â· Windermere Prep', to: 'School 1 Â· School 2' },
    { from: 'North Broward Prep', to: 'School 1' },
    { from: 'Windermere Prep', to: 'School 2' },
    { from: 'North Broward Preparatory', to: 'School 1' },
    { from: 'Windermere Preparatory', to: 'School 2' },
    { from: 'Nord Anglia schools', to: 'these schools' },
    { from: 'Nord Anglia Education', to: 'the school operator' },
    { from: 'Nord Anglia', to: 'the school operator' }
  ]
};

main();

function main() {
  console.log('\nBuilding school demo replica...\n');

  generateExactReplicaArtifacts();

  for (const school of SCHOOL_CONFIGS) {
    buildSchoolReplica(school);
  }

  buildAnonymousPages();
  console.log('\nSchool demo replica complete.\n');
}

function buildSchoolReplica(school) {
  const sourceData = readJson(path.join(DATA_DIR, school.sourceDataFile));
  const sanitizedData = sanitizeData(sourceData, school);
  const targetDir = path.join(PDF_DIR, school.targetFolder);

  ensureDir(targetDir);

  for (const doc of sanitizedData.documents) {
    const docPath = path.join(targetDir, doc.name);
    if (fs.existsSync(docPath)) {
      doc.size = formatSize(fs.statSync(docPath).size);
    }
  }

  const targetDataPath = path.join(DATA_DIR, school.targetDataFile);
  writeJson(targetDataPath, sanitizedData);
  console.log(`  - wrote ${path.relative(ROOT, targetDataPath)}`);
}

function generateExactReplicaArtifacts() {
  execFileSync(process.execPath, [path.join(ROOT, 'generate_school_demo_pdfs.js')], {
    cwd: ROOT,
    stdio: 'inherit'
  });
}

function buildAnonymousPages() {
  transformFile(
    path.join(ROOT, 'index.html'),
    path.join(ROOT, 'index-anonymous.html'),
    PAGE_TRANSFORMS.index
  );

  transformFile(
    path.join(ROOT, 'script.js'),
    path.join(ROOT, 'script-anonymous.js'),
    [
      { from: '[north_broward, windermere]', to: '[school_1, school_2]' },
      { from: "['north_broward', 'windermere']", to: "['school_1', 'school_2']" },
      { from: "fetch('./data/north_broward_data.json')", to: "fetch('./data/school_1_data.json')" },
      { from: "fetch('./data/windermere_data.json')", to: "fetch('./data/school_2_data.json')" }
    ]
  );

  transformFile(
    path.join(ROOT, 'story.html'),
    path.join(ROOT, 'story-anonymous.html'),
    PAGE_TRANSFORMS.storyHtml
  );

  transformFile(
    path.join(ROOT, 'story.js'),
    path.join(ROOT, 'story-anonymous.js'),
    PAGE_TRANSFORMS.storyJs
  );

  transformFile(
    path.join(ROOT, 'Compliance-story.html'),
    path.join(ROOT, 'Compliance-story-anonymous.html'),
    PAGE_TRANSFORMS.complianceHtml
  );
}

function transformFile(sourcePath, targetPath, transforms) {
  let content = fs.readFileSync(sourcePath, 'utf8');
  for (const transform of transforms) {
    if (transform.from instanceof RegExp) {
      content = content.replace(transform.from, transform.to);
    } else {
      content = content.split(transform.from).join(transform.to);
    }
  }
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`  - wrote ${path.relative(ROOT, targetPath)}`);
}

function sanitizeData(sourceData, school) {
  const sanitized = sanitizeDeep(sourceData);
  sanitized.school.name = school.name;
  sanitized.school.location = school.location;
  return sanitized;
}

function sanitizeDeep(value) {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeDeep(item));
  }
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, entry] of Object.entries(value)) {
      next[key] = sanitizeDeep(entry);
    }
    return next;
  }
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  return value;
}

function sanitizeText(input) {
  let output = String(input);

  output = output
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, ' - ')
    .replace(/Ã¢â‚¬â€/g, ' - ')
    .replace(/â€”/g, ' - ')
    .replace(/â€“/g, ' - ')
    .replace(/â€¢/g, ' - ')
    .replace(/Â·/g, ' | ')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€¦/g, '...')
    .replace(/Â/g, '');

  for (const [pattern, replacement] of SHARED_REPLACEMENTS) {
    output = output.replace(pattern, replacement);
  }

  return output.replace(/\s+/g, ' ').trim();
}

function buildUsageMap(sourceData, sanitizedData, sourceFolder) {
  const usageMap = new Map();
  const regsById = new Map(CHECKLIST.map(reg => [reg.id, reg]));

  for (const fileName of fs.readdirSync(path.join(PDF_DIR, sourceFolder))) {
    ensureUsage(usageMap, fileName);
  }

  for (const doc of sanitizedData.documents) {
    const usage = ensureUsage(usageMap, doc.name);
    usage.labels.add(doc.label);
    usage.descriptions.add(doc.desc);
  }

  sanitizedData.results.forEach(result => {
    const reg = regsById.get(result.id);
    const evidenceItems = collectEvidenceItems(result, reg);
    evidenceItems.forEach(item => {
      if (!item.name || item.state === 'missing') {
        return;
      }

      const usage = ensureUsage(usageMap, item.name);
      if (item.label) {
        usage.labels.add(item.label);
      }
      usage.links.push({
        id: result.id,
        ruleName: reg ? reg.name : result.id,
        category: reg ? reg.category : 'Compliance Evidence',
        citation: reg ? reg.citation : '',
        status: result.status,
        evidence: sanitizeText(result.evidence || ''),
        quote: sanitizeText(result.quote || ''),
        action: sanitizeText(result.action || ''),
        groupTitle: sanitizeText(item.groupTitle || '')
      });
    });
  });

  return usageMap;
}

function collectEvidenceItems(result, reg) {
  const items = [];

  if (Array.isArray(result.evidenceGroups) && result.evidenceGroups.length) {
    result.evidenceGroups.forEach(group => {
      if (!group || !Array.isArray(group.items)) {
        return;
      }
      group.items.forEach(item => {
        items.push({
          ...item,
          groupTitle: group.title || 'Evidence'
        });
      });
    });
  }

  if (!items.length && reg && reg.relatedDoc) {
    items.push({
      name: reg.relatedDoc,
      label: reg.name,
      state: 'present',
      groupTitle: 'Primary Evidence'
    });
  }

  return items;
}

function ensureUsage(usageMap, fileName) {
  if (!usageMap.has(fileName)) {
    usageMap.set(fileName, createEmptyUsage(fileName));
  }
  return usageMap.get(fileName);
}

function createEmptyUsage(fileName) {
  return {
    fileName,
    labels: new Set(),
    descriptions: new Set(),
    links: []
  };
}

function writeAnonymizedArtifact(filePath, fileName, school, usage) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.pdf') {
    writePdfArtifact(filePath, school, usage);
    return;
  }

  if (ext === '.csv') {
    fs.writeFileSync(filePath, buildCsvArtifact(fileName, school, usage), 'utf8');
    return;
  }

  if (ext === '.json') {
    fs.writeFileSync(filePath, JSON.stringify(buildJsonArtifact(fileName, school, usage), null, 2), 'utf8');
    return;
  }

  if (ext === '.txt' || ext === '.log' || ext === '.md') {
    fs.writeFileSync(filePath, buildTextArtifact(fileName, school, usage), 'utf8');
    return;
  }

  fs.writeFileSync(filePath, buildTextArtifact(fileName, school, usage), 'utf8');
}

function writePdfArtifact(filePath, school, usage) {
  const doc = new jsPDF();
  const title = getUsageTitle(usage);
  const subtitle = getUsageDescription(usage);
  let y = drawPdfHeader(doc, school, title);

  y = drawMetaTable(doc, y, [
    ['School', school.name],
    ['Location', school.location],
    ['Artifact', usage.fileName],
    ['Document Type', 'Evidence summary'],
    ['Generated', new Date().toISOString().slice(0, 10)]
  ]);

  y = drawSectionTitle(doc, y, 'Document Summary');
  y = drawParagraph(
    doc,
    y,
    subtitle || 'This artifact preserves the same compliance context as the original demo evidence while using generic school labels.'
  );
  y = drawParagraph(
    doc,
    y,
    'This school demo keeps the regulation linkage, compliance status, evidence narrative, and recommended action aligned to the original dashboard.'
  );

  y = drawSectionTitle(doc, y, 'Linked Findings');
  if (!usage.links.length) {
    y = drawParagraph(doc, y, 'No direct result mapping was available, so this file is included as a supporting document for the school demo workspace.');
  } else {
    usage.links.forEach(link => {
      const summary = `${link.id} | ${link.ruleName} | ${statusLabel(link.status)}${link.groupTitle ? ` | ${link.groupTitle}` : ''}`;
      y = drawBullet(doc, y, summary);
      if (link.evidence) {
        y = drawParagraph(doc, y, `Evidence: ${link.evidence}`, 20);
      }
      if (link.quote) {
        y = drawParagraph(doc, y, `Quoted text: ${link.quote}`, 20);
      }
      if (link.action) {
        y = drawParagraph(doc, y, `Action: ${link.action}`, 20);
      }
    });
  }

  addPdfFooter(doc);
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, buffer);
}

function buildCsvArtifact(fileName, school, usage) {
  const rows = [
    ['school', 'artifact', 'requirement_id', 'rule_name', 'status', 'evidence_summary']
  ];

  if (!usage.links.length) {
    rows.push([
      school.name,
      fileName,
      'N/A',
      'Supporting evidence',
      'reference',
      getUsageDescription(usage)
    ]);
  } else {
    usage.links.forEach(link => {
      rows.push([
        school.name,
        fileName,
        link.id,
        link.ruleName,
        statusLabel(link.status),
        link.evidence || getUsageDescription(usage)
      ]);
    });
  }

  return rows.map(row => row.map(csvEscape).join(',')).join('\n') + '\n';
}

function buildJsonArtifact(fileName, school, usage) {
  return {
    school: school.name,
    location: school.location,
    artifact: fileName,
    title: getUsageTitle(usage),
    description: getUsageDescription(usage),
    replica: true,
    linked_findings: usage.links.map(link => ({
      requirement_id: link.id,
      rule_name: link.ruleName,
      category: link.category,
      citation: link.citation,
      status: link.status,
      evidence: link.evidence,
      quote: link.quote,
      action: link.action
    }))
  };
}

function buildTextArtifact(fileName, school, usage) {
  const lines = [
    'SCHOOL DEMO EVIDENCE',
    '',
    `School: ${school.name}`,
    `Location: ${school.location}`,
    `Artifact: ${fileName}`,
    `Title: ${getUsageTitle(usage)}`,
    '',
    `Summary: ${getUsageDescription(usage)}`,
    '',
    'Linked findings:'
  ];

  if (!usage.links.length) {
    lines.push('- Supporting document retained for parity with the named demo evidence set.');
  } else {
    usage.links.forEach(link => {
      lines.push(`- ${link.id} | ${link.ruleName} | ${statusLabel(link.status)}`);
      if (link.evidence) {
        lines.push(`  Evidence: ${link.evidence}`);
      }
      if (link.action) {
        lines.push(`  Action: ${link.action}`);
      }
    });
  }

  lines.push('');
  lines.push('Note: This file was regenerated for the school demo and intentionally uses generic school labels.');
  return lines.join('\n');
}

function getUsageTitle(usage) {
  const firstLabel = Array.from(usage.labels)[0];
  return firstLabel || prettyLabelFromFilename(usage.fileName);
}

function getUsageDescription(usage) {
  const firstDescription = Array.from(usage.descriptions)[0];
  if (firstDescription) {
    return firstDescription;
  }
  if (!usage.links.length) {
    return 'Supporting compliance document regenerated for the school demo.';
  }
  const statuses = new Set(usage.links.map(link => statusLabel(link.status)));
  return `Supporting evidence connected to ${usage.links.length} linked finding(s) with statuses: ${Array.from(statuses).join(', ')}.`;
}

function drawPdfHeader(doc, school, title) {
  doc.setFillColor(...school.color);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ComplianceIQ School Demo', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(school.name, 14, 19);
  doc.text(title, 196, 19, { align: 'right', maxWidth: 90 });
  doc.setTextColor(15, 23, 42);
  return 40;
}

function drawMetaTable(doc, startY, rows) {
  let y = startY;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y - 5, 182, rows.length * 7 + 6, 2, 2, 'FD');
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${label}:`, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 64, y, { maxWidth: 126 });
    y += 7;
  });
  return y + 4;
}

function drawSectionTitle(doc, y, text) {
  y = ensurePdfSpace(doc, y, 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(11);
  doc.text(text, 14, y);
  doc.line(14, y + 2, 196, y + 2);
  doc.setTextColor(15, 23, 42);
  return y + 8;
}

function drawParagraph(doc, y, text, x = 14) {
  y = ensurePdfSpace(doc, y, 12);
  const wrapped = doc.splitTextToSize(String(text), 196 - x);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(wrapped, x, y);
  return y + wrapped.length * 5 + 2;
}

function drawBullet(doc, y, text) {
  y = ensurePdfSpace(doc, y, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('-', 14, y);
  doc.setFont('helvetica', 'normal');
  const wrapped = doc.splitTextToSize(String(text), 176);
  doc.text(wrapped, 20, y);
  return y + wrapped.length * 5 + 1;
}

function ensurePdfSpace(doc, y, requiredHeight) {
  if (y + requiredHeight <= 278) {
    return y;
  }
  doc.addPage();
  return 20;
}

function addPdfFooter(doc) {
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 286, 196, 286);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('School evidence summary for Florida private school compliance demo', 14, 291);
    doc.text(`Page ${page} of ${totalPages}`, 196, 291, { align: 'right' });
  }
}

function statusLabel(status) {
  if (status === 'compliant') return 'Fully Compliant';
  if (status === 'partial') return 'Partial';
  if (status === 'non-compliant') return 'Non-Compliant';
  return sanitizeText(status);
}

function prettyLabelFromFilename(fileName) {
  const base = path.basename(fileName, path.extname(fileName));
  return base
    .replace(/_/g, ' ')
    .replace(/\bDh\b/g, 'DH')
    .replace(/\bScf1\b/g, 'SCF1')
    .replace(/\bI20\b/g, 'I-20')
    .replace(/\bMCSA5876\b/g, 'MCSA-5876')
    .trim();
}

function csvEscape(value) {
  const stringValue = String(value == null ? '' : value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function formatSize(bytes) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
