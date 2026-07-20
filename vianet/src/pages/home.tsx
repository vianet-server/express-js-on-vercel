import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

interface Product {
  id: number
  name: string
  qty: number
  price: number
}

export function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [noAccess, setNoAccess] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get<{ data: any[]; noAccess?: boolean }>('/api/stock/stock-item')
      .then((res) => {
        if (!active) return
        if (res.noAccess) {
          setNoAccess(true)
          setProducts([])
        } else {
          setNoAccess(false)
          setProducts((res.data ?? []).map((r: any) => ({
            id: r.id, name: r.name, qty: r.quantity || r.qty || 0, price: r.price || 0,
          })))
        }
      })
      .catch(() => {
        if (active) setProducts([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const stats = useMemo(() => {
    const totalProducts = products.length
    const totalQty = products.reduce((s, p) => s + p.qty, 0)
    const totalValue = products.reduce((s, p) => s + p.qty * p.price, 0)
    const outOfStock = products.filter((p) => p.qty === 0).length
    return { totalProducts, totalQty, totalValue, outOfStock }
  }, [products])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    )
  }

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
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold">{stats.totalProducts}</span> products · ₹{stats.totalValue.toLocaleString()}
      </p>
    </div>
  )
}
