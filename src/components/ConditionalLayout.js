'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider } from "@humanresource/components/ui/sidebar";
import { AppSidebar } from "@humanresource/components/AppSidebar";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const publicRoutes = ['/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    // Don't show sidebar on login/signup pages
    return <>{children}</>;
  }

  // Show sidebar on all other pages
  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}

