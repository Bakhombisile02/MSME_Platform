const fs = require('fs');
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
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
    if (escapeNext) { currentRecord += char; escapeNext = false; continue; }
    if (char === '\\') { currentRecord += char; escapeNext = true; continue; }
    if (char === "'" && !escapeNext) { inQuote = !inQuote; currentRecord += char; continue; }

    if (!inQuote) {
      if (char === '(') { if (depth === 0) currentRecord = ''; else currentRecord += char; depth++; continue; }
      if (char === ')') { depth--; if (depth === 0) { values.push(currentRecord); currentRecord = ''; } else currentRecord += char; continue; }
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
    if (escapeNext) { current += char; escapeNext = false; continue; }
    if (char === '\\') { escapeNext = true; continue; }
    if (char === "'" && !escapeNext) { inQuote = !inQuote; continue; }
    if (char === ',' && !inQuote) { values.push(current.trim() === 'NULL' ? null : current); current = ''; continue; }
    current += char;
  }
  values.push(current.trim() === 'NULL' ? null : current);
  return values;
}

async function main() {
  const records = parseInsertValues(sql, 'MSMEBusiness');
  const sqlIds = new Set();

  for (const record of records) {
    const values = parseRecordValues(record);
    const id = values[0];
    if (id) sqlIds.add(String(id));
  }

  const fsSnapshot = await db.collection('msme_businesses').get();
  const fsIds = new Set(fsSnapshot.docs.map(d => d.id));

  const missingInFirestore = [...sqlIds].filter(id => !fsIds.has(id));

  console.log({
    source: inputPath,
    sqlRows: sqlIds.size,
    firestoreRows: fsSnapshot.size,
    missingInFirestoreCount: missingInFirestore.length,
    missingInFirestoreSample: missingInFirestore.slice(0, 20),
  });
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
