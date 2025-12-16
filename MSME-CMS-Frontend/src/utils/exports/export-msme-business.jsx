import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

export const exportMSMEBusinessReportExcel = (data) => {
  // Check if data has the expected structure
  if (!Array.isArray(data)) {
    console.error("Invalid or missing data structure");
    return;
  }

  const rows = data.map((item, index) => ({
    "S.No": index + 1,
    "Organization Name": item.name_of_organization || "",
    "Business Description": item.brief_company_description || "",
    "Business Category": item.business_category_name || "",
    "Services Offered": item.service_offered || "",
    "Products Offered": item.product_offered || "",
    "Business Type": item.business_type || "",
    "Disability Owned": item.disability_owned || "",
    "Turnover": item.turnover || "",
    "Established Year": item.establishment_year || "",
    "Number of Employees": item.employees || "",
    "Contact Number": item.contact_number || "",
    "Email": item.email_address || "",
    "Address": `${item.street_address || ""}, ${item.town || ""}, ${item.region || ""}`,
    "Primary Contact Name": item.primary_contact_name || "",
    "Primary Contact Number": item.primary_contact_number || "",
    "Primary Contact Email": item.primary_contact_email || "",
    "Verification Status": 
      item.is_verified === "1" ? "Verified" : 
      item.is_verified === "2" ? "Rejected" : 
      item.is_verified === "3" ? "Pending" : "Unknown",
    "Latitude": item.lat || "",
    "Longitude": item.longe || "",
    "Created At": item.createdAt || "",
    "Updated At": item.updatedAt || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MSME Business Report");

  // Auto-size columns
  const wscols = [
    {wch: 5},   // S.No
    {wch: 25},  // Organization Name
    {wch: 40},  // Business Description
    {wch: 15},  // Business Category
    {wch: 30},  // Services Offered
    {wch: 30},  // Products Offered
    {wch: 15},  // Business Type
    {wch: 15},  // Disability Owned
    {wch: 15},  // Turnover
    {wch: 15},  // Established Year
    {wch: 10},  // Number of Employees
    {wch: 15},  // Contact Number
    {wch: 25},  // Email
    {wch: 40},  // Address
    {wch: 20},  // Primary Contact Name
    {wch: 20},  // Primary Contact Number
    {wch: 25},  // Primary Contact Email
    {wch: 15},  // Verification Status
    {wch: 12},  // Latitude
    {wch: 12},  // Longitude
    {wch: 20},  // Created At
    {wch: 20}   // Updated At
  ];
  worksheet['!cols'] = wscols;

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "MSME_Business_Report.xlsx");
};