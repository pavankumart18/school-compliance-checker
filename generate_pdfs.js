/**
 * generate_pdfs.js
 * Generates synthetic PDF documents for the ComplianceIQ demo.
 * Run: npm install jspdf && node generate_pdfs.js
 */

const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// ---- Ensure output directories ----
const dirs = [
  path.join(__dirname, 'pdfs', 'north_broward'),
  path.join(__dirname, 'pdfs', 'windermere')
];
dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

// ---- Helpers ----
function header(doc, title, subtitle, schoolName) {
  // Blue header bar
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 19);
  doc.text(schoolName, 196, 12, { align: 'right' });

  // Reset
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  return 36; // y cursor after header
}

function sectionTitle(doc, y, text) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(text, 14, y);
  doc.setDrawColor(59, 130, 246);
  doc.line(14, y + 2, 196, y + 2);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  return y + 8;
}

function fieldRow(doc, y, label, value) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(label + ':', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(value), 70, y);
  return y + 6;
}

function tableHeader(doc, y, cols) {
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  cols.forEach(c => doc.text(c.label, c.x, y));
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  return y + 7;
}

function save(doc, folder, filename) {
  const filePath = path.join(__dirname, 'pdfs', folder, filename);
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, buffer);
  console.log(`  - ${folder}/${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

function evidenceDoc(folder, filename, title, subtitle, schoolName, lines) {
  const doc = new jsPDF();
  let y = header(doc, title, subtitle, schoolName);
  y = sectionTitle(doc, y, 'DOCUMENT SUMMARY');
  lines.forEach(line => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(String(line), 14, y);
    y += 6;
  });
  save(doc, folder, filename);
}

function writeRawFile(folder, filename, content) {
  const filePath = path.join(__dirname, 'pdfs', folder, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  const sizeKb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
  console.log(`  - ${folder}/${filename} (${sizeKb} KB)`);
}

function addDays(dateStr, deltaDays) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d;
}

function mmddyyyy(dateObj) {
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  const yyyy = dateObj.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function drawPagedTableRows(doc, startY, cols, rows, options = {}) {
  const rowHeight = options.rowHeight || 5;
  const bottomY = options.bottomY || 276;
  const statusCol = options.statusCol;
  const statusColorMap = options.statusColorMap || {};

  let y = startY;
  rows.forEach(row => {
    if (y > bottomY) {
      doc.addPage();
      y = tableHeader(doc, 20, cols);
    }

    row.forEach((value, idx) => {
      if (statusCol === idx) {
        const color = statusColorMap[String(value)] || [15, 23, 42];
        doc.setTextColor(color[0], color[1], color[2]);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(String(value), cols[idx].x, y);
    });

    doc.setTextColor(15, 23, 42);
    y += rowHeight;
  });

  return y;
}

function addSurveyFooter(doc, documentId, generatedDate) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Florida Department of Education | Division of Nonpublic School Compliance', 14, 288);
    doc.text(`Document ID: ${documentId} | Generated: ${generatedDate}`, 14, 292);
    doc.text(`Page ${i} of ${totalPages}`, 196, 292, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);
}

function buildAnnualSurveyDocument(cfg) {
  const doc = new jsPDF();
  let y = header(
    doc,
    'PRIVATE SCHOOL ANNUAL SURVEY REPORT',
    'Florida Department of Education | Division of Nonpublic School Compliance',
    cfg.schoolShort
  );

  // Metadata block (top-right)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 42, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DOCUMENT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Document ID', cfg.documentId],
    ['Submission Date', cfg.filingDate],
    ['County', cfg.county + ' County'],
    ['Form Type', 'Annual Survey'],
    ['Citation', 's. 1002.42(2)(b), F.S.']
  ];
  let metaY = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row[1]), 150, metaY);
    metaY += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 84;
  y = sectionTitle(doc, y, 'SECTION 1 - SCHOOL IDENTIFICATION');
  y = fieldRow(doc, y, 'School Name', cfg.schoolName);
  y = fieldRow(doc, y, 'School Code', cfg.schoolCode);
  y = fieldRow(doc, y, 'County', `${cfg.county} County`);
  y = fieldRow(doc, y, 'Principal', cfg.principal);
  y = fieldRow(doc, y, 'Phone', cfg.phone);
  y = fieldRow(doc, y, 'Email', cfg.email);
  doc.setFont('helvetica', 'bold');
  doc.text('School Address:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cfg.addressLine1, 70, y); y += 5;
  doc.text(cfg.addressLine2, 70, y); y += 7;

  y = sectionTitle(doc, y, 'SECTION 2 - INSTITUTIONAL PROFILE');
  const profileCols = [{ label: 'CATEGORY', x: 16 }, { label: 'VALUE', x: 118 }];
  y = tableHeader(doc, y, profileCols);
  const profileRows = [
    ['Academic Year', '2024-2025'],
    ['School Type', 'Independent Private School'],
    ['Grades Served', cfg.gradesServed],
    ['Total Enrollment', `${cfg.totalEnrollment}`],
    ['Full-time Faculty', `${cfg.fullTimeFaculty}`],
    ['Administrative Staff', `${cfg.adminStaff}`],
    ['Part-time Support Staff', `${cfg.supportStaff}`],
    ['Accreditation', cfg.accreditation]
  ];
  profileRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 118, y);
    y += 5;
  });
  y += 3;

  y = sectionTitle(doc, y, 'SECTION 3 - INSTRUCTIONAL CALENDAR SUMMARY');
  const calCols = [{ label: 'FIELD', x: 16 }, { label: 'VALUE', x: 118 }];
  y = tableHeader(doc, y, calCols);
  const calRows = [
    ['First Day of Instruction', cfg.firstDay],
    ['Last Day of Instruction', cfg.lastDay],
    ['Total Instructional Days', String(cfg.instructionalDays)],
    ['Total Instructional Hours', cfg.instructionalHours]
  ];
  calRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 118, y);
    y += 5;
  });
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 4A - NOTARY EXCERPT (FILING PAGE)');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text(`"Sworn and subscribed before me this ${cfg.notaryDayText} - Notary Public ${cfg.notaryName}"`, 18, y + 7, { maxWidth: 174 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Commission No.: ${cfg.notaryCommission} | County: ${cfg.county} | Filed: ${cfg.filingDate}`, 18, y + 14);

  // Page 2: certification + notary
  doc.addPage();
  y = header(
    doc,
    'PRIVATE SCHOOL ANNUAL SURVEY REPORT',
    'Certification and Notary Acknowledgment',
    cfg.schoolShort
  );
  y = 46;

  y = sectionTitle(doc, y, 'SECTION 4 - COMPLIANCE DECLARATION');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 26, 2, 2, 'FD');
  const declarationLines = [
    'I hereby certify that the information provided in this Annual Private School Survey is accurate and complete',
    'to the best of my knowledge. This submission is provided in compliance with Florida Statute s.1002.42(2)(b),',
    'F.S., and all supporting records are maintained in accordance with state compliance guidelines.'
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(declarationLines.join(' '), 18, y + 7, { maxWidth: 174 });
  y += 30;

  y = sectionTitle(doc, y, 'SECTION 5 - ADMINISTRATOR CERTIFICATION');
  y = fieldRow(doc, y, 'Name of Certifying Official', cfg.principal);
  y = fieldRow(doc, y, 'Title', 'Principal / Administrative Director');
  y = fieldRow(doc, y, 'Date Signed', cfg.filingDate);
  y = fieldRow(doc, y, 'Location', `${cfg.county} County, Florida`);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature of Certifying Official:', 14, y);
  doc.setDrawColor(100, 116, 139);
  doc.line(78, y + 1, 178, y + 1);
  y += 10;

  y = sectionTitle(doc, y, 'SECTION 6 - NOTARY ACKNOWLEDGMENT');
  const notaryLines = [
    'State of Florida',
    `County of ${cfg.county}`,
    '',
    `Sworn and subscribed before me this ${cfg.notaryDayText}.`,
    `The foregoing instrument was acknowledged by ${cfg.principal}.`,
    '',
    `Notary Public: ${cfg.notaryName}`,
    `Commission Number: ${cfg.notaryCommission}`,
    `Commission Expiration: ${cfg.notaryExp}`
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  notaryLines.forEach(line => {
    if (!line) { y += 4; return; }
    doc.text(line, 14, y);
    y += 5;
  });
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature of Notary Public:', 14, y);
  doc.line(72, y + 1, 168, y + 1);

  // Seal / deficiency stamp
  if (cfg.notaryPresent) {
    doc.setDrawColor(30, 64, 175);
    doc.setFillColor(219, 234, 254);
    doc.circle(170, 210, 18, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 64, 175);
    doc.text('NOTARY PUBLIC', 170, 203, { align: 'center' });
    doc.text('STATE OF FLORIDA', 170, 207, { align: 'center' });
    doc.text(cfg.notaryName, 170, 211, { align: 'center' });
    doc.text(`# ${cfg.notaryCommission}`, 170, 215, { align: 'center' });
    doc.text('SEAL VERIFIED', 170, 219, { align: 'center' });
  } else {
    doc.setDrawColor(239, 68, 68);
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(148, 194, 44, 32, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text('SEAL', 170, 206, { align: 'center' });
    doc.text('MISSING', 170, 212, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Requires corrective', 170, 218, { align: 'center' });
  }

  // Compliance decision support block
  doc.setTextColor(15, 23, 42);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 232, 182, 34, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('COMPLIANCE DECISION SUPPORT', 18, 239);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Submission Date: ${cfg.filingDate} | Deadline: ${cfg.deadline} | Status: ${cfg.complianceStatus}`, 18, 245);
  doc.text(`Notary Present: ${cfg.notaryPresent ? 'YES' : 'NO'} | Seal: ${cfg.notaryPresent ? cfg.notaryCommission : 'NOT FOUND'}`, 18, 250);
  doc.text(cfg.decisionNarrative, 18, 256, { maxWidth: 174 });

  addSurveyFooter(doc, cfg.documentId, cfg.generatedDate);
  save(doc, cfg.folder, 'Annual_Survey_2025.pdf');
}

// ============================================================
// NORTH BROWARD PDFs
// ============================================================

function nb_AnnualSurvey() {
  buildAnnualSurveyDocument({
    folder: 'north_broward',
    schoolShort: 'North Broward Preparatory',
    schoolName: 'North Broward Preparatory School',
    schoolCode: 'NB-0042',
    county: 'Broward',
    principal: 'Dr. John T. Harrington',
    phone: '(954) 247-0011',
    email: 'admin@northbrowardprep.edu',
    addressLine1: '7600 Lyons Rd',
    addressLine2: 'Coconut Creek, FL 33073',
    gradesServed: 'PK through 12',
    totalEnrollment: 847,
    fullTimeFaculty: 62,
    adminStaff: 18,
    supportStaff: 14,
    accreditation: 'FCIS / Cognia (Active)',
    firstDay: 'August 14, 2024',
    lastDay: 'May 30, 2025',
    instructionalDays: 182,
    instructionalHours: '1088 hours',
    filingDate: 'April 15, 2025',
    deadline: 'May 1, 2025',
    documentId: 'PSAS-2025-NB-0042',
    generatedDate: 'April 15, 2025',
    notaryDayText: '15th day of April, 2025',
    notaryName: 'Maria L. Gomez',
    notaryCommission: 'FL-882',
    notaryExp: 'November 12, 2027',
    notaryPresent: true,
    complianceStatus: 'COMPLIANT',
    decisionNarrative: 'Filed 16 days ahead of deadline with verified notary acknowledgment and valid commission.'
  });
}

function nb_VECHSLog() {
  const doc = new jsPDF();
  let y = header(doc, 'FDLE VECHS Clearance Log', 'Level 2 Background Screening Results', 'North Broward Preparatory');

  y = fieldRow(doc, y, 'Total Staff Screened', '94');
  y = fieldRow(doc, y, 'Screening Provider', 'FDLE / FBI via VECHS Clearinghouse');
  y = fieldRow(doc, y, 'Report Date', 'August 12, 2024');
  y = fieldRow(doc, y, 'Overall Status', 'ALL ELIGIBLE');
  y += 4;

  const cols = [
    { label: '#', x: 14 },
    { label: 'NAME', x: 22 },
    { label: 'ROLE', x: 72 },
    { label: 'SCREENED', x: 110 },
    { label: 'EXPIRES', x: 140 },
    { label: 'STATUS', x: 170 }
  ];
  y = tableHeader(doc, y, cols);

  const firstNames = ['Sofia', 'Mason', 'Liam', 'Ava', 'Noah', 'Isabella', 'Lucas', 'Mia', 'Ethan', 'Amelia', 'James', 'Harper', 'Olivia', 'Elijah', 'Benjamin', 'Charlotte', 'Henry', 'Evelyn', 'Alexander', 'Emily'];
  const lastNames = ['Adams', 'Baker', 'Carter', 'Davis', 'Evans', 'Foster', 'Garcia', 'Hall', 'Ibrahim', 'Jones', 'Kim', 'Lopez', 'Martinez', 'Nguyen', 'Owens', 'Patel', 'Quinn', 'Roberts', 'Singh', 'Turner', 'Underwood', 'Valdez', 'White', 'Xu', 'Young', 'Zimmerman'];
  const roles = ['Teacher - English', 'Teacher - Math', 'Teacher - Science', 'Teacher - History', 'Teacher - Arts', 'Counselor', 'Nurse', 'Admin Assistant', 'Bus Driver', 'Athletics Coach', 'Principal', 'Vice Principal'];

  const staff = [];
  for (let i = 1; i <= 94; i++) {
    let name;
    let role;
    if (i === 1) {
      name = 'Harrington, J.';
      role = 'Principal';
    } else {
      const first = firstNames[i % firstNames.length];
      const last = lastNames[(i * 7) % lastNames.length];
      name = `${last}, ${first.charAt(0)}.`;
      role = roles[i % roles.length];
    }
    const screened = addDays('2020-01-10', (i * 29) % 1750);
    const expires = new Date(screened.getTime());
    expires.setUTCFullYear(expires.getUTCFullYear() + 5);
    staff.push([
      String(i),
      name,
      role,
      mmddyyyy(screened),
      mmddyyyy(expires),
      'Eligible'
    ]);
  }

  staff.forEach(row => {
    if (y > 276) {
      doc.addPage();
      y = tableHeader(doc, 20, cols);
    }
    doc.text(row[0], 14, y);
    doc.text(row[1], 22, y);
    doc.text(row[2], 72, y);
    doc.text(row[3], 110, y);
    doc.text(row[4], 140, y);
    doc.setTextColor(16, 185, 129);
    doc.text(row[5], 170, y);
    doc.setTextColor(15, 23, 42);
    y += 5;
  });

  if (y > 274) {
    doc.addPage();
    y = 20;
  }
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SUMMARY: All 94 instructional and administrative personnel hold current VECHS Eligible status.', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Most recent screening date in file: 12/20/2024 | Oldest valid screening date in file: 01/21/2020', 14, y);

  save(doc, 'north_broward', 'VECHS_Clearance_Log.pdf');
}

function nb_DH684() {
  const doc = new jsPDF();
  const reportId = 'SH-DH680-2025-0415';
  const generatedDate = 'April 15, 2025';
  const summaryLine = 'Student immunization records: 845/847 complete - 2 expired temporary exemptions (Student IDs: 4421, 4587)';

  // Page 1 - Header and school report metadata
  let y = header(
    doc,
    'Student Immunization Compliance Report',
    'DH-680 Certificate Verification | Academic Year 2024-2025',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 46, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('REPORT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['School ID', 'FL-PS-20482'],
    ['County', 'Broward County'],
    ['Enrollment', '847 students'],
    ['Statute', 's.1003.22, F.S.'],
    ['Generated', generatedDate]
  ];
  let metaY = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 149, metaY);
    metaY += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 88;
  y = sectionTitle(doc, y, 'SECTION A - SCHOOL HEALTH OFFICE PROFILE');
  y = fieldRow(doc, y, 'School Name', 'North Broward Preparatory School');
  y = fieldRow(doc, y, 'District', 'Nonpublic School Compliance Region - Southeast');
  y = fieldRow(doc, y, 'Health Coordinator', 'K. Howard, RN');
  y = fieldRow(doc, y, 'Submission Date (DH-684 annual)', 'September 28, 2024');
  y = fieldRow(doc, y, 'Reporting Year', '2024-2025');
  y += 3;

  y = sectionTitle(doc, y, 'SECTION B - ANNUAL REPORT SNAPSHOT (DH-684)');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 26, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Immunization Report - Submission Date: 09/28/2024 - KG Rate: 98.6% - Gr7 Rate: 100%', 18, y + 7, { maxWidth: 174 });
  doc.text('This annual filing summary supports HLT-001 validation and is retained with Blue Card verification records.', 18, y + 14, { maxWidth: 174 });

  // Page 2 - Statutory requirement
  doc.addPage();
  y = header(
    doc,
    'Student Immunization Compliance Report',
    'Statutory Requirement and Validation Scope',
    'North Broward Preparatory'
  );
  y = 48;

  y = sectionTitle(doc, y, 'SECTION 1 - STATUTORY REQUIREMENT');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Florida Statute s.1003.22 requires all students attending school to present a valid Florida Certificate of Immunization (Form DH-680). Students entering Grade 7 must have documentation of the Tdap booster vaccine. Temporary medical exemptions may be granted but must remain current through the expiration date listed on the certificate.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 24;

  y = sectionTitle(doc, y, 'SECTION 1A - AUDIT SCOPE');
  const scopeCols = [
    { label: 'CONTROL', x: 16 },
    { label: 'REQUIREMENT', x: 50 },
    { label: 'DATA SOURCE', x: 142 }
  ];
  y = tableHeader(doc, y, scopeCols);
  const scopeRows = [
    ['IMM-01', 'Valid DH-680 record on file for every active student', 'SIS health module'],
    ['IMM-02', 'Grade 7 Tdap booster documented', 'Nurse verification log'],
    ['IMM-03', 'Temporary exemptions not expired', 'DH-680 Part B status'],
    ['IMM-04', 'Exceptions escalated with family follow-up', 'Health office action log']
  ];
  scopeRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 50, y, { maxWidth: 88 });
    doc.text(row[2], 142, y, { maxWidth: 50 });
    y += 8;
  });
  y += 2;

  y = sectionTitle(doc, y, 'SECTION 1B - DATA EXTRACTION NOTES');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 31, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Data pull date: April 15, 2025 | Source: Student Information System (SIS) health records table.', 18, y + 7);
  doc.text('Population included: all active students (847) with enrollment status = Active.', 18, y + 13);
  doc.text('Record-level checks include certificate validity date, exemption status, and grade-specific requirements.', 18, y + 19, { maxWidth: 174 });
  doc.text('Output retained under report ID SH-DH680-2025-0415.', 18, y + 25);

  // Page 3 - Grade-level overview
  doc.addPage();
  y = header(
    doc,
    'Student Immunization Compliance Report',
    'Grade-Level Immunization Overview',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - IMMUNIZATION RECORD SUMMARY BY GRADE');
  const gradeCols = [
    { label: 'GRADE', x: 16 },
    { label: 'STUDENTS', x: 44 },
    { label: 'VALID DH-680', x: 76 },
    { label: 'TEMP EXEMPT', x: 120 },
    { label: 'STATUS', x: 164 }
  ];
  y = tableHeader(doc, y, gradeCols);
  const gradeRows = [
    ['K', '58', '58', '0', 'PASS'],
    ['1', '61', '61', '0', 'PASS'],
    ['2', '65', '65', '0', 'PASS'],
    ['3', '69', '69', '0', 'PASS'],
    ['4', '73', '73', '0', 'PASS'],
    ['5', '79', '79', '0', 'PASS'],
    ['6', '87', '87', '0', 'PASS'],
    ['7', '82', '80', '2', 'REVIEW'],
    ['8', '79', '79', '0', 'PASS'],
    ['9-12', '194', '194', '0', 'PASS']
  ];
  gradeRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 44, y);
    doc.text(row[2], 76, y);
    doc.text(row[3], 120, y);
    doc.setTextColor(row[4] === 'REVIEW' ? 245 : 22, row[4] === 'REVIEW' ? 158 : 163, row[4] === 'REVIEW' ? 11 : 74);
    doc.setFont('helvetica', row[4] === 'REVIEW' ? 'bold' : 'normal');
    doc.text(row[4], 164, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });
  y += 4;
  y = fieldRow(doc, y, 'Total Students Enrolled', '847');
  y = fieldRow(doc, y, 'Total Valid DH-680', '845');
  y = fieldRow(doc, y, 'Temporary Exemptions (Current + Expired)', '2');

  // Page 4 - Compliance summary (card reference)
  doc.addPage();
  y = header(
    doc,
    'Student Immunization Compliance Report',
    'Compliance Summary (Card Evidence)',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - STUDENT IMMUNIZATION COMPLIANCE SUMMARY');
  y = fieldRow(doc, y, 'Total Students Enrolled', '847');
  y = fieldRow(doc, y, 'Students with Valid DH-680 Records', '845');
  y = fieldRow(doc, y, 'Students with Expired Temporary Exemptions', '2');
  y = fieldRow(doc, y, 'Students Missing Records', '0');
  y += 4;

  doc.setDrawColor(251, 191, 36);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y - 1, 182, 21, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(8.5);
  doc.text(summaryLine, 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);
  y += 28;

  y = sectionTitle(doc, y, 'RISK FLAG');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Two student exemption records expired within the last 45 days. Affected records are currently in grace follow-up and require updated DH-680 or permanent exemption documentation.', 18, y + 7, { maxWidth: 174 });
  doc.text('Current card status: PARTIAL COMPLIANT', 18, y + 18);

  // Page 5 - Student detail table
  doc.addPage();
  y = header(
    doc,
    'Student Immunization Compliance Report',
    'Student Detail - Expired Temporary Exemptions',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 4 - STUDENTS WITH EXPIRED TEMPORARY EXEMPTIONS');
  const detCols = [
    { label: 'STUDENT ID', x: 16 },
    { label: 'STUDENT NAME', x: 48 },
    { label: 'GRADE', x: 94 },
    { label: 'EXEMPTION TYPE', x: 112 },
    { label: 'EXPIRATION', x: 162 }
  ];
  y = tableHeader(doc, y, detCols);
  const detailRows = [
    ['4421', 'Sofia Rivera', '7', 'Temporary Medical', 'Mar 1, 2025'],
    ['4587', 'Ethan Brooks', '7', 'Temporary Medical', 'Feb 27, 2025']
  ];
  detailRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 48, y);
    doc.text(row[2], 94, y);
    doc.text(row[3], 112, y);
    doc.text(row[4], 162, y);
    y += 6;
  });
  y += 5;
  y = fieldRow(doc, y, 'Status', 'Expired within last 45 days');
  y = fieldRow(doc, y, 'Required Action', 'Updated DH-680 or permanent exemption required');
  y = fieldRow(doc, y, 'Case Owner', 'Student Health Office');

  // Page 6 - Follow-up actions
  doc.addPage();
  y = header(
    doc,
    'Student Immunization Compliance Report',
    'Corrective Action and Follow-Up Log',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 5 - REQUIRED FOLLOW-UP ACTIONS');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Two students currently have expired temporary medical exemptions recorded on their DH-680 forms.', 14, y, { maxWidth: 182 });
  y += 10;
  doc.text('1. Contact parents or guardians of affected students.', 18, y); y += 6;
  doc.text('2. Obtain updated DH-680 certificate or permanent medical exemption.', 18, y); y += 6;
  doc.text('3. Update student health records within 5 school days.', 18, y); y += 9;

  y = sectionTitle(doc, y, 'ACTION TRACKING TABLE');
  const actCols = [
    { label: 'STUDENT ID', x: 16 },
    { label: 'OUTREACH DATE', x: 52 },
    { label: 'DOC REQUESTED', x: 92 },
    { label: 'DEADLINE', x: 136 },
    { label: 'STATUS', x: 170 }
  ];
  y = tableHeader(doc, y, actCols);
  const actionRows = [
    ['4421', 'Apr 15, 2025', 'Updated DH-680', 'Apr 22, 2025', 'OPEN'],
    ['4587', 'Apr 15, 2025', 'Updated DH-680', 'Apr 22, 2025', 'OPEN']
  ];
  actionRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 52, y);
    doc.text(row[2], 92, y);
    doc.text(row[3], 136, y);
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(row[4], 170, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });
  y += 6;
  y = fieldRow(doc, y, 'Responsible Department', 'Student Health Office');
  y = fieldRow(doc, y, 'Review Deadline', 'April 22, 2025');

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Student Health Services', 14, 288);
    doc.text(`Report ID: ${reportId}`, 14, 292);
    doc.text(`Generated: ${generatedDate}`, 100, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);

  save(doc, 'north_broward', 'DH684_Immunization_Report.pdf');
}

function nb_FireSafety() {
  const doc = new jsPDF();
  let y = header(doc, 'Annual Fire Safety Inspection Report', 'Florida State Fire Marshal â€” FFPC/NFPA 101', 'North Broward Preparatory');

  y = fieldRow(doc, y, 'Facility', 'North Broward Preparatory School â€” Main Campus');
  y = fieldRow(doc, y, 'Address', '7600 Lyons Rd, Coconut Creek, FL 33073');
  y = fieldRow(doc, y, 'Inspection Date', 'January 23, 2025');
  y = fieldRow(doc, y, 'Inspector', 'Fire Marshal D. Rivera, Badge #FM-4418');
  y = fieldRow(doc, y, 'Inspection Type', 'Annual Educational Facility (Group E)');
  y += 4;

  y = sectionTitle(doc, y, 'INSPECTION RESULTS');
  y = fieldRow(doc, y, 'Total Violations Found', '0');
  y = fieldRow(doc, y, 'Fire Alarm System', 'Operational â€” Tested');
  y = fieldRow(doc, y, 'Sprinkler System', 'Operational â€” Last service Nov 2024');
  y = fieldRow(doc, y, 'Emergency Exits', 'All clear and properly marked');
  y = fieldRow(doc, y, 'Fire Extinguishers', '47 units â€” All tags current');
  y = fieldRow(doc, y, 'Evacuation Routes', 'Posted in all classrooms and hallways');
  y += 4;

  y = sectionTitle(doc, y, 'DETERMINATION');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('PASS â€” No Violations', 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  y += 6;
  y = fieldRow(doc, y, 'Certificate Valid Through', 'January 23, 2026');
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Signed: D. Rivera, State Fire Marshal â€” Broward County Fire Rescue', 14, y);

  save(doc, 'north_broward', 'Fire_Safety_Inspection.pdf');
}

function nb_TeacherQual() {
  const doc = new jsPDF();
  let y = header(doc, 'Teacher Qualification Records', 'Faculty Credential Summary - 2024-25', 'North Broward Preparatory');

  y = fieldRow(doc, y, 'Total Instructional Staff', '62');
  y = fieldRow(doc, y, "Bachelor's Degree Holders", '58');
  y = fieldRow(doc, y, 'Experience-Qualified (3yr+)', '3');
  y = fieldRow(doc, y, 'Special Skills Attestation', '1 (Native French - Language Dept.)');
  y = fieldRow(doc, y, 'Qualification Gate', 'PASSED - 62/62');
  y += 4;

  const cols = [
    { label: '#', x: 14 },
    { label: 'NAME', x: 22 },
    { label: 'SUBJECT', x: 65 },
    { label: 'DEGREE', x: 105 },
    { label: 'EXP (YRS)', x: 145 },
    { label: 'STATUS', x: 172 }
  ];
  y = tableHeader(doc, y, cols);

  const lastNames = ['Adams', 'Borowski', 'Chen', 'Dupont', 'Ellis', 'Garcia', 'Hoffman', 'Ivanova', 'Johnson', 'Khan', 'Lopez', 'Morgan', 'Nelson', 'Ortiz', 'Patel', 'Quincy', 'Ruiz', 'Singh', 'Taylor', 'Usman', 'Vega', 'Williams', 'Xu', 'Young', 'Zimmer'];
  const subjects = ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Computer Science', 'Spanish', 'French', 'Music', 'Physical Ed.', 'Economics', 'Art'];
  const degrees = ['B.A. - UF', 'B.S. - UCF', 'M.S. - FIU', 'B.A. - FSU', 'M.Ed. - USF', 'B.S. - FAU'];

  const teachers = [];
  for (let i = 1; i <= 62; i++) {
    const name = `${lastNames[i % lastNames.length]}, ${String.fromCharCode(65 + (i % 26))}.`;
    const subject = subjects[i % subjects.length];
    const degree = i === 14 ? 'Special Skills' : degrees[i % degrees.length];
    const expYears = String(2 + (i % 19));
    teachers.push([String(i), name, subject, degree, expYears, 'Qualified']);
  }

  teachers.forEach(row => {
    if (y > 276) {
      doc.addPage();
      y = tableHeader(doc, 20, cols);
    }
    doc.text(row[0], 14, y);
    doc.text(row[1], 22, y);
    doc.text(row[2], 65, y);
    doc.text(row[3], 105, y);
    doc.text(row[4], 145, y);
    doc.setTextColor(16, 185, 129);
    doc.text(row[5], 172, y);
    doc.setTextColor(15, 23, 42);
    y += 5;
  });

  if (y > 274) {
    doc.addPage();
    y = 20;
  }
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total instructional staff: 62 - Qualification gate: PASSED', 14, y);
  y += 5;
  doc.text('Bachelor degree holders: 58, Exp-qualified: 3, Special Skills: 1', 14, y);

  save(doc, 'north_broward', 'Teacher_Qualifications.pdf');
}

function nb_SEVISI20() {
  const doc = new jsPDF();
  let y = header(doc, 'SEVIS I-20 Master Log', 'International Student Status Report', 'North Broward Preparatory');

  y = fieldRow(doc, y, 'PDSO', 'Dr. R. Patel');
  y = fieldRow(doc, y, 'School SEVIS Code', 'LOS214F01234');
  y = fieldRow(doc, y, 'Total I-20s on File', '78');
  y = fieldRow(doc, y, 'All Status Active', 'YES');
  y = fieldRow(doc, y, 'Term Registration', 'Jan 9, 2025 (3 days from term start)');
  y += 4;

  const cols = [
    { label: '#', x: 14 },
    { label: 'STUDENT ID', x: 22 },
    { label: 'SEVIS ID', x: 48 },
    { label: 'COUNTRY', x: 88 },
    { label: 'PROGRAM END', x: 118 },
    { label: 'STATUS', x: 155 }
  ];
  y = tableHeader(doc, y, cols);

  const countries = ['Brazil', 'China', 'South Korea', 'Germany', 'Nigeria', 'India', 'Colombia', 'Japan', 'France', 'Italy', 'Mexico', 'Spain'];
  const students = [];
  for (let i = 1; i <= 78; i++) {
    const studentId = `STU-${String(400 + i).padStart(4, '0')}`;
    const sevisId = `N00123${String(400000 + i).padStart(6, '0')}`;
    const country = countries[i % countries.length];
    const programEnd = addDays('2025-06-30', (i % 6) * 160);
    students.push([String(i), studentId, sevisId, country, mmddyyyy(programEnd), 'Active']);
  }

  students.forEach(row => {
    if (y > 276) {
      doc.addPage();
      y = tableHeader(doc, 20, cols);
    }
    doc.text(row[0], 14, y);
    doc.text(row[1], 22, y);
    doc.text(row[2], 48, y);
    doc.text(row[3], 88, y);
    doc.text(row[4], 118, y);
    doc.setTextColor(16, 185, 129);
    doc.text(row[5], 155, y);
    doc.setTextColor(15, 23, 42);
    y += 5;
  });

  if (y > 274) {
    doc.addPage();
    y = 20;
  }
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SEVIS Active I-20s: 78/78 - All Program_End_Date > 02/18/2025', 14, y);

  save(doc, 'north_broward', 'SEVIS_I20_Log.pdf');
}

// ============================================================
// WINDERMERE PDFs
// ============================================================

function wm_AnnualSurvey() {
  buildAnnualSurveyDocument({
    folder: 'windermere',
    schoolShort: 'Windermere Preparatory',
    schoolName: 'Windermere Preparatory School',
    schoolCode: 'WM-0187',
    county: 'Orange',
    principal: 'Dr. Laura K. Simmons',
    phone: '(407) 905-1938',
    email: 'admin@windermereprep.edu',
    addressLine1: '6189 Winter Garden-Vineland Rd',
    addressLine2: 'Windermere, FL 34786',
    gradesServed: 'PK through 12',
    totalEnrollment: 623,
    fullTimeFaculty: 49,
    adminStaff: 12,
    supportStaff: 8,
    accreditation: 'FCIS / Cognia (Active)',
    firstDay: 'August 12, 2024',
    lastDay: 'May 28, 2025',
    instructionalDays: 180,
    instructionalHours: '1065 hours',
    filingDate: 'May 3, 2025',
    deadline: 'May 1, 2025',
    documentId: 'PSAS-2025-WM-0187',
    generatedDate: 'May 3, 2025',
    notaryDayText: '3rd day of May, 2025',
    notaryName: 'Not provided on filing',
    notaryCommission: 'N/A',
    notaryExp: 'N/A',
    notaryPresent: false,
    complianceStatus: 'NON-COMPLIANT',
    decisionNarrative: 'Filed 2 days after deadline and missing notary seal/commission details required by statute.'
  });
}

function wm_VECHSLog() {
  const doc = new jsPDF();
  let y = header(doc, 'FDLE VECHS Clearance Log', 'Level 2 Background Screening Results', 'Windermere Preparatory');

  y = fieldRow(doc, y, 'Total Staff Screened', '47');
  y = fieldRow(doc, y, 'Screening Provider', 'FDLE / FBI via VECHS Clearinghouse');
  y = fieldRow(doc, y, 'Report Date', 'September 5, 2024');
  y = fieldRow(doc, y, 'Overall Status', '1 EXPIRED - ACTION REQUIRED');
  y += 4;

  const cols = [
    { label: '#', x: 14 },
    { label: 'NAME', x: 22 },
    { label: 'ROLE', x: 72 },
    { label: 'SCREENED', x: 110 },
    { label: 'EXPIRES', x: 140 },
    { label: 'STATUS', x: 170 }
  ];
  y = tableHeader(doc, y, cols);

  const firstNames = ['Riley', 'Dakota', 'Parker', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Skyler', 'Reese', 'Avery', 'Hayden', 'Quinn'];
  const lastNames = ['Baker', 'Collins', 'Davis', 'Evans', 'Foster', 'Garcia', 'Hall', 'Irwin', 'Jackson', 'Kim', 'Lopez', 'Miller', 'Nolan', 'Owens', 'Perez', 'Quintero', 'Reed', 'Santos', 'Turner', 'Valdez'];
  const roles = ['Teacher - English', 'Teacher - Math', 'Teacher - Science', 'Teacher - History', 'Teacher - Arts', 'Counselor', 'Admin Assistant', 'Bus Driver', 'Athletics Coach'];

  const staff = [];
  for (let i = 1; i <= 47; i++) {
    if (i === 4) {
      staff.push(['4', 'Martinez, J.', 'Phys. Ed.', '06/10/2019', '06/10/2024', 'EXPIRED']);
      continue;
    }
    const name = `${lastNames[i % lastNames.length]}, ${firstNames[i % firstNames.length].charAt(0)}.`;
    const role = i === 1 ? 'Principal' : roles[i % roles.length];
    const screened = addDays('2020-04-15', (i * 31) % 1500);
    const expires = new Date(screened.getTime());
    expires.setUTCFullYear(expires.getUTCFullYear() + 5);
    staff.push([
      String(i),
      name,
      role,
      mmddyyyy(screened),
      mmddyyyy(expires),
      'Eligible'
    ]);
  }

  staff.forEach(row => {
    if (y > 276) {
      doc.addPage();
      y = tableHeader(doc, 20, cols);
    }
    doc.text(row[0], 14, y);
    doc.text(row[1], 22, y);
    doc.text(row[2], 72, y);
    doc.text(row[3], 110, y);
    doc.text(row[4], 140, y);
    if (row[5] === 'EXPIRED') {
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(row[5], 170, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 5;
  });

  if (y > 274) {
    doc.addPage();
    y = 20;
  }
  y += 6;
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ALERT: J. Martinez - Last screened June 2019 (5yr 8mo ago).', 14, y); y += 5;
  doc.text('Exceeded 5-year renewal limit. Must be removed from student contact duties.', 14, y);
  doc.setTextColor(15, 23, 42);

  save(doc, 'windermere', 'VECHS_Clearance_Log.pdf');
}

function wm_DH684() {
  const doc = new jsPDF();
  let y = header(doc, 'Form DH-684 Immunization Compliance Report', 'Florida Dept. of Health â€” Annual School Report', 'Windermere Preparatory');

  y = fieldRow(doc, y, 'School Name', 'Windermere Preparatory School');
  y = fieldRow(doc, y, 'County', 'Orange');
  y = fieldRow(doc, y, 'Submission Date', 'October 1, 2024');
  y = fieldRow(doc, y, 'Reporting Year', '2024-2025');
  y += 4;

  y = sectionTitle(doc, y, 'KINDERGARTEN IMMUNIZATION STATUS');
  y = fieldRow(doc, y, 'Students Enrolled (K)', '48');
  y = fieldRow(doc, y, 'Fully Immunized', '47');
  y = fieldRow(doc, y, 'Temporary Exemption', '1');
  y = fieldRow(doc, y, 'Compliance Rate', '97.9%');
  y += 4;

  y = sectionTitle(doc, y, '7TH GRADE IMMUNIZATION STATUS');
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('*** SECTION NOT COMPLETED ***', 14, y); y += 6;
  doc.setFontSize(9);
  doc.text('Grade 7 immunization data was NOT included in this submission.', 14, y); y += 5;
  doc.text('Tdap compliance data for 7th grade is MISSING.', 14, y); y += 5;
  doc.text('This form is INCOMPLETE per Rule 64D-3.046.', 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');

  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Submitted by admin office â€” Grade 7 data not available at time of filing.', 14, y);

  save(doc, 'windermere', 'DH684_Immunization_Report.pdf');
}

function wm_FireSafety() {
  const doc = new jsPDF();
  let y = header(doc, 'Annual Fire Safety Inspection Report', 'Florida State Fire Marshal â€” FFPC/NFPA 101', 'Windermere Preparatory');

  y = fieldRow(doc, y, 'Facility', 'Windermere Preparatory School â€” Main Campus');
  y = fieldRow(doc, y, 'Address', '6189 Winter Garden-Vineland Rd, Windermere, FL 34786');
  y = fieldRow(doc, y, 'Inspection Date', 'February 8, 2025');
  y = fieldRow(doc, y, 'Inspector', 'Fire Marshal A. Thompson, Badge #FM-5502');
  y = fieldRow(doc, y, 'Inspection Type', 'Annual Educational Facility (Group E)');
  y += 4;

  y = sectionTitle(doc, y, 'INSPECTION RESULTS');
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  y = fieldRow(doc, y, 'Total Violations Found', '2');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');

  y += 2;
  y = sectionTitle(doc, y, 'VIOLATION #1');
  y = fieldRow(doc, y, 'Location', 'Building C â€” Stairwell B-C3');
  y = fieldRow(doc, y, 'Description', 'Blocked egress â€” storage boxes obstructing stairwell exit');
  y = fieldRow(doc, y, 'Severity', 'Minor â€” Correctable');
  y = fieldRow(doc, y, 'Deadline', 'Within 30 days of inspection');
  y += 2;

  y = sectionTitle(doc, y, 'VIOLATION #2');
  y = fieldRow(doc, y, 'Location', 'Gymnasium â€” Unit #GYM-12');
  y = fieldRow(doc, y, 'Description', 'Expired fire extinguisher inspection tag (last tag: July 2024)');
  y = fieldRow(doc, y, 'Severity', 'Minor â€” Correctable');
  y = fieldRow(doc, y, 'Deadline', 'Within 30 days of inspection');
  y += 4;

  y = sectionTitle(doc, y, 'DETERMINATION');
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CONDITIONAL â€” Reinspection Required', 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Signed: A. Thompson, State Fire Marshal â€” Orange County Fire Rescue', 14, y);

  save(doc, 'windermere', 'Fire_Safety_Inspection.pdf');
}

function wm_TeacherQual() {
  const doc = new jsPDF();
  let y = header(doc, 'Teacher Qualification Records', 'Faculty Credential Summary - 2024-25', 'Windermere Preparatory');

  y = fieldRow(doc, y, 'Total Instructional Staff', '47');
  y = fieldRow(doc, y, "Bachelor's Degree Holders", '41');
  y = fieldRow(doc, y, 'Experience-Qualified (3yr+)', '3');
  y = fieldRow(doc, y, 'Pending Documentation', '3');
  y = fieldRow(doc, y, 'Qualification Gate', '44/47 - 3 PENDING');
  y += 4;

  const cols = [
    { label: '#', x: 14 },
    { label: 'NAME', x: 22 },
    { label: 'SUBJECT', x: 65 },
    { label: 'DEGREE', x: 105 },
    { label: 'EXP (YRS)', x: 145 },
    { label: 'STATUS', x: 172 }
  ];
  y = tableHeader(doc, y, cols);

  const lastNames = ['Baker', 'Collins', 'Rodriguez', 'Kim', 'Davis', 'Garcia', 'Hall', 'Lee', 'Morgan', 'Nolan', 'Ortiz', 'Perez', 'Quinn', 'Reed', 'Santos', 'Turner', 'Valdez', 'White', 'Xu', 'Young'];
  const subjects = ['English', 'Mathematics', 'History', 'Science', 'Art', 'Spanish', 'Chemistry', 'Music', 'Economics', 'Computer Science', 'Physical Ed.'];
  const degrees = ['B.A. - UCF', 'M.S. - USF', 'B.S. - UF', 'M.Ed. - FIU', 'B.A. - Rollins'];

  const teachers = [];
  for (let i = 1; i <= 47; i++) {
    const last = lastNames[i % lastNames.length];
    const initials = String.fromCharCode(65 + (i % 26));
    const name = `${last}, ${initials}.`;
    const subject = subjects[i % subjects.length];
    const expYears = String(1 + (i % 16));

    if (i === 3 || i === 4 || i === 5) {
      teachers.push([String(i), name, subject, '(No transcript)', expYears, 'PENDING']);
    } else {
      teachers.push([String(i), name, subject, degrees[i % degrees.length], expYears, 'Qualified']);
    }
  }

  teachers.forEach(row => {
    if (y > 276) {
      doc.addPage();
      y = tableHeader(doc, 20, cols);
    }
    doc.text(row[0], 14, y);
    doc.text(row[1], 22, y);
    doc.text(row[2], 65, y);
    doc.text(row[3], 105, y);
    doc.text(row[4], 145, y);
    if (row[5] === 'PENDING') {
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(row[5], 172, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 5;
  });

  if (y > 274) {
    doc.addPage();
    y = 20;
  }
  y += 6;
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3 teachers missing credential documentation. Transcripts or experience', 14, y); y += 5;
  doc.text('verification letters required within 30 days.', 14, y);
  doc.setTextColor(15, 23, 42);

  save(doc, 'windermere', 'Teacher_Qualifications.pdf');
}

function wm_SCF1() {
  const doc = new jsPDF();
  let y = header(doc, 'Scholarship Compliance Form (IEPC SCF-1)', 'Step Up For Students â€” Annual Filing', 'Windermere Preparatory');

  y = sectionTitle(doc, y, 'SCHOOL INFORMATION');
  y = fieldRow(doc, y, 'School Name', 'Windermere Preparatory School');
  y = fieldRow(doc, y, 'SFO School ID', 'WM-SFO-2024-187');
  y = fieldRow(doc, y, 'County', 'Orange');
  y = fieldRow(doc, y, 'Scholarship Students', '118');
  y += 4;

  y = sectionTitle(doc, y, 'SUBMISSION DETAILS');
  y = fieldRow(doc, y, 'Submission Date', 'March 8, 2025');
  y = fieldRow(doc, y, 'Required Deadline', 'March 1, 2025');

  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  y = fieldRow(doc, y, 'Filing Status', 'LATE â€” 7 days past deadline');
  y += 2;
  doc.setFontSize(9);
  doc.text('This form was received after the March 1st statutory deadline.', 14, y); y += 5;
  doc.text('SFO Portal shows LATE flag on submission record.', 14, y); y += 5;
  doc.text('Risk: Scholarship payment suspension for enrolled students.', 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');

  y += 8;
  y = sectionTitle(doc, y, 'SCHOLARSHIP BREAKDOWN');
  y = fieldRow(doc, y, 'FTC Scholarship', '72 students');
  y = fieldRow(doc, y, 'FES-UA Scholarship', '31 students');
  y = fieldRow(doc, y, 'Step Up for Students', '15 students');
  y = fieldRow(doc, y, 'Total', '118 students');

  y += 6;
  y = fieldRow(doc, y, 'IEPC Confirmation #', 'FL-2025-LATE-0187');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  y += 4;
  doc.text('Submitted by: Admin Office â€” Contact SFO at (877) 880-4994 for corrective action.', 14, y);

  save(doc, 'windermere', 'SCF1_Scholarship_Form.pdf');
}

function nbNotarySealVerificationDoc() {
  const doc = new jsPDF();
  let y = header(
    doc,
    'NOTARY SEAL VERIFICATION MEMORANDUM',
    'Annual Survey Filing Authentication Record',
    'North Broward Preparatory'
  );

  y = sectionTitle(doc, y, 'CASE IDENTIFICATION');
  y = fieldRow(doc, y, 'School Name', 'North Broward Preparatory School');
  y = fieldRow(doc, y, 'Related Filing', 'Annual_Survey_2025.pdf');
  y = fieldRow(doc, y, 'Filing Date', 'April 15, 2025');
  y = fieldRow(doc, y, 'Deadline', 'May 1, 2025');
  y = fieldRow(doc, y, 'Prepared By', 'Compliance Operations Unit');
  y += 3;

  y = sectionTitle(doc, y, 'VERIFICATION CHECKPOINTS');
  const cols = [
    { label: 'CHECKPOINT', x: 16 },
    { label: 'OBSERVATION', x: 88 },
    { label: 'STATUS', x: 172 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['Survey filing date legible', 'Date reads Apr 15, 2025 on signature block', 'PASS'],
    ['Notary declaration text present', 'Sworn language appears with date and county', 'PASS'],
    ['Notary identity present', 'Maria L. Gomez listed as notary public', 'PASS'],
    ['Commission number visible', 'Seal and line item show FL-882', 'PASS'],
    ['Commission active on filing date', 'Expiration Nov 12, 2027 exceeds filing date', 'PASS']
  ];
  y = drawPagedTableRows(doc, y, cols, rows, {
    statusCol: 2,
    statusColorMap: { PASS: [22, 163, 74] }
  });

  y += 3;
  y = sectionTitle(doc, y, 'EXTRACTED NOTARY TEXT (PAGE 1)');
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y - 1, 182, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text('"Sworn and subscribed before me this 15th day of April, 2025 - Notary Public Maria L. Gomez"', 18, y + 7, { maxWidth: 174 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('County seal visible at lower-right corner of survey page. Seal imprint: FL-882.', 18, y + 13);
  y += 24;

  y = sectionTitle(doc, y, 'VERIFICATION OFFICER CERTIFICATION');
  y = fieldRow(doc, y, 'Officer', 'J. Mercer, Senior Compliance Analyst');
  y = fieldRow(doc, y, 'Review Timestamp', 'April 15, 2025 17:42 ET');
  y = fieldRow(doc, y, 'Result', 'Notary seal and declaration verified');
  doc.setFont('helvetica', 'bold');
  doc.text('Officer Signature:', 14, y + 3);
  doc.line(48, y + 4, 116, y + 4);

  doc.setDrawColor(30, 64, 175);
  doc.setFillColor(219, 234, 254);
  doc.circle(166, 246, 16, 'FD');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(6.5);
  doc.text('NOTARY VERIFIED', 166, 242, { align: 'center' });
  doc.text('FL-882', 166, 246, { align: 'center' });
  doc.text('APR 15 2025', 166, 250, { align: 'center' });
  doc.setTextColor(15, 23, 42);

  addSurveyFooter(doc, 'NSV-2025-NB-0042', 'April 15, 2025');
  save(doc, 'north_broward', 'Notary_Seal_Verification_Apr15_2025.pdf');
}

function nbSurveyRuleSnapshotDoc() {
  const doc = new jsPDF();
  let y = header(
    doc,
    'ANNUAL SURVEY RULE SNAPSHOT',
    'Florida Statute Reference for Demo Evidence',
    'North Broward Preparatory'
  );

  y = sectionTitle(doc, y, 'STATUTE REFERENCE');
  y = fieldRow(doc, y, 'Citation', 's. 1002.42(2)(b), F.S.');
  y = fieldRow(doc, y, 'Rule Name', 'Notarized Annual Private School Survey');
  y = fieldRow(doc, y, 'Regulator', 'Florida Department of Education');
  y = fieldRow(doc, y, 'Applicability', 'All registered private schools in Florida');
  y += 3;

  y = sectionTitle(doc, y, 'REQUIREMENT MATRIX');
  const reqCols = [
    { label: 'CONTROL', x: 16 },
    { label: 'REQUIREMENT DETAIL', x: 60 },
    { label: 'EVIDENCE TARGET', x: 142 }
  ];
  y = tableHeader(doc, y, reqCols);
  const reqRows = [
    ['RS-01', 'Annual survey submitted by May 1 each year', 'Submission date'],
    ['RS-02', 'Filing must include sworn declaration', 'Notary text block'],
    ['RS-03', 'Notary public identity and commission visible', 'Name + seal number'],
    ['RS-04', 'Document retained with submission metadata', 'Document ID + county']
  ];
  reqRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 60, y, { maxWidth: 78 });
    doc.text(row[2], 142, y, { maxWidth: 50 });
    y += 8;
  });
  y += 2;

  y = sectionTitle(doc, y, 'EVALUATION LOGIC');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 19, 2, 2, 'FD');
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('COMPLIANT if (Submission_Date <= May_1) AND (Notary_Declaration = TRUE) AND (Commission_Number != null)', 18, y + 7, { maxWidth: 174 });
  doc.text('Else status = NON_COMPLIANT with corrective filing action required.', 18, y + 13);
  y += 25;

  y = sectionTitle(doc, y, '2025 CASE OUTCOME - NORTH BROWARD');
  y = fieldRow(doc, y, 'Submission Date', 'April 15, 2025');
  y = fieldRow(doc, y, 'Notary Status', 'Present - Maria L. Gomez (#FL-882)');
  y = fieldRow(doc, y, 'Decision', 'COMPLIANT');
  y = fieldRow(doc, y, 'Lead Time to Deadline', '16 days ahead of May 1 deadline');

  addSurveyFooter(doc, 'RULE-ADM001-FLDOE', 'April 15, 2025');
  save(doc, 'north_broward', 'Private_School_Annual_Survey_Rule.pdf');
}

function teacherContractLongForm(cfg) {
  const doc = new jsPDF();
  let y = header(
    doc,
    'INSTRUCTIONAL STAFF EMPLOYMENT AGREEMENT',
    'Human Resources Contract Record',
    cfg.schoolShort
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 44, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CONTRACT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Contract ID', cfg.contractId],
    ['Employee ID', cfg.employeeId],
    ['Term', `${cfg.termStart} to ${cfg.termEnd}`],
    ['School Code', cfg.schoolCode],
    ['County', `${cfg.county} County`]
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 150, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 84;
  y = sectionTitle(doc, y, 'SECTION 1 - EMPLOYEE APPOINTMENT');
  y = fieldRow(doc, y, 'Employee Name', cfg.teacherName);
  y = fieldRow(doc, y, 'Position', cfg.position);
  y = fieldRow(doc, y, 'Department', cfg.department);
  y = fieldRow(doc, y, 'Employment Type', cfg.employmentType);
  y = fieldRow(doc, y, 'FTE', cfg.fte);
  y = fieldRow(doc, y, 'Primary Campus', cfg.campus);
  y += 3;

  y = sectionTitle(doc, y, 'SECTION 2 - CONTRACT TERMS');
  const termCols = [
    { label: 'TERM FIELD', x: 16 },
    { label: 'VALUE', x: 108 },
    { label: 'REFERENCE', x: 160 }
  ];
  y = tableHeader(doc, y, termCols);
  const termRows = [
    ['Start Date', cfg.termStart, 'Clause 2.1'],
    ['End Date', cfg.termEnd, 'Clause 2.2'],
    ['Base Annual Salary', cfg.annualSalary, 'Clause 4.1'],
    ['Pay Frequency', 'Bi-weekly (26 pay periods)', 'Clause 4.2'],
    ['Work Calendar', cfg.workCalendar, 'Clause 5.1'],
    ['Instructional Load', cfg.instructionalLoad, 'Clause 5.2']
  ];
  termRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 108, y);
    doc.text(row[2], 160, y);
    y += 6;
  });
  y += 2;

  y = sectionTitle(doc, y, 'SECTION 3 - ASSIGNMENT AND DUTIES');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 34, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Employee agrees to provide instruction in assigned subject areas, maintain grade records, deliver lesson plans aligned with state standards, and participate in parent communication and faculty development activities.', 18, y + 7, { maxWidth: 174 });
  doc.text('Employee acknowledges duty to follow school handbook, safeguarding policies, attendance procedures, and testing administration protocols.', 18, y + 18, { maxWidth: 174 });
  doc.text('Any change in assignment requires written addendum approved by school administration.', 18, y + 28, { maxWidth: 174 });
  y += 40;

  y = sectionTitle(doc, y, 'SECTION 4 - CREDENTIAL ATTESTATION');
  y = fieldRow(doc, y, 'Degree Referenced in Personnel File', `${cfg.degreeName} (${cfg.degreeInstitution})`);
  y = fieldRow(doc, y, 'Qualification Path', cfg.qualificationPath);
  y = fieldRow(doc, y, 'Official Transcript Status', cfg.transcriptStatus);
  y = fieldRow(doc, y, 'HR Verification Ticket', cfg.hrTicketId);

  // Page 2 - compensation, acknowledgements, signatures
  doc.addPage();
  y = header(
    doc,
    'INSTRUCTIONAL STAFF EMPLOYMENT AGREEMENT',
    'Compensation Addendum and Certification',
    cfg.schoolShort
  );
  y = 46;

  y = sectionTitle(doc, y, 'SECTION 5 - PAY AND BENEFITS ADDENDUM');
  const payCols = [
    { label: 'COMPONENT', x: 16 },
    { label: 'DETAIL', x: 86 },
    { label: 'NOTES', x: 156 }
  ];
  y = tableHeader(doc, y, payCols);
  const payRows = [
    ['Base Salary', cfg.annualSalary, 'Annualized'],
    ['Department Stipend', cfg.stipend, 'Subject / advisory'],
    ['Benefit Eligibility', 'Medical, dental, retirement', 'After onboarding'],
    ['Contract Days', cfg.contractDays, 'Teacher calendar'],
    ['Leave Policy', '10 PTO + 5 sick days', 'Prorated if needed']
  ];
  payRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 86, y);
    doc.text(row[2], 156, y);
    y += 6;
  });
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 6 - WEEKLY ASSIGNMENT GRID');
  const asCols = [
    { label: 'PERIOD', x: 16 },
    { label: 'COURSE', x: 42 },
    { label: 'GRADE BAND', x: 104 },
    { label: 'ROOM', x: 144 },
    { label: 'HOURS/WK', x: 170 }
  ];
  y = tableHeader(doc, y, asCols);
  const assignmentRows = cfg.assignmentRows;
  assignmentRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 42, y);
    doc.text(row[2], 104, y);
    doc.text(row[3], 144, y);
    doc.text(row[4], 170, y);
    y += 6;
  });
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 7 - ACKNOWLEDGEMENT AND SIGNATURES');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('By signing below, the employee and school acknowledge acceptance of contract terms and retention of credential support records in the HR compliance repository.', 18, y + 7, { maxWidth: 174 });
  doc.text('This agreement is effective upon execution by all parties.', 18, y + 14);
  y += 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Employee Signature:', 14, y);
  doc.line(44, y + 1, 104, y + 1);
  doc.text('Date:', 110, y);
  doc.line(120, y + 1, 154, y + 1);
  y += 10;
  doc.text('Principal Signature:', 14, y);
  doc.line(43, y + 1, 104, y + 1);
  doc.text('Date:', 110, y);
  doc.line(120, y + 1, 154, y + 1);
  y += 10;
  doc.text('HR Compliance Signature:', 14, y);
  doc.line(52, y + 1, 104, y + 1);
  doc.text('Date:', 110, y);
  doc.line(120, y + 1, 154, y + 1);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${cfg.schoolName} | Human Resources Contract Archive`, 14, 288);
    doc.text(`Contract ID: ${cfg.contractId} | Employee ID: ${cfg.employeeId}`, 14, 292);
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);

  save(doc, cfg.folder, cfg.fileName);
}

function nbTeacherContractsLongForm() {
  const common = {
    folder: 'north_broward',
    schoolShort: 'North Broward Preparatory',
    schoolName: 'North Broward Preparatory School',
    schoolCode: 'NB-0042',
    county: 'Broward',
    department: 'Instructional Services',
    employmentType: 'Full-time, exempt instructional staff',
    fte: '1.0',
    campus: 'Main Campus',
    termStart: 'August 1, 2024',
    termEnd: 'May 30, 2025',
    workCalendar: '194 duty days',
    instructionalLoad: '5 teaching periods + advisory',
    contractDays: '194 days',
    qualificationPath: "Bachelor's Degree",
    transcriptStatus: 'Degree cited in contract packet; official transcript pending HR file upload',
    stipend: '$1,500',
    assignmentRows: [
      ['1', 'Honors Section A', 'Grades 9-10', 'B-214', '5.0'],
      ['2', 'Honors Section B', 'Grades 9-10', 'B-214', '5.0'],
      ['3', 'College Prep Section A', 'Grades 11-12', 'B-214', '5.0'],
      ['4', 'College Prep Section B', 'Grades 11-12', 'B-214', '5.0'],
      ['5', 'Advisory / Planning', 'Mixed', 'B-214', '4.0']
    ]
  };

  teacherContractLongForm({
    ...common,
    fileName: 'Teacher_Contract_Williams.pdf',
    contractId: 'NB-2024-TCH-045',
    employeeId: 'NB-T-045',
    teacherName: 'Angela Williams',
    position: 'Biology Teacher',
    annualSalary: '$64,800',
    degreeName: 'B.S. Biological Sciences',
    degreeInstitution: 'University of Florida',
    hrTicketId: 'HR-TR-2025-1192'
  });

  teacherContractLongForm({
    ...common,
    fileName: 'Teacher_Contract_Chen.pdf',
    contractId: 'NB-2024-TCH-051',
    employeeId: 'NB-T-051',
    teacherName: 'David Chen',
    position: 'Physics Teacher',
    annualSalary: '$66,200',
    degreeName: 'B.S. Physics',
    degreeInstitution: 'University of Central Florida',
    hrTicketId: 'HR-TR-2025-1193'
  });

  teacherContractLongForm({
    ...common,
    fileName: 'Teacher_Contract_Okafor.pdf',
    contractId: 'NB-2024-TCH-058',
    employeeId: 'NB-T-058',
    teacherName: 'Samuel Okafor',
    position: 'Mathematics Teacher',
    annualSalary: '$63,900',
    degreeName: 'B.S. Applied Mathematics',
    degreeInstitution: 'Florida Atlantic University',
    hrTicketId: 'HR-TR-2025-1194'
  });
}

function degreeCertificatePacket(cfg) {
  const doc = new jsPDF();
  let y = header(
    doc,
    'OFFICIAL DEGREE CONFERRAL CERTIFICATE',
    cfg.institutionName,
    'Registrar and Records Office'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 44, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CERTIFICATE DATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Document ID', cfg.documentId],
    ['Graduate ID', cfg.graduateId],
    ['Issue Date', cfg.issueDate],
    ['Degree Code', cfg.degreeCode],
    ['Registrar Ref', cfg.registrarRef]
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 84;
  y = sectionTitle(doc, y, 'SECTION 1 - GRADUATE IDENTIFICATION');
  y = fieldRow(doc, y, 'Graduate Name', cfg.teacherName);
  y = fieldRow(doc, y, 'Date of Birth', cfg.dateOfBirth);
  y = fieldRow(doc, y, 'Student Number', cfg.studentNumber);
  y = fieldRow(doc, y, 'Program', cfg.programName);
  y += 3;

  y = sectionTitle(doc, y, 'SECTION 2 - DEGREE AWARD');
  y = fieldRow(doc, y, 'Degree Conferred', cfg.degreeName);
  y = fieldRow(doc, y, 'Field of Study', cfg.fieldOfStudy);
  y = fieldRow(doc, y, 'Conferral Date', cfg.conferralDate);
  y = fieldRow(doc, y, 'Academic Honors', cfg.honors);
  y = fieldRow(doc, y, 'Institution', cfg.institutionName);
  y += 3;

  y = sectionTitle(doc, y, 'SECTION 3 - AUTHENTICATION');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('This certifies that the above-named graduate has satisfied institutional requirements and was awarded the degree listed on the conferral date shown.', 18, y + 7, { maxWidth: 174 });
  doc.text('Verification may be performed through registrar records using the document ID and graduate identifier.', 18, y + 15, { maxWidth: 174 });
  doc.text('Note: This certificate evidences degree conferral and is not an official transcript.', 18, y + 23, { maxWidth: 174 });

  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(219, 234, 254);
  doc.circle(170, y + 16, 15, 'FD');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(6.5);
  doc.text('REGISTRAR', 170, y + 12, { align: 'center' });
  doc.text('VERIFIED', 170, y + 16, { align: 'center' });
  doc.text(cfg.issueDate, 170, y + 20, { align: 'center' });
  doc.setTextColor(15, 23, 42);

  // Page 2 - Registrar verification attachment
  doc.addPage();
  y = header(
    doc,
    'DEGREE VERIFICATION ATTACHMENT',
    'Registrar Record Extract',
    cfg.institutionName
  );
  y = 46;
  y = sectionTitle(doc, y, 'SECTION 4 - PROGRAM COMPLETION SUMMARY');
  const progCols = [
    { label: 'REQUIREMENT', x: 16 },
    { label: 'RESULT', x: 96 },
    { label: 'STATUS', x: 166 }
  ];
  y = tableHeader(doc, y, progCols);
  const progRows = [
    ['Total Credits Required', cfg.creditsRequired, 'MET'],
    ['Credits Completed', cfg.creditsCompleted, 'MET'],
    ['Cumulative GPA', cfg.gpa, 'MET'],
    ['Residency Requirement', 'Completed', 'MET'],
    ['Final Degree Audit', 'Cleared by Registrar', 'MET']
  ];
  progRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 96, y);
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], 166, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 5 - COURSE DISTRIBUTION');
  const crCols = [
    { label: 'CATEGORY', x: 16 },
    { label: 'CREDITS', x: 98 },
    { label: 'NOTES', x: 128 }
  ];
  y = tableHeader(doc, y, crCols);
  const creditRows = [
    ['General Education', cfg.creditDistribution.generalEd, 'Completed'],
    ['Major Core', cfg.creditDistribution.majorCore, 'Completed'],
    ['Major Electives', cfg.creditDistribution.majorElectives, 'Completed'],
    ['Practicum / Internship', cfg.creditDistribution.practicum, 'Completed']
  ];
  creditRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 98, y);
    doc.text(row[2], 128, y);
    y += 6;
  });
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 6 - THIRD-PARTY USE NOTICE');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 28, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('This certificate confirms degree completion. Official transcript copies are released by registrar request only and may not be bundled in employer contract packets.', 18, y + 7, { maxWidth: 174 });
  doc.text('For compliance packet review, this record should be paired with an official transcript or equivalent verification letter.', 18, y + 16, { maxWidth: 174 });
  doc.text(`Verification contact: ${cfg.registrarContact}`, 18, y + 24);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${cfg.institutionName} | Office of the Registrar`, 14, 288);
    doc.text(`Document ID: ${cfg.documentId}`, 14, 292);
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);

  save(doc, 'north_broward', cfg.fileName);
}

function nbDegreeCertificatesRich() {
  degreeCertificatePacket({
    fileName: 'Degree_Certificate_Williams.pdf',
    teacherName: 'Angela Williams',
    dateOfBirth: 'June 22, 1996',
    studentNumber: 'UF-2014-102883',
    graduateId: 'GR-884102',
    programName: 'Bachelor of Arts - English',
    degreeName: 'Bachelor of Arts',
    fieldOfStudy: 'English Language and Literature',
    conferralDate: 'May 5, 2018',
    issueDate: 'May 18, 2018',
    institutionName: 'University of Florida',
    honors: 'Cum Laude',
    degreeCode: 'BA-ENGL',
    documentId: 'UF-BA-2018-884102',
    registrarRef: 'REG-UF-5512',
    creditsRequired: '120',
    creditsCompleted: '124',
    gpa: '3.41',
    creditDistribution: { generalEd: '36', majorCore: '42', majorElectives: '34', practicum: '12' },
    registrarContact: 'registrar@ufl.edu | (352) 392-1374'
  });

  degreeCertificatePacket({
    fileName: 'Degree_Certificate_Chen.pdf',
    teacherName: 'David Chen',
    dateOfBirth: 'November 11, 1995',
    studentNumber: 'UCF-2013-991204',
    graduateId: 'GR-552093',
    programName: 'Bachelor of Science - Physics',
    degreeName: 'Bachelor of Science',
    fieldOfStudy: 'Physics',
    conferralDate: 'May 10, 2019',
    issueDate: 'May 24, 2019',
    institutionName: 'University of Central Florida',
    honors: 'Magna Cum Laude',
    degreeCode: 'BS-PHYS',
    documentId: 'UCF-BS-2019-552093',
    registrarRef: 'REG-UCF-7721',
    creditsRequired: '120',
    creditsCompleted: '128',
    gpa: '3.63',
    creditDistribution: { generalEd: '36', majorCore: '52', majorElectives: '28', practicum: '12' },
    registrarContact: 'registrar@ucf.edu | (407) 823-3100'
  });

  degreeCertificatePacket({
    fileName: 'Degree_Certificate_Okafor.pdf',
    teacherName: 'Samuel Okafor',
    dateOfBirth: 'January 4, 1993',
    studentNumber: 'FAU-2011-771540',
    graduateId: 'GR-440871',
    programName: 'Bachelor of Science - Applied Mathematics',
    degreeName: 'Bachelor of Science',
    fieldOfStudy: 'Applied Mathematics',
    conferralDate: 'May 8, 2017',
    issueDate: 'May 20, 2017',
    institutionName: 'Florida Atlantic University',
    honors: 'With Distinction',
    degreeCode: 'BS-AMTH',
    documentId: 'FAU-BS-2017-440871',
    registrarRef: 'REG-FAU-6618',
    creditsRequired: '120',
    creditsCompleted: '123',
    gpa: '3.37',
    creditDistribution: { generalEd: '36', majorCore: '48', majorElectives: '31', practicum: '8' },
    registrarContact: 'registrar@fau.edu | (561) 297-3050'
  });
}

function nbDriverMedicalCertificationReport() {
  const doc = new jsPDF();
  const reportId = 'TR-MED-2025-0415';
  const generatedDate = 'February 10, 2025';
  const summaryLine = 'Medical certs: 5/6 valid - R. Dominguez MCSA-5876 expires 03/01/2025 - RENEWAL NEEDED';

  // Page 1 - Transportation report cover
  let y = header(
    doc,
    'Transportation Safety Compliance Report',
    'School Bus Driver Medical Certification Review (MCSA-5876)',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 46, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('REPORT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['School ID', 'FL-PS-20482'],
    ['County', 'Broward County'],
    ['Fleet Vehicles', '6 buses'],
    ['Certified Drivers', '6'],
    ['Statute', 's. 316.615(3), F.S.']
  ];
  let metaY = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 151, metaY);
    metaY += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 88;
  y = sectionTitle(doc, y, 'SECTION A - TRANSPORTATION DEPARTMENT PROFILE');
  y = fieldRow(doc, y, 'Department', 'Transportation Services');
  y = fieldRow(doc, y, 'Fleet Manager', 'R. Fletcher');
  y = fieldRow(doc, y, 'Safety Coordinator', 'J. Alvarez');
  y = fieldRow(doc, y, 'Academic Year', '2024-2025');
  y = fieldRow(doc, y, 'Report Generated', generatedDate);
  y += 3;

  y = sectionTitle(doc, y, 'SECTION B - REVIEW PURPOSE');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 28, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'This report verifies that each active school bus driver maintains a current DOT Medical Examiner Certificate (Form MCSA-5876) as required for student transportation operations.',
    18,
    y + 7,
    { maxWidth: 174 }
  );
  doc.text(
    'Drivers with expired certificates are prohibited from route operation until valid renewal documentation is filed.',
    18,
    y + 17,
    { maxWidth: 174 }
  );

  // Page 2 - Statutory requirement
  doc.addPage();
  y = header(
    doc,
    'Transportation Safety Compliance Report',
    'Statutory Requirement Summary',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 1 - STATUTORY REQUIREMENT');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Florida Statute s.316.615(3) requires school bus drivers to maintain a valid Medical Examiner Certificate (Form MCSA-5876) confirming physical fitness to operate a commercial motor vehicle transporting students. The certificate must be issued by a licensed DOT-certified medical examiner and renewed annually.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 22;
  doc.text(
    'Drivers with expired certificates are not permitted to operate school buses until a new certificate is issued and recorded in transportation personnel files.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 16;

  y = sectionTitle(doc, y, 'SECTION 1A - CONTROL CHECKS');
  const ctrlCols = [
    { label: 'CONTROL', x: 16 },
    { label: 'REQUIREMENT DETAIL', x: 52 },
    { label: 'EVIDENCE SOURCE', x: 146 }
  ];
  y = tableHeader(doc, y, ctrlCols);
  const controlRows = [
    ['MED-01', 'Valid MCSA-5876 on file for each active driver', 'Driver credential file'],
    ['MED-02', 'Expiration date tracked and reviewed monthly', 'Fleet compliance tracker'],
    ['MED-03', 'Renewal action initiated before certificate expiry', 'Safety coordinator log'],
    ['MED-04', 'Expired cert blocks route assignment', 'Dispatch controls']
  ];
  controlRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 52, y, { maxWidth: 90 });
    doc.text(row[2], 146, y, { maxWidth: 46 });
    y += 8;
  });

  // Page 3 - Fleet and driver assignment
  doc.addPage();
  y = header(
    doc,
    'Transportation Safety Compliance Report',
    'Fleet and Driver Assignment Overview',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - SCHOOL BUS FLEET AND DRIVER ASSIGNMENT');
  const fleetCols = [
    { label: 'BUS ID', x: 16 },
    { label: 'VEHICLE', x: 44 },
    { label: 'ASSIGNED DRIVER', x: 88 },
    { label: 'ROUTE', x: 145 }
  ];
  y = tableHeader(doc, y, fleetCols);
  const fleetRows = [
    ['BUS-01', '2021 IC CE', 'Maria Alvarez', 'North Route'],
    ['BUS-02', '2020 BlueBird', 'James Porter', 'East Route'],
    ['BUS-03', '2022 IC CE', 'Robert Dominguez', 'South Route'],
    ['BUS-04', '2019 Thomas', 'Daniel Price', 'West Route'],
    ['BUS-05', '2021 IC CE', 'Laura Kim', 'Elementary Loop'],
    ['BUS-06', '2018 Thomas', 'Samuel Ortiz', 'Activity Bus']
  ];
  fleetRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 44, y);
    doc.text(row[2], 88, y);
    doc.text(row[3], 145, y);
    y += 7;
  });
  y += 5;
  y = fieldRow(doc, y, 'Total Fleet Vehicles', '6');
  y = fieldRow(doc, y, 'Active Drivers', '6');
  y = fieldRow(doc, y, 'DOT Medical Review Date', generatedDate);

  // Page 4 - Medical certificate status table (part 1)
  doc.addPage();
  y = header(
    doc,
    'Transportation Safety Compliance Report',
    'Driver Medical Certification Status (Part 1)',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - DRIVER MEDICAL CERTIFICATION STATUS');
  const medCols = [
    { label: 'ID', x: 16 },
    { label: 'DRIVER NAME', x: 30 },
    { label: 'CERTIFICATE ID', x: 74 },
    { label: 'EXPIRATION', x: 118 },
    { label: 'STATUS', x: 156 },
    { label: 'ASSIGNMENT', x: 176 }
  ];
  y = tableHeader(doc, y, medCols);
  const medRowsP1 = [
    ['01', 'Maria Alvarez', 'MCSA-5876-221', '09/14/2025', 'VALID', 'BUS-01'],
    ['02', 'James Porter', 'MCSA-5876-189', '10/03/2025', 'VALID', 'BUS-02'],
    ['03', 'Robert Dominguez', 'MCSA-5876-205', '03/01/2025', 'EXPIRING', 'BUS-03']
  ];
  medRowsP1.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 30, y);
    doc.text(row[2], 74, y);
    doc.text(row[3], 118, y);
    if (row[4] === 'EXPIRING') {
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(row[4], 156, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(row[5], 176, y);
    y += 7;
  });

  // Page 5 - Medical certificate status table (part 2 + exam details)
  doc.addPage();
  y = header(
    doc,
    'Transportation Safety Compliance Report',
    'Driver Medical Certification Status (Part 2)',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3A - DRIVER MEDICAL CERTIFICATION STATUS');
  y = tableHeader(doc, y, medCols);
  const medRowsP2 = [
    ['04', 'Daniel Price', 'MCSA-5876-167', '11/12/2025', 'VALID', 'BUS-04'],
    ['05', 'Laura Kim', 'MCSA-5876-210', '08/28/2025', 'VALID', 'BUS-05'],
    ['06', 'Samuel Ortiz', 'MCSA-5876-198', '12/05/2025', 'VALID', 'BUS-06']
  ];
  medRowsP2.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 30, y);
    doc.text(row[2], 74, y);
    doc.text(row[3], 118, y);
    doc.setTextColor(22, 163, 74);
    doc.text(row[4], 156, y);
    doc.setTextColor(15, 23, 42);
    doc.text(row[5], 176, y);
    y += 7;
  });
  y += 6;
  y = sectionTitle(doc, y, 'SECTION 3B - EXAMINER AND RENEWAL TRACKING');
  const renewCols = [
    { label: 'DRIVER', x: 16 },
    { label: 'LAST EXAM DATE', x: 72 },
    { label: 'MEDICAL EXAMINER', x: 112 },
    { label: 'RENEWAL WINDOW', x: 162 }
  ];
  y = tableHeader(doc, y, renewCols);
  const renewRows = [
    ['M. Alvarez', '09/14/2024', 'Dr. K. Simmons', 'Aug 2025'],
    ['J. Porter', '10/03/2024', 'Dr. V. Moran', 'Sep 2025'],
    ['R. Dominguez', '03/01/2024', 'Dr. S. Patel', 'Feb 2025'],
    ['D. Price', '11/12/2024', 'Dr. T. Greene', 'Oct 2025'],
    ['L. Kim', '08/28/2024', 'Dr. K. Simmons', 'Jul 2025'],
    ['S. Ortiz', '12/05/2024', 'Dr. V. Moran', 'Nov 2025']
  ];
  renewRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 72, y);
    doc.text(row[2], 112, y);
    doc.text(row[3], 162, y);
    y += 6;
  });

  // Page 6 - Compliance summary (card quote page)
  doc.addPage();
  y = header(
    doc,
    'Transportation Safety Compliance Report',
    'Compliance Summary (Card Evidence)',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 4 - DRIVER MEDICAL CERTIFICATION COMPLIANCE');
  y = fieldRow(doc, y, 'Total Drivers Reviewed', '6');
  y = fieldRow(doc, y, 'Certificates Currently Valid', '5');
  y = fieldRow(doc, y, 'Certificates Expiring / Renewal Required', '1');
  y = fieldRow(doc, y, 'Certificates Expired', '0');
  y += 6;

  doc.setDrawColor(251, 191, 36);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y - 1, 182, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(8.5);
  doc.text(summaryLine, 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);
  y += 30;

  y = sectionTitle(doc, y, 'OPERATIONAL IMPACT');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 26, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Driver R. Dominguez is assigned to South Route (BUS-03). Renewal must be completed prior to 03/01/2025 to avoid route disruption.', 18, y + 7, { maxWidth: 174 });
  doc.text('Current card status: PARTIAL COMPLIANT', 18, y + 18);

  // Page 7 - Corrective action plan
  doc.addPage();
  y = header(
    doc,
    'Transportation Safety Compliance Report',
    'Corrective Action and Renewal Scheduling',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 5 - REQUIRED CORRECTIVE ACTION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Driver Robert Dominguez DOT Medical Examiner Certificate (MCSA-5876) is scheduled to expire on March 1, 2025.', 14, y, { maxWidth: 182 });
  y += 10;
  doc.text('1. Schedule DOT medical examination prior to expiration.', 18, y); y += 6;
  doc.text('2. Obtain renewed MCSA-5876 certificate from certified medical examiner.', 18, y); y += 6;
  doc.text('3. Update transportation personnel file and dispatch eligibility.', 18, y); y += 8;
  doc.text('Drivers are prohibited from operating a school bus without a valid medical certification.', 14, y, { maxWidth: 182 });
  y += 12;

  y = sectionTitle(doc, y, 'RENEWAL TRACKING TABLE');
  const trackCols = [
    { label: 'DRIVER', x: 16 },
    { label: 'CURRENT EXPIRY', x: 68 },
    { label: 'EXAM DATE', x: 106 },
    { label: 'OWNER', x: 138 },
    { label: 'STATUS', x: 170 }
  ];
  y = tableHeader(doc, y, trackCols);
  const trackRows = [
    ['R. Dominguez', '03/01/2025', '02/20/2025', 'Safety Office', 'PENDING']
  ];
  trackRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 68, y);
    doc.text(row[2], 106, y);
    doc.text(row[3], 138, y);
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(row[4], 170, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });
  y += 6;
  y = fieldRow(doc, y, 'Responsible Department', 'Transportation Services');
  y = fieldRow(doc, y, 'Review Deadline', 'February 25, 2025');

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Transportation Services', 14, 288);
    doc.text(`Report ID: ${reportId}`, 14, 292);
    doc.text(`Generated: ${generatedDate}`, 98, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);

  save(doc, 'north_broward', 'MCSA5876_Driver_Medical_Review.pdf');
}

function nbDominguezMedicalCertificateProof() {
  const doc = new jsPDF();
  const certId = 'MCSA-5876-205';
  const issueDate = '03/01/2024';
  const expiryDate = '03/01/2025';

  let y = header(
    doc,
    'DOT MEDICAL EXAMINER CERTIFICATE',
    'Form MCSA-5876 | Driver Certification Record',
    'Transportation Services'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 44, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CERTIFICATE METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Certificate ID', certId],
    ['Driver Ref', 'NB-DRV-003'],
    ['Issue Date', issueDate],
    ['Expiry Date', expiryDate],
    ['Status', 'EXPIRING / RENEWAL NEEDED']
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 84;
  y = sectionTitle(doc, y, 'SECTION 1 - DRIVER IDENTIFICATION');
  y = fieldRow(doc, y, 'Driver Name', 'Robert Dominguez');
  y = fieldRow(doc, y, 'Date of Birth', 'August 19, 1986');
  y = fieldRow(doc, y, 'CDL Number', 'FL-DL-76429931');
  y = fieldRow(doc, y, 'CDL Class', 'Class B with P and S endorsements');
  y = fieldRow(doc, y, 'Employer', 'North Broward Preparatory School');
  y += 3;

  y = sectionTitle(doc, y, 'SECTION 2 - MEDICAL EXAMINATION DETAILS');
  const medCols = [
    { label: 'FIELD', x: 16 },
    { label: 'VALUE', x: 86 },
    { label: 'REFERENCE', x: 156 }
  ];
  y = tableHeader(doc, y, medCols);
  const medRows = [
    ['Medical Examiner', 'Dr. S. Patel', 'National Registry # 3911045728'],
    ['Exam Date', issueDate, 'DOT physical completed'],
    ['Certificate Expiration', expiryDate, '12-month certification'],
    ['Restriction', 'Must wear corrective lenses', 'Code: CL'],
    ['BP at Exam', '124/78', 'Within acceptable range'],
    ['Hearing / Vision', 'Meets standard with correction', 'Cleared']
  ];
  medRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 86, y);
    doc.text(row[2], 156, y, { maxWidth: 36 });
    y += 6;
  });
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 3 - CERTIFICATION STATEMENT');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 28, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'I certify that I have examined this driver according to FMCSA medical standards and find this individual physically qualified to operate a commercial motor vehicle, subject to the listed restrictions and certificate validity period.',
    18,
    y + 7,
    { maxWidth: 174 }
  );
  doc.text('This certificate expires on 03/01/2025 unless superseded by a newly issued certificate.', 18, y + 20);

  // Page 2 - record image and audit note
  doc.addPage();
  y = header(
    doc,
    'DOT MEDICAL EXAMINER CERTIFICATE',
    'Transportation File Scan and Audit Note',
    'North Broward Preparatory'
  );
  y = 46;
  y = sectionTitle(doc, y, 'SECTION 4 - FILED CERTIFICATE SNAPSHOT');
  doc.setDrawColor(148, 163, 184);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, 182, 125, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Archived MCSA-5876 form image placeholder', 70, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Certificate ID: ${certId}`, 18, y + 18);
  doc.text('Driver: Robert Dominguez', 18, y + 24);
  doc.text(`Issue Date: ${issueDate}`, 18, y + 30);
  doc.text(`Expiration Date: ${expiryDate}`, 18, y + 36);
  doc.text('Medical Examiner Signature: Dr. S. Patel', 18, y + 42);
  doc.text('Facility: Broward Occupational Health Clinic', 18, y + 48);
  doc.text('File Source: Transportation Personnel Binder > Medical Certifications', 18, y + 54);
  doc.text('Scan Timestamp: February 10, 2025 09:12 ET', 18, y + 60);
  doc.text('Validation Hash: NB-TRN-MED-205-2025', 18, y + 66);

  y += 136;
  y = sectionTitle(doc, y, 'SECTION 5 - COMPLIANCE AUDIT NOTE');
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(14, y - 1, 182, 28, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(8.5);
  doc.text('Certificate currently valid at audit date but approaching expiration on 03/01/2025.', 18, y + 7, { maxWidth: 174 });
  doc.text('Renewal appointment is required before route assignment beyond expiration date.', 18, y + 15, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Transportation Credential File', 14, 288);
    doc.text(`Certificate ID: ${certId}`, 14, 292);
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);

  save(doc, 'north_broward', 'MCSA5876_Dominguez_Certificate.pdf');
}

