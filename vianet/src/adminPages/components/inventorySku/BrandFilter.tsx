import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BrandFilterProps {
  brands: string[];
  selectedBrands: string[];
  onSelectedBrandsChange: (brands: string[]) => void;
  brandSearch: string;
  onBrandSearchChange: (v: string) => void;
}

export function BrandFilter({ brands, selectedBrands, onSelectedBrandsChange, brandSearch, onBrandSearchChange }: BrandFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Brand:</span>
      <Popover>
        <PopoverTrigger className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 cursor-pointer min-w-[150px] max-w-[220px]">
          <span className="truncate">{selectedBrands.length === 0 ? 'All Brands' : selectedBrands.length === 1 ? selectedBrands[0] : `${selectedBrands.length} brands`}</span>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 max-h-[60vh] flex flex-col" align="start">
          <div className="px-1 pb-2 border-b mb-2 sticky top-0 bg-background z-10">
            <Input
              placeholder="Search brands..."
              className="h-8 text-sm"
              value={brandSearch}
              onChange={e => onBrandSearchChange(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
            />
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
            <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm font-medium">
              <Checkbox checked={selectedBrands.length === 0} onCheckedChange={() => onSelectedBrandsChange([])} />All Brands
            </label>
            <div className="border-t my-1" />
            {brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).map(b => (
              <label key={b} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm font-medium">
                <Checkbox
                  checked={selectedBrands.includes(b)}
                  onCheckedChange={(c) => {
                    onSelectedBrandsChange(c ? [...selectedBrands, b] : selectedBrands.filter(x => x !== b));
                  }}
                />
                {b}
              </label>
            ))}
            {brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">No brands found</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
