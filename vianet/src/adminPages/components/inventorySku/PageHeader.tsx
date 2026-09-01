import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, Edit3, Loader2 } from 'lucide-react';
import { BrandFilter } from './BrandFilter';

interface AccessGroupPopoverProps {
  accessGroupNames: string[];
  selectedGroups: string[];
  onToggleGroup: (group: string) => void;
  showOnlyWithAccess: boolean;
  onShowOnlyWithAccessChange: (v: boolean) => void;
}

function AccessGroupPopover({ accessGroupNames, selectedGroups, onToggleGroup, showOnlyWithAccess, onShowOnlyWithAccessChange }: AccessGroupPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer">
        <Users size={14} /> Select Access-Group
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="flex flex-col gap-1">
          {accessGroupNames.map(g => (
            <label key={g} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
              <Checkbox checked={selectedGroups.includes(g)} onCheckedChange={() => onToggleGroup(g)} />{g}
            </label>
          ))}
        </div>
        <div className="border-t mt-2 pt-2">
          <label className="flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer">
            <span className="text-muted-foreground">Only with access</span>
            <Switch checked={showOnlyWithAccess} onCheckedChange={onShowOnlyWithAccessChange} />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ImportButtonProps {
  uploading: boolean;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ImportButton({ uploading, onImport }: ImportButtonProps) {
  return (
    <div className="relative inline-block">
      <input type="file" id="file-upload" className="hidden" accept=".xlsx,.csv" onChange={onImport} />
      <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()} className="gap-1 px-3" disabled={uploading} title="Import Excel mapping">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={14} />} Import Map
      </Button>
    </div>
  );
}

interface PageHeaderProps {
  brands: string[];
  selectedBrands: string[];
  onSelectedBrandsChange: (brands: string[]) => void;
  brandSearch: string;
  onBrandSearchChange: (v: string) => void;
  accessGroupNames: string[];
  selectedGroups: string[];
  onToggleGroup: (group: string) => void;
  showOnlyWithAccess: boolean;
  onShowOnlyWithAccessChange: (v: boolean) => void;
  onExportTemplate: () => void;
  uploading: boolean;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddAccess: () => void;
}

export function PageHeader({
  brands, selectedBrands, onSelectedBrandsChange, brandSearch, onBrandSearchChange,
  accessGroupNames, selectedGroups, onToggleGroup, showOnlyWithAccess, onShowOnlyWithAccessChange,
  onExportTemplate, uploading, onImport, onAddAccess,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Inventory SKU</h1>
      <div className="flex items-center gap-2">
        <BrandFilter
          brands={brands}
          selectedBrands={selectedBrands}
          onSelectedBrandsChange={onSelectedBrandsChange}
          brandSearch={brandSearch}
          onBrandSearchChange={onBrandSearchChange}
        />
        <AccessGroupPopover
          accessGroupNames={accessGroupNames}
          selectedGroups={selectedGroups}
          onToggleGroup={onToggleGroup}
          showOnlyWithAccess={showOnlyWithAccess}
          onShowOnlyWithAccessChange={onShowOnlyWithAccessChange}
        />
        <Button variant="outline" size="sm" onClick={onExportTemplate} className="gap-1 px-3" title="Export current view to Excel">
          <Edit3 size={14} /> Export Map
        </Button>
        <ImportButton uploading={uploading} onImport={onImport} />
        <Button variant="secondary" onClick={onAddAccess}><Users size={14} /> Add Access</Button>
        <Button><Plus size={14} /> Add SKU</Button>
      </div>
    </div>
  );
}