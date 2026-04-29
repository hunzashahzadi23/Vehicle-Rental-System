const fs = require('fs');
const path = require('path');
// repo root is two levels up from this script
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const csvFile = path.join(REPO_ROOT, 'bookings.csv');
if (!fs.existsSync(csvFile)) { console.error('bookings.csv not found'); process.exit(1); }
const raw = fs.readFileSync(csvFile, 'utf8').split(/\r?\n/).filter(Boolean);
if (raw.length === 0) { console.error('empty bookings.csv'); process.exit(1); }
const headers = raw[0].split(',').map(h => h.trim());
const expected = headers.length;
function quoteCsv(val){ if (val === undefined || val === null) return ''; const s = String(val); if (/[",\r\n,]/.test(s)) { return '"' + s.replace(/"/g,'""') + '"'; } return s; }
const outLines = [headers.map(h=>quoteCsv(h)).join(',')];
for (let i = 1; i < raw.length; i++){
  const line = raw[i];
  const parts = line.split(',');
  const rebuilt = [];
  for (let j = 0; j < parts.length; j++){
    let cur = parts[j];
    // if looks like start of JSON and doesn't close on same part, merge until it closes
    if (cur.trim().startsWith('{') && !cur.trim().endsWith('}')){
      let k = j+1;
      while (k < parts.length && !parts[k].trim().endsWith('}')){
        cur += ',' + parts[k];
        k++;
      }
      if (k < parts.length) { cur += ',' + parts[k]; j = k; }
    }
    rebuilt.push(cur.trim());
  }
  // If rebuilt fields still more than expected, try to merge adjacent text fields into the last field
  if (rebuilt.length > expected){
    const fixed = rebuilt.slice(0, expected-1);
    const rest = rebuilt.slice(expected-1).join(',');
    fixed.push(rest);
    rebuilt.length = 0; rebuilt.push(...fixed);
  }
  // pad if fewer
  while (rebuilt.length < expected) rebuilt.push('');
  const quoted = rebuilt.map(v => quoteCsv(v));
  outLines.push(quoted.join(','));
}
fs.writeFileSync(csvFile, outLines.join('\n'), 'utf8');
console.log('bookings.csv sanitized — lines:', outLines.length-1);
