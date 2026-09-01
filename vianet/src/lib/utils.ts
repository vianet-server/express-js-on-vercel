import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIndianCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '₹0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0';
  
  const absNum = Math.abs(num);
  let formatted = '';
  
  if (absNum >= 10000000) {
    formatted = `₹${(absNum / 10000000).toFixed(2)} Cr`;
  } else if (absNum >= 100000) {
    formatted = `₹${(absNum / 100000).toFixed(2)} L`;
  } else if (absNum >= 1000) {
    formatted = `₹${(absNum / 1000).toFixed(2)} K`;
  } else {
    formatted = `₹${absNum.toLocaleString('en-IN')}`;
  }
  
  return num < 0 ? `-${formatted}` : formatted;
}
