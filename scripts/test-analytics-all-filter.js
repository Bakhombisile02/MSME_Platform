const axios = require('axios');

const baseURL = 'https://us-central1-msmesite-53367.cloudfunctions.net/api';

async function testAdvancedAnalytics() {
  console.log('🔍 Testing Advanced Analytics Endpoints with "All" Filter\n');
  
  try {
    // Test 1: Growth Trends
    console.log('1️⃣  Testing Growth Trends...');
    const growth = await axios.get(`${baseURL}/dashboard/analytics/growth-trends`);
    console.log(`   ✅ Returns ${growth.data.data?.length || 0} months of data`);
    if (growth.data.data?.length > 0) {
      const sample = growth.data.data[0];
      console.log(`   📊 Sample: month=${sample.month}, year=${sample.year}, count=${sample.count}, approved=${sample.approved}, growth_rate=${sample.growth_rate}`);
    }
    
    // Test 2: Approval Funnel with All
    console.log('\n2️⃣  Testing Approval Funnel (All)...');
    const funnel = await axios.get(`${baseURL}/dashboard/analytics/approval-funnel/All`);
    console.log(`   ✅ Returns ${funnel.data.data?.length || 0} months of data`);
    if (funnel.data.data?.length > 0) {
      const sample = funnel.data.data[0];
      console.log(`   📊 Sample: month=${sample.month}, year=${sample.year}, approval_rate=${sample.approval_rate}%, rejection_rate=${sample.rejection_rate}%`);
    }
    
    // Test 3: Engagement Metrics with All
    console.log('\n3️⃣  Testing Engagement Metrics (All)...');
    const engagement = await axios.get(`${baseURL}/dashboard/analytics/engagement-metrics/All`);
    console.log(`   ✅ Contacts: ${engagement.data.data?.contacts?.length || 0} months`);
    console.log(`   ✅ Subscriptions: ${engagement.data.data?.subscriptions?.length || 0} months`);
    if (engagement.data.data?.contacts?.length > 0) {
      const sample = engagement.data.data.contacts[0];
      console.log(`   📊 Sample contact: month=${sample.month}, year=${sample.year}, count=${sample.count}`);
    }
    
    // Test 4: Gender Diversity
    console.log('\n4️⃣  Testing Gender Diversity...');
    const gender = await axios.get(`${baseURL}/dashboard/analytics/gender-diversity`);
    console.log(`   ✅ Ownership types: ${gender.data.data?.ownership?.length || 0}`);
    if (gender.data.data?.ownership?.length > 0) {
      gender.data.data.ownership.forEach(item => {
        console.log(`   📊 ${item.ownerType}: ${item.count}`);
      });
    }
    
    // Test 5: Service Provider Analytics
    console.log('\n5️⃣  Testing Service Provider Analytics...');
    const sp = await axios.get(`${baseURL}/dashboard/analytics/service-providers`);
    console.log(`   ✅ Total providers: ${sp.data.data?.total || 0}`);
    console.log(`   ✅ Categories: ${sp.data.data?.category_distribution?.length || 0}`);
    if (sp.data.data?.category_distribution?.length > 0) {
      const sample = sp.data.data.category_distribution[0];
      console.log(`   📊 Sample: ${sample.category_name} = ${sample.count}`);
    }
    
    // Test 6: Category Performance
    console.log('\n6️⃣  Testing Category Performance...');
    const category = await axios.get(`${baseURL}/dashboard/analytics/category-performance`);
    console.log(`   ✅ Returns ${category.data.data?.length || 0} categories`);
    if (category.data.data?.length > 0) {
      const sample = category.data.data[0];
      console.log(`   📊 Sample: ${sample.business_category_name} - total=${sample.total_count}, approved=${sample.approved_count}`);
    }
    
    // Test 7: Geographic Analysis
    console.log('\n7️⃣  Testing Geographic Analysis...');
    const geo = await axios.get(`${baseURL}/dashboard/analytics/geographic-analysis`);
    console.log(`   ✅ Returns ${geo.data.data?.length || 0} region/classification combinations`);
    if (geo.data.data?.length > 0) {
      const sample = geo.data.data[0];
      console.log(`   📊 Sample: ${sample.region} (${sample.rural_urban_classification}) = ${sample.count}`);
    }
    
    console.log('\n✅ All advanced analytics endpoints are working correctly!');
    console.log('🎉 The "All" filter should now display graphs properly in the CMS dashboard.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error testing analytics:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testAdvancedAnalytics();
