import { LayoutDashboard, Link2, Bell, Lightbulb, Users, BookOpen, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Providers',
    href: '/providers',
    icon: Link2,
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Alerts',
    href: '/alerts',
    icon: Bell,
  },
  {
    title: 'Optimization',
    href: '/optimization',
    icon: Lightbulb,
  },
  {
    title: 'Docs',
    href: '/docs',
    icon: BookOpen,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
