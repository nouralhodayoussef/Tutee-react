'use client';

import Footer from "./Footer"; // adjust path if needed
import { usePathname } from "next/navigation";

export default function FooterWrapper() {
  const pathname = usePathname();

  // List all paths or prefixes where you do NOT want the footer
  const noFooterRoutes = [
    "/login",
    "/register",
    "/session",
    "/setup",
    "/admin",
  ];

  // Hide footer if path is exact or starts with these
  const hideFooter = noFooterRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (hideFooter) return null;
  return <Footer />;
}
