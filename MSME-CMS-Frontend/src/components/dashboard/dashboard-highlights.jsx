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
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { AiOutlineAlert } from "react-icons/ai";
import { IoBarChartOutline } from "react-icons/io5";
import { MdOutlineFeedback } from "react-icons/md";

import {
  getDashboardTotalStats,
  getMsmeTotalStats,
  getMsmeMonthlyRequests,
  getMsmeTurnoverStats,
  getMsmeRegionStats,
  getMsmeDirectorsInfoByAge,
} from "../../api/dashboard";

import AdvancedAnalytics from "./advanced-analytics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ArcElement,
  Tooltip,
  Legend
);

const DashboardHighlights = () => {
  const [selectedYear, setSelectedYear] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalMSME: 0,
    totalMSMEApproved: 0,
    totalMSMERejected: 0,
    totalMSMEPending: 0
  });

  const [msmeOverviewData, setMsmeOverviewData] = useState({
    labels: [],
    datasets: []
  });
  const [monthlyRequestsData, setMonthlyRequestsData] = useState({ labels: [], datasets: [] });
  const [turnoverData, setTurnoverData] = useState({ labels: [], datasets: [] });
  const [regionData, setRegionData] = useState({ labels: [], datasets: [] });
  const [msmeByAgeData, setMsmeByAgeData] = useState({ labels: [], datasets: [] });

  const fetchData = async (year) => {
    setIsLoading(true);
    try {
      const apiYear = year === 'All' ? 'All' : Number(year);
      
      const [totalStats, msmeStats, monthlyRequests, turnoverStats, regionStats, msmeDirectorsAge] = await Promise.all([
        getDashboardTotalStats(apiYear),
        getMsmeTotalStats(apiYear),
        getMsmeMonthlyRequests(apiYear),
        getMsmeTurnoverStats(apiYear),
        getMsmeRegionStats(apiYear),
        getMsmeDirectorsInfoByAge(apiYear),
      ]);

      // Update dashboard stats
      setDashboardStats(totalStats.data);

      // Process MSME Overview Data
      const overviewData = {
        labels: [
          'Registration Requests Received',
          'Approved MSMEs',
          'Rejected MSMEs',
          'Pending MSMEs',
          'Female Owned',
          'Male Owned',
          'PWD Owned',
          'Total MSME Registered',
          'Total MSME Unregistered'
        ],
        datasets: [{
          label: 'MSME Overview',
          data: [
            msmeStats.data.totalMSME,
            msmeStats.data.totalMSMEApproved,
            msmeStats.data.totalMSMERejected,
            msmeStats.data.totalMSMEPending,
            msmeStats.data.totalOwnerFemale,
            msmeStats.data.totalOwnerMale,
            msmeStats.data.totalDisabilityOwned,
            msmeStats.data.totalMSMERagistered,
            msmeStats.data.totalMSMEUnragistered
          ],
          backgroundColor: [
            '#60A5FA', // Total MSMEs
            '#34D399', // Approved
            '#F87171', // Rejected
            '#FBBF24', // Pending
            '#F472B6', // Female Owned
            '#818CF8', // Male Owned
            '#A78BFA',  // PWD Owned
            '#ACF05A', // Registered
            '#6C82A0'  // Unregistered
          ],
          borderRadius: 5,
        }]
      };

      setMsmeOverviewData(overviewData);

      // Process Monthly Requests Data
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const requestCounts = new Array(12).fill(0);
      
      if (monthlyRequests?.data && Array.isArray(monthlyRequests.data)) {
        monthlyRequests.data.forEach(item => {
          const index = item.month - 1;
          if (index >= 0 && index < 12) {
            requestCounts[index] = item.count || 0;
          }
        });
      }

      setMonthlyRequestsData({
        labels: months,
        datasets: [{
          label: "Registration Requests",
          data: requestCounts,
          backgroundColor: requestCounts.map((_, index) => 
            index % 2 === 0 ? '#60A5FA' : '#34D399'
          ),
          borderRadius: 5,
        }]
      });

      // Process Turnover Data
      setTurnoverData({
        labels: ['Micro', 'Small', 'Medium'],
        datasets: [{
          label: "MSME Size Distribution",
          data: [
            turnoverStats.data.totalMSMEMicro,
            turnoverStats.data.totalMSMESmall,
            turnoverStats.data.totalMSMEMedium
          ],
          backgroundColor: ['#60A5FA', '#34D399', '#FBBF24'],
          borderRadius: 5,
        }]
      });

      // Process Region Data
      const staticRegions = ['Hhohho', 'Lubombo', 'Manzini', 'Shiselweni'];
      const regionCounts = staticRegions.map(region => {
        const regionData = regionStats.data.find(item => item.region === region);
        return regionData ? regionData.msme_count : 0;
      });

      setRegionData({
        labels: staticRegions,
        datasets: [{
          label: "MSMEs by Region",
          data: regionCounts,
          backgroundColor: [
            '#60A5FA', // Hhohho
            '#34D399', // Lubombo
            '#FBBF24', // Manzini
            '#F87171'  // Shiselweni
          ],
          borderRadius: 5,
        }]
      });

      // Process MSME by Age Data
      const ageDataObj = msmeDirectorsAge.data || {};
      // Collect all relevant keys: age groups and total/male/female/other directors
      const allBarKeys = Object.keys(ageDataObj).filter(key =>
        key.toLowerCase().includes('year') ||
        key === 'totalDirectors' ||
        key === 'totalMaleDirectors' ||
        key === 'totalFemaleDirectors'||
        key === 'totalOtherDirectors'
      );
      const allBarLabels = allBarKeys.map(label => {
        if (label === 'totalDirectors') return 'Total Directors';
        if (label === 'totalMaleDirectors') return 'Total Male Directors';
        if (label === 'totalFemaleDirectors') return 'Total Female Directors';
        if (label === 'totalOtherDirectors') return 'Total Other Directors';
        if (label === 'total18YearsOldDirectors') return 'Aged 18-25';
        if (label === 'total25YearsOldDirectors') return 'Aged 25-40';
        if (label === 'total40YearsOldDirectors') return 'Aged 40+';
      });
      const allBarData = allBarKeys.map(label => ageDataObj[label] || 0);
      setMsmeByAgeData({
        labels: allBarLabels,
        datasets: [{
          label: 'Directors Information',
          data: allBarData,
          backgroundColor: allBarLabels.map((_, i) => [
            '#60A5FA', '#34D399', '#F87171', '#FBBF24', '#F472B6', '#818CF8', '#A78BFA', '#ACF05A', '#6C82A0', '#F59E42', '#A0AEC0', '#F472B6'
          ][i % 12]),
          borderRadius: 5,
        }],
      });

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      console.error("Error details:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedYear);
  }, [selectedYear]);

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setSelectedYear(newYear);
  };

  return (
    <section>
      {/* Year Selector and View Toggle */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 bg-primary-950 text-white rounded-md hover:bg-primary-800 transition-colors"
        >
          {showAdvanced ? '← Back to Overview' : '📊 View Advanced Analytics'}
        </button>
        
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="bg-white border border-gray-300 rounded-md px-4 py-2"
          disabled={isLoading}
        >
          <option value="All">All</option>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
        </div>
      ) : (
        <>
          {showAdvanced ? (
            <AdvancedAnalytics selectedYear={selectedYear} />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 m-auto md:grid-cols-4 gap-16 justify-center mb-6">
                <a href="/msme-business/0">
                  <StatCard
                    title="Registration Requests Received"
                    value={dashboardStats.totalMSME}
                    icon={<FaRegUser size={25} />}
                  />
                </a>
                <a href="/msme-business/2">
                  <StatCard
                    title="Approved MSMEs"
                    value={dashboardStats.totalMSMEApproved}
                    icon={<AiOutlineAlert size={25} />}
                  />
                </a>
                <a href="/msme-business/3">
                  <StatCard
                    title="Rejected MSMEs"
                    value={dashboardStats.totalMSMERejected}
                    icon={<IoBarChartOutline size={25} />}
                  />
                </a>
                <a href="/msme-business/1">
                  <StatCard
                    title="Pending MSMEs"
                    value={dashboardStats.totalMSMEPending}
                    icon={<MdOutlineFeedback size={25} />}
                  />
                </a>
              </div>

              {/* Charts */}
              <div className="flex flex-col py-8 gap-16">
                {/* MSME Overview Chart */}
                <ChartCard title="MSME Overview">
                  <Bar
                    data={msmeOverviewData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              return `${label}: ${value} MSMEs`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { precision: 0 }
                        }
                      }
                    }}
                  />
                </ChartCard>

                {/* Monthly Requests Chart */}
                <ChartCard title="Registration Requests (Monthly)">
                  <Bar
                    data={monthlyRequestsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { precision: 0 }
                        }
                      }
                    }}
                  />
                </ChartCard>

                {/* Region and Turnover Charts in a single row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Turnover Distribution Chart */}
                  <ChartCard title="MSME Size Distribution (Based on Turnover)">
                    <Doughnut
                      data={{
                        ...turnoverData,
                        labels: [
                          'Micro: 0 - 60,000 SZL',
                          'Small: 60,000 - 3,000,000 SZL',
                          'Medium: 3,000,000 - 8,000,000 SZL'
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              font: {
                                size: 12
                              },
                              padding: 20
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value} MSMEs`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </ChartCard>

                  {/* Region Distribution Chart */}
                  <ChartCard title="MSMEs by Region">
                    <Bar
                      data={regionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { precision: 0 }
                          }
                        }
                      }}
                    />
                  </ChartCard>
                </div>

                {/* MSME by Age Chart */}
                <ChartCard title="Directors Information">
                  <Bar
                    data={msmeByAgeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              return `${label}: ${value} Directors`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { precision: 0 }
                        }
                      }
                    }}
                  />
                </ChartCard>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="flex w-full h-full flex-col justify-between gap-5 p-4 text-gray-500 bg-white hover:text-white shadow-lg shadow-black/45 hover:shadow-black/25 hover:shadow-[inset_11px_27px_39px_9px_rgba(0,_0,_0,_0.1)] hover:bg-primary-950">
    <div className="text-md">{title}</div>
    <div className="flex w-full items-center gap-3 flex-row">
      <div className="text-2xl text-yellow-500">{icon}</div>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-5 shadow-xl shadow-black/15">
    <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
    <div className="min-h-[350px]">{children}</div>
  </div>
);

export default DashboardHighlights;
