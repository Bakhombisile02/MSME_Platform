import instance from "../utils/axios";

const getDashboardTotalStats = async (year = new Date().getFullYear()) => {
  const endpoint = year === 'All' ? 'dashboard' : `dashboard/data/${year}`;
  const response = await instance.get(endpoint);
  return response.data;
};

const getMsmeTotalStats = async (year = new Date().getFullYear()) => {
  const endpoint = year === 'All' ? 'dashboard/msme_totals' : `dashboard/msme_total/${year}`;
  const response = await instance.get(endpoint);
  return response.data;
};

const getMsmeMonthlyRequests = async (year = new Date().getFullYear()) => {
  try {
    // When 'All' is selected, default to 2025 (where most data exists)
    // Otherwise use the specific year requested
    const requestYear = year === 'All' ? 2025 : year;
    const endpoint = `/dashboard/msme_requests/${requestYear}`;
    const response = await instance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching MSME monthly requests:", error);
    throw error;
  }
};

const getMsmeTurnoverStats = async (year) => {
  try {
    const endpoint = year === 'All' 
      ? '/dashboard/turnover'
      : `/dashboard/msme_according_to_turnover/${year}`;
    const response = await instance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching MSME turnover data:", error);
    throw error;
  }
};

const getMsmeRegionStats = async (year = new Date().getFullYear()) => {
  try {
    const endpoint = year === 'All'
      ? '/dashboard/region_wise'
      : `/dashboard/msme_region_wise/${year}`;
    const response = await instance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching MSME region data:", error);
    throw error;
  }
};

const getMsmeDirectorsInfoByAge = async (year = new Date().getFullYear()) => {
  try {
    const endpoint = year === 'All'
      ? '/dashboard/directors_info'
      : `/dashboard/msme_directors_info/${year}`;
    const response = await instance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching MSME Directors data:", error);
    throw error;
  }
};

// ============== ADVANCED ANALYTICS API FUNCTIONS ==============

const getGrowthTrends = async () => {
  try {
    const response = await instance.get('/dashboard/analytics/growth-trends');
    return response.data;
  } catch (error) {
    console.error("Error fetching growth trends:", error);
    throw error;
  }
};

const getBusinessAgeAnalysis = async () => {
  try {
    const response = await instance.get('/dashboard/analytics/business-age-analysis');
    return response.data;
  } catch (error) {
    console.error("Error fetching business age analysis:", error);
    throw error;
  }
};

const getCategoryPerformance = async () => {
  try {
    const response = await instance.get('/dashboard/analytics/category-performance');
    return response.data;
  } catch (error) {
    console.error("Error fetching category performance:", error);
    throw error;
  }
};

const getGeographicAnalysis = async () => {
  try {
    const response = await instance.get('/dashboard/analytics/geographic-analysis');
    return response.data;
  } catch (error) {
    console.error("Error fetching geographic analysis:", error);
    throw error;
  }
};

const getEmployeeDistribution = async () => {
  try {
    const response = await instance.get('/dashboard/analytics/employee-distribution');
    return response.data;
  } catch (error) {
    console.error("Error fetching employee distribution:", error);
    throw error;
  }
};

const getApprovalFunnel = async (year = 'All') => {
  try {
    const response = await instance.get(`/dashboard/analytics/approval-funnel/${year}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching approval funnel:", error);
    throw error;
  }
};

const getEngagementMetrics = async (year = 'All') => {
  try {
    const response = await instance.get(`/dashboard/analytics/engagement-metrics/${year}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching engagement metrics:", error);
    throw error;
  }
};

const getYearOverYearComparison = async () => {
  try {
    const response = await instance.get('/dashboard/analytics/year-over-year');
    return response.data;
  } catch (error) {
    console.error("Error fetching year-over-year comparison:", error);
    throw error;
  }
};

const getFlexibleTimeComparison = async (period = "monthly") => {
  try {
    // If we previously detected that the endpoint doesn't exist, skip the request
    if (typeof window !== 'undefined' && window.sessionStorage?.getItem('DISABLE_TIME_COMPARISON_API') === '1') {
      return { message: 'fallback: disabled, not calling server', period, data: [] };
    }
    const response = await instance.get(`/dashboard/analytics/time-comparison/${period}`);
    return response.data;
  } catch (error) {
    // Graceful fallback so the page does not break if API is not deployed yet
    if (error?.response?.status === 404) {
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem('DISABLE_TIME_COMPARISON_API', '1');
      }
      return { message: 'fallback: endpoint not found', period, data: [] };
    }
    console.error("Error fetching time comparison:", error);
    return { message: 'fallback: error', period, data: [] };
  }
};

const getGenderDiversityMetrics = async () => {
  try {
    const response = await instance.get('/dashboard/analytics/gender-diversity');
    return response.data;
  } catch (error) {
    console.error("Error fetching gender diversity metrics:", error);
    throw error;
  }
};

const getServiceProviderAnalytics = async () => {
  try {
    const response = await instance.get('/dashboard/analytics/service-providers');
    return response.data;
  } catch (error) {
    console.error("Error fetching service provider analytics:", error);
    throw error;
  }
};

// Single export statement with all functions
export {
  getDashboardTotalStats,
  getMsmeTotalStats,
  getMsmeMonthlyRequests,
  getMsmeTurnoverStats,
  getMsmeRegionStats,
  getMsmeDirectorsInfoByAge,
  // Advanced analytics exports
  getGrowthTrends,
  getBusinessAgeAnalysis,
  getCategoryPerformance,
  getGeographicAnalysis,
  getEmployeeDistribution,
  getApprovalFunnel,
  getEngagementMetrics,
  getYearOverYearComparison,
  getFlexibleTimeComparison,
  getGenderDiversityMetrics,
  getServiceProviderAnalytics,
};
