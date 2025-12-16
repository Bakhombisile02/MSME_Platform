import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

export const exportServiceProviderCategoriesExcel = (data) => {
  // Check if data has the expected structure
  if (!Array.isArray(data)) {
    console.error("Invalid or missing data structure");
    return;
  }

  // Remove HTML tags from descriptions
  const cleanDescription = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
  };

  const rows = data.map((item, index) => ({
    "S.No": index + 1,
    "Category ID": item.id || "",
    "Category Name": item.name || "",
    "Description": cleanDescription(item.description),
    "Icon URL": item.icon_url || "",
    "Created At": item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    "Updated At": item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Service Categories");

  // Auto-size columns
  const wscols = [
    {wch: 5},   // S.No
    {wch: 10},  // Category ID
    {wch: 25},  // Category Name
    {wch: 60},  // Description
    {wch: 40},  // Icon URL
    {wch: 20},  // Created At
    {wch: 20},  // Updated At
    {wch: 10}   // Status
  ];
  worksheet['!cols'] = wscols;

  // Add header style
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4472C4" } }
  };
  
  if (!worksheet["!rows"]) worksheet["!rows"] = [];
  worksheet["!rows"][0] = { s: headerStyle };

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "Service_Provider_Categories.xlsx");
};