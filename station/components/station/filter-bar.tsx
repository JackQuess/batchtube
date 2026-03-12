'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function FilterBar({
  queryPlaceholder = 'Search...',
  queryValue,
  queryKey = 'q',
  selects = []
}: {
  queryPlaceholder?: string;
  queryValue?: string;
  queryKey?: string;
  selects?: Array<{ key: string; value: string; options: Array<{ label: string; value: string }> }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(3,220px)]">
      <Input
        placeholder={queryPlaceholder}
        defaultValue={queryValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter') update(queryKey, (e.target as HTMLInputElement).value);
        }}
      />
      {selects.map((select) => (
        <Select key={select.key} value={select.value} onValueChange={(v) => update(select.key, v)}>
          <SelectTrigger>
            <SelectValue placeholder={select.key} />
          </SelectTrigger>
          <SelectContent>
            {select.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
