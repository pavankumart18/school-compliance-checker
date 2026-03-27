const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const SOURCE_PATH = path.join(ROOT, 'generate_pdfs.js');

const REPLACEMENTS = [
  [/\bnorth_broward\b/g, 'school_1'],
  [/\bwindermere\b/g, 'school_2'],
  [/North Broward Preparatory School/g, 'School 1'],
  [/North Broward Preparatory/g, 'School 1'],
  [/North Broward Prep/g, 'School 1'],
  [/North Broward/g, 'School 1'],
  [/NORTH BROWARD/g, 'SCHOOL 1'],
  [/Windermere Preparatory School/g, 'School 2'],
  [/Windermere Preparatory/g, 'School 2'],
  [/Windermere Prep/g, 'School 2'],
  [/WINDERMERE/g, 'SCHOOL 2'],
  [/admin@northbrowardprep\.edu/g, 'admin@school1.demo'],
  [/admin@windermereprep\.edu/g, 'admin@school2.demo'],
  [/Coral Springs,\s*FL\s*33065/g, 'Florida Region'],
  [/Coral Springs,\s*FL/g, 'Florida Region'],
  [/Orlando,\s*FL\s*34786/g, 'Florida Region'],
  [/Orlando,\s*FL/g, 'Florida Region'],
  [/6189 Winter Garden-Vineland Rd,\s*Windermere,\s*FL\s*34786/g, 'Florida Region'],
  [/Windermere,\s*FL\s*34786/g, 'Florida Region'],
  [/Windermere,\s*FL/g, 'Florida Region'],
  [/Broward County/g, 'Florida Region'],
  [/Orange County/g, 'Florida Region']
];

function transformSource(source) {
  let transformed = source;
  for (const [pattern, replacement] of REPLACEMENTS) {
    transformed = transformed.replace(pattern, replacement);
  }
  return transformed;
}

function main() {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const transformed = transformSource(source);
  const scriptName = 'generate_school_demo_pdfs.virtual.js';

  const sandbox = {
    require,
    console,
    process,
    Buffer,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    __dirname: ROOT,
    __filename: path.join(ROOT, scriptName)
  };

  vm.runInNewContext(transformed, sandbox, {
    filename: scriptName,
    displayErrors: true
  });
}

main();
