const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const csvFile = path.join(REPO_ROOT, 'bookings.csv');
if (!fs.existsSync(csvFile)) { console.error('bookings.csv not found', csvFile); process.exit(1); }
const raw = fs.readFileSync(csvFile, 'utf8').split(/\r?\n/).filter(Boolean);
const headers = raw[0].split(',').map(h => h.trim());
const expected = headers.length;
const custIdx = headers.indexOf('customerChecklist');
const ownerIdx = headers.indexOf('ownerChecklist');
const dentIdx = headers.indexOf('dentDescription');
function parseCsvLine(line) {
  const values = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = !inQuotes; }
      continue;
    }
    if (ch === ',' && !inQuotes) { values.push(cur); cur = ''; continue; }
    cur += ch;
  }
  values.push(cur);
  return values;
}
function quoteCsv(val){ if (val === undefined || val === null) return ''; const s = String(val); if (/[",\r\n]/.test(s)) return '"'+s.replace(/"/g,'""')+'"'; return s; }
function extractJsonSubstring(str){ const start = str.indexOf('{'); if (start === -1) return null; let depth = 0; for (let i = start; i < str.length; i++){ if (str[i] === '{') depth++; else if (str[i] === '}') depth--; if (depth === 0) return str.slice(start, i+1); } return null; }

const out = [raw[0]];
for (let i = 1; i < raw.length; i++){
  const line = raw[i]; if (!line.trim()) continue;
  const fields = parseCsvLine(line).map(s => s.trim());
  // combine candidate text from checklist-related columns
  const combined = [fields[custIdx]||'', fields[ownerIdx]||'', fields[dentIdx]||''].join(',');
  let jsonText = extractJsonSubstring(combined);
  let parsed = null;
  if (jsonText) {
    // unescape doubled quotes
    jsonText = jsonText.replace(/""/g,'"').replace(/\"/g,'"');
    try { parsed = JSON.parse(jsonText); }
    catch (e) { parsed = null; }
  }
  if (!parsed) {
    // try per-field
    for (const idx of [custIdx, ownerIdx]){
      if (idx >=0 && fields[idx]){
        const candidate = fields[idx].replace(/^"|"$/g,'').replace(/""/g,'"');
        try { parsed = JSON.parse(candidate); if (parsed) { fields[custIdx] = JSON.stringify(parsed); fields[ownerIdx] = ''; fields[dentIdx] = ''; break; } }
        catch (e){}
      }
    }
  } else {
    fields[custIdx] = JSON.stringify(parsed);
    fields[ownerIdx] = '';
    fields[dentIdx] = '';
  }
  // ensure length
  while (fields.length < expected) fields.push('');
  if (fields.length > expected){
    const fixed = fields.slice(0, expected-1);
    fixed.push(fields.slice(expected-1).join(','));
    fields.length = 0; fields.push(...fixed);
  }
  const quoted = fields.map(f => quoteCsv(f));
  out.push(quoted.join(','));
}
fs.writeFileSync(csvFile, out.join('\n'), 'utf8');
console.log('standardize_checklists: done — wrote', out.length-1, 'rows');
