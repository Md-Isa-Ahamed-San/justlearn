'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from './site-footer';

// List of routes or route patterns where the footer should be hidden
const HIDE_FOOTER_PATHS = [
  '/account',
  "/admin-dashboard",
  "/courses"
];

export function FooterController() {
  const pathname = usePathname();

  // Check if pathname starts with any of the hide paths
  const hideFooter = HIDE_FOOTER_PATHS.some(path =>
    pathname.startsWith(path)
  );

  return !hideFooter ? <SiteFooter /> : null;
}
