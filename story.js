/* ============================================================
   ComplianceIQ — story.js
   D3.js Interactive Visualizations for the Data Story
   ============================================================ */

// ---- Data ----
const categories = [
  { key: 'State — Administrative & Financial', short: 'Admin & Financial', ids: ['ADM-001','ADM-002','ADM-003','ADM-004','ADM-005'], level: 'state' },
  { key: 'State — Personnel & Staffing',      short: 'Personnel',        ids: ['PER-001','PER-002','PER-003','PER-004'],             level: 'state' },
  { key: 'State — Student Health & Safety',    short: 'Health & Safety',  ids: ['HLT-001','HLT-002','HLT-003'],                      level: 'state' },
  { key: 'State — Facility & Operations',      short: 'Facility Ops',    ids: ['FAC-001','FAC-002'],                                 level: 'state' },
  { key: 'State — Transportation',             short: 'Transportation',  ids: ['TRN-001','TRN-002'],                                 level: 'state' },
  { key: 'Federal — Immigration (DHS/ICE/SEVIS)', short: 'Immigration',  ids: ['IMM-001','IMM-002','IMM-003'],                       level: 'federal' },
  { key: 'Federal — Department of Labor (DOL)',   short: 'DOL / Labor',  ids: ['DOL-001','DOL-002'],                                 level: 'federal' },
  { key: 'Federal — Data Privacy (FTC/COPPA)',    short: 'Data Privacy', ids: ['DPR-001','DPR-002'],                                 level: 'federal' },
  { key: 'Federal — IRS & Treasury',              short: 'IRS / Treasury', ids: ['IRS-001','IRS-002'],                               level: 'federal' },
  { key: 'Federal — Building & Safety (OSHA/AHERA)', short: 'OSHA / AHERA', ids: ['BSF-001','BSF-002','BSF-003'],                   level: 'federal' }
];

const regNames = {
  'ADM-001':'Annual Survey','ADM-002':'170-Day Rule','ADM-003':'SCF-1 Form','ADM-004':'Tuition Schedule','ADM-005':'Insurance Cert',
  'PER-001':'VECHS Clearance','PER-002':'Teacher Quals','PER-003':'Moral Character','PER-004':'Ethics Policy',
  'HLT-001':'DH-684 Immunization','HLT-002':'DH-680 Blue Card','HLT-003':'Fire Inspection',
  'FAC-001':'Drill Log','FAC-002':'Radon Testing',
  'TRN-001':'CDL License','TRN-002':'Med Cert MCSA-5876',
  'IMM-001':'I-20 Eligibility','IMM-002':'SEVIS Log','IMM-003':'I-9 Employment',
  'DOL-001':'FLSA Exemption','DOL-002':'FMLA Poster',
  'DPR-001':'COPPA Notice','DPR-002':'Vendor DPA',
  'IRS-001':'BOI Filing','IRS-002':'Form 8300',
  'BSF-001':'AHERA Asbestos','BSF-002':'OSHA 300 Log','BSF-003':'Chemical Hygiene'
};

// All 28 regulation IDs in order
const allRegIds = categories.flatMap(c => c.ids);

// School data (hardcoded for the story)
const nbResults = {
  'ADM-001':'compliant','ADM-002':'compliant','ADM-003':'compliant','ADM-004':'compliant','ADM-005':'compliant',
  'PER-001':'compliant','PER-002':'partial','PER-003':'partial','PER-004':'compliant',
  'HLT-001':'compliant','HLT-002':'partial','HLT-003':'compliant',
  'FAC-001':'compliant','FAC-002':'non-compliant',
  'TRN-001':'compliant','TRN-002':'partial',
  'IMM-001':'compliant','IMM-002':'compliant','IMM-003':'compliant',
  'DOL-001':'compliant','DOL-002':'compliant',
  'DPR-001':'compliant','DPR-002':'compliant',
  'IRS-001':'compliant','IRS-002':'non-compliant',
  'BSF-001':'compliant','BSF-002':'compliant','BSF-003':'non-compliant'
};

const wmResults = {
  'ADM-001':'non-compliant','ADM-002':'compliant','ADM-003':'non-compliant','ADM-004':'compliant','ADM-005':'compliant',
  'PER-001':'non-compliant','PER-002':'partial','PER-003':'partial','PER-004':'partial',
  'HLT-001':'non-compliant','HLT-002':'partial','HLT-003':'partial',
  'FAC-001':'compliant','FAC-002':'compliant',
  'TRN-001':'compliant','TRN-002':'compliant',
  'IMM-001':'partial','IMM-002':'compliant','IMM-003':'partial',
  'DOL-001':'compliant','DOL-002':'non-compliant',
  'DPR-001':'compliant','DPR-002':'compliant',
  'IRS-001':'non-compliant','IRS-002':'compliant',
  'BSF-001':'non-compliant','BSF-002':'compliant','BSF-003':'compliant'
};

