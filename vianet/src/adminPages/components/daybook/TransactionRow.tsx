import { formatIndianCurrency } from '@/lib/utils';
import { ChevronDown, ChevronRight, FileText, BookOpen, PackageOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const typeColors: Record<string, string> = {
  Sale: 'bg-green-100 text-green-700',
  Payment: 'bg-blue-100 text-blue-700',
  Expense: 'bg-red-100 text-red-700',
  Purchase: 'bg-purple-100 text-purple-700',
  Other: 'bg-gray-100 text-gray-700',
};

function fmtDate(d: string) {
  if (!d) return '';
  const parts = d.split('T')[0].split('-');
  if (parts.length !== 3) return d;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

interface TransactionRowProps {
  transaction: any;
  isOpen: boolean;
  onToggle: () => void;
}

export function TransactionRow({ transaction, isOpen, onToggle }: TransactionRowProps) {
  const t = transaction;
  const hasInventory = (t.inventoryEntries ?? []).length > 0;
  const hasLedger = (t.ledgerEntries ?? []).length > 0;
  const hasNarration = t.narration && t.narration !== t.customer;
  const hasDetail = hasInventory || hasLedger || hasNarration;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted/30 cursor-pointer">
        <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left min-w-0">
          {hasDetail ? (
            isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span className="text-xs text-muted-foreground w-20 shrink-0">{fmtDate(t.date)}</span>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${typeColors[t.type] || ''}`}>{t.type}</span>
          <span className="text-xs font-mono text-muted-foreground shrink-0">{t.ref}</span>
          <span className="text-sm font-medium truncate min-w-0">{t.customer}</span>
        </CollapsibleTrigger>
        <div className="flex items-center gap-4 shrink-0">
          {t.salesman ? <span className="text-xs text-muted-foreground hidden sm:inline">{t.salesman}</span> : null}
          <span className="text-sm font-medium tabular-nums">{formatIndianCurrency(t.amount ?? 0)}</span>
        </div>
      </div>
      {hasDetail && (
        <CollapsibleContent>
          <div className="ml-10 pl-4 border-l-2 border-muted space-y-4 py-3">
            {hasNarration && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText size={14} className="mt-0.5 shrink-0" />
                <span>{t.narration}</span>
              </div>
            )}

            {hasLedger && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                  <BookOpen size={13} /> Ledger Entries
                </div>
                <div className="flex flex-col gap-1.5">
                  {(t.ledgerEntries ?? []).map((s: any, i: number) => {
                    const amt = parseFloat(s.amount) || 0;
                    const isDr = s.isDeemedPositive === 'Yes';
                    const hasDesc = s.description && s.description !== s.ledgerName;
                    return (
                      <div key={i} className={`rounded border px-3 py-2 ${isDr ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{s.ledgerName}</span>
                          <span className={`font-semibold tabular-nums ${isDr ? 'text-red-600' : 'text-green-600'}`}>
                            {isDr ? 'Dr' : 'Cr'} {formatIndianCurrency(amt)}
                          </span>
                        </div>
                        {hasDesc && <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hasInventory && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                  <PackageOpen size={13} /> Inventory Entries
                </div>
                <div className="flex flex-col gap-1.5">
                  {(t.inventoryEntries ?? []).map((s: any, i: number) => {
                    const qty = parseFloat(s.qty) || 0;
                    const rate = parseFloat(s.rate) || 0;
                    const amt = parseFloat(s.amount) || 0;
                    let serials: string[] = [];
                    try {
                      const p = typeof s.serialNo === 'string' ? JSON.parse(s.serialNo) : s.serialNo;
                      if (Array.isArray(p)) serials = p;
                    } catch {}
                    return (
                      <div key={i} className="rounded border px-3 py-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{s.item}</span>
                          <span className="font-semibold tabular-nums">{formatIndianCurrency(amt)}</span>
                        </div>
                        <div className="flex gap-4 mt-1 text-[11px] text-muted-foreground">
                          <span>Qty: <b>{qty > 0 ? qty.toLocaleString() : '-'}</b>{s.unit ? ` ${s.unit}` : ''}</span>
                          <span>Rate: <b>{formatIndianCurrency(rate)}</b></span>
                        </div>
                        {s.description ? (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>
                        ) : null}
                        {serials.length > 0 ? (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Serial: {serials.join(', ')}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
