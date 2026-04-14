'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, CreditCard, BarChart2, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',          icon: Home,       label: 'Home'     },
  { href: '/search',    icon: Search,     label: 'Search'   },
  { href: '/wallet',    icon: CreditCard, label: 'Wallet'   },
  { href: '/insights',  icon: BarChart2,  label: 'Insights' },
  { href: '/settings',  icon: Settings,   label: 'Settings' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-sm border-t border-gray-100 z-40">
      <div className="flex justify-around items-center h-16 px-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8}/>
              <span className={`text-[9px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