const failureDetails = [
  { school: 'North Broward', id: 'FAC-002', title: 'Radon Testing — Building B Overdue', evidence: 'Only 1 of 2 campus buildings tested. Building B (built 2006) has no Form DH-1777 on record. Testing overdue since 2022.', severity: 'red' },
  { school: 'North Broward', id: 'IRS-002', title: 'Form 8300 — $12,000 Cash Payment', evidence: 'One family paid $12,000 cash tuition. Form 8300 was not filed within the 15-day window required by 26 U.S.C. §6050I.', severity: 'red' },
  { school: 'North Broward', id: 'BSF-003', title: 'Chemical Hygiene Plan Outdated', evidence: 'CHP last updated 2021 — 4+ years stale. SDS binder in Chemistry lab missing 6 recent chemical additions. Eyewash log has a 3-week gap.', severity: 'red' },
  { school: 'Windermere', id: 'ADM-001', title: 'Annual Survey — Late & Missing Notary', evidence: 'Submitted May 3 (2 days past deadline). Notary seal completely absent from the filed document. Survey is legally incomplete.', severity: 'red' },
  { school: 'Windermere', id: 'PER-001', title: 'VECHS Clearance — Expired Screening', evidence: 'Staff member J. Martinez last screened June 2019 — now 5 years 8 months expired. Active student contact role. Immediate risk.', severity: 'red' },
  { school: 'Windermere', id: 'HLT-001', title: 'DH-684 — Missing 7th Grade Data', evidence: 'Kindergarten immunization data complete. 7th grade section entirely blank. Submission flagged as incomplete by DOH.', severity: 'red' },
  { school: 'Windermere', id: 'ADM-003', title: 'Scholarship Form — 7 Days Late', evidence: 'SCF-1 filed March 8, 2025. Statutory deadline was March 1. Seven-day gap creates potential audit exposure with Step Up.', severity: 'amber' },
  { school: 'Windermere', id: 'DOL-002', title: 'FMLA Poster Not Found', evidence: 'WH-1420 poster not displayed during physical walkthrough. Required for all employers with 50+ employees under 29 CFR §825.300.', severity: 'red' },
  { school: 'Windermere', id: 'BSF-001', title: 'AHERA Asbestos Plan — Overdue', evidence: 'AMP last updated 2019. Triennial reinspection overdue by 2+ years. Plan must be accessible to staff — currently in locked storage.', severity: 'red' },
  { school: 'Windermere', id: 'IRS-001', title: 'Beneficial Ownership — No BOI Filing', evidence: 'No FinCEN BOI report found on record. Required under 2024 Corporate Transparency Act for all applicable entities.', severity: 'red' }
];

const statusColor = { compliant: '#10b981', partial: '#f59e0b', 'non-compliant': '#ef4444' };
const statusVal   = { compliant: 2, partial: 1, 'non-compliant': 0 };

const tooltip = d3.select('#tooltip');

// ---- Utilities ----
function showTooltip(html, event) {
  tooltip.html(html).classed('visible', true);
  const tt = tooltip.node();
  const x = Math.min(event.clientX + 12, window.innerWidth - tt.offsetWidth - 16);
  const y = event.clientY - tt.offsetHeight - 10;
  tooltip.style('left', x + 'px').style('top', (y < 4 ? event.clientY + 16 : y) + 'px');
}
function hideTooltip() { tooltip.classed('visible', false); }

// ---- Reading Progress Bar ----
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = Math.min((scrollTop / docHeight) * 100, 100);
  document.getElementById('readProgress').style.width = pct + '%';

  // fade scroll cue
  const cue = document.getElementById('scrollCue');
  if (cue) cue.style.opacity = Math.max(0, 1 - scrollTop / 300);
});

