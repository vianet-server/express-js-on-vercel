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

  content = content.replace(/₹\{([a-zA-Z0-9_.]+)\.toLocaleString\(\)\}/g, "{formatIndianCurrency($1)}");
  
  // Custom cases
  content = content.replace(/₹\{Math\.round\(data\.total \/ data\.count\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency(Math.round(data.total / data.count))}");
  content = content.replace(/₹\{\(t\.amount \?\? 0\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency(t.amount ?? 0)}");
  content = content.replace(/₹\{Math\.abs\(([^)]+)\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency($1)}");
  
  // Qty does NOT need currency format, it's just toLocaleString. 
  // Let's restore qty if affected, but it doesn't have ₹ in front so it won't be matched by the regex above!
  // Wait, let's check grep again.
  // Rate: `₹{rate.toLocaleString()}` -> will be matched by the first regex because of `₹`.
  
  fs.writeFileSync(filePath, content, 'utf8');
}

processFile(path.join(__dirname, '../vianet/src/adminPages/daybook.tsx'));
