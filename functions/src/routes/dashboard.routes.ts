/**
 * Dashboard Routes
 * 
 * Analytics and statistics for admin dashboard
 */

import { Router, Request, Response } from 'express';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { authAdmin } from '../middleware/auth.middleware';
import { FirestoreRepo } from '../services/FirestoreRepository';
import { COLLECTIONS, MSMEBusiness, ServiceProvider, VerificationStatus } from '../models/schemas';

const router = Router();
const db = getFirestore();

// All dashboard routes require admin auth
router.use(authAdmin);

// =============================================================================
// Helper function to handle string vs number is_verified
// =============================================================================
function isVerified(value: any, target: number): boolean {
  return value === target || value === target.toString();
}

/**
 * GET /api/dashboard or /api/dashboard/data/:year
 * Main dashboard statistics
 */
async function getDashboardData(req: Request, res: Response) {
  try {
    const year = req.params.year ? parseInt(req.params.year) : new Date().getFullYear();
    
    // Try to use pre-computed analytics first
    const analyticsSnapshot = await db
      .collection('analytics_daily')
      .where('date', '>=', `${year}-01-01`)
      .where('date', '<', `${year + 1}-01-01`)
      .orderBy('date', 'desc')
      .limit(365)
      .get();
    
    let totals;
    
    if (!analyticsSnapshot.empty) {
      // Use analytics data if available
      const analytics = analyticsSnapshot.docs.map(doc => doc.data());
      const latestStats = analytics[0];
      
      totals = {
        total: latestStats.total_businesses || 0,
        pending: latestStats.pending_businesses || 0,
        approved: latestStats.approved_businesses || 0,
        rejected: latestStats.rejected_businesses || 0,
      };
    } else {
      // Fallback: query businesses directly
      console.log('Analytics not available, falling back to direct query');
      const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        { limit: 10000, offset: 0 }
      );
      
      // Filter by year if specified
      let businesses = allBusinesses.rows;
      if (year) {
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year + 1}-01-01`);
        businesses = businesses.filter(b => {
          const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
          return createdAt >= startDate && createdAt < endDate;
        });
      }
      
      totals = {
        total: businesses.length,
        pending: businesses.filter(b => isVerified(b.is_verified, 1)).length,
        approved: businesses.filter(b => isVerified(b.is_verified, 2)).length,
        rejected: businesses.filter(b => isVerified(b.is_verified, 3)).length,
      };
    }
    
    res.json({
      message: 'Dashboard data fetched successfully',
      data: {
        totalMSME: totals.total,
        totalMSMEApproved: totals.approved,
        totalMSMERejected: totals.rejected,
        totalMSMEPending: totals.pending,
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/', getDashboardData);
router.get('/data/:year', getDashboardData);

/**
 * GET /api/dashboard/msme_total/:year or /api/dashboard/msme_totals
 * MSME totals by verification status (Legacy backend compatible)
 */
async function getMsmeTotals(req: Request, res: Response) {
  try {
    const year = req.params.year ? parseInt(req.params.year) : null;
    
    // Get all businesses
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    // Filter by year if specified
    let businesses = allBusinesses.rows;
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year + 1}-01-01`);
      businesses = businesses.filter(b => {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        return createdAt >= startDate && createdAt < endDate;
      });
    }
    
    // Match legacy backend structure
    const totalMSME = businesses.length;
    const totalMSMEApproved = businesses.filter(b => isVerified(b.is_verified, 2)).length;
    const totalMSMERejected = businesses.filter(b => isVerified(b.is_verified, 3)).length;
    const totalMSMEPending = businesses.filter(b => isVerified(b.is_verified, 1)).length;
    const totalOwnerFemale = businesses.filter(b => (b as any).ownerType === 'Female').length;
    const totalOwnerMale = businesses.filter(b => (b as any).ownerType === 'Male').length;
    const totalDisabilityOwned = businesses.filter(b => (b as any).disability_owned === 'Yes').length;
    const totalMSMERagistered = businesses.filter(b => (b as any).business_type === 'Registered').length;
    const totalMSMEUnragistered = businesses.filter(b => (b as any).business_type === 'Unregistered').length;
    
    res.json({
      message: 'Dashboard MSME Total data fetched successfully',
      data: {
        totalMSME,
        totalMSMEApproved,
        totalMSMERejected,
        totalMSMEPending,
        totalOwnerFemale,
        totalOwnerMale,
        totalDisabilityOwned,
        totalMSMERagistered,
        totalMSMEUnragistered
      }
    });
  } catch (error) {
    console.error('Error getting MSME totals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/msme_totals', getMsmeTotals);
router.get('/msme_total/:year', getMsmeTotals);

/**
 * GET /api/dashboard/msme_directors_info/:year or /api/dashboard/directors_info
 * Director counts by age and gender (Legacy backend compatible)
 */
async function getDirectorsInfo(req: Request, res: Response) {
  try {
    const year = req.params.year ? parseInt(req.params.year) : null;
    
    // Get all approved businesses
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    // Filter for approved businesses
    let businesses = allBusinesses.rows.filter(b => isVerified(b.is_verified, 2));
    
    // Filter by year if specified
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year + 1}-01-01`);
      businesses = businesses.filter(b => {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        return createdAt >= startDate && createdAt < endDate;
      });
    }
    
    // Aggregate directors by querying subcollections
    let totalDirectors = 0;
    let totalMaleDirectors = 0;
    let totalFemaleDirectors = 0;
    let totalOtherDirectors = 0;
    let total18YearsOldDirectors = 0;
    let total25YearsOldDirectors = 0;
    let total40YearsOldDirectors = 0;
    
    const db = getFirestore();
    
    // Fetch all directors in parallel to avoid N+1 queries
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
        const director = doc.data();
        totalDirectors++;
        
        // Count by gender (handle both lowercase and capitalized)
        const gender = (director.gender || '').toLowerCase();
        if (gender === 'male') totalMaleDirectors++;
        else if (gender === 'female') totalFemaleDirectors++;
        else if (director.gender) totalOtherDirectors++;
        
        // Count by age (stored as string ranges in migration)
        const age = (director as any).age;
        if (age === '18-25') total18YearsOldDirectors++;
        else if (age === '25-40') total25YearsOldDirectors++;
        else if (age === '40+') total40YearsOldDirectors++;
      });
    });
    
    res.json({
      message: 'Dashboard MSME Directors data fetched successfully',
      data: {
        totalDirectors,
        totalMaleDirectors,
        totalFemaleDirectors,
        totalOtherDirectors,
        total18YearsOldDirectors,
        total25YearsOldDirectors,
        total40YearsOldDirectors,
      }
    });
  } catch (error) {
    console.error('Error getting directors info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/directors_info', getDirectorsInfo);
router.get('/msme_directors_info/:year', getDirectorsInfo);

/**
 * GET /api/dashboard/msme_requests/:year or /api/dashboard/monthly_requests
 * Registration requests by month
 */
async function getMonthlyRequests(req: Request, res: Response) {
  try {
    const yearParam = req.params.year;
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    
    // Get all businesses
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    // Filter by year (defaults to current year if not specified)
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year + 1}-01-01`);
    
    const businesses = allBusinesses.rows.filter(b => {
      const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
      return createdAt >= startDate && createdAt < endDate;
    });
    
    // Group by month
    const monthlyData = Array(12).fill(0);
    
    businesses.forEach(business => {
      const createdAt = business.createdAt?.toDate ? business.createdAt.toDate() : new Date(business.createdAt as any);
      const month = createdAt.getMonth();
      monthlyData[month]++;
    });
    
    // Return array with month numbers (1-12) and counts
    res.json({
      message: 'Dashboard Monthly Requests data fetched successfully',
      data: monthlyData.map((count, index) => ({
        month: index + 1,
        count: count,
      }))
    });
  } catch (error) {
    console.error('Error getting monthly requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/monthly_requests', getMonthlyRequests);
router.get('/msme_requests/:year', getMonthlyRequests);

/**
 * GET /api/dashboard/msme_according_to_turnover/:year or /api/dashboard/turnover
 * Business turnover breakdown
 */
async function getTurnoverData(req: Request, res: Response) {
  try {
    const year = req.params.year ? parseInt(req.params.year) : null;
    
    // Get all businesses
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    // Filter for approved businesses
    let businesses = allBusinesses.rows.filter(b => isVerified(b.is_verified, 2));
    
    // Filter by year if specified
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year + 1}-01-01`);
      businesses = businesses.filter(b => {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        return createdAt >= startDate && createdAt < endDate;
      });
    }
    
    // Count by turnover categories
    const totalMSMEMicro = businesses.filter(b => (b as any).turnover === 'micro').length;
    const totalMSMESmall = businesses.filter(b => (b as any).turnover === 'small').length;
    const totalMSMEMedium = businesses.filter(b => (b as any).turnover === 'medium').length;
    const totalMSME = businesses.length;
    
    res.json({
      message: 'Dashboard MSME Turnover data fetched successfully',
      data: {
        totalMSME,
        totalMSMESmall,
        totalMSMEMicro,
        totalMSMEMedium
      }
    });
  } catch (error) {
    console.error('Error getting turnover data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/turnover', getTurnoverData);
router.get('/msme_according_to_turnover/:year', getTurnoverData);

/**
 * GET /api/dashboard/msme_region_wise/:year or /api/dashboard/region_wise
 * Businesses by region
 */
async function getRegionWiseData(req: Request, res: Response) {
  try {
    const year = req.params.year ? parseInt(req.params.year) : null;
    
    // Get all businesses
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    // Filter for approved businesses
    let businesses = allBusinesses.rows.filter(b => isVerified(b.is_verified, 2));
    
    // Filter by year if specified
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year + 1}-01-01`);
      businesses = businesses.filter(b => {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        return createdAt >= startDate && createdAt < endDate;
      });
    }
    
    const regionGroups: Record<string, number> = {};
    
    businesses.forEach(business => {
      const region = business.region || 'Unknown';
      regionGroups[region] = (regionGroups[region] || 0) + 1;
    });
    
    res.json({
      message: 'Region-wise business distribution fetched successfully',
      data: Object.entries(regionGroups).map(([region, msme_count]) => ({
        region,
        msme_count,
      }))
    });
  } catch (error) {
    console.error('Error getting region data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/region_wise', getRegionWiseData);
router.get('/msme_region_wise/:year', getRegionWiseData);

/**
 * GET /api/dashboard/msme_list_according_to_category
 * Businesses by category
 */
router.get('/msme_list_according_to_category', async (req: Request, res: Response) => {
  try {
    // Get categories with counts
    const categoriesSnapshot = await db.collection(COLLECTIONS.BUSINESS_CATEGORIES)
      .where('deletedAt', '==', null)
      .get();
    
    // Get all businesses for counting
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const categoryData = categoriesSnapshot.docs.map((doc) => {
      const category = doc.data();
      const count = allBusinesses.rows.filter(b => 
        b.business_category_id === doc.id || b.business_category_id === parseInt(doc.id) as any
      ).length;
      
      return {
        id: doc.id,
        name: category.category_name || category.name,
        count,
      };
    });
    
    res.json({ data: categoryData.sort((a, b) => b.count - a.count) });
  } catch (error) {
    console.error('Error getting category data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/service_provider_list_according_to_category
 * Service providers by category
 */
router.get('/service_provider_list_according_to_category', async (req: Request, res: Response) => {
  try {
    // Get service provider categories
    const categoriesSnapshot = await db.collection(COLLECTIONS.SERVICE_PROVIDER_CATEGORIES)
      .where('deletedAt', '==', null)
      .get();
    
    // Get all service providers for counting
    const allProviders = await FirestoreRepo.list<ServiceProvider>(
      COLLECTIONS.SERVICE_PROVIDERS,
      { limit: 10000, offset: 0 }
    );
    
    const categoryData = categoriesSnapshot.docs.map((doc) => {
      const category = doc.data();
      const count = allProviders.rows.filter(p => 
        p.category_id === doc.id || p.category_id === parseInt(doc.id) as any
      ).length;
      
      return {
        id: doc.id,
        name: category.category_name || category.name,
        count,
      };
    });
    
    res.json({ data: categoryData.sort((a, b) => b.count - a.count) });
  } catch (error) {
    console.error('Error getting service provider category data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// ANALYTICS ROUTES
// =============================================================================

/**
 * GET /api/dashboard/analytics/gender-diversity
 * Gender diversity analysis
 */
router.get('/analytics/gender-diversity', async (req: Request, res: Response) => {
  try {
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const businesses = allBusinesses.rows.filter(b => isVerified(b.is_verified, 2));
    
    let maleOwned = 0;
    let femaleOwned = 0;
    let mixedOwnership = 0;
    let unknown = 0;
    
    businesses.forEach(business => {
      const summary = business.owner_gender_summary || '';
      
      if (!summary) {
        unknown++;
      } else if (summary.includes('M') && summary.includes('F')) {
        mixedOwnership++;
      } else if (summary.includes('M')) {
        maleOwned++;
      } else if (summary.includes('F')) {
        femaleOwned++;
      } else {
        unknown++;
      }
    });
    
    res.json({
      data: {
        maleOwned,
        femaleOwned,
        mixedOwnership,
        unknown,
        total: maleOwned + femaleOwned + mixedOwnership + unknown,
      }
    });
  } catch (error) {
    console.error('Error getting gender diversity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/growth-trends
 * Year-over-year growth
 */
router.get('/analytics/growth-trends', async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    
    // Get all businesses once
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const yearData = years.map(year => {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year + 1}-01-01`);
      
      const count = allBusinesses.rows.filter(b => {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        return createdAt >= startDate && createdAt < endDate;
      }).length;
      
      return {
        year,
        registrations: count,
      };
    });
    
    // Calculate growth rates
    const result = yearData.map((data, index) => {
      let growth = 0;
      if (index > 0 && yearData[index - 1].registrations > 0) {
        growth = ((data.registrations - yearData[index - 1].registrations) / 
                  yearData[index - 1].registrations) * 100;
      }
      return {
        ...data,
        growthRate: Math.round(growth * 10) / 10,
      };
    });
    
    res.json({ data: result });
  } catch (error) {
    console.error('Error getting growth trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/business-age-analysis
 */
router.get('/analytics/business-age-analysis', async (req: Request, res: Response) => {
  try {
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const businesses = allBusinesses.rows.filter(b => isVerified(b.is_verified, 2));
    const currentYear = new Date().getFullYear();
    
    const ageGroups: Record<string, number> = {
      'Less than 1 year': 0,
      '1-2 years': 0,
      '3-5 years': 0,
      '6-10 years': 0,
      'More than 10 years': 0,
    };
    
    businesses.forEach(business => {
      const estYear = parseInt((business as any).establishment_year || '0');
      if (!estYear) return;
      
      const age = currentYear - estYear;
      
      if (age < 1) ageGroups['Less than 1 year']++;
      else if (age <= 2) ageGroups['1-2 years']++;
      else if (age <= 5) ageGroups['3-5 years']++;
      else if (age <= 10) ageGroups['6-10 years']++;
      else ageGroups['More than 10 years']++;
    });
    
    res.json({
      data: Object.entries(ageGroups).map(([range, count]) => ({ range, count }))
    });
  } catch (error) {
    console.error('Error getting business age analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/category-performance
 */
router.get('/analytics/category-performance', async (req: Request, res: Response) => {
  try {
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const categoryPerformance: Record<string, { total: number; approved: number }> = {};
    
    allBusinesses.rows.forEach(business => {
      const catName = (business as any).business_category_name || 'Unknown';
      
      if (!categoryPerformance[catName]) {
        categoryPerformance[catName] = { total: 0, approved: 0 };
      }
      
      categoryPerformance[catName].total++;
      if (isVerified(business.is_verified, 2)) {
        categoryPerformance[catName].approved++;
      }
    });
    
    res.json({
      data: Object.entries(categoryPerformance)
        .map(([category, stats]) => ({
          category,
          total: stats.total,
          approved: stats.approved,
          approvalRate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)
    });
  } catch (error) {
    console.error('Error getting category performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/geographic-analysis
 */
router.get('/analytics/geographic-analysis', async (req: Request, res: Response) => {
  try {
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const businesses = allBusinesses.rows.filter(b => isVerified(b.is_verified, 2));
    
    const regionData: Record<string, number> = {};
    const townData: Record<string, number> = {};
    
    businesses.forEach(business => {
      const region = business.region || 'Unknown';
      const town = (business as any).town || 'Unknown';
      
      regionData[region] = (regionData[region] || 0) + 1;
      townData[town] = (townData[town] || 0) + 1;
    });
    
    res.json({
      data: {
        regions: Object.entries(regionData)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        towns: Object.entries(townData)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20), // Top 20 towns
      }
    });
  } catch (error) {
    console.error('Error getting geographic analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/employee-distribution
 */
router.get('/analytics/employee-distribution', async (req: Request, res: Response) => {
  try {
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const businesses = allBusinesses.rows.filter(b => isVerified(b.is_verified, 2));
    
    const sizeGroups: Record<string, number> = {
      '0-5': 0,
      '6-10': 0,
      '11-50': 0,
      '51-100': 0,
      '100+': 0,
    };
    
    businesses.forEach(business => {
      const employees = parseInt((business as any).employees || '0');
      
      if (employees <= 5) sizeGroups['0-5']++;
      else if (employees <= 10) sizeGroups['6-10']++;
      else if (employees <= 50) sizeGroups['11-50']++;
      else if (employees <= 100) sizeGroups['51-100']++;
      else sizeGroups['100+']++;
    });
    
    res.json({
      data: Object.entries(sizeGroups).map(([range, count]) => ({ range, count }))
    });
  } catch (error) {
    console.error('Error getting employee distribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/approval-funnel/:year
 */
router.get('/analytics/approval-funnel/:year', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year) || new Date().getFullYear();
    
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year + 1}-01-01`);
    
    const businesses = allBusinesses.rows.filter(b => {
      const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
      return createdAt >= startDate && createdAt < endDate;
    });
    
    res.json({
      data: {
        submitted: businesses.length,
        pending: businesses.filter(b => isVerified(b.is_verified, 1)).length,
        approved: businesses.filter(b => isVerified(b.is_verified, 2)).length,
        rejected: businesses.filter(b => isVerified(b.is_verified, 3)).length,
      }
    });
  } catch (error) {
    console.error('Error getting approval funnel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/engagement-metrics/:year
 */
router.get('/analytics/engagement-metrics/:year', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year) || new Date().getFullYear();
    
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year + 1}-01-01`);
    
    const businesses = allBusinesses.rows.filter(b => {
      const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
      return createdAt >= startDate && createdAt < endDate;
    });
    
    res.json({
      data: {
        registrations: businesses.length,
        profilesCompleted: businesses.filter(b => 
          (b as any).business_image_url || (b as any).business_profile_url
        ).length,
        verificationRate: businesses.length > 0 
          ? Math.round((businesses.filter(b => isVerified(b.is_verified, 2)).length / businesses.length) * 100)
          : 0,
      }
    });
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/year-over-year
 */
router.get('/analytics/year-over-year', async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const yearlyData = [];
    
    for (let year = currentYear - 4; year <= currentYear; year++) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year + 1}-01-01`);
      
      const count = allBusinesses.rows.filter(b => {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        return createdAt >= startDate && createdAt < endDate;
      }).length;
      
      yearlyData.push({ year, count });
    }
    
    res.json({ data: yearlyData });
  } catch (error) {
    console.error('Error getting year over year data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/time-comparison/:period
 */
router.get('/analytics/time-comparison/:period', async (req: Request, res: Response) => {
  try {
    const period = req.params.period; // 'week', 'month', 'quarter', 'year'
    const now = new Date();
    
    let currentStart: Date, previousStart: Date, previousEnd: Date;
    
    switch (period) {
      case 'week':
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
        break;
      case 'quarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getFullYear(), Math.floor(previousEnd.getMonth() / 3) * 3, 1);
        break;
      }
      default: // year
        currentStart = new Date(now.getFullYear(), 0, 1);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getFullYear(), 0, 1);
    }
    
    const allBusinesses = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      { limit: 10000, offset: 0 }
    );
    
    const currentPeriod = allBusinesses.rows.filter(b => {
      const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
      return createdAt >= currentStart && createdAt <= now;
    }).length;
    
    const previousPeriod = allBusinesses.rows.filter(b => {
      const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
      return createdAt >= previousStart && createdAt <= previousEnd;
    }).length;
    
    const change = previousPeriod > 0 
      ? Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100) 
      : (currentPeriod > 0 ? 100 : 0);
    
    res.json({
      data: {
        currentPeriod,
        previousPeriod,
        change,
        period,
      }
    });
  } catch (error) {
    console.error('Error getting time comparison:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/analytics/service-providers
 */
router.get('/analytics/service-providers', async (req: Request, res: Response) => {
  try {
    const allProviders = await FirestoreRepo.list<ServiceProvider>(
      COLLECTIONS.SERVICE_PROVIDERS,
      { limit: 10000, offset: 0 }
    );
    
    const categoryData: Record<string, number> = {};
    
    allProviders.rows.forEach(provider => {
      const category = (provider as any).category_name || 'Unknown';
      categoryData[category] = (categoryData[category] || 0) + 1;
    });
    
    res.json({
      data: {
        total: allProviders.rows.length,
        byCategory: Object.entries(categoryData)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      }
    });
  } catch (error) {
    console.error('Error getting service provider analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
