const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../vianet/src/adminPages/dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('formatIndianCurrency')) {
  content = content.replace(
    "import { api } from '@/lib/api';",
    "import { api } from '@/lib/api';\nimport { formatIndianCurrency } from '@/lib/utils';"
  );
}

// Replace toLocaleString with formatIndianCurrency
content = content.replace(/₹\{\(stats\.todaySale \?\? 0\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency(stats.todaySale ?? 0)}");
content = content.replace(/₹\{\(stats\.totalProfit \?\? 0\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency(stats.totalProfit ?? 0)}");
content = content.replace(/₹\{\(stats\.totalSpend \?\? 0\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency(stats.totalSpend ?? 0)}");
content = content.replace(/₹\{\(s\.sales \?\? 0\)\.toLocaleString\(\)\}/g, "{formatIndianCurrency(s.sales ?? 0)}");

// Add Tabs for Executive, Sales, Inventory
content = content.replace(
  /<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">/,
  `<Tabs defaultValue="executive" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="sales">Sales & Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="executive" className="flex flex-col gap-6 mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">`
);

// Look for the end of the file correctly
const searchEnd = `        </Card>
      </div>
    </div>
  );
}`;

const replaceEnd = `        </Card>
      </div>
        </TabsContent>
        <TabsContent value="sales" className="flex flex-col gap-6 mt-0">
          <Card>
            <CardHeader><CardTitle>Sales Leaderboard & Trends</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">More detailed sales metrics, territory tracking, and target vs achievement will be populated here.</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="flex flex-col gap-6 mt-0">
          <Card>
            <CardHeader><CardTitle>Inventory Health & Ageing</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Detailed warehouse stock, fast/slow moving items, and reorder alerts will be populated here.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}`;

content = content.replace(searchEnd, replaceEnd);

fs.writeFileSync(filePath, content, 'utf8');
