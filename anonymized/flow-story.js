const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const SOURCE_META = {
  pdf_filing: { label: "PDF Filing", color: "#1463ff" },
  spreadsheet: { label: "Spreadsheet", color: "#0ea5a4" },
  contract: { label: "Contract", color: "#7458ff" },
  receipt: { label: "Receipt", color: "#f08b35" },
  certificate: { label: "Certificate", color: "#2ea86f" },
  inspection_log: { label: "Inspection Log", color: "#ef5b44" },
  scan_image: { label: "Scan/Image", color: "#0c72ff" },
  policy_plan: { label: "Policy/Plan", color: "#ff6178" },
};

const STATUS_META = {
  fully: { label: "Fully Compliant", short: "Compliant", color: "#2ea86f", badge: "PASS" },
  partial: { label: "Partially Compliant", short: "Partial", color: "#f1b400", badge: "PARTIAL" },
  non: { label: "Non-Compliant", short: "Non-Compliant", color: "#ef5b44", badge: "FAIL" },
};

const STAGES = [
  {
    title: "Document Intake",
    short: "Ingesting",
    description: "A raw file arrives from a real-world source system and enters the compliance queue.",
  },
  {
    title: "Parsing and OCR",
    short: "Reading",
    description: "The engine reads pages, tables, labels, signatures, and structure without losing context.",
  },
  {
    title: "Fact Extraction",
    short: "Extracting",
    description: "Dates, counts, names, deadlines, and thresholds are isolated into structured facts.",
  },
  {
    title: "Rule Evaluation",
    short: "Checking rules",
    description: "The extracted facts are compared directly against the requirement.",
  },
  {
    title: "Evidence Assembly",
    short: "Packaging proof",
    description: "Supporting files, missing items, and next actions are bundled into one packet.",
  },
  {
    title: "Published Finding",
    short: "Publishing",
    description: "The result becomes a clear finding with status, reason, proof, and action.",
  },
];

