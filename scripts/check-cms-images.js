/**
 * Check if all CMS images exist in Firebase Storage
 */

const https = require('https');

const BASE_URL = 'https://storage.googleapis.com/msmesite-53367.firebasestorage.app';
const API_URL = 'https://us-central1-msmesite-53367.cloudfunctions.net/api';

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      // Consume response body to prevent memory leak
      res.resume();
      resolve({ url, status: res.statusCode });
    });
    
    // Add timeout
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ url, status: 'timeout' });
    });
    
    req.on('error', () => {
      req.destroy();
      resolve({ url, status: 'error' });
    });
  });
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      // Check for non-200 status
      if (res.statusCode !== 200) {
        res.resume(); // Consume response
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    // Add timeout
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

async function main() {
  console.log('🔍 Checking CMS images in Firebase Storage...\n');
  console.log(`Storage: ${BASE_URL}`);
  console.log(`API: ${API_URL}\n`);
  
  const collections = [
    { name: 'Business Categories', endpoint: '/business-category/list', field: 'icon_url' },
    { name: 'Home Banners', endpoint: '/home-banner/list', field: 'image_url' },
    { name: 'Team Members', endpoint: '/team/list', field: 'url' },
    { name: 'Partners Logo', endpoint: '/partners-logo/list', field: 'icon_url' },
    { name: 'Blog/Articles', endpoint: '/blog/list', field: 'image_url' },
    { name: 'Downloads', endpoint: '/downloads/list', field: 'url' },
  ];
  
  let totalOk = 0;
  let totalFail = 0;
  const failedImages = [];
  
  for (const col of collections) {
    console.log(`=== ${col.name} ===`);
    
    try {
      const data = await fetchJson(API_URL + col.endpoint);
      const rows = data.values?.rows || [];
      
      if (rows.length === 0) {
        console.log('  (no data)\n');
        continue;
      }
      
      let ok = 0, fail = 0;
      
      for (const row of rows) {
        const imgUrl = row[col.field];
        if (!imgUrl) continue;
        
        const fullUrl = `${BASE_URL}/${imgUrl}`;
        const result = await checkUrl(fullUrl);
        
        if (result.status === 200) {
          ok++;
        } else {
          fail++;
          failedImages.push({ collection: col.name, url: imgUrl, status: result.status });
          console.log(`  ❌ ${imgUrl}: ${result.status}`);
        }
      }
      
      console.log(`  ✅ ${ok} OK, ❌ ${fail} failed\n`);
      totalOk += ok;
      totalFail += fail;
    } catch (error) {
      console.log(`  Error: ${error.message}\n`);
    }
  }
  
  console.log('========================================');
  console.log(`TOTAL: ✅ ${totalOk} OK, ❌ ${totalFail} failed`);
  console.log('========================================\n');
  
  if (failedImages.length > 0) {
    console.log('Failed images:');
    failedImages.forEach(img => {
      console.log(`  - [${img.collection}] ${img.url}`);
    });
  }
}

main().catch(console.error);
