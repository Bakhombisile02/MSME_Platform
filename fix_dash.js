const fs = require('fs');

let content = fs.readFileSync('functions/src/routes/dashboard.routes.ts', 'utf8');

const oldDirectorsCode = `    // Fetch all directors in parallel to avoid N+1 queries
    const directorPromises = businesses.map(business => 
      db
        .collection(COLLECTIONS.MSME_BUSINESSES)
        .doc(business.id)
        .collection('directors')
        .where('deletedAt', '==', null)
        .get()
    );
    
    const directorSnapshots = await Promise.all(directorPromises);
    
    // Process all directors
    directorSnapshots.forEach(directorsSnapshot => {
      directorsSnapshot.forEach(doc => {
        const director = doc.data();`;

const newDirectorsCode = `    // Fetch directors in batches to avoid overwhelming memory and Firestore connections
    const batchSize = 100;
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      const batchPromises = batch.map(business => 
        db
          .collection(COLLECTIONS.MSME_BUSINESSES)
          .doc(business.id)
          .collection('directors')
          .where('deletedAt', '==', null)
          .get()
      );
      
      const batchSnapshots = await Promise.all(batchPromises);
      
      // Process all directors in this batch
      batchSnapshots.forEach(directorsSnapshot => {
        directorsSnapshot.forEach(doc => {
          const director = doc.data();`;

content = content.replace(oldDirectorsCode, newDirectorsCode);

const oldDirectorsEnd = `      });
    });
    
    res.json({
      message: 'Dashboard MSME Directors data fetched successfully',`;

const newDirectorsEnd = `        });
      });
    } // End of batch loop
    
    res.json({
      message: 'Dashboard MSME Directors data fetched successfully',`;

content = content.replace(oldDirectorsEnd, newDirectorsEnd);

// Find and replace all instances of `await FirestoreRepo.list` with a lighter subset
// We'll replace it entirely with direct queries to reduce data over wire.
content = content.replace(/const allBusinesses = await FirestoreRepo\.list<MSMEBusiness>\(\s*COLLECTIONS\.MSME_BUSINESSES,\s*\{\s*limit:\s*10000,\s*offset:\s*0\s*\}\s*\);/g, `// Get businesses with a lighter query to prevent OOM
    const snapshot = await db.collection(COLLECTIONS.MSME_BUSINESSES)
      .where('deletedAt', '==', null)
      .select('is_verified', 'createdAt', 'ownerType', 'owner_gender_summary', 'disability_owned', 'business_type', 'registration_number', 'region', 'business_category_id', 'number_of_employees')
      .get();
      
    const allBusinesses = { 
      rows: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) 
    };`);

fs.writeFileSync('functions/src/routes/dashboard.routes.ts', content);
console.log('Fixed dashboard.routes.ts');