function nbRadonComplianceReviewReport() {
  const doc = new jsPDF();
  const reportId = 'FAC-RADON-2025-0415';
  const generatedDate = 'April 15, 2025';
  const keyLine = 'Radon compliance review: 1 test on record - second test overdue by 2+ years - Form DH 1777 not filed for second test';

  // Page 1 - Header
  let y = header(
    doc,
    'Facilities Environmental Compliance Report',
    'Radon Testing Compliance Review | Form DH 1777',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 46, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('REPORT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Facility ID', 'FL-PS-20482'],
    ['Campus Buildings', '4'],
    ['Radon Testing Req', 'Yes'],
    ['Academic Year', '2024-2025'],
    ['Generated', generatedDate]
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 153, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 88;
  y = sectionTitle(doc, y, 'SECTION A - FACILITY PROFILE');
  y = fieldRow(doc, y, 'School', 'North Broward Preparatory School');
  y = fieldRow(doc, y, 'Department', 'Facilities Management');
  y = fieldRow(doc, y, 'Compliance Domain', 'Environmental Health');
  y = fieldRow(doc, y, 'Compliance Statute', 's.404.056, F.S.');
  y = fieldRow(doc, y, 'Report Scope', 'Radon gas testing cycle verification');
  y += 3;

  y = sectionTitle(doc, y, 'SECTION B - REVIEW OBJECTIVE');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('This report verifies whether campus buildings have completed DEP-compliant radon testing at five-year intervals and whether Form DH 1777 filings are present in facility records.', 18, y + 7, { maxWidth: 174 });
  doc.text('Audit focus: identify gaps between required test cycle and available filed documentation.', 18, y + 18, { maxWidth: 174 });

  // Page 2 - Statutory requirement
  doc.addPage();
  y = header(
    doc,
    'Facilities Environmental Compliance Report',
    'Radon Statutory Requirement Summary',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 1 - RADON TESTING REQUIREMENT');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Florida Statute s.404.056 requires all school buildings constructed or occupied for more than one year to undergo radon gas testing every five years. Testing must be conducted by a DEP-certified radon measurement specialist and analyzed by a certified laboratory. Results are recorded using Form DH 1777 and maintained in facility records.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 24;

  y = sectionTitle(doc, y, 'SECTION 1A - CONTROL CHECKS');
  const reqCols = [
    { label: 'CONTROL', x: 16 },
    { label: 'REQUIREMENT DETAIL', x: 52 },
    { label: 'EVIDENCE SOURCE', x: 146 }
  ];
  y = tableHeader(doc, y, reqCols);
  const reqRows = [
    ['RAD-01', 'Radon test completed every 5 years', 'Facility environmental log'],
    ['RAD-02', 'DEP-certified specialist used', 'Vendor credential record'],
    ['RAD-03', 'DH 1777 filed for each test cycle', 'Filing archive'],
    ['RAD-04', 'Overdue cycles escalated for action', 'Facilities corrective tracker']
  ];
  reqRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 52, y, { maxWidth: 90 });
    doc.text(row[2], 146, y, { maxWidth: 46 });
    y += 8;
  });

  // Page 3 - History table
  doc.addPage();
  y = header(
    doc,
    'Facilities Environmental Compliance Report',
    'Building Radon Testing History',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - RADON TEST HISTORY');
  const histCols = [
    { label: 'BUILDING', x: 16 },
    { label: 'LAST TEST DATE', x: 64 },
    { label: 'LAB RESULT', x: 112 },
    { label: 'STATUS', x: 160 }
  ];
  y = tableHeader(doc, y, histCols);
  const histRows = [
    ['Main Hall', 'Sept 14, 2018', '1.8 pCi/L', 'Recorded'],
    ['Gymnasium', 'Sept 14, 2018', '1.6 pCi/L', 'Recorded'],
    ['Library', 'Sept 14, 2018', '1.9 pCi/L', 'Recorded'],
    ['Annex', 'Sept 14, 2018', '1.7 pCi/L', 'Recorded']
  ];
  histRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 64, y);
    doc.text(row[2], 112, y);
    doc.text(row[3], 160, y);
    y += 7;
  });
  y += 6;
  y = fieldRow(doc, y, 'Most Recent Test on Record', 'September 14, 2018');
  y = fieldRow(doc, y, 'Next Required Radon Test Date', 'September 2023');
  y = fieldRow(doc, y, 'Second Test Filing Status', 'NOT FOUND');

  // Page 4 - 2018 report proof summary
  doc.addPage();
  y = header(
    doc,
    'Facilities Environmental Compliance Report',
    '2018 Radon Test Record Evidence',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - RADON TEST RESULT RECORD');
  y = fieldRow(doc, y, 'Inspection Date', 'September 14, 2018');
  y = fieldRow(doc, y, 'Inspector', 'Florida Radon Services LLC');
  y = fieldRow(doc, y, 'DEP Certification Number', 'FL-RN-2218');
  y = fieldRow(doc, y, 'Testing Method', 'Short-term activated charcoal');
  y = fieldRow(doc, y, 'Laboratory', 'Environmental Diagnostics Lab');
  y = fieldRow(doc, y, 'Lab Certification ID', 'FL-LAB-8842');
  y += 4;

  const resCols = [
    { label: 'BUILDING', x: 16 },
    { label: 'RADON LEVEL (pCi/L)', x: 84 },
    { label: 'RESULT', x: 160 }
  ];
  y = tableHeader(doc, y, resCols);
  const resRows = [
    ['Main Hall', '1.8', 'Acceptable'],
    ['Gymnasium', '1.6', 'Acceptable'],
    ['Library', '1.9', 'Acceptable'],
    ['Annex', '1.7', 'Acceptable']
  ];
  resRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 84, y);
    doc.setTextColor(22, 163, 74);
    doc.text(row[2], 160, y);
    doc.setTextColor(15, 23, 42);
    y += 7;
  });
  y += 5;
  y = fieldRow(doc, y, 'Filed Documentation', 'Form DH 1777 - Radon Measurement Report');
  y = fieldRow(doc, y, 'Filed Date', 'September 18, 2018');

  // Page 5 - Compliance evaluation
  doc.addPage();
  y = header(
    doc,
    'Facilities Environmental Compliance Report',
    'Compliance Evaluation (Card Evidence)',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 4 - RADON TEST COMPLIANCE STATUS');
  y = fieldRow(doc, y, 'Most Recent Test on Record', 'September 14, 2018');
  y = fieldRow(doc, y, 'Next Required Test Deadline', 'September 2023');
  y = fieldRow(doc, y, 'Current Date', 'April 2025');
  y += 4;

  doc.setDrawColor(251, 191, 36);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(8.5);
  doc.text('Radon testing requirement: every 5 years | Last test: September 2018 | Second test required: September 2023 | Status: OVERDUE', 18, y + 8, { maxWidth: 174 });
  doc.text(keyLine, 18, y + 16, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);
  y += 32;

  y = sectionTitle(doc, y, 'NON-COMPLIANCE DETERMINATION');
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(14, y - 1, 182, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('NON-COMPLIANT: Required second radon test is overdue by 2+ years.', 18, y + 8, { maxWidth: 174 });
  doc.setFont('helvetica', 'normal');
  doc.text('Missing artifact: Form DH 1777 filing for second cycle (due Sep 2023).', 18, y + 15, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 6 - Corrective action
  doc.addPage();
  y = header(
    doc,
    'Facilities Environmental Compliance Report',
    'Required Corrective Action',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 5 - REQUIRED CORRECTIVE ACTION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('The facility radon testing schedule is currently non-compliant with Florida Statute s.404.056.', 14, y, { maxWidth: 182 });
  y += 10;
  doc.text('1. Schedule radon testing with a DEP-certified measurement specialist.', 18, y); y += 6;
  doc.text('2. Submit samples to a DEP-certified laboratory for analysis.', 18, y); y += 6;
  doc.text('3. File completed Form DH 1777 with test results.', 18, y); y += 9;
  doc.text('Failure to complete testing may result in facility non-compliance status on the annual school survey.', 14, y, { maxWidth: 182 });
  y += 12;

  y = sectionTitle(doc, y, 'ACTION TRACKING TABLE');
  const actCols = [
    { label: 'ACTION ITEM', x: 16 },
    { label: 'OWNER', x: 118 },
    { label: 'DUE DATE', x: 148 },
    { label: 'STATUS', x: 176 }
  ];
  y = tableHeader(doc, y, actCols);
  const actRows = [
    ['Engage DEP-certified radon vendor', 'Facilities', 'Apr 25, 2025', 'OPEN'],
    ['Complete campus sample collection', 'Vendor', 'May 02, 2025', 'OPEN'],
    ['File Form DH 1777 (second cycle)', 'Facilities', 'May 06, 2025', 'OPEN']
  ];
  actRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 118, y);
    doc.text(row[2], 148, y);
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(row[3], 176, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 7;
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Facilities Management', 14, 288);
    doc.text(`Report ID: ${reportId}`, 14, 292);
    doc.text(`Generated: ${generatedDate}`, 102, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);

  save(doc, 'north_broward', 'Radon_Compliance_Review_2025.pdf');
}

function nbRadonTestReport2018Detailed() {
  const doc = new jsPDF();
  let y = header(
    doc,
    'FORM DH 1777 - RADON MEASUREMENT REPORT',
    'Filed Environmental Test Record (September 2018)',
    'North Broward Preparatory'
  );

  y = sectionTitle(doc, y, 'SECTION 1 - TEST ENGAGEMENT DETAILS');
  y = fieldRow(doc, y, 'Test Date', 'September 14, 2018');
  y = fieldRow(doc, y, 'Testing Vendor', 'Florida Radon Services LLC');
  y = fieldRow(doc, y, 'DEP Specialist Certification', 'FL-RN-2218');
  y = fieldRow(doc, y, 'Laboratory', 'Environmental Diagnostics Lab');
  y = fieldRow(doc, y, 'Lab Certification ID', 'FL-LAB-8842');
  y = fieldRow(doc, y, 'Filing Date', 'September 18, 2018');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 2 - BUILDING RESULTS');
  const cols = [
    { label: 'BUILDING', x: 16 },
    { label: 'SAMPLE ID', x: 78 },
    { label: 'RADON (pCi/L)', x: 116 },
    { label: 'LIMIT', x: 154 },
    { label: 'STATUS', x: 174 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['Main Hall', 'RN-MH-0918', '1.8', '< 4.0', 'PASS'],
    ['Gymnasium', 'RN-GY-0918', '1.6', '< 4.0', 'PASS'],
    ['Library', 'RN-LB-0918', '1.9', '< 4.0', 'PASS'],
    ['Annex', 'RN-AX-0918', '1.7', '< 4.0', 'PASS']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 78, y);
    doc.text(row[2], 116, y);
    doc.text(row[3], 154, y);
    doc.setTextColor(22, 163, 74);
    doc.text(row[4], 174, y);
    doc.setTextColor(15, 23, 42);
    y += 7;
  });
  y += 5;
  y = fieldRow(doc, y, 'Filed Form', 'DH 1777');
  y = fieldRow(doc, y, 'Archive Reference', 'FAC-RADON-2018-0914');

  // Page 2 - chain of custody and signoff
  doc.addPage();
  y = header(
    doc,
    'FORM DH 1777 - RADON MEASUREMENT REPORT',
    'Chain of Custody and Filing Signoff',
    'North Broward Preparatory'
  );
  y = 46;
  y = sectionTitle(doc, y, 'SECTION 3 - CHAIN OF CUSTODY');
  const cCols = [
    { label: 'STEP', x: 16 },
    { label: 'TIMESTAMP', x: 52 },
    { label: 'HANDLED BY', x: 96 },
    { label: 'STATUS', x: 162 }
  ];
  y = tableHeader(doc, y, cCols);
  const cRows = [
    ['Sample collection', '09/14/2018 08:35', 'Florida Radon Services', 'Complete'],
    ['Lab intake', '09/15/2018 10:12', 'Env Diagnostics Lab', 'Complete'],
    ['Lab analysis', '09/16/2018 14:50', 'Env Diagnostics Lab', 'Complete'],
    ['Facility filing', '09/18/2018 09:28', 'Facilities Office', 'Complete']
  ];
  cRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 52, y);
    doc.text(row[2], 96, y);
    doc.text(row[3], 162, y);
    y += 7;
  });
  y += 6;
  y = sectionTitle(doc, y, 'SECTION 4 - AUTHORIZATION');
  y = fieldRow(doc, y, 'Facilities Director', 'P. Lawson');
  y = fieldRow(doc, y, 'Signature Date', 'September 18, 2018');
  y = fieldRow(doc, y, 'Record Retention', 'Maintained in environmental binder');

  save(doc, 'north_broward', 'Radon_Test_Report_2018.pdf');
}

