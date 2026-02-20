/* ============================================================
   ComplianceIQ — script.js
   Florida Private School Regulatory Compliance Dashboard
   ============================================================ */

// ---- State ----
let checklist = [];
let schoolData = [null, null]; // [north_broward, windermere]
let currentSchool = 0;
let currentFilter = 'all';

const SCHOOL_PDF_FOLDERS = ['north_broward', 'windermere'];

// Friendly labels for doc chips
const DOC_LABELS = {
  'Annual_Survey_2025.pdf': 'Annual Survey PDF',
  'VECHS_Clearance_Log.pdf': 'VECHS Clearance PDF',
  'DH684_Immunization_Report.pdf': 'DH-684 Report PDF',
  'Fire_Safety_Inspection.pdf': 'Fire Inspection PDF',
  'Teacher_Qualifications.pdf': 'Teacher Quals PDF',
  'SEVIS_I20_Log.pdf': 'SEVIS I-20 PDF',
  'SCF1_Scholarship_Form.pdf': 'SCF-1 Form PDF'
};

// ---- DOM refs ----
const $tableBody = document.getElementById('tableBody');
const $scoreVal = document.getElementById('scoreVal');
const $countC = document.getElementById('countCompliant');
const $countP = document.getElementById('countPartial');
const $countN = document.getElementById('countNon');
const $countT = document.getElementById('countTotal');
const $scanProgress = document.getElementById('scanProgress');

// ---- Boot ----
(async function init() {
  try {
    const [checklistRes, nbRes, wmRes] = await Promise.all([
      fetch('./data/checklist.json'),
      fetch('./data/north_broward_data.json'),
      fetch('./data/windermere_data.json')
    ]);

    if (!checklistRes.ok || !nbRes.ok || !wmRes.ok) {
      throw new Error('One or more data files failed to load.');
    }

    checklist = await checklistRes.json();
    schoolData[0] = await nbRes.json();
    schoolData[1] = await wmRes.json();

    updateDashboard();
    renderTable();
  } catch (err) {
    console.error('Data load error:', err);
    $tableBody.innerHTML = `
      <div class="error-state">
        <div class="error-state-icon">&#9888;&#65039;</div>
        <div style="font-size:14px;margin-bottom:6px">Failed to load compliance data</div>
        <div style="font-size:12px;color:var(--text3);font-family:'DM Mono',monospace">${err.message}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:12px">Make sure you are running a local server (e.g. npx serve .)</div>
      </div>`;
  }
})();

// ---- Helpers ----
function getResult(schoolIdx, regId) {
  const data = schoolData[schoolIdx];
  if (!data) return null;
  return data.results.find(r => r.id === regId) || null;
}

function getReg(regId) {
  return checklist.find(r => r.id === regId) || null;
}

function statusLabel(status) {
  if (status === 'compliant') return 'Compliant';
  if (status === 'non-compliant') return 'Non-Compliant';
  if (status === 'partial') return 'Partial';
  return status;
}

