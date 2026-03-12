import Link from 'next/link';

export function SideNav({ items }: { items: Array<{ href: string; label: string }> }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="block rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-white">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