const SCENARIOS = [
  {
    code: "ADM-001",
    file: "Annual_Survey_2025.pdf",
    source: "pdf_filing",
    docType: "Notarized annual survey packet",
    ruleFamily: "Annual reporting submission",
    statusKey: "fully",
    title: "Annual survey filed before deadline with notary proof.",
    summary: "The packet shows a valid filing date, a visible notary acknowledgement, and enough lead time before the deadline.",
    rule: "Annual private school survey must be filed before the deadline and include a valid certification page.",
    comparison: "Filed April 15, 2025, ahead of the May 1 deadline, with notary acknowledgement visible.",
    evidenceSummary: "Submission receipt, notarized filing page, and survey packet agree.",
    action: "No action needed.",
    evidenceDocs: ["Annual_Survey_2025.pdf", "Notary_Page_Apr15.pdf", "Submission_Receipt_Apr15.pdf"],
    missingDocs: [],
    guardrails: ["Original filing date preserved", "Certification page retained", "Evidence stays attached"],
    facts: ["Submission date: Apr 15, 2025", "Deadline: May 1, 2025", "Notary seal: FL-882"],
    tags: ["deadline", "notary", "submission packet"],
    preview: [
      "PRIVATE SCHOOL ANNUAL SURVEY REPORT",
      "Submission Date: April 15, 2025",
      "Sworn and subscribed before me this 15th day of April, 2025",
      "Notary Public: Maria L. Gomez",
      "Commission No.: FL-882",
    ].join("\n"),
  },
  {
    code: "PER-001",
    file: "Teacher_Qualification_Review.pdf",
    source: "contract",
    docType: "Personnel credential dossier",
    ruleFamily: "Teacher qualification records",
    statusKey: "partial",
    title: "Most teachers pass, but three qualification files still need final proof.",
    summary: "Contracts and degree references are present, but official transcripts are not yet on file for three teachers.",
    rule: "Each instructional staff member must have degree proof, employment verification, or another accepted qualification path documented.",
    comparison: "59 of 62 personnel files are complete. Williams, Chen, and Okafor still need official transcripts or accepted alternatives.",
    evidenceSummary: "Contracts, degree certificates, and the review report are present. Missing transcript evidence is named directly.",
    action: "Collect official transcripts from the remaining three teachers within 30 days.",
    evidenceDocs: ["Teacher_Quals_Report.pdf", "Teacher_Contracts.pdf", "Degree_Certificates.pdf"],
    missingDocs: ["Transcript - Angela Williams", "Transcript - David Chen", "Transcript - Samuel Okafor"],
    guardrails: ["Every reviewed teacher is named", "Missing proof is explicit", "Alternative path is shown"],
    facts: ["Instructional staff reviewed: 62", "Complete files: 59", "Pending transcripts: 3"],
    tags: ["personnel", "contracts", "transcripts"],
    preview: [
      "INSTRUCTIONAL STAFF QUALIFICATION VERIFICATION REPORT",
      "Total instructional staff reviewed: 62",
      "Qualification gate: 59 PASS / 3 PENDING",
      "Transcripts needed for: Williams, Chen, Okafor",
    ].join("\n"),
  },
  {
    code: "HLT-001",
    file: "DH680_Immunization_Review.pdf",
    source: "scan_image",
    docType: "Student health compliance report",
    ruleFamily: "Student immunization records",
    statusKey: "partial",
    title: "Most immunization records are current, but two temporary exemptions expired.",
    summary: "The health office report shows strong overall coverage with a small visible gap tied to two student records.",
    rule: "Students must maintain valid DH-680 immunization records, including current exemptions where applicable.",
    comparison: "845 of 847 records are current. Student IDs 4421 and 4587 have expired temporary exemptions.",
    evidenceSummary: "Grade summary, detail table, and follow-up instructions all point to the same two exceptions.",
    action: "Obtain updated DH-680 forms or permanent exemptions for the two affected students.",
    evidenceDocs: ["DH680_Compliance_Report.pdf", "Expired_Exemptions_Page.pdf", "Follow_Up_Log.pdf"],
    missingDocs: ["Updated DH-680 - Student 4421", "Updated DH-680 - Student 4587"],
    guardrails: ["Student IDs preserved", "Expiration dates visible", "Corrective action is specific"],
    facts: ["Student records complete: 845/847", "Expired exemptions: 2", "Affected grade: Grade 7"],
    tags: ["health office", "DH-680", "exemptions"],
    preview: [
      "STUDENT IMMUNIZATION COMPLIANCE REPORT",
      "Students with Valid DH-680 Records: 845",
      "Students with Expired Temporary Exemptions: 2",
      "Student IDs: 4421, 4587",
    ].join("\n"),
  },
  {
    code: "TRN-002",
    file: "MCSA5876_Driver_Medical_Review.pdf",
    source: "certificate",
    docType: "Driver medical certification review",
    ruleFamily: "Bus driver medical certificates",
    statusKey: "partial",
    title: "Driver certificates are mostly current, but one renewal is approaching.",
    summary: "Five certificates are current and one certificate is close enough to expiry that renewal must be scheduled now.",
    rule: "Each school bus driver must maintain a current MCSA-5876 medical examiner certificate.",
    comparison: "5 of 6 certificates are valid. Robert Dominguez expires on March 1, 2025 and renewal is not yet scheduled.",
    evidenceSummary: "The roster review and the individual certificate point to the same driver and expiry date.",
    action: "Schedule Robert Dominguez for a DOT medical exam before March 1, 2025.",
    evidenceDocs: ["MCSA5876_Driver_Medical_Review.pdf", "MCSA5876_Dominguez_Certificate.pdf", "Renewal_Schedule_Log.pdf"],
    missingDocs: ["Scheduled renewal appointment for Robert Dominguez"],
    guardrails: ["Individual certificate remains visible", "Roster and driver table agree", "Expiry date drives the result"],
    facts: ["Driver certificates valid: 5/6", "Driver at risk: Robert Dominguez", "Certificate expiry: Mar 1, 2025"],
    tags: ["transportation", "MCSA-5876", "certificate expiry"],
    preview: [
      "SCHOOL BUS DRIVER MEDICAL CERTIFICATION REVIEW",
      "Medical certs: 5/6 valid",
      "R. Dominguez MCSA-5876 expires 03/01/2025",
      "RENEWAL NEEDED",
    ].join("\n"),
  },
  {
    code: "IRS-002",
    file: "Cash_Transaction_Compliance_Review_2025.pdf",
    source: "receipt",
    docType: "Cash reporting audit packet",
    ruleFamily: "IRS Form 8300 filing",
    statusKey: "non",
    title: "Large cash transaction reported after the legal filing window.",
    summary: "The receipt date and the filing date create a direct deadline violation, so the result is non-compliant.",
    rule: "Cash transactions over $10,000 must be reported within 15 calendar days using Form 8300.",
    comparison: "Cash received on October 3, 2024. Form filed on October 28, 2024. That is 10 days late beyond the 15-day requirement.",
    evidenceSummary: "Receipt, filing record, and compliance calculation all align on the late filing.",
    action: "Document the late filing and add deadline controls for future large cash transactions.",
    evidenceDocs: ["Cash_Tuition_Receipt_Oct03_2024.pdf", "Form_8300_Filing_Oct28_2024.pdf", "Cash_Transaction_Compliance_Review_2025.pdf"],
    missingDocs: [],
    guardrails: ["Threshold trigger is visible", "Deadline math is explicit", "Source dates remain attached"],
    facts: ["Cash amount: $12,000", "Transaction date: Oct 3, 2024", "Form 8300 filing date: Oct 28, 2024"],
    tags: ["finance", "cash payment", "deadline"],
    preview: [
      "FORM 8300 REPORTING RECORD",
      "Transaction Amount: $12,000",
      "Date Cash Received: October 3, 2024",
      "Date Form Filed: October 28, 2024",
      "Delay: 10 days beyond requirement",
    ].join("\n"),
  },
  {
    code: "FAC-002",
    file: "Radon_Compliance_Review_2025.pdf",
    source: "inspection_log",
    docType: "Facilities environmental report",
    ruleFamily: "Radon testing compliance",
    statusKey: "non",
    title: "Required radon retest is overdue and no replacement filing exists.",
    summary: "The school has an older radon test on file, but the next required cycle passed without a second test being recorded.",
    rule: "School buildings must complete radon testing every five years and maintain the resulting Form DH 1777 report.",
    comparison: "Most recent recorded test is September 2018. Next required test was due September 2023. No second test is on file.",
    evidenceSummary: "Historical test record is visible, the statutory cadence is visible, and the missing second test is obvious.",
    action: "Schedule and file a new radon test immediately for all required buildings.",
    evidenceDocs: ["Radon_Test_Report_2018.pdf", "Radon_Compliance_Review_2025.pdf", "Radon_Testing_Requirement_5Year_Rule.pdf"],
    missingDocs: ["Second Form DH 1777 radon test after Sept 2023"],
    guardrails: ["Last completed test stays visible", "Rule interval is shown beside the test date", "Missing second test is explicit"],
    facts: ["Last completed test: Sept 14, 2018", "Next required test: Sept 2023", "Current state: overdue"],
    tags: ["facilities", "radon", "5-year cadence"],
    preview: [
      "RADON TEST COMPLIANCE STATUS",
      "Most Recent Test on Record: September 14, 2018",
      "Next Required Test Deadline: September 2023",
      "Status: OVERDUE",
    ].join("\n"),
  },
  {
    code: "BSF-003",
    file: "Chemical_Hygiene_Compliance_Audit_2025.pdf",
    source: "policy_plan",
    docType: "Lab safety compliance audit",
    ruleFamily: "Chemical hygiene plan",
    statusKey: "non",
    title: "Lab safety program failed because the plan, SDS binder, and eyewash log are incomplete.",
    summary: "The plan is stale, chemical safety sheets are missing, and three weeks of inspection evidence are absent.",
    rule: "Laboratory operations require a current chemical hygiene plan, complete SDS records, and continuous weekly eyewash inspections.",
    comparison: "CHP last updated Aug 12, 2021. SDS binder missing 4 chemical records. Eyewash inspection log has a 3-week gap.",
    evidenceSummary: "Revision history, SDS inventory, and equipment inspection log all contribute to the failure.",
    action: "Update the plan, restore the missing SDS sheets, and restart weekly inspection logging immediately.",
    evidenceDocs: ["Chemical_Hygiene_Compliance_Audit_2025.pdf", "CHP_Revision_Log_2021.pdf", "Eyewash_Inspection_Log_Q1_2025.pdf"],
    missingDocs: ["4 missing SDS sheets", "3 missing weeks of eyewash inspections"],
    guardrails: ["Plan revision date preserved", "Missing chemicals named", "Inspection continuity checked directly"],
    facts: ["CHP last updated: Aug 12, 2021", "Missing SDS sheets: 4", "Eyewash inspection gap: 3 weeks"],
    tags: ["lab safety", "SDS binder", "eyewash"],
    preview: [
      "LAB SAFETY COMPLIANCE STATUS",
      "Chemical Hygiene Plan: OUTDATED",
      "SDS Binder: 4 sheets missing",
      "Eyewash log: 3-week gap detected",
      "OVERALL STATUS: NON-COMPLIANT",
    ].join("\n"),
  },
  {
    code: "ADM-002",
    file: "Attendance_Compliance_Report_2025.pdf",
    source: "spreadsheet",
    docType: "Registrar attendance compliance report",
    ruleFamily: "Instructional day attendance rule",
    statusKey: "fully",
    title: "The academic calendar and register show the school exceeds the required day count.",
    summary: "The schedule and attendance register together prove the school is on track to exceed the minimum day requirement.",
    rule: "The school must maintain the required instructional day threshold and keep a current attendance register.",
    comparison: "182 instructional days are scheduled and 103 days were completed as of February 17, 2025.",
    evidenceSummary: "Calendar summary, attendance extract, and registrar certification all support the same conclusion.",
    action: "No action needed.",
    evidenceDocs: ["Attendance_Compliance_Report_2025.pdf", "Instruction_Calendar_2024_25.pdf", "Attendance_Register_Sample_Feb2025.pdf"],
    missingDocs: [],
    guardrails: ["Scheduled day count is visible", "Attendance records show recent dates", "Registrar certification is attached"],
    facts: ["Instructional days scheduled: 182", "YTD days completed: 103", "Minimum requirement exceeded: yes"],
    tags: ["calendar", "attendance register", "170-day rule"],
    preview: [
      "INSTRUCTIONAL DAY ATTENDANCE REGISTER REVIEW",
      "Total instructional days scheduled: 182",
      "YTD days completed as of Feb 17: 103",
      "Instructional day requirement satisfied",
    ].join("\n"),
  },
];

