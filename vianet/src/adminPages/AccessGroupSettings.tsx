import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Settings, Package, Hash, DollarSign, BarChart3, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export function AccessGroupSettings() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name || '');

  const [groupInfo, setGroupInfo] = useState<{ id: number; name: string; created_at: string } | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceMode, setPriceMode] = useState('default');
  const [priceAdd, setPriceAdd] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [deletingBrand, setDeletingBrand] = useState<string | null>(null);
  const [assignMsg, setAssignMsg] = useState('');
  const [assignErr, setAssignErr] = useState('');

  const fetchData = async () => {
    if (!decodedName) return;
    try {
      const res: any = await api.get(`/api/admin/inventory/access-group/${encodeURIComponent(decodedName)}`);
      setGroupInfo(res.group);
      setItems(res.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedName]);

  const openAssign = async () => {
    setAssignMsg('');
    setAssignErr('');
    setSelectedBrand('');
    setPriceMode('default');
    setPriceAdd('');
    setAssignOpen(true);
    setBrandsLoading(true);
    try {
      const res: any = await api.get('/api/admin/inventory/brands');
      setAllBrands(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setAssignErr(err instanceof Error ? err.message : 'Failed to load brands');
    } finally {
      setBrandsLoading(false);
    }
  };

  const submitAssign = async () => {
    if (!selectedBrand) return;
    setAssigning(true);
    setAssignErr('');
    try {
      const res: any = await api.post(
        `/api/admin/inventory/access-group/${encodeURIComponent(decodedName)}/assign-brand`,
        { brand: selectedBrand, priceMode, priceAdd: Number(priceAdd) || 0 }
      );
      setAssignMsg(res.message || `Assigned ${res.assigned ?? 0} stock(s).`);
      setAssignOpen(false);
      await fetchData();
    } catch (err) {
      setAssignErr(err instanceof Error ? err.message : 'Failed to assign brand');
    } finally {
      setAssigning(false);
    }
  };

  const deleteBrand = async (brand: string) => {
    if (!confirm(`Remove all "${brand}" stocks from "${decodedName}"? This deletes the access-group mappings (inventory itself is untouched). Click OK to delete.`)) return;
    setDeletingBrand(brand);
    try {
      const res: any = await api.delete(
        `/api/admin/inventory/access-group/${encodeURIComponent(decodedName)}/brand/${encodeURIComponent(brand)}`
      );
      setAssignMsg(res.message || `Removed brand "${brand}".`);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove brand');
    } finally {
      setDeletingBrand(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-64 p-6">
        <h2 className="text-xl font-bold">Access Group Not Found</h2>
        {error && <p className="text-sm text-destructive max-w-md text-center">{error}</p>}
        <Button variant="outline" onClick={() => navigate('/admin/inventory/control')}>
          <ArrowLeft size={14} /> Back
        </Button>
      </div>
    );
  }

  const totalQty = items.reduce((s: number, i: any) => s + (Number(i.qty) || 0), 0);
  const totalValue = items.reduce((s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const brands = [...new Set(items.map((i: any) => i.brand).filter(Boolean))];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/admin/inventory/access-group/${encodeURIComponent(decodedName)}`)}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex items-center gap-3">
          <Settings size={24} className="text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">{decodedName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Access Group Settings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Stocks</p>
              <p className="text-xl font-bold">{items.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Hash size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Quantity</p>
              <p className="text-xl font-bold">{totalQty}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-xl font-bold">{totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Brands</p>
              <p className="text-xl font-bold">{brands.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Group Name</span>
            <span className="font-medium">{groupInfo.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Group ID</span>
            <span className="font-medium">{groupInfo.id}</span>
          </div>
          {groupInfo.created_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{new Date(groupInfo.created_at).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Stocks</span>
            <span className="font-medium">{items.length}</span>
          </div>
        </CardContent>
      </Card>

      {assignMsg && (
        <div className="rounded-md border px-4 py-3 text-sm">{assignMsg}</div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assigned Brands</CardTitle>
          <Button size="sm" onClick={openAssign}>
            <Plus size={14} /> Assign New Brand
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {brands.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No brands assigned.</div>
          ) : (
            <div className="divide-y">
              {brands.map((brand) => {
                const brandItems = items.filter((i: any) => i.brand === brand);
                const brandQty = brandItems.reduce((s: number, i: any) => s + (Number(i.qty) || 0), 0);
                const brandValue = brandItems.reduce((s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
                return (
                  <div key={brand} className="flex items-center justify-between px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{brand}</span>
                      <span className="text-xs text-muted-foreground">{brandItems.length} stock{brandItems.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>Qty: {brandQty}</span>
                      <span>Value: {brandValue.toLocaleString()}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        title={`Remove ${brand} from this group`}
                        onClick={() => deleteBrand(brand)}
                        disabled={deletingBrand === brand}
                      >
                        {deletingBrand === brand
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Stocks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name || item.stockname}</span>
                    <span className="text-xs text-muted-foreground">{item.brand} {item.model}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>Qty: {item.qty}</span>
                    <span>Price: {item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="self-start" onClick={() => navigate(`/admin/inventory/access-group/${encodeURIComponent(decodedName)}`)}>
        <ArrowLeft size={14} /> Back to Stocks
      </Button>

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !assigning && setAssignOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Assign New Brand</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every stock in inventory with this brand will be added to “{decodedName}”.
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium">Brand</label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                disabled={brandsLoading || assigning}
              >
                <option value="">{brandsLoading ? 'Loading brands…' : 'Select a brand'}</option>
                {allBrands.filter((b) => !brands.includes(b)).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {assignErr && <p className="mt-2 text-sm text-destructive">{assignErr}</p>}
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium">Price</label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={priceMode}
                onChange={(e) => setPriceMode(e.target.value)}
                disabled={assigning}
              >
                <option value="default">Default price (from inventory table)</option>
                <option value="zero">Zero</option>
                <option value="addition">Default + addition</option>
              </select>
              {priceMode === 'addition' && (
                <div className="mt-2">
                  <label className="text-sm font-medium">Addition amount</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="0"
                    value={priceAdd}
                    onChange={(e) => setPriceAdd(e.target.value)}
                    disabled={assigning}
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={assigning}>
                Cancel
              </Button>
              <Button onClick={submitAssign} disabled={!selectedBrand || assigning}>
                {assigning ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {assigning ? 'Assigning…' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
