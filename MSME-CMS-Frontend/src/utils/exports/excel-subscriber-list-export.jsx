import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

export const exportSubscriberListToExcel = (data) => {
  console.log(data);
  if (!Array.isArray(data)) {
    console.error("Invalid or missing data structure");
    return;
  }

  const rows = data.map((item, index) => ({
    "S.No": index + 1,
    "Email": item.email || "",
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

  saveAs(blob, "Subscribers_list.xlsx");
};
