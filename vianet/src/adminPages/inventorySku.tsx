import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSkuData, updateSkuItem, setAllAccessGroups, type SkuRow } from '@/store/slices/inventorySlice';

const SkuTable = lazy(() => import('./components/inventorySku').then(m => ({ default: m.SkuTable })));
const AddAccessDialog = lazy(() => import('./components/inventorySku').then(m => ({ default: m.AddAccessDialog })));
const EditDialog = lazy(() => import('./components/inventorySku').then(m => ({ default: m.EditDialog })));
const ContextMenu = lazy(() => import('./components/inventorySku').then(m => ({ default: m.ContextMenu })));
const PageHeader = lazy(() => import('./components/inventorySku').then(m => ({ default: m.PageHeader })));
const SearchBar = lazy(() => import('./components/inventorySku').then(m => ({ default: m.SearchBar })));
const GroupPills = lazy(() => import('./components/inventorySku').then(m => ({ default: m.GroupPills })));

export function InventorySku() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const skuData = useAppSelector((state) => state.inventory.skuData);
  const allAccessGroups = useAppSelector((state) => state.inventory.allAccessGroups);
  const accessGroupNames = useMemo(() => (allAccessGroups ?? []).map(g => g.name), [allAccessGroups]);
  const [search, setSearch] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [brands] = useState<string[]>([
    "AGARO", "Alphatech", "Amazfit", "Amazon", "Amazon Devise 2", "Amazon Devise ST", "Amazon Scheme", "AP Brand Not Doing", "Apple Accessories", "ASUS NEW", "Bath Lenns Set", "Batteries", "Belkin", "Binatone", "Black Zone Mobile", "Boat", "Bose", "Boult Audio", "Computer Accessories", "Computer Consumables", "Digitek", "DJI Osmo", "DURACELL", "Ekmatra", "EPOS", "EVM OLD", "Feiyutech Kica", "Fin FOC", "Fingers", "Fingers Aeging", "Fire Boltt", "Fitbit", "Fujifilm", "Fujifilm Dummy", "FUZO", "Gifting", "GO PRO", "Gripp", "Harman Kardon", "HP", "Infinity", "Infocus", "Itel Handsets", "Jabra New", "JBL", "JBL 2", "JBL Pro", "Kalpesh", "Karbonn New", "Klipsch Speaker", "KODAK", "Lava", "Lava Dummy", "Lenovo Tablets", "Luxury", "Mantra", "Maxima", "Micromax New", "MIVI", "Moto Phones", "NG Earsafe", "Nikita", "Nokia New", "NOTHING", "One Plus", "Ooge", "Other TWS and Acc", "Pebble", "Philips Mobile Phone", "Philips New", "Philips PC", "Poco", "Portronics New", "Promate", "Qubo", "Raopro", "RICO", "Samsung Micro", "Sandisk", "Saregama", "Sennheiser", "Skullkandy New", "SOff", "Sony", "Spacething", "SPIGEN", "Stuffcool New", "Sushi", "Swiss Military", "Tecno", "Tecno Dummy", "Tecno FOC", "Tucano", "Twieto", "URBN", "Villaon", "Xech", "Zebronics", "Zeb Tele", "Zeb Watches", "Zoook New"
  ]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editTarget, setEditTarget] = useState<{ sku: string; group: string; field: string; value: string | number } | null>(null);
  const [addAccess, setAddAccess] = useState<{ selectedSkus: string[]; group: string; qty: number; price: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: SkuRow } | null>(null);
  const [stockFilter, setStockFilter] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [allStocks, setAllStocks] = useState<SkuRow[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showOnlyWithAccess, setShowOnlyWithAccess] = useState(false);
  const STOCK_PAGE_SIZE = 10;

  const filteredStocks = useMemo(() =>
    allStocks.filter(s => {
      const q = stockFilter.toLowerCase();
      const name = (s.name ?? '').trim();
      const brand = (s.brand ?? '').trim();
      const nameOk = name.length > 0 && /[a-zA-Z]/.test(name);
      const brandOk = brand.length === 0 || /[a-zA-Z]/.test(brand);
      const matchSelected = !showSelectedOnly || !!addAccess?.selectedSkus.includes(s.sku);
      return nameOk && brandOk && matchSelected && (!q || s.sku.toLowerCase().includes(q) || name.toLowerCase().includes(q) || brand.toLowerCase().includes(q) || s.model?.toLowerCase().includes(q));
    }),
    [allStocks, stockFilter, showSelectedOnly, addAccess?.selectedSkus]
  );

  const pagedStocks = useMemo(() =>
    filteredStocks.slice((stockPage - 1) * STOCK_PAGE_SIZE, stockPage * STOCK_PAGE_SIZE),
    [filteredStocks, stockPage]
  );

  const stockTotalPages = Math.max(1, Math.ceil(filteredStocks.length / STOCK_PAGE_SIZE));

  const openAddAccess = (preselectSku?: string) => {
    setAddAccess({ selectedSkus: preselectSku ? [preselectSku] : [], group: '', qty: 0, price: 0 });
    setStockFilter('');
    setStockPage(1);
    // Reuse the already-loaded table data instead of re-fetching the full
    // SKU aggregation (the heaviest query in the app) every time the dialog opens.
    if (skuData && skuData.length > 0) {
      setAllStocks(skuData);
      return;
    }
    setStocksLoading(true);
    api.get<SkuRow[]>('/api/admin/inventory/sku').then(res => {
      setAllStocks(res || []);
      dispatch(setSkuData(res || []));
      setStocksLoading(false);
    }).catch(() => setStocksLoading(false));
  };

  const fetchAll = useCallback(() => {
    Promise.all([
      api.get<SkuRow[]>('/api/admin/inventory/sku').catch(() => [] as SkuRow[]),
      api.get<any>('/api/admin/inventory/control').then((r: any) => r?.accessGroups || []).catch(() => []),
    ]).then(([skus, groups]: [SkuRow[], any[]]) => {
      dispatch(setSkuData(skus));
      dispatch(setAllAccessGroups(groups ?? []));
      setSelectedGroups((groups ?? []).map((g: any) => g.name));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (skuData && skuData.length > 0) {
      setLoading(false);
    }
    fetchAll();
  }, [fetchAll]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };
  const visibleGroups = accessGroupNames.filter(g => selectedGroups.includes(g));

  const filtered = (skuData ?? []).filter(s => {
    const q = search.toLowerCase();
    const sBrand = (s.brand || '').toLowerCase();
    const brandMatch = selectedBrands.length === 0 || selectedBrands.some(b => {
      const bLower = b.toLowerCase();
      return sBrand === bLower || sBrand.startsWith(bLower + ' ') || sBrand.startsWith(bLower + '-');
    });
    if (!brandMatch) return false;
    if (q && !s.sku.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q) && !sBrand.includes(q)) return false;
    if (showOnlyWithAccess && visibleGroups.length > 0) {
      const hasAccess = visibleGroups.some(g => (s.accessGroups ?? []).some((a: any) => a.group === g && a.qty > 0));
      if (!hasAccess) return false;
    }
    return true;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    getItemKey: (index: number) => filtered[index].sku,
    overscan: 10,
  });

  const openEdit = (sku: string, group: string, field: string) => {
    const item = (skuData ?? []).find(s => s.sku === sku);
    const ag = item?.accessGroups?.find(a => a.group === group);
    setEditTarget({ sku, group, field, value: ag ? field === 'qty' ? ag.qty : field === 'price' ? ag.price : (ag.partnerSkuName || '') : 0 });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const item = (skuData ?? []).find(s => s.sku === editTarget.sku);
    const existing = item?.accessGroups?.find(a => a.group === editTarget.group);
    const qty = editTarget.field === 'qty' ? editTarget.value : (existing?.qty ?? 0);
    const price = editTarget.field === 'price' ? editTarget.value : (existing?.price ?? 0);
    const partnerSkuName = editTarget.field === 'partnerSkuName' ? editTarget.value : (existing?.partnerSkuName || '');
    try {
      await api.post(`/api/admin/inventory/sku/${editTarget.sku}/access-group/${encodeURIComponent(editTarget.group)}`, { qty, price, partnerSkuName });
      const currentAGS = (skuData ?? []).find(s => s.sku === editTarget.sku)?.accessGroups ?? [];
      const idx = currentAGS.findIndex(a => a.group === editTarget.group);
      dispatch(updateSkuItem({
        sku: editTarget.sku,
        updates: {
          accessGroups: idx >= 0
            ? currentAGS.map(a => a.group === editTarget.group ? { ...a, [editTarget.field]: editTarget.value } : a)
            : [...currentAGS, { group: editTarget.group, qty: Number(qty), price: Number(price), partnerSkuName: String(partnerSkuName) }],
        },
      }));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update stock access');
    }
    setEditTarget(null);
  };

  const saveAddAccess = async () => {
    if (!addAccess || !addAccess.group || addAccess.selectedSkus.length === 0) return;
    try {
      await Promise.all(addAccess.selectedSkus.map(sku =>
        api.post(`/api/admin/inventory/sku/${sku}/access-group/${encodeURIComponent(addAccess.group)}`, { qty: addAccess.qty, price: addAccess.price })
      ));
      for (const sku of addAccess.selectedSkus) {
        const currentAGS = (skuData ?? []).find(s => s.sku === sku)?.accessGroups ?? [];
        const idx = currentAGS.findIndex(a => a.group === addAccess.group);
        dispatch(updateSkuItem({
          sku,
          updates: {
            accessGroups: idx >= 0
              ? currentAGS.map(a => a.group === addAccess.group ? { ...a, qty: addAccess.qty, price: addAccess.price } : a)
              : [...currentAGS, { group: addAccess.group, qty: addAccess.qty, price: addAccess.price }],
          },
        }));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add stock access');
    }
    setAddAccess(null);
  };

  const handleExportTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const rows = [];
      for (const s of (skuData ?? [])) {
        for (const g of visibleGroups) {
          const ag = s.accessGroups?.find(a => a.group === g);
          rows.push({
            SKU_ID: s.sku,
            Access_Group: g,
            Partner_SKU_Name: ag?.partnerSkuName || '',
            Qty: ag?.qty || 0,
            Price: ag?.price || 0,
          });
        }
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mappings');
      XLSX.writeFile(wb, 'AccessGroup_Mappings.xlsx');
    } catch (err) {
      console.error(err);
      alert('Failed to export mappings');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json<any>(ws);

          const rowsToUpload = data.map(row => ({
            skuId: String(row.SKU_ID),
            accessGroup: String(row.Access_Group),
            partnerSkuName: row.Partner_SKU_Name ? String(row.Partner_SKU_Name) : '',
            qty: Number(row.Qty) || 0,
            price: Number(row.Price) || 0,
          }));

          const res = await api.post('/api/admin/inventory/access/upload', { rows: rowsToUpload });
          alert(res.message + (res.errors?.length ? '\\nErrors:\\n' + res.errors.join('\\n') : ''));
          const { data: skusData } = await api.get('/api/admin/inventory/sku');
          dispatch(setSkuData(Array.isArray(skusData) ? skusData : (skusData?.data ?? [])));
        } catch (err: any) {
          console.error(err);
          alert('Upload failed: ' + (err.message || 'Unknown error'));
        } finally {
          setUploading(false);
          e.target.value = '';
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      alert('Failed to process file');
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Suspense fallback={<Loader2 className="animate-spin size-8 text-muted-foreground" />}>
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        brands={brands}
        selectedBrands={selectedBrands}
        onSelectedBrandsChange={setSelectedBrands}
        brandSearch={brandSearch}
        onBrandSearchChange={setBrandSearch}
        accessGroupNames={accessGroupNames}
        selectedGroups={selectedGroups}
        onToggleGroup={toggleGroup}
        showOnlyWithAccess={showOnlyWithAccess}
        onShowOnlyWithAccessChange={setShowOnlyWithAccess}
        onExportTemplate={handleExportTemplate}
        uploading={uploading}
        onImport={handleImport}
        onAddAccess={() => openAddAccess()}
      />

      <SearchBar search={search} onSearchChange={setSearch} />

      <div ref={scrollRef} className="overflow-auto border rounded-lg max-h-[70vh]">
        <SkuTable
          filtered={filtered}
          visibleGroups={visibleGroups}
          accessGroupNames={accessGroupNames}
          mounted={mounted}
          virtualizer={virtualizer}
          onEdit={openEdit}
          onContextMenu={(e, row) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, row }); }}
          onRowClick={(sku) => navigate(`/admin/inventory/sku/${encodeURIComponent(sku)}`)}
        />
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onViewAccess={(group) => navigate(`/admin/inventory/access-group/${encodeURIComponent(group)}`)}
        onAddAccess={(sku) => openAddAccess(sku)}
        onEdit={(sku) => openEdit(sku, visibleGroups[0] || accessGroupNames[0], 'qty')}
        visibleGroups={visibleGroups}
        accessGroupNames={accessGroupNames}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} SKUs
        </p>
      </div>

      <EditDialog
        editTarget={editTarget}
        onEditTargetChange={setEditTarget}
        onSave={saveEdit}
      />

      <AddAccessDialog
        addAccess={addAccess}
        onAddAccessChange={setAddAccess}
        onClose={() => setAddAccess(null)}
        onSave={saveAddAccess}
        accessGroupNames={accessGroupNames}
        filteredStocks={filteredStocks}
        pagedStocks={pagedStocks}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        stockPage={stockPage}
        onStockPageChange={setStockPage}
        stockTotalPages={stockTotalPages}
        showSelectedOnly={showSelectedOnly}
        onShowSelectedOnlyChange={setShowSelectedOnly}
        stocksLoading={stocksLoading}
      />

      <GroupPills visibleGroups={visibleGroups} />
    </div>
    </Suspense>
  );
}