function nbRadonRequirementRuleSnapshot() {
  const doc = new jsPDF();
  let y = header(
    doc,
    'RADON TESTING REQUIREMENT SNAPSHOT',
    'Florida Statute s.404.056 Summary',
    'Facilities Compliance Reference'
  );
  y = sectionTitle(doc, y, 'SECTION 1 - LEGAL REQUIREMENT');
  y = fieldRow(doc, y, 'Citation', 's.404.056, F.S.');
  y = fieldRow(doc, y, 'Control', 'School building radon testing');
  y = fieldRow(doc, y, 'Testing Frequency', 'Every 5 years');
  y = fieldRow(doc, y, 'Required Form', 'DH 1777');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 2 - COMPLIANCE LOGIC');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('COMPLIANT if (CurrentDate <= LastTestDate + 5 years) AND (DH1777_Filing = PRESENT)', 18, y + 8, { maxWidth: 174 });
  doc.text('Else status = NON_COMPLIANT and corrective testing required.', 18, y + 16, { maxWidth: 174 });
  y += 30;

  y = sectionTitle(doc, y, 'SECTION 3 - CURRENT CASE EVALUATION');
  y = fieldRow(doc, y, 'Last Test Date', 'September 14, 2018');
  y = fieldRow(doc, y, 'Next Due Date', 'September 2023');
  y = fieldRow(doc, y, 'Second Test Filing', 'Missing');
  y = fieldRow(doc, y, 'Decision', 'NON-COMPLIANT');

  save(doc, 'north_broward', 'Radon_Testing_Requirement_5Year_Rule.pdf');
}

