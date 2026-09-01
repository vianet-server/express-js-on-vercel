const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../vianet/src/adminPages/dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// First, find the component signature to add our hooks.
// We'll replace the existing "const defaultStats =" with our hooks and a new default.

if (!content.includes('const { data: salesSemantic }')) {
  // We need to inject the semantic queries inside the component.
  // The component starts with:
  // export default function AdminDashboard() {
  content = content.replace(
    /export default function AdminDashboard\(\) \{/,
    `export default function AdminDashboard() {
  const { data: salesSemantic } = useAdminQuery('/api/admin/semantic/sales');
  const { data: inventorySemantic } = useAdminQuery('/api/admin/semantic/inventory');`
  );

  // Now replace the Sales tab content
  content = content.replace(
    /<TabsContent value="sales" className="flex flex-col gap-6 mt-0">[\s\S]*?<\/TabsContent>/,
    `<TabsContent value="sales" className="flex flex-col gap-6 mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard>
              <Card className="h-full">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">30-Day Sales</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesSemantic ? formatIndianCurrency(salesSemantic.overview?.total_sales) : '...'}</div>
                  <div className="text-sm text-muted-foreground">{salesSemantic?.overview?.total_orders} Orders</div>
                </CardContent>
              </Card>
            </StatCard>
            <Card className="sm:col-span-1 lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Top Salespeople (30 Days)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {(salesSemantic?.bySalesperson || []).slice(0, 5).map((sp: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{i+1}. {sp.name}</span>
                      <span className="text-sm">{formatIndianCurrency(sp.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>30-Day Daily Sales Trend</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ sales: { label: 'Sales', color: '#2563eb' }}} className="h-64 w-full">
                <BarChart data={salesSemantic?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-sales)" radius={[2,2,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>`
  );

  // Replace Inventory tab content
  content = content.replace(
    /<TabsContent value="inventory" className="flex flex-col gap-6 mt-0">[\s\S]*?<\/TabsContent>/,
    `<TabsContent value="inventory" className="flex flex-col gap-6 mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard>
              <Card className="h-full">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventorySemantic ? formatIndianCurrency(inventorySemantic.overview?.total_value) : '...'}</div>
                  <div className="text-sm text-muted-foreground">{inventorySemantic?.overview?.total_qty?.toLocaleString()} Items</div>
                </CardContent>
              </Card>
            </StatCard>
            <Card className="sm:col-span-1 lg:col-span-2 overflow-auto max-h-64">
              <CardHeader className="pb-2 sticky top-0 bg-background"><CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock Alerts</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {(inventorySemantic?.outOfStock || []).map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-2 font-medium">{item.name}</td>
                        <td className="py-2 px-2 text-muted-foreground">{item.brand}</td>
                        <td className="py-2 pl-2 text-right text-red-600 font-bold">{item.quantity}</td>
                      </tr>
                    ))}
                    {(inventorySemantic?.outOfStock || []).length === 0 && (
                      <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">No stock-outs detected.</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Stock Value by Brand</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {(inventorySemantic?.byBrand || []).map((brand: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{brand.brand}</span>
                    <span className="text-sm">{formatIndianCurrency(brand.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>`
  );

  fs.writeFileSync(filePath, content, 'utf8');
}