function citationLink(citation) {
  const url = 'https://www.google.com/search?q=' + encodeURIComponent(citation);
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="citation-link" title="Search Google for ${citation}">${citation}</a>`;
}

// ---- Dashboard Update ----
function updateDashboard() {
  const data = schoolData[currentSchool];
  if (!data) return;
  const s = data.school;

  $countC.textContent = s.compliant;
  $countP.textContent = s.partial;
  $countN.textContent = s.non_compliant;
  $countT.textContent = checklist.length;

  $scoreVal.textContent = s.score + '%';
  if (s.score >= 80) {
    $scoreVal.style.color = 'var(--green)';
  } else if (s.score >= 60) {
    $scoreVal.style.color = 'var(--amber)';
  } else {
    $scoreVal.style.color = 'var(--red)';
  }
}

// ---- Render Table ----
function renderTable(animate) {
  $tableBody.innerHTML = '';
  let rowNum = 0;

  // Group regulations by category
  const categories = {};

  checklist.forEach(reg => {
    const result = getResult(currentSchool, reg.id);
    if (!result || !matchesFilter(reg, result)) return;

    if (!categories[reg.category]) {
      categories[reg.category] = {
        name: reg.category,
        items: [],
        counts: { compliant: 0, partial: 0, nonCompliant: 0, highRisk: 0 }
      };
    }
    categories[reg.category].items.push({ reg, result });

    // update counts
    if (result.status === 'compliant') categories[reg.category].counts.compliant++;
    else if (result.status === 'partial') categories[reg.category].counts.partial++;
    else if (result.status === 'non-compliant') {
      categories[reg.category].counts.nonCompliant++;
      categories[reg.category].counts.highRisk++;
    }
  });

  Object.values(categories).forEach(cat => {
    // Create theme group wrapper
    const groupElement = document.createElement('div');
    groupElement.className = 'theme-group';

    // Create category divider
    const divider = document.createElement('div');
    divider.className = 'category-divider collapsed';

    let itemsHTML = '<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: stretch; justify-content: flex-start; width: 100%;">';

    cat.items.forEach(item => {
      const { reg, result } = item;
      let boxClass = '';
      let icon = '';
      let safetyIndicator = '';
      let isHighRisk = false;

      if (result.status === 'compliant') {
        boxClass = 'green';
        icon = '&#10004;&#65039;';
        safetyIndicator = 'Safe';
      } else if (result.status === 'partial') {
        boxClass = 'amber';
        icon = '&#9888;&#65039;';
        safetyIndicator = 'Partial';
      } else {
        boxClass = 'red';
        icon = '&#10060;';
        safetyIndicator = 'High Risk';
        isHighRisk = true;
      }

      const tooltipContent = `Evidence: ${result.evidence || 'N/A'}`;

      itemsHTML += `
        <div class="pill-tooltip" data-rule-id="${reg.id}">
          <div class="item-pill ${boxClass} ${isHighRisk ? 'pulse-risk' : ''}" style="${isHighRisk ? 'box-shadow: 0 0 6px rgba(239,68,68,0.5); border: 1px solid rgba(239,68,68,0.8);' : ''}">
            <div style="display:flex; justify-content:flex-start; align-items:center; gap: 6px; margin-bottom: 8px; font-weight: 700; font-size: 13px;">
              ${icon} <span>${safetyIndicator}</span>
            </div>
            <div class="pill-title">${reg.name}</div>
            <div class="pill-cite">${reg.citation}</div>
          </div>
          <span class="tooltiptext">${tooltipContent}</span>
        </div>
      `;
    });
    itemsHTML += '</div>';

    divider.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div class="category-tag">${cat.name}</div>
        <span class="theme-chevron">&#9660;</span>
      </div>
      ${itemsHTML}
    `;
    groupElement.appendChild(divider);

    // Create content wrapper
    const contentElement = document.createElement('div');
    contentElement.className = 'theme-content collapsed';

    // Add table header for this theme group
    const headerRow = document.createElement('div');
    headerRow.className = 'table-header-row';
    headerRow.style.background = 'var(--surface)';
    headerRow.innerHTML = `
      <div class="th">#</div>
      <div class="th">Regulation / Artifact</div>
      <div class="th">Trigger Condition</div>
      <div class="th">Status &amp; Evidence</div>
    `;
    contentElement.appendChild(headerRow);

    // Toggle logic
    divider.addEventListener('click', (e) => {
      const collapseOthers = () => {
        const allContents = $tableBody.querySelectorAll('.theme-content');
        const allDividers = $tableBody.querySelectorAll('.category-divider');
        allContents.forEach(c => {
          if (c !== contentElement) c.classList.add('collapsed');
        });
        allDividers.forEach(d => {
          if (d !== divider) d.classList.add('collapsed');
        });
      };

      const tooltip = e.target.closest('.pill-tooltip');
      if (tooltip) {
        e.stopPropagation();
        const ruleId = tooltip.getAttribute('data-rule-id');

        // Accordion: Ensure others are closed
        collapseOthers();

        // Ensure current category is expanded
        contentElement.classList.remove('collapsed');
        divider.classList.remove('collapsed');

        // Find and highlight specific rule row
        const ruleRow = contentElement.querySelector(`.reg-row[data-id="${ruleId}"]`);
        if (ruleRow) {
          setTimeout(() => {
            ruleRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            ruleRow.classList.add('expanded');
            const detail = ruleRow.querySelector('.row-detail');
            if (detail) detail.classList.add('open');

            ruleRow.style.backgroundColor = 'rgba(59,130,246,0.1)';
            setTimeout(() => { ruleRow.style.backgroundColor = ''; }, 1500);
          }, 50); // small delay to allow expansion rendering
        }
        return;
      }

      const isCurrentlyCollapsed = contentElement.classList.contains('collapsed');
      if (isCurrentlyCollapsed) {
        // Accordion: close others before opening this one
        collapseOthers();
        contentElement.classList.remove('collapsed');
        divider.classList.remove('collapsed');
      } else {
        // Just collapse this one if it's already open
        contentElement.classList.add('collapsed');
        divider.classList.add('collapsed');
      }
    });

    cat.items.forEach(item => {
      const { reg, result } = item;
      rowNum++;

      // Build row
      const row = document.createElement('div');
      row.className = 'reg-row';
      row.setAttribute('data-id', reg.id);
      row.setAttribute('data-status', result.status);
      row.setAttribute('data-level', reg.level);

      if (animate) {
        row.classList.add('scanning');
        row.style.animationDelay = (rowNum * 30) + 'ms';
      }

      // Evidence / action block
      let evidenceHTML = `<div class="evidence-cell">${result.evidence}`;
      if (result.quote) {
        evidenceHTML += `<div class="evidence-quote">"${result.quote}"</div>`;
      }
      if (result.action && result.status === 'non-compliant') {
        evidenceHTML += `<div class="evidence-action">&#9889; ${result.action}</div>`;
      } else if (result.action && result.status === 'partial') {
        evidenceHTML += `<div class="evidence-warn">&#9888;&#65039; ${result.action}</div>`;
      }
      evidenceHTML += '</div>';

      // Doc chip
      let docChipHTML = '';
      if (reg.relatedDoc) {
        const docLabel = DOC_LABELS[reg.relatedDoc] || reg.relatedDoc;
        docChipHTML = `<div class="doc-chip" data-doc="${reg.relatedDoc}">&#128196; ${docLabel}</div>`;
      }

      row.innerHTML = `
        <div class="row-num">${String(rowNum).padStart(2, '0')}</div>
        <div>
          <div class="reg-name">${reg.name}</div>
          <div class="reg-citation">${citationLink(reg.citation)}</div>
          ${docChipHTML}
        </div>
        <div class="reg-trigger">${reg.trigger}</div>
        <div class="status-evidence-cell">
          <div>
            <div class="status-badge ${result.status}">
              <div class="status-dot"></div>
              ${statusLabel(result.status)}
            </div>
          </div>
          ${evidenceHTML}
        </div>
        <span class="chevron">&#9660;</span>
        <div class="row-detail" id="detail-${reg.id}">
          <div class="detail-grid">
            <div class="detail-box">
              <div class="detail-box-title">Validation Logic</div>
              <div class="detail-box-body">${reg.trigger}</div>
            </div>
            <div class="detail-box">
              <div class="detail-box-title">Citation</div>
              <div class="detail-box-body">${citationLink(reg.citation)}</div>
            </div>
            ${reg.relatedDoc ? `
            <div class="detail-box">
              <div class="detail-box-title">Related Document</div>
              <div class="detail-box-body">
                <span class="doc-chip" data-doc="${reg.relatedDoc}" style="margin:0">&#128196; ${DOC_LABELS[reg.relatedDoc] || reg.relatedDoc}</span>
              </div>
            </div>` : ''}
            ${result.action ? `
            <div class="detail-box">
              <div class="detail-box-title">Recommended Action</div>
              <div class="detail-box-body" style="color:${result.status === 'non-compliant' ? 'var(--red)' : 'var(--amber)'}">${result.action}</div>
            </div>` : ''}
          </div>
        </div>
      `;

      // Row click → expand/collapse
      row.addEventListener('click', (e) => {
        // Don't expand if clicking doc chip or citation link
        if (e.target.closest('.doc-chip')) return;
        if (e.target.closest('.citation-link')) return;
        row.classList.toggle('expanded');
        const detail = row.querySelector('.row-detail');
        detail.classList.toggle('open');
      });

      contentElement.appendChild(row);
    });

    groupElement.appendChild(contentElement);
    $tableBody.appendChild(groupElement);
  });

  // Attach doc chip handlers
  document.querySelectorAll('.doc-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const docName = chip.getAttribute('data-doc');
      openPdfPreview(docName);
    });
  });
}

