import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { UserNav } from '@/components/dashboard/user-nav';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SaasPulseFeedback } from '@amedinat/saas-pulse-sdk';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile if needed, but for now just use auth user meta
  const userData = {
    name: user.user_metadata?.full_name || user.email?.split('@')[0],
    email: user.email,
    image: user.user_metadata?.avatar_url,
  };

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="">LLMeter</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <SidebarNav />
          </nav>
        </div>
        <div className="mt-auto px-4 pb-3">
          <span className="text-[10px] text-muted-foreground/40 select-none">
            {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev'}
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col sm:gap-4 sm:pl-64 min-w-0 w-full">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <MobileNav />
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <UserNav user={userData} />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:px-6 sm:py-0 w-full min-w-0 mx-auto max-w-7xl">
          {children}
        </main>
      </div>

      <SaasPulseFeedback userRef={userData.email} />
    </div>
  );
}