const STAGE_DURATIONS = [1100, 1100, 1100, 1200, 1100, 1600];
const MAX_FEED_ITEMS = 18;

const dom = makeDom();
const state = {
  currentScenarioIndex: 0,
  currentStageIndex: 0,
  currentToken: 0,
  stageTimer: null,
  typingTimer: null,
  currentStartMs: 0,
  stats: {
    arrived: 0,
    parsed: 0,
    evaluated: 0,
    evidence: 0,
    processed: 0,
    fully: 0,
    partial: 0,
    non: 0,
    cycleMsTotal: 0,
    sourceCounts: Object.fromEntries(Object.keys(SOURCE_META).map((key) => [key, 0])),
  },
};

function makeDom() {
  return {
    pageShell: $("#page-shell"),
    liveDot: $("#live-dot"),
    playbackStatusLabel: $("#playback-status-label"),
    datasetName: $("#dataset-name"),
    datasetCount: $("#dataset-count"),
    currentStageLabel: $("#current-stage-label"),
    modeLabel: $("#mode-label"),
    summaryNote: $("#summary-note"),
    summarySteps: $("#summary-steps"),
    metricArrived: $("#metric-arrived"),
    metricParsed: $("#metric-parsed"),
    metricEvaluated: $("#metric-evaluated"),
    metricEvidence: $("#metric-evidence"),
    metricFull: $("#metric-full"),
    metricFullRate: $("#metric-full-rate"),
    metricPartial: $("#metric-partial"),
    metricPartialRate: $("#metric-partial-rate"),
    metricNon: $("#metric-non"),
    metricNonRate: $("#metric-non-rate"),
    metricCycle: $("#metric-cycle"),
    flowMap: $("#flow-map"),
    flowBadge: $("#flow-badge"),
    flowCaption: $("#flow-caption"),
    packetLayer: $("#packet-layer"),
    sparkLayer: $("#spark-layer"),
    sourceNodes: $$(".source-node"),
    sourceCounts: Object.fromEntries(Object.keys(SOURCE_META).map((key) => [key, $(`#count-${key}`)])),
    engineCore: $("#engine-core"),
    coreProcessing: $("#core-processing"),
    coreQueue: $("#core-queue"),
    outcomeCompliant: $("#outcome-compliant"),
    outcomePartial: $("#outcome-partial"),
    outcomeNon: $("#outcome-non"),
    outcomeCompliantCount: $("#outcome-compliant-count"),
    outcomePartialCount: $("#outcome-partial-count"),
    outcomeNonCount: $("#outcome-non-count"),
    currentPhaseBadge: $("#current-phase-badge"),
    focusSourcePill: $("#focus-source-pill"),
    focusDocId: $("#focus-doc-id"),
    focusDocTime: $("#focus-doc-time"),
    focusRuleFamily: $("#focus-rule-family"),
    focusDocType: $("#focus-doc-type"),
    focusDocOutcome: $("#focus-doc-outcome"),
    focusDocText: $("#focus-doc-text"),
    focusDocChips: $("#focus-doc-chips"),
    focusEvidenceCount: $("#focus-evidence-count"),
    focusGapState: $("#focus-gap-state"),
    focusStageName: $("#focus-stage-name"),
    focusActionShort: $("#focus-action-short"),
    workbenchTitle: $("#workbench-title"),
    thinkingPill: $("#thinking-pill"),
    thinkingLines: $("#thinking-lines"),
    thinkingProgressFill: $("#thinking-progress-fill"),
    thinkingEstimate: $("#thinking-estimate"),
    triageChipGrid: $("#triage-chip-grid"),
    routingDetails: $("#routing-details"),
    crmActionsList: $("#crm-actions-list"),
    draftMetaList: $("#draft-meta-list"),
    citationsGuardrailsList: $("#citations-guardrails-list"),
    responseSubtitle: $("#response-subtitle"),
    responseStatus: $("#response-status"),
    responseStream: $("#response-stream"),
    feedBadge: $("#feed-badge"),
    feedList: $("#feed-list"),
    footerStatus: $("#footer-status"),
  };
}
function formatInt(n) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function formatCycleTime(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "--";
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

function createChip(text, tone) {
  const chip = document.createElement("span");
  chip.className = `chip ${tone || "queue"}`.trim();
  chip.textContent = text;
  return chip;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createListRow(label, value) {
  const row = document.createElement("div");
  row.className = "list-row";
  row.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`;
  return row;
}

function renderSummarySteps(activeIndex) {
  dom.summarySteps.innerHTML = "";
  STAGES.forEach((stage, index) => {
    const el = document.createElement("div");
    el.className = "summary-step" + (index === activeIndex ? " active" : "");
    el.textContent = `${index + 1}. ${stage.title}`;
    dom.summarySteps.append(el);
  });
}

function renderThinkingLines(activeIndex) {
  dom.thinkingLines.innerHTML = "";
  STAGES.forEach((stage, index) => {
    const el = document.createElement("span");
    el.textContent = stage.title;
    if (index <= activeIndex) el.classList.add("active");
    dom.thinkingLines.append(el);
  });
}

function renderMetrics() {
  const stats = state.stats;
  const totalResolved = Math.max(stats.processed, 1);
  dom.metricArrived.textContent = formatInt(stats.arrived);
  dom.metricParsed.textContent = formatInt(stats.parsed);
  dom.metricEvaluated.textContent = formatInt(stats.evaluated);
  dom.metricEvidence.textContent = formatInt(stats.evidence);
  dom.metricFull.textContent = formatInt(stats.fully);
  dom.metricFullRate.textContent = formatPercent(stats.fully / totalResolved);
  dom.metricPartial.textContent = formatInt(stats.partial);
  dom.metricPartialRate.textContent = formatPercent(stats.partial / totalResolved);
  dom.metricNon.textContent = formatInt(stats.non);
  dom.metricNonRate.textContent = formatPercent(stats.non / totalResolved);
  dom.metricCycle.textContent = stats.processed ? formatCycleTime(stats.cycleMsTotal / stats.processed) : "--";
  dom.outcomeCompliantCount.textContent = formatInt(stats.fully);
  dom.outcomePartialCount.textContent = formatInt(stats.partial);
  dom.outcomeNonCount.textContent = formatInt(stats.non);
  dom.datasetCount.textContent = formatInt(stats.arrived);
}

function renderSourceCounts() {
  Object.keys(SOURCE_META).forEach((key) => {
    if (dom.sourceCounts[key]) dom.sourceCounts[key].textContent = formatInt(state.stats.sourceCounts[key]);
  });
}

function setActiveSource(sourceKey) {
  dom.sourceNodes.forEach((node) => {
    node.classList.toggle("is-active", node.dataset.source === sourceKey);
  });
}

function setActiveOutcome(statusKey) {
  dom.outcomeCompliant.classList.toggle("is-active", statusKey === "fully");
  dom.outcomePartial.classList.toggle("is-active", statusKey === "partial");
  dom.outcomeNon.classList.toggle("is-active", statusKey === "non");
}

function getSourceNode(sourceKey) {
  return dom.sourceNodes.find((node) => node.dataset.source === sourceKey);
}

function getOutcomeNode(statusKey) {
  if (statusKey === "fully") return dom.outcomeCompliant;
  if (statusKey === "partial") return dom.outcomePartial;
  return dom.outcomeNon;
}

function getRelativePoint(container, el) {
  const a = container.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height / 2 };
}

function pulseNode(el) {
  if (!el) return;
  el.classList.remove("pulse-hit");
  void el.offsetWidth;
  el.classList.add("pulse-hit");
  window.setTimeout(() => el.classList.remove("pulse-hit"), 420);
}

function spawnPacket(direction, fromEl, toEl, color) {
  if (!fromEl || !toEl) return;
  const from = getRelativePoint(dom.flowMap, fromEl);
  const to = getRelativePoint(dom.flowMap, toEl);
  const packet = document.createElement("div");
  packet.className = "flow-packet";
  const bend = direction === "inbound" ? -28 : 14;
  const mx = from.x + (to.x - from.x) * 0.56;
  const my = from.y + (to.y - from.y) * 0.44 + bend;
  const duration = direction === "publish" ? 1180 : 980;
  packet.style.setProperty("--packet-color", color);
  packet.style.setProperty("--dur", `${duration}ms`);
  packet.style.setProperty("--sx", `${from.x - 7}px`);
  packet.style.setProperty("--sy", `${from.y - 7}px`);
  packet.style.setProperty("--mx", `${mx - 7}px`);
  packet.style.setProperty("--my", `${my - 7}px`);
  packet.style.setProperty("--ex", `${to.x - 7}px`);
  packet.style.setProperty("--ey", `${to.y - 7}px`);
  dom.packetLayer.append(packet);
  window.setTimeout(() => packet.remove(), duration + 80);
}

function spawnSparkNear(el, color) {
  if (!el) return;
  const p = getRelativePoint(dom.flowMap, el);
  const dx = (Math.random() - 0.5) * 34;
  const dy = (Math.random() - 0.5) * 34;
  const spark = document.createElement("div");
  spark.className = "flow-spark";
  spark.style.setProperty("--spark-color", color);
  spark.style.setProperty("--x", `${p.x + dx - 14}px`);
  spark.style.setProperty("--y", `${p.y + dy - 14}px`);
  dom.sparkLayer.append(spark);
  window.setTimeout(() => spark.remove(), 720);
}

function streamText(token, text, duration) {
  if (state.typingTimer) {
    window.clearInterval(state.typingTimer);
    state.typingTimer = null;
  }
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) {
    dom.responseStream.textContent = "";
    return;
  }
  dom.responseStream.textContent = "";
  const step = Math.max(1, Math.ceil(words.length / Math.max(8, Math.floor(duration / 45))));
  let index = 0;
  state.typingTimer = window.setInterval(() => {
    if (token !== state.currentToken) {
      window.clearInterval(state.typingTimer);
      state.typingTimer = null;
      return;
    }
    index = Math.min(words.length, index + step);
    dom.responseStream.textContent = words.slice(0, index).join(" ");
    dom.responseStream.scrollTop = dom.responseStream.scrollHeight;
    if (index >= words.length) {
      window.clearInterval(state.typingTimer);
      state.typingTimer = null;
    }
  }, 40);
}

function getStageNarrative(scenario, stageIndex) {
  const sourceMeta = SOURCE_META[scenario.source];
  if (stageIndex === 0) {
    return `${scenario.file} has arrived from ${sourceMeta.label.toLowerCase()} and entered the compliance stream. The engine is preserving file type, source context, and raw layout before any rule logic begins.`;
  }
  if (stageIndex === 1) {
    return `The engine is reading ${scenario.file} page by page. Tables, labels, signatures, and dates are being preserved so later evidence can still point back to original proof.`;
  }
  if (stageIndex === 2) {
    return `The engine is isolating the facts that matter for ${scenario.ruleFamily.toLowerCase()}. Extracted facts include ${scenario.facts.join("; ")}. Those facts now become the inputs to the rule.`;
  }
  if (stageIndex === 3) {
    return `Rule evaluation is now running. Requirement: ${scenario.rule} Comparison: ${scenario.comparison} This is the stage where raw document facts turn into an auditable compliance state.`;
  }
  if (stageIndex === 4) {
    const missing = scenario.missingDocs.length ? `Missing proof is also being attached: ${scenario.missingDocs.join("; ")}.` : "No missing proof is detected, so the evidence packet is complete.";
    return `The system is assembling the evidence packet. Supporting documents include ${scenario.evidenceDocs.join(", ")}. ${missing} The user will see both proof and next action together.`;
  }
  return `${STATUS_META[scenario.statusKey].label}. ${scenario.summary} Supporting evidence: ${scenario.evidenceSummary} Required action: ${scenario.action}`;
}
function renderFocusCard(scenario, stageIndex) {
  const sourceMeta = SOURCE_META[scenario.source];
  const statusMeta = STATUS_META[scenario.statusKey];
  dom.focusSourcePill.textContent = sourceMeta.label;
  dom.focusDocId.textContent = scenario.code;
  dom.focusDocTime.textContent = `Stage ${stageIndex + 1} of ${STAGES.length}`;
  dom.focusRuleFamily.textContent = scenario.ruleFamily;
  dom.focusDocType.textContent = scenario.docType;
  dom.focusDocOutcome.textContent = stageIndex >= 3 ? statusMeta.label : "In progress";
  dom.focusDocText.textContent = scenario.preview;
  dom.focusEvidenceCount.textContent = `${scenario.evidenceDocs.length} files`;
  dom.focusGapState.textContent = scenario.missingDocs.length ? `${scenario.missingDocs.length} gaps named` : "No missing proof";
  dom.focusStageName.textContent = STAGES[stageIndex].title;
  dom.focusActionShort.textContent = stageIndex >= 4 ? scenario.action : "Awaiting final packaging";
  dom.focusDocChips.innerHTML = "";
  [
    createChip(sourceMeta.label, "queue"),
    createChip(scenario.ruleFamily, "intent"),
    createChip(statusMeta.short, stageIndex >= 3 ? (scenario.statusKey === "fully" ? "ok" : scenario.statusKey === "partial" ? "warn" : "danger") : "priority"),
    ...scenario.tags.slice(0, 3).map((tag) => createChip(tag, "queue")),
  ].forEach((chip) => dom.focusDocChips.append(chip));
}

function renderWorkbench(scenario, stageIndex) {
  const statusMeta = STATUS_META[scenario.statusKey];
  dom.workbenchTitle.textContent = STAGES[stageIndex].title;
  dom.thinkingPill.textContent = STAGES[stageIndex].short;
  dom.thinkingEstimate.textContent = `stage ${stageIndex + 1} of ${STAGES.length}`;
  dom.thinkingProgressFill.style.width = `${((stageIndex + 1) / STAGES.length) * 100}%`;
  renderThinkingLines(stageIndex);
  dom.triageChipGrid.innerHTML = "";
  const visibleFacts = stageIndex >= 2 ? scenario.facts : stageIndex === 1 ? scenario.facts.slice(0, 1) : [];
  if (visibleFacts.length) {
    visibleFacts.forEach((fact) => dom.triageChipGrid.append(createChip(fact, "intent")));
  } else {
    dom.triageChipGrid.append(createChip("Waiting for extracted facts", "queue"));
  }
  dom.routingDetails.innerHTML = "";
  dom.routingDetails.append(createListRow("Rule", scenario.rule));
  dom.routingDetails.append(createListRow(stageIndex >= 3 ? "Comparison" : "Status", stageIndex >= 3 ? scenario.comparison : "Rule evaluation pending"));
  if (stageIndex >= 3) dom.routingDetails.append(createListRow("Result", statusMeta.label));
  dom.crmActionsList.innerHTML = "";
  if (stageIndex >= 4) {
    scenario.evidenceDocs.forEach((doc) => dom.crmActionsList.append(createListRow("Evidence", doc)));
    if (scenario.missingDocs.length) dom.crmActionsList.append(createListRow("Missing", scenario.missingDocs.join(", ")));
  } else {
    dom.crmActionsList.append(createListRow("Packet", "Evidence packet not assembled yet"));
  }
  dom.draftMetaList.innerHTML = "";
  dom.draftMetaList.append(createListRow("Action", stageIndex >= 4 ? scenario.action : "Action will be attached after packaging"));
  dom.draftMetaList.append(createListRow("Rule family", scenario.ruleFamily));
  dom.citationsGuardrailsList.innerHTML = "";
  scenario.guardrails.forEach((item) => dom.citationsGuardrailsList.append(createListRow("Guardrail", item)));
  dom.responseSubtitle.textContent = STAGES[stageIndex].description;
  dom.responseStatus.textContent = stageIndex === STAGES.length - 1 ? statusMeta.badge : STAGES[stageIndex].short;
}

function renderStageState(scenario, stageIndex) {
  const sourceMeta = SOURCE_META[scenario.source];
  const statusMeta = STATUS_META[scenario.statusKey];
  dom.datasetName.textContent = "Cross-document compliance analysis";
  dom.currentStageLabel.textContent = STAGES[stageIndex].title;
  dom.modeLabel.textContent = stageIndex === STAGES.length - 1 ? statusMeta.label : STAGES[stageIndex].short;
  dom.summaryNote.textContent = STAGES[stageIndex].description;
  dom.currentPhaseBadge.textContent = STAGES[stageIndex].title;
  dom.flowBadge.textContent = `${scenario.code} - ${STAGES[stageIndex].title}`;
  dom.flowCaption.textContent = `${sourceMeta.label} ${scenario.file} is currently moving through ${STAGES[stageIndex].title.toLowerCase()} on its way to ${statusMeta.label.toLowerCase()}.`;
  dom.footerStatus.textContent = `Current document: ${scenario.code} - ${scenario.title}`;
  dom.playbackStatusLabel.textContent = `Streaming ${scenario.code} through ${STAGES[stageIndex].title}`;
  renderSummarySteps(stageIndex);
  renderFocusCard(scenario, stageIndex);
  renderWorkbench(scenario, stageIndex);
  streamText(state.currentToken, getStageNarrative(scenario, stageIndex), STAGE_DURATIONS[stageIndex] - 180);
}

function addFeedItem(scenario, cycleMs) {
  const sourceMeta = SOURCE_META[scenario.source];
  const statusMeta = STATUS_META[scenario.statusKey];
  const item = document.createElement("article");
  item.className = `feed-item ${scenario.statusKey}`;
  item.innerHTML = `
    <div class="feed-item-head">
      <span class="feed-channel">${escapeHtml(sourceMeta.label)}</span>
      <span class="feed-outcome">${escapeHtml(statusMeta.label)}</span>
      <span class="feed-time">${escapeHtml(formatCycleTime(cycleMs))}</span>
    </div>
    <div class="feed-message-line">${escapeHtml(scenario.title)}</div>
    <div class="feed-meta-row">${escapeHtml(scenario.code)} - ${escapeHtml(scenario.file)} - ${escapeHtml(scenario.ruleFamily)}</div>
  `;
  dom.feedList.prepend(item);
  while (dom.feedList.children.length > MAX_FEED_ITEMS) dom.feedList.removeChild(dom.feedList.lastElementChild);
  dom.feedBadge.textContent = `${dom.feedList.children.length} published`;
}

function updateStatsForStage(scenario, stageIndex) {
  if (stageIndex === 2) state.stats.parsed += 1;
  if (stageIndex === 3) state.stats.evaluated += 1;
  if (stageIndex === 4) state.stats.evidence += 1;
  if (stageIndex === 5) {
    state.stats.processed += 1;
    state.stats[scenario.statusKey] += 1;
    const cycleMs = performance.now() - state.currentStartMs;
    state.stats.cycleMsTotal += cycleMs;
    addFeedItem(scenario, cycleMs);
  }
  renderMetrics();
}
function clearStageTimer() {
  if (state.stageTimer) {
    window.clearTimeout(state.stageTimer);
    state.stageTimer = null;
  }
}

function beginScenario(index) {
  clearStageTimer();
  const scenario = SCENARIOS[index % SCENARIOS.length];
  const sourceMeta = SOURCE_META[scenario.source];
  const sourceNode = getSourceNode(scenario.source);
  state.currentScenarioIndex = index % SCENARIOS.length;
  state.currentStageIndex = 0;
  state.currentToken += 1;
  state.currentStartMs = performance.now();
  state.stats.arrived += 1;
  state.stats.sourceCounts[scenario.source] += 1;
  renderMetrics();
  renderSourceCounts();
  dom.coreProcessing.textContent = "1";
  dom.coreQueue.textContent = String(Math.max(SCENARIOS.length - 1, 0));
  dom.engineCore.classList.add("is-busy");
  setActiveSource(scenario.source);
  setActiveOutcome(null);
  pulseNode(sourceNode);
  spawnSparkNear(sourceNode, sourceMeta.color);
  spawnPacket("inbound", sourceNode, dom.engineCore, sourceMeta.color);
  renderStageState(scenario, 0);
  scheduleNextStage();
}

function scheduleNextStage() {
  clearStageTimer();
  const scenario = SCENARIOS[state.currentScenarioIndex];
  const token = state.currentToken;
  const nextStageIndex = state.currentStageIndex + 1;
  state.stageTimer = window.setTimeout(() => {
    if (token !== state.currentToken) return;
    if (nextStageIndex >= STAGES.length) {
      beginScenario((state.currentScenarioIndex + 1) % SCENARIOS.length);
      return;
    }
    state.currentStageIndex = nextStageIndex;
    updateStatsForStage(scenario, nextStageIndex);
    if (nextStageIndex >= 1 && nextStageIndex <= 4) {
      const color = nextStageIndex === 4 ? STATUS_META[scenario.statusKey].color : SOURCE_META[scenario.source].color;
      pulseNode(dom.engineCore);
      spawnSparkNear(dom.engineCore, color);
    }
    if (nextStageIndex === STAGES.length - 1) {
      const outcomeEl = getOutcomeNode(scenario.statusKey);
      spawnPacket("publish", dom.engineCore, outcomeEl, STATUS_META[scenario.statusKey].color);
      spawnSparkNear(outcomeEl, STATUS_META[scenario.statusKey].color);
      setActiveOutcome(scenario.statusKey);
      pulseNode(outcomeEl);
      dom.footerStatus.textContent = `Latest publish: ${scenario.code} - ${STATUS_META[scenario.statusKey].label}`;
    }
    renderStageState(scenario, nextStageIndex);
    scheduleNextStage();
  }, STAGE_DURATIONS[state.currentStageIndex]);
}

function init() {
  dom.datasetName.textContent = "Cross-document compliance analysis";
  dom.feedBadge.textContent = "0 published";
  dom.coreProcessing.textContent = "1";
  dom.coreQueue.textContent = String(Math.max(SCENARIOS.length - 1, 0));
  renderSummarySteps(-1);
  renderThinkingLines(-1);
  renderMetrics();
  renderSourceCounts();
  dom.responseStream.textContent = "The compliance engine is waiting for the next raw document to enter the stream.";
  dom.focusDocText.textContent = "No document is active yet. When the stream starts, a real evidence file will appear here and travel through the full workflow.";
  dom.triageChipGrid.append(createChip("Waiting for first document", "queue"));
  dom.routingDetails.append(createListRow("Rule", "Pending incoming document"));
  dom.crmActionsList.append(createListRow("Packet", "No evidence packet yet"));
  dom.draftMetaList.append(createListRow("Action", "Waiting for analysis"));
  dom.citationsGuardrailsList.append(createListRow("Guardrail", "Every published finding will keep proof attached"));
  window.setTimeout(() => beginScenario(0), 800);
}

init();
