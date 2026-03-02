const fs = require('fs');

let content = fs.readFileSync('src/routes/dashboard.routes.ts', 'utf8');

// Replace "rows: snapshot.docs.map" with typed mapping
content = content.replace(/rows: snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\)/g, 'rows: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))');

// The Block-scoped variable 'db' used before its declaration
// There's STILL a const db = getFirestore() in getDirectorsInfo?
content = content.replace(/const db = getFirestore\(\);\n\s*\n\s*\/\/ Fetch directors/g, '// Fetch directors');

// Let's remove any other instances of const db = getFirestore() inside functions if they conflict
content = content.replace(/let total40YearsOldDirectors = 0;\s*const db = getFirestore\(\);/g, 'let total40YearsOldDirectors = 0;');


fs.writeFileSync('src/routes/dashboard.routes.ts', content);
console.log('Fixed typescript issues');