// ---- CHART 1: Category Breakdown (Horizontal Bar) ----
function drawCategoryChart() {
  const container = d3.select('#chartCategories');
  container.selectAll('*').remove();

  const data = categories.map(c => ({ name: c.short, count: c.ids.length, level: c.level }));
  const w = container.node().clientWidth;
  const margin = { top: 8, right: 40, bottom: 8, left: 130 };
  const barH = 30;
  const gap = 8;
  const h = data.length * (barH + gap) + margin.top + margin.bottom;

  const svg = container.append('svg').attr('width', w).attr('height', h);
  const maxVal = d3.max(data, d => d.count);

  const xScale = d3.scaleLinear().domain([0, maxVal + 1]).range([margin.left, w - margin.right]);
  const yScale = d3.scaleBand().domain(data.map(d => d.name)).range([margin.top, h - margin.bottom]).padding(0.2);

  // Bars
  svg.selectAll('.cat-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'cat-bar')
    .attr('x', margin.left)
    .attr('y', d => yScale(d.name))
    .attr('height', yScale.bandwidth())
    .attr('rx', 6)
    .attr('fill', d => d.level === 'state' ? '#6366f1' : '#3b82f6')
    .attr('opacity', 0.85)
    .attr('width', 0)
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 1);
      showTooltip(`<strong>${d.name}</strong><br>${d.count} regulation${d.count > 1 ? 's' : ''} · ${d.level.toUpperCase()}`, event);
    })
    .on('mousemove', (event) => showTooltip(tooltip.html(), event))
    .on('mouseleave', function() { d3.select(this).attr('opacity', 0.85); hideTooltip(); })
    .transition().duration(800).delay((d, i) => i * 60)
    .attr('width', d => xScale(d.count) - margin.left);

  // Labels
  svg.selectAll('.cat-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', margin.left - 8)
    .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'central')
    .style('font-size', '11px')
    .text(d => d.name);

  // Count labels
  svg.selectAll('.cat-count')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'central')
    .style('font-weight', '600')
    .style('font-size', '12px')
    .attr('fill', '#1a1a1a')
    .attr('x', margin.left + 4)
    .attr('opacity', 0)
    .transition().duration(800).delay((d, i) => i * 60 + 400)
    .attr('x', d => xScale(d.count) + 8)
    .attr('opacity', 1)
    .text(d => d.count);
}

