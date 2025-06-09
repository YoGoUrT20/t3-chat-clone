import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function sortModelsByFamily(models) {
  return [...models].sort((a, b) => {
    if (a.family < b.family) return -1;
    if (a.family > b.family) return 1;
    return 0;
  });
} 