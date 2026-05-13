import * as XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const data = [
  // Employee ID, Entity, Name, Band, Mobile
  [21089, "NPCI", "S Md Raffi",                    "C2", 9502774847],
  [21372, "NPCI", "Satya Narayan Kanungo",          "C2", 8108108658],
  [21446, "NPCI", "Aseem Chaturvedi",               "C2", 8879772834],
  [21563, "NPCI", "Venkata Ravi Krishna Laddika",   "C2", 9177733099],
  [21849, "NPCI", "Deepak Mittal",                  "C2", 8879754954],
  [21886, "NPCI", "V Shekar Reddy",                 "C2", 9767075292],
  [21902, "NPCI", "Denny Thomas",                   "C2", 9930888362],
  [22090, "NPCI", "Hardik Dixit",                   "C2", 9920622860],
  [22454, "NPCI", "Umang Singh Chauhan",             "C2", 8291147439],
  [22633, "NPCI", "Priyanka Agrawal",               "C2", 9004100378],
  [22772, "NPCI", "Ipsita Sur",                     "C2", 9152085723],
  [22781, "NPCI", "Anu R Ramakrishnan",             "C2", 9223354035],
  [22810, "NPCI", "Sarang Vinayak Bhoyar",          "C2", 8888283622],
  [22946, "NPCI", "Sandeep Tiwari",                 "C2", 9999983500],
  [23361, "NPCI", "Sudeep Choudhari",               "C2", 9820507227],
  [23377, "NPCI", "Tiru Pratim Sarma",              "C2", 8879772733],
  [23768, "NPCI", "Nishant Gaurav",                 "C2", 7506446574],
  [24535, "NPCI", "Saurav Singla",                  "C2", 9958793952],
  [25200, "NPCI", "Neha Manoj Mayekar",             "C2", 9820663987],
  [25305, "NPCI", "Vilas Sitaram Golatkar",         "C2", 8879641391],
  [25316, "NPCI", "Ankita Hemal Ghelani",           "C2", 9833284834],
  [25318, "NPCI", "Amol Kotkar",                    "C2", 7506530058],
  [25831, "NPCI", "Suparna Bhandari",               "C2", 9619096297],
  [25916, "NPCI", "Viral Kekin Maru",               "C2", 9619053337],
  [25941, "NPCI", "Santa Safalya Patnaik",          "C2", 8884699488],
  [25972, "NPCI", "Divya Mohil",                    "C2", 9560149595],
  [26007, "NPCI", "Prashant Prashun Dutta",         "C2", 9320566388],
  [26030, "NPCI", "Trilok Ravindra Revankar",       "C2", 9969335419],
  [26101, "NPCI", "Samith R",                       "C2", 9833753065],
  [31035, "NIPL", "Kishan Srinivas",                "C2", 9962805279],
  [31093, "NIPL", "Gaurish K Korgaonkar",          "C2", 8879772784],
  [31098, "NIPL", "Vipul Arvind Vyas",              "C2", 9867989434],
  [41023, "NBBL", "V Sai Ganesh",                   "C2", 9840835999],
  [41179, "NBBL", "Chinmay Pol",                    "C2", 9752498882],
  [41222, "NBBL", "Shweta Dasgupta",                "C2", 9930528286],
  [41223, "NBBL", "Amit Tyagi",                     "C2", 9810897200],
  [41357, "NBBL", "Gururajan S",                    "C2", 9962000777],
  [51001, "NBSL", "Neelesh Gupta",                  "C2", 7506446579],
  [51006, "NBSL", "Nisha Swapnil Rodi",             "C2", 9167030994],
  ["",    "",     "Shekhar Sivaraman",              "C2", 9819903881],
  ["",    "",     "Rohit Vashudev Bhatia",          "C2", 9820458233],
];

const headers = ["Employee ID", "Entity", "Name", "Band", "Mobile"];

const worksheetData = [headers, ...data];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(worksheetData);

// Column widths
ws["!cols"] = [
  { wch: 14 },  // Employee ID
  { wch: 8 },   // Entity
  { wch: 36 },  // Name
  { wch: 8 },   // Band
  { wch: 14 },  // Mobile
];

// Bold header row
const range = XLSX.utils.decode_range(ws["!ref"]!);
for (let col = range.s.c; col <= range.e.c; col++) {
  const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
  if (!ws[cellAddr]) continue;
  ws[cellAddr].s = { font: { bold: true } };
}

XLSX.utils.book_append_sheet(wb, ws, "Employees");

const outPath = path.join(__dirname, "..", "Employee_Data.xlsx");
XLSX.writeFile(wb, outPath);
console.log(`Written to ${outPath}`);