// ---- Filter Logic ----
function matchesFilter(reg, result) {
  if (currentFilter === 'all') return true;
  if (currentFilter === 'compliant') return result.status === 'compliant';
  if (currentFilter === 'partial') return result.status === 'partial';
  if (currentFilter === 'non-compliant') return result.status === 'non-compliant';
  if (currentFilter === 'state') return reg.level === 'state';
  if (currentFilter === 'federal') return reg.level === 'federal';
  return true;
}

// ---- School Switching ----
function selectSchool(idx) {
  currentSchool = idx;

  // Update tab styling
  document.querySelectorAll('.school-tab').forEach(tab => {
    tab.classList.toggle('active', parseInt(tab.getAttribute('data-school')) === idx);
  });

  updateDashboard();
  renderTable();
}

// ---- Run Compliance Scan ----
function runScan() {
  $scanProgress.style.display = 'block';
  renderTable(true); // Re-render with animation

  setTimeout(() => {
    $scanProgress.style.display = 'none';
  }, 2500);
}

// ---- Open Rules Modal ----
function openRules() {
  const body = document.getElementById('rulesBody');
  let lastCat = '';
  let html = '';
  let num = 0;

  checklist.forEach(reg => {
    if (reg.category !== lastCat) {
      if (lastCat) html += '</div>';
      html += `<div class="rules-group"><div class="rules-group-title">${reg.category}</div>`;
      lastCat = reg.category;
    }
    num++;
    html += `
      <div class="rule-item">
        <div class="rule-num">${String(num).padStart(2, '0')}</div>
        <div class="rule-content">
          <div class="rule-name">${reg.name}</div>
          <div class="rule-meta">
            <span class="rule-cite">${citationLink(reg.citation)}</span>
            <span class="level-badge ${reg.level}">${reg.level.toUpperCase()}</span>
          </div>
          <div class="rule-trigger-text">${reg.trigger}</div>
        </div>
      </div>`;
  });
  if (lastCat) html += '</div>';
  body.innerHTML = html;
  openModal('rulesModal');
}