function nbRadonSecondTestGapNotice() {
  const doc = new jsPDF();
  let y = header(
    doc,
    'RADON RETEST SCHEDULING AND GAP NOTICE',
    'Facilities Operations Follow-Up Memo',
    'North Broward Preparatory'
  );
  y = sectionTitle(doc, y, 'SECTION 1 - SCHEDULING TIMELINE');
  const cols = [
    { label: 'DATE', x: 16 },
    { label: 'EVENT', x: 52 },
    { label: 'STATUS', x: 168 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['08/10/2023', 'Initial reminder issued for Sep 2023 retest', 'Issued'],
    ['09/12/2023', 'Vendor quote requested', 'No response recorded'],
    ['10/03/2023', 'Escalation to facilities director', 'Pending'],
    ['01/09/2024', 'Retest still not scheduled', 'Overdue'],
    ['04/15/2025', 'Audit review confirms no second-cycle filing', 'Non-compliant']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 52, y, { maxWidth: 110 });
    if (row[2] === 'Overdue' || row[2] === 'Non-compliant') {
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(row[2], 168, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 8;
  });
  y += 4;
  y = sectionTitle(doc, y, 'SECTION 2 - GAP SUMMARY');
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text('No second-cycle radon test documentation found for the period due September 2023.', 18, y + 8, { maxWidth: 174 });
  doc.text('Form DH 1777 for second test remains missing as of April 2025.', 18, y + 16, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  save(doc, 'north_broward', 'Radon_Test_Schedule_Notice_2023.pdf');
}

function addFinanceFooter(doc, reportId, generatedDate) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Finance Department', 14, 288);
    doc.text('Cash Transaction Compliance Review', 14, 292);
    doc.text(`Report ID: ${reportId}`, 102, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
    doc.text(`Generated: ${generatedDate}`, 196, 288, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);
}

function nbForm8300ComplianceAuditReport() {
  const doc = new jsPDF();
  const reportId = 'FIN-8300-2025-0415';
  const generatedDate = 'April 15, 2025';
  const keyLine = 'Form 8300 filing review: 1 transaction exceeding $10,000 - Filing submitted 25 days after transaction - 10 days beyond 15-day legal requirement - STATUS: NON-COMPLIANT';

  // Page 1 - report cover and metadata
  let y = header(
    doc,
    'Financial Compliance Audit Report',
    'Cash Transaction Reporting Review | IRS Form 8300 Filing Compliance',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 48, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('REPORT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Report ID', reportId],
    ['School ID', 'FL-PS-20482'],
    ['Audit Period', 'Jul 2024 - Jun 2025'],
    ['Compliance Rule', '26 U.S.C. 6050I'],
    ['Generated', generatedDate]
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 90;
  y = sectionTitle(doc, y, 'SECTION A - AUDIT SCOPE');
  y = fieldRow(doc, y, 'Department', 'Finance and Accounting');
  y = fieldRow(doc, y, 'Review Type', 'Cash transaction filing timeliness');
  y = fieldRow(doc, y, 'Threshold Tested', 'Cash receipts over $10,000');
  y = fieldRow(doc, y, 'Transactions Reviewed', '14 (period total)');
  y = fieldRow(doc, y, 'Transactions Triggering Form 8300', '1');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION B - EXECUTIVE SUMMARY');
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text('Audit identified one cash tuition transaction requiring Form 8300 filing.', 18, y + 8, { maxWidth: 174 });
  doc.text('Filing was submitted outside the 15-day legal window; case marked NON-COMPLIANT.', 18, y + 16, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 2 - legal requirement
  doc.addPage();
  y = header(
    doc,
    'Financial Compliance Audit Report',
    'IRS Reporting Requirement Summary',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 1 - REPORTING REQUIREMENT');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Under 26 U.S.C. 6050I, businesses receiving cash payments exceeding $10,000 in a single transaction must file IRS Form 8300. The form must be filed within 15 calendar days of receiving the payment. Failure to file within the required timeframe may result in monetary penalties and elevated enforcement risk.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 26;

  y = sectionTitle(doc, y, 'SECTION 1A - CONTROL MATRIX');
  const reqCols = [
    { label: 'CONTROL', x: 16 },
    { label: 'REQUIREMENT DETAIL', x: 52 },
    { label: 'EVIDENCE SOURCE', x: 150 }
  ];
  y = tableHeader(doc, y, reqCols);
  const reqRows = [
    ['FIN-01', 'Identify cash receipts over $10,000', 'Cash receipt log'],
    ['FIN-02', 'Trigger Form 8300 filing workflow', 'Finance ticket'],
    ['FIN-03', 'Submit filing within 15 days', 'IRS filing confirmation'],
    ['FIN-04', 'Retain filing packet and calculations', 'Audit report archive']
  ];
  reqRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 52, y, { maxWidth: 92 });
    doc.text(row[2], 150, y, { maxWidth: 42 });
    y += 8;
  });

  // Page 3 - cash transaction record
  doc.addPage();
  y = header(
    doc,
    'Financial Compliance Audit Report',
    'Cash Transaction Evidence Record',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - CASH TRANSACTION RECORD');
  y = fieldRow(doc, y, 'Transaction ID', 'TX-2024-1098');
  y = fieldRow(doc, y, 'Student Account', '#77124');
  y = fieldRow(doc, y, 'Student Name', 'Michael Reynolds');
  y = fieldRow(doc, y, 'Payment Type', 'Cash Tuition Payment');
  y = fieldRow(doc, y, 'Payment Amount', '$12,000');
  y = fieldRow(doc, y, 'Transaction Date', 'October 3, 2024');
  y = fieldRow(doc, y, 'Processed By', 'Finance Office Cashier Window');
  y += 4;

  const txnCols = [
    { label: 'PAYMENT TYPE', x: 16 },
    { label: 'AMOUNT', x: 94 },
    { label: 'DATE', x: 126 },
    { label: 'ACCOUNT CODE', x: 154 }
  ];
  y = tableHeader(doc, y, txnCols);
  doc.text('Cash Tuition', 16, y);
  doc.text('$12,000', 94, y);
  doc.text('Oct 3, 2024', 126, y);
  doc.text('4100-TUITION', 154, y);
  y += 10;

  doc.setDrawColor(251, 191, 36);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y - 1, 182, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(8.5);
  doc.text('Transaction exceeds IRS reporting threshold of $10,000.', 18, y + 7);
  doc.text('Form 8300 filing required. Trigger date set to October 3, 2024.', 18, y + 14);
  doc.setTextColor(15, 23, 42);

  // Page 4 - filed form record
  doc.addPage();
  y = header(
    doc,
    'Financial Compliance Audit Report',
    'Form 8300 Filing Record',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - FORM 8300 REPORTING RECORD');
  y = fieldRow(doc, y, 'Form Filed', 'IRS Form 8300');
  y = fieldRow(doc, y, 'Transaction Amount', '$12,000');
  y = fieldRow(doc, y, 'Date Cash Received', 'October 3, 2024');
  y = fieldRow(doc, y, 'Date Form Filed', 'October 28, 2024');
  y = fieldRow(doc, y, 'Submission Method', 'Electronic Filing (BSA E-Filing)');
  y += 4;

  const filingCols = [
    { label: 'FIELD', x: 16 },
    { label: 'VALUE', x: 94 }
  ];
  y = tableHeader(doc, y, filingCols);
  const filingRows = [
    ['Filing Reference ID', 'IRS-8300-778241'],
    ['Filing Date', 'Oct 28, 2024'],
    ['Cash Amount Reported', '$12,000'],
    ['Business EIN', '59-4821937'],
    ['Acknowledgment Status', 'Accepted']
  ];
  filingRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 94, y);
    y += 7;
  });

  // Page 5 - compliance evaluation
  doc.addPage();
  y = header(
    doc,
    'Financial Compliance Audit Report',
    'Compliance Evaluation (Card Evidence)',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 4 - COMPLIANCE ANALYSIS');
  y = fieldRow(doc, y, 'Cash Transaction Date', 'October 3, 2024');
  y = fieldRow(doc, y, 'Form 8300 Filing Date', 'October 28, 2024');
  y += 4;

  const calcCols = [
    { label: 'CALCULATION ITEM', x: 16 },
    { label: 'RESULT', x: 128 }
  ];
  y = tableHeader(doc, y, calcCols);
  const calcRows = [
    ['Required filing deadline', 'October 18, 2024'],
    ['Actual filing date', 'October 28, 2024'],
    ['Elapsed days from transaction', '25 days'],
    ['Delay beyond legal limit', '10 days']
  ];
  calcRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 128, y);
    y += 7;
  });
  y += 4;

  doc.setDrawColor(239, 68, 68);
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text(keyLine, 18, y + 8, { maxWidth: 174 });
  doc.text('Status determination: NON-COMPLIANT', 18, y + 16, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 6 - corrective action
  doc.addPage();
  y = header(
    doc,
    'Financial Compliance Audit Report',
    'Corrective Action and Audit Notes',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 5 - REQUIRED CORRECTIVE ACTION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('A cash tuition payment exceeding $10,000 was reported to the IRS beyond the required 15-day filing window.', 14, y, { maxWidth: 182 });
  y += 10;
  doc.text('1. Submit corrective Form 8300 documentation and late-filing memo.', 18, y); y += 6;
  doc.text('2. Log this exception in finance compliance register and retain evidence packet.', 18, y); y += 6;
  doc.text('3. Add automated filing deadline alert for all cash transactions above threshold.', 18, y); y += 6;
  doc.text('4. Retrain cashier and accounting staff on 26 U.S.C. 6050I timeliness controls.', 18, y); y += 10;
  doc.text('Penalty risk note: civil penalties may apply for late filings, with escalated risk for repeat violations.', 14, y, { maxWidth: 182 });
  y += 12;

  y = sectionTitle(doc, y, 'AUDIT NOTE');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Case escalated to CFO for control remediation tracking. Next control re-test scheduled: May 2025.', 18, y + 8, { maxWidth: 174 });

  addFinanceFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'Cash_Transaction_Compliance_Review_2025.pdf');
}

