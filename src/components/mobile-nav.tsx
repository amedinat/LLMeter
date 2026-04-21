'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#features', label: 'Features' },
  { href: '/models', label: 'Model Pricing' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader>
          <SheetTitle className="text-cyan-400 font-bold">LLMeter</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 px-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <hr className="my-2" />
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-white" asChild>
            <Link href="/login" onClick={() => setOpen(false)}>Start Free</Link>
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
