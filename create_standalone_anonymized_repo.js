const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'anonymized');

main();

function main() {
  ensureDir(OUT);
  ensureDir(path.join(OUT, 'data'));
  ensureDir(path.join(OUT, 'pdfs'));

  copyFile('styles.css', 'styles.css');
  copyFile('story.css', 'story.css');
  copyFile('flow-story.css', 'flow-story.css');
  copyFile('flow-story.js', 'flow-story.js');
  copyFile('data/checklist.json', 'data/checklist.json');

  copyDirectory('pdfs/school_1', 'pdfs/school_1');
  copyDirectory('pdfs/school_2', 'pdfs/school_2');
  exportSchoolData('school_1');
  exportSchoolData('school_2');

  writeTransformed(
    'index-anonymous.html',
    'index.html',
    [
      removeModeToggleAssets,
      removeStandaloneGuard,
      removeToggleBlock,
      content => replaceAll(content, 'href="story-anonymous.html"', 'href="story.html"'),
      content => replaceAll(content, 'href="Compliance-story-anonymous.html"', 'href="Compliance-story.html"'),
      content => replaceAll(content, 'src="script-anonymous.js"', 'src="script.js"')
    ]
  );

  writeTransformed(
    'script-anonymous.js',
    'script.js',
    []
  );

  writeTransformed(
    'story-anonymous.html',
    'story.html',
    [
      removeModeToggleAssets,
      removeStandaloneGuard,
      removeToggleBlock,
      content => replaceAll(content, 'href="index-anonymous.html"', 'href="index.html"'),
      content => replaceAll(content, 'href="Compliance-story-anonymous.html"', 'href="Compliance-story.html"'),
      content => replaceAll(content, 'src="story-anonymous.js"', 'src="story.js"')
    ]
  );

  writeTransformed(
    'story-anonymous.js',
    'story.js',
    []
  );

  writeTransformed(
    'Compliance-story-anonymous.html',
    'Compliance-story.html',
    [
      removeModeToggleAssets,
      removeStandaloneGuard,
      removeToggleBlock,
      removeComplianceToggleStyles,
      content => replaceAll(content, 'href="index-anonymous.html"', 'href="index.html"')
    ]
  );

  writeTransformed(
    'flow-story.html',
    'flow-story.html',
    []
  );

  writeReadme();

  console.log(`Standalone anonymized repo created at ${OUT}`);
}

function writeTransformed(sourceRelativePath, targetRelativePath, transforms) {
  const sourcePath = path.join(ROOT, sourceRelativePath);
  let content = fs.readFileSync(sourcePath, 'utf8');
  for (const transform of transforms) {
    content = transform(content);
  }
  const targetPath = path.join(OUT, targetRelativePath);
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content, 'utf8');
}

function copyFile(sourceRelativePath, targetRelativePath) {
  const sourcePath = path.join(ROOT, sourceRelativePath);
  const targetPath = path.join(OUT, targetRelativePath);
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function copyDirectory(sourceRelativePath, targetRelativePath) {
  const sourcePath = path.join(ROOT, sourceRelativePath);
  const targetPath = path.join(OUT, targetRelativePath);
  ensureDir(targetPath);

  for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
    const nextSource = path.join(sourcePath, entry.name);
    const nextTarget = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(path.relative(ROOT, nextSource), path.relative(OUT, nextTarget));
    } else {
      ensureDir(path.dirname(nextTarget));
      fs.copyFileSync(nextSource, nextTarget);
    }
  }
}

function exportSchoolData(schoolKey) {
  const sourcePath = path.join(ROOT, 'data', `${schoolKey}_data.json`);
  const targetPath = path.join(OUT, 'data', `${schoolKey}_data.json`);
  const schoolDir = path.join(OUT, 'pdfs', schoolKey);
  const availableFiles = new Set(fs.readdirSync(schoolDir));
  const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

  for (const result of data.results || []) {
    for (const group of result.evidenceGroups || []) {
      for (const item of group.items || []) {
        if (!item || !item.name) continue;
        if (!availableFiles.has(item.name)) {
          item.state = 'missing';
        }
      }
    }
  }

  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function replaceAll(content, from, to) {
  return content.split(from).join(to);
}

function removeModeToggleAssets(content) {
  content = content.replace(/\r?\n\s*<link rel="stylesheet" href="mode-toggle\.css">\s*/g, '\n');
  content = content.replace(/\r?\n\s*<script src="mode-toggle\.js"><\/script>\s*/g, '\n');
  return content;
}

function removeStandaloneGuard(content) {
  return content.replace(/\r?\n\s*<script>\s*\(function \(\) \{[\s\S]*?complianceiqDemoMode[\s\S]*?<\/script>\s*/g, '\n');
}

function removeToggleBlock(content) {
  return content.replace(/\r?\n\s*<div class="demo-mode-toggle[\s\S]*?<\/div>\s*/g, '\n');
}

function removeComplianceToggleStyles(content) {
  return content.replace(/\r?\n\s*\.nav-links \.demo-mode-toggle \{\r?\n\s*margin: -2px 0;\r?\n\s*\}\s*/g, '\n');
}

function writeReadme() {
  const readme = `# ComplianceIQ Anonymized Demo

This folder is a standalone anonymized version of the Florida private school compliance demo.

## Included

- \`index.html\` dashboard
- \`story.html\` data story
- \`Compliance-story.html\` rules generation story
- \`flow-story.html\` flow story
- \`data/\` with anonymized school data and checklist
- \`pdfs/school_1\` and \`pdfs/school_2\` evidence files

## Notes

- This package is self-contained and does not depend on files outside this folder.
- The anonymized demo does not include a toggle back to the named/original repo.
- Open \`index.html\` to start the demo.
`;

  fs.writeFileSync(path.join(OUT, 'README.md'), readme, 'utf8');
}