function nbCashTuitionReceiptDetailed() {
  const doc = new jsPDF();
  const reportId = 'FIN-RCT-2024-1098';
  const generatedDate = 'October 3, 2024';

  // Page 1 - receipt
  let y = header(
    doc,
    'OFFICIAL CASH TUITION RECEIPT',
    'Finance Office Receipt Record',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 42, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('RECEIPT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Receipt No', 'RCT-2024-1098'],
    ['Transaction ID', 'TX-2024-1098'],
    ['Issued Date', 'October 3, 2024'],
    ['Campus', 'Main Campus'],
    ['Cashier ID', 'NB-CASH-07']
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 84;
  y = sectionTitle(doc, y, 'SECTION 1 - PAYER AND STUDENT DETAILS');
  y = fieldRow(doc, y, 'Student Name', 'Michael Reynolds');
  y = fieldRow(doc, y, 'Student Account', '#77124');
  y = fieldRow(doc, y, 'Payer', 'Reynolds Family Trust');
  y = fieldRow(doc, y, 'Payment Purpose', 'Tuition installment - Fall Term');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 2 - PAYMENT DETAIL');
  const payCols = [
    { label: 'LINE ITEM', x: 16 },
    { label: 'DESCRIPTION', x: 54 },
    { label: 'AMOUNT', x: 148 },
    { label: 'METHOD', x: 174 }
  ];
  y = tableHeader(doc, y, payCols);
  doc.text('1', 16, y);
  doc.text('Cash tuition payment received at finance cashier desk', 54, y, { maxWidth: 90 });
  doc.text('$12,000', 148, y);
  doc.text('Cash', 174, y);
  y += 9;

  y = fieldRow(doc, y, 'Total Amount Received', '$12,000');
  y = fieldRow(doc, y, 'Transaction Date', 'October 3, 2024');
  y = fieldRow(doc, y, 'Processed By', 'A. Fernandez (Finance Officer)');
  y += 5;

  doc.setDrawColor(251, 191, 36);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y - 1, 182, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(8.5);
  doc.text('IRS threshold alert: Cash receipt exceeds $10,000.', 18, y + 7);
  doc.text('Form 8300 reporting workflow triggered on transaction date.', 18, y + 14);
  doc.setTextColor(15, 23, 42);

  // Page 2 - ledger trail
  doc.addPage();
  y = header(
    doc,
    'CASH RECEIPT LEDGER TRAIL',
    'Finance Posting and Approval Log',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - ACCOUNTING POST');
  const ledCols = [
    { label: 'POST DATE', x: 16 },
    { label: 'GL ACCOUNT', x: 54 },
    { label: 'DESCRIPTION', x: 90 },
    { label: 'DEBIT', x: 154 },
    { label: 'CREDIT', x: 174 }
  ];
  y = tableHeader(doc, y, ledCols);
  const rows = [
    ['10/03/2024', '1000-Cash', 'Cash tuition intake', '$12,000', '$0'],
    ['10/03/2024', '4100-Tuition', 'Tuition revenue recognition', '$0', '$12,000']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 54, y);
    doc.text(row[2], 90, y, { maxWidth: 58 });
    doc.text(row[3], 154, y);
    doc.text(row[4], 174, y);
    y += 8;
  });
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 4 - APPROVAL AND HANDOFF');
  y = fieldRow(doc, y, 'Cashier Sign-off', 'A. Fernandez');
  y = fieldRow(doc, y, 'Accounting Reviewer', 'M. Patel');
  y = fieldRow(doc, y, 'Escalation Tag', 'FORM8300-REQUIRED');
  y = fieldRow(doc, y, 'Handoff Timestamp', 'Oct 3, 2024 16:42 ET');

  addFinanceFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'Cash_Tuition_Receipt_Oct03_2024.pdf');
}

function nbForm8300FilingRecordDetailed() {
  const doc = new jsPDF();
  const reportId = 'FIN-8300-FILE-2024-778241';
  const generatedDate = 'October 28, 2024';

  // Page 1 - filing record
  let y = header(
    doc,
    'FORM 8300 FILING RECORD',
    'IRS Filing Confirmation Packet',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 42, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('FILING METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Filing Ref', 'IRS-8300-778241'],
    ['Entity EIN', '59-4821937'],
    ['Submission Date', 'October 28, 2024'],
    ['Method', 'BSA E-Filing'],
    ['Status', 'Accepted']
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 84;
  y = sectionTitle(doc, y, 'SECTION 1 - FILED FORM DATA');
  y = fieldRow(doc, y, 'Form Type', 'IRS Form 8300');
  y = fieldRow(doc, y, 'Cash Amount Reported', '$12,000');
  y = fieldRow(doc, y, 'Date Cash Received', 'October 3, 2024');
  y = fieldRow(doc, y, 'Date Filed', 'October 28, 2024');
  y = fieldRow(doc, y, 'Submitting Officer', 'M. Patel, Controller');
  y += 4;

  const cols = [
    { label: 'FIELD', x: 16 },
    { label: 'VALUE', x: 84 },
    { label: 'SOURCE', x: 146 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['Transaction ID', 'TX-2024-1098', 'Cash receipt log'],
    ['Payer Name', 'Reynolds Family Trust', 'Tuition ledger'],
    ['Amount', '$12,000', 'Cashier intake record'],
    ['Date of Receipt', '10/03/2024', 'Receipt RCT-2024-1098'],
    ['Filing Date', '10/28/2024', 'IRS acknowledgment']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 84, y);
    doc.text(row[2], 146, y, { maxWidth: 44 });
    y += 7;
  });

  // Page 2 - timeline and timeliness flag
  doc.addPage();
  y = header(
    doc,
    'FORM 8300 FILING RECORD',
    'Timeliness Assessment Attachment',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - FILING TIMELINE');
  const tCols = [
    { label: 'DATE', x: 16 },
    { label: 'EVENT', x: 62 },
    { label: 'STATUS', x: 168 }
  ];
  y = tableHeader(doc, y, tCols);
  const tRows = [
    ['10/03/2024', 'Cash payment received and logged', 'Completed'],
    ['10/04/2024', 'Form 8300 workflow ticket opened', 'Completed'],
    ['10/18/2024', 'Legal filing deadline (15-day limit)', 'Missed'],
    ['10/28/2024', 'Form 8300 submitted to IRS', 'Completed']
  ];
  tRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 62, y, { maxWidth: 98 });
    if (row[2] === 'Missed') {
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(row[2], 168, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 8;
  });
  y += 4;

  doc.setDrawColor(239, 68, 68);
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, y - 1, 182, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text('Timeliness result: Filing submitted 10 days after statutory deadline.', 18, y + 8, { maxWidth: 174 });
  doc.text('Control status: Requires remediation and process hardening.', 18, y + 15, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  addFinanceFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'Form_8300_Filing_Oct28_2024.pdf');
}

function nbForm8300RuleSnapshotDetailed() {
  const doc = new jsPDF();
  const reportId = 'RULE-8300-6050I';
  const generatedDate = 'April 15, 2025';
  let y = header(
    doc,
    'IRS FORM 8300 RULE SNAPSHOT',
    '26 U.S.C. 6050I Requirement Summary',
    'Finance Compliance Reference'
  );
  y = sectionTitle(doc, y, 'SECTION 1 - LEGAL REQUIREMENT');
  y = fieldRow(doc, y, 'Citation', '26 U.S.C. 6050I');
  y = fieldRow(doc, y, 'Trigger', 'Cash payment exceeding $10,000');
  y = fieldRow(doc, y, 'Form Required', 'IRS Form 8300');
  y = fieldRow(doc, y, 'Filing Deadline', 'Within 15 calendar days');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 2 - CONTROL LOGIC');
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('COMPLIANT if (Cash_Amount > 10000) implies (Form8300_FiledDate <= Cash_Date + 15 days)', 18, y + 8, { maxWidth: 174 });
  doc.text('NON_COMPLIANT if filing is missing or filed after legal deadline.', 18, y + 16, { maxWidth: 174 });
  y += 30;

  y = sectionTitle(doc, y, 'SECTION 3 - CASE EXAMPLE');
  y = fieldRow(doc, y, 'Cash Date', 'October 3, 2024');
  y = fieldRow(doc, y, 'Required Deadline', 'October 18, 2024');
  y = fieldRow(doc, y, 'Filed Date', 'October 28, 2024');
  y = fieldRow(doc, y, 'Evaluation', 'NON-COMPLIANT (10 days late)');

  addFinanceFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'IRS_Form_8300_15_Day_Rule.pdf');
}

function addLabSafetyFooter(doc, reportId, generatedDate) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Laboratory Safety Office', 14, 288);
    doc.text('Chemical Hygiene Plan Compliance Audit', 14, 292);
    doc.text(`Report ID: ${reportId}`, 102, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
    doc.text(`Generated: ${generatedDate}`, 196, 288, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);
}

function nbChemicalHygieneComplianceAuditReport() {
  const doc = new jsPDF();
  const reportId = 'LAB-CHP-2025-0415';
  const generatedDate = 'April 15, 2025';
  const keyLine = 'Laboratory safety review: CHP outdated - SDS binder missing 4 chemical records - Eyewash inspection gap detected - OVERALL STATUS: NON-COMPLIANT';

  // Page 1 - cover
  let y = header(
    doc,
    'Laboratory Safety Compliance Audit',
    'Chemical Hygiene Plan Review | OSHA 29 CFR 1910.1450',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 48, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('AUDIT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['School ID', 'FL-PS-20482'],
    ['Facility Area', 'Science Laboratories'],
    ['Audit Scope', 'Chemistry and Biology Labs'],
    ['Regulation', 'OSHA 29 CFR 1910.1450'],
    ['Audit Date', generatedDate]
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 90;
  y = sectionTitle(doc, y, 'SECTION A - AUDIT OVERVIEW');
  y = fieldRow(doc, y, 'Department', 'Laboratory Safety and Facilities');
  y = fieldRow(doc, y, 'Laboratories Reviewed', 'Chemistry Lab C204, Biology Lab B117');
  y = fieldRow(doc, y, 'Primary Focus', 'CHP currency, SDS inventory, eyewash inspections');
  y = fieldRow(doc, y, 'Overall Determination', 'NON-COMPLIANT');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION B - SUMMARY FLAG');
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text('Three critical documentation and inspection control gaps were detected.', 18, y + 8, { maxWidth: 174 });
  doc.text('Immediate corrective action is required to reduce OSHA inspection exposure.', 18, y + 16, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 2 - OSHA requirement
  doc.addPage();
  y = header(
    doc,
    'Laboratory Safety Compliance Audit',
    'OSHA Laboratory Safety Requirement',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 1 - OSHA LABORATORY SAFETY REQUIREMENT');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'OSHA regulation 29 CFR 1910.1450 requires laboratories to maintain a written Chemical Hygiene Plan (CHP) describing procedures, equipment, and safety practices for handling hazardous chemicals.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 18;
  doc.text('Schools must also maintain:', 14, y);
  y += 7;
  doc.text('- Updated Safety Data Sheet (SDS) records', 18, y); y += 6;
  doc.text('- Chemical inventory lists', 18, y); y += 6;
  doc.text('- Laboratory safety training documentation', 18, y); y += 6;
  doc.text('- Weekly eyewash station inspection logs', 18, y); y += 8;

  y = sectionTitle(doc, y, 'SECTION 1A - CONTROL CHECKS');
  const reqCols = [
    { label: 'CONTROL', x: 16 },
    { label: 'REQUIREMENT DETAIL', x: 54 },
    { label: 'RESULT', x: 176 }
  ];
  y = tableHeader(doc, y, reqCols);
  const reqRows = [
    ['LAB-01', 'Written CHP updated and approved at least annually', 'FAIL'],
    ['LAB-02', 'SDS binder complete for active chemical inventory', 'FAIL'],
    ['LAB-03', 'Eyewash station inspections logged weekly', 'FAIL']
  ];
  reqRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 54, y, { maxWidth: 116 });
    doc.setTextColor(239, 68, 68);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], 176, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 8;
  });

  // Page 3 - CHP record
  doc.addPage();
  y = header(
    doc,
    'Laboratory Safety Compliance Audit',
    'Chemical Hygiene Plan Record',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - CHEMICAL HYGIENE PLAN RECORD');
  y = fieldRow(doc, y, 'Document Title', 'Chemical Hygiene Plan');
  y = fieldRow(doc, y, 'Responsible Department', 'Science Laboratory Safety');
  y = fieldRow(doc, y, 'Last Revision Date', 'August 12, 2021');
  y = fieldRow(doc, y, 'Document Version', 'CHP-REV-3');
  y = fieldRow(doc, y, 'Approved By', 'Lab Safety Coordinator');
  y += 4;

  y = fieldRow(doc, y, 'Recommended Review Frequency', 'Annual');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('Current Status:', 14, y);
  doc.text('OVERDUE', 70, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  y += 8;

  const chpCols = [
    { label: 'TIMELINE ITEM', x: 16 },
    { label: 'VALUE', x: 120 }
  ];
  y = tableHeader(doc, y, chpCols);
  const chpRows = [
    ['Last CHP Update', 'Aug 12, 2021'],
    ['Current Audit Date', 'Apr 15, 2025'],
    ['Time Since Update', '3 years 8 months'],
    ['Required Update Cadence', 'Annual']
  ];
  chpRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 120, y);
    y += 7;
  });

  // Page 4 - SDS check
  doc.addPage();
  y = header(
    doc,
    'Laboratory Safety Compliance Audit',
    'SDS Binder Inventory Check',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - SAFETY DATA SHEET (SDS) BINDER REVIEW');
  y = fieldRow(doc, y, 'Location', 'Chemistry Laboratory - Room C204');
  y = fieldRow(doc, y, 'Binder Type', 'OSHA Chemical Safety Binder');
  y = fieldRow(doc, y, 'Last Inventory Review', 'February 2025');
  y += 4;

  const sdsCols = [
    { label: 'CHEMICAL NAME', x: 16 },
    { label: 'SDS PRESENT', x: 110 },
    { label: 'STATUS', x: 166 }
  ];
  y = tableHeader(doc, y, sdsCols);
  const sdsRows = [
    ['Hydrochloric Acid', 'Yes', 'OK'],
    ['Sodium Hydroxide', 'Yes', 'OK'],
    ['Ethanol', 'Yes', 'OK'],
    ['Copper Sulfate', 'Yes', 'OK'],
    ['Ammonium Nitrate', 'No', 'Missing'],
    ['Potassium Permanganate', 'No', 'Missing'],
    ['Silver Nitrate', 'No', 'Missing'],
    ['Formaldehyde', 'No', 'Missing']
  ];
  sdsRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 110, y);
    if (row[2] === 'Missing') {
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'bold');
    }
    doc.text(row[2], 166, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 7;
  });
  y += 4;

  doc.setDrawColor(239, 68, 68);
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, y - 1, 182, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text('SDS Binder Status: 4 required SDS sheets missing.', 18, y + 8);
  doc.setTextColor(15, 23, 42);

  // Page 5 - eyewash log
  doc.addPage();
  y = header(
    doc,
    'Laboratory Safety Compliance Audit',
    'Eyewash Inspection Log Review',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 4 - LAB SAFETY EQUIPMENT INSPECTION LOG');
  y = fieldRow(doc, y, 'Equipment', 'Emergency Eyewash Station');
  y = fieldRow(doc, y, 'Location', 'Chemistry Lab C204');
  y = fieldRow(doc, y, 'Inspection Frequency', 'Weekly');
  y += 4;

  const eyeCols = [
    { label: 'INSPECTION DATE', x: 16 },
    { label: 'INSPECTOR', x: 88 },
    { label: 'STATUS', x: 160 }
  ];
  y = tableHeader(doc, y, eyeCols);
  const eyeRows = [
    ['Feb 3, 2025', 'J. Sanders', 'OK'],
    ['Feb 10, 2025', 'J. Sanders', 'OK'],
    ['Feb 17, 2025', 'J. Sanders', 'OK'],
    ['Mar 10, 2025', 'J. Sanders', 'OK']
  ];
  eyeRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 88, y);
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], 160, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 8;
  });
  y += 4;

  doc.setDrawColor(251, 191, 36);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y - 1, 182, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(8.5);
  doc.text('Inspection records show a 3-week interval between Feb 17 and Mar 10, 2025.', 18, y + 8, { maxWidth: 174 });
  doc.text('Missing weekly entries expected for Feb 24 and Mar 3 cycles.', 18, y + 15, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 6 - compliance evaluation
  doc.addPage();
  y = header(
    doc,
    'Laboratory Safety Compliance Audit',
    'Compliance Evaluation (Card Evidence)',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 5 - LAB SAFETY COMPLIANCE STATUS');
  y = fieldRow(doc, y, 'Chemical Hygiene Plan', 'Last updated August 2021 | Status: OUTDATED');
  y = fieldRow(doc, y, 'SDS Binder', '4 chemicals missing safety sheets | Status: INCOMPLETE');
  y = fieldRow(doc, y, 'Eyewash Inspection Log', '3-week inspection gap detected | Status: NON-COMPLIANT');
  y += 6;

  doc.setDrawColor(239, 68, 68);
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text(keyLine, 18, y + 8, { maxWidth: 174 });
  doc.text('OSHA lab safety status for this audit cycle: NON-COMPLIANT', 18, y + 16, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 7 - corrective action
  doc.addPage();
  y = header(
    doc,
    'Laboratory Safety Compliance Audit',
    'Required Corrective Action Plan',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 6 - REQUIRED CORRECTIVE ACTION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Immediate steps required to restore laboratory compliance:', 14, y); y += 10;
  doc.text('1. Update Chemical Hygiene Plan to current laboratory safety standards.', 18, y); y += 6;
  doc.text('2. Add SDS documentation for all newly introduced chemicals.', 18, y); y += 6;
  doc.text('3. Re-establish and document weekly eyewash inspection logs.', 18, y); y += 6;
  doc.text('4. Conduct refresher briefing for lab supervisors on documentation controls.', 18, y); y += 10;
  y = fieldRow(doc, y, 'Responsible Department', 'Science Laboratory Safety Office');
  y = fieldRow(doc, y, 'Recommended Completion Deadline', 'Within 10 working days');
  y += 4;

  doc.setDrawColor(239, 68, 68);
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, y - 1, 182, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text('OSHA inspection risk level: HIGH due to active chemistry lab operations.', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  addLabSafetyFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'Chemical_Hygiene_Compliance_Audit_2025.pdf');
}

function nbCHPRevisionLogDetailed() {
  const doc = new jsPDF();
  const reportId = 'LAB-CHPLOG-2025-0415';
  const generatedDate = 'April 15, 2025';
  let y = header(
    doc,
    'CHEMICAL HYGIENE PLAN REVISION LOG',
    'Document Control Record',
    'North Broward Preparatory'
  );
  y = sectionTitle(doc, y, 'SECTION 1 - DOCUMENT PROFILE');
  y = fieldRow(doc, y, 'Document Name', 'Chemical Hygiene Plan');
  y = fieldRow(doc, y, 'Current Version', 'CHP-REV-3');
  y = fieldRow(doc, y, 'Last Revision Date', 'August 12, 2021');
  y = fieldRow(doc, y, 'Custodian', 'Lab Safety Coordinator');
  y += 4;

  const cols = [
    { label: 'REV', x: 16 },
    { label: 'DATE', x: 40 },
    { label: 'CHANGE SUMMARY', x: 74 },
    { label: 'APPROVER', x: 166 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['1', '08/30/2018', 'Initial CHP issue and baseline hazard procedures', 'A. Klein'],
    ['2', '09/05/2019', 'Updated PPE matrix and spill response contacts', 'A. Klein'],
    ['3', '08/12/2021', 'Added storage controls for oxidizers and acids', 'J. Sanders']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 40, y);
    doc.text(row[2], 74, y, { maxWidth: 86 });
    doc.text(row[3], 166, y);
    y += 8;
  });
  y += 6;

  doc.setDrawColor(239, 68, 68);
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, y - 1, 182, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text('No revisions recorded after August 12, 2021. Annual review requirement not met.', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  addLabSafetyFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'CHP_Revision_Log_2021.pdf');
}

function nbSDSBinderIndexDetailed() {
  const doc = new jsPDF();
  const reportId = 'LAB-SDS-2025-0415';
  const generatedDate = 'April 15, 2025';
  let y = header(
    doc,
    'SDS BINDER INVENTORY RECORD',
    'Chemistry Lab C204 Safety Data Sheet Audit',
    'North Broward Preparatory'
  );
  y = sectionTitle(doc, y, 'SECTION 1 - BINDER PROFILE');
  y = fieldRow(doc, y, 'Location', 'Chemistry Laboratory - Room C204');
  y = fieldRow(doc, y, 'Binder Type', 'OSHA Hazard Communication SDS Binder');
  y = fieldRow(doc, y, 'Inventory Review Date', 'February 2025');
  y = fieldRow(doc, y, 'Auditor', 'J. Sanders');
  y += 4;

  const cols = [
    { label: 'CHEMICAL', x: 16 },
    { label: 'CATEGORY', x: 92 },
    { label: 'SDS', x: 136 },
    { label: 'STATUS', x: 164 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['Hydrochloric Acid', 'Corrosive', 'Yes', 'OK'],
    ['Sodium Hydroxide', 'Corrosive', 'Yes', 'OK'],
    ['Ethanol', 'Flammable', 'Yes', 'OK'],
    ['Copper Sulfate', 'Irritant', 'Yes', 'OK'],
    ['Ammonium Nitrate', 'Oxidizer', 'No', 'Missing'],
    ['Potassium Permanganate', 'Oxidizer', 'No', 'Missing'],
    ['Silver Nitrate', 'Corrosive', 'No', 'Missing'],
    ['Formaldehyde', 'Toxic', 'No', 'Missing']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 92, y);
    doc.text(row[2], 136, y);
    if (row[3] === 'Missing') {
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'bold');
    }
    doc.text(row[3], 164, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 7;
  });
  y += 4;

  doc.setDrawColor(239, 68, 68);
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, y - 1, 182, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.text('SDS binder deficiency: 4 records missing for active lab chemicals.', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  addLabSafetyFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'SDS_Binder_Index_Feb2025.pdf');
}

function nbEyewashInspectionLogDetailed() {
  const doc = new jsPDF();
  const reportId = 'LAB-EYE-2025-0415';
  const generatedDate = 'April 15, 2025';
  let y = header(
    doc,
    'EYEWASH STATION INSPECTION LOG',
    'Weekly Safety Equipment Inspection Register',
    'North Broward Preparatory'
  );
  y = sectionTitle(doc, y, 'SECTION 1 - EQUIPMENT PROFILE');
  y = fieldRow(doc, y, 'Equipment', 'Emergency Eyewash Station');
  y = fieldRow(doc, y, 'Location', 'Chemistry Laboratory C204');
  y = fieldRow(doc, y, 'Required Frequency', 'Weekly');
  y = fieldRow(doc, y, 'Responsible Inspector', 'J. Sanders');
  y += 4;

  const cols = [
    { label: 'WEEK OF', x: 16 },
    { label: 'INSPECTION DATE', x: 62 },
    { label: 'INSPECTOR', x: 118 },
    { label: 'STATUS', x: 164 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['Feb 3, 2025', 'Feb 3, 2025', 'J. Sanders', 'OK'],
    ['Feb 10, 2025', 'Feb 10, 2025', 'J. Sanders', 'OK'],
    ['Feb 17, 2025', 'Feb 17, 2025', 'J. Sanders', 'OK'],
    ['Feb 24, 2025', '--', '---', 'Missing'],
    ['Mar 3, 2025', '--', '---', 'Missing'],
    ['Mar 10, 2025', 'Mar 10, 2025', 'J. Sanders', 'OK']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 62, y);
    doc.text(row[2], 118, y);
    if (row[3] === 'Missing') {
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'bold');
    }
    doc.text(row[3], 164, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 7;
  });
  y += 5;

  doc.setDrawColor(251, 191, 36);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y - 1, 182, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(8.5);
  doc.text('Gap detected: weekly inspections not documented for Feb 24 and Mar 3 cycles.', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  addLabSafetyFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'Eyewash_Inspection_Log_Q1_2025.pdf');
}

