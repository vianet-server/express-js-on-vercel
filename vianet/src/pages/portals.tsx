import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, Package, Handshake, Boxes, Settings, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface StockItem {
  id: number
  name: string
  sku: string
  description: string
  quantity: number
  price: number
}

export function AppStocks() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [noAccess, setNoAccess] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    api.get<{ data: StockItem[]; noAccess?: boolean; message?: string }>('/api/tally/stock-item')
      .then(res => {
        if (!active) return
        if (res.noAccess) {
          setNoAccess(true)
          setItems([])
        } else {
          setNoAccess(false)
          setItems(res.data ?? [])
        }
      })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q)
    )
  }, [items, search])

  const totalValue = useMemo(() =>
    items.reduce((s, i) => s + i.quantity * i.price, 0), [items])

  if (noAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-16">
        <AlertCircle className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Stock Access</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Your account does not have access to any stock items. Please contact the team to request access.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stocks</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">{items.length}</span> items · ₹{totalValue.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <Input
              placeholder="Search name or sku..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-0 p-0 h-auto text-sm focus-visible:ring-0 w-48"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={16} /> Stock Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">SKU</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(i => (
                    <tr key={i.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 font-medium">{i.name}</td>
                      <td className="py-3 text-muted-foreground font-mono text-xs">{i.sku}</td>
                      <td className="py-3 text-muted-foreground max-w-xs truncate">{i.description}</td>
                      <td className="py-3 text-right">₹{i.price.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        {i.quantity === 0 ? (
                          <Badge variant="destructive">0</Badge>
                        ) : (
                          <span className="font-medium">{i.quantity}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No stock items found.</td></tr>
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

export function AppDeals() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake size={16} /> Active Deals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No deals available at the moment.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function AppInventory() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes size={16} /> Inventory Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No inventory data available.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function AppSetting() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Setting</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={16} /> Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Settings page coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Employ portal pages - Basic group
export function EmployHome() {
  return <Placeholder title="Employ Home" />
}

export function EmployDashboard() {
  return <Placeholder title="Dashboard" />
}

export function EmployNotification() {
  return <Placeholder title="Notification" />
}

// Employ portal pages - Tally group
export function EmployTallyStock() {
  return <Placeholder title="Tally Stock" />
}

export function EmployTallyLedger() {
  return <Placeholder title="Tally Ledger" />
}

export function EmployTallyVoucher() {
  return <Placeholder title="Tally Voucher" />
}

export function EmployTallyGodown() {
  return <Placeholder title="Tally Godown" />
}

// Employ portal pages - Social Media group
export function EmploySocialHome() {
  return <Placeholder title="Social Media Home" />
}

export function EmploySocialAnalytics() {
  return <Placeholder title="Social Media Analytics" />
}

export function EmploySocialUpload() {
  return <Placeholder title="Upload (Interaction & Comments)" />
}

// Employ portal pages - Setting
export function EmploySetting() {
  return <Placeholder title="Setting" />
}