const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../vianet/src/adminPages/pnl.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add month formatter
if (!content.includes('formatMonth')) {
  content = content.replace(
    "function DetailSection",
    "function formatMonth(yyyyMm: string) {\n  if (!yyyyMm) return '';\n  const [y, m] = yyyyMm.split('-');\n  const date = new Date(parseInt(y), parseInt(m) - 1);\n  return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });\n}\n\nfunction DetailSection"
  );
}

// Format the month headers in MoM
content = content.replace(
  /\{m\.month\}/g,
  "{formatMonth(m.month)}"
);

// Make Month-over-Month table headers sticky
// Change div to have max height for scrolling
content = content.replace(
  /<div className="overflow-x-auto">/g,
  '<div className="overflow-auto max-h-[600px] border rounded-md">'
);

content = content.replace(
  /<th className="pb-2\.5 pr-4 font-medium whitespace-nowrap sticky left-0 bg-background">Category<\/th>/,
  '<th className="pb-2.5 pr-4 pl-4 font-medium whitespace-nowrap sticky left-0 top-0 z-30 bg-background border-b shadow-sm">Category</th>'
);

content = content.replace(
  /<th key=\{m\.month\} className="pb-2\.5 px-3 font-medium text-right whitespace-nowrap">\{formatMonth\(m\.month\)\}<\/th>/g,
  '<th key={m.month} className="pb-2.5 px-3 font-medium text-right whitespace-nowrap sticky top-0 z-20 bg-background border-b shadow-sm">{formatMonth(m.month)}</th>'
);

// We need to fix the "Total" or category rows z-index so they slide under the sticky header
content = content.replace(/sticky left-0 bg-background/g, "sticky left-0 bg-background z-10");
content = content.replace(/sticky left-0/g, "sticky left-0 z-10");

// The incomes/expenses headers row
content = content.replace(
  /<td colSpan=\{monthlyData\.length \+ 1\} className="py-2 px-2 font-semibold text-green-700 sticky left-0 z-10">Income<\/td>/,
  '<td colSpan={monthlyData.length + 1} className="py-2 px-2 pl-4 font-semibold text-green-700 sticky left-0 z-10">Income</td>'
);

content = content.replace(
  /<td colSpan=\{monthlyData\.length \+ 1\} className="py-2 px-2 font-semibold text-red-700 sticky left-0 z-10 border-t">Expenses<\/td>/,
  '<td colSpan={monthlyData.length + 1} className="py-2 px-2 pl-4 font-semibold text-red-700 sticky left-0 z-10 border-t">Expenses</td>'
);


fs.writeFileSync(filePath, content, 'utf8');
