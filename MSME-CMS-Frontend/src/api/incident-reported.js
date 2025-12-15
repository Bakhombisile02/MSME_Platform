import instance from "../utils/axios";

// Get list of Reported Incidents
const getReportedIncidentsList = async (page , limit ) => {
  try {
    const response = await instance.get(
      `report-incident/list?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Reported Incidents:", error);
    throw error;
  }
};

export { getReportedIncidentsList };
