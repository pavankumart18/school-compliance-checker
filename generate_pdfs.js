/**
 * generate_pdfs.js
 * Generates 12 synthetic PDF documents for the ComplianceIQ demo.
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
  console.log(`  ✓ ${folder}/${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// ============================================================
// NORTH BROWARD PDFs
// ============================================================

function nb_AnnualSurvey() {
  const doc = new jsPDF();
  let y = header(doc, 'Florida Private School Annual Survey', 'Form FLDOE-PNP Rev. 2024', 'North Broward Preparatory');

  y = sectionTitle(doc, y, 'SECTION 1 — SCHOOL INFORMATION');
  y = fieldRow(doc, y, 'School Name', 'North Broward Preparatory School');
  y = fieldRow(doc, y, 'School Code', 'NB-0042');
  y = fieldRow(doc, y, 'Address', '7600 Lyons Rd, Coconut Creek, FL 33073');
  y = fieldRow(doc, y, 'County', 'Broward');
  y = fieldRow(doc, y, 'Principal', 'Dr. John T. Harrington');
  y = fieldRow(doc, y, 'Phone', '(954) 247-0011');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 2 — ENROLLMENT DATA');
  y = fieldRow(doc, y, 'Total Enrollment', '847 students');
  y = fieldRow(doc, y, 'Grades Served', 'PK through 12');
  y = fieldRow(doc, y, 'Scholarship Students', '214 (Step Up / FTC / FES-UA)');
  y = fieldRow(doc, y, 'International Students', '78 (F-1 Visa)');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 3 — INSTRUCTIONAL CALENDAR');
  y = fieldRow(doc, y, 'First Day of Instruction', 'August 14, 2024');
  y = fieldRow(doc, y, 'Last Day of Instruction', 'May 30, 2025');
  y = fieldRow(doc, y, 'Total Instructional Days', '182');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 4 — NOTARIZATION');
  y = fieldRow(doc, y, 'Filing Date', 'April 15, 2025');
  y = fieldRow(doc, y, 'Status', 'FILED — ON TIME');
  y += 3;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Sworn and subscribed before me this 15th day of April, 2025', 14, y); y += 5;
  doc.text('Notary Public: Maria L. Gomez', 14, y); y += 5;
  doc.text('Seal #FL-882 | Commission Expires: Nov 2027 | Broward County', 14, y);

  save(doc, 'north_broward', 'Annual_Survey_2025.pdf');
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

  const staff = [
    ['1', 'Harrington, J.', 'Principal', '03/15/2022', '03/15/2027', 'Eligible'],
    ['2', 'Adams, S.', 'Teacher - English', '08/01/2024', '08/01/2029', 'Eligible'],
    ['3', 'Borowski, M.', 'Teacher - Math', '06/12/2023', '06/12/2028', 'Eligible'],
    ['4', 'Chen, L.', 'Teacher - Science', '01/20/2024', '01/20/2029', 'Eligible'],
    ['5', 'Dominguez, R.', 'Bus Driver', '09/05/2023', '09/05/2028', 'Eligible'],
    ['6', 'Edwards, P.', 'Counselor', '07/14/2022', '07/14/2027', 'Eligible'],
    ['7', 'Fernandez, A.', 'Admin Assistant', '02/28/2024', '02/28/2029', 'Eligible'],
    ['8', 'Grant, T.', 'Teacher - History', '11/10/2021', '11/10/2026', 'Eligible'],
    ['9', 'Howard, K.', 'Nurse', '05/22/2023', '05/22/2028', 'Eligible'],
    ['10', 'Ibrahim, N.', 'Teacher - Arabic', '08/15/2024', '08/15/2029', 'Eligible'],
    ['...', '(84 additional staff)', '', '', '', 'Eligible'],
  ];

  staff.forEach(row => {
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

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SUMMARY: All 94 instructional and administrative personnel hold current VECHS Eligible status.', 14, y);

  save(doc, 'north_broward', 'VECHS_Clearance_Log.pdf');
}

function nb_DH684() {
  const doc = new jsPDF();
  let y = header(doc, 'Form DH-684 Immunization Compliance Report', 'Florida Dept. of Health — Annual School Report', 'North Broward Preparatory');

  y = fieldRow(doc, y, 'School Name', 'North Broward Preparatory School');
  y = fieldRow(doc, y, 'County', 'Broward');
  y = fieldRow(doc, y, 'Submission Date', 'September 28, 2024');
  y = fieldRow(doc, y, 'Reporting Year', '2024-2025');
  y += 4;

  y = sectionTitle(doc, y, 'KINDERGARTEN IMMUNIZATION STATUS');
  y = fieldRow(doc, y, 'Students Enrolled (K)', '72');
  y = fieldRow(doc, y, 'Fully Immunized', '71');
  y = fieldRow(doc, y, 'Temporary Exemption', '1');
  y = fieldRow(doc, y, 'Compliance Rate', '98.6%');
  y += 4;

  y = sectionTitle(doc, y, '7TH GRADE IMMUNIZATION STATUS');
  y = fieldRow(doc, y, 'Students Enrolled (7th)', '89');
  y = fieldRow(doc, y, 'Tdap Verified', '89');
  y = fieldRow(doc, y, 'Temporary Exemption', '0');
  y = fieldRow(doc, y, 'Compliance Rate', '100%');
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('OVERALL STATUS: COMPLIANT', 14, y);
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Certified by: School Nurse K. Howard, RN — Date: 09/28/2024', 14, y);

  save(doc, 'north_broward', 'DH684_Immunization_Report.pdf');
}

function nb_FireSafety() {
  const doc = new jsPDF();
  let y = header(doc, 'Annual Fire Safety Inspection Report', 'Florida State Fire Marshal — FFPC/NFPA 101', 'North Broward Preparatory');

  y = fieldRow(doc, y, 'Facility', 'North Broward Preparatory School — Main Campus');
  y = fieldRow(doc, y, 'Address', '7600 Lyons Rd, Coconut Creek, FL 33073');
  y = fieldRow(doc, y, 'Inspection Date', 'January 23, 2025');
  y = fieldRow(doc, y, 'Inspector', 'Fire Marshal D. Rivera, Badge #FM-4418');
  y = fieldRow(doc, y, 'Inspection Type', 'Annual Educational Facility (Group E)');
  y += 4;

  y = sectionTitle(doc, y, 'INSPECTION RESULTS');
  y = fieldRow(doc, y, 'Total Violations Found', '0');
  y = fieldRow(doc, y, 'Fire Alarm System', 'Operational — Tested');
  y = fieldRow(doc, y, 'Sprinkler System', 'Operational — Last service Nov 2024');
  y = fieldRow(doc, y, 'Emergency Exits', 'All clear and properly marked');
  y = fieldRow(doc, y, 'Fire Extinguishers', '47 units — All tags current');
  y = fieldRow(doc, y, 'Evacuation Routes', 'Posted in all classrooms and hallways');
  y += 4;

  y = sectionTitle(doc, y, 'DETERMINATION');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('PASS — No Violations', 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  y += 6;
  y = fieldRow(doc, y, 'Certificate Valid Through', 'January 23, 2026');
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Signed: D. Rivera, State Fire Marshal — Broward County Fire Rescue', 14, y);

  save(doc, 'north_broward', 'Fire_Safety_Inspection.pdf');
}

function nb_TeacherQual() {
  const doc = new jsPDF();
  let y = header(doc, 'Teacher Qualification Records', 'Faculty Credential Summary — 2024-25', 'North Broward Preparatory');

  y = fieldRow(doc, y, 'Total Instructional Staff', '62');
  y = fieldRow(doc, y, "Bachelor's Degree Holders", '58');
  y = fieldRow(doc, y, 'Experience-Qualified (3yr+)', '3');
  y = fieldRow(doc, y, 'Special Skills Attestation', '1 (Native French — Language Dept.)');
  y = fieldRow(doc, y, 'Qualification Gate', 'PASSED — 62/62');
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

  const teachers = [
    ['1', 'Adams, S.', 'English', 'B.A. — UF', '8', 'Qualified'],
    ['2', 'Borowski, M.', 'Mathematics', 'M.S. — FIU', '12', 'Qualified'],
    ['3', 'Chen, L.', 'Biology', 'B.S. — UCF', '5', 'Qualified'],
    ['4', 'Dupont, J.', 'French', 'Special Skills', '15', 'Qualified'],
    ['5', 'Ellis, R.', 'History', 'B.A. — FSU', '3', 'Qualified'],
    ['6', 'Garcia, M.', 'Physical Ed.', 'B.S. — FAU', '7', 'Qualified'],
    ['7', 'Hoffman, T.', 'Chemistry', 'M.S. — MIT', '20', 'Qualified'],
    ['8', 'Ivanova, K.', 'Music', 'B.M. — Juilliard', '9', 'Qualified'],
    ['...', '(54 additional teachers)', '', '', '', 'Qualified'],
  ];

  teachers.forEach(row => {
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

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total instructional staff: 62 — Qualification gate: PASSED', 14, y);
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

  const students = [
    ['1', 'STU-0401', 'N0012345678', 'Brazil', '06/30/2026', 'Active'],
    ['2', 'STU-0422', 'N0012345679', 'China', '06/30/2025', 'Active'],
    ['3', 'STU-0438', 'N0012345680', 'South Korea', '06/30/2027', 'Active'],
    ['4', 'STU-0451', 'N0012345681', 'Germany', '12/31/2025', 'Active'],
    ['5', 'STU-0467', 'N0012345682', 'Nigeria', '06/30/2026', 'Active'],
    ['6', 'STU-0483', 'N0012345683', 'India', '06/30/2025', 'Active'],
    ['7', 'STU-0491', 'N0012345684', 'Colombia', '06/30/2026', 'Active'],
    ['8', 'STU-0504', 'N0012345685', 'Japan', '06/30/2027', 'Active'],
    ['...', '(70 more)', '', '', '', 'Active'],
  ];

  students.forEach(row => {
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

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SEVIS Active I-20s: 78/78 — All Program_End_Date > 02/18/2025', 14, y);

  save(doc, 'north_broward', 'SEVIS_I20_Log.pdf');
}

// ============================================================
// WINDERMERE PDFs
// ============================================================

function wm_AnnualSurvey() {
  const doc = new jsPDF();
  let y = header(doc, 'Florida Private School Annual Survey', 'Form FLDOE-PNP Rev. 2024', 'Windermere Preparatory');

  y = sectionTitle(doc, y, 'SECTION 1 — SCHOOL INFORMATION');
  y = fieldRow(doc, y, 'School Name', 'Windermere Preparatory School');
  y = fieldRow(doc, y, 'School Code', 'WM-0187');
  y = fieldRow(doc, y, 'Address', '6189 Winter Garden-Vineland Rd, Windermere, FL 34786');
  y = fieldRow(doc, y, 'County', 'Orange');
  y = fieldRow(doc, y, 'Principal', 'Dr. Laura K. Simmons');
  y = fieldRow(doc, y, 'Phone', '(407) 905-1938');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 2 — ENROLLMENT DATA');
  y = fieldRow(doc, y, 'Total Enrollment', '623 students');
  y = fieldRow(doc, y, 'Grades Served', 'PK through 12');
  y = fieldRow(doc, y, 'Scholarship Students', '118 (Step Up / FTC)');
  y = fieldRow(doc, y, 'International Students', '52 (F-1 Visa)');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 3 — INSTRUCTIONAL CALENDAR');
  y = fieldRow(doc, y, 'First Day of Instruction', 'August 12, 2024');
  y = fieldRow(doc, y, 'Last Day of Instruction', 'May 28, 2025');
  y = fieldRow(doc, y, 'Total Instructional Days', '180');
  y += 4;

  y = sectionTitle(doc, y, 'SECTION 4 — NOTARIZATION');
  y = fieldRow(doc, y, 'Filing Date', 'May 3, 2025');

  // RED flag
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  y = fieldRow(doc, y, 'Status', 'LATE — Past May 1 deadline');
  y += 2;
  doc.text('WARNING: Notary seal is MISSING from this document.', 14, y);
  doc.text('This survey is INCOMPLETE and must be resubmitted.', 14, y + 5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');

  save(doc, 'windermere', 'Annual_Survey_2025.pdf');
}

function wm_VECHSLog() {
  const doc = new jsPDF();
  let y = header(doc, 'FDLE VECHS Clearance Log', 'Level 2 Background Screening Results', 'Windermere Preparatory');

  y = fieldRow(doc, y, 'Total Staff Screened', '47');
  y = fieldRow(doc, y, 'Screening Provider', 'FDLE / FBI via VECHS Clearinghouse');
  y = fieldRow(doc, y, 'Report Date', 'September 5, 2024');
  y = fieldRow(doc, y, 'Overall Status', '1 EXPIRED — ACTION REQUIRED');
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

  const staff = [
    ['1', 'Simmons, L.', 'Principal', '04/20/2022', '04/20/2027', 'Eligible'],
    ['2', 'Baker, R.', 'Teacher - English', '08/15/2024', '08/15/2029', 'Eligible'],
    ['3', 'Collins, D.', 'Teacher - Math', '07/01/2023', '07/01/2028', 'Eligible'],
    ['4', 'Martinez, J.', 'Phys. Ed.', '06/10/2019', '06/10/2024', 'EXPIRED'],
    ['5', 'Evans, T.', 'Counselor', '03/22/2023', '03/22/2028', 'Eligible'],
    ['6', 'Foster, A.', 'Admin Assistant', '01/15/2024', '01/15/2029', 'Eligible'],
    ['7', 'Garcia, P.', 'Teacher - Spanish', '09/01/2024', '09/01/2029', 'Eligible'],
    ['8', 'Hall, M.', 'Teacher - Science', '05/10/2022', '05/10/2027', 'Eligible'],
    ['...', '(39 additional staff)', '', '', '', 'Eligible'],
  ];

  staff.forEach(row => {
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
    }
    doc.text(row[5], 170, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 5;
  });

  y += 6;
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ALERT: J. Martinez — Last screened June 2019 (5yr 8mo ago).', 14, y); y += 5;
  doc.text('Exceeded 5-year renewal limit. Must be removed from student contact duties.', 14, y);
  doc.setTextColor(15, 23, 42);

  save(doc, 'windermere', 'VECHS_Clearance_Log.pdf');
}

function wm_DH684() {
  const doc = new jsPDF();
  let y = header(doc, 'Form DH-684 Immunization Compliance Report', 'Florida Dept. of Health — Annual School Report', 'Windermere Preparatory');

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
  doc.text('Submitted by admin office — Grade 7 data not available at time of filing.', 14, y);

  save(doc, 'windermere', 'DH684_Immunization_Report.pdf');
}

function wm_FireSafety() {
  const doc = new jsPDF();
  let y = header(doc, 'Annual Fire Safety Inspection Report', 'Florida State Fire Marshal — FFPC/NFPA 101', 'Windermere Preparatory');

  y = fieldRow(doc, y, 'Facility', 'Windermere Preparatory School — Main Campus');
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
  y = fieldRow(doc, y, 'Location', 'Building C — Stairwell B-C3');
  y = fieldRow(doc, y, 'Description', 'Blocked egress — storage boxes obstructing stairwell exit');
  y = fieldRow(doc, y, 'Severity', 'Minor — Correctable');
  y = fieldRow(doc, y, 'Deadline', 'Within 30 days of inspection');
  y += 2;

  y = sectionTitle(doc, y, 'VIOLATION #2');
  y = fieldRow(doc, y, 'Location', 'Gymnasium — Unit #GYM-12');
  y = fieldRow(doc, y, 'Description', 'Expired fire extinguisher inspection tag (last tag: July 2024)');
  y = fieldRow(doc, y, 'Severity', 'Minor — Correctable');
  y = fieldRow(doc, y, 'Deadline', 'Within 30 days of inspection');
  y += 4;

  y = sectionTitle(doc, y, 'DETERMINATION');
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CONDITIONAL — Reinspection Required', 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Signed: A. Thompson, State Fire Marshal — Orange County Fire Rescue', 14, y);

  save(doc, 'windermere', 'Fire_Safety_Inspection.pdf');
}

function wm_TeacherQual() {
  const doc = new jsPDF();
  let y = header(doc, 'Teacher Qualification Records', 'Faculty Credential Summary — 2024-25', 'Windermere Preparatory');

  y = fieldRow(doc, y, 'Total Instructional Staff', '47');
  y = fieldRow(doc, y, "Bachelor's Degree Holders", '41');
  y = fieldRow(doc, y, 'Experience-Qualified (3yr+)', '3');
  y = fieldRow(doc, y, 'Pending Documentation', '3');
  y = fieldRow(doc, y, 'Qualification Gate', '44/47 — 3 PENDING');
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

  const teachers = [
    ['1', 'Baker, R.', 'English', 'B.A. — UCF', '6', 'Qualified'],
    ['2', 'Collins, D.', 'Mathematics', 'M.S. — USF', '14', 'Qualified'],
    ['3', 'Rodriguez, S.', 'History', '(No transcript)', '2', 'PENDING'],
    ['4', 'Kim, Y.', 'Science', '(No transcript)', '1', 'PENDING'],
    ['5', 'Davis, J.', 'Art', '(No transcript)', '4', 'PENDING'],
    ['6', 'Garcia, P.', 'Spanish', 'B.A. — FIU', '8', 'Qualified'],
    ['7', 'Hall, M.', 'Chemistry', 'B.S. — UF', '11', 'Qualified'],
    ['8', 'Lee, W.', 'Music', 'B.M. — FSU', '5', 'Qualified'],
    ['...', '(39 additional)', '', '', '', 'Qualified'],
  ];

  teachers.forEach(row => {
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
    }
    doc.text(row[5], 172, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    y += 5;
  });

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
  let y = header(doc, 'Scholarship Compliance Form (IEPC SCF-1)', 'Step Up For Students — Annual Filing', 'Windermere Preparatory');

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
  y = fieldRow(doc, y, 'Filing Status', 'LATE — 7 days past deadline');
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
  doc.text('Submitted by: Admin Office — Contact SFO at (877) 880-4994 for corrective action.', 14, y);

  save(doc, 'windermere', 'SCF1_Scholarship_Form.pdf');
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

console.log('\nDone! 12 PDFs generated successfully.\n');

