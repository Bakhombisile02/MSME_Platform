import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut, Pie } from "react-chartjs-2";
import { useEffect, useState } from "react";
import {
  getGrowthTrends,
  getBusinessAgeAnalysis,
  getCategoryPerformance,
  getGeographicAnalysis,
  getApprovalFunnel,
  getEngagementMetrics,
  getYearOverYearComparison,
  getFlexibleTimeComparison,
  getGenderDiversityMetrics,
  getServiceProviderAnalytics,
} from "../../api/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const AdvancedAnalytics = ({ selectedYear }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [comparisonPeriod, setComparisonPeriod] = useState('monthly');
  const [growthTrendsData, setGrowthTrendsData] = useState({ labels: [], datasets: [] });
  const [businessAgeData, setBusinessAgeData] = useState({ labels: [], datasets: [] });
  const [categoryPerfData, setCategoryPerfData] = useState({ labels: [], datasets: [] });
  const [geoAnalysisData, setGeoAnalysisData] = useState({ labels: [], datasets: [] });
  const [approvalFunnelData, setApprovalFunnelData] = useState({ labels: [], datasets: [] });
  const [engagementData, setEngagementData] = useState({ labels: [], datasets: [] });
  const [timeComparisonData, setTimeComparisonData] = useState({ labels: [], datasets: [] });
  const [genderDiversityData, setGenderDiversityData] = useState({ labels: [], datasets: [] });
  const [serviceProviderData, setServiceProviderData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [selectedYear, comparisonPeriod]);

  const fetchAdvancedAnalytics = async () => {
    setIsLoading(true);
    try {
      const apiYear = selectedYear === 'All' ? 'All' : Number(selectedYear);
      
      const [
        growthTrends,
        businessAge,
        categoryPerf,
        geoAnalysis,
        approvalFunnel,
        engagement,
        yoyComparison,
        timeComparison,
        genderDiversity,
        serviceProvider
      ] = await Promise.all([
        getGrowthTrends(),
        getBusinessAgeAnalysis(),
        getCategoryPerformance(),
        getGeographicAnalysis(),
        getApprovalFunnel(apiYear),
        getEngagementMetrics(apiYear),
        getYearOverYearComparison(),
        getFlexibleTimeComparison(comparisonPeriod),
        getGenderDiversityMetrics(),
        getServiceProviderAnalytics(),
      ]);

      // Process Growth Trends
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const growthLabels = growthTrends.data && growthTrends.data.length > 0 
        ? growthTrends.data.map(d => `${months[d.month - 1]} ${d.year}`)
        : [];
      
      setGrowthTrendsData({
        labels: growthLabels,
        datasets: growthTrends.data && growthTrends.data.length > 0 ? [
          {
            label: "Total Registrations",
            data: growthTrends.data.map(d => d.count),
            borderColor: "#60A5FA",
            backgroundColor: "rgba(96, 165, 250, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Approved",
            data: growthTrends.data.map(d => d.approved),
            borderColor: "#34D399",
            backgroundColor: "rgba(52, 211, 153, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Growth Rate %",
            data: growthTrends.data.map(d => d.growth_rate),
            borderColor: "#FBBF24",
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
          }
        ] : []
      });

      // Process Business Age Analysis
      if (businessAge.data && businessAge.data.length > 0) {
        setBusinessAgeData({
          labels: businessAge.data.map(d => d.age_group),
          datasets: [{
            label: "Number of Businesses",
            data: businessAge.data.map(d => d.count),
            backgroundColor: [
              '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6'
            ],
            borderRadius: 5,
          }]
        });
      }

      // Process Category Performance
      if (categoryPerf.data && categoryPerf.data.length > 0) {
        const topCategories = categoryPerf.data.slice(0, 10);
        setCategoryPerfData({
          labels: topCategories.map(d => d.business_category_name || 'Unknown'),
          datasets: [
            {
              label: "Total MSMEs",
              data: topCategories.map(d => d.total_count),
              backgroundColor: '#60A5FA',
              borderRadius: 5,
            },
            {
              label: "Approved",
              data: topCategories.map(d => d.approved_count),
              backgroundColor: '#34D399',
              borderRadius: 5,
            },
            {
              label: "Female Owned",
              data: topCategories.map(d => d.female_owned),
              backgroundColor: '#F472B6',
              borderRadius: 5,
            }
          ]
        });
      }

      // Process Geographic Analysis
      if (geoAnalysis.data && geoAnalysis.data.length > 0) {
        const regionData = {};
        geoAnalysis.data.forEach(item => {
          if (!regionData[item.region]) {
            regionData[item.region] = { rural: 0, urban: 0, unknown: 0 };
          }
          const classification = item.rural_urban_classification?.toLowerCase();
          if (classification === 'rural') regionData[item.region].rural = item.count;
          else if (classification === 'urban') regionData[item.region].urban = item.count;
          else regionData[item.region].unknown = item.count;
        });

        setGeoAnalysisData({
          labels: Object.keys(regionData),
          datasets: [
            {
              label: "Rural",
              data: Object.values(regionData).map(d => d.rural),
              backgroundColor: '#60A5FA',
              borderRadius: 5,
            },
            {
              label: "Urban",
              data: Object.values(regionData).map(d => d.urban),
              backgroundColor: '#34D399',
              borderRadius: 5,
            },
            {
              label: "Unknown",
              data: Object.values(regionData).map(d => d.unknown),
              backgroundColor: '#FBBF24',
              borderRadius: 5,
            }
          ]
        });
      }

      // Process Approval Funnel
      if (approvalFunnel.data && approvalFunnel.data.length > 0) {
        const funnelLabels = approvalFunnel.data.map(d => `${months[d.month - 1]} ${d.year}`);

        setApprovalFunnelData({
          labels: funnelLabels,
          datasets: [
            {
              label: "Approval Rate %",
              data: approvalFunnel.data.map(d => parseFloat(d.approval_rate)),
              borderColor: "#34D399",
              backgroundColor: "rgba(52, 211, 153, 0.2)",
              fill: true,
              tension: 0.4,
            },
            {
              label: "Rejection Rate %",
              data: approvalFunnel.data.map(d => parseFloat(d.rejection_rate)),
              borderColor: "#F87171",
              backgroundColor: "rgba(248, 113, 113, 0.2)",
              fill: true,
              tension: 0.4,
            },
            {
              label: "Avg Processing Days",
              data: approvalFunnel.data.map(d => parseFloat(d.avg_processing_days)),
              borderColor: "#FBBF24",
              backgroundColor: "rgba(251, 191, 36, 0.2)",
              fill: false,
              tension: 0.4,
              yAxisID: 'y1',
            }
          ]
        });
      }

      // Process Engagement Metrics
      if (engagement.data && engagement.data.contacts && engagement.data.subscriptions) {
        const engagementMonths = engagement.data.contacts.length > 0 
          ? engagement.data.contacts.map(d => `${months[d.month - 1]} ${d.year}`)
          : [];
        
        setEngagementData({
          labels: engagementMonths,
          datasets: [
            {
              label: "Contact Us",
              data: engagement.data.contacts.map(d => d.count),
              borderColor: "#60A5FA",
              backgroundColor: "rgba(96, 165, 250, 0.2)",
              tension: 0.4,
            },
            {
              label: "Subscriptions",
              data: engagement.data.subscriptions.map(d => d.count),
              borderColor: "#34D399",
              backgroundColor: "rgba(52, 211, 153, 0.2)",
              tension: 0.4,
            }
          ]
        });
      }

      // Process Flexible Time Comparison - NEW!
      if (timeComparison.data && timeComparison.data.length > 0) {
        setTimeComparisonData({
          labels: timeComparison.data.map(d => d.label),
          datasets: [
            {
              label: "Total MSMEs",
              data: timeComparison.data.map(d => d.total_msme),
              backgroundColor: '#60A5FA',
              borderRadius: 5,
            },
            {
              label: "Approved",
              data: timeComparison.data.map(d => d.approved),
              backgroundColor: '#34D399',
              borderRadius: 5,
            },
            {
              label: "Female Owned",
              data: timeComparison.data.map(d => d.female_owned),
              backgroundColor: '#F472B6',
              borderRadius: 5,
            }
          ]
        });
      } else {
        // Fallback when backend route is not available (404)
        if (comparisonPeriod === "yearly" || comparisonPeriod === "all") {
          const items = (yoyComparison?.data || []).map(d => ({
            label: String(d.year),
            total_msme: d.total_msme,
            approved: d.approved,
            female_owned: d.female_owned
          }));
          setTimeComparisonData({
            labels: items.map(i => i.label),
            datasets: [
              { label: "Total MSMEs", data: items.map(i => i.total_msme), backgroundColor: "#60A5FA", borderRadius: 5 },
              { label: "Approved", data: items.map(i => i.approved), backgroundColor: "#34D399", borderRadius: 5 },
              { label: "Female Owned", data: items.map(i => i.female_owned), backgroundColor: "#F472B6", borderRadius: 5 },
            ]
          });
        } else {
          // monthly / 6months / weekly fallback built from Growth Trends
          const series = (growthTrends?.data || []).slice(- (comparisonPeriod === "6months" ? 6 : 12));
          const labels = series.map(d => `${months[d.month - 1]} ${d.year}`);
          setTimeComparisonData({
            labels,
            datasets: [
              { label: "Total MSMEs", data: series.map(d => d.count), backgroundColor: "#60A5FA", borderRadius: 5 },
              { label: "Approved", data: series.map(d => d.approved), backgroundColor: "#34D399", borderRadius: 5 },
            ]
          });
        }
      }

      // Process Gender Diversity
      if (genderDiversity.data && genderDiversity.data.ownership && genderDiversity.data.ownership.length > 0) {
        const genderOwnershipData = {};
        genderDiversity.data.ownership.forEach(item => {
          if (!genderOwnershipData[item.ownerType]) {
            genderOwnershipData[item.ownerType] = 0;
          }
          genderOwnershipData[item.ownerType] += item.count;
        });

        setGenderDiversityData({
          labels: Object.keys(genderOwnershipData),
          datasets: [{
            data: Object.values(genderOwnershipData),
            backgroundColor: ['#60A5FA', '#F472B6', '#FBBF24', '#34D399'],
          }]
        });
      }

      // Process Service Provider Analytics
      if (serviceProvider.data && serviceProvider.data.category_distribution && serviceProvider.data.category_distribution.length > 0) {
        const spCategories = serviceProvider.data.category_distribution.filter(d => d.categorie_name && d.count > 0);
        
        if (spCategories.length > 0) {
          setServiceProviderData({
            labels: spCategories.map(d => d.categorie_name || 'Unknown'),
            datasets: [{
              label: "Service Providers",
              data: spCategories.map(d => d.count),
              backgroundColor: [
                '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#818CF8', '#ACF05A', '#FB923C', '#EC4899'
              ],
              borderWidth: 2,
              borderColor: '#fff',
            }]
          });
        }
      }

    } catch (err) {
      console.error("Error loading advanced analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = (data) => {
    return data.labels && data.labels.length > 0 && data.datasets && data.datasets.length > 0;
  };

  const EmptyState = ({ message = "No data available" }) => (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs mt-1">Data will appear once entries are registered</p>
    </div>
  );

  const getPeriodLabel = () => {
    const labels = {
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      '6months': '6 Month',
      'yearly': 'Yearly',
      'all': 'All Time'
    };
    return labels[comparisonPeriod] || 'Time Period';
  };

  const getPeriodDescription = () => {
    const descriptions = {
      'weekly': 'Compare MSME metrics across the last 12 weeks',
      'monthly': 'Compare MSME metrics across the last 12 months',
      '6months': 'Compare MSME metrics across the last 6 months',
      'yearly': 'Compare MSME metrics across the last 3 years',
      'all': 'Compare MSME metrics across all available years'
    };
    return descriptions[comparisonPeriod] || 'Compare MSME metrics over time';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-xl font-semibold text-gray-700">Advanced Analytics & Insights</h2>
      
      {/* Growth Trends */}
      <ChartCard title="MSME Registration Growth Trends (12 Months)" description="Track registration growth over time with approval rates and growth percentages">
        {hasData(growthTrendsData) ? (
          <Line
            data={growthTrendsData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.parsed.y !== null) {
                        label += context.dataset.label?.includes('Rate') || context.dataset.label?.includes('Growth') 
                          ? context.parsed.y.toFixed(1) + '%'
                          : context.parsed.y.toLocaleString();
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  beginAtZero: true,
                  ticks: { precision: 0 }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  beginAtZero: true,
                  grid: { drawOnChartArea: false },
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <EmptyState message="No registration growth data available" />
        )}
      </ChartCard>

      {/* Time Period Comparison with Dropdown */}
      <ChartCard 
        title={`${getPeriodLabel()} Comparison`}
        description={getPeriodDescription()}
        extra={
          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-xs font-medium text-gray-600">View by:</label>
            <select
              id="period-select"
              value={comparisonPeriod}
              onChange={(e) => setComparisonPeriod(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="weekly">Weekly (Last 12 weeks)</option>
              <option value="monthly">Monthly (Last 12 months)</option>
              <option value="6months">6 Months (Last 6 months)</option>
              <option value="yearly">Yearly (Last 3 years)</option>
              <option value="all">All Data (By year)</option>
            </select>
          </div>
        }
      >
        {hasData(timeComparisonData) ? (
          <Bar
            data={timeComparisonData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { 
                    precision: 0,
                    callback: function(value) {
                      return value.toLocaleString();
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <EmptyState message={`No ${comparisonPeriod} comparison data available`} />
        )}
      </ChartCard>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Age Distribution */}
        <ChartCard title="Business Age Distribution" description="How long have MSMEs been operating?">
          {hasData(businessAgeData) ? (
            <Bar
              data={businessAgeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return 'Businesses: ' + context.parsed.y.toLocaleString();
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { 
                      precision: 0,
                      callback: function(value) {
                        return value.toLocaleString();
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <EmptyState message="No business age data available" />
          )}
        </ChartCard>

        {/* Gender Diversity */}
        <ChartCard title="Ownership Gender Distribution" description="Gender breakdown of business owners">
          {hasData(genderDiversityData) ? (
            <Doughnut
              data={genderDiversityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.parsed;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return context.label + ': ' + value.toLocaleString() + ' (' + percentage + '%)';
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <EmptyState message="No gender diversity data available" />
          )}
        </ChartCard>
      </div>

      {/* Category Performance */}
      <ChartCard title="Top 10 Category Performance" description="Which business categories are performing best?">
        {hasData(categoryPerfData) ? (
          <Bar
            data={categoryPerfData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { 
                    precision: 0,
                    callback: function(value) {
                      return value.toLocaleString();
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <EmptyState message="No category performance data available" />
        )}
      </ChartCard>

      {/* Geographic Analysis */}
      <ChartCard title="Geographic Distribution (Rural vs Urban)" description="MSME distribution across regions by classification">
        {hasData(geoAnalysisData) ? (
          <Bar
            data={geoAnalysisData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                    }
                  }
                }
              },
              scales: {
                x: { stacked: true },
                y: {
                  stacked: true,
                  beginAtZero: true,
                  ticks: { 
                    precision: 0,
                    callback: function(value) {
                      return value.toLocaleString();
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <EmptyState message="No geographic distribution data available" />
        )}
      </ChartCard>

      {/* Approval Funnel */}
      <ChartCard title="Approval Funnel & Processing Time" description="Track approval rates and processing efficiency">
        {hasData(approvalFunnelData) ? (
          <Line
            data={approvalFunnelData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.parsed.y !== null) {
                        if (label.includes('Days')) {
                          label += context.parsed.y.toFixed(1) + ' days';
                        } else {
                          label += context.parsed.y.toFixed(1) + '%';
                        }
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  beginAtZero: true,
                  grid: { drawOnChartArea: false },
                  ticks: {
                    callback: function(value) {
                      return value + ' days';
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <EmptyState message="No approval funnel data available" />
        )}
      </ChartCard>

      {/* Engagement Metrics */}
      <ChartCard title="User Engagement Trends" description="Track contact requests and subscriptions over time">
        {hasData(engagementData) ? (
          <Line
            data={engagementData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { 
                    precision: 0,
                    callback: function(value) {
                      return value.toLocaleString();
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <EmptyState message="No engagement data available" />
        )}
      </ChartCard>

      {/* Service Provider Analytics */}
      <ChartCard title="Service Provider Distribution by Category" description="Breakdown of available service providers">
        {hasData(serviceProviderData) ? (
          <Pie
            data={serviceProviderData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    font: { size: 11 },
                    padding: 10,
                    generateLabels: function(chart) {
                      const data = chart.data;
                      if (data.labels.length && data.datasets.length) {
                        return data.labels.map((label, i) => {
                          const value = data.datasets[0].data[i];
                          return {
                            text: `${label}: ${value}`,
                            fillStyle: data.datasets[0].backgroundColor[i],
                            hidden: false,
                            index: i
                          };
                        });
                      }
                      return [];
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const value = context.parsed;
                      const percentage = ((value / total) * 100).toFixed(1);
                      return context.label + ': ' + value + ' (' + percentage + '%)';
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <EmptyState message="No service provider data available" />
        )}
      </ChartCard>
    </div>
  );
};

const ChartCard = ({ title, description, children, extra }) => (
  <div className="bg-white p-6 shadow-xl shadow-black/15 rounded-lg">
    <div className="mb-4 flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      {extra && <div className="ml-4">{extra}</div>}
    </div>
    <div className="min-h-[350px]">{children}</div>
  </div>
);

export default AdvancedAnalytics;
