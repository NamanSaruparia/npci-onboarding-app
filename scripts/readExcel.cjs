const XLSX = require("xlsx");
const wb = XLSX.readFile("C:/Users/Npci onboarding/Downloads/NPCI_Employee_Data.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
// Print all rows
data.forEach((row, i) => console.log(JSON.stringify(row)));
