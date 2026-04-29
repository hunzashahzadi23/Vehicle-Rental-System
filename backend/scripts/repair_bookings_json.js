const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const csvFile = path.join(REPO_ROOT, 'bookings.csv');
if (!fs.existsSync(csvFile)) { console.error('bookings.csv not found at', csvFile); process.exit(1); }
const raw = fs.readFileSync(csvFile, 'utf8').split(/\r?\n/);
if (raw.length === 0) { console.error('empty bookings.csv'); process.exit(1); }

function parseCsvLine(line) {
  const values = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      values.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  values.push(cur);
  return values;
}

function quoteCsv(val) {
  if (val === undefined || val === null) return '';
  const s = String(val);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const headers = parseCsvLine(raw[0]).map(h => h.trim());
const expected = headers.length;
const custIdx = headers.indexOf('customerChecklist');
const ownerIdx = headers.indexOf('ownerChecklist');
const dentIdx = headers.indexOf('dentDescription');

function balanceBracesCount(str) {
  let count = 0;
  for (let ch of str) {
    if (ch === '{') count++;
    if (ch === '}') count--;
  }
  return count;
}

function mergeJsonAt(fields, startIdx) {
  if (startIdx < 0 || startIdx >= fields.length) return fields;
  let piece = fields[startIdx] || '';
  // quick check: if it already looks balanced JSON, return
  let balance = balanceBracesCount(piece);
  if (piece.trim().startsWith('"')) { // strip wrapping quotes for check
    const stripped = piece.replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"');
    balance = balanceBracesCount(stripped);
    piece = stripped;
  }
  if (balance === 0 && (piece.trim().startsWith('{') || piece.trim().startsWith('['))) {
    // likely valid single-field JSON
    fields[startIdx] = piece;
    return fields;
  }
  // otherwise, attempt to merge forward until balanced or max
  let j = startIdx + 1;
  while (j < fields.length && balance !== 0) {
    let add = fields[j] || '';
    piece += ',' + add;
    balance = balanceBracesCount(piece);
    j++;
    // safety: if we've merged too many pieces, break
    if (j - startIdx > 10) break;
  }
  // j is one past last included
  const merged = piece;
  // replace range [startIdx..j-1] with merged
  fields.splice(startIdx, j - startIdx, merged);
  return fields;
}

const out = [raw[0]];
for (let i = 1; i < raw.length; i++) {
  const line = raw[i];
  if (!line.trim()) continue;
  let fields = parseCsvLine(line);
  // try to fix customerChecklist
  if (custIdx >= 0 && custIdx < fields.length) {
    if (String(fields[custIdx]).indexOf('{') !== -1) {
      fields = mergeJsonAt(fields, custIdx);
    }
  }
  // try to fix ownerChecklist
  if (ownerIdx >= 0 && ownerIdx < fields.length) {
    if (String(fields[ownerIdx]).indexOf('{') !== -1) {
      fields = mergeJsonAt(fields, ownerIdx);
    }
  }
  // try to fix dentDescription if it contains json-like
  if (dentIdx >= 0 && dentIdx < fields.length) {
    if (String(fields[dentIdx]).indexOf('{') !== -1) {
      fields = mergeJsonAt(fields, dentIdx);
    }
  }
  // normalize length
  if (fields.length > expected) {
    const fixed = fields.slice(0, expected - 1);
    const rest = fields.slice(expected - 1).join(',');
    fixed.push(rest);
    fields = fixed;
  }
  while (fields.length < expected) fields.push('');
  const quoted = fields.map(f => quoteCsv(f));
  out.push(quoted.join(','));
}

fs.writeFileSync(csvFile, out.join('\n'), 'utf8');
console.log('repair complete — wrote', out.length - 1, 'rows to', csvFile);
