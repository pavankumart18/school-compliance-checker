# ComplianceIQ — Florida Private School Regulatory Compliance Dashboard

A static web application that validates two Florida private schools against 28 state and federal regulations, displaying compliance status with explainable, evidence-backed findings.

![Light Theme Dashboard](https://img.shields.io/badge/theme-light-blue) ![Vanilla JS](https://img.shields.io/badge/stack-HTML%20%2B%20CSS%20%2B%20JS-orange) ![Regulations](https://img.shields.io/badge/regulations-28-green)

---

## Schools Covered

| School | Location | Compliance Score |
|--------|----------|-----------------|
| North Broward Preparatory School | Coral Springs, FL | **87%** |
| Windermere Preparatory School | Orlando, FL | **61%** |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- npm (comes with Node.js)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate the 12 synthetic PDF files
node generate_pdfs.js

# 3. Start a local server
npx serve .
```

Then open **http://localhost:3000** in your browser.

> **Note:** The app must be served over HTTP (not `file://`) for `fetch()` calls to work correctly.

---

## Project Structure

```
school/
├── index.html                  # Main dashboard page
├── styles.css                  # Dashboard styles (light theme)
├── script.js                   # Dashboard logic (vanilla JS)
├── story.html                  # Data Story page (NYTimes-style narrative)
├── story.css                   # Data Story styles
├── story.js                    # Data Story logic + D3.js visualizations
├── generate_pdfs.js            # Node script to create synthetic PDFs
├── data/
│   ├── checklist.json          # Master list of 28 regulations
│   ├── north_broward_data.json # Compliance results for North Broward
│   └── windermere_data.json    # Compliance results for Windermere
├── pdfs/
│   ├── north_broward/          # 6 synthetic PDFs for North Broward
│   │   ├── Annual_Survey_2025.pdf
│   │   ├── VECHS_Clearance_Log.pdf
│   │   ├── DH684_Immunization_Report.pdf
│   │   ├── Fire_Safety_Inspection.pdf
│   │   ├── Teacher_Qualifications.pdf
│   │   └── SEVIS_I20_Log.pdf
│   └── windermere/             # 6 synthetic PDFs for Windermere
│       ├── Annual_Survey_2025.pdf
│       ├── VECHS_Clearance_Log.pdf
│       ├── DH684_Immunization_Report.pdf
│       ├── Fire_Safety_Inspection.pdf
│       ├── Teacher_Qualifications.pdf
│       └── SCF1_Scholarship_Form.pdf
├── package.json
└── README.md
```

---

## Features

### Dashboard (`index.html`)

- **School Switching** — Toggle between North Broward and Windermere; all stats, scores, and the regulation table update dynamically.
- **Compliance Score** — Color-coded score display (green > 80%, amber 60–80%, red < 60%).
- **Summary Strip** — Four stat cards showing Compliant, Partial, Non-Compliant, and Total counts.
- **Filter Chips** — Filter regulations by status (All / Compliant / Partial / Non-Compliant) or level (State / Federal).
- **Regulation Table** — Grouped by category with expandable rows showing evidence, quotes, and recommended actions.
- **Rules & Checklist Modal** — View all 28 regulations with citations, trigger conditions, and level badges.
- **School Documents Modal** — Browse the current school's PDF documents with friendly labels and in-app preview.
- **PDF Preview Modal** — Full-screen iframe preview of any selected PDF document.

### Data Story (`story.html`)

- **NYTimes-style Narrative** — An editorial, scroll-driven story exploring the compliance gap between the two schools.
- **Interactive Methodology Pipeline** — Five clickable steps (Identify → Collect → Extract → Validate → Report) with detailed output panels.
- **D3.js Visualizations** — Scroll-triggered interactive charts:
  - Category compliance bar chart
  - Grouped/stacked comparison chart
  - Regulation heatmap
  - Dot plot timeline
- **Failure Deep-Dives** — Detailed cards for each critical non-compliance finding.
- **Evidence Terminal Log** — Simulated terminal output showing the validation engine in action.

---

## Regulation Categories

The 28 regulations span these categories:

| Category | Count | Level |
|----------|-------|-------|
| Administrative & Financial | 5 | State |
| Personnel & Staffing | 4 | State |
| Student Health & Safety | 3 | State |
| Facility & Operations | 3 | State |
| Transportation | 2 | State |
| Immigration (DHS/ICE/SEVIS) | 3 | Federal |
| Department of Labor (DOL) | 2 | Federal |
| Data Privacy (FTC/COPPA) | 2 | Federal |
| IRS & Treasury | 2 | Federal |
| Building & Safety (OSHA/AHERA) | 2 | Federal |

---

## Design

- **Theme:** Light
- **Fonts:** DM Serif Display (headings), DM Mono (code/labels), Outfit (body) via Google Fonts
- **Background:** Subtle CSS grid pattern
- **Header:** Sticky with frosted-glass backdrop blur
- **Stack:** Pure HTML, CSS, vanilla JavaScript — no frameworks

---

## License

ISC



