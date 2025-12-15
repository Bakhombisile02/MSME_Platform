import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportServiceProviderToExcel = (data) => {
  console.log(data);
  if (!Array.isArray(data)) {
    console.error("Invalid or missing data structure");
    return;
  }

  const rows = data.map((item, index) => ({
    "S.No": index + 1,
    "Name": item.name || "",
    "Email": item.email || "",
    "Mobile No.": item.mobile || "",
    "Business Name": item.business_name || "",
    "Category Name": item.categorie_name || "",
    "Business Description": item.business_description || "",
    "Address": item.address || "",
    "Created At": item.createdAt || "",
    "Updated At": item.updatedAt || "",
    "Deleted At": item.deletedAt || "null",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ExportedData");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "Service_Provider.xlsx");
};
