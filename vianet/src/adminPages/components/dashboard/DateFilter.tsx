import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

export interface DateFilterProps {
  activePeriod: string;
  setActivePeriod: (period: string) => void;
  showDateRange: boolean;
  setShowDateRange: (show: boolean) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  handleCustomApply: () => void;
}

export function DateFilter({ activePeriod, setActivePeriod, showDateRange, setShowDateRange, dateFrom, setDateFrom, dateTo, setDateTo, handleCustomApply }: DateFilterProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
          <Calendar size={14} /> {activePeriod}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuItem onClick={() => setActivePeriod('Today')}>Today</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActivePeriod('Yesterday')}>Yesterday</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActivePeriod('This Month')}>This Month</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDateRange(true)}>Specific Period</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDateRange} onOpenChange={setShowDateRange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Select Date Range</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDateRange(false)}>Cancel</Button>
            <Button onClick={handleCustomApply} disabled={!dateFrom || !dateTo}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}