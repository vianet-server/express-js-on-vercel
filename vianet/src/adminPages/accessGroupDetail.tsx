import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentAccessGroupDetail, updateAccessGroupStock, type AccessGroupDetailData } from '@/store/slices/inventorySlice';
import { AccessGroupHeader } from './components/AccessGroupHeader';
import { AccessGroupInfoCard } from './components/AccessGroupInfoCard';
import { AccessGroupPricingCards } from './components/AccessGroupPricingCards';
import { AccessGroupPrivilegesCard } from './components/AccessGroupPrivilegesCard';
import { AccessGroupStatusCard } from './components/AccessGroupStatusCard';
import { AccessGroupComparisonTable } from './components/AccessGroupComparisonTable';
import { AccessGroupStockList } from './components/AccessGroupStockList';
import { AccessGroupStockSettings } from './components/AccessGroupStockSettings';

export function AccessGroupDetail() {
  const { sku, group } = useParams<{ sku: string; group: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const detail = useAppSelector((state) => state.inventory.currentAccessGroupDetail);
  const [loading, setLoading] = useState(true);
  const [stockConfig, setStockConfig] = useState({ maxQty: 0, allowDiscount: false, autoApprove: false, notes: '' });
  const decodedGroup = decodeURIComponent(group || '');

  useEffect(() => {
    if (!sku || !decodedGroup) { setLoading(false); return; }
    api.get(`/api/admin/inventory/sku/${sku}/access-group/${encodeURIComponent(decodedGroup)}`).then((res: AccessGroupDetailData) => {
      dispatch(setCurrentAccessGroupDetail(res));
      setStockConfig(res.stockConfig || { maxQty: res.accessGroup?.qty ?? 0, allowDiscount: false, autoApprove: false, notes: '' });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sku, decodedGroup, dispatch]);

  const handleEdit = (itemSku: string, qty: number, price: number) => {
    dispatch(updateAccessGroupStock({ sku: itemSku, qty, price }));
  };

  const handleAdd = (itemSku: string, qty: number, price: number) => {
    dispatch(updateAccessGroupStock({ sku: itemSku, qty, price }));
  };

  const handleRemove = (itemSku: string) => {
    dispatch(updateAccessGroupStock({ sku: itemSku, qty: 0, price: 0 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!detail || !detail.item || !detail.accessGroup) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-64 p-6">
        <h2 className="text-xl font-bold">Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/admin/inventory/sku')}><ArrowLeft size={14} /> Back to SKU</Button>
      </div>
    );
  }

  const { item, accessGroup: ag, privileges: privs } = detail;
  const hasAccess = ag.qty > 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <AccessGroupHeader groupName={decodedGroup} hasAccess={hasAccess} onBack={() => navigate('/admin/inventory/sku')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AccessGroupInfoCard sku={item.sku} name={item.name} brand={item.brand} status={item.status} />
          <AccessGroupPricingCards qty={ag.qty} price={ag.price} hasAccess={hasAccess} />
        </div>

        <div className="flex flex-col gap-4">
          <AccessGroupPrivilegesCard privileges={privs} />
          <AccessGroupStatusCard hasAccess={hasAccess} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Stocks Accessible to {decodedGroup}</CardTitle></CardHeader>
        <CardContent>
          <AccessGroupStockList stocks={detail.groupStocks} groupName={decodedGroup} onEdit={handleEdit} onAdd={handleAdd} onRemove={handleRemove} />
          <AccessGroupStockSettings groupName={decodedGroup} stockName={item.name} config={stockConfig} onSave={setStockConfig} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Access Groups — {item.name}</CardTitle></CardHeader>
          <CardContent>
            <AccessGroupComparisonTable
              items={item.accessGroups}
              currentGroup={decodedGroup}
              onGroupClick={(g) => navigate(`/admin/inventory/sku/${item.sku}/access-group/${encodeURIComponent(g)}`)}
            />
          </CardContent>
        </Card>
    </div>
  );
}