// ---- CHART 2: Head-to-Head Grouped Bar Chart ----
function drawComparisonChart() {
  const container = d3.select('#chartComparison');
  container.selectAll('*').remove();

  const data = categories.map(c => {
    const nbCounts = { compliant: 0, partial: 0, 'non-compliant': 0 };
    const wmCounts = { compliant: 0, partial: 0, 'non-compliant': 0 };
    c.ids.forEach(id => { nbCounts[nbResults[id]]++; wmCounts[wmResults[id]]++; });
    return { cat: c.short, nb: nbCounts, wm: wmCounts, total: c.ids.length };
  });

  const w = container.node().clientWidth;
  const margin = { top: 40, right: 20, bottom: 80, left: 50 };
  const h = 360;

  const svg = container.append('svg').attr('width', w).attr('height', h);

  const x0 = d3.scaleBand().domain(data.map(d => d.cat)).range([margin.left, w - margin.right]).padding(0.3);
  const x1 = d3.scaleBand().domain(['nb', 'wm']).range([0, x0.bandwidth()]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.total)]).nice().range([h - margin.bottom, margin.top]);

  // X-axis
  svg.append('g')
    .attr('transform', `translate(0,${h - margin.bottom})`)
    .call(d3.axisBottom(x0).tickSize(0))
    .selectAll('text')
    .style('font-family', 'DM Mono, monospace')
    .style('font-size', '9px')
    .style('fill', '#8a8a8a')
    .attr('transform', 'rotate(-35)')
    .attr('text-anchor', 'end')
    .attr('dx', '-4px')
    .attr('dy', '4px');
  svg.select('.domain').attr('stroke', '#e5e5e0');

  // Y-axis
  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-w + margin.left + margin.right))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', '#f0f0eb'))
    .call(g => g.selectAll('.tick text').style('font-family', 'DM Mono, monospace').style('font-size', '10px').style('fill', '#8a8a8a'));

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${margin.left + 8}, 12)`);
  [{label:'North Broward', color:'#3b82f6'}, {label:'Windermere', color:'#f59e0b'}].forEach((item, i) => {
    const g = legend.append('g').attr('transform', `translate(${i * 140}, 0)`);
    g.append('rect').attr('width', 12).attr('height', 12).attr('rx', 3).attr('fill', item.color);
    g.append('text').attr('x', 18).attr('y', 10).style('font-family', 'Outfit').style('font-size', '12px').style('fill', '#4a4a4a').text(item.label);
  });

  // Stacked bars for each school
  const statuses = ['compliant', 'partial', 'non-compliant'];
  const sColors = { compliant: '#10b981', partial: '#f59e0b', 'non-compliant': '#ef4444' };

  data.forEach((d, i) => {
    ['nb', 'wm'].forEach(school => {
      const counts = school === 'nb' ? d.nb : d.wm;
      let cumY = 0;
      statuses.forEach(s => {
        if (counts[s] === 0) return;
        svg.append('rect')
          .attr('x', x0(d.cat) + x1(school))
          .attr('y', h - margin.bottom)
          .attr('width', x1.bandwidth())
          .attr('height', 0)
          .attr('rx', 3)
          .attr('fill', sColors[s])
          .attr('opacity', school === 'nb' ? 0.85 : 0.7)
          .on('mouseenter', function(event) {
            d3.select(this).attr('opacity', 1);
            const schoolName = school === 'nb' ? 'North Broward' : 'Windermere';
            showTooltip(`<strong>${schoolName}</strong> · ${d.cat}<br>✅ ${counts.compliant} Compliant<br>⚠️ ${counts.partial} Partial<br>❌ ${counts['non-compliant']} Non-Compliant`, event);
          })
          .on('mousemove', (event) => showTooltip(tooltip.html(), event))
          .on('mouseleave', function() { d3.select(this).attr('opacity', school === 'nb' ? 0.85 : 0.7); hideTooltip(); })
          .transition().duration(600).delay(i * 50 + 200)
          .attr('y', y(cumY + counts[s]))
          .attr('height', y(cumY) - y(cumY + counts[s]));
        cumY += counts[s];
      });
    });
  });
}

// ---- CHART 3: Heatmap ----
function drawHeatmap() {
  const container = d3.select('#chartHeatmap');
  container.selectAll('*').remove();

  const schools = ['North Broward', 'Windermere'];
  const regs = allRegIds;

  const w = container.node().clientWidth;
  const margin = { top: 40, right: 16, bottom: 60, left: 110 };
  const cellW = Math.max(16, (w - margin.left - margin.right) / regs.length);
  const cellH = 40;
  const h = margin.top + schools.length * cellH + margin.bottom;

  const svg = container.append('svg').attr('width', w).attr('height', h);

  const x = d3.scaleBand().domain(regs).range([margin.left, margin.left + regs.length * cellW]).padding(0.08);
  const yBand = d3.scaleBand().domain(schools).range([margin.top, margin.top + schools.length * cellH]).padding(0.12);

  // School labels
  svg.selectAll('.hm-school')
    .data(schools)
    .enter()
    .append('text')
    .attr('x', margin.left - 10)
    .attr('y', d => yBand(d) + yBand.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'central')
    .style('font-family', 'Outfit').style('font-size', '12px').style('fill', '#4a4a4a').style('font-weight', '500')
    .text(d => d === 'North Broward' ? 'N. Broward' : 'Windermere');

  // Regulation ID labels (bottom)
  svg.selectAll('.hm-reg')
    .data(regs)
    .enter()
    .append('text')
    .attr('x', d => x(d) + x.bandwidth() / 2)
    .attr('y', margin.top + schools.length * cellH + 14)
    .attr('text-anchor', 'end')
    .attr('transform', d => `rotate(-50, ${x(d) + x.bandwidth() / 2}, ${margin.top + schools.length * cellH + 14})`)
    .style('font-family', 'DM Mono, monospace').style('font-size', '8px').style('fill', '#8a8a8a')
    .text(d => d);

  // Cells
  const allCells = [];
  schools.forEach(school => {
    const results = school === 'North Broward' ? nbResults : wmResults;
    regs.forEach(id => {
      allCells.push({ school, id, status: results[id] });
    });
  });

  svg.selectAll('.hm-cell')
    .data(allCells)
    .enter()
    .append('rect')
    .attr('x', d => x(d.id))
    .attr('y', d => yBand(d.school))
    .attr('width', x.bandwidth())
    .attr('height', yBand.bandwidth())
    .attr('rx', 4)
    .attr('fill', d => statusColor[d.status])
    .attr('opacity', 0)
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 1).attr('stroke', '#1a1a1a').attr('stroke-width', 1.5);
      const statusLabel = d.status === 'non-compliant' ? 'Non-Compliant' : d.status === 'partial' ? 'Partial' : 'Compliant';
      showTooltip(`<strong>${d.school}</strong><br>${d.id}: ${regNames[d.id]}<br>Status: <span style="color:${statusColor[d.status]}">${statusLabel}</span>`, event);
    })
    .on('mousemove', (event) => showTooltip(tooltip.html(), event))
    .on('mouseleave', function(event, d) { d3.select(this).attr('opacity', 0.82).attr('stroke', 'none'); hideTooltip(); })
    .transition().duration(400).delay((d, i) => i * 8)
    .attr('opacity', 0.82);
}

// ---- CHART 4: Dot Plot / Lollipop Comparison ----
function drawDotPlot() {
  const container = d3.select('#chartDotPlot');
  container.selectAll('*').remove();

  const w = container.node().clientWidth;
  const margin = { top: 36, right: 20, bottom: 60, left: 50 };
  const h = 300;

  const svg = container.append('svg').attr('width', w).attr('height', h);

  const x = d3.scaleBand().domain(allRegIds).range([margin.left, w - margin.right]).padding(0.4);
  const y = d3.scaleLinear().domain([-0.3, 2.3]).range([h - margin.bottom, margin.top]);

  // Grid lines for status levels
  [0, 1, 2].forEach(val => {
    svg.append('line')
      .attr('x1', margin.left).attr('x2', w - margin.right)
      .attr('y1', y(val)).attr('y2', y(val))
      .attr('stroke', '#f0f0eb').attr('stroke-dasharray', val === 0 ? '4,4' : 'none');
  });

  // Status labels
  const statusLabels = [{val: 0, text: 'Non-Compliant', color: '#ef4444'}, {val: 1, text: 'Partial', color: '#f59e0b'}, {val: 2, text: 'Compliant', color: '#10b981'}];
  statusLabels.forEach(s => {
    svg.append('text').attr('x', margin.left - 6).attr('y', y(s.val))
      .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
      .style('font-family', 'DM Mono, monospace').style('font-size', '9px').style('fill', s.color)
      .text(s.text);
  });

  // Reg ID labels at bottom
  svg.selectAll('.dp-label')
    .data(allRegIds)
    .enter()
    .append('text')
    .attr('x', d => x(d) + x.bandwidth() / 2)
    .attr('y', h - margin.bottom + 12)
    .attr('text-anchor', 'end')
    .attr('transform', d => `rotate(-55, ${x(d) + x.bandwidth() / 2}, ${h - margin.bottom + 12})`)
    .style('font-family', 'DM Mono, monospace').style('font-size', '7.5px').style('fill', '#8a8a8a')
    .text(d => d);

  // Connecting lines between dots
  allRegIds.forEach((id, i) => {
    const nbVal = statusVal[nbResults[id]];
    const wmVal = statusVal[wmResults[id]];
    svg.append('line')
      .attr('x1', x(id) + x.bandwidth() / 2)
      .attr('x2', x(id) + x.bandwidth() / 2)
      .attr('y1', y(nbVal))
      .attr('y2', y(nbVal))
      .attr('stroke', '#d4d4cf')
      .attr('stroke-width', 1.5)
      .transition().duration(500).delay(i * 25 + 300)
      .attr('y2', y(wmVal));
  });

  // NB dots (blue)
  svg.selectAll('.nb-dot')
    .data(allRegIds)
    .enter()
    .append('circle')
    .attr('cx', d => x(d) + x.bandwidth() / 2)
    .attr('cy', d => y(statusVal[nbResults[d]]))
    .attr('r', 0)
    .attr('fill', '#3b82f6')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .on('mouseenter', function(event, d) {
      d3.select(this).transition().duration(150).attr('r', 7);
      const s = nbResults[d];
      showTooltip(`<strong>North Broward</strong><br>${d}: ${regNames[d]}<br>Status: <span style="color:${statusColor[s]}">${s}</span>`, event);
    })
    .on('mousemove', (event) => showTooltip(tooltip.html(), event))
    .on('mouseleave', function() { d3.select(this).transition().duration(150).attr('r', 5); hideTooltip(); })
    .transition().duration(400).delay((d, i) => i * 25)
    .attr('r', 5);

  // WM dots (amber)
  svg.selectAll('.wm-dot')
    .data(allRegIds)
    .enter()
    .append('circle')
    .attr('cx', d => x(d) + x.bandwidth() / 2)
    .attr('cy', d => y(statusVal[wmResults[d]]))
    .attr('r', 0)
    .attr('fill', '#f59e0b')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .on('mouseenter', function(event, d) {
      d3.select(this).transition().duration(150).attr('r', 7);
      const s = wmResults[d];
      showTooltip(`<strong>Windermere</strong><br>${d}: ${regNames[d]}<br>Status: <span style="color:${statusColor[s]}">${s}</span>`, event);
    })
    .on('mousemove', (event) => showTooltip(tooltip.html(), event))
    .on('mouseleave', function() { d3.select(this).transition().duration(150).attr('r', 5); hideTooltip(); })
    .transition().duration(400).delay((d, i) => i * 25 + 150)
    .attr('r', 5);

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${margin.left + 8}, 8)`);
  [{label:'North Broward', color:'#3b82f6'}, {label:'Windermere', color:'#f59e0b'}].forEach((item, i) => {
    const g = legend.append('g').attr('transform', `translate(${i * 140}, 0)`);
    g.append('circle').attr('cx', 6).attr('cy', 6).attr('r', 5).attr('fill', item.color);
    g.append('text').attr('x', 18).attr('y', 10).style('font-family', 'Outfit').style('font-size', '12px').style('fill', '#4a4a4a').text(item.label);
  });
}

