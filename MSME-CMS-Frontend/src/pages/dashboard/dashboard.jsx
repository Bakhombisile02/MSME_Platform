import DashboardHighlights from "../../components/dashboard/dashboard-highlights";

const Dashboard = () => {
  return (
    <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">Pages / <span className="text-gray-700">MSME Dashboard</span></div>
      <h1 className="text-2xl font-semibold text-gray-400 mb-6">MSME Dashboard</h1>

      {/* MSME Dashboard Component */}
      <DashboardHighlights />
    </div>
  );
};

export default Dashboard;