// ---- Open Docs Modal ----
function openDocs() {
  const data = schoolData[currentSchool];
  if (!data) return;

  let html = `<div style="margin-bottom:14px;font-size:13px;color:var(--text2)">
    Showing documents for <strong>${data.school.name}</strong>
  </div><div class="doc-list">`;

  data.documents.forEach(doc => {
    html += `
      <div class="doc-item" data-doc="${doc.name}">
        <div class="doc-icon pdf">&#128196;</div>
        <div class="doc-info">
          <div class="doc-name">${doc.label}</div>
          <div class="doc-desc">${doc.desc}</div>
        </div>
        <div class="doc-size">${doc.size}</div>
        <button class="doc-preview-btn" data-doc="${doc.name}">Preview</button>
      </div>`;
  });

  html += '</div>';
  document.getElementById('docsBody').innerHTML = html;
  openModal('docsModal');

  // Attach preview handlers
  document.querySelectorAll('.doc-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const docName = item.getAttribute('data-doc');
      openPdfPreview(docName);
    });
  });
}

// ---- PDF Preview ----
function openPdfPreview(filename) {
  const folder = SCHOOL_PDF_FOLDERS[currentSchool];
  const pdfPath = `./pdfs/${folder}/${filename}`;

  document.getElementById('pdfModalTitle').innerHTML = `&#128196; ${filename}`;

  const wrap = document.getElementById('pdfIframeWrap');
  wrap.innerHTML = `<iframe src="${pdfPath}" title="PDF Preview: ${filename}"></iframe>`;

  // Handle iframe load error
  const iframe = wrap.querySelector('iframe');
  iframe.onerror = () => {
    wrap.innerHTML = `
      <div class="pdf-error">
        <div class="pdf-error-icon">&#128196;</div>
        <div class="pdf-error-text">Could not load document</div>
        <div class="pdf-error-sub">${pdfPath}</div>
      </div>`;
  };

  openModal('pdfModal');
}

// ---- Modal Helpers ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  // Clean up PDF iframe when closing
  if (id === 'pdfModal') {
    document.getElementById('pdfIframeWrap').innerHTML = '';
  }
}

// ---- EVENT BINDINGS ----

// School tab clicks
document.getElementById('schoolTabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.school-tab');
  if (!tab) return;
  selectSchool(parseInt(tab.getAttribute('data-school')));
});

// Filter chip clicks
document.getElementById('filterBar').addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  currentFilter = chip.getAttribute('data-filter');
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active-filter'));
  chip.classList.add('active-filter');
  renderTable();
});

// Header buttons
document.getElementById('btnRules').addEventListener('click', openRules);
document.getElementById('btnDocs').addEventListener('click', openDocs);
// Scan button removed

// Modal close buttons
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close');
    closeModal(modalId);
  });
});

// Click outside modal to close
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(overlay.id);
    }
  });
});

// ESC to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      closeModal(m.id);
    });
  }
});