function addAcademicFooter(doc, reportId, generatedDate) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Academic Records Office', 14, 288);
    doc.text('Attendance Compliance Report', 14, 292);
    doc.text(`Report ID: ${reportId}`, 102, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
    doc.text(`Generated: ${generatedDate}`, 196, 288, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);
}

function nbAcademicAttendanceComplianceReport() {
  const doc = new jsPDF();
  const reportId = 'ATT-170DAY-2025';
  const generatedDate = 'Feb 17, 2025';
  const proofLine = 'Total instructional days scheduled: 182 - YTD days completed as of Feb 17: 103';

  // Page 1 - report header
  let y = header(
    doc,
    'Academic Attendance Compliance Report',
    'Instructional Day Verification | Rule 6A-1.09512, F.A.C.',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 48, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('REPORT METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['School ID', 'FL-PS-20482'],
    ['County', 'Broward County'],
    ['Enrollment', '847'],
    ['Regulation', 'Rule 6A-1.09512, F.A.C.'],
    ['Generated', generatedDate]
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 90;
  y = sectionTitle(doc, y, 'SECTION A - ATTENDANCE AUDIT SCOPE');
  y = fieldRow(doc, y, 'Department', 'Office of Academic Records');
  y = fieldRow(doc, y, 'Review Objective', 'Verify instructional day compliance and register maintenance');
  y = fieldRow(doc, y, 'Academic Year', '2024-2025');
  y = fieldRow(doc, y, 'Status', 'FULLY COMPLIANT');
  y += 4;

  doc.setDrawColor(22, 163, 74);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y - 1, 182, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8.5);
  doc.text('School schedule exceeds the 170-day minimum threshold.', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 2 - calendar summary
  doc.addPage();
  y = header(
    doc,
    'Academic Attendance Compliance Report',
    'Academic Calendar Instructional Day Summary',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 1 - ACADEMIC CALENDAR REVIEW');
  const summaryCols = [
    { label: 'FIELD', x: 16 },
    { label: 'VALUE', x: 118 }
  ];
  y = tableHeader(doc, y, summaryCols);
  const summaryRows = [
    ['School Year Start', 'Aug 12, 2024'],
    ['School Year End', 'May 29, 2025'],
    ['Total Weeks', '40'],
    ['Scheduled Days', '182']
  ];
  summaryRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 118, y);
    y += 7;
  });
  y += 4;

  const monthCols = [
    { label: 'MONTH', x: 16 },
    { label: 'INSTRUCTIONAL DAYS', x: 118 }
  ];
  y = tableHeader(doc, y, monthCols);
  const monthRows = [
    ['Aug', '14'],
    ['Sep', '20'],
    ['Oct', '22'],
    ['Nov', '18'],
    ['Dec', '15'],
    ['Jan', '21'],
    ['Feb', '19'],
    ['Mar', '18'],
    ['Apr', '20'],
    ['May', '15']
  ];
  monthRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 118, y);
    y += 6;
  });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Total: 182 instructional days', 16, y);
  y += 8;

  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y - 1, 182, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(8.5);
  doc.text(proofLine, 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 3 - attendance register extract
  doc.addPage();
  y = header(
    doc,
    'Academic Attendance Compliance Report',
    'Daily Attendance Register Extract',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - DAILY ATTENDANCE REGISTER (EXTRACT)');
  const regCols = [
    { label: 'DATE', x: 16 },
    { label: 'GRADE K', x: 64 },
    { label: 'GRADE 6', x: 108 },
    { label: 'GRADE 12', x: 154 }
  ];
  y = tableHeader(doc, y, regCols);
  const regRows = [
    ['Feb 10 2025', '58/60', '91/94', '71/73'],
    ['Feb 11 2025', '59/60', '92/94', '70/73'],
    ['Feb 12 2025', '57/60', '90/94', '72/73'],
    ['Feb 13 2025', '58/60', '92/94', '71/73'],
    ['Feb 14 2025', '60/60', '93/94', '73/73'],
    ['Feb 17 2025', '59/60', '91/94', '72/73']
  ];
  regRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 64, y);
    doc.text(row[2], 108, y);
    doc.text(row[3], 154, y);
    y += 7;
  });
  y += 5;
  y = fieldRow(doc, y, 'Attendance Register Maintained', 'Daily');
  y = fieldRow(doc, y, 'Last Recorded Entry', 'February 17, 2025');

  // Page 4 - compliance evaluation
  doc.addPage();
  y = header(
    doc,
    'Academic Attendance Compliance Report',
    'Instructional Day Compliance Evaluation',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - INSTRUCTIONAL DAY COMPLIANCE REVIEW');
  y = fieldRow(doc, y, 'Required Minimum Instructional Days', '170');
  y = fieldRow(doc, y, 'Scheduled Instructional Days', '182');
  y = fieldRow(doc, y, 'Days Completed (as of Feb 17, 2025)', '103');
  y = fieldRow(doc, y, 'Projected Total Instructional Days', '182');
  y += 6;

  doc.setDrawColor(22, 163, 74);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y - 1, 182, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8.5);
  doc.text('Instructional day requirement satisfied.', 18, y + 8, { maxWidth: 174 });
  doc.text('Status: FULLY COMPLIANT', 18, y + 15, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 5 - administrative verification
  doc.addPage();
  y = header(
    doc,
    'Academic Attendance Compliance Report',
    'Administrative Verification',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 4 - ADMINISTRATIVE CERTIFICATION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'This attendance register review confirms that North Broward Preparatory maintains daily attendance records and schedules instructional days in excess of the minimum requirement defined under Rule 6A-1.09512, F.A.C.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 22;
  y = fieldRow(doc, y, 'Registrar', 'Lisa Matthews');
  y = fieldRow(doc, y, 'Title', 'Director of Academic Records');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature:', 14, y);
  doc.line(36, y + 1, 112, y + 1);
  y += 10;
  y = fieldRow(doc, y, 'Date', 'February 17, 2025');

  addAcademicFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'Attendance_Compliance_Report_2025.pdf');
}

function nbInstructionCalendarDetailed() {
  const doc = new jsPDF();
  const reportId = 'ATT-CAL-2025-0217';
  const generatedDate = 'Feb 17, 2025';
  let y = header(
    doc,
    'Instruction Calendar 2024-25',
    'Academic Calendar Compliance Extract',
    'North Broward Preparatory'
  );

  y = sectionTitle(doc, y, 'SECTION 1 - CALENDAR OVERVIEW');
  y = fieldRow(doc, y, 'Instruction Start', 'Aug 12, 2024');
  y = fieldRow(doc, y, 'Instruction End', 'May 29, 2025');
  y = fieldRow(doc, y, 'Scheduled Instructional Days', '182');
  y = fieldRow(doc, y, 'Compliance Threshold', '170 days');
  y += 4;

  const cols = [
    { label: 'MONTH', x: 16 },
    { label: 'DAYS', x: 110 },
    { label: 'NOTES', x: 138 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['Aug 2024', '14', 'Opening month'],
    ['Sep 2024', '20', 'Full month'],
    ['Oct 2024', '22', 'Full month'],
    ['Nov 2024', '18', 'Holiday adjusted'],
    ['Dec 2024', '15', 'Winter break adjusted'],
    ['Jan 2025', '21', 'Full month'],
    ['Feb 2025', '19', 'Current month'],
    ['Mar 2025', '18', 'Spring break adjusted'],
    ['Apr 2025', '20', 'Full month'],
    ['May 2025', '15', 'Closing month']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 110, y);
    doc.text(row[2], 138, y, { maxWidth: 50 });
    y += 7;
  });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Total instructional days: 182', 16, y);

  doc.addPage();
  y = header(
    doc,
    'Instruction Calendar 2024-25',
    'Calendar Compliance Notes',
    'North Broward Preparatory'
  );
  y = sectionTitle(doc, y, 'SECTION 2 - COMPLIANCE LINE');
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y - 1, 182, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(8.5);
  doc.text('Total instructional days scheduled: 182 - YTD days completed as of Feb 17: 103', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);
  y += 24;
  y = fieldRow(doc, y, 'Validation Result', 'Meets 170-day requirement');
  y = fieldRow(doc, y, 'Reviewed By', 'Registrar Office');

  addAcademicFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'Instruction_Calendar_2024_25.pdf');
}

function nbAttendanceRegisterExtractDetailed() {
  const doc = new jsPDF();
  const reportId = 'ATT-REG-2025-0217';
  const generatedDate = 'Feb 17, 2025';
  let y = header(
    doc,
    'Attendance Register Extract',
    'Sample Week Validation Record',
    'North Broward Preparatory'
  );

  y = sectionTitle(doc, y, 'SECTION 1 - REGISTER EXTRACT (FEB 10-17, 2025)');
  const cols = [
    { label: 'DATE', x: 16 },
    { label: 'GRADE K', x: 64 },
    { label: 'GRADE 6', x: 108 },
    { label: 'GRADE 12', x: 154 }
  ];
  y = tableHeader(doc, y, cols);
  const rows = [
    ['Feb 10 2025', '58/60', '91/94', '71/73'],
    ['Feb 11 2025', '59/60', '92/94', '70/73'],
    ['Feb 12 2025', '57/60', '90/94', '72/73'],
    ['Feb 13 2025', '58/60', '92/94', '71/73'],
    ['Feb 14 2025', '60/60', '93/94', '73/73'],
    ['Feb 17 2025', '59/60', '91/94', '72/73']
  ];
  rows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 64, y);
    doc.text(row[2], 108, y);
    doc.text(row[3], 154, y);
    y += 7;
  });
  y += 5;
  y = fieldRow(doc, y, 'Attendance Register Maintained', 'Daily');
  y = fieldRow(doc, y, 'Last Recorded Entry', 'Feb 17, 2025');

  doc.addPage();
  y = header(
    doc,
    'Attendance Register Extract',
    'Registrar Certification',
    'North Broward Preparatory'
  );
  y = sectionTitle(doc, y, 'SECTION 2 - RECORD CERTIFICATION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('This attendance extract is generated from the registrar system and reflects official daily attendance entries for the listed dates and grade bands.', 14, y, { maxWidth: 182 });
  y += 16;
  y = fieldRow(doc, y, 'Prepared By', 'Lisa Matthews');
  y = fieldRow(doc, y, 'Role', 'Director of Academic Records');
  y = fieldRow(doc, y, 'Certification Date', 'Feb 17, 2025');

  addAcademicFooter(doc, reportId, generatedDate);
  save(doc, 'north_broward', 'Attendance_Register_Sample_Feb2025.pdf');
}

function addScholarshipFooter(doc, reportId, confirmationId, generatedDate) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Scholarship Administration', 14, 288);
    doc.text('SCF-1 Compliance Submission Report', 14, 292);
    doc.text(`Confirmation #: ${confirmationId}`, 102, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
    doc.text(`Generated: ${generatedDate}`, 196, 288, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);
}

function nbSCF1SubmissionPacket() {
  const doc = new jsPDF();
  const reportId = 'SCH-SCF1-2025-0338';
  const confirmationId = 'FL-2025-0338';
  const submissionDate = 'February 22, 2025';
  const generatedDate = 'Feb 22, 2025';

  // Page 1 - Submission record
  let y = header(
    doc,
    'Scholarship Compliance Submission',
    'IEPC Scholarship Compliance Form (SCF-1) | Academic Year 2024-2025',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 48, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('SUBMISSION METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['School Name', 'North Broward Preparatory'],
    ['School ID', 'FL-PS-20482'],
    ['Reporting Year', '2024-2025'],
    ['Submission Type', 'Annual Scholarship Compliance'],
    ['Report ID', reportId]
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 90;
  y = sectionTitle(doc, y, 'SECTION 1 - SCF-1 SUBMISSION RECORD');
  y = fieldRow(doc, y, 'Submission Date', submissionDate);
  y = fieldRow(doc, y, 'IEPC Confirmation #', confirmationId);
  y = fieldRow(doc, y, 'Submission Method', 'Online Portal');
  y = fieldRow(doc, y, 'Submission Status', 'ACCEPTED');
  y = fieldRow(doc, y, 'Deadline', 'March 1, 2025');
  y = fieldRow(doc, y, 'Days Submitted Early', '6');
  y += 4;

  doc.setDrawColor(22, 163, 74);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y - 1, 182, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8.5);
  doc.text('Submission Date: Feb 22, 2025 - IEPC Confirmation #FL-2025-0338', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 2 - Scholarship summary
  doc.addPage();
  y = header(
    doc,
    'Scholarship Compliance Submission',
    'Scholarship Student Participation Summary',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - SCHOLARSHIP PROGRAM PARTICIPATION');
  const sumCols = [
    { label: 'SCHOLARSHIP PROGRAM', x: 16 },
    { label: 'STUDENTS', x: 150 }
  ];
  y = tableHeader(doc, y, sumCols);
  const summaryRows = [
    ['Florida Tax Credit', '48'],
    ['Family Empowerment', '72'],
    ['Hope Scholarship', '11']
  ];
  summaryRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 150, y);
    y += 8;
  });
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Scholarship Students: 131', 16, y);
  doc.setFont('helvetica', 'normal');

  // Page 3 - Scholarship roster
  doc.addPage();
  y = header(
    doc,
    'Scholarship Compliance Submission',
    'Attached Scholarship Student Roster',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - SCHOLARSHIP STUDENT RECORDS');
  const rosterCols = [
    { label: 'STUDENT ID', x: 16 },
    { label: 'STUDENT NAME', x: 52 },
    { label: 'PROGRAM', x: 118 }
  ];
  y = tableHeader(doc, y, rosterCols);
  const rosterRows = [
    ['1208', 'Olivia Carter', 'Florida Tax Credit'],
    ['1321', 'Daniel Lopez', 'Family Empowerment'],
    ['1388', 'Emily Nguyen', 'Hope Scholarship'],
    ['1427', 'Sofia Martinez', 'Florida Tax Credit'],
    ['1481', 'Ethan Brooks', 'Family Empowerment'],
    ['1514', 'Noah Jenkins', 'Family Empowerment'],
    ['1560', 'Ava Thompson', 'Florida Tax Credit'],
    ['1607', 'Grace Kim', 'Family Empowerment'],
    ['1643', 'Mason Patel', 'Hope Scholarship'],
    ['1702', 'Lucas Rivera', 'Family Empowerment']
  ];
  rosterRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 52, y);
    doc.text(row[2], 118, y);
    y += 7;
  });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Total scholarship records attached: 131', 16, y);
  doc.setFont('helvetica', 'normal');

  // Page 4 - Compliance verification
  doc.addPage();
  y = header(
    doc,
    'Scholarship Compliance Submission',
    'Compliance Verification',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 4 - COMPLIANCE VERIFICATION');
  y = fieldRow(doc, y, 'Required Filing Deadline', 'March 1, 2025');
  y = fieldRow(doc, y, 'Submission Date', submissionDate);
  y = fieldRow(doc, y, 'Days Before Deadline', '6');
  y += 6;
  doc.setDrawColor(22, 163, 74);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y - 1, 182, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8.5);
  doc.text('SCF-1 annual reporting requirement satisfied.', 18, y + 8);
  doc.text('Status: FULLY COMPLIANT', 18, y + 15);
  doc.setTextColor(15, 23, 42);

  // Page 5 - Certification
  doc.addPage();
  y = header(
    doc,
    'Scholarship Compliance Submission',
    'Administrator Certification',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 5 - SCHOOL ADMINISTRATOR CERTIFICATION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'I certify that the scholarship compliance information submitted through Form SCF-1 accurately reflects all students receiving state scholarship assistance during the 2024-2025 academic year.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 22;
  y = fieldRow(doc, y, 'Administrator', 'Dr. John T. Harrington');
  y = fieldRow(doc, y, 'Title', 'Principal');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature:', 14, y);
  doc.line(36, y + 1, 112, y + 1);
  y += 10;
  y = fieldRow(doc, y, 'Date', submissionDate);

  addScholarshipFooter(doc, reportId, confirmationId, generatedDate);
  save(doc, 'north_broward', 'SCF1_Scholarship_Form.pdf');
}

function addTuitionFooter(doc, documentId, publishedDate) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Finance Office', 14, 288);
    doc.text('Tuition Schedule Compliance Report', 14, 292);
    doc.text(`Document ID: ${documentId}`, 102, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
    doc.text(`Published: ${publishedDate}`, 196, 288, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);
}

function nbTuitionFeeScheduleComplianceReport() {
  const doc = new jsPDF();
  const documentId = 'FIN-TUITION-2025';
  const publishedDate = 'Aug 5, 2024';
  const keyLine = 'Tuition Schedule 2024-25 - Standard Rate: $9,800 - Scholarship Rate: $9,800 - Rate Parity: CONFIRMED';

  // Page 1 - Publication record
  let y = header(
    doc,
    'Tuition and Fee Schedule Report',
    'Academic Year 2024-2025 | Scholarship Rate Compliance Review',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 46, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('PUBLICATION METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['School ID', 'FL-PS-20482'],
    ['Publication Date', 'August 5, 2024'],
    ['Policy Document', 'Tuition Schedule 2024-2025'],
    ['Compliance Statute', 's.1002.421, F.S.'],
    ['Document ID', documentId]
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 88;
  y = sectionTitle(doc, y, 'SECTION 1 - TUITION SCHEDULE PUBLICATION RECORD');
  y = fieldRow(doc, y, 'Policy Effective Date', 'August 2024');
  y = fieldRow(doc, y, 'Next Review Date', 'July 2025');
  y = fieldRow(doc, y, 'Publishing Office', 'Finance and Admissions');
  y = fieldRow(doc, y, 'Publication Status', 'Published and Active');
  y += 4;

  // Page 2 - Standard tuition schedule
  doc.addPage();
  y = header(
    doc,
    'Tuition and Fee Schedule Report',
    'Standard Tuition Rate Table',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - STANDARD TUITION RATES');
  const stdCols = [
    { label: 'GRADE LEVEL', x: 16 },
    { label: 'ANNUAL TUITION', x: 118 }
  ];
  y = tableHeader(doc, y, stdCols);
  const stdRows = [
    ['K - Grade 2', '$9,800'],
    ['Grade 3-5', '$9,800'],
    ['Grade 6-8', '$9,800'],
    ['Grade 9-12', '$9,800']
  ];
  stdRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 118, y);
    y += 8;
  });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Tuition rates apply to all enrolled students and include standard instructional services.', 16, y, { maxWidth: 178 });

  // Page 3 - Scholarship parity verification (key proof)
  doc.addPage();
  y = header(
    doc,
    'Tuition and Fee Schedule Report',
    'Scholarship Tuition Rate Verification',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - SCHOLARSHIP TUITION RATE VERIFICATION');
  const cmpCols = [
    { label: 'TUITION CATEGORY', x: 16 },
    { label: 'ANNUAL RATE', x: 118 }
  ];
  y = tableHeader(doc, y, cmpCols);
  const cmpRows = [
    ['Standard Tuition Rate', '$9,800'],
    ['Scholarship Tuition Rate', '$9,800']
  ];
  cmpRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 118, y);
    y += 8;
  });
  y += 4;

  doc.setDrawColor(22, 163, 74);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y - 1, 182, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8.5);
  doc.text(keyLine, 18, y + 8, { maxWidth: 174 });
  doc.text('No additional surcharges or differential fees detected.', 18, y + 15, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);
  y += 30;

  y = sectionTitle(doc, y, 'COMPLIANCE STATUS');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Scholarship tuition rates match the standard tuition schedule.', 16, y);
  y += 6;
  doc.text('Rate parity requirement under s.1002.421, F.S. is satisfied.', 16, y);

  // Page 4 - Fee structure
  doc.addPage();
  y = header(
    doc,
    'Tuition and Fee Schedule Report',
    'Additional Fee Structure Overview',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 4 - ADDITIONAL SCHOOL FEES');
  const feeCols = [
    { label: 'FEE TYPE', x: 16 },
    { label: 'AMOUNT', x: 118 }
  ];
  y = tableHeader(doc, y, feeCols);
  const feeRows = [
    ['Registration Fee', '$150'],
    ['Technology Fee', '$120'],
    ['Activity Fee', '$80']
  ];
  feeRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 118, y);
    y += 8;
  });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Scholarship students are not subject to additional fees exceeding those applied to non-scholarship students.', 16, y, { maxWidth: 178 });

  // Page 5 - Certification
  doc.addPage();
  y = header(
    doc,
    'Tuition and Fee Schedule Report',
    'Finance Office Certification',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 5 - FINANCE OFFICE CERTIFICATION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'This tuition schedule has been reviewed to ensure compliance with Florida private school scholarship program requirements under s.1002.421, F.S.',
    14,
    y,
    { maxWidth: 182 }
  );
  y += 16;
  doc.text('Scholarship tuition rates match standard tuition rates for the 2024-2025 academic year.', 14, y, { maxWidth: 182 });
  y += 14;
  y = fieldRow(doc, y, 'Finance Director', 'Michael Anderson');
  y = fieldRow(doc, y, 'Title', 'Director of Finance');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature:', 14, y);
  doc.line(36, y + 1, 112, y + 1);
  y += 10;
  y = fieldRow(doc, y, 'Date', 'August 5, 2024');

  addTuitionFooter(doc, documentId, publishedDate);
  save(doc, 'north_broward', 'Tuition_Fee_Schedule_2024_25.pdf');
}

function addInsuranceFooter(doc, policyNumber, generatedDate) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('North Broward Preparatory - Risk Management Office', 14, 288);
    doc.text('Insurance Coverage Verification Report', 14, 292);
    doc.text(`Policy #: ${policyNumber}`, 102, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, 196, 292, { align: 'right' });
    doc.text(`Generated: ${generatedDate}`, 196, 288, { align: 'right' });
  }
  doc.setTextColor(15, 23, 42);
}