// ---- FAILURE CARDS ----
function renderFailures() {
  const grid = document.getElementById('failuresGrid');
  grid.innerHTML = failureDetails.map(f => `
    <div class="failure-card fail-${f.severity}">
      <div class="failure-school">${f.school} · ${f.id}</div>
      <div class="failure-title">${f.title}</div>
      <div class="failure-evidence">${f.evidence}</div>
      <span class="failure-tag tag-${f.severity}">${f.severity === 'red' ? 'NON-COMPLIANT' : 'PARTIAL'}</span>
    </div>
  `).join('');
}

// ---- Intersection Observer for Scroll Animations ----
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (id === 'chartCategories' && !entry.target.dataset.drawn) {
          entry.target.dataset.drawn = '1';
          drawCategoryChart();
        }
        if (id === 'chartComparison' && !entry.target.dataset.drawn) {
          entry.target.dataset.drawn = '1';
          drawComparisonChart();
        }
        if (id === 'chartHeatmap' && !entry.target.dataset.drawn) {
          entry.target.dataset.drawn = '1';
          drawHeatmap();
        }
        if (id === 'chartDotPlot' && !entry.target.dataset.drawn) {
          entry.target.dataset.drawn = '1';
          drawDotPlot();
        }
      }
    });
  }, { threshold: 0.2 });

  ['chartCategories', 'chartComparison', 'chartHeatmap', 'chartDotPlot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

// ---- Resize handling ----
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ['chartCategories', 'chartComparison', 'chartHeatmap', 'chartDotPlot'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.dataset.drawn) {
        if (id === 'chartCategories') drawCategoryChart();
        if (id === 'chartComparison') drawComparisonChart();
        if (id === 'chartHeatmap') drawHeatmap();
        if (id === 'chartDotPlot') drawDotPlot();
      }
    });
  }, 250);
});

