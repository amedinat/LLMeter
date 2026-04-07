'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { navItems } from '@/components/dashboard/nav-items';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-6">
          <SheetTitle className="text-left">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
              onClick={() => setOpen(false)}
            >
              <span className="text-cyan-400">LLMeter</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="grid items-start gap-2 px-4 py-2 text-sm font-medium">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={index}
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  'justify-start',
                  pathname === item.href && 'bg-muted font-medium text-primary'
                )}
                asChild
              >
                <Link href={item.href} onClick={() => setOpen(false)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
