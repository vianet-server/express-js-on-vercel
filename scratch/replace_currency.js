const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('formatIndianCurrency')) {
    content = content.replace(
      "import { api } from '@/lib/api';",
      "import { api } from '@/lib/api';\nimport { formatIndianCurrency } from '@/lib/utils';"
    );
  }

  // Handle simple cases: ₹{variable.amount.toLocaleString()} -> {formatIndianCurrency(variable.amount)}
  content = content.replace(/₹\{([a-zA-Z0-9_.]+)\.amount\.toLocaleString\(\)\}/g, "{formatIndianCurrency($1.amount)}");
  content = content.replace(/₹\{([a-zA-Z0-9_.]+)\.toLocaleString\(\)\}/g, "{formatIndianCurrency($1)}");
  
  // Handle complex cases like ₹{(...reduce...).toLocaleString()} 
  // We can just find `.toLocaleString()` and replace it, but we need to match the outer `₹{...}` 
  // A simpler way: Replace `₹{` with `{formatIndianCurrency(` and `.toLocaleString()}` with `)}` 
  // Only for lines that have .toLocaleString()
  
  content = content.replace(/₹\{Math\.abs\(([^)]+)\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency($1)}");
  
  // Custom replaces for specific lines seen in grep output:
  content = content.replace(/₹\{\(item\.subs \?\? \[\]\)\.reduce\(\(s: number, s2: any\) => s \+ s2\.amount, 0\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency((item.subs ?? []).reduce((s: number, s2: any) => s + s2.amount, 0))}");
  content = content.replace(/₹\{data\.filter\(\(i: any\) => i\.date <= date\)\.reduce\(\(s: number, i: any\) => s \+ i\.amount, 0\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency(data.filter((i: any) => i.date <= date).reduce((s: number, i: any) => s + i.amount, 0))}");
  
  content = content.replace(/₹\$\{row\.amount\.toLocaleString\(\)\}/g, "${formatIndianCurrency(row.amount)}");
  
  // In datewise:
  content = content.replace(/₹\{item\.date <= date \? item\.amount\.toLocaleString\(\) : '-'\}/g, "{item.date <= date ? formatIndianCurrency(item.amount) : '-'}");
  
  fs.writeFileSync(filePath, content, 'utf8');
}

processFile(path.join(__dirname, '../vianet/src/adminPages/pnl.tsx'));