function nbCertificateOfInsuranceComplianceReport() {
  const doc = new jsPDF();
  const policyNumber = 'GLI-2024-NB-77821';
  const generatedDate = 'Sept 1, 2024';
  const carrier = 'National School Insurance Group';

  // Page 1 - Certificate summary
  let y = header(
    doc,
    'Certificate of Liability Insurance',
    'General Liability Insurance Certificate | Compliance Review - s.316.615(4), F.S.',
    'North Broward Preparatory'
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(118, 34, 78, 46, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CERTIFICATE METADATA', 122, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const metaRows = [
    ['Policy Number', policyNumber],
    ['Effective Date', 'September 1, 2024'],
    ['Expiration Date', 'August 31, 2025'],
    ['Policy Type', 'General Liability'],
    ['Carrier', 'NSIG']
  ];
  let my = 45;
  metaRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${row[0]}:`, 122, my);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 152, my);
    my += 6;
  });
  doc.setTextColor(15, 23, 42);

  y = 88;
  y = sectionTitle(doc, y, 'INSURED ORGANIZATION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('North Broward Preparatory School', 14, y); y += 6;
  doc.text('7600 Lyons Rd', 14, y); y += 6;
  doc.text('Coconut Creek, FL 33073', 14, y); y += 8;

  y = sectionTitle(doc, y, 'INSURANCE PROVIDER');
  y = fieldRow(doc, y, 'Insurance Carrier', carrier);
  y = fieldRow(doc, y, 'Policy Type', 'General Liability');
  y += 4;

  const covCols = [
    { label: 'COVERAGE TYPE', x: 16 },
    { label: 'LIMIT', x: 118 }
  ];
  y = tableHeader(doc, y, covCols);
  doc.text('General Liability', 16, y);
  doc.text('$1,000,000', 118, y);
  y += 8;
  doc.text('Aggregate Coverage', 16, y);
  doc.text('$3,000,000', 118, y);
  y += 10;

  doc.setDrawColor(22, 163, 74);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y - 1, 182, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8.5);
  doc.text('General Liability Coverage - Expiration: 08/31/2025 - Per Occurrence: $1,000,000 - Aggregate: $3,000,000', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 2 - Coverage details
  doc.addPage();
  y = header(
    doc,
    'Insurance Coverage Verification Report',
    'Liability Coverage Details',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 1 - LIABILITY COVERAGE DETAILS');
  const detCols = [
    { label: 'COVERAGE CATEGORY', x: 16 },
    { label: 'LIMIT', x: 150 }
  ];
  y = tableHeader(doc, y, detCols);
  const detRows = [
    ['General Liability', '$1,000,000'],
    ['Personal Injury Liability', '$1,000,000'],
    ['Medical Expense Coverage', '$50,000'],
    ['General Aggregate', '$3,000,000'],
    ['Products/Completed Operations', '$2,000,000']
  ];
  detRows.forEach(row => {
    doc.text(row[0], 16, y);
    doc.text(row[1], 150, y);
    y += 8;
  });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Coverage applies to all school premises, including classroom facilities and transportation operations.', 16, y, { maxWidth: 178 });

  // Page 3 - Policy verification
  doc.addPage();
  y = header(
    doc,
    'Insurance Coverage Verification Report',
    'Policy Verification Summary',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 2 - POLICY VERIFICATION');
  y = fieldRow(doc, y, 'Insurance Carrier', carrier);
  y = fieldRow(doc, y, 'Policy Number', policyNumber);
  y = fieldRow(doc, y, 'Coverage Type', 'General Liability');
  y = fieldRow(doc, y, 'Policy Status', 'ACTIVE');
  y = fieldRow(doc, y, 'Policy Expiration', 'August 31, 2025');
  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y - 1, 182, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Coverage verification confirms that the school maintains liability coverage exceeding the minimum limits required for school transportation and facility operations.', 18, y + 8, { maxWidth: 174 });
  y += 28;

  doc.setDrawColor(22, 163, 74);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y - 1, 182, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8.5);
  doc.text('Coverage limits verified | Policy active through Aug 31, 2025', 18, y + 8, { maxWidth: 174 });
  doc.setTextColor(15, 23, 42);

  // Page 4 - Compliance certification
  doc.addPage();
  y = header(
    doc,
    'Insurance Coverage Verification Report',
    'Compliance Certification',
    'North Broward Preparatory'
  );
  y = 48;
  y = sectionTitle(doc, y, 'SECTION 3 - COMPLIANCE CERTIFICATION');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('This certificate confirms that North Broward Preparatory maintains active liability insurance coverage in accordance with Florida transportation safety requirements under s.316.615(4), F.S.', 14, y, { maxWidth: 182 });
  y += 20;
  y = fieldRow(doc, y, 'Risk Management Officer', 'David Harrington');
  y = fieldRow(doc, y, 'Title', 'Director of Finance and Risk Management');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature:', 14, y);
  doc.line(36, y + 1, 112, y + 1);
  y += 10;
  y = fieldRow(doc, y, 'Date', 'September 1, 2024');

  addInsuranceFooter(doc, policyNumber, generatedDate);
  save(doc, 'north_broward', 'Certificate_of_Insurance_2024_25.pdf');
}

function generateEvidencePackets() {
  const nbSchool = 'North Broward Preparatory';
  const wmSchool = 'Windermere Preparatory';

  const northBrowardDocs = [
    {
      name: 'Compliance_Audit_Workpaper_2025.pdf',
      title: 'Compliance Audit Workpaper',
      subtitle: 'Rule-by-rule extracted evidence log',
      lines: [
        'Audit Scope: 28 regulations (state + federal)',
        'School: North Broward Preparatory',
        'Workpaper Type: Synthetic compliance extract for demo evidence viewer',
        'This file is used as fallback evidence when a rule has no dedicated source artifact.',
        'Latest update: February 2026'
      ]
    },
  ];

  const windermereDocs = [
    {
      name: 'Compliance_Audit_Workpaper_2025.pdf',
      title: 'Compliance Audit Workpaper',
      subtitle: 'Rule-by-rule extracted evidence log',
      lines: [
        'Audit Scope: 28 regulations (state + federal)',
        'School: Windermere Preparatory',
        'Workpaper Type: Synthetic compliance extract for demo evidence viewer',
        'This file is used as fallback evidence when a rule has no dedicated source artifact.',
        'Latest update: February 2026'
      ]
    },
    {
      name: 'Instruction_Calendar_2024_25.pdf',
      title: 'Instruction Calendar 2024-25',
      subtitle: 'Calendar compliance evidence',
      lines: [
        'Instruction Start: Aug 12, 2024',
        'Instruction End: May 28, 2025',
        'Planned Instructional Days: 180',
        'Validation Result: Meets 170-day requirement'
      ]
    },
    {
      name: 'Annual_Survey_Notary_Deficiency_Notice.pdf',
      title: 'Notary Deficiency Notice',
      subtitle: 'Annual survey submission exception',
      lines: [
        'Survey received: May 3, 2025',
        'Notary seal status: missing',
        'Result: filing is late and incomplete'
      ]
    },
    {
      name: 'VECHS_Record_Martinez_J.pdf',
      title: 'VECHS Clearance Record',
      subtitle: 'J. Martinez',
      lines: [
        'Last screening date: June 10, 2019',
        'Expiration date: June 10, 2024',
        'Status at audit date: expired'
      ]
    },
    {
      name: 'Teacher_Contract_Rodriguez.pdf',
      title: 'Teacher Employment Contract',
      subtitle: 'S. Rodriguez',
      lines: ['Role: History Teacher', 'Contract term: 2024-25', 'Signed by HR and staff member']
    },
    {
      name: 'Teacher_Contract_Kim.pdf',
      title: 'Teacher Employment Contract',
      subtitle: 'Y. Kim',
      lines: ['Role: Science Teacher', 'Contract term: 2024-25', 'Signed by HR and staff member']
    },
    {
      name: 'Teacher_Contract_Davis.pdf',
      title: 'Teacher Employment Contract',
      subtitle: 'J. Davis',
      lines: ['Role: Art Teacher', 'Contract term: 2024-25', 'Signed by HR and staff member']
    },
    {
      name: 'Degree_Certificate_Rodriguez.pdf',
      title: 'Degree Certificate',
      subtitle: 'S. Rodriguez',
      lines: ['Degree listed in contract', 'Official transcript: not attached']
    },
    {
      name: 'Degree_Certificate_Kim.pdf',
      title: 'Degree Certificate',
      subtitle: 'Y. Kim',
      lines: ['Degree listed in contract', 'Official transcript: not attached']
    },
    {
      name: 'Degree_Certificate_Davis.pdf',
      title: 'Degree Certificate',
      subtitle: 'J. Davis',
      lines: ['Degree listed in contract', 'Official transcript: not attached']
    },
    {
      name: 'DH684_Grade7_Missing_Notice.pdf',
      title: 'DH-684 Missing Section Notice',
      subtitle: 'Grade 7 data exception',
      lines: [
        'Kindergarten data submitted successfully.',
        'Grade 7 section is blank.',
        'Result: submission incomplete.'
      ]
    },
    {
      name: 'FMLA_Poster_Walkthrough_Report.pdf',
      title: 'FMLA Poster Walkthrough',
      subtitle: 'Facility compliance inspection note',
      lines: [
        'Inspection date: Feb 2025',
        'Locations reviewed: staff lounge, teacher workroom, HR office',
        'WH-1420 poster not found in posted locations'
      ]
    },
    {
      name: 'BOI_Requirement_Notice_2024.pdf',
      title: 'BOI Filing Requirement Notice',
      subtitle: 'FinCEN Corporate Transparency reminder',
      lines: [
        'Initial filing required for existing entities by Jan 1, 2024.',
        'Entity type: corporate school operator',
        'Observed status: filing confirmation not available'
      ]
    },
    {
      name: 'SEVIS_I20_Log.pdf',
      title: 'SEVIS I-20 Master Log',
      subtitle: 'Supplemental evidence copy',
      lines: ['Total international students: 52', 'Statuses: 50 active, 2 initial', 'Activation follow-up required']
    }
  ];

  northBrowardDocs.forEach(doc => {
    evidenceDoc('north_broward', doc.name, doc.title, doc.subtitle, nbSchool, doc.lines);
  });

  windermereDocs.forEach(doc => {
    evidenceDoc('windermere', doc.name, doc.title, doc.subtitle, wmSchool, doc.lines);
  });

  // ADM-001 uses richer, institution-style support artifacts for demos.
  nbNotarySealVerificationDoc();
  nbSurveyRuleSnapshotDoc();
  nbAcademicAttendanceComplianceReport();
  nbInstructionCalendarDetailed();
  nbAttendanceRegisterExtractDetailed();
  nbSCF1SubmissionPacket();
  nbTuitionFeeScheduleComplianceReport();
  nbCertificateOfInsuranceComplianceReport();
  nbTeacherContractsLongForm();
  nbDegreeCertificatesRich();
  nbForm8300ComplianceAuditReport();
  nbCashTuitionReceiptDetailed();
  nbForm8300FilingRecordDetailed();
  nbForm8300RuleSnapshotDetailed();
  nbDriverMedicalCertificationReport();
  nbDominguezMedicalCertificateProof();
  nbRadonComplianceReviewReport();
  nbRadonTestReport2018Detailed();
  nbRadonRequirementRuleSnapshot();
  nbRadonSecondTestGapNotice();
  nbChemicalHygieneComplianceAuditReport();
  nbCHPRevisionLogDetailed();
  nbSDSBinderIndexDetailed();
  nbEyewashInspectionLogDetailed();
}

function generateRawEvidenceFiles() {
  const deprecatedNotaryRaw = path.join(__dirname, 'pdfs', 'north_broward', 'Notary_Seal_OCR_Extract.txt');
  if (fs.existsSync(deprecatedNotaryRaw)) {
    fs.unlinkSync(deprecatedNotaryRaw);
  }

  const nbTeacherCsv = ['teacher_id,teacher_name,subject,contract_on_file,degree_on_file,transcript_on_file,notes'];
  for (let i = 1; i <= 62; i++) {
    const missingTranscript = [17, 28, 44].includes(i);
    nbTeacherCsv.push([
      `NB-T-${String(i).padStart(3, '0')}`,
      `Teacher_${String(i).padStart(3, '0')}`,
      ['English', 'Math', 'Science', 'History', 'Arts'][i % 5],
      'YES',
      'YES',
      missingTranscript ? 'NO' : 'YES',
      missingTranscript ? 'Transcript request pending from HR' : 'Complete'
    ].join(','));
  }
  writeRawFile('north_broward', 'Teacher_Qualification_Audit_Sheet.csv', nbTeacherCsv.join('\n') + '\n');

  const nbAttendanceCsv = ['date,grade_band,instructional_day,attendance_submitted,submitted_by'];
  for (let i = 0; i < 182; i++) {
    const d = addDays('2024-08-14', i);
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
    nbAttendanceCsv.push(`${d.toISOString().slice(0, 10)},K-12,YES,YES,Registrar_NB`);
  }
  writeRawFile('north_broward', 'Attendance_Register_2024_25.csv', nbAttendanceCsv.join('\n') + '\n');

  const nbCashCsv = [
    'txn_id,txn_date,payer,amount,payment_mode,requires_form_8300,form_8300_filed_date,status',
    'NB-CASH-001,2024-10-03,Family_102,$12000,CASH,YES,2024-10-28,LATE',
    'NB-CASH-002,2025-01-11,Family_225,$1800,CARD,NO,,N/A'
  ];
  writeRawFile('north_broward', 'Cash_Transactions_Register_2024.csv', nbCashCsv.join('\n') + '\n');

  const nbVechsJson = {
    school: 'North Broward Preparatory',
    generated_at: '2026-03-13T00:00:00Z',
    total_staff: 94,
    expired_count: 0,
    clearance_status: 'all_eligible'
  };
  writeRawFile('north_broward', 'VECHS_Export_2025.json', JSON.stringify(nbVechsJson, null, 2) + '\n');

  const nbRoster = ['employee_id,employee_name,role,department,vechs_status,ethics_status'];
  for (let i = 1; i <= 94; i++) {
    nbRoster.push([
      `NB-EMP-${String(i).padStart(3, '0')}`,
      `Employee_${String(i).padStart(3, '0')}`,
      ['Teacher', 'Admin', 'Counselor', 'Nurse', 'Coach'][i % 5],
      ['Academics', 'Operations', 'Athletics', 'Admin'][i % 4],
      'Eligible',
      'SIGNED'
    ].join(','));
  }
  writeRawFile('north_broward', 'Staff_Roster_2024_25.csv', nbRoster.join('\n') + '\n');

  const wmTeacherCsv = ['teacher_id,teacher_name,subject,contract_on_file,degree_on_file,transcript_on_file,notes'];
  for (let i = 1; i <= 47; i++) {
    const missingTranscript = [3, 4, 5].includes(i);
    wmTeacherCsv.push([
      `WM-T-${String(i).padStart(3, '0')}`,
      `Teacher_${String(i).padStart(3, '0')}`,
      ['English', 'Math', 'Science', 'History', 'Arts'][i % 5],
      'YES',
      'YES',
      missingTranscript ? 'NO' : 'YES',
      missingTranscript ? 'Transcript missing in onboarding packet' : 'Complete'
    ].join(','));
  }
  writeRawFile('windermere', 'Teacher_Qualification_Audit_Sheet.csv', wmTeacherCsv.join('\n') + '\n');

  const wmDhCsv = [
    'grade,enrolled,fully_immunized,temp_exemption,record_status',
    'K,48,47,1,COMPLETE',
    '7,92,,,MISSING_SECTION'
  ];
  writeRawFile('windermere', 'DH684_Submission_Extract.csv', wmDhCsv.join('\n') + '\n');

  const wmFmlaTxt = [
    'Facility Walkthrough Notes',
    'Inspection Date: 2025-02-09',
    'Inspector: Compliance Analyst',
    'Locations checked: Staff Lounge, Teacher Workroom, HR Hallway',
    'Finding: WH-1420 poster not observed in required posting locations',
    'Action: Post current FMLA notice and record photo proof'
  ].join('\n');
  writeRawFile('windermere', 'FMLA_Walkthrough_Notes.txt', wmFmlaTxt + '\n');

  const wmBoiTxt = [
    'BOI Filing Verification Checklist',
    'Entity Name: Windermere Preparatory School',
    'Portal Checked: FinCEN BOI E-Filing',
    'Confirmation ID found: NO',
    'Receipt file available: NO',
    'Status: NON-COMPLIANT (missing filing evidence)'
  ].join('\n');
  writeRawFile('windermere', 'BOI_Filing_Verification_Checklist.txt', wmBoiTxt + '\n');

  const wmVechsJson = {
    school: 'Windermere Preparatory',
    generated_at: '2026-03-13T00:00:00Z',
    total_staff: 47,
    expired_count: 1,
    expired_staff: ['J. Martinez']
  };
  writeRawFile('windermere', 'VECHS_Export_2025.json', JSON.stringify(wmVechsJson, null, 2) + '\n');

  const wmRoster = ['employee_id,employee_name,role,department,vechs_status,ethics_status'];
  const wmPending = [5, 11, 19, 26, 38, 44];
  for (let i = 1; i <= 47; i++) {
    const expired = i === 4;
    const ethicsPending = wmPending.includes(i);
    wmRoster.push([
      `WM-EMP-${String(i).padStart(3, '0')}`,
      `Employee_${String(i).padStart(3, '0')}`,
      ['Teacher', 'Admin', 'Counselor', 'Nurse', 'Coach'][i % 5],
      ['Academics', 'Operations', 'Athletics', 'Admin'][i % 4],
      expired ? 'EXPIRED' : 'Eligible',
      ethicsPending ? 'PENDING' : 'SIGNED'
    ].join(','));
  }
  writeRawFile('windermere', 'Staff_Roster_2024_25.csv', wmRoster.join('\n') + '\n');

  const nbAffCsv = [
    'employee_id,name,role,start_date,affidavit_signed_date,notarized_date,timely',
    'NB-NH-001,Hernandez A,Teacher,2024-08-05,2024-08-05,2024-08-06,NO',
    'NB-NH-002,Patel R,Counselor,2024-08-12,2024-08-12,2024-08-15,NO',
    'NB-NH-003,Ruiz M,Teacher,2024-09-03,2024-08-29,2024-08-29,YES',
    'NB-NH-004,Owens P,Nurse,2024-09-10,2024-09-06,2024-09-06,YES',
    'NB-NH-005,Kim J,Teacher,2024-10-01,2024-09-26,2024-09-26,YES',
    'NB-NH-006,Brown S,Teacher,2024-10-14,2024-10-10,2024-10-10,YES',
    'NB-NH-007,Valdez T,Coach,2024-11-04,2024-10-31,2024-10-31,YES',
    'NB-NH-008,Ross L,Admin,2025-01-06,2024-12-30,2024-12-30,YES'
  ];
  writeRawFile('north_broward', 'New_Hire_Affidavit_Tracker.csv', nbAffCsv.join('\n') + '\n');

  const wmAffCsv = [
    'employee_id,name,role,start_date,affidavit_signed_date,notarized_date,timely',
    'WM-NH-001,Hernandez A,Teacher,2024-08-08,2024-08-08,2024-08-09,NO',
    'WM-NH-002,Patel R,Counselor,2024-08-15,2024-08-15,2024-08-18,NO',
    'WM-NH-003,Ruiz M,Teacher,2024-09-05,2024-09-01,2024-09-01,YES',
    'WM-NH-004,Owens P,Nurse,2024-10-02,2024-09-28,2024-09-28,YES',
    'WM-NH-005,Kim J,Teacher,2024-11-06,2024-11-01,2024-11-01,YES',
    'WM-NH-006,Ross L,Admin,2025-01-07,2025-01-03,2025-01-03,YES'
  ];
  writeRawFile('windermere', 'New_Hire_Affidavit_Tracker.csv', wmAffCsv.join('\n') + '\n');

  const nbEthicsCsv = ['employee_id,employee_name,department,signed_date,status'];
  for (let i = 1; i <= 94; i++) {
    nbEthicsCsv.push([
      `NB-EMP-${String(i).padStart(3, '0')}`,
      `Employee_${String(i).padStart(3, '0')}`,
      ['Academics', 'Operations', 'Athletics', 'Admin'][i % 4],
      `2024-08-${String(1 + (i % 20)).padStart(2, '0')}`,
      'SIGNED'
    ].join(','));
  }
  writeRawFile('north_broward', 'Ethics_Acknowledgement_Register.csv', nbEthicsCsv.join('\n') + '\n');

  const wmEthicsCsv = ['employee_id,employee_name,department,signed_date,status'];
  const wmEthicsPending = [5, 11, 19, 26, 38, 44];
  for (let i = 1; i <= 47; i++) {
    const pending = wmEthicsPending.includes(i);
    wmEthicsCsv.push([
      `WM-EMP-${String(i).padStart(3, '0')}`,
      `Employee_${String(i).padStart(3, '0')}`,
      ['Academics', 'Operations', 'Athletics', 'Admin'][i % 4],
      pending ? '' : `2024-08-${String(1 + (i % 20)).padStart(2, '0')}`,
      pending ? 'PENDING' : 'SIGNED'
    ].join(','));
  }
  writeRawFile('windermere', 'Ethics_Acknowledgement_Register.csv', wmEthicsCsv.join('\n') + '\n');
}

function generatePersonnelArtifacts() {
  const nbRoles = ['Teacher - English', 'Teacher - Math', 'Teacher - Science', 'Teacher - History', 'Teacher - Arts', 'Counselor', 'Nurse', 'Admin Assistant', 'Bus Driver', 'Athletics Coach'];
  const nbFirst = ['Ava', 'Liam', 'Noah', 'Mia', 'Ethan', 'Sofia', 'Lucas', 'Ella', 'Mason', 'Amelia', 'James', 'Harper'];
  const nbLast = ['Adams', 'Baker', 'Carter', 'Davis', 'Evans', 'Foster', 'Garcia', 'Hall', 'Ibrahim', 'Jones', 'Kim', 'Lopez', 'Miller', 'Nguyen', 'Owens', 'Patel', 'Quinn', 'Roberts', 'Singh', 'Turner', 'Valdez', 'White', 'Xu', 'Young'];
  const wmFirst = ['Riley', 'Dakota', 'Parker', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Skyler', 'Reese', 'Avery'];
  const wmLast = ['Baker', 'Collins', 'Davis', 'Evans', 'Foster', 'Garcia', 'Hall', 'Irwin', 'Jackson', 'Kim', 'Lopez', 'Miller', 'Nolan', 'Owens', 'Perez', 'Quintero', 'Reed', 'Santos', 'Turner', 'Valdez'];

  // NB VECHS - full 94 rows
  {
    const doc = new jsPDF();
    let y = header(doc, 'FDLE VECHS Clearance Log', 'Level 2 Background Screening Results', 'North Broward Preparatory');
    y = fieldRow(doc, y, 'Total Staff Screened', '94');
    y = fieldRow(doc, y, 'Screening Provider', 'FDLE / FBI via VECHS Clearinghouse');
    y = fieldRow(doc, y, 'Report Date', 'August 12, 2024');
    y = fieldRow(doc, y, 'Overall Status', 'ALL ELIGIBLE');
    y += 4;

    const cols = [
      { label: '#', x: 14 },
      { label: 'NAME', x: 22 },
      { label: 'ROLE', x: 72 },
      { label: 'SCREENED', x: 110 },
      { label: 'EXPIRES', x: 140 },
      { label: 'STATUS', x: 170 }
    ];
    y = tableHeader(doc, y, cols);

    const rows = [
      ['1', 'Harrington, J.', 'Principal', '03/15/2022', '03/15/2027', 'Eligible'],
      ['2', 'Adams, S.', 'Teacher - English', '08/01/2024', '08/01/2029', 'Eligible'],
      ['3', 'Borowski, M.', 'Teacher - Math', '06/12/2023', '06/12/2028', 'Eligible'],
      ['4', 'Chen, L.', 'Teacher - Science', '01/20/2024', '01/20/2029', 'Eligible'],
      ['5', 'Dominguez, R.', 'Bus Driver', '09/05/2023', '09/05/2028', 'Eligible'],
      ['6', 'Edwards, P.', 'Counselor', '07/14/2022', '07/14/2027', 'Eligible'],
      ['7', 'Fernandez, A.', 'Admin Assistant', '02/28/2024', '02/28/2029', 'Eligible'],
      ['8', 'Grant, T.', 'Teacher - History', '11/10/2021', '11/10/2026', 'Eligible'],
      ['9', 'Howard, K.', 'Nurse', '05/22/2023', '05/22/2028', 'Eligible'],
      ['10', 'Ibrahim, N.', 'Teacher - Arabic', '08/15/2024', '08/15/2029', 'Eligible']
    ];
    for (let i = 11; i <= 94; i++) {
      const name = `${nbLast[i % nbLast.length]}, ${nbFirst[i % nbFirst.length].charAt(0)}.`;
      const role = nbRoles[i % nbRoles.length];
      const screened = addDays('2020-01-10', (i * 37) % 1700);
      const exp = new Date(screened.getTime());
      exp.setUTCFullYear(exp.getUTCFullYear() + 5);
      rows.push([String(i), name, role, mmddyyyy(screened), mmddyyyy(exp), 'Eligible']);
    }
    y = drawPagedTableRows(doc, y, cols, rows, { statusCol: 5, statusColorMap: { Eligible: [16, 185, 129] } });
    if (y > 272) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('SUMMARY: All 94 instructional and administrative personnel hold current VECHS Eligible status.', 14, y);
    save(doc, 'north_broward', 'VECHS_Clearance_Log.pdf');
  }

  // NB Teacher Qualifications - 62 rows, 3 pending transcripts
  {
    const doc = new jsPDF();
    const reportId = 'HR-QVR-2025-0415';
    const generatedOn = 'April 15, 2025';
    const summaryLine = 'Total instructional staff: 62 - Qualification gate: 59 PASS / 3 PENDING - Transcripts needed for: Williams, Chen, Okafor';

    const pendingMap = {
      45: { name: 'Angela Williams', position: 'Biology Teacher' },
      51: { name: 'David Chen', position: 'Physics Teacher' },
      58: { name: 'Samuel Okafor', position: 'Math Teacher' }
    };
    const experienceIds = new Set([7, 16, 24, 33, 39, 54]);
    const specialSkillIds = new Set([17]);

    const firstNames = ['Emily', 'Daniel', 'Grace', 'Michael', 'Sarah', 'Olivia', 'Noah', 'Mia', 'Lucas', 'Ava', 'Ethan', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn'];
    const lastNames = ['Carter', 'Lopez', 'Kim', 'Brown', 'Patel', 'Morgan', 'Singh', 'Turner', 'Adams', 'Garcia', 'Roberts', 'Nelson', 'Hughes', 'Bennett', 'Foster', 'Reed', 'Jenkins', 'Price'];
    const positions = [
      'Math Teacher',
      'Science Teacher',
      'English Teacher',
      'History Teacher',
      'Chemistry Teacher',
      'Biology Teacher',
      'Physics Teacher',
      'Computer Science Teacher',
      'Spanish Teacher',
      'French Teacher',
      'Economics Teacher',
      'Art Teacher',
      'Music Teacher',
      'Social Studies Teacher'
    ];

    const staffRecords = [];
    for (let i = 1; i <= 62; i++) {
      let name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
      let position = positions[i % positions.length];
      let qualificationType = "Bachelor's Degree";
      let documentation = 'Transcript + degree cert';
      let status = 'PASS';

      if (pendingMap[i]) {
        name = pendingMap[i].name;
        position = pendingMap[i].position;
        qualificationType = "Bachelor's Degree";
        documentation = 'Contract reference only';
        status = 'PENDING';
      } else if (specialSkillIds.has(i)) {
        qualificationType = 'Special Skills';
        documentation = 'Skills attestation packet';
      } else if (experienceIds.has(i)) {
        qualificationType = '3+ Years Experience';
        documentation = 'Employment letter (3+ yrs)';
      }

      staffRecords.push({
        id: String(i).padStart(2, '0'),
        name,
        position,
        qualificationType,
        documentation,
        status
      });
    }

    // Page 1 - Cover and report metadata
    let y = header(
      doc,
      'Instructional Staff Qualification Verification Report',
      'Academic Year 2024-2025 | HR Compliance System Export',
      'North Broward Preparatory'
    );

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(118, 34, 78, 46, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('REPORT METADATA', 122, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const coverMeta = [
      ['School ID', 'FL-PS-20482'],
      ['County', 'Broward County'],
      ['Report ID', reportId],
      ['Generated', generatedOn],
      ['Audit Type', 'Instructional Staff Review']
    ];
    let metaY = 45;
    coverMeta.forEach(row => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${row[0]}:`, 122, metaY);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 148, metaY);
      metaY += 6;
    });
    doc.setTextColor(15, 23, 42);

    y = 88;
    y = sectionTitle(doc, y, 'SECTION A - SCHOOL IDENTIFICATION');
    y = fieldRow(doc, y, 'School Name', 'North Broward Preparatory School');
    y = fieldRow(doc, y, 'School Code', 'NB-0042');
    y = fieldRow(doc, y, 'Compliance Statute', 's. 1002.421(1)(h), F.S.');
    y = fieldRow(doc, y, 'Compliance Officer', 'Maria S. Delgado, HR Compliance Lead');
    y = fieldRow(doc, y, 'Academic Year', '2024-2025');
    y += 3;

    y = sectionTitle(doc, y, 'SECTION B - REPORT SCOPE');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      'This report documents instructional staff qualification verification for all active teachers during the 2024-2025 academic year. Records include degree validation, experience-based eligibility, special skills attestations, and supporting personnel documentation reviewed for statutory compliance.',
      14,
      y,
      { maxWidth: 182 }
    );
    y += 26;

    const passCount = staffRecords.filter(r => r.status === 'PASS').length;
    const pendingCount = staffRecords.filter(r => r.status === 'PENDING').length;
    const expCount = staffRecords.filter(r => r.qualificationType === '3+ Years Experience').length;
    const specialCount = staffRecords.filter(r => r.qualificationType === 'Special Skills').length;
    const degreeCount = staffRecords.filter(r => r.qualificationType === "Bachelor's Degree" && r.status === 'PASS').length;

    y = sectionTitle(doc, y, 'SECTION C - PRELIMINARY SNAPSHOT');
    y = fieldRow(doc, y, 'Total Instructional Staff Reviewed', '62');
    y = fieldRow(doc, y, "Bachelor's Degree Path", String(degreeCount));
    y = fieldRow(doc, y, '3+ Years Experience Path', String(expCount));
    y = fieldRow(doc, y, 'Special Skills Path', String(specialCount));
    y = fieldRow(doc, y, 'Pending Documentation', String(pendingCount));
    y = fieldRow(doc, y, 'Gate Result', `${passCount} PASS / ${pendingCount} PENDING`);

    // Page 2 - Statutory requirement
    doc.addPage();
    y = header(
      doc,
      'Instructional Staff Qualification Verification Report',
      'Regulatory Basis and Review Method',
      'North Broward Preparatory'
    );
    y = 48;
    y = sectionTitle(doc, y, 'SECTION 1 - STATUTORY REQUIREMENT');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      'Florida Statute s. 1002.421(1)(h), F.S. requires that each instructional staff member employed by a private school meet at least one qualification path. Schools must maintain source documentation that supports each staff member compliance decision.',
      14,
      y,
      { maxWidth: 182 }
    );
    y += 20;

    const reqCols = [
      { label: 'PATH', x: 16 },
      { label: 'ELIGIBILITY REQUIREMENT', x: 58 },
      { label: 'DOCUMENT EVIDENCE', x: 145 }
    ];
    y = tableHeader(doc, y, reqCols);
    const reqRows = [
      ['PATH 1', "Bachelor's degree or higher from accredited institution", 'Official transcript'],
      ['PATH 2', 'Minimum three years full-time instructional experience', 'Employment verification'],
      ['PATH 3', 'Special skills, knowledge, or expertise for assigned role', 'Skills attestation file']
    ];
    reqRows.forEach(row => {
      doc.text(row[0], 16, y);
      doc.text(row[1], 58, y, { maxWidth: 82 });
      doc.text(row[2], 145, y, { maxWidth: 48 });
      y += 8;
    });
    y += 3;

    y = sectionTitle(doc, y, 'SECTION 2 - REVIEW PROTOCOL');
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y - 1, 182, 44, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('1. Pull active instructional roster from HRIS as of April 15, 2025.', 18, y + 7);
    doc.text('2. Match each teacher to qualification path and supporting evidence.', 18, y + 13);
    doc.text('3. Validate transcript presence for degree-based eligibility cases.', 18, y + 19);
    doc.text('4. Assign PASS, PENDING, or FAIL based on document completeness.', 18, y + 25);
    doc.text('5. Escalate missing records to HR operations with 30-day remediation window.', 18, y + 31);
    doc.text('6. Publish audit packet with traceable row-level evidence references.', 18, y + 37);

    // Pages 3-6 - Full teacher roster table
    const rosterCols = [
      { label: 'ID', x: 14 },
      { label: 'TEACHER NAME', x: 23 },
      { label: 'POSITION', x: 58 },
      { label: 'QUALIFICATION TYPE', x: 98 },
      { label: 'DOCUMENTATION', x: 141 },
      { label: 'STATUS', x: 181 }
    ];
    const rosterRanges = [
      [0, 16],
      [16, 32],
      [32, 48],
      [48, 62]
    ];
    rosterRanges.forEach((range, pageIdx) => {
      doc.addPage();
      let pageY = header(
        doc,
        'Instructional Staff Qualification Verification Report',
        `Section 3 - Qualification Roster (Page ${pageIdx + 1} of 4)`,
        'North Broward Preparatory'
      );
      pageY = 48;
      pageY = sectionTitle(doc, pageY, 'SECTION 3 - INSTRUCTIONAL STAFF QUALIFICATION RECORDS');
      pageY = tableHeader(doc, pageY, rosterCols);

      const pageRecords = staffRecords.slice(range[0], range[1]);
      pageRecords.forEach(record => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(record.id, 14, pageY);
        doc.text(record.name, 23, pageY);
        doc.text(record.position, 58, pageY);
        doc.text(record.qualificationType, 98, pageY);
        doc.text(record.documentation, 141, pageY);
        if (record.status === 'PENDING') {
          doc.setTextColor(245, 158, 11);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(16, 185, 129);
          doc.setFont('helvetica', 'normal');
        }
        doc.text(record.status, 181, pageY);
        doc.setTextColor(15, 23, 42);
        pageY += 6;
      });
    });

    // Page 7 - Compliance summary and quoted line
    doc.addPage();
    y = header(
      doc,
      'Instructional Staff Qualification Verification Report',
      'Compliance Decision Summary',
      'North Broward Preparatory'
    );
    y = 48;
    y = sectionTitle(doc, y, 'SECTION 4 - QUALIFICATION COMPLIANCE SUMMARY');
    y = fieldRow(doc, y, 'Total Instructional Staff Reviewed', '62');
    y = fieldRow(doc, y, 'PASS', '59');
    y = fieldRow(doc, y, 'PENDING DOCUMENTATION', '3');
    y = fieldRow(doc, y, 'FAIL', '0');
    y += 5;

    doc.setDrawColor(251, 191, 36);
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(14, y - 1, 182, 20, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(summaryLine, 18, y + 8, { maxWidth: 174 });
    doc.setTextColor(15, 23, 42);
    y += 28;

    y = sectionTitle(doc, y, 'MISSING OFFICIAL TRANSCRIPTS');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Angela Williams - Biology Teacher (ID 45)', 18, y);
    y += 6;
    doc.text('David Chen - Physics Teacher (ID 51)', 18, y);
    y += 6;
    doc.text('Samuel Okafor - Math Teacher (ID 58)', 18, y);
    y += 10;

    y = sectionTitle(doc, y, 'AUDIT COMMENT');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      'Contracts and degree references exist for all three pending teachers. Missing element is official transcript file upload to the HR compliance repository.',
      14,
      y,
      { maxWidth: 182 }
    );

    // Page 8 - Corrective action
    doc.addPage();
    y = header(
      doc,
      'Instructional Staff Qualification Verification Report',
      'Corrective Action Plan',
      'North Broward Preparatory'
    );
    y = 48;
    y = sectionTitle(doc, y, 'SECTION 5 - REQUIRED CORRECTIVE ACTION');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      'The following instructional staff members currently lack official academic transcripts in their personnel files:',
      14,
      y,
      { maxWidth: 182 }
    );
    y += 10;
    doc.text('1. Angela Williams', 18, y); y += 6;
    doc.text('2. David Chen', 18, y); y += 6;
    doc.text('3. Samuel Okafor', 18, y); y += 10;

    y = sectionTitle(doc, y, 'ACTION REQUIRED');
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y - 1, 182, 32, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Collect official transcripts from all 3 listed teachers within 30 calendar days.', 18, y + 7);
    doc.text('Acceptable alternative: employment verification letters documenting 3+ years instructional experience.', 18, y + 13, { maxWidth: 174 });
    doc.text('Escalation owner: HR Compliance Lead | Due date: May 15, 2025', 18, y + 21);
    doc.text('Risk if unresolved: Partial compliance status persists for PER-002.', 18, y + 27);
    y += 40;

    const planCols = [
      { label: 'STAFF MEMBER', x: 16 },
      { label: 'REQUEST ISSUED', x: 84 },
      { label: 'DUE DATE', x: 124 },
      { label: 'OWNER', x: 150 },
      { label: 'STATUS', x: 176 }
    ];
    y = sectionTitle(doc, y, 'TRACKING TABLE');
    y = tableHeader(doc, y, planCols);
    const planRows = [
      ['Angela Williams', 'Apr 15, 2025', 'May 15, 2025', 'HR Ops', 'OPEN'],
      ['David Chen', 'Apr 15, 2025', 'May 15, 2025', 'HR Ops', 'OPEN'],
      ['Samuel Okafor', 'Apr 15, 2025', 'May 15, 2025', 'HR Ops', 'OPEN']
    ];
    planRows.forEach(row => {
      doc.text(row[0], 16, y);
      doc.text(row[1], 84, y);
      doc.text(row[2], 124, y);
      doc.text(row[3], 150, y);
      doc.setTextColor(245, 158, 11);
      doc.text(row[4], 176, y);
      doc.setTextColor(15, 23, 42);
      y += 6;
    });

    // Footer for every page
    const totalPages = doc.getNumberOfPages();
    for (let pageNo = 1; pageNo <= totalPages; pageNo++) {
      doc.setPage(pageNo);
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 284, 196, 284);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('North Broward Preparatory | HR Compliance System', 14, 288);
      doc.text(`Report ID: ${reportId}`, 14, 292);
      doc.text(`Generated: ${generatedOn}`, 95, 292, { align: 'center' });
      doc.text(`Page ${pageNo} of ${totalPages}`, 196, 292, { align: 'right' });
    }
    doc.setTextColor(15, 23, 42);
    save(doc, 'north_broward', 'Teacher_Qualifications.pdf');
  }

  // WM VECHS - 47 rows, one expired
  {
    const doc = new jsPDF();
    let y = header(doc, 'FDLE VECHS Clearance Log', 'Level 2 Background Screening Results', 'Windermere Preparatory');
    y = fieldRow(doc, y, 'Total Staff Screened', '47');
    y = fieldRow(doc, y, 'Screening Provider', 'FDLE / FBI via VECHS Clearinghouse');
    y = fieldRow(doc, y, 'Report Date', 'September 5, 2024');
    y = fieldRow(doc, y, 'Overall Status', '1 EXPIRED - ACTION REQUIRED');
    y += 4;

    const cols = [
      { label: '#', x: 14 },
      { label: 'NAME', x: 22 },
      { label: 'ROLE', x: 72 },
      { label: 'SCREENED', x: 110 },
      { label: 'EXPIRES', x: 140 },
      { label: 'STATUS', x: 170 }
    ];
    y = tableHeader(doc, y, cols);

    const wmRoles = ['Teacher - English', 'Teacher - Math', 'Teacher - Science', 'Teacher - History', 'Teacher - Arts', 'Counselor', 'Admin Assistant', 'Bus Driver'];
    const rows = [];
    for (let i = 1; i <= 47; i++) {
      if (i === 4) {
        rows.push(['4', 'Martinez, J.', 'Phys. Ed.', '06/10/2019', '06/10/2024', 'EXPIRED']);
      } else {
        const name = `${wmLast[i % wmLast.length]}, ${wmFirst[i % wmFirst.length].charAt(0)}.`;
        const role = i === 1 ? 'Principal' : wmRoles[i % wmRoles.length];
        const screened = addDays('2020-04-15', (i * 31) % 1500);
        const exp = new Date(screened.getTime());
        exp.setUTCFullYear(exp.getUTCFullYear() + 5);
        rows.push([String(i), name, role, mmddyyyy(screened), mmddyyyy(exp), 'Eligible']);
      }
    }
    y = drawPagedTableRows(doc, y, cols, rows, {
      statusCol: 5,
      statusColorMap: { Eligible: [16, 185, 129], EXPIRED: [239, 68, 68] }
    });
    if (y > 272) { doc.addPage(); y = 20; }
    y += 5;
    doc.setTextColor(239, 68, 68);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ALERT: J. Martinez has expired VECHS clearance and requires immediate rescreening.', 14, y);
    doc.setTextColor(15, 23, 42);
    save(doc, 'windermere', 'VECHS_Clearance_Log.pdf');
  }

  // WM Teacher Qualifications - 47 rows, 3 pending transcripts
  {
    const doc = new jsPDF();
    let y = header(doc, 'Teacher Qualification Records', 'Faculty Credential Summary - 2024-25', 'Windermere Preparatory');
    y = fieldRow(doc, y, 'Total Instructional Staff', '47');
    y = fieldRow(doc, y, "Bachelor's Degree Holders", '41');
    y = fieldRow(doc, y, 'Experience-Qualified (3yr+)', '3');
    y = fieldRow(doc, y, 'Pending Documentation', '3');
    y = fieldRow(doc, y, 'Qualification Gate', '44/47 - 3 PENDING');
    y += 4;

    const cols = [
      { label: '#', x: 14 },
      { label: 'NAME', x: 22 },
      { label: 'SUBJECT', x: 65 },
      { label: 'DEGREE', x: 105 },
      { label: 'EXP (YRS)', x: 145 },
      { label: 'STATUS', x: 172 }
    ];
    y = tableHeader(doc, y, cols);

    const subjects = ['English', 'Mathematics', 'History', 'Science', 'Art', 'Spanish', 'Chemistry', 'Music', 'Economics', 'Computer Science', 'Physical Ed.'];
    const degrees = ['B.A. - UCF', 'M.S. - USF', 'B.S. - UF', 'M.Ed. - FIU', 'B.A. - Rollins'];
    const pendingNames = { 3: 'Rodriguez, S.', 4: 'Kim, Y.', 5: 'Davis, J.' };
    const rows = [];
    for (let i = 1; i <= 47; i++) {
      const name = pendingNames[i] || `${wmLast[(i + 2) % wmLast.length]}, ${wmFirst[(i + 1) % wmFirst.length].charAt(0)}.`;
      const subject = subjects[i % subjects.length];
      const expYears = String(1 + (i % 16));
      if (pendingNames[i]) {
        rows.push([String(i), name, subject, '(Transcript Pending)', expYears, 'PENDING']);
      } else {
        rows.push([String(i), name, subject, degrees[i % degrees.length], expYears, 'Qualified']);
      }
    }
    y = drawPagedTableRows(doc, y, cols, rows, {
      statusCol: 5,
      statusColorMap: { Qualified: [16, 185, 129], PENDING: [245, 158, 11] }
    });
    if (y > 272) { doc.addPage(); y = 20; }
    y += 5;
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Pending transcripts: Rodriguez, Kim, Davis (collect within 30 days).', 14, y);
    doc.setTextColor(15, 23, 42);
    save(doc, 'windermere', 'Teacher_Qualifications.pdf');
  }

  // Affidavit logs
  {
    const cols = [
      { label: '#', x: 14 },
      { label: 'NAME', x: 22 },
      { label: 'ROLE', x: 72 },
      { label: 'START DATE', x: 112 },
      { label: 'NOTARIZED', x: 140 },
      { label: 'STATUS', x: 170 }
    ];

    const nbDoc = new jsPDF();
    let y = header(nbDoc, 'Affidavit of Good Moral Character Log', 'New hire notarization tracking - 2024-25', 'North Broward Preparatory');
    y = fieldRow(nbDoc, y, 'New Hires Reviewed', '8');
    y = fieldRow(nbDoc, y, 'Timely Notarizations', '6');
    y = fieldRow(nbDoc, y, 'Late Notarizations', '2');
    y += 4;
    y = tableHeader(nbDoc, y, cols);
    const nbRows = [
      ['1', 'Hernandez, A.', 'Teacher', '08/05/2024', '08/06/2024', 'LATE +1'],
      ['2', 'Patel, R.', 'Counselor', '08/12/2024', '08/15/2024', 'LATE +3'],
      ['3', 'Ruiz, M.', 'Teacher', '09/03/2024', '08/29/2024', 'ON TIME'],
      ['4', 'Owens, P.', 'Nurse', '09/10/2024', '09/06/2024', 'ON TIME'],
      ['5', 'Kim, J.', 'Teacher', '10/01/2024', '09/26/2024', 'ON TIME'],
      ['6', 'Brown, S.', 'Teacher', '10/14/2024', '10/10/2024', 'ON TIME'],
      ['7', 'Valdez, T.', 'Coach', '11/04/2024', '10/31/2024', 'ON TIME'],
      ['8', 'Ross, L.', 'Admin', '01/06/2025', '12/30/2024', 'ON TIME']
    ];
    y = drawPagedTableRows(nbDoc, y, cols, nbRows, {
      statusCol: 5,
      statusColorMap: { 'ON TIME': [16, 185, 129], 'LATE +1': [245, 158, 11], 'LATE +3': [245, 158, 11] }
    });
    if (y > 272) { nbDoc.addPage(); y = 20; }
    y += 5;
    nbDoc.setFont('helvetica', 'bold');
    nbDoc.setFontSize(9);
    nbDoc.text('Late notarizations documented for Hernandez (+1 day) and Patel (+3 days).', 14, y);
    save(nbDoc, 'north_broward', 'Affidavit_Good_Moral_Character_Log.pdf');

    const wmDoc = new jsPDF();
    y = header(wmDoc, 'Affidavit of Good Moral Character Log', 'New hire notarization tracking - 2024-25', 'Windermere Preparatory');
    y = fieldRow(wmDoc, y, 'New Hires Reviewed', '6');
    y = fieldRow(wmDoc, y, 'Timely Notarizations', '4');
    y = fieldRow(wmDoc, y, 'Late Notarizations', '2');
    y += 4;
    y = tableHeader(wmDoc, y, cols);
    const wmRows = [
      ['1', 'Hernandez, A.', 'Teacher', '08/08/2024', '08/09/2024', 'LATE +1'],
      ['2', 'Patel, R.', 'Counselor', '08/15/2024', '08/18/2024', 'LATE +3'],
      ['3', 'Ruiz, M.', 'Teacher', '09/05/2024', '09/01/2024', 'ON TIME'],
      ['4', 'Owens, P.', 'Nurse', '10/02/2024', '09/28/2024', 'ON TIME'],
      ['5', 'Kim, J.', 'Teacher', '11/06/2024', '11/01/2024', 'ON TIME'],
      ['6', 'Ross, L.', 'Admin', '01/07/2025', '01/03/2025', 'ON TIME']
    ];
    y = drawPagedTableRows(wmDoc, y, cols, wmRows, {
      statusCol: 5,
      statusColorMap: { 'ON TIME': [16, 185, 129], 'LATE +1': [245, 158, 11], 'LATE +3': [245, 158, 11] }
    });
    if (y > 272) { wmDoc.addPage(); y = 20; }
    y += 5;
    wmDoc.setFont('helvetica', 'bold');
    wmDoc.setFontSize(9);
    wmDoc.text('Two records require remediation notes due to post-start notarization.', 14, y);
    save(wmDoc, 'windermere', 'Affidavit_Good_Moral_Character_Log.pdf');
  }

  // Ethics acknowledgement logs
  {
    const cols = [
      { label: '#', x: 14 },
      { label: 'EMPLOYEE', x: 22 },
      { label: 'DEPARTMENT', x: 82 },
      { label: 'SIGNED DATE', x: 126 },
      { label: 'STATUS', x: 170 }
    ];
    const depts = ['Academics', 'Operations', 'Athletics', 'Admin'];

    const nbDoc = new jsPDF();
    let y = header(nbDoc, 'Ethics Policy Acknowledgement Log', 'Annual signed acknowledgement tracker', 'North Broward Preparatory');
    y = fieldRow(nbDoc, y, 'Staff in Scope', '94');
    y = fieldRow(nbDoc, y, 'Signed', '94');
    y = fieldRow(nbDoc, y, 'Outstanding', '0');
    y += 4;
    y = tableHeader(nbDoc, y, cols);
    const nbRows = [];
    for (let i = 1; i <= 94; i++) {
      nbRows.push([
        String(i),
        `Employee_${String(i).padStart(3, '0')}`,
        depts[i % depts.length],
        `08/${String(1 + (i % 20)).padStart(2, '0')}/2024`,
        'SIGNED'
      ]);
    }
    y = drawPagedTableRows(nbDoc, y, cols, nbRows, { statusCol: 4, statusColorMap: { SIGNED: [16, 185, 129] } });
    save(nbDoc, 'north_broward', 'Ethics_Policy_Acknowledgement_Log.pdf');

    const wmDoc = new jsPDF();
    y = header(wmDoc, 'Ethics Policy Acknowledgement Log', 'Annual signed acknowledgement tracker', 'Windermere Preparatory');
    y = fieldRow(wmDoc, y, 'Staff in Scope', '47');
    y = fieldRow(wmDoc, y, 'Signed', '41');
    y = fieldRow(wmDoc, y, 'Outstanding', '6');
    y += 4;
    y = tableHeader(wmDoc, y, cols);
    const pending = [5, 11, 19, 26, 38, 44];
    const wmRows = [];
    for (let i = 1; i <= 47; i++) {
      const isPending = pending.includes(i);
      wmRows.push([
        String(i),
        `Employee_${String(i).padStart(3, '0')}`,
        depts[i % depts.length],
        isPending ? '-' : `08/${String(1 + (i % 20)).padStart(2, '0')}/2024`,
        isPending ? 'PENDING' : 'SIGNED'
      ]);
    }
    y = drawPagedTableRows(wmDoc, y, cols, wmRows, {
      statusCol: 4,
      statusColorMap: { SIGNED: [16, 185, 129], PENDING: [245, 158, 11] }
    });
    if (y > 272) { wmDoc.addPage(); y = 20; }
    y += 5;
    wmDoc.setFont('helvetica', 'bold');
    wmDoc.setFontSize(9);
    wmDoc.text('Outstanding signatures: 6 staff (part-time + recent hires).', 14, y);
    save(wmDoc, 'windermere', 'Ethics_Policy_Acknowledgement_Log.pdf');
  }
}

// ============================================================
// MAIN
// ============================================================

console.log('\nGenerating ComplianceIQ Demo PDFs...\n');
console.log('North Broward Preparatory:');
nb_AnnualSurvey();
nb_VECHSLog();
nb_DH684();
nb_FireSafety();
nb_TeacherQual();
nb_SEVISI20();

console.log('\nWindermere Preparatory:');
wm_AnnualSurvey();
wm_VECHSLog();
wm_DH684();
wm_FireSafety();
wm_TeacherQual();
wm_SCF1();

console.log('\nPersonnel artifacts (full data):');
generatePersonnelArtifacts();

console.log('\nAdditional evidence packets:');
generateEvidencePackets();

console.log('\nRaw evidence files:');
generateRawEvidenceFiles();

console.log('\nDone! Synthetic compliance documents generated successfully.\n');