// ---- PIPELINE STEP OUTPUT CONTENT ----
const pipelineContent = {
  1: {
    badge: 'Step 1',
    title: 'Identify — Regulatory Mapping Output',
    html: `
      <p>We mapped <strong>28 regulations</strong> to Florida private schools (PK-12, college preparatory). The mapping considered school type, enrollment size, staff count, facility age, and participation in scholarship programs.</p>
      <div class="pipe-output-stats">
        <div class="pipe-stat"><div class="pipe-stat-num">16</div><div class="pipe-stat-label">State Regs</div></div>
        <div class="pipe-stat"><div class="pipe-stat-num">12</div><div class="pipe-stat-label">Federal Regs</div></div>
        <div class="pipe-stat"><div class="pipe-stat-num">10</div><div class="pipe-stat-label">Categories</div></div>
        <div class="pipe-stat"><div class="pipe-stat-num">6</div><div class="pipe-stat-label">Agencies</div></div>
      </div>
      <table class="pipe-output-table">
        <thead><tr><th>Category</th><th>Level</th><th>Count</th><th>Key Regulation</th></tr></thead>
        <tbody>
          <tr><td>Administrative &amp; Financial</td><td>State</td><td>5</td><td>Notarized Annual Survey (s. 1002.42)</td></tr>
          <tr><td>Personnel &amp; Staffing</td><td>State</td><td>4</td><td>FDLE VECHS Level 2 Clearance</td></tr>
          <tr><td>Student Health &amp; Safety</td><td>State</td><td>3</td><td>Form DH-684 Immunization Report</td></tr>
          <tr><td>Immigration (DHS/ICE)</td><td>Federal</td><td>3</td><td>Form I-20 Certificate of Eligibility</td></tr>
          <tr><td>Building &amp; Safety (OSHA)</td><td>Federal</td><td>3</td><td>AHERA Asbestos Management Plan</td></tr>
        </tbody>
      </table>
    `
  },
  2: {
    badge: 'Step 2',
    title: 'Collect — Source Documents Gathered',
    html: `
      <p>We gathered <strong>12 primary source documents</strong> across both schools — the actual filed forms, inspection reports, and clearance logs submitted to Florida DOE, DOH, FDLE, and federal agencies.</p>
      <div class="pipe-output-stats">
        <div class="pipe-stat"><div class="pipe-stat-num">6</div><div class="pipe-stat-label">North Broward Docs</div></div>
        <div class="pipe-stat"><div class="pipe-stat-num">6</div><div class="pipe-stat-label">Windermere Docs</div></div>
        <div class="pipe-stat"><div class="pipe-stat-num">12</div><div class="pipe-stat-label">Total PDFs</div></div>
      </div>
      <table class="pipe-output-table">
        <thead><tr><th>Document</th><th>N. Broward</th><th>Windermere</th></tr></thead>
        <tbody>
          <tr><td>Annual Private School Survey</td><td>✅ Filed Apr 15</td><td>⚠️ Filed May 3 (late)</td></tr>
          <tr><td>VECHS Clearance Log</td><td>✅ 94 staff — all current</td><td>❌ J. Martinez expired</td></tr>
          <tr><td>DH-684 Immunization Report</td><td>✅ Complete (KG + 7th)</td><td>❌ 7th grade missing</td></tr>
          <tr><td>Fire Safety Inspection</td><td>✅ 0 violations</td><td>⚠️ 2 violations</td></tr>
          <tr><td>Teacher Qualifications</td><td>✅ 62 teachers</td><td>⚠️ 3 flagged</td></tr>
          <tr><td>SEVIS I-20 Log / SCF-1</td><td>✅ 78 students active</td><td>⚠️ Filed 7 days late</td></tr>
        </tbody>
      </table>
    `
  },
  3: {
    badge: 'Step 3',
    title: 'Extract — Key Data Points Pulled',
    html: `
      <p>From each document, we extracted the <strong>specific data points</strong> needed to evaluate compliance: dates, signatures, counts, certifications, and form completeness.</p>
      <div class="pipe-terminal">
        <span class="t-blue">EXTRACTING</span> Annual_Survey_2025.pdf (North Broward)...<br>
        &nbsp;&nbsp;→ filing_date: <span class="t-green">2025-04-15</span><br>
        &nbsp;&nbsp;→ notary_seal: <span class="t-green">PRESENT</span> (Broward County #FL-882)<br>
        &nbsp;&nbsp;→ school_code: NB-0042<br>
        &nbsp;&nbsp;→ enrollment: 847<br>
        <br>
        <span class="t-blue">EXTRACTING</span> VECHS_Clearance_Log.pdf (Windermere)...<br>
        &nbsp;&nbsp;→ total_staff: 47<br>
        &nbsp;&nbsp;→ expired_count: <span class="t-red">1</span><br>
        &nbsp;&nbsp;→ expired_staff: <span class="t-red">J. Martinez — last screened 2019-06-14</span><br>
        &nbsp;&nbsp;→ years_overdue: <span class="t-red">5yr 8mo</span><br>
        <br>
        <span class="t-blue">EXTRACTING</span> DH684_Immunization_Report.pdf (Windermere)...<br>
        &nbsp;&nbsp;→ kg_rate: <span class="t-green">97.2%</span><br>
        &nbsp;&nbsp;→ grade7_rate: <span class="t-red">NULL (section blank)</span><br>
        &nbsp;&nbsp;→ submission_date: 2024-10-02<br>
        <br>
        <span class="t-dim">... 9 more documents extracted ...</span>
      </div>
    `
  },
  4: {
    badge: 'Step 4',
    title: 'Validate — Evidence vs. Trigger Conditions',
    html: `
      <p>Each extracted data point was compared against the <strong>exact statutory trigger condition</strong> for that regulation. Results were classified as Compliant, Partial, or Non-Compliant.</p>
      <div class="pipe-terminal">
        <span class="t-blue">VALIDATING</span> ADM-001 — Annual Survey (North Broward)<br>
        &nbsp;&nbsp;Rule: Must be filed before May 1st with notary seal<br>
        &nbsp;&nbsp;Evidence: filed 2025-04-15, notary PRESENT<br>
        &nbsp;&nbsp;Result: <span class="t-green">✓ COMPLIANT</span> — 16 days ahead of deadline<br>
        <br>
        <span class="t-blue">VALIDATING</span> ADM-001 — Annual Survey (Windermere)<br>
        &nbsp;&nbsp;Rule: Must be filed before May 1st with notary seal<br>
        &nbsp;&nbsp;Evidence: filed 2025-05-03, notary <span class="t-red">ABSENT</span><br>
        &nbsp;&nbsp;Result: <span class="t-red">✗ NON-COMPLIANT</span> — late + missing notary seal<br>
        <br>
        <span class="t-blue">VALIDATING</span> PER-001 — VECHS Clearance (Windermere)<br>
        &nbsp;&nbsp;Rule: All staff with student contact — renewed every 5 years<br>
        &nbsp;&nbsp;Evidence: J. Martinez last screened 2019-06-14 (<span class="t-red">5yr 8mo expired</span>)<br>
        &nbsp;&nbsp;Result: <span class="t-red">✗ NON-COMPLIANT</span> — active student contact, screening lapsed<br>
        <br>
        <span class="t-dim">... 53 more validations completed (28 regs × 2 schools) ...</span>
      </div>
    `
  },
  5: {
    badge: 'Step 5',
    title: 'Report — Explainable Compliance Findings',
    html: `
      <p>The final output is a <strong>structured compliance report</strong> with cited evidence for every regulation — not a score alone, but a full explanation a human auditor can verify.</p>
      <div class="pipe-output-stats">
        <div class="pipe-stat"><div class="pipe-stat-num">87%</div><div class="pipe-stat-label">North Broward</div></div>
        <div class="pipe-stat"><div class="pipe-stat-num">61%</div><div class="pipe-stat-label">Windermere</div></div>
        <div class="pipe-stat"><div class="pipe-stat-num">56</div><div class="pipe-stat-label">Validations Run</div></div>
        <div class="pipe-stat"><div class="pipe-stat-num">10</div><div class="pipe-stat-label">Failures Found</div></div>
      </div>
      <table class="pipe-output-table">
        <thead><tr><th>Metric</th><th>North Broward</th><th>Windermere</th></tr></thead>
        <tbody>
          <tr><td>Compliant</td><td style="color:#10b981;font-weight:600">21 (75%)</td><td style="color:#10b981;font-weight:600">14 (50%)</td></tr>
          <tr><td>Partial</td><td style="color:#f59e0b;font-weight:600">4 (14%)</td><td style="color:#f59e0b;font-weight:600">7 (25%)</td></tr>
          <tr><td>Non-Compliant</td><td style="color:#ef4444;font-weight:600">3 (11%)</td><td style="color:#ef4444;font-weight:600">7 (25%)</td></tr>
          <tr><td>Top Risk Area</td><td>Facility / IRS</td><td>Admin / Personnel</td></tr>
          <tr><td>Immediate Actions</td><td>3 items</td><td>7 items</td></tr>
        </tbody>
      </table>
    `
  }
};

