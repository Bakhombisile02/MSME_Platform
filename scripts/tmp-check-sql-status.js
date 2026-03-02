const fs = require('fs');

const inputPath = process.argv[2] || '/Users/siyadl/Downloads/ceec-msme-banner-export/msme_db_full.sql';
const sql = fs.readFileSync(inputPath, 'utf8');

function parseInsertValues(sqlText, tableName) {
  const values = [];
  const pattern = 'INSERT INTO `'+ tableName +'` VALUES (.+?);';
  const insertMatch = sqlText.match(new RegExp(pattern, 's'));
  if (!insertMatch) return values;

  const insertData = insertMatch[1];
  let depth = 0;
  let currentRecord = '';
  let inQuote = false;
  let escapeNext = false;

  for (let i = 0; i < insertData.length; i++) {
    const char = insertData[i];

    if (escapeNext) {
      currentRecord += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      currentRecord += char;
      escapeNext = true;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inQuote = !inQuote;
      currentRecord += char;
      continue;
    }

    if (!inQuote) {
      if (char === '(') {
        if (depth === 0) currentRecord = '';
        else currentRecord += char;
        depth++;
        continue;
      }
      if (char === ')') {
        depth--;
        if (depth === 0) {
          values.push(currentRecord);
          currentRecord = '';
        } else {
          currentRecord += char;
        }
        continue;
      }
    }

    if (depth > 0) currentRecord += char;
  }

  return values;
}

function parseRecordValues(record) {
  const values = [];
  let current = '';
  let inQuote = false;
  let escapeNext = false;

  for (let i = 0; i < record.length; i++) {
    const char = record[i];

    if (escapeNext) {
      if (char === 'n') current += '\n';
      else if (char === 'r') current += '\r';
      else if (char === 't') current += '\t';
      else current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inQuote = !inQuote;
      continue;
    }

    if (char === ',' && !inQuote) {
      values.push(current.trim() === 'NULL' ? null : current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim() === 'NULL' ? null : current);
  return values;
}

const records = parseInsertValues(sql, 'MSMEBusiness');
let approved = 0;
let pending = 0;
let rejected = 0;
let other = 0;
let deleted = 0;

for (const record of records) {
  const values = parseRecordValues(record);
  const isVerified = values[27];
  const deletedAt = values[35];

  if (deletedAt !== null) deleted++;

  if (isVerified === '2') approved++;
  else if (isVerified === '1') pending++;
  else if (isVerified === '3') rejected++;
  else other++;
}

console.log({
  source: inputPath,
  total: records.length,
  approved,
  pending,
  rejected,
  other,
  deleted,
});
