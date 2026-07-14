import { useEffect, useMemo, useState } from 'react'
import { Package, IndianRupee, AlertTriangle, Boxes, Download, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface Product {
  id: number
  name: string
  brand: string
  model: string
  variant: string
  gst: number
  price: number
  qty: number
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Smartphone X1', brand: 'NovaTech', model: 'X1-Pro', variant: '128GB', gst: 18, price: 18999, qty: 42 },
  { id: 2, name: 'Wireless Earbuds', brand: 'SoundZ', model: 'Buds-2', variant: 'Black', gst: 12, price: 2499, qty: 120 },
  { id: 3, name: 'Laptop Pro 15', brand: 'CoreMax', model: 'CM15', variant: '16GB/512GB', gst: 18, price: 74999, qty: 8 },
  { id: 4, name: 'Smart Watch', brand: 'Pulse', model: 'P3', variant: 'Midnight', gst: 12, price: 3999, qty: 0 },
  { id: 5, name: 'Bluetooth Speaker', brand: 'BoomBox', model: 'BB-10', variant: 'Red', gst: 12, price: 1799, qty: 65 },
  { id: 6, name: '4K Action Cam', brand: 'VisionX', model: 'AC4', variant: 'Adventure Kit', gst: 18, price: 12999, qty: 23 },
  { id: 7, name: 'Mechanical Keyboard', brand: 'KeyForge', model: 'KF-TKL', variant: 'Brown Switch', gst: 18, price: 3499, qty: 54 },
  { id: 8, name: 'Gaming Mouse', brand: 'KeyForge', model: 'GM-7', variant: 'RGB', gst: 18, price: 1499, qty: 0 },
]

export function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    api
      .get<{ data: any[] }>('/api/tally/stock-item')
      .then((res) => {
        if (active) setProducts((res.data ?? []).map((r: any) => ({
          id: r.id, name: r.name, brand: r.brand || '', model: r.model || '',
          variant: r.variant || '', gst: r.gst || 0, price: r.price || 0, qty: r.quantity || r.qty || 0,
        })))
      })
      .catch(() => {
        if (active) setProducts(MOCK_PRODUCTS)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.variant.toLowerCase().includes(q),
    )
  }, [products, search])

  const stats = useMemo(() => {
    const totalProducts = products.length
    const totalQty = products.reduce((s, p) => s + p.qty, 0)
    const totalValue = products.reduce((s, p) => s + p.qty * p.price, 0)
    const outOfStock = products.filter((p) => p.qty === 0).length
    return { totalProducts, totalQty, totalValue, outOfStock }
  }, [products])

  const exportExcel = () => {
    const headers = ['Name', 'Brand', 'Model', 'Variant', 'GST %', 'Price', 'Quantity']
    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`
    const rows = filtered.map((p) => [p.name, p.brand, p.model, p.variant, p.gst, p.price, p.qty])
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory-export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of products available in inventory</p>
        </div>
        <Button onClick={exportExcel} className="gap-2 self-start sm:self-auto" disabled={loading || filtered.length === 0}>
          <Download size={16} />
          Export Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity</CardTitle>
            <Boxes className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQty.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
            <IndianRupee className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Products in Inventory</CardTitle>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <Input
              placeholder="Search name, brand, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 p-0 h-auto text-sm focus-visible:ring-0 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin size-8 text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Brand</th>
                    <th className="pb-3 font-medium">Model</th>
                    <th className="pb-3 font-medium">Variant</th>
                    <th className="pb-3 font-medium text-right">GST %</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 text-muted-foreground">{p.brand}</td>
                      <td className="py-3">{p.model}</td>
                      <td className="py-3">{p.variant}</td>
                      <td className="py-3 text-right">{p.gst}%</td>
                      <td className="py-3 text-right">₹{p.price.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        {p.qty === 0 ? (
                          <Badge variant="destructive">0</Badge>
                        ) : (
                          <span className="font-medium">{p.qty}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}