// ---- Pipeline Step Click Handler ----
function setupPipelineSteps() {
  const steps = document.querySelectorAll('#pipelineSteps .pipe-step');
  const output = document.getElementById('pipelineOutput');
  let activeStep = 1;

  function showStepOutput(stepNum, shouldScroll) {
    // Update active step styling
    steps.forEach(s => s.classList.remove('active-step'));
    steps.forEach(s => { if (parseInt(s.dataset.step) === stepNum) s.classList.add('active-step'); });

    activeStep = stepNum;
    const content = pipelineContent[stepNum];

    // Collapse, then show new content
    output.classList.remove('visible');
    setTimeout(() => {
      output.innerHTML = `
        <div class="pipe-output-card">
          <div class="pipe-output-header">
            <span class="pipe-output-step-badge">${content.badge}</span>
            <span class="pipe-output-title">${content.title}</span>
          </div>
          <div class="pipe-output-body">${content.html}</div>
        </div>
      `;
      output.classList.add('visible');
      // Scroll the output into view if triggered by user click
      if (shouldScroll) {
        setTimeout(() => {
          output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 80);
      }
    }, 50);
  }

  steps.forEach(s => {
    s.addEventListener('click', () => {
      const num = parseInt(s.dataset.step);
      showStepOutput(num, true);
    });
  });

  // Show step 1 by default (no scroll on load)
  showStepOutput(1, false);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  renderFailures();
  setupScrollAnimations();
  setupPipelineSteps();